"""Sync counterparts of execution_repo, used by Celery worker tasks (sync execution model)."""

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.execution import Execution, ExecutionStatus
from app.db.models.execution_log import ExecutionLog, LogLevel
from app.db.models.execution_step import ExecutionStep, StepStatus


def get_execution(db: Session, execution_id: uuid.UUID) -> Execution | None:
    return db.get(Execution, execution_id)


def update_execution_status(
    db: Session,
    execution: Execution,
    *,
    status: ExecutionStatus,
    started_at: datetime | None = None,
    finished_at: datetime | None = None,
    result_payload: dict[str, Any] | None = None,
    error_message: str | None = None,
) -> Execution:
    execution.status = status
    if started_at is not None:
        execution.started_at = started_at
    if finished_at is not None:
        execution.finished_at = finished_at
    if result_payload is not None:
        execution.result_payload = result_payload
    if error_message is not None:
        execution.error_message = error_message
    db.add(execution)
    db.flush()
    db.refresh(execution)
    return execution


def create_step(
    db: Session,
    *,
    execution_id: uuid.UUID,
    stage_key: str,
    stage_order: int,
    attempt: int,
    status: StepStatus = StepStatus.RUNNING,
) -> ExecutionStep:
    step = ExecutionStep(
        execution_id=execution_id,
        stage_key=stage_key,
        stage_order=stage_order,
        attempt=attempt,
        status=status,
        started_at=datetime.utcnow(),
    )
    db.add(step)
    db.flush()
    db.refresh(step)
    return step


def finish_step(
    db: Session,
    step: ExecutionStep,
    *,
    status: StepStatus,
    output_payload: dict[str, Any] | None = None,
    error_message: str | None = None,
) -> ExecutionStep:
    finished_at = datetime.utcnow()
    step.status = status
    step.finished_at = finished_at
    if step.started_at is not None:
        step.duration_ms = int((finished_at - step.started_at).total_seconds() * 1000)
    if output_payload is not None:
        step.output_payload = output_payload
    if error_message is not None:
        step.error_message = error_message
    db.add(step)
    db.flush()
    db.refresh(step)
    return step


def add_log(
    db: Session,
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
    db.flush()
    db.refresh(log)
    return log


def get_succeeded_step(
    db: Session, *, execution_id: uuid.UUID, stage_key: str
) -> ExecutionStep | None:
    result = db.execute(
        select(ExecutionStep).where(
            ExecutionStep.execution_id == execution_id,
            ExecutionStep.stage_key == stage_key,
            ExecutionStep.status == StepStatus.SUCCEEDED,
        )
    )
    return result.scalars().first()


def next_attempt_number(db: Session, *, execution_id: uuid.UUID, stage_key: str) -> int:
    result = db.execute(
        select(ExecutionStep.attempt)
        .where(ExecutionStep.execution_id == execution_id, ExecutionStep.stage_key == stage_key)
        .order_by(ExecutionStep.attempt.desc())
        .limit(1)
    )
    last = result.scalar_one_or_none()
    return (last or 0) + 1
