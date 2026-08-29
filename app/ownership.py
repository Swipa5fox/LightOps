"""Who-uses-what labels for monitored services.

A root-owned timer (lightops-inspect.timer -> app/ownership_probe.py)
builds the provider -> consumers graph from the host's socket tables every
collect interval and drops it at /var/lib/lightops/ownership.json; the app
only reads that file. It never needs sudo or elevated capabilities: the
unit's hardening options imply kernel NoNewPrivs (sudo impossible from
inside), and kernel.yama.ptrace_scope=2 on RHEL 9 defeats CAP_SYS_PTRACE
held by a non-root caller, so a privileged sidecar is the only clean
channel.

Missing or stale data simply yields empty labels.
"""

from __future__ import annotations

import json
import logging
import time
from pathlib import Path
from typing import Any

from .settings import settings

logger = logging.getLogger("lightops.ownership")

_OWNERSHIP_FILE = Path("/var/lib/lightops/ownership.json")
# 探针由 lightops-inspect.timer 按采集间隔驱动，陈旧窗口跟着间隔走。
_MAX_AGE_SECONDS = settings.collect_interval_seconds * 3
_INPROCESS_TTL_SECONDS = 30

_cache: dict[str, Any] = {"data": {}, "at": 0.0}


def _load() -> dict[str, Any]:
    now = time.monotonic()
    if now - float(_cache["at"]) < _INPROCESS_TTL_SECONDS:
        return _cache["data"]
    try:
        age = time.time() - _OWNERSHIP_FILE.stat().st_mtime
    except OSError:
        _cache.update(data={}, at=now)
        return _cache["data"]
    # 允许毫秒级负偏差（两次 time.time() 浮点抖动可能让 mtime 显得微在未来）。
    if age < -1 or age > _MAX_AGE_SECONDS:
        _cache.update(data={}, at=now)
        return _cache["data"]
    try:
        data = json.loads(_OWNERSHIP_FILE.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        logger.warning("ownership data unreadable", exc_info=True)
        data = {}
    _cache.update(data=data if isinstance(data, dict) else {}, at=now)
    return _cache["data"]


def used_by(service: str) -> str:
    """Human label of who uses `service`; empty when nothing is known.

    优先级：探针识别到的调用方（运行时真实关系）→ 管理员在
    LIGHTOPS_SERVICE_LABELS 里写的语义标注 → 对外监听信息（端口 + 入站连接数）。
    """
    data = _load()
    consumers = sorted(data.get("consumers", {}).get(service, ()))
    if consumers:
        return " / ".join(consumers)
    inbound = data.get("inbound", {}).get(service, {}) or {}
    external = int(inbound.get("external", 0))
    local = int(inbound.get("local", 0))
    label = settings.service_labels.get(service, "")
    if label:
        return label + (" · 外部连接 %d" % external if external else "")
    held = sorted(data.get("ports", {}).get(service, ()))
    if held:
        ports = "对外端口 " + " / ".join(str(port) for port in held)
        if external or local:
            return ports + " · %d 外部 / %d 本机连接" % (external, local)
        return ports
    if local:
        return "本机连接 %d" % local
    return ""
