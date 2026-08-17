import pytest

from app.db.models.execution import Execution, ExecutionStatus
from app.db.models.execution_step import ExecutionStep, StepStatus
from app.db.models.workflow import Workflow
from app.db.session import SyncSessionLocal
from app.worker.tasks import run_execution

STAGES = [
    {
        "key": "stage_one",
        "label": "Stage One",
        "order": 0,
        "failure_rate": 0.0,
        "min_duration_ms": 1,
        "max_duration_ms": 5,
    },
    {
        "key": "stage_two",
        "label": "Stage Two",
        "order": 1,
        "failure_rate": 0.0,
        "min_duration_ms": 1,
        "max_duration_ms": 5,
    },
]


@pytest.fixture
def seeded_execution():
    with SyncSessionLocal() as db:
        workflow = Workflow(name="Sync Test Workflow", stage_definitions=STAGES)
        db.add(workflow)
        db.flush()

        execution = Execution(workflow_id=workflow.id, status=ExecutionStatus.QUEUED)
        db.add(execution)
        db.commit()
        db.refresh(execution)
        execution_id = execution.id

    yield execution_id


def test_run_execution_succeeds(seeded_execution, monkeypatch):
    # Progress publishing needs a reachable Redis; avoid depending on it for this unit test.
    monkeypatch.setattr("app.worker.tasks.publish_event", lambda *a, **k: None)

    result = run_execution.apply(args=[str(seeded_execution)]).get()
    assert result == {"status": "succeeded"}

    with SyncSessionLocal() as db:
        execution = db.get(Execution, seeded_execution)
        assert execution.status == ExecutionStatus.SUCCEEDED
        assert execution.result_payload is not None

        steps = db.query(ExecutionStep).filter_by(execution_id=seeded_execution).all()
        assert len(steps) == 2
        assert all(s.status == StepStatus.SUCCEEDED for s in steps)
