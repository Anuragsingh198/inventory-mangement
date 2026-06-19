#!/usr/bin/env bash
# Build backend + frontend and push to ECR (this project only).
#
# Setup once:
#   cp deploy/aws.env.example deploy/aws.env.local
#   # edit deploy/aws.env.local with keys from IAM Console
#
# Run:
#   ./deploy/build-push-ecr.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEPLOY_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="${DEPLOY_DIR}/aws.env.local"
AWS="${DEPLOY_DIR}/aws-cli.sh"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing ${ENV_FILE}"
  echo "Copy deploy/aws.env.example to deploy/aws.env.local and add your keys."
  exit 1
fi

# shellcheck disable=SC1090
set -a && source "$ENV_FILE" && set +a

AWS_REGION="${AWS_REGION:?Set AWS_REGION in deploy/aws.env.local}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:?Set AWS_ACCOUNT_ID in deploy/aws.env.local}"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
BACKEND_REPO="${BACKEND_REPO:-inventory-backend}"
FRONTEND_REPO="${FRONTEND_REPO:-inventory-frontend}"
TAG="${TAG:-latest}"

echo "Logging in to ECR (${ECR_REGISTRY})..."
"$AWS" ecr get-login-password --region "$AWS_REGION" \
  | docker login --username AWS --password-stdin "$ECR_REGISTRY"

for REPO in "$BACKEND_REPO" "$FRONTEND_REPO"; do
  "$AWS" ecr describe-repositories --repository-names "$REPO" --region "$AWS_REGION" >/dev/null 2>&1 \
    || "$AWS" ecr create-repository --repository-name "$REPO" --region "$AWS_REGION"
done

echo "Building backend..."
docker build -t "${ECR_REGISTRY}/${BACKEND_REPO}:${TAG}" "${ROOT}/backend"

echo "Building frontend..."
docker build \
  --build-arg VITE_API_URL="" \
  -t "${ECR_REGISTRY}/${FRONTEND_REPO}:${TAG}" \
  "${ROOT}/frontend"

echo "Pushing images..."
docker push "${ECR_REGISTRY}/${BACKEND_REPO}:${TAG}"
docker push "${ECR_REGISTRY}/${FRONTEND_REPO}:${TAG}"

echo ""
echo "Done. Images pushed:"
echo "  ${ECR_REGISTRY}/${BACKEND_REPO}:${TAG}"
echo "  ${ECR_REGISTRY}/${FRONTEND_REPO}:${TAG}"
echo ""
echo "On EC2 (with IAM role attached), run:"
echo "  ./deploy/ec2-run.sh"
