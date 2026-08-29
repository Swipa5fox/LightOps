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

logger = logging.getLogger("lightops.ownership")

_OWNERSHIP_FILE = Path("/var/lib/lightops/ownership.json")
_MAX_AGE_SECONDS = 180  # 3 collect intervals
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
    """Human label of who uses `service`; empty when nothing local does."""
    data = _load()
    consumers = sorted(data.get("consumers", {}).get(service, ()))
    if consumers:
        return " / ".join(consumers)
    held = sorted(data.get("ports", {}).get(service, ()))
    if held:
        return "对外端口 " + " / ".join(str(port) for port in held)
    return ""
