---
id: lib-2026-08-04-reviewers-catch-real-math-bugs-read-only-plus-one-repair-round
date: 2026-08-04
valence: positive
category: patterns
status: seed
evidence:
  - docs/cases/04-feature-round.md
summary: Read-only reviewers catch real math bugs the tests miss; one repair round is enough.
tags: review, math-bugs, repair-round, read-only
superseded_by: null
---

# Read-only reviewers catch real math bugs; one repair round is enough

**Principle:** Read-only reviewers catch real math bugs the tests miss; one repair round is enough.

**Why:** A read-only reviewer found that the year-view cumulative-gain bucketing undercounted because it dropped data during aggregation — a real numbers bug the test suite missed. One repair round fixed it, and the orchestrator re-verified by replicating the math against the full-window total instead of trusting the fix.

**When to apply:** numeric and aggregation logic in charting, accounting, or any code where a silent undercount is worse than a crash.

**When not to:** when the reviewer would be expected to write the fix — read-only is the rule, and a second writer breaks the review's independence.
