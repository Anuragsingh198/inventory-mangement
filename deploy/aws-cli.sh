#!/usr/bin/env bash
# Project-local AWS CLI via Docker — no global install, no aws configure.
set -euo pipefail

DEPLOY_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="${DEPLOY_DIR}/aws.env.local"

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a && source "$ENV_FILE" && set +a
fi

: "${AWS_REGION:?Set AWS_REGION in deploy/aws.env.local}"
: "${AWS_ACCESS_KEY_ID:?Set AWS_ACCESS_KEY_ID in deploy/aws.env.local}"
: "${AWS_SECRET_ACCESS_KEY:?Set AWS_SECRET_ACCESS_KEY in deploy/aws.env.local}"

exec docker run --rm -i \
  -e AWS_ACCESS_KEY_ID \
  -e AWS_SECRET_ACCESS_KEY \
  -e AWS_SESSION_TOKEN \
  -e AWS_DEFAULT_REGION="${AWS_REGION}" \
  amazon/aws-cli:2.27.0 "$@"
