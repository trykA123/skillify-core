---
id: lib-2026-08-04-dont-hand-wire-services-the-orchestrator-must-rescue
date: 2026-08-04
valence: negative
category: mistakes
status: seed
evidence:
  - session history + the progress report (compose-rescue passage)
summary: Never hand-wire a service the orchestrator must later rescue.
tags: mistakes, services, compose, orchestration
superseded_by: null
---

# Never hand-wire a service the orchestrator must later rescue

**Failure mode:** Never hand-wire a service the orchestrator must later rescue.

**What happened:** An app was deployed via an ad-hoc container run while the compose service stayed an open item the orchestrator had to track across runs.

**Why it failed:** The hand-wired deployment skipped the durable service definition, and the operability debt landed on the next run.

**Guardrail:** Define the compose service up front and register the app in the version script's registry; nothing runs by ad-hoc invocation.

**Evidence:** The compose-rescue passage in the progress report + session history.
