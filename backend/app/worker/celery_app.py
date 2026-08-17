from celery import Celery

from app.settings import settings

celery_app = Celery(
    "ai_orchestration",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["app.worker.tasks"],
)

celery_app.conf.update(
    task_routes={"app.worker.tasks.run_execution": {"queue": "executions"}},
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    result_expires=3600,
    timezone="UTC",
)
