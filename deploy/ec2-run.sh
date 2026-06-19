#!/usr/bin/env bash
# Run ON the EC2 instance — uses IAM role (no access keys, no aws configure).
#
# Prerequisites on EC2:
#   - IAM role with AmazonEC2ContainerRegistryReadOnly
#   - docker + docker compose installed
#   - docker-compose.prod.yml in project root
#   - backend/.env  (DATABASE_URL, SECRET_KEY, etc.)
#
# Optional: set region/account here or export before running.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:?Set AWS_ACCOUNT_ID (your 12-digit account id)}"
APP_DIR="${APP_DIR:-$(cd "${SCRIPT_DIR}/.." && pwd)}"

BACKEND_REPO="${BACKEND_REPO:-inventory-backend}"
FRONTEND_REPO="${FRONTEND_REPO:-inventory-frontend}"
TAG="${TAG:-latest}"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

export BACKEND_IMAGE="${ECR_REGISTRY}/${BACKEND_REPO}:${TAG}"
export FRONTEND_IMAGE="${ECR_REGISTRY}/${FRONTEND_REPO}:${TAG}"

cd "$APP_DIR"

echo "Logging in to ECR using EC2 IAM role..."
aws ecr get-login-password --region "$AWS_REGION" \
  | docker login --username AWS --password-stdin "$ECR_REGISTRY"

echo "Pulling images..."
docker compose -f docker-compose.prod.yml pull

echo "Starting containers..."
docker compose -f docker-compose.prod.yml up -d

echo ""
docker compose -f docker-compose.prod.yml ps
echo ""
echo "Test: curl http://localhost/health"
echo "Open: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo YOUR_EC2_IP)"
