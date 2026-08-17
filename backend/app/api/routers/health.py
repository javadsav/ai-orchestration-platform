from fastapi import APIRouter
from sqlalchemy import text

from app.api.deps import DbSession
from app.services.progress_broadcaster import get_async_redis
from app.worker.celery_app import celery_app

router = APIRouter(tags=["health"])


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.get("/health/ready")
async def readiness(db: DbSession):
    checks = {"database": False, "redis": False, "broker": False}

    try:
        await db.execute(text("SELECT 1"))
        checks["database"] = True
    except Exception:
        pass

    try:
        await get_async_redis().ping()
        checks["redis"] = True
    except Exception:
        pass

    try:
        checks["broker"] = celery_app.control.inspect(timeout=1.0).ping() is not None
    except Exception:
        pass

    all_ok = all(checks.values())
    return {"status": "ok" if all_ok else "degraded", "checks": checks}
