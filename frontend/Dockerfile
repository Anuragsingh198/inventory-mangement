# syntax=docker/dockerfile:1
# Multi-stage build: compile React app, then serve with nginx (production EC2 / ECR).

# --- Stage 1: build static assets ---
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (cached layer when only source changes)
COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Production builds use same-origin API URLs (see src/api/client.ts).
# Override only if API is on a different host: --build-arg VITE_API_URL=https://api.example.com
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# --- Stage 2: production web server ---
FROM nginx:1.27-alpine AS runtime

# Remove default site; we ship our own config with SPA + API reverse proxy
RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx runs as root to bind port 80; only static files are served (no shell access)
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
