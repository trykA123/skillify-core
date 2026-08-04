---
id: lib-2026-08-04-a-review-that-measures-beats-one-that-eyeballs
date: 2026-08-04
valence: positive
category: patterns
status: seed
evidence:
  - docs/cases/05-polish-round.md
summary: A review that measures beats one that eyeballs.
tags: review, measurement, contrast, preemption
superseded_by: null
---

# A review that measures beats one that eyeballs

**Principle:** A review that measures beats one that eyeballs.

**Why:** A preemptive taste pass measured the chashi contrast at 2.7–3.3:1 and darkened the tokens to AA before the owner ever saw them; off-scale rems were snapped to the scale; a first-paint flicker in the server-rendered page was fixed with first-paint CSS. Every owner finding and every preemptive fix landed in one commit, and the owner never had to review the same defect twice.

**When to apply:** visual and taste verification where a metric exists — computed contrast ratios, measured sizes, rendered diffs.

**When not to:** judgment calls with no honest metric, where measurement would fabricate precision.
