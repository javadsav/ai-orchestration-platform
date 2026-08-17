import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.execution import Execution, ExecutionStatus
from app.repositories import execution_repo
from app.worker.celery_app import celery_app


async def list_executions(
    db: AsyncSession,
    *,
    workflow_id: uuid.UUID | None,
    status: ExecutionStatus | None,
    limit: int,
    offset: int,
) -> tuple[list[Execution], int]:
    return await execution_repo.list_executions(
        db, workflow_id=workflow_id, status=status, limit=limit, offset=offset
    )


async def get_execution_detail(db: AsyncSession, execution_id: uuid.UUID) -> Execution | None:
    return await execution_repo.get_execution_detail(db, execution_id)


async def trigger_execution(
    db: AsyncSession, *, workflow_id: uuid.UUID, input_payload: dict | None
) -> Execution:
    execution = await execution_repo.create_execution(
        db, workflow_id=workflow_id, input_payload=input_payload
    )
    async_result = celery_app.send_task(
        "app.worker.tasks.run_execution", args=[str(execution.id)], queue="executions"
    )
    execution = await execution_repo.mark_queued(db, execution, celery_task_id=async_result.id)
    return execution
