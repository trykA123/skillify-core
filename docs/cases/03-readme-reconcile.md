# Side note — The README reconcile (a process lesson, not a workflow)

**Status:** ✅ complete · **The lesson:** plan before you write.

## What happened

A worker rewrote this repo's README directly — no planner pass. It did good work (176 lines, correct content, verbatim install commands), but the pipeline was violated: the fleet's own contract says **recon → plan → write → verify**. The owner caught it: *"you should have used an agent to plan that readme properly."*

## The fix

A planner produced the Worker Packet (section skeleton, verbatim-lock rules, link-not-duplicate policy, length budget ≤120 lines). Its review of the unplanned rewrite found: no blockers, one major (length, 176 vs 120 lines), one medium (a **dead link** — the README referenced a design artifact that is gitignored by repo policy and would 404 on a fresh clone), two minors. A worker reconciled the README against the contract: **116 lines**, dead reference purged, install fences byte-identical.

## The lesson

- A good unplanned write is still an unplanned write — the planner pass caught a dead link and halved the length; the rewrite alone would have shipped both.
- The owner policing the pipeline is the pipeline working: the conductor's discipline is part of the product.

## Artifacts

- README.md (116 lines, reconciled), the planner packet, `.pi-subagents/` gitignored
