---
id: lib-2026-08-04-name-the-1-percent-gaps-never-claim-perfect
date: 2026-08-04
valence: positive
category: process
status: seed
evidence:
  - session history + the homelab audit 99%-list
summary: Name the 1% gaps; never claim perfect.
tags: audit, honest-reporting, 99-percent, residuals
superseded_by: null
---

# Name the 1% gaps; never claim perfect

**Principle:** Name the 1% gaps; never claim perfect.

**Why:** The audit's target was named up front — 99%, not perfect — and the report closed with an explicit list of nine named gaps between now and perfect: the lint tool not installed, live-untested paths, an unscheduled update stack, a telemetry gap, missing fail-fast flags on pre-existing posts, a best-effort pre-commit, and no offline integration test at the main level. The watcher crash was root-caused to an uninitialized array under strict shell mode; the dry run never reached the failing block because it sat under the apply flag, and the harness never covered the zero-deletion apply path. The fix added an initializer, flipped the default to dry-run, and added a regression test.

**When to apply:** audits, hardening reports, and delivery sign-offs where the honest residual list is the deliverable.

**When not to:** when the ask is a specific fix, not a state report.
