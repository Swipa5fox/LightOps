from __future__ import annotations

import os
import sys
import tempfile
from pathlib import Path


temp_dir = tempfile.TemporaryDirectory()
root = Path(temp_dir.name)
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ["LIGHTOPS_API_TOKEN"] = "x" * 64
os.environ["LIGHTOPS_DB_PATH"] = str(root / "lightops.db")
os.environ["LIGHTOPS_BACKUP_DIR"] = str(root / "backups")
os.environ["LIGHTOPS_SERVICES"] = "nginx,mysqld,redis"

from app import db  # noqa: E402


db.init_db()
metric = {
    "ts": db.utc_now(),
    "cpu_percent": 12.5,
    "memory_percent": 31.0,
    "disk_percent": 18.2,
    "load_1": 0.1,
    "load_5": 0.2,
    "load_15": 0.3,
    "net_bytes_sent": 100,
    "net_bytes_recv": 200,
}
services = [
    {"service": "nginx", "status": "active", "detail": ""},
    {"service": "mysqld", "status": "active", "detail": ""},
    {"service": "redis", "status": "active", "detail": ""},
]
db.insert_sample(metric, services)
assert db.latest_metric()["cpu_percent"] == 12.5
assert len(db.latest_services()) == 3
assert len(db.metric_history(60)) == 1
alert_id = db.create_alert("resource", "cpu", "warning", "test", 90, 85)
assert alert_id is not None
assert len(db.active_alerts()) == 1
db.resolve_alert("resource", "cpu")
assert not db.active_alerts()
backup_path = Path(db.backup_database())
assert backup_path.exists()
second_backup_path = Path(db.backup_database())
assert second_backup_path.exists()
assert second_backup_path != backup_path
cleanup_result = db.cleanup_old_data()
assert "alerts" in cleanup_result
print("LightOps smoke test passed")
