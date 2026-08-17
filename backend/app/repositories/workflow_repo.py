import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.workflow import Workflow


async def list_workflows(
    db: AsyncSession, *, limit: int = 50, offset: int = 0
) -> tuple[list[Workflow], int]:
    total = (await db.execute(select(func.count()).select_from(Workflow))).scalar_one()
    result = await db.execute(
        select(Workflow).order_by(Workflow.created_at.desc()).limit(limit).offset(offset)
    )
    return list(result.scalars().all()), total


async def get_workflow(db: AsyncSession, workflow_id: uuid.UUID) -> Workflow | None:
    return await db.get(Workflow, workflow_id)


async def create_workflow(
    db: AsyncSession,
    *,
    name: str,
    description: str | None,
    stage_definitions: list[dict],
    is_active: bool = True,
) -> Workflow:
    workflow = Workflow(
        name=name,
        description=description,
        stage_definitions=stage_definitions,
        is_active=is_active,
    )
    db.add(workflow)
    await db.flush()
    await db.refresh(workflow)
    return workflow
