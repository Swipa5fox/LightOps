from __future__ import annotations

import os
import re
from dataclasses import dataclass
from pathlib import Path


_SERVICE_NAME = re.compile(r"^[A-Za-z0-9_.@-]+$")


def _env_float(name: str, default: float) -> float:
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        return float(raw)
    except ValueError as exc:
        raise RuntimeError(f"{name} must be a number") from exc


def _services() -> tuple[str, ...]:
    values = tuple(
        item.strip()
        for item in os.getenv("LIGHTOPS_SERVICES", "nginx").split(",")
        if item.strip()
    )
    if not values or any(not _SERVICE_NAME.fullmatch(item) for item in values):
        raise RuntimeError("LIGHTOPS_SERVICES contains an invalid systemd unit name")
    return values


@dataclass(frozen=True)
class Settings:
    database_path: Path = Path(
        os.getenv("LIGHTOPS_DB_PATH", "/var/lib/lightops/lightops.db")
    )
    backup_dir: Path = Path(
        os.getenv("LIGHTOPS_BACKUP_DIR", "/var/lib/lightops/backups")
    )
    api_token: str = os.getenv("LIGHTOPS_API_TOKEN", "")
    cloud_provider: str = os.getenv("LIGHTOPS_CLOUD_PROVIDER", "云服务器")
    systemctl_path: str = os.getenv(
        "LIGHTOPS_SYSTEMCTL_PATH", "/usr/bin/systemctl"
    )
    sudo_path: str = os.getenv("LIGHTOPS_SUDO_PATH", "/usr/bin/sudo")
    services: tuple[str, ...] = _services()
    collect_interval_seconds: int = int(
        os.getenv("LIGHTOPS_COLLECT_INTERVAL", "60")
    )
    retention_days: int = int(os.getenv("LIGHTOPS_RETENTION_DAYS", "7"))
    alert_cooldown_minutes: int = int(
        os.getenv("LIGHTOPS_ALERT_COOLDOWN_MINUTES", "15")
    )
    cpu_threshold: float = _env_float("LIGHTOPS_CPU_THRESHOLD", 85.0)
    memory_threshold: float = _env_float("LIGHTOPS_MEMORY_THRESHOLD", 85.0)
    disk_threshold: float = _env_float("LIGHTOPS_DISK_THRESHOLD", 80.0)

    def validate(self) -> None:
        if not self.api_token or len(self.api_token) < 32:
            raise RuntimeError(
                "LIGHTOPS_API_TOKEN is required and must be at least 32 characters"
            )
        if self.collect_interval_seconds < 15:
            raise RuntimeError("LIGHTOPS_COLLECT_INTERVAL must be at least 15 seconds")
        if self.retention_days < 1:
            raise RuntimeError("LIGHTOPS_RETENTION_DAYS must be positive")
        for name, value in (
            ("LIGHTOPS_SYSTEMCTL_PATH", self.systemctl_path),
            ("LIGHTOPS_SUDO_PATH", self.sudo_path),
        ):
            if not Path(value).is_absolute() or any(char.isspace() for char in value):
                raise RuntimeError(f"{name} must be an absolute command path")


settings = Settings()
