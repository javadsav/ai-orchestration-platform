# AI Orchestration Platform

A miniature production system for defining, queuing, executing, and monitoring
multi-stage computational workflows — built to showcase distributed-systems
engineering, not just CRUD.

A **Workflow** describes an ordered pipeline of stages (e.g. preprocessing →
feature extraction → AI analysis → result generation → post-processing). Each
**Execution** is a run of a workflow: it is queued onto RabbitMQ, picked up by
a Celery worker, and processed stage by stage with persisted state, retries
with backoff, and structured logs. Progress is pushed to the browser live over
a WebSocket as the worker processes each stage — no polling.

## Architecture

```
┌───────────┐      HTTP / WS      ┌─────────────┐
│  Next.js  │◄───────────────────►│   FastAPI   │
│ frontend  │                     │   backend   │
└───────────┘                     └──────┬──────┘
                                          │ enqueue task            ▲ read/write
                                          ▼                         │
                                   ┌─────────────┐           ┌──────┴──────┐
                                   │  RabbitMQ   │           │  PostgreSQL │
                                   │  (broker)   │           │ (source of  │
                                   └──────┬──────┘           │   truth)    │
                                          │ deliver task      └──────┬──────┘
                                          ▼                          │
                                   ┌─────────────┐   write per stage │
                                   │Celery worker│───────────────────┘
                                   │(run_execution)
                                   └──────┬──────┘
                                          │ publish progress event
                                          ▼
                                   ┌─────────────┐   subscribe   ┌─────────────┐
                                   │    Redis    │──────────────►│   FastAPI   │
                                   │  (pub/sub + │               │  WebSocket  │
                                   │Celery result │              │  endpoint   │
                                   │   backend)  │               └─────────────┘
                                   └─────────────┘
```

### Why Redis for worker → browser progress delivery

The Celery worker and the FastAPI process are separate processes (separate
containers, potentially separate hosts). Getting a stage-completed event from
the worker to a browser tab requires *some* transport between them. Three
options were considered:

- **RabbitMQ topic exchange, consumed directly by FastAPI** — rejected as the
  primary transport: it entangles a per-WebSocket-connection AMQP consumer
  lifecycle with the broker that's supposed to be focused on task dispatch,
  and every horizontally-scaled FastAPI replica would need its own queue bound
  to the exchange.
- **Postgres `LISTEN`/`NOTIFY`** — rejected as primary: an 8000-byte payload
  cap, no delivery guarantee across reconnects, and it loads high-frequency
  progress chatter onto the same connection pool as the durable data.
- **Redis pub/sub (chosen)** — purpose-built ephemeral fan-out with trivial
  multi-subscriber support. It also serves as the Celery result backend, so
  it isn't infrastructure added for a single purpose.

Postgres remains the durable source of truth for every stage transition (a
reconnecting or late-joining client always gets a correct snapshot on
connect); Redis pub/sub is purely the low-latency delta transport for
already-connected clients.

## Stack

| Layer          | Choice                                              |
|----------------|------------------------------------------------------|
| Frontend       | Next.js 15 (App Router), TypeScript, React 19        |
| Backend API    | FastAPI, Python 3.12                                  |
| Database       | PostgreSQL, SQLAlchemy 2.0 (async) + Alembic          |
| Queue broker   | RabbitMQ                                              |
| Task worker    | Celery                                                |
| Pub/sub + cache| Redis                                                 |

## Running locally

```bash
cp .env.example .env
docker compose up --build
```

This brings up Postgres, RabbitMQ, Redis, the FastAPI backend (migrations run
automatically on boot), a Celery worker, and the Next.js frontend.

Seed a demo workflow:

```bash
docker compose run --rm backend python scripts/seed.py
```

### Live-reload while developing

`docker-compose.override.yml` is picked up automatically by `docker compose up`
and gives each service live reload:

- **backend** — bind-mounts `backend/app` and runs `uvicorn --reload`; edits
  take effect immediately.
- **worker** — same bind mount, but Celery does not hot-reload code; after
  editing a task, run `docker compose restart worker`.
- **frontend** — bind-mounts the whole `frontend/` directory and runs
  `next dev` instead of a production build, so edits hot-reload in the
  browser. `node_modules` and `.next` are kept in named volumes so the host's
  install doesn't shadow the container's.

To run the production images instead (e.g. to sanity-check a deploy), ignore
the override: `docker compose -f docker-compose.yml up --build`.

Then open http://localhost:3000, trigger the seeded workflow from the
Workflows page, and open its Execution Detail page to watch it move through
each stage live.

## Development

Backend:

```bash
cd backend
pip install -e ".[dev]"
ruff check . && black --check . && mypy app
pytest
```

Frontend:

```bash
cd frontend
npm install
npm run lint && npx tsc --noEmit
npm run test
```

## Project layout

See [`frontend/`](frontend/) and [`backend/`](backend/) for the respective
app source trees. Key backend modules:

- `app/db/models/` — SQLAlchemy models (workflows, executions, execution
  steps, execution logs, queue events).
- `app/worker/tasks.py` — the `run_execution` Celery task driving stages.
- `app/api/routers/ws.py` — the WebSocket endpoint streaming live progress.
- `app/services/progress_broadcaster.py` — the Redis publish/subscribe glue.
