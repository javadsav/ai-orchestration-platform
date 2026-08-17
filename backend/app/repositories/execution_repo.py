import uuid
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models.execution import Execution, ExecutionStatus
from app.db.models.execution_log import ExecutionLog, LogLevel
from app.db.models.execution_step import ExecutionStep


async def list_executions(
    db: AsyncSession,
    *,
    workflow_id: uuid.UUID | None = None,
    status: ExecutionStatus | None = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[Execution], int]:
    stmt = select(Execution)
    count_stmt = select(func.count()).select_from(Execution)
    if workflow_id is not None:
        stmt = stmt.where(Execution.workflow_id == workflow_id)
        count_stmt = count_stmt.where(Execution.workflow_id == workflow_id)
    if status is not None:
        stmt = stmt.where(Execution.status == status)
        count_stmt = count_stmt.where(Execution.status == status)

    total = (await db.execute(count_stmt)).scalar_one()
    result = await db.execute(
        stmt.order_by(Execution.created_at.desc()).limit(limit).offset(offset)
    )
    return list(result.scalars().all()), total


async def get_execution(db: AsyncSession, execution_id: uuid.UUID) -> Execution | None:
    return await db.get(Execution, execution_id)


async def get_execution_detail(db: AsyncSession, execution_id: uuid.UUID) -> Execution | None:
    stmt = (
        select(Execution)
        .options(selectinload(Execution.steps), selectinload(Execution.logs))
        .where(Execution.id == execution_id)
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def create_execution(
    db: AsyncSession, *, workflow_id: uuid.UUID, input_payload: dict | None
) -> Execution:
    execution = Execution(
        workflow_id=workflow_id,
        status=ExecutionStatus.PENDING,
        input_payload=input_payload,
    )
    db.add(execution)
    await db.flush()
    await db.refresh(execution)
    return execution


async def mark_queued(db: AsyncSession, execution: Execution, *, celery_task_id: str) -> Execution:
    execution.status = ExecutionStatus.QUEUED
    execution.celery_task_id = celery_task_id
    execution.queued_at = datetime.utcnow()
    await db.flush()
    await db.refresh(execution)
    return execution


async def add_log(
    db: AsyncSession,
    *,
    execution_id: uuid.UUID,
    message: str,
    level: LogLevel = LogLevel.INFO,
    execution_step_id: uuid.UUID | None = None,
) -> ExecutionLog:
    log = ExecutionLog(
        execution_id=execution_id,
        execution_step_id=execution_step_id,
        level=level,
        message=message,
    )
    db.add(log)
    await db.flush()
    await db.refresh(log)
    return log


async def list_step_history(db: AsyncSession, execution_id: uuid.UUID) -> list[ExecutionStep]:
    result = await db.execute(
        select(ExecutionStep)
        .where(ExecutionStep.execution_id == execution_id)
        .order_by(ExecutionStep.stage_order, ExecutionStep.attempt)
    )
    return list(result.scalars().all())
