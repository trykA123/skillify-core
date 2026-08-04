---
id: lib-2026-08-04-a-privacy-gate-must-fail-loudly
date: 2026-08-04
valence: positive
category: patterns
status: seed
evidence:
  - docs/cases/06-skill-map.md
summary: A privacy gate is only as good as its ability to fail loudly.
tags: privacy, gate, i1, verbatim-speech
superseded_by: null
---

# A privacy gate must fail loudly

**Principle:** A gate that cannot fail loudly is not a gate.

**Why:** Real verbatim speech was found inside stored records. The gate was rebuilt stronger — a frontmatter-aware scanner plus a verbatim-speech leak class that flagged 27 hits with zero false positives on curated content — and the records re-landed only at gate=0, paraphrase-first. A silent pass would have shipped the leak; a loud failure forced the fix at the gate, where it protects every future entry.

**When to apply:** any automated check that guards privacy, correctness, or safety and must stop the pipeline when it trips.

**When not to:** cosmetic lint where a loud failure costs more than the class of bug it guards.
