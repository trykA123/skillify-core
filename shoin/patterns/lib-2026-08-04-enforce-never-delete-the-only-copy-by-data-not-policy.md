---
id: lib-2026-08-04-enforce-never-delete-the-only-copy-by-data-not-policy
date: 2026-08-04
valence: positive
category: patterns
status: seed
evidence:
  - docs/cases/02-seed-watch.md
summary: A never-delete guarantee holds when it is enforced by data, not assumed by policy.
tags: safety-gate, data-integrity, deletion, content-identity
superseded_by: null
---

# Enforce never-delete-the-only-copy by data, not policy

**Principle:** A never-delete guarantee holds when it is enforced by data, not assumed by policy.

**Why:** The torrent watcher's deletion guard held 233 of 301 torrents live on the transcode-verification gate. Name-based matching joined 0 of 300 torrents because the importer renames files, while a byte-exact size join matched 68 of 68 with zero collisions. The policy had promised protection; only the data check delivered it.

**When to apply:** deletion and cleanup guards, identity joins against renamed or transformed data, any gate where a wrong match means data loss.

**When not to:** cosmetic preferences where a wrong join is harmless and the cost of the data check outweighs the protection.
