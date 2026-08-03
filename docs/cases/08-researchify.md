# Case 08 — The researchify skill

**Status:** ✅ complete · **Fleet:** 6 delegations (scout, context-builder, planner, oracle, worker, reviewer — the bench-warmers' night) · **Result:** the 11th skill, fully conformed

## The skill

researchify — web research + given documents → 5–10 ranked findings with confidence. Sourcing hierarchy (official docs first; stars are a tiebreaker, never a validator; 2+ independent sources for non-official), a **security hygiene gate** (never execute fetched code, pinned versions/checksums, flag suspicious content), and a **conditional oracle consult** (when findings feed a decision or conflict with established choices). Written in the house SKILL.md style, wired to the researcher agent.

## The build

Six agents flew — including the three bench-warmers in one run: scout (recon), context-builder (the deep pack — its first flight), planner (the packet, which corrected two geometry numbers), oracle (decision-consistency, approve with zero must-fixes), worker (3 commits, self-caught a comma bug), reviewer (approved, byte-identity + coordinate audit re-run).

## The placement

researchify landed at **(x:520, y:250)** — the parent's guessed row failed the audit on every candidate (documented: column-40 cuts undumbify, y:350 collides with labels), so the planner's call put it beside traceify on the entry row. Two dashed handoff edges: explorify → researchify ("ecosystem") and researchify → shapeify ("evidence"). Coral color `#dd7457`/`#8f3a24` — the one warm hue absent from the ten existing skills, AA in both themes.

## Verification

bash -n install.sh ✓ · node --check both inline JS ✓ · byte-identity of agents/ledger panes (zero hunks) ✓ · coordinate audit (disjoint rects, labels ≥54px apart, curves sampled at 200 t-steps with no third-node intersection) ✓ · counter sweep: "ten ways" → zero, "eleven" → 9 hits ✓ · secrets scan clean ✓

## Lessons

- The bench-warmers' night: context-builder and oracle flew for the first time and both earned their keep (the deep pack made the worker's job mechanical; the oracle verified all 8 decision points).
- "The planner's call, documented" beats "the parent's guess, unverified" — the geometry audit rejected the parent's row and the planner's alternative passed four independent audits.
- Stars are a tiebreaker, never a validator — and the same rule applies to the map: popularity is not correctness.

## Artifacts

- 3 commits (`85886fa` → `6d7a70e`), researchify/SKILL.md, docs 11th node, fleet-config updated
