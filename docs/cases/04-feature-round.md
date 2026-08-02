# Case 04 — The feature round

**Status:** ✅ complete · **Fleet:** 5 spawns (planner @ qwen-xhigh, worker, reviewer, 1 repair) · **Result:** 7 features, 7 atomic commits, v1.0.18 → v1.0.25, deployed

## The docket (all delivered)

1. **The tdarr gain chart** — the owner's priority: dual-axis line chart, cumulative transcode gain vs the 16TB HDD ceiling, plus daily transcoded volume; week/month/year filter re-buckets both lines
2. **Job stats page** — `/stats` revived: status donut + top-jobs bar + KPI tiles
3. **Dropdown nav** — Brief / Scripts / Media / Stats moved into the great-menu with divider sections, live badges preserved
4. **No search** — command palette removed entirely (component + trigger + shortcut)
5. **Seed-watch tab in Media** — run briefs, chips, mode banner, Pager; plus the script now POSTs telemetry to the dashboard (verified end-to-end)
6. **Pagination audit** — no infinite scroll anywhere; all lists paginated
7. **4K availability fix** — `is4k` column + sync/webhook capture + card badge; a bounded extension of the contract layer

## The catch

The reviewer found a **real math bug** in the year-view cumulative gain bucketing (undercount — data dropped in aggregation). One repair round fixed it; the orchestrator re-verified by replicating the math (full-window total).

## Lessons

- Read-only review caught a numbers bug the tests didn't — verification against the *meaning* of the data, not just the shape.
- The bounded is4k change (one column + two capture points) shows a contract layer can be extended safely when the scope is named.
- The fleet now monitors its own watcher: seed-watch runs POST into the dashboard the fleet built.

## Artifacts

- 7 commits (`9846618` → `993d822`), v1.0.25 deployed, seed-watch timer confirmed feeding the new tab
