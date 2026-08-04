---
id: lib-2026-08-04-dont-push-records-while-the-privacy-gate-is-red
date: 2026-08-04
valence: negative
category: mistakes
status: seed
evidence:
  - docs/cases/06-skill-map.md
  - session history
summary: Never push records while the privacy gate is red.
tags: mistakes, privacy, push, gate
superseded_by: null
---

# Never push records while the privacy gate is red

**Failure mode:** Never push records while the privacy gate is red.

**What happened:** Raw records containing verbatim speech were swept to the private remote before the gate was green; the push bypassed the not-yet-built gate. The repository was verified private, and a fix-forward ruling stood.

**Why it failed:** The gate did not exist yet, and the sweep did not wait for it — there was nothing to fail loudly.

**Guardrail:** The gate is now structural: it scans for the verbatim-leak class, and records land only at gate=0. No push while red, by construction.

**Evidence:** The skill-map field report's I1 saga + session history.
