from __future__ import annotations

import logging
import platform
import secrets
import socket
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Annotated, Optional

import psutil
from apscheduler.executors.pool import ThreadPoolExecutor
from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import (
    Depends,
    FastAPI,
    Header,
    HTTPException,
    Query,
    Request,
    Response,
    status,
)
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from . import __version__, collector, db, weather
from .settings import settings


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("lightops")
STARTED_AT = time.time()
# LightOps only schedules 2 jobs (collect + maintenance). The default
# ThreadPoolExecutor spins up 10 workers; 3 is more than enough and trims
# idle thread stacks on small-memory hosts.
scheduler = BackgroundScheduler(
    timezone="UTC",
    executors={"default": ThreadPoolExecutor(max_workers=3)},
)


def operating_system_name() -> str:
    os_release = Path("/etc/os-release")
    try:
        for line in os_release.read_text(encoding="utf-8").splitlines():
            if line.startswith("PRETTY_NAME="):
                return line.split("=", 1)[1].strip().strip('"')
    except OSError:
        pass
    return platform.system() or "Linux"


# OS name does not change during the process lifetime; read it once at import
# time instead of hitting /etc/os-release on every /api/summary request.
OS_NAME = operating_system_name()


def require_token(
    authorization: Annotated[Optional[str], Header()] = None,
) -> None:
    expected = f"Bearer {settings.api_token}"
    if not authorization or not secrets.compare_digest(authorization, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="valid bearer token required",
            headers={"WWW-Authenticate": "Bearer"},
        )


def scheduled_maintenance() -> None:
    try:
        result = db.run_maintenance()
        logger.info("maintenance complete deleted=%s backup=%s", result["deleted"], result["backup"])
    except Exception:
        logger.exception("scheduled maintenance failed")


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings.validate()
    db.init_db()
    try:
        collector.collect_once()
    except Exception:
        logger.exception("initial metric collection failed")
    scheduler.add_job(
        collector.collect_once,
        "interval",
        seconds=settings.collect_interval_seconds,
        id="collect-metrics",
        replace_existing=True,
        coalesce=True,
        max_instances=1,
    )
    scheduler.add_job(
        scheduled_maintenance,
        "cron",
        hour=3,
        minute=10,
        id="maintenance",
        replace_existing=True,
        coalesce=True,
        max_instances=1,
    )
    scheduler.start()
    yield
    scheduler.shutdown(wait=False)


app = FastAPI(
    title="LightOps",
    version=__version__,
    docs_url=None,
    redoc_url=None,
    lifespan=lifespan,
)


@app.exception_handler(Exception)
async def unhandled_exception(_: Request, exc: Exception) -> JSONResponse:
    logger.exception("unhandled request error", exc_info=exc)
    return JSONResponse(status_code=500, content={"detail": "internal server error"})


@app.get("/api/health")
def health(response: Response) -> dict:
    database_ok = False
    latest = None
    try:
        database_ok = db.database_check()
        latest = db.latest_metric() if database_ok else None
    except Exception as exc:
        logger.warning("health database check failed: %s", exc)

    sample_age_seconds: int | None = None
    if latest and latest.get("ts"):
        try:
            sampled_at = datetime.fromisoformat(str(latest["ts"]))
            if sampled_at.tzinfo is None:
                sampled_at = sampled_at.replace(tzinfo=timezone.utc)
            sample_age_seconds = max(
                0,
                int((datetime.now(timezone.utc) - sampled_at).total_seconds()),
            )
        except (TypeError, ValueError):
            sample_age_seconds = None

    freshness_limit = max(settings.collect_interval_seconds * 3, 60)
    collector_ok = (
        sample_age_seconds is not None
        and sample_age_seconds <= freshness_limit
    )
    scheduler_ok = scheduler.running
    healthy = database_ok and collector_ok and scheduler_ok
    if not healthy:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return {
        "status": "ok" if healthy else "degraded",
        "version": __version__,
        "uptime_seconds": int(time.time() - STARTED_AT),
        "database": "ok" if database_ok else "error",
        "collector": "ok" if collector_ok else ("stale" if latest else "missing"),
        "sample_age_seconds": sample_age_seconds,
        "scheduler": "running" if scheduler_ok else "stopped",
    }


@app.get("/api/summary")
def summary() -> dict:
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    return {
        "metric": db.latest_metric(),
        "services": db.latest_services(),
        "alerts": db.active_alerts(),
        "host": {
            "cloud_provider": settings.cloud_provider,
            "hostname": socket.gethostname(),
            "boot_time": psutil.boot_time(),
            "cpu_count": psutil.cpu_count(),
            "memory_total": memory.total,
            "memory_used": memory.used,
            "memory_available": memory.available,
            "disk_total": disk.total,
            "disk_used": disk.used,
            "disk_free": disk.free,
            "os_name": OS_NAME,
            "kernel_release": platform.release(),
        },
        "version": __version__,
    }


@app.get("/api/weather")
def local_weather(
    place: Annotated[Optional[str], Query()] = None,
    latitude: Annotated[Optional[float], Query(ge=-90, le=90)] = None,
    longitude: Annotated[Optional[float], Query(ge=-180, le=180)] = None,
) -> dict:
    try:
        if place:
            return weather.current_weather_by_name(place)
        if latitude is not None and longitude is not None:
            return weather.current_weather(latitude, longitude)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="请提供 place（城市名）或经纬度",
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("weather lookup failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="天气服务暂时不可用",
        ) from exc


@app.get("/api/metrics")
def metrics(
    range_name: Annotated[
        str, Query(alias="range", pattern="^(10m|1h|24h|7d)$")
    ] = "10m",
) -> dict:
    minutes = {
        "10m": 10,
        "1h": 60,
        "24h": 24 * 60,
        "7d": 7 * 24 * 60,
    }[range_name]
    return {"range": range_name, "points": db.metric_history(minutes)}


@app.get("/api/services")
def services() -> dict:
    return {"services": db.latest_services(), "whitelist": settings.services}


@app.get("/api/alerts")
def alerts() -> dict:
    return {"alerts": db.active_alerts()}


@app.get("/api/audit", dependencies=[Depends(require_token)])
def audit(limit: Annotated[int, Query(ge=1, le=500)] = 100) -> dict:
    return {"entries": db.audit_logs(limit)}


@app.post(
    "/api/services/{service}/restart",
    dependencies=[Depends(require_token)],
)
def restart(service: str, request: Request) -> dict:
    remote_addr = request.client.host if request.client else "unknown"
    if service not in settings.services:
        db.write_audit(
            "restart_service",
            service,
            False,
            "rejected: not in whitelist",
            remote_addr,
        )
        raise HTTPException(status_code=403, detail="service is not in whitelist")

    success, detail = collector.restart_service(service)
    db.write_audit("restart_service", service, success, detail, remote_addr)
    if not success:
        raise HTTPException(status_code=500, detail=detail)
    collector.collect_once()
    return {"ok": True, "service": service, "detail": detail}


@app.post("/api/maintenance/run", dependencies=[Depends(require_token)])
def run_maintenance(request: Request) -> dict:
    remote_addr = request.client.host if request.client else "unknown"
    try:
        result = db.run_maintenance()
    except Exception as exc:
        db.write_audit(
            "run_maintenance", "database", False, str(exc), remote_addr
        )
        raise HTTPException(status_code=500, detail="maintenance failed") from exc
    db.write_audit(
        "run_maintenance",
        "database",
        True,
        f"deleted={result['deleted']}; backup={result['backup']}",
        remote_addr,
    )
    return {"ok": True, "deleted": result["deleted"], "backup": result["backup"]}


STATIC_DIR = Path(__file__).resolve().parent / "static"
app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
