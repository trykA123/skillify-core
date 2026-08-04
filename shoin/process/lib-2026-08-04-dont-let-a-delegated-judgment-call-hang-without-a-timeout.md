---
id: lib-2026-08-04-dont-let-a-delegated-judgment-call-hang-without-a-timeout
date: 2026-08-04
valence: negative
category: process
status: seed
evidence:
  - session history + nearest documented artifact: docs/cases/06-skill-map.md
summary: Never let a delegated judgment call hang without a timeout.
tags: timeout, delegation, oracle, judgment
superseded_by: null
---

# Never let a delegated judgment call hang without a timeout

**Failure mode:** Never let a delegated judgment call hang without a timeout.

**What happened:** A delegated oracle round-trip hung with no timeout, and the run stalled on a call that never returned.

**Why it failed:** The delegation lacked a bounded wait; an unresponsive child looks identical to a thinking one.

**Guardrail:** Every delegated decision call carries a timeout; a stalled call is surfaced, not waited on.

**Evidence:** Session history (the hung oracle round-trip) + nearest documented artifact: the skill-map field report.
