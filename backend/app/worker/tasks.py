import uuid
from datetime import datetime

from app.db.models.execution import ExecutionStatus
from app.db.models.execution_log import LogLevel
from app.db.models.execution_step import StepStatus
from app.db.models.workflow import Workflow
from app.db.session import get_sync_db
from app.repositories import execution_repo_sync as repo
from app.schemas.execution import ExecutionLogRead, ExecutionRead, ExecutionStepRead
from app.services.progress_broadcaster import publish_event
from app.worker.celery_app import celery_app
from app.worker.stage_simulators import StageExecutionError, simulate

MAX_STAGE_RETRIES = 3


def _publish_execution_update(execution) -> None:
    publish_event(
        execution.id,
        {
            "type": "execution_update",
            "execution": ExecutionRead.model_validate(execution).model_dump(mode="json"),
        },
    )


def _publish_step_update(execution_id, step) -> None:
    publish_event(
        execution_id,
        {
            "type": "step_update",
            "step": ExecutionStepRead.model_validate(step).model_dump(mode="json"),
        },
    )


def _publish_log(execution_id, log) -> None:
    publish_event(
        execution_id,
        {"type": "log", "log": ExecutionLogRead.model_validate(log).model_dump(mode="json")},
    )


@celery_app.task(
    name="app.worker.tasks.run_execution",
    bind=True,
    autoretry_for=(StageExecutionError,),
    retry_backoff=True,
    retry_backoff_max=60,
    retry_jitter=True,
    max_retries=MAX_STAGE_RETRIES,
)
def run_execution(self, execution_id: str) -> dict:
    db = get_sync_db()
    exec_uuid = uuid.UUID(execution_id)

    try:
        execution = repo.get_execution(db, exec_uuid)
        if execution is None:
            raise ValueError(f"Execution {execution_id} not found")

        workflow = db.get(Workflow, execution.workflow_id)
        if workflow is None:
            raise ValueError(f"Workflow {execution.workflow_id} not found")
        stages = (
            sorted(workflow.stage_definitions, key=lambda s: s.get("order", 0))
            or workflow.stage_definitions
        )

        if execution.status in (ExecutionStatus.PENDING, ExecutionStatus.QUEUED):
            execution = repo.update_execution_status(
                db, execution, status=ExecutionStatus.RUNNING, started_at=datetime.utcnow()
            )
            _publish_execution_update(execution)
            log = repo.add_log(
                db, execution_id=exec_uuid, message="Execution started", level=LogLevel.INFO
            )
            _publish_log(exec_uuid, log)
            db.commit()

        stage_outputs: dict[str, dict] = {}

        for order, stage in enumerate(stages):
            stage_key = stage["key"]

            # Celery re-invokes this task from the top on task-level retry (raised below), so
            # stages that already succeeded in a prior attempt must be skipped, not redone.
            already_succeeded = repo.get_succeeded_step(
                db, execution_id=exec_uuid, stage_key=stage_key
            )
            if already_succeeded is not None:
                stage_outputs[stage_key] = already_succeeded.output_payload or {}
                continue

            attempt = repo.next_attempt_number(db, execution_id=exec_uuid, stage_key=stage_key)

            step = repo.create_step(
                db, execution_id=exec_uuid, stage_key=stage_key, stage_order=order, attempt=attempt
            )
            db.commit()
            _publish_step_update(exec_uuid, step)
            log = repo.add_log(
                db,
                execution_id=exec_uuid,
                execution_step_id=step.id,
                message=f"Stage '{stage_key}' started (attempt {attempt})",
            )
            db.commit()
            _publish_log(exec_uuid, log)

            try:
                output = simulate(
                    stage_key,
                    attempt=attempt,
                    failure_rate=stage.get("failure_rate", 0.0),
                    min_duration_ms=stage.get("min_duration_ms", 300),
                    max_duration_ms=stage.get("max_duration_ms", 1200),
                )
            except StageExecutionError as exc:
                step = repo.finish_step(db, step, status=StepStatus.FAILED, error_message=str(exc))
                db.commit()
                _publish_step_update(exec_uuid, step)
                log = repo.add_log(
                    db,
                    execution_id=exec_uuid,
                    execution_step_id=step.id,
                    level=LogLevel.ERROR,
                    message=str(exc),
                )
                db.commit()
                _publish_log(exec_uuid, log)

                if attempt < MAX_STAGE_RETRIES:
                    execution = repo.update_execution_status(
                        db, execution, status=ExecutionStatus.RETRYING
                    )
                    db.commit()
                    _publish_execution_update(execution)
                    raise
                else:
                    execution = repo.update_execution_status(
                        db,
                        execution,
                        status=ExecutionStatus.FAILED,
                        finished_at=datetime.utcnow(),
                        error_message=str(exc),
                    )
                    db.commit()
                    _publish_execution_update(execution)
                    return {"status": "failed", "stage": stage_key}

            step = repo.finish_step(db, step, status=StepStatus.SUCCEEDED, output_payload=output)
            db.commit()
            _publish_step_update(exec_uuid, step)
            log = repo.add_log(
                db,
                execution_id=exec_uuid,
                execution_step_id=step.id,
                message=f"Stage '{stage_key}' completed",
            )
            db.commit()
            _publish_log(exec_uuid, log)
            stage_outputs[stage_key] = output

        execution = repo.update_execution_status(
            db,
            execution,
            status=ExecutionStatus.SUCCEEDED,
            finished_at=datetime.utcnow(),
            result_payload={"stages": stage_outputs},
        )
        db.commit()
        _publish_execution_update(execution)
        log = repo.add_log(db, execution_id=exec_uuid, message="Execution completed")
        db.commit()
        _publish_log(exec_uuid, log)

        return {"status": "succeeded"}
    finally:
        db.close()
