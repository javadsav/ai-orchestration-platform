import pytest


@pytest.mark.asyncio
async def test_health(client):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_create_and_list_workflow(client):
    payload = {
        "name": "Test Pipeline",
        "description": "A test workflow",
        "stage_definitions": [
            {"key": "stage_one", "label": "Stage One", "failure_rate": 0.0},
            {"key": "stage_two", "label": "Stage Two", "failure_rate": 0.0},
        ],
    }
    create_response = await client.post("/workflows", json=payload)
    assert create_response.status_code == 201
    created = create_response.json()
    assert created["name"] == "Test Pipeline"
    assert len(created["stage_definitions"]) == 2

    list_response = await client.get("/workflows")
    assert list_response.status_code == 200
    body = list_response.json()
    assert body["total"] >= 1
    assert any(w["id"] == created["id"] for w in body["items"])


@pytest.mark.asyncio
async def test_get_workflow_not_found(client):
    response = await client.get("/workflows/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404
