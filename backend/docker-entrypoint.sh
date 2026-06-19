#!/bin/sh
set -e

echo "Running database migrations..."
alembic upgrade head

echo "Starting Ventorio API..."
exec python -m uvicorn app.main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --workers 2 \
  --proxy-headers \
  --forwarded-allow-ips="*"
