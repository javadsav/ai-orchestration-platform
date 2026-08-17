import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict

from app.db.models.execution import ExecutionStatus
from app.db.models.execution_log import LogLevel
from app.db.models.execution_step import StepStatus


class ExecutionCreate(BaseModel):
    input_payload: dict[str, Any] | None = None


class ExecutionStepRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    stage_key: str
    stage_order: int
    status: StepStatus
    attempt: int
    started_at: datetime | None
    finished_at: datetime | None
    duration_ms: int | None
    output_payload: dict[str, Any] | None
    error_message: str | None


class ExecutionLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    execution_step_id: uuid.UUID | None
    level: LogLevel
    message: str
    created_at: datetime


class ExecutionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workflow_id: uuid.UUID
    status: ExecutionStatus
    celery_task_id: str | None
    input_payload: dict[str, Any] | None
    result_payload: dict[str, Any] | None
    error_message: str | None
    queued_at: datetime | None
    started_at: datetime | None
    finished_at: datetime | None
    created_at: datetime
    updated_at: datetime


class ExecutionDetailRead(ExecutionRead):
    steps: list[ExecutionStepRead] = []
    logs: list[ExecutionLogRead] = []


class ExecutionEvent(BaseModel):
    """Shape published over Redis and streamed over the WebSocket."""

    type: str  # "snapshot" | "step_update" | "log" | "execution_update"
    execution: ExecutionRead | None = None
    step: ExecutionStepRead | None = None
    log: ExecutionLogRead | None = None
