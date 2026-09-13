#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEFAULT_BRANCH="figma-redesign-staging"
DEFAULT_REMOTE_PATH="/home/ubuntu/gstore-warranty-portal-staging"
DEFAULT_SERVER_HOST="3.68.134.145"
DEFAULT_SERVER_USER="ubuntu"
DEFAULT_SSH_KEY="/tmp/codex_gstore_warranty_server_ed25519"

BRANCH="${BRANCH:-$DEFAULT_BRANCH}"
REMOTE_PATH="${REMOTE_PATH:-$DEFAULT_REMOTE_PATH}"
SERVER_HOST="${SERVER_HOST:-$DEFAULT_SERVER_HOST}"
SERVER_USER="${SERVER_USER:-$DEFAULT_SERVER_USER}"
SSH_KEY="${SSH_KEY:-$DEFAULT_SSH_KEY}"
SKIP_PUSH=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-push)
      SKIP_PUSH=1
      shift
      ;;
    --branch)
      BRANCH="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      echo "Usage: $0 [--branch <branch>] [--skip-push]" >&2
      exit 1
      ;;
  esac
done

cd "$ROOT_DIR"

if [[ ! -f "$SSH_KEY" ]]; then
  echo "SSH key not found: $SSH_KEY" >&2
  exit 1
fi

CURRENT_BRANCH="$(git branch --show-current)"

if [[ "$CURRENT_BRANCH" != "$BRANCH" ]]; then
  echo "Current branch is '$CURRENT_BRANCH', but staging branch is '$BRANCH'." >&2
  exit 1
fi

if [[ -n "$(git status --short --untracked-files=no)" ]]; then
  echo "Working tree has tracked changes. Commit or stash them before staging deployment." >&2
  git status --short --untracked-files=no
  exit 1
fi

echo "Building staging frontend locally..."
npm run build:frontend

if [[ "$SKIP_PUSH" -eq 0 ]]; then
  echo "Pushing '$BRANCH' to origin..."
  git push origin "$BRANCH"
fi

REMOTE_PREP_CMD=$(cat <<EOF
set -euo pipefail
mkdir -p "$REMOTE_PATH/frontend/build"
EOF
)

echo "Preparing remote staging checkout on ${SERVER_USER}@${SERVER_HOST}:${REMOTE_PATH}..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "${SERVER_USER}@${SERVER_HOST}" "$REMOTE_PREP_CMD"

echo "Syncing staging frontend artifacts..."
rsync -az --delete -e "ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no" \
  "$ROOT_DIR/frontend/build/" "${SERVER_USER}@${SERVER_HOST}:${REMOTE_PATH}/frontend/build/"
rsync -az -e "ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no" \
  "$ROOT_DIR/frontend/nginx.staging.conf" "${SERVER_USER}@${SERVER_HOST}:${REMOTE_PATH}/frontend/nginx.staging.conf"
rsync -az -e "ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no" \
  "$ROOT_DIR/docker-compose.staging.yml" "${SERVER_USER}@${SERVER_HOST}:${REMOTE_PATH}/docker-compose.staging.yml"

REMOTE_DEPLOY_CMD=$(cat <<EOF
set -euo pipefail
cd "$REMOTE_PATH"
docker compose -p gstore-warranty-staging -f docker-compose.staging.yml up -d
docker compose -p gstore-warranty-staging -f docker-compose.staging.yml ps
EOF
)

echo "Starting staging frontend container..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "${SERVER_USER}@${SERVER_HOST}" "$REMOTE_DEPLOY_CMD"

echo "Staging deployment finished. Temporary direct URL: http://${SERVER_HOST}:3002"
