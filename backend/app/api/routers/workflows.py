import uuid

from fastapi import APIRouter, HTTPException

from app.api.deps import DbSession, PaginationDep
from app.schemas.common import Page
from app.schemas.workflow import WorkflowCreate, WorkflowRead
from app.services import workflow_service

router = APIRouter(prefix="/workflows", tags=["workflows"])


@router.get("", response_model=Page[WorkflowRead])
async def list_workflows(db: DbSession, pagination: PaginationDep):
    items, total = await workflow_service.list_workflows(
        db, limit=pagination.limit, offset=pagination.offset
    )
    return Page(items=items, total=total, limit=pagination.limit, offset=pagination.offset)


@router.get("/{workflow_id}", response_model=WorkflowRead)
async def get_workflow(workflow_id: uuid.UUID, db: DbSession):
    workflow = await workflow_service.get_workflow(db, workflow_id)
    if workflow is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow


@router.post("", response_model=WorkflowRead, status_code=201)
async def create_workflow(payload: WorkflowCreate, db: DbSession):
    return await workflow_service.create_workflow(db, payload)
