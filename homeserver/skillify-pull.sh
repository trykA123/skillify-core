#!/usr/bin/env bash
set -euo pipefail

# skillify-pull.sh — homeserver ingest gate for skillify-core (spec §2.1/§2.7/§2.9).
#
# Runs on a timer (skillify-pull.timer, 10 min):
#   ff-only pull (divergence → alert + exit)
#   → INGEST MARKER check: marker == HEAD? exit 0 (already ingested — no churn)
#   → RE-AUDIT with the SAME audit runner CI uses
#   → audit clean → restart the map container; boot log = ingest proof
#   → audit FAILED → alert, NO restart — last-good map keeps serving
#
# The marker closes the LOCAL-COMMIT hole: orchestrator runs commit + push from
# this very clone, so the remote NEVER shows a delta — the old before==after
# check would exit 0 forever and the map would never recompile. The marker
# compares against the last INGESTED head instead (covers remote AND local).
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
INGEST_MARKER="${SKILLIFY_INGEST_MARKER:-$HOME/.local/state/skillify/ingested-head}"
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

# remote changes first (ff-only; divergence → human look)
if ! git pull --ff-only origin main; then
  alert "git pull --ff-only failed in $REPO_DIR — history diverged, human look required (no ingest)"
  exit 1
fi

head="$(git rev-parse HEAD)"
marker="$(cat "$INGEST_MARKER" 2>/dev/null || true)"
if [ "$marker" = "$head" ]; then
  exit 0   # this exact commit already ingested — no restart churn
fi

# RE-AUDIT — the same script CI runs (post-move path). Host bun preferred;
# docker fallback per spec R8.
if command -v bun >/dev/null 2>&1; then
  audit() { bun teaching/recordify/audit-records.mjs records/; }
else
  audit() { docker run --rm -v "$REPO_DIR":/w -w /w oven/bun bun teaching/recordify/audit-records.mjs records/; }
fi
if ! audit; then
  alert "records audit FAILED — last-good map keeps serving (no restart, marker untouched)"
  exit 1
fi

# clean + changed → restart the map; boot compile line = ingest proof
docker compose -f "$COMPOSE_FILE" restart "$SKILLMAP_SERVICE"
sleep 5
docker compose -f "$COMPOSE_FILE" logs --tail=40 "$SKILLMAP_SERVICE" 2>&1 | grep -m1 -i "compiled" || true
mkdir -p "$(dirname "$INGEST_MARKER")"
printf '%s\n' "$head" > "$INGEST_MARKER"
echo "skillify-pull: ingest OK — ${head:0:7} audited clean, $SKILLMAP_SERVICE restarted, marker written"
