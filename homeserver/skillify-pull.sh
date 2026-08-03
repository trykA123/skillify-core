#!/usr/bin/env bash
set -euo pipefail

# skillify-pull.sh — homeserver ingest gate for skillify-core (spec §2.1/§2.7/§2.9).
#
# Runs on a timer (skillify-pull.timer, 10 min):
#   fetch → HEAD unchanged? exit 0 (no restart churn)
#         → git pull --ff-only (never force; divergence → alert + exit)
#         → RE-AUDIT with the SAME audit runner CI uses
#         → audit clean → restart the map container; boot log = ingest proof
#         → audit FAILED → alert, NO restart — last-good map keeps serving
#
# The re-audit is the ACTUAL ingest gate: the read-only deploy key cannot see
# CI status, so a leak can never be ingested even if CI was bypassed or red
# (R5 — do not simplify away).
#
# All locations are overridable via environment (unit Environment= or
# EnvironmentFile=), to be confirmed once the TrueHL restructure settles.

REPO_DIR="${SKILLIFY_CORE_DIR:-/opt/skillify-core}"
DEPLOY_KEY="${SKILLIFY_DEPLOY_KEY:-$HOME/.ssh/skillify_core_ro}"
COMPOSE_FILE="${SKILLIFY_COMPOSE_FILE:-/mnt/Sabrent/homelab/TrueHL/apps/dashboard/docker-compose.yml}"
SKILLMAP_SERVICE="${SKILLMAP_SERVICE:-skillmap}"   # compose service name (app codename: kokoro)
LOCK_FILE="${SKILLIFY_LOCK_FILE:-/tmp/skillify-pull.lock}"
NTFY_URL="${NTFY_URL:-}"

alert() {
  local msg="skillify-pull: $1"
  echo "$msg" >&2
  if [ -n "$NTFY_URL" ]; then
    curl -sS -o /dev/null --max-time 10 "$NTFY_URL" \
      -H "Title: skillify-pull FAILED" -H "Priority: urgent" -H "Tags: warning,git" \
      --data-binary "$msg" || true
  fi
}

# no overlapping runs
exec 9>"$LOCK_FILE"
flock -n 9 || exit 0

cd "$REPO_DIR"
export GIT_SSH_COMMAND="ssh -i $DEPLOY_KEY -o IdentitiesOnly=yes"

before="$(git rev-parse HEAD)"
git fetch origin main
after="$(git rev-parse origin/main)"
if [ "$before" = "$after" ]; then
  exit 0   # nothing new — no restart churn
fi

# never force, never commit; divergence → human look
if ! git pull --ff-only origin main; then
  alert "git pull --ff-only failed in $REPO_DIR — history diverged, human look required (no ingest)"
  exit 1
fi

# RE-AUDIT — the same script CI runs (post-move path). Host bun preferred;
# docker fallback per spec R8.
if command -v bun >/dev/null 2>&1; then
  audit() { bun teaching/recordify/audit-records.mjs records/; }
else
  audit() { docker run --rm -v "$REPO_DIR":/w -w /w oven/bun bun teaching/recordify/audit-records.mjs records/; }
fi
if ! audit; then
  alert "records audit FAILED after pull — last-good map keeps serving (no restart)"
  exit 1
fi

# clean + changed → restart the map; boot compile line = ingest proof
docker compose -f "$COMPOSE_FILE" restart "$SKILLMAP_SERVICE"
sleep 5
docker compose -f "$COMPOSE_FILE" logs --tail=40 "$SKILLMAP_SERVICE" 2>&1 | grep -m1 -i "compiled" || true
echo "skillify-pull: ingest OK — $(git rev-parse --short HEAD) audited clean, $SKILLMAP_SERVICE restarted"
