#!/bin/sh
set -e

if [ "$1" = "uvicorn" ]; then
    echo "Running database migrations..."
    alembic upgrade head
fi

exec "$@"
