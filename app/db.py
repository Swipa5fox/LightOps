from __future__ import annotations

import json
import math
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Iterator

from .settings import settings


SCHEMA = """
CREATE TABLE IF NOT EXISTS metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts TEXT NOT NULL,
    cpu_percent REAL NOT NULL,
    memory_percent REAL NOT NULL,
    disk_percent REAL NOT NULL,
    load_1 REAL NOT NULL,
    load_5 REAL NOT NULL,
    load_15 REAL NOT NULL,
    net_bytes_sent INTEGER NOT NULL,
    net_bytes_recv INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_metrics_ts ON metrics(ts);

CREATE TABLE IF NOT EXISTS service_samples (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts TEXT NOT NULL,
    service TEXT NOT NULL,
    status TEXT NOT NULL,
    detail TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_service_samples_ts
    ON service_samples(ts, service);

CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kind TEXT NOT NULL,
    target TEXT NOT NULL,
    level TEXT NOT NULL,
    message TEXT NOT NULL,
    value REAL,
    threshold REAL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL,
    resolved_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_alerts_status
    ON alerts(status, created_at);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts TEXT NOT NULL,
    action TEXT NOT NULL,
    target TEXT NOT NULL,
    success INTEGER NOT NULL,
    detail TEXT NOT NULL,
    remote_addr TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ts ON audit_logs(ts);
"""


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


@contextmanager
def connect() -> Iterator[sqlite3.Connection]:
    database = settings.database_path
    database.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(database, timeout=15)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys=ON")
    conn.execute("PRAGMA busy_timeout=15000")
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    with connect() as conn:
        # WAL mode is persisted in the database file header, so setting it once
        # here is sufficient; per-connection PRAGMAs (foreign_keys, busy_timeout)
        # are still applied in connect().
        conn.execute("PRAGMA journal_mode=WAL")
        conn.executescript(SCHEMA)


def insert_sample(metric: dict[str, Any], services: list[dict[str, str]]) -> None:
    with connect() as conn:
        conn.execute(
            """
            INSERT INTO metrics (
                ts, cpu_percent, memory_percent, disk_percent,
                load_1, load_5, load_15, net_bytes_sent, net_bytes_recv
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                metric["ts"],
                metric["cpu_percent"],
                metric["memory_percent"],
                metric["disk_percent"],
                metric["load_1"],
                metric["load_5"],
                metric["load_15"],
                metric["net_bytes_sent"],
                metric["net_bytes_recv"],
            ),
        )
        conn.executemany(
            """
            INSERT INTO service_samples (ts, service, status, detail)
            VALUES (?, ?, ?, ?)
            """,
            [
                (metric["ts"], item["service"], item["status"], item["detail"])
                for item in services
            ],
        )


def latest_metric() -> dict[str, Any] | None:
    with connect() as conn:
        row = conn.execute(
            "SELECT * FROM metrics ORDER BY ts DESC LIMIT 1"
        ).fetchone()
    return dict(row) if row else None


def latest_services() -> list[dict[str, Any]]:
    with connect() as conn:
        rows = conn.execute(
            """
            SELECT s.ts, s.service, s.status, s.detail
            FROM service_samples AS s
            INNER JOIN (
                SELECT service, MAX(ts) AS max_ts
                FROM service_samples
                GROUP BY service
            ) AS latest
            ON latest.service = s.service AND latest.max_ts = s.ts
            ORDER BY s.service
            """
        ).fetchall()
    return [dict(row) for row in rows]


def metric_history(minutes: int, max_points: int = 720) -> list[dict[str, Any]]:
    since = (datetime.now(timezone.utc) - timedelta(minutes=minutes)).isoformat(
        timespec="seconds"
    )
    with connect() as conn:
        rows = conn.execute(
            "SELECT * FROM metrics WHERE ts >= ? ORDER BY ts ASC", (since,)
        ).fetchall()
    values = [dict(row) for row in rows]
    if len(values) <= max_points:
        return values
    stride = math.ceil(len(values) / max_points)
    sampled = values[::stride]
    if sampled[-1]["id"] != values[-1]["id"]:
        sampled.append(values[-1])
    return sampled


def active_alerts(limit: int = 100) -> list[dict[str, Any]]:
    with connect() as conn:
        rows = conn.execute(
            """
            SELECT * FROM alerts
            WHERE status = 'active'
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
    return [dict(row) for row in rows]


def create_alert(
    kind: str,
    target: str,
    level: str,
    message: str,
    value: float | None = None,
    threshold: float | None = None,
) -> int | None:
    cutoff = (
        datetime.now(timezone.utc)
        - timedelta(minutes=settings.alert_cooldown_minutes)
    ).isoformat(timespec="seconds")
    with connect() as conn:
        active = conn.execute(
            """
            SELECT id FROM alerts
            WHERE kind = ? AND target = ? AND status = 'active'
            LIMIT 1
            """,
            (kind, target),
        ).fetchone()
        if active:
            return None
        recent = conn.execute(
            """
            SELECT id FROM alerts
            WHERE kind = ? AND target = ? AND created_at >= ?
            ORDER BY created_at DESC LIMIT 1
            """,
            (kind, target, cutoff),
        ).fetchone()
        if recent:
            return None
        cursor = conn.execute(
            """
            INSERT INTO alerts (
                kind, target, level, message, value, threshold, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (kind, target, level, message, value, threshold, utc_now()),
        )
        return int(cursor.lastrowid)


def resolve_alert(kind: str, target: str) -> None:
    with connect() as conn:
        conn.execute(
            """
            UPDATE alerts
            SET status = 'resolved', resolved_at = ?
            WHERE kind = ? AND target = ? AND status = 'active'
            """,
            (utc_now(), kind, target),
        )


def write_audit(
    action: str,
    target: str,
    success: bool,
    detail: str,
    remote_addr: str,
) -> None:
    with connect() as conn:
        conn.execute(
            """
            INSERT INTO audit_logs (
                ts, action, target, success, detail, remote_addr
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            (utc_now(), action, target, int(success), detail[:1000], remote_addr),
        )


def audit_logs(limit: int = 100) -> list[dict[str, Any]]:
    with connect() as conn:
        rows = conn.execute(
            "SELECT * FROM audit_logs ORDER BY ts DESC LIMIT ?", (limit,)
        ).fetchall()
    return [dict(row) for row in rows]


def cleanup_old_data() -> dict[str, int]:
    cutoff = (
        datetime.now(timezone.utc) - timedelta(days=settings.retention_days)
    ).isoformat(timespec="seconds")
    with connect() as conn:
        metrics_deleted = conn.execute(
            "DELETE FROM metrics WHERE ts < ?", (cutoff,)
        ).rowcount
        services_deleted = conn.execute(
            "DELETE FROM service_samples WHERE ts < ?", (cutoff,)
        ).rowcount
        audit_deleted = conn.execute(
            "DELETE FROM audit_logs WHERE ts < ?", (cutoff,)
        ).rowcount
        alerts_deleted = conn.execute(
            """
            DELETE FROM alerts
            WHERE status != 'active' AND COALESCE(resolved_at, created_at) < ?
            """,
            (cutoff,),
        ).rowcount
    return {
        "metrics": metrics_deleted,
        "service_samples": services_deleted,
        "audit_logs": audit_deleted,
        "alerts": alerts_deleted,
    }


def backup_database() -> str:
    settings.backup_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S.%fZ")
    destination = settings.backup_dir / f"lightops-{stamp}.db"
    with connect() as source:
        target = sqlite3.connect(destination)
        try:
            source.backup(target)
        finally:
            target.close()

    cutoff = datetime.now(timezone.utc) - timedelta(days=settings.retention_days)
    for item in settings.backup_dir.glob("lightops-*.db"):
        modified = datetime.fromtimestamp(item.stat().st_mtime, timezone.utc)
        if modified < cutoff:
            item.unlink()
    return str(destination)


def database_check() -> bool:
    with connect() as conn:
        return conn.execute("SELECT 1").fetchone()[0] == 1
