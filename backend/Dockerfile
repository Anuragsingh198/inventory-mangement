# syntax=docker/dockerfile:1
# Production image for FastAPI backend (ECR / EC2). Database is external (RDS etc.) via DATABASE_URL.

FROM python:3.11-slim-bookworm

# PYTHONDONTWRITEBYTECODE: skip .pyc files (smaller image, fewer stale bytecode issues)
# PYTHONUNBUFFERED: stream logs immediately (required for Docker/CloudWatch)
# PIP_*: faster, smaller pip installs in CI/ECR builds
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# libpq5: PostgreSQL client library used by psycopg2 at runtime
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq5 \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system app \
    && useradd --system --gid app --home-dir /app app

# Install Python deps before copying app code (better Docker layer cache on rebuilds)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY alembic.ini .
COPY alembic ./alembic
COPY app ./app
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh \
    && chown -R app:app /app

# Run as non-root (security best practice on EC2/ECS/ECR)
USER app

# Uvicorn listens on 8000 inside the Docker network (nginx proxies public traffic)
EXPOSE 8000

# Health check for docker-compose / load balancers / ECS
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health')"

ENTRYPOINT ["/docker-entrypoint.sh"]
