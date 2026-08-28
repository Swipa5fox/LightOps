from __future__ import annotations

import os
import re
from dataclasses import dataclass
from pathlib import Path


_SERVICE_NAME = re.compile(r"^[A-Za-z0-9_.@-]+$")


def _env_number(name: str, default: int | float, cast: type) -> int | float:
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        return cast(raw)
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
    cloud_provider: str = os.getenv("LIGHTOPS_CLOUD_PROVIDER", "云服务器")
    systemctl_path: str = os.getenv(
        "LIGHTOPS_SYSTEMCTL_PATH", "/usr/bin/systemctl"
    )
    sudo_path: str = os.getenv("LIGHTOPS_SUDO_PATH", "/usr/bin/sudo")
    services: tuple[str, ...] = _services()
    collect_interval_seconds: int = _env_number("LIGHTOPS_COLLECT_INTERVAL", 60, int)
    retention_days: int = _env_number("LIGHTOPS_RETENTION_DAYS", 7, int)
    alert_cooldown_minutes: int = _env_number("LIGHTOPS_ALERT_COOLDOWN_MINUTES", 15, int)
    cpu_threshold: float = _env_number("LIGHTOPS_CPU_THRESHOLD", 85.0, float)
    memory_threshold: float = _env_number("LIGHTOPS_MEMORY_THRESHOLD", 85.0, float)
    disk_threshold: float = _env_number("LIGHTOPS_DISK_THRESHOLD", 80.0, float)
    weather_cache_seconds: int = _env_number("LIGHTOPS_WEATHER_CACHE_SECONDS", 1800, int)
    weather_request_timeout_seconds: int = _env_number(
        "LIGHTOPS_WEATHER_REQUEST_TIMEOUT_SECONDS", 8, int
    )

    def validate(self) -> None:
        if self.collect_interval_seconds < 15:
            raise RuntimeError("LIGHTOPS_COLLECT_INTERVAL must be at least 15 seconds")
        if self.retention_days < 1:
            raise RuntimeError("LIGHTOPS_RETENTION_DAYS must be positive")
        if self.weather_cache_seconds < 300:
            raise RuntimeError("LIGHTOPS_WEATHER_CACHE_SECONDS must be at least 300")
        if not 2 <= self.weather_request_timeout_seconds <= 30:
            raise RuntimeError(
                "LIGHTOPS_WEATHER_REQUEST_TIMEOUT_SECONDS must be between 2 and 30"
            )
        for name, value in (
            ("LIGHTOPS_SYSTEMCTL_PATH", self.systemctl_path),
            ("LIGHTOPS_SUDO_PATH", self.sudo_path),
        ):
            if not Path(value).is_absolute() or any(char.isspace() for char in value):
                raise RuntimeError(f"{name} must be an absolute command path")


settings = Settings()
