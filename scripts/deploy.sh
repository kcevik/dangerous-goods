#!/usr/bin/env bash
# Build the app image here, ship it to the VPS over SSH, switch the container,
# verify /healthz, and roll back automatically if the new version is unhealthy.
#
#   pnpm deploy:test       build + ship + switch
#   pnpm deploy:rollback   switch back to the previous image
#
# Needs .deploy.env (see .deploy.env.example) and the public Supabase values in .env.
set -euo pipefail
cd "$(dirname "$0")/.."

[ -f .deploy.env ] || { echo "Missing .deploy.env — copy .deploy.env.example and fill it in." >&2; exit 1; }
# shellcheck disable=SC1091
source .deploy.env
: "${DEPLOY_HOST:?set DEPLOY_HOST in .deploy.env}"
: "${DEPLOY_USER:?set DEPLOY_USER in .deploy.env}"
REMOTE="$DEPLOY_USER@$DEPLOY_HOST"
APP_DIR=/opt/gefahrgut

env_value() { grep -E "^$1=" .env | tail -n 1 | cut -d= -f2-; }

# Runs on the server: point compose at $1, wait for /healthz, fall back to $2 on failure.
REMOTE_SWITCH='
set -euo pipefail
cd '"$APP_DIR"'
NEW="$1"; FALLBACK="${2:-}"
echo "IMAGE_TAG=$NEW" > .env
docker compose up -d
for _ in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:3000/healthz >/dev/null 2>&1; then
    echo "healthy: $NEW"
    exit 0
  fi
  sleep 1
done
echo "UNHEALTHY: $NEW — last log lines:" >&2
docker compose logs --tail 60 app >&2 || true
if [ -n "$FALLBACK" ]; then
  echo "IMAGE_TAG=$FALLBACK" > .env
  docker compose up -d
  echo "rolled back to $FALLBACK" >&2
fi
exit 1
'

deploy() {
  local sha tag current
  sha="$(git rev-parse --short HEAD)"
  tag="$(date +%Y%m%d-%H%M)-$sha"
  echo "Shipping commit $sha as gefahrgut-app:$tag"
  echo "Uncommitted changes that ship too:"; git status --short || true

  docker build \
    --build-arg PUBLIC_SUPABASE_URL="$(env_value PUBLIC_SUPABASE_URL)" \
    --build-arg PUBLIC_SUPABASE_PUBLISHABLE_KEY="$(env_value PUBLIC_SUPABASE_PUBLISHABLE_KEY)" \
    -t "gefahrgut-app:$tag" .

  echo "Uploading image (this takes a moment)…"
  docker save "gefahrgut-app:$tag" | gzip | ssh "$REMOTE" 'gunzip | docker load'

  current="$(ssh "$REMOTE" "grep -s '^IMAGE_TAG=' $APP_DIR/.env | cut -d= -f2" || true)"
  if [ -n "$current" ]; then
    ssh "$REMOTE" "echo '$current' > $APP_DIR/.previous-tag"
  fi

  ssh "$REMOTE" "bash -s -- '$tag' '$current'" <<<"$REMOTE_SWITCH"

  # keep the newest three images (tags start with a timestamp, so they sort by age)
  ssh "$REMOTE" "docker image ls gefahrgut-app --format '{{.Tag}}' | sort -r | tail -n +4 | xargs -r -I{} docker image rm gefahrgut-app:{}" || true
}

rollback() {
  local previous current
  previous="$(ssh "$REMOTE" "cat $APP_DIR/.previous-tag 2>/dev/null" || true)"
  [ -n "$previous" ] || { echo "No previous image recorded — nothing to roll back to." >&2; exit 1; }
  current="$(ssh "$REMOTE" "grep -s '^IMAGE_TAG=' $APP_DIR/.env | cut -d= -f2" || true)"
  echo "Rolling back from $current to $previous"
  ssh "$REMOTE" "bash -s -- '$previous' ''" <<<"$REMOTE_SWITCH"
  ssh "$REMOTE" "echo '$current' > $APP_DIR/.previous-tag"
}

case "${1:-}" in
  deploy) deploy ;;
  rollback) rollback ;;
  *) echo "usage: $0 deploy|rollback" >&2; exit 2 ;;
esac
