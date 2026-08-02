# Case 03 — The agents tab build

**Status:** ✅ complete · **Fleet:** 5 spawns (planner @ qwen-xhigh, worker, reviewer → repair → reviewer) · **Result:** +316 / −0 lines, skills pane byte-identical

## The run

A third orchestration added the "Agents" tab to the docs site: planner at qwen xhigh produced the design spec, a worker implemented four pure-insertion hunks (tab bar, agents pane with delegation-pipeline SVG + models table + safety principles + 10 dossiers), a reviewer verified.

## The catch

The reviewer's first round found one blocker: **4 fallback cells in the models table said `deepseek-v4-pro`, contradicting the fleet config — which had been changed mid-pipeline** (a concurrent commit switched the fleet to qwen+flash only). One repair round fixed the 5 strings; round 2 passed 10/10 rows against the authoritative config.

## Lessons

- Concurrent config changes reach the docs page faster than the page knows — verification against the *authoritative source* at review time is what catches it.
- Pure-addition editing (0 deletions in existing panes) makes "did we break the skills page?" answerable by byte-identity.

## Artifacts

- `docs/index.html` +316/−0, committed `e4f2e0c`
