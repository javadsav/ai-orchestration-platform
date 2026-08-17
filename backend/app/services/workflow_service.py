import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.workflow import Workflow
from app.repositories import workflow_repo
from app.schemas.workflow import WorkflowCreate


async def list_workflows(
    db: AsyncSession, *, limit: int, offset: int
) -> tuple[list[Workflow], int]:
    return await workflow_repo.list_workflows(db, limit=limit, offset=offset)


async def get_workflow(db: AsyncSession, workflow_id: uuid.UUID) -> Workflow | None:
    return await workflow_repo.get_workflow(db, workflow_id)


async def create_workflow(db: AsyncSession, payload: WorkflowCreate) -> Workflow:
    return await workflow_repo.create_workflow(
        db,
        name=payload.name,
        description=payload.description,
        stage_definitions=[stage.model_dump() for stage in payload.stage_definitions],
        is_active=payload.is_active,
    )
