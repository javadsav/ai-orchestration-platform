from fastapi import APIRouter
from sqlalchemy import select

from app.api.deps import DbSession
from app.db.models.job_event import JobQueueEvent
from app.worker.celery_app import celery_app

router = APIRouter(prefix="/queue", tags=["queue"])


@router.get("/status")
async def queue_status(db: DbSession):
    inspector = celery_app.control.inspect(timeout=1.0)
    active = inspector.active() or {}
    reserved = inspector.reserved() or {}
    scheduled = inspector.scheduled() or {}

    recent_events = (
        (
            await db.execute(
                select(JobQueueEvent).order_by(JobQueueEvent.created_at.desc()).limit(50)
            )
        )
        .scalars()
        .all()
    )

    return {
        "workers": list(active.keys()) or list(reserved.keys()),
        "active_tasks": active,
        "reserved_tasks": reserved,
        "scheduled_tasks": scheduled,
        "recent_events": [
            {
                "id": e.id,
                "execution_id": str(e.execution_id) if e.execution_id else None,
                "event_type": e.event_type,
                "queue_name": e.queue_name,
                "worker_hostname": e.worker_hostname,
                "created_at": e.created_at,
            }
            for e in recent_events
        ],
    }
