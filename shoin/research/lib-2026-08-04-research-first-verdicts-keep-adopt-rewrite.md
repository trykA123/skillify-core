---
id: lib-2026-08-04-research-first-verdicts-keep-adopt-rewrite
date: 2026-08-04
valence: positive
category: research
status: seed
evidence:
  - session history + research briefs (chart library, engine TS-vs-Rust, TS7)
summary: Research verdicts come in three honest shapes: keep, adopt, rewrite.
tags: research, verdict, keep-adopt-rewrite, evidence
superseded_by: null
---

# Research verdicts come in three honest shapes: keep, adopt, rewrite

**Principle:** Research verdicts come in three honest shapes: keep, adopt, rewrite.

**Why:** The chart brief said keep the current library and rework the wrapper, because the wrapper carried most of the sophistication delta. The engine brief said adopt a TypeScript migration — roughly one to two agent-days buys a compile gate, while a Rust rewrite was not justified for an I/O- and parse-bound workload; measure first. The toolchain brief said adopt later — the native rewrite lands with no programmatic API until the next minor, so the Svelte tooling stays on the current major.

**When to apply:** dependency and engine decisions with measurable trade-offs.

**When not to:** when constraints already force the decision and the verdict is a formality.
