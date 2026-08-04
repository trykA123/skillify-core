---
id: lib-2026-08-04-lead-with-the-delta-ask-once
date: 2026-08-04
valence: positive
category: prompting
status: seed
evidence:
  - learnings (ask-once, state-the-delta) — paraphrased
summary: Lead with the delta and ask once.
tags: prompting, delta, ask-once, symptom-report
superseded_by: null
---

# Lead with the delta; ask once

**Principle:** Lead with the delta; ask once.

**Why:** Repeating the same question seconds apart adds zero information and reads as hesitation; the fix is to fold the context in and ask once. A symptom report must state the delta — where the report is looking, what it sees, what it expected — because a symptom that merely says it is not working properly names a family of bugs, and one sentence of delta is a checklist.

**When to apply:** debugging requests and symptom reports where the first message is the only message.

**When not to:** probing for unknown requirements, where the delta is precisely what is missing.
