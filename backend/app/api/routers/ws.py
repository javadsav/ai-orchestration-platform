import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.db.session import AsyncSessionLocal
from app.schemas.execution import ExecutionDetailRead
from app.services import execution_service
from app.services.progress_broadcaster import subscribe

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/executions/{execution_id}")
async def execution_progress(websocket: WebSocket, execution_id: uuid.UUID):
    await websocket.accept()

    async with AsyncSessionLocal() as db:
        execution = await execution_service.get_execution_detail(db, execution_id)
        if execution is None:
            await websocket.close(code=4404, reason="Execution not found")
            return

        snapshot = ExecutionDetailRead.model_validate(execution)
        await websocket.send_json(
            {"type": "snapshot", "execution": snapshot.model_dump(mode="json")}
        )

    try:
        async for event in subscribe(execution_id):
            await websocket.send_json(event)
    except WebSocketDisconnect:
        return
