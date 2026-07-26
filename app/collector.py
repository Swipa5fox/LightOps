from __future__ import annotations

import logging
import subprocess
from datetime import datetime, timezone
from typing import Any

import psutil

from . import db
from .settings import settings


logger = logging.getLogger("lightops.collector")
_consecutive: dict[str, int] = {}


def _systemctl(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [settings.systemctl_path, *args],
        capture_output=True,
        text=True,
        timeout=10,
        check=False,
        env={"PATH": "/usr/sbin:/usr/bin:/sbin:/bin", "LANG": "C"},
    )


def service_states() -> list[dict[str, str]]:
    values: list[dict[str, str]] = []
    for service in settings.services:
        try:
            result = _systemctl("is-active", service)
            status = result.stdout.strip() or "unknown"
            detail = result.stderr.strip()
        except (OSError, subprocess.SubprocessError) as exc:
            status = "unknown"
            detail = str(exc)
        values.append(
            {
                "service": service,
                "status": status[:64],
                "detail": detail[:500],
            }
        )
    return values


def read_metrics() -> dict[str, Any]:
    load = psutil.getloadavg()
    network = psutil.net_io_counters()
    return {
        "ts": datetime.now(timezone.utc).isoformat(timespec="seconds"),
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
        if item["status"] == "active":
            db.resolve_alert("service", service)
        else:
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
    try:
        result = subprocess.run(
            [
                settings.sudo_path,
                "-n",
                settings.systemctl_path,
                "restart",
                service,
            ],
            capture_output=True,
            text=True,
            timeout=30,
            check=False,
            env={"PATH": "/usr/sbin:/usr/bin:/sbin:/bin", "LANG": "C"},
        )
    except (OSError, subprocess.SubprocessError) as exc:
        return False, str(exc)
    detail = (result.stdout.strip() or result.stderr.strip() or "completed")[:1000]
    return result.returncode == 0, detail
