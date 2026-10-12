#!/usr/bin/env bash
# Runs ON THE SERVER — scripts/deploy.sh pipes it over SSH (`bash -s -- <new> <fallback>`).
# Points compose at <new>, waits for /healthz, and falls back to <fallback> if the new
# version fails to start or never gets healthy. Exits non-zero on any failure.
#
# Deliberately NOT `set -e`: a failing `docker compose up` must still reach the rollback.
set -uo pipefail

APP_DIR="${APP_DIR:-/opt/gefahrgut}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3000/healthz}"
HEALTH_TRIES="${HEALTH_TRIES:-30}"
HEALTH_SLEEP="${HEALTH_SLEEP:-1}"

NEW="${1:?usage: remote-switch.sh <new-tag> [fallback-tag]}"
FALLBACK="${2:-}"
cd "$APP_DIR" || { echo "cannot cd to $APP_DIR" >&2; exit 1; }

switch_to() {
  echo "IMAGE_TAG=$1" > .env
  docker compose up -d
}

healthy() {
  for _ in $(seq 1 "$HEALTH_TRIES"); do
    curl -fsS "$HEALTH_URL" >/dev/null 2>&1 && return 0
    sleep "$HEALTH_SLEEP"
  done
  return 1
}

if switch_to "$NEW" && healthy; then
  echo "healthy: $NEW"
  # only now is the old version a valid rollback target
  if [ -n "$FALLBACK" ]; then echo "$FALLBACK" > .previous-tag; fi
  exit 0
fi

echo "FAILED: $NEW did not start or never answered /healthz — last log lines:" >&2
docker compose logs --tail 60 app >&2 || true

if [ -z "$FALLBACK" ]; then
  echo "nothing to roll back to (first deploy) — the app is down" >&2
  exit 1
fi

if switch_to "$FALLBACK" && healthy; then
  echo "rolled back to $FALLBACK" >&2
else
  echo "ROLLBACK TO $FALLBACK FAILED TOO — check 'docker compose logs' on the server" >&2
fi
exit 1
