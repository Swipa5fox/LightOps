from __future__ import annotations

import os
import sys
import tempfile
from pathlib import Path


temp_dir = tempfile.TemporaryDirectory()
root = Path(temp_dir.name)
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ["LIGHTOPS_DB_PATH"] = str(root / "lightops.db")
os.environ["LIGHTOPS_BACKUP_DIR"] = str(root / "backups")
os.environ["LIGHTOPS_SERVICES"] = "nginx,mysqld,redis"
if os.name == "nt":
    harmless_command = Path(os.environ.get("SystemRoot", r"C:\Windows")) / "System32" / "where.exe"
    os.environ["LIGHTOPS_SYSTEMCTL_PATH"] = str(harmless_command)

from fastapi.testclient import TestClient  # noqa: E402

from app import db, weather, __version__  # noqa: E402
from app.main import app  # noqa: E402


with TestClient(app) as client:
    health = client.get("/api/health")
    assert health.status_code == 200, health.text
    assert health.json()["status"] == "ok"
    assert health.json()["version"] == __version__
    assert health.json()["collector"] == "ok"
    assert health.json()["scheduler"] == "running"

    summary = client.get("/api/summary")
    assert summary.status_code == 200, summary.text
    assert summary.json()["metric"] is not None
    assert summary.json()["host"]["cpu_count"] >= 1
    assert summary.json()["host"]["memory_total"] > 0
    assert summary.json()["host"]["disk_total"] > 0
    assert summary.json()["host"]["os_name"]

    original_weather_fetch = weather._fetch_remote
    weather._CACHE.clear()
    weather._fetch_remote = lambda latitude, longitude: {
        "timezone": "Asia/Shanghai",
        "timezone_abbreviation": "GMT+8",
        "current": {
            "time": "2026-07-29T02:30",
            "temperature_2m": 28.4,
            "apparent_temperature": 31.2,
            "relative_humidity_2m": 74,
            "weather_code": 2,
            "wind_speed_10m": 8.6,
            "is_day": 1,
        },
        "daily": {
            "time": ["2026-07-29"],
            "weather_code": [2],
            "temperature_2m_max": [32.1],
            "temperature_2m_min": [25.7],
            "precipitation_probability_max": [35],
            "sunrise": ["2026-07-29T05:44"],
            "sunset": ["2026-07-29T19:07"],
        },
    }
    try:
        forecast = client.get(
            "/api/weather", params={"latitude": 23.1291, "longitude": 113.2644}
        )
    finally:
        weather._fetch_remote = original_weather_fetch
        weather._CACHE.clear()
    assert forecast.status_code == 200, forecast.text
    assert forecast.json()["location_label"] == "当前位置"
    assert forecast.json()["current"]["temperature"] == 28.4
    assert forecast.json()["today"]["temperature_max"] == 32.1
    assert client.get(
        "/api/weather", params={"latitude": 91, "longitude": 113}
    ).status_code == 422

    metrics = client.get("/api/metrics", params={"range": "1h"})
    assert metrics.status_code == 200, metrics.text
    assert len(metrics.json()["points"]) >= 1

    short_metrics = client.get("/api/metrics", params={"range": "10m"})
    assert short_metrics.status_code == 200, short_metrics.text
    assert len(short_metrics.json()["points"]) >= 1
    assert client.get("/api/metrics", params={"range": "30d"}).status_code == 422

    assert client.get("/api/audit").status_code == 401
    assert client.post("/api/maintenance/run").status_code == 401
    assert client.post("/api/services/nginx/restart").status_code == 401

    # 角色权限：Guest 只读，管理操作一律 403；Admin 会话拥有管理权限。
    guest_login = client.post(
        "/api/login", json={"username": "Guest", "password": "123456"}
    )
    assert guest_login.status_code == 200, guest_login.text
    guest_headers = {"Authorization": "Bearer " + guest_login.json()["token"]}
    guest_me = client.get("/api/auth/me", headers=guest_headers)
    assert guest_me.status_code == 200
    assert guest_me.json()["role"] == "guest"
    assert client.post(
        "/api/services/nginx/restart", headers=guest_headers
    ).status_code == 403
    assert client.post(
        "/api/maintenance/run", headers=guest_headers
    ).status_code == 403
    assert client.get("/api/audit", headers=guest_headers).status_code == 403

    admin_login = client.post(
        "/api/login", json={"username": "Admin", "password": "123456"}
    )
    assert admin_login.status_code == 200, admin_login.text
    admin_headers = {"Authorization": "Bearer " + admin_login.json()["token"]}
    admin_me = client.get("/api/auth/me", headers=admin_headers)
    assert admin_me.status_code == 200
    assert admin_me.json()["role"] == "admin"

    audit = client.get("/api/audit", headers=admin_headers)
    assert audit.status_code == 200, audit.text
    # 白名单外服务即使持有 admin 会话也被拒。
    assert client.post(
        "/api/services/not-allowed/restart", headers=admin_headers
    ).status_code == 403

    maintenance = client.post("/api/maintenance/run", headers=admin_headers)
    assert maintenance.status_code == 200, maintenance.text
    assert Path(maintenance.json()["backup"]).is_file()

    with db.connect() as connection:
        connection.execute("UPDATE metrics SET ts = '2000-01-01T00:00:00+00:00'")
    stale_health = client.get("/api/health")
    assert stale_health.status_code == 503, stale_health.text
    assert stale_health.json()["collector"] == "stale"

print("LightOps API smoke test passed")
