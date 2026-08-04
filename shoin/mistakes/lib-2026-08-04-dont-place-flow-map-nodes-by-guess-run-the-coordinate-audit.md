---
id: lib-2026-08-04-dont-place-flow-map-nodes-by-guess-run-the-coordinate-audit
date: 2026-08-04
valence: negative
category: mistakes
status: seed
evidence:
  - session history + the flow-map conformance report (coordinate-audit passage)
summary: Never place flow-map nodes by guess; run the coordinate audit.
tags: mistakes, flow-map, coordinate-audit, placement
superseded_by: null
---

# Never place flow-map nodes by guess; run the coordinate audit

**Failure mode:** Never place flow-map nodes by guess; run the coordinate audit.

**What happened:** The guessed row for a new flow-map node failed the geometry audit on every candidate; the audit, not the guess, placed it. The conformance report itself notes the coordinate math guarantees no overlap while curve aesthetics still need an eyeball.

**Why it failed:** A guess carries no derivable evidence, and the audit measures what the eye cannot.

**Guardrail:** Run the coordinate audit before any placement; a documented call with derivable evidence wins over an unverified row.

**Evidence:** The flow-map conformance report (coordinate-audit passage) + session history.
