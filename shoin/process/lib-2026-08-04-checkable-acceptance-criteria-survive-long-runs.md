---
id: lib-2026-08-04-checkable-acceptance-criteria-survive-long-runs
date: 2026-08-04
valence: positive
category: process
status: seed
evidence:
  - docs/cases/01-alerts-rebuild.md
summary: A packet with per-slice checkable acceptance criteria survives a long run without contract revision.
tags: acceptance, verification, long-run, packet
superseded_by: null
---

# Checkable acceptance criteria survive long runs

**Principle:** A worker packet whose slices each carry checkable acceptance criteria survives a long run without contract revision.

**Why:** A seven-slice packet with per-slice acceptance ran to completion with zero contract revision. When a slice-zero protocol conflict surfaced — the type-check gate versus a do-not-touch backend holding 21 pre-existing errors — the escalation was resolved by documenting the baseline and ruling per-slice zero new errors, which kept every later check decidable. Checkable criteria turn a long run into a sequence of decidable gates instead of a chain of judgment calls.

**When to apply:** multi-slice runs whose outputs can be measured — type-error counts, test results, byte-identity checks, rendered diffs.

**When not to:** trivial single-commit changes where the diff is its own acceptance and the contract overhead outweighs the run.
