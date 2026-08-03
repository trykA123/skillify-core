#!/usr/bin/env bash
set -euo pipefail

# publish.sh — explicit, owner-triggered publish from skillify-core (private)
# to trykA123/skillify (public). The private repo is the single source of
# truth; skills change rarely, and a privacy bug must never auto-push.
#
# History isolation: file-copies only. Every public commit is the single
# squash "sync from skillify-core @ <sha>". Never subtree push, never fork,
# never branch push (the public repo is FRESH; verify with a failing
# `git merge-base` across the two repos).
#
# Usage:
#   ./publish.sh --dry-run   # stage into .publish-staging/ + privacy scan;
#                            # no clone, no commit, no push
#   ./publish.sh             # clone/fetch ../skillify-public, stage, commit,
#                            # push, then verify against a fresh clone

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MANIFEST="$REPO_ROOT/publish-manifest.txt"
OVERLAY="$REPO_ROOT/public-overlay"
PUBLIC_REPO="git@github.com:trykA123/skillify.git"
PUBLIC_DIR="$REPO_ROOT/../skillify-public"
DRY_RUN=0
if [[ "${1:-}" == "--dry-run" ]]; then DRY_RUN=1; fi

# Section 1.6 forbidden-token regex — must return 0 matches on the staged tree.
# (trykA123 is allowed — already a public handle.)
FORBIDDEN_RE='promptify|explainify|game-layer|game-render|progress\.json|progress\.html|RATINGS-|SKILLMAP|fleet-config|recordify-curation|work-identifiers|seed\.mjs|\.agents/learnings|/mnt/|TrueHL|skillmap|seed-watch|tdarr|homelab'

# 1. require a clean private worktree; record the SHA being published
if [[ -n "$(git -C "$REPO_ROOT" status --porcelain)" ]]; then
  echo "publish: private worktree is not clean — commit or stash first" >&2
  exit 1
fi
SHA="$(git -C "$REPO_ROOT" rev-parse HEAD)"
SHORT="$(git -C "$REPO_ROOT" rev-parse --short HEAD)"

# 2. choose the staging target
if [[ "$DRY_RUN" -eq 1 ]]; then
  STAGE="$REPO_ROOT/.publish-staging"
  rm -rf "$STAGE"
  mkdir -p "$STAGE"
else
  if [[ -d "$PUBLIC_DIR/.git" ]]; then
    git -C "$PUBLIC_DIR" fetch origin
    if git -C "$PUBLIC_DIR" rev-parse --verify origin/main >/dev/null 2>&1; then
      git -C "$PUBLIC_DIR" checkout -B main origin/main
    fi
  else
    git clone "$PUBLIC_REPO" "$PUBLIC_DIR"
  fi
  STAGE="$PUBLIC_DIR"
  # wipe everything except .git — the staged tree is EXACTLY manifest + overlay,
  # so no stale file can ever linger in the public repo
  find "$STAGE" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
fi

# 3. copy manifest paths, then the overlay on top
while IFS= read -r line; do
  [[ -z "$line" || "$line" == \#* ]] && continue
  src="${line%% -> *}"
  dst="${line##* -> }"
  src="$(printf '%s' "$src" | xargs)"; src="${src%/}"
  dst="$(printf '%s' "$dst" | xargs)"; dst="${dst%/}"
  if [[ ! -d "$REPO_ROOT/$src" ]]; then
    echo "publish: manifest source missing: $src" >&2
    exit 1
  fi
  mkdir -p "$STAGE/$dst"
  cp -r "$REPO_ROOT/$src/." "$STAGE/$dst/"
done < "$MANIFEST"
cp -r "$OVERLAY/." "$STAGE/"

# 4. privacy scan — the hard line; any match aborts the publish
echo "publish: privacy scan over $(find "$STAGE" -type f | wc -l) staged files…"
if grep -rInE "$FORBIDDEN_RE" "$STAGE"; then
  echo "publish: PRIVACY SCAN FAILED — forbidden tokens above; aborting" >&2
  exit 1
fi
echo "publish: privacy scan clean (0 matches)"

# 5. syntax-check the public installer
bash -n "$STAGE/install.sh"
echo "publish: bash -n install.sh OK"

# 6. commit + push (real mode only), then verify against a fresh clone
if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "publish: DRY RUN staged at $STAGE (from $SHORT) — nothing cloned, committed, or pushed"
  exit 0
fi

git -C "$STAGE" add -A
if [[ -z "$(git -C "$STAGE" status --porcelain)" ]]; then
  echo "publish: nothing to sync — public checkout already matches $SHORT"
  exit 0
fi
git -C "$STAGE" commit -m "sync from skillify-core @ $SHORT"
git -C "$STAGE" push origin main

VERIFY_DIR="$(mktemp -d)"
trap 'rm -rf "$VERIFY_DIR"' EXIT
git clone -q "$PUBLIC_REPO" "$VERIFY_DIR"
diff -r -x .git "$STAGE" "$VERIFY_DIR"
echo "publish: OK — $SHORT synced to $PUBLIC_REPO (fresh-clone diff empty)"
