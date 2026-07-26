from __future__ import annotations

import os
import sys
import tempfile
from pathlib import Path


temp_dir = tempfile.TemporaryDirectory()
root = Path(temp_dir.name)
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
token = "test-token-" + ("x" * 54)
os.environ["LIGHTOPS_API_TOKEN"] = token
os.environ["LIGHTOPS_DB_PATH"] = str(root / "lightops.db")
os.environ["LIGHTOPS_BACKUP_DIR"] = str(root / "backups")
os.environ["LIGHTOPS_SERVICES"] = "nginx,mysqld,redis"
if os.name == "nt":
    harmless_command = Path(os.environ.get("SystemRoot", r"C:\Windows")) / "System32" / "where.exe"
    os.environ["LIGHTOPS_SYSTEMCTL_PATH"] = str(harmless_command)
    os.environ["LIGHTOPS_SUDO_PATH"] = str(harmless_command)

from fastapi.testclient import TestClient  # noqa: E402

from app import db  # noqa: E402
from app.main import app  # noqa: E402


with TestClient(app) as client:
    health = client.get("/api/health")
    assert health.status_code == 200, health.text
    assert health.json()["status"] == "ok"
    assert health.json()["version"] == "0.1.1"
    assert health.json()["collector"] == "ok"
    assert health.json()["scheduler"] == "running"

    summary = client.get("/api/summary")
    assert summary.status_code == 200, summary.text
    assert summary.json()["metric"] is not None
    assert summary.json()["host"]["cpu_count"] >= 1
    assert summary.json()["host"]["memory_total"] > 0
    assert summary.json()["host"]["disk_total"] > 0
    assert summary.json()["host"]["os_name"]

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
    headers = {"Authorization": "Bearer " + token}
    audit = client.get(
        "/api/audit", headers=headers
    )
    assert audit.status_code == 200, audit.text

    rejected = client.post("/api/services/not-allowed/restart", headers=headers)
    assert rejected.status_code == 403, rejected.text

    maintenance = client.post("/api/maintenance/run", headers=headers)
    assert maintenance.status_code == 200, maintenance.text
    assert Path(maintenance.json()["backup"]).is_file()

    with db.connect() as connection:
        connection.execute("UPDATE metrics SET ts = '2000-01-01T00:00:00+00:00'")
    stale_health = client.get("/api/health")
    assert stale_health.status_code == 503, stale_health.text
    assert stale_health.json()["collector"] == "stale"

print("LightOps API smoke test passed")
