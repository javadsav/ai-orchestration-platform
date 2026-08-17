import uuid

from fastapi import APIRouter, HTTPException

from app.api.deps import DbSession, PaginationDep
from app.db.models.execution import ExecutionStatus
from app.schemas.common import Page
from app.schemas.execution import ExecutionCreate, ExecutionDetailRead, ExecutionRead
from app.services import execution_service, workflow_service

router = APIRouter(tags=["executions"])


@router.get("/executions", response_model=Page[ExecutionRead])
async def list_executions(
    db: DbSession,
    pagination: PaginationDep,
    workflow_id: uuid.UUID | None = None,
    status: ExecutionStatus | None = None,
):
    items, total = await execution_service.list_executions(
        db, workflow_id=workflow_id, status=status, limit=pagination.limit, offset=pagination.offset
    )
    return Page(items=items, total=total, limit=pagination.limit, offset=pagination.offset)


@router.get("/executions/{execution_id}", response_model=ExecutionDetailRead)
async def get_execution(execution_id: uuid.UUID, db: DbSession):
    execution = await execution_service.get_execution_detail(db, execution_id)
    if execution is None:
        raise HTTPException(status_code=404, detail="Execution not found")
    return execution


@router.post("/workflows/{workflow_id}/executions", response_model=ExecutionRead, status_code=201)
async def trigger_execution(workflow_id: uuid.UUID, payload: ExecutionCreate, db: DbSession):
    workflow = await workflow_service.get_workflow(db, workflow_id)
    if workflow is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return await execution_service.trigger_execution(
        db, workflow_id=workflow_id, input_payload=payload.input_payload
    )
