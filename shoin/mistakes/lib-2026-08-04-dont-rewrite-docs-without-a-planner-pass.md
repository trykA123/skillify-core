---
id: lib-2026-08-04-dont-rewrite-docs-without-a-planner-pass
date: 2026-08-04
valence: negative
category: mistakes
status: seed
evidence:
  - docs/cases/03-readme-reconcile.md
summary: A good unplanned write is still an unplanned write.
tags: mistakes, planning, docs, dead-link
superseded_by: null
---

# Never rewrite docs without a planner pass

**Failure mode:** A good unplanned write is still an unplanned write.

**What happened:** A worker rewrote the repository README directly — 176 lines of correct content — with no planner pass, and the owner caught the pipeline violation. A later planner review found one major finding, length over the line budget, and one medium finding, a dead link to a gitignored design artifact that would 404 on a fresh clone; the reconciled version settled at 116 lines.

**Why it failed:** The write skipped the plan step, and the pipeline is what catches the length and link-integrity classes; it never ran.

**Guardrail:** Plan before writing. A planner pass reviews length and link integrity — the dead-link class is a gate, not a nit.

**Evidence:** The README-reconcile side note (case 03).
