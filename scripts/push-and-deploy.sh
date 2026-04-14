#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEFAULT_BRANCH="main"
DEFAULT_REMOTE_PATH="/home/ubuntu/gstore-warranty-portal"
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

if [[ -z "$CURRENT_BRANCH" ]]; then
  echo "Could not determine current git branch." >&2
  exit 1
fi

if [[ "$CURRENT_BRANCH" != "$BRANCH" ]]; then
  echo "Current branch is '$CURRENT_BRANCH', but deployment branch is '$BRANCH'." >&2
  echo "Switch branches or rerun with: $0 --branch $CURRENT_BRANCH" >&2
  exit 1
fi

if [[ -n "$(git status --short --untracked-files=no)" ]]; then
  echo "Working tree is not clean. Commit or stash changes before deployment." >&2
  git status --short --untracked-files=no
  exit 1
fi

echo "Building locally for prebuilt deployment..."
npm run build:backend
npm run build:frontend
date +%s > backend/dist/.build-timestamp

if [[ "$SKIP_PUSH" -eq 0 ]]; then
  echo "Pushing '$BRANCH' to origin..."
  git push origin "$BRANCH"
else
  echo "Skipping git push."
fi

REMOTE_PREP_CMD=$(cat <<EOF
set -euo pipefail
cd "$REMOTE_PATH"
git checkout -- backend/dist frontend/build
git fetch origin
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"
EOF
)

echo "Preparing remote checkout on ${SERVER_USER}@${SERVER_HOST}:${REMOTE_PATH}..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "${SERVER_USER}@${SERVER_HOST}" "$REMOTE_PREP_CMD"

echo "Syncing prebuilt artifacts to ${SERVER_USER}@${SERVER_HOST}:${REMOTE_PATH}..."
rsync -az --delete -e "ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no" \
  "$ROOT_DIR/backend/dist/" "${SERVER_USER}@${SERVER_HOST}:${REMOTE_PATH}/backend/dist/"
rsync -az --delete -e "ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no" \
  "$ROOT_DIR/frontend/build/" "${SERVER_USER}@${SERVER_HOST}:${REMOTE_PATH}/frontend/build/"

REMOTE_CMD=$(cat <<EOF
set -euo pipefail
cd "$REMOTE_PATH"
docker compose -f docker-compose.prod.prebuilt.yml up -d db
docker compose -f docker-compose.prod.prebuilt.yml up -d --build backend
docker compose -f docker-compose.prod.prebuilt.yml up -d frontend
docker compose ps
EOF
)

echo "Deploying on ${SERVER_USER}@${SERVER_HOST}:${REMOTE_PATH}..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "${SERVER_USER}@${SERVER_HOST}" "$REMOTE_CMD"

echo "Deployment finished."
