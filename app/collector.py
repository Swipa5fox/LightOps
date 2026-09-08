from __future__ import annotations

import logging
import re
import subprocess
from pathlib import Path
from typing import Any

import psutil

from . import db
from .settings import settings


logger = logging.getLogger("lightops.collector")
_consecutive: dict[str, int] = {}
# systemctl/sudo must run against the server's own binaries, never a
# cross-compiled venv PATH; LANG=C keeps subprocess output byte-stable.
_RUN_ENV = {"PATH": "/usr/sbin:/usr/bin:/sbin:/bin", "LANG": "C"}

_BUCKET_PATTERN = re.compile(r"(?:s3|cos|oss|gs)://[A-Za-z0-9._\-]+")
_UNIT_FILE_CANDIDATES = (
    "/etc/systemd/system/{service}.service",
    "/usr/lib/systemd/system/{service}.service",
    "/lib/systemd/system/{service}.service",
)
_ENV_FILE_PATTERN = re.compile(r"^\s*EnvironmentFile\s*=\s*(\S+)", re.MULTILINE)


def _systemctl(*args: str, timeout: int = 10) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [settings.systemctl_path, *args],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=timeout,
        check=False,
        env=_RUN_ENV,
    )


def _read_text(path: str) -> str:
    try:
        return Path(path).read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def _detect_buckets(service: str) -> list[str]:
    """Find bucket URLs in a service's systemd unit file.

    Reads the unit definition and any EnvironmentFile referenced by it, then
    extracts the first occurrence of each scheme://bucket style URL. Returns
    an empty list when nothing matches or the unit file is unreadable.
    """
    unit_content = ""
    for template in _UNIT_FILE_CANDIDATES:
        path = template.format(service=service)
        content = _read_text(path)
        if content:
            unit_content = content
            break
    if not unit_content:
        return []

    text = unit_content
    for match in _ENV_FILE_PATTERN.finditer(unit_content):
        env_path = match.group(1).strip().strip('"').strip("'")
        if env_path.startswith("-"):
            env_path = env_path[1:]
        if not env_path.startswith("/"):
            continue
        text += "\n" + _read_text(env_path)

# Preserve first-seen order while deduplicating.
    return list(dict.fromkeys(_BUCKET_PATTERN.findall(text)))


# 自动发现要剔除的 systemd 内部/一次性 unit，否则面板会被 dbus、getty 之流淹没。
_DISCOVER_NOISE = (
    "systemd-",
    "dbus",
    "dracut-",
    "kmod-",
    "initrd-",
    "user@",
    "user-runtime-dir@",
    "getty@",
    "serial-getty@",
    "autovt@",
    "container-getty@",
    "debug-shell",
    "rescue",
    "emergency",
    "system-update-",
    "lvm2-",
    "system-setup-",
)


def _systemctl_lines(*args: str, timeout: int = 10) -> list[str]:
    result = _systemctl(*args, timeout=timeout)
    return [line for line in result.stdout.splitlines() if line.strip()]


def _loaded_units() -> dict[str, dict[str, str]]:
    """unit 名 -> 运行时状态，来自 `list-units --all`（含已加载但未启动的）。"""
    states: dict[str, dict[str, str]] = {}
    for line in _systemctl_lines(
        "list-units", "--type=service", "--all", "--plain", "--no-legend", "--no-pager"
    ):
        parts = line.split(None, 4)
        if len(parts) < 4:
            continue
        unit = parts[0]
        if not unit.endswith(".service"):
            continue
        states[unit[: -len(".service")]] = {
            "load": parts[1],
            "active": parts[2],
            "sub": parts[3],
        }
    return states


def _enabled_units() -> set[str]:
    """`list-unit-files` 里开机自启的服务名（unit 被卸载后自然消失）。"""
    names: set[str] = set()
    for line in _systemctl_lines(
        "list-unit-files", "--type=service", "--plain", "--no-legend", "--no-pager"
    ):
        parts = line.split(None, 2)
        if len(parts) < 2:
            continue
        unit, state = parts[0], parts[1]
        if not unit.endswith(".service") or not state.startswith("enabled"):
            continue
        names.add(unit[: -len(".service")])
    return names


def _is_noise(name: str) -> bool:
    return name.startswith(_DISCOVER_NOISE)


def discovered_services() -> list[str]:
    """本机真实存在的受管服务 = 扫描结果 ∪ LIGHTOPS_SERVICES。

    配置清单里的名字永远排在前面，卸载掉的会被 service_states 标记成
    not-found 而不是"挂了"，前端据此隐藏。
    """
    try:
        loaded = _loaded_units()
        enabled = _enabled_units()
    except (OSError, subprocess.SubprocessError) as exc:
        logger.warning("service discovery failed: %s", exc)
        return list(settings.services)

    found: set[str] = set()
    for name, info in loaded.items():
        if info.get("active") == "active" and not _is_noise(name):
            found.add(name)
    found.update(name for name in enabled if not _is_noise(name))
    found.difference_update(settings.services)
    return [*settings.services, *sorted(found)]


def _unit_state(service: str) -> tuple[str, str, str]:
    """(LoadState, ActiveState, Type)；unit 不存在时 LoadState 为 not-found。"""
    unit = service if service.endswith(".service") else f"{service}.service"
    try:
        # 不要用 --value：属性按字母序输出（ActiveState 会排在 LoadState 前），
        # 靠位置取值必然错位。默认 Key=Value 输出才稳定。
        result = _systemctl(
            "show",
            unit,
            "-p",
            "LoadState",
            "-p",
            "ActiveState",
            "-p",
            "Type",
            timeout=10,
        )
    except (OSError, subprocess.SubprocessError) as exc:
        logger.warning("systemctl show %s failed: %s", unit, exc)
        return "unknown", "", ""
    props: dict[str, str] = {}
    for line in result.stdout.splitlines():
        key, _, value = line.partition("=")
        if key.strip():
            props[key.strip()] = value.strip()
    load = props.get("LoadState") or "not-found"
    return load, props.get("ActiveState", ""), props.get("Type", "")


def service_states() -> list[dict[str, Any]]:
    values: list[dict[str, Any]] = []
    for service in discovered_services():
        load, active, unit_type = _unit_state(service)
        # 一次性任务（cloud-init / rc-local / kdump 之类）不是"服务状态"，不进面板。
        if unit_type == "oneshot":
            continue
        installed = load != "not-found"
        if not installed:
            status = "not-found"
        elif load == "masked":
            status = "masked"
        else:
            status = active or "unknown"
        values.append(
            {
                "service": service,
                "status": status[:64],
                "detail": load if not installed else "",
                "buckets": _detect_buckets(service) if installed else [],
                "installed": installed,
            }
        )
    return values


def read_metrics() -> dict[str, Any]:
    load = psutil.getloadavg()
    network = psutil.net_io_counters()
    return {
        "ts": db.utc_now(),
        "cpu_percent": round(psutil.cpu_percent(interval=0.2), 2),
        "memory_percent": round(psutil.virtual_memory().percent, 2),
        "disk_percent": round(psutil.disk_usage("/").percent, 2),
        "load_1": round(load[0], 2),
        "load_5": round(load[1], 2),
        "load_15": round(load[2], 2),
        "net_bytes_sent": int(network.bytes_sent),
        "net_bytes_recv": int(network.bytes_recv),
    }


def _evaluate_resource(
    target: str, value: float, threshold: float, label: str
) -> None:
    key = f"resource:{target}"
    if value >= threshold:
        _consecutive[key] = _consecutive.get(key, 0) + 1
        if _consecutive[key] >= 3:
            db.create_alert(
                "resource",
                target,
                "warning",
                f"{label}连续三次达到 {value:.1f}%，阈值为 {threshold:.1f}%",
                value,
                threshold,
            )
    else:
        _consecutive[key] = 0
        db.resolve_alert("resource", target)


def evaluate_alerts(
    metric: dict[str, Any], services: list[dict[str, str]]
) -> None:
    _evaluate_resource(
        "cpu", metric["cpu_percent"], settings.cpu_threshold, "CPU 使用率"
    )
    _evaluate_resource(
        "memory",
        metric["memory_percent"],
        settings.memory_threshold,
        "内存使用率",
    )
    _evaluate_resource(
        "disk", metric["disk_percent"], settings.disk_threshold, "磁盘使用率"
    )

    for item in services:
        service = item["service"]
        # 已卸载的服务不该继续刷 critical：它没"挂"，它是没了。
        if item["status"] == "active" or not item.get("installed", True):
            db.resolve_alert("service", service)
            continue
        db.create_alert(
            "service",
            service,
            "critical",
            f"服务 {service} 当前状态为 {item['status']}",
        )


def collect_once() -> dict[str, Any]:
    metric = read_metrics()
    services = service_states()
    db.insert_sample(metric, services)
    evaluate_alerts(metric, services)
    logger.info("metrics collected at %s", metric["ts"])
    return {"metric": metric, "services": services}


def restart_service(service: str) -> tuple[bool, str]:
    if service not in settings.services:
        return False, "service is not in the restart whitelist"
    # No sudo here: the service unit runs with NoNewPrivileges (implicit from
    # its systemd hardening options), which blocks sudo entirely. polkit
    # authorizes this systemctl call instead (50-lightops.rules, rendered by
    # install.sh from the monitored service list).
    try:
        result = _systemctl("restart", service, timeout=30)
    except (OSError, subprocess.SubprocessError) as exc:
        return False, str(exc)
    detail = (result.stdout.strip() or result.stderr.strip() or "completed")[:1000]
    return result.returncode == 0, detail