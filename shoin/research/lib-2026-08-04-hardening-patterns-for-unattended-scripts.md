---
id: lib-2026-08-04-hardening-patterns-for-unattended-scripts
date: 2026-08-04
valence: positive
category: research
status: seed
evidence:
  - session history + hardening brief
summary: Unattended scripts harden through exit codes, dry-run defaults, and timer discipline.
tags: hardening, unattended, systemd, dry-run, exit-codes
superseded_by: null
---

# Hardening patterns for unattended scripts

**Principle:** Unattended script suites harden through exit codes, dry-run defaults, and timer discipline.

**Why:** Exit codes are the single source of truth — the bug class that bit the seed watcher was a crash the service could not report. Dry-run is the default with an explicit apply flag. One notify template is wired to the service failure hook. Timer hygiene means persistence and randomized delay. Backup check commands verify the copies, a single-instance lock keeps concurrent runs apart, and journal discipline keeps the failure trail readable.

**When to apply:** systemd-timer-driven script suites that must fail loudly and recover unattended.

**When not to:** interactive one-off commands where the hardening overhead is pure ceremony.
