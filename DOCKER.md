# Docker production deployment (AWS ECR + EC2)

This project runs **backend** and **frontend** in Docker. **PostgreSQL is not containerized** — use your existing `DATABASE_URL` from `backend/.env` (RDS, managed Postgres, etc.).

Public traffic hits **port 80** on the EC2 instance. Nginx serves the React app and proxies API calls to the backend on the internal Docker network.

---

## Quick EC2 steps

1. **Security group:** allow inbound **TCP 80** from `0.0.0.0/0` (and **22** for SSH).
2. **Install Docker** on EC2 (Amazon Linux 2023 example):
   ```bash
   sudo yum update -y
   sudo yum install -y docker
   sudo systemctl enable --now docker
   sudo usermod -aG docker ec2-user
   ```
3. **Clone repo** (or copy files) and create `backend/.env` with your real `DATABASE_URL` and secrets (same keys as `backend/.env.example`).
4. **Push images to ECR** (from your laptop or CI):
   ```bash
   export AWS_REGION=us-east-1
   export AWS_ACCOUNT_ID=123456789012
   chmod +x deploy/build-push-ecr.sh
   ./deploy/build-push-ecr.sh
   ```
5. **On EC2**, pull and run:
   ```bash
   export BACKEND_IMAGE=123456789012.dkr.ecr.us-east-1.amazonaws.com/inventory-backend:latest
   export FRONTEND_IMAGE=123456789012.dkr.ecr.us-east-1.amazonaws.com/inventory-frontend:latest
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
   docker compose -f docker-compose.prod.yml pull
   docker compose -f docker-compose.prod.yml up -d
   ```
6. Open `http://<EC2_PUBLIC_IP>` in a browser.

Optional: set `CORS_ORIGINS=http://<EC2_PUBLIC_IP>` in `backend/.env` if you ever expose the API on port 8000 directly.

---

## File reference (line-by-line)

### `backend/Dockerfile`

| Line | Purpose |
|------|---------|
| `# syntax=docker/dockerfile:1` | Enables modern Dockerfile features (BuildKit). |
| `FROM python:3.11-slim-bookworm` | Small, stable Python base image for production. |
| `ENV PYTHONDONTWRITEBYTECODE=1` | Avoids writing `.pyc` files inside the container. |
| `ENV PYTHONUNBUFFERED=1` | Logs appear immediately in `docker logs` / CloudWatch. |
| `ENV PIP_NO_CACHE_DIR=1` | Keeps image smaller after `pip install`. |
| `WORKDIR /app` | All commands run from `/app`. |
| `apt-get install libpq5` | PostgreSQL client library for `psycopg2` at runtime. |
| `groupadd/useradd app` | Creates a non-root user for security. |
| `COPY requirements.txt` + `pip install` | Installed in its own layer for faster rebuilds. |
| `COPY alembic*` / `COPY app` | Application code and migrations. |
| `COPY docker-entrypoint.sh` | Startup script (migrations + uvicorn). |
| `USER app` | Process does not run as root. |
| `EXPOSE 8000` | Documents the internal API port. |
| `HEALTHCHECK` | Docker marks container healthy when `/health` responds. |
| `ENTRYPOINT` | Runs migrations then starts uvicorn. |

### `backend/docker-entrypoint.sh`

| Line | Purpose |
|------|---------|
| `alembic upgrade head` | Applies DB migrations using `DATABASE_URL` from env. |
| `--host 0.0.0.0` | Listen on all interfaces inside the container (required for Docker networking). |
| `--workers 2` | Multiple worker processes for concurrent requests on EC2. |
| `--proxy-headers` | Trusts `X-Forwarded-*` headers from nginx. |

### `frontend/Dockerfile`

| Line | Purpose |
|------|---------|
| `FROM node:20-alpine AS builder` | Build stage — compiles TypeScript/Vite bundle. |
| `npm ci` | Reproducible install from lockfile. |
| `ARG VITE_API_URL=` | Build-time API base URL; empty = same-origin (nginx proxy). |
| `npm run build` | Produces static files in `dist/`. |
| `FROM nginx:1.27-alpine` | Final image is only nginx + static files (~25MB). |
| `COPY nginx.conf` | SPA routing + API reverse proxy config. |
| `COPY --from=builder /app/dist` | Copies built React app into nginx html root. |
| `EXPOSE 80` | Public HTTP port for the website. |
| `HEALTHCHECK` | Verifies nginx serves the homepage. |

### `frontend/nginx.conf`

| Block | Purpose |
|-------|---------|
| `listen 80` | Public website port (map to EC2 security group). |
| Security headers | Basic hardening for browser clients. |
| `gzip` | Compresses text/JS/CSS for faster loads. |
| `/assets/` cache | Vite hashed assets cached for 1 year. |
| `location ~ ^/(auth\|products\|...)` | Proxies API paths to `backend:8000` on Docker network. |
| `try_files ... /index.html` | React Router client-side navigation. |

### `docker-compose.prod.yml`

| Key | Purpose |
|-----|---------|
| `env_file: ./backend/.env` | Loads `DATABASE_URL`, `SECRET_KEY`, etc. — same as local dev. |
| `expose: 8000` (backend) | API only on internal network, not public. |
| `ports: 80:80` (frontend) | Only the website is publicly reachable. |
| `depends_on: service_healthy` | Frontend starts after backend passes health check. |
| `restart: unless-stopped` | Auto-restart after EC2 reboot or crash. |

---

## Local production test

```bash
# Ensure backend/.env has a reachable DATABASE_URL
docker compose -f docker-compose.prod.yml up --build
# Visit http://localhost
```
