# Case 02 — The torrent seed-watch watcher

**Status:** ✅ complete · **Fleet:** 8 agents (scout, planner, 3× worker, 3× reviewer) · **Result:** one script + design doc + 97-case test harness, scheduled via systemd timer

## Context

The homelab torrent client seeds downloads while the media pipeline transcodes them to AV1. Once the AV1 copy exists, the original is only needed for seeding obligations. The owner wanted an automated lifecycle watcher: keep seeding while obligations demand it, then delete torrent + content — **but only ever after the AV1 copy is verified**.

## The rules (owner-locked)

- Safety gate (never delete when): no AV1 transcode exists for the content, torrent not finished, or HnR minimum seed time unmet
- Ratio ≥ 4.0 → delete
- Seed time > 60 days → delete
- Active leechers (≥2) → hold deletion; resume after 3 consecutive low-leecher days
- Sole seeder → cap extends 60 → 90 days
- Dry-run by default — no deletion until an explicit flag is set

## The run

Scout recon → planner design → worker implement → **three review rounds** (the loop earning its keep):

1. **REQUEST-CHANGES**: login detection was dead-on-arrival (the client returns HTTP 204 with an empty body, not the expected shape), and the basename matching join matched **0 of 300 torrents** — the media importer renames files on import, so names never line up.
2. **FIX**: login accepts 204/empty + session cookie; the matching join switched to **byte-exact size** — the download copy is the pre-transcode hardlink inode, so the transcode record's source size round-trips to exact bytes (68/68 unique matches, 0 collisions, all AV1-verified on disk).
3. **APPROVE-WITH-NITS** → final fixes (hold-state prefixes, state budget preserved across subshells) → **APPROVE**.

## Verification

- Offline: 97/97 tests (all rule branches, leecher-grace state machine, cross-seeds, login, size-join, content-missing, AV1-failure holds)
- Live dry-run (read-only): 301 torrents → 42 candidates, **233 held for no_av1** (the safety gate working), 1 content-missing, 1 leecher-hold, 0 errors, 0 deletions, idempotent across runs
- Scheduled: systemd timer every 30 min, `Persistent=true`, credentials sourced from the repo env file by the script itself

## Lessons

- "Never delete the only copy" must be **enforced by data**, not assumed by policy — the AV1 gate held 233 torrents.
- Matching by name dies the day an importer renames; matching by content identity (byte-exact size of the hardlinked inode) survives.
- Three review rounds caught real bugs each time — the loop is the product.

## Artifacts

- `seed-watch.sh` (watcher), `seed-watch-DESIGN.md`, 97-case test harness + fixtures — committed as one atomic commit
