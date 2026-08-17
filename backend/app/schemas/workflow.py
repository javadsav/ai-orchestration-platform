import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class StageDefinition(BaseModel):
    key: str
    label: str
    failure_rate: float = Field(default=0.0, ge=0.0, le=1.0)
    min_duration_ms: int = Field(default=300, ge=0)
    max_duration_ms: int = Field(default=1200, ge=0)


class WorkflowCreate(BaseModel):
    name: str
    description: str | None = None
    stage_definitions: list[StageDefinition]
    is_active: bool = True


class WorkflowRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str | None
    stage_definitions: list[dict[str, Any]]
    is_active: bool
    created_at: datetime
    updated_at: datetime
