# THE LIBRARIAN — Design

**Deliverable:** `plans/2026-08-03-librarian-design.md` · **Status:** DESIGN (Phase A) · **Designer:** planner @ qwen3.8-max-preview/xhigh · **Date:** 2026-08-03

> **Living doc.** This is the single source of truth for the librarian agent, the librify skill, and the library (Shoin). Phase B conformance executes from this doc alone. Amend in place; don't regenerate.

> **⚠️ Prerequisite / race.** The working tree is mid-refactor (RELEASE-PACKET Stage 1: skills `git mv`'d into `entry/`/`pipeline/`/`teaching/`, `install.sh` rewritten with `SKILL_FAMILY`). **All conformance edits must rebase on the committed post-refactor state; verify `git status` before editing.** Line numbers below were captured mid-window and will shift.

> **I1 gate is non-negotiable everywhere.** Every library entry is sanitized by construction: no verbatim speech, no private paths/identifiers; learnings paraphrased. The recordify sanitize/audit discipline (`teaching/recordify/sanitize.mjs`, `teaching/recordify/audit-records.mjs`) is the pattern.

---

## 0. The five anti-loop guardrails (contract, restated up front)

These five are the constitution of the library. Every section below obeys them.

1. **Lookup-only access.** Agents read the library; they never write to it and never write into each other's context. The single sanctioned exception is the bounded context-builder cooperation (§5).
2. **Evidence-linked doctrine.** Every entry cites a field report, a record, a commit, or a research brief. No citation → no entry.
3. **The garden state machine.** Every entry lives `seed → accepted → superseded`. The librarian audits staleness; superseded entries surface only their superseding pointer.
4. **Principles + failure modes, NOT recipes.** Entries say *why* and *when*, not step-by-step *how*.
5. **Write-only librarian, read-only agents.** Agents never self-publish. The librarian compiles from VERIFIED artifacts + the owner's feedback, never from vibes.

---

## 1. Identity

### 1.1 The agent — **the librarian**
A new fleet agent. Write-only compiler of institutional memory + bounded-recall server. Runs the `librify` skill. It is the 10th builtin snapshot + orchestrator in `fleet-config.json`; it is **NOT** added to the docs-site agents pane (that pane is byte-identical, §5.5).

### 1.2 The skill name — **librify** (picked from [librify, canonify, memorify, archivify])

**Justification:**
- **-ify grammar.** `libr-` + `-ify` = "to shelve in the library / to make library-accessible." Parallel to `recordify` (make a record), `researchify` (make research). Clean verb+ify, matching all 11 existing skills.
- **Role fit.** The skill's two jobs are compile-INTO-the-library and recall-FROM-it. `librify` names the library relationship directly.
- **Disambiguation.**
  - vs `recordify`: records are raw sanitized session captures; librify compiles them into curated, evidence-linked, valenced entries. Different layer.
  - vs `researchify`: researchify is *external* evidence (the web); librify is *internal* institutional memory.
  - vs `canonify`: "canon" implies an authority judgment about what is canonical — the library shelves and recalls, it does not anoint.
  - vs `memorify`: "memory" is individual and clunky; the metaphor here is a shared shelf, not a single mind.
  - vs `archivify`: "archive" = cold storage; the library is a *living reference shelf*, and "archive" collides with recordify's records territory.
- **Owner-instinct alignment.** The owner's instinct was *librify/saveify*; `saveify` is not in the candidate set and is an awkward coinage. `librify` captures the "save it to the library" intent cleanly.

### 1.3 The library's name — **Shoin 書院** (default picked over Bunko 文庫)
`shoin` is the study/writing room — the desk where documents are *composed* and *consulted*. That matches the librarian's two motions exactly: write-only compilation (the desk) + bounded lookup (the consultation). `bunko` is a static collection; `shoin` is the living study where the work happens. Repo dir and all paths use lowercase `shoin`.

### 1.4 Placement
- **Target (post-split):** `skillify-core/shoin/` — the private repo (RELEASE-PACKET Stage 2 renames `skillify` → `skillify-core`, sets Private). Pulled to the homeserver by the pipeline timer; agents read the local pulled copy (e.g. `/opt/skillify-core/shoin/`).
- **v1 interim (this repo):** `shoin/` at the repo root.
- **Split-timing dependency (hard constraint):** the library holds internal fleet lessons → it **must be private**. `shoin/` must never land in a public overlay. `publish-manifest.txt` is an **allowlist** (everything not listed stays private), so the concrete gate is: **`shoin/` is never listed in publish-manifest.txt** — plus RELEASE-PACKET's A1 forbidden-token regex as belt-and-suspenders. S0 is gated on RELEASE-PACKET Stage 2 (skillify-core private) or that allowlist guarantee. If S0 runs pre-split, `shoin/` stays in the private repo only. This is an owner gate.

### 1.5 Family placement — **NEW family `memory`** (not entry, not teach)

**Decision:** create a fourth family. Repo dir `memory/`, docs `FAM` key `memory`, display name "the library".

**Justification (entry vs teach vs new-meta):**
- **Not `entry`:** no one *starts* a task at the library; it is not a doorway skill.
- **Not `teach`:** the teaching cluster's own tagline is "about **you**, not the work" — owner-facing coaching that feeds the game-layer progression. librify is *fleet-internal*: it serves the agents (context-builder, planner), not the owner, and is explicitly **not** a game skill (§9). Same axis, different consumer → different family.
- **New `memory` family wins** on semantic accuracy and forward room: the library is institutional memory, a genuinely new kind of skill; a dedicated family leaves space for future memory skills (staleness auditor, citation checker) without another refactor.

**Conformance surface this adds** (worker must do all of): repo dir `memory/librify/SKILL.md`; `install.sh` `SKILL_FAMILY[librify]=memory`; docs `FAM.memory` + append `'memory'` to the dossier `order` array + family pip in the skills masthead.

---

## 2. Library schema

### 2.1 Entry format — `shoin/entries/<id>.md`
```markdown
---
id: lib-006-privacy-gate-fails-loudly
date: 2026-08-03
valence: positive            # positive | negative
category: patterns           # prompting | process | research | mistakes | patterns
status: accepted             # seed | accepted | superseded
evidence:                    # ≥1 link: field report / record / commit / brief
  - docs/cases/06-skill-map.md
summary: A privacy gate is only as good as its ability to fail loudly.
superseded_by: null          # set only when status=superseded
---

# A privacy gate must fail loudly

**Principle:** a gate that can't fail loudly is not a gate. When the sanitizer missed
verbatim speech, the fix was to harden the gate (a verbatim-leak class), not to quietly
patch the records.

**Why:** silent passes let leaks ship. A loud failure stops the pipeline and forces the
fix at the gate, where it protects every future entry, not just today's.

**When to apply:** any automated check that guards privacy, correctness, or safety.

**When not to:** cosmetic/lint checks where a loud failure costs more than the class of
bug it guards.
```
Negative entries swap **Principle** for **Failure mode** (see §7.2). Body sections are always: **Principle/Failure mode · Why · When to apply · When not to.**

### 2.2 The index — `shoin/index.md`
One greppable line per entry, maintained by the librarian, sorted by id:
```
<id> | <valence> | <category> | <status> | <one-line summary> | <evidence links, comma-joined>
```
The index is the lookup surface (§5.4). Full bodies live in `entries/`; the index never carries bodies (bounded by construction).

### 2.3 The I1 gate
Every entry passes the recordify sanitize/audit discipline **before** it is accepted: paraphrase-first, strip identifiers/paths/verbatim speech, then run the audit (`audit-records.mjs` pattern) — **gate=0 required** to move `seed → accepted`. The librarian reuses `teaching/recordify/sanitize.mjs` classes (incl. the verbatim-speech leak class from case 06). An entry that trips the gate stays `seed` (or is rejected), never `accepted`.

### 2.4 Worked examples
**Positive** (`lib-013-documented-planner-call`, category `process`, evidence `docs/cases/08-researchify.md`):
> **Principle:** "the planner's call, documented" beats "the parent's guess, unverified." **Why:** the geometry audit rejected the guessed row and passed the documented alternative — evidence outranks authority. **When to apply:** any contested placement/number. **When not to:** trivial, reversible choices where a quick try is cheaper than an audit.

**Negative** (`lib-019-push-while-red`, category `mistakes`, evidence `docs/cases/06-skill-map.md` + session-history marker):
> **Failure mode:** pushing records while the privacy gate is red. **What happened:** raw records (verbatim speech) were swept to the remote before the gate was green. **Why it failed:** the push bypassed the not-yet-built gate. **Guardrail:** never push records until `gate=0`; the gate now scans for the verbatim-leak class. **Evidence:** case 06 I1 saga.

---

## 3. The librarian AGENT

### 3.1 fleet-config entry (verbatim, ready to paste)
Inserted as a new key inside `agentOverrides`, **after `delegate`**, before the closing brace:
```json
    "librarian": {
      "model": "qwen-token-plan/qwen3.8-max-preview",
      "fallbackModels": [
        "deepseek/deepseek-v4-flash"
      ],
      "thinking": "xhigh",
      "skills": [
        "librify",
        "rtk-first"
      ]
    }
```
**Model rationale:** compiling lessons is judgment work (valence honesty, evidence weighing, supersession calls) → the strongest model at `xhigh`, matching the owner directive. `rtk-first` for compact inspection. No further skills needed — the librarian doesn't build or review; it curates.

### 3.2 When it runs
- **Post-run compile** — after each orchestrator run lands, harvest its verified lessons into `seed` entries.
- **On-demand** — "librarian, what did we learn about X" → bounded recall.
- **Scheduled staleness audit** — periodic pass over the garden: promote `seed → accepted` (audit gate=0), demote stale `accepted → superseded` (§7.3).

### 3.3 Agent prompt design (the three disciplines)
`agents/librarian.md` carries these as non-negotiables:
- **Write-only discipline:** compile only from VERIFIED artifacts + owner feedback. Never invent, never self-publish another agent's opinion, never write into another agent's context.
- **Evidence-link rule:** no citation → no entry. Every claim points at a field report / record / commit / brief.
- **Valence honesty rule:** negatives are stated as bluntly as positives. No sugar-coating failures, no self-flagellation either — the failure mode, what happened, why, the guardrail, the evidence. Nothing more.

---

## 4. The librify SKILL (house format)

File: **`memory/librify/SKILL.md`**. Structure mirrors `entry/researchify/SKILL.md` exactly (frontmatter → intro → When To Use → When NOT To Use w/ →sibling refs → numbered contract → fenced output contract → Topology Behavior → Interaction With Pipeline → Final Gate). Full text:

````markdown
---
name: librify
description: Compile the fleet's verified lessons into the library (Shoin) and recall them on demand — evidence-linked, valenced (what worked AND what failed), sanitized entries. Write-only librarian: agents never self-publish; the librarian compiles from verified artifacts + owner feedback. Recall is bounded — top-k (≤5) summaries with confidence, status, and valence, never full dumps. Use when asked to "check the library," "what did we learn about X," after a run (post-run compile), or to capture owner feedback.
---

# Librify

The fleet forgets. Every run rediscovers what a previous run already learned — or
repeats a mistake that already cost a repair loop. Librify is the fix: a library
(Shoin) of evidence-linked, valenced lessons, compiled by the librarian and shelved
where any agent can look them up. Positive entries are patterns that worked; negative
entries are post-mortems — "we tried this, it failed, don't repeat."

This is the librarian's skill. It runs on demand ("check the library" / "what did we
learn about X"), after each orchestrator run (post-run compile), and when the owner
gives feedback worth keeping. The librarian is write-only: it compiles from VERIFIED
artifacts + the owner's feedback, never from vibes, and agents never self-publish.
Recall is a bounded lookup — top-k summaries, flagged, never an ambient full-dump.
The library is a reference shelf, not a brain.

## When To Use

- "Check the library" / "What did we learn about X?"
- Post-run compile — after an orchestrator run lands, harvest its verified lessons
- Owner feedback capture — "that worked" / "never do that again" worth shelving
- Before planning a task that touches ground the fleet has worked before
- Compiling a sanitized record into a durable, evidence-linked entry

## When NOT To Use

- Capturing a raw session record → `recordify` (librify compiles records; it doesn't replace them)
- Gathering external evidence → `researchify` (the library is internal memory, not the web)
- Teaching the owner a competency → `promptify` / `explainify` (the library serves the fleet, not the progression)
- Dumping the whole library into context → forbidden by §4 (bounded top-k only)
- Publishing an agent's own opinion → forbidden (write-only librarian; agents never self-publish)

## 1. Compile From Verified Sources Only

The librarian writes; agents don't. Every entry is compiled from:
- **Verified artifacts** — field reports, records, commits, research briefs
- **The owner's feedback** — explicit "keep this" / "never again"

**No citation → no entry.** An entry that can't point at a field report, record,
commit, or brief is not shelved. Opinions and vibes are rejected at the door.

## 2. Assign Valence Honestly

Every entry is **positive** (a pattern that worked) or **negative** (a post-mortem:
we tried this, it failed, don't repeat). Negatives are evidence-linked failures, never
moods. State negatives as bluntly as positives — no sugar-coating, no self-flagellation.
The failure mode, what happened, why, the guardrail, the evidence. Nothing more.

## 3. Sanitize On Entry (the I1 gate)

Every entry is sanitized before it is accepted: paraphrase-first, strip identifiers,
paths, and verbatim speech. Run the audit (recordify `audit-records.mjs` pattern) —
**gate=0 required** to move `seed → accepted`. A tripped entry stays `seed` or is
rejected; it is never accepted raw.

## 4. Bound the Recall

Recall returns **top-k (≤5)** summaries — never full entries, never an ambient dump.
Each summary carries **id · valence · category · status · one-line summary · evidence
link · confidence**. **Superseded entries surface only their superseding pointer.**
Results are flagged as library-derived (a reference shelf, not instructions). k is
capped at 5; a broad query does not widen k, it sharpens the terms.

## 5. Tend the Garden

Entries live `seed → accepted → superseded`. On the staleness audit: promote a `seed`
to `accepted` when the audit gate is green; demote an `accepted` entry to `superseded`
when its failure mode is moot (the guardrail is now structural/CI-enforced) or its
principle is replaced. Record `superseded_by`.

## 6. Report

```markdown
## Library Recall — "<query>"

**k:** <≤5> · **flagged:** library-derived (reference only)
1. **<id>** [<valence> · <category> · <status>] — <one-line summary> — confidence: <high|medium|low> — evidence: <link>
2. ...
**Superseded surfaced:** <id → superseded_by, or none>
**Open gaps:** <what the library does not yet know, or none>
```
For a post-run compile, report instead: entries shelved (id + valence), entries left
`seed` (gate not green), and the audit result.

## Topology Behavior

- **Single-agent:** librify compiles/recalls inline; the artifact is the recall brief or
  the shelved entries.
- **Subagent:** the librarian returns the bounded recall brief (or the compile report) to
  the parent. The parent decides; the library decides nothing on its own.

## Interaction With Pipeline

- **Harvests** `recordify` (records) and `researchify` (briefs) — the two durable sources.
- **Feeds** the context-builder at run start via the bounded lookup protocol (§5 of the
  design) — never by writing into another agent's context.
- The librarian never blocks the build pipeline; recall is advisory, flagged, bounded.

## Final Gate

- [ ] Compiled from verified artifacts / owner feedback only (no vibes)
- [ ] Every entry evidence-linked (≥1 citation)
- [ ] Valence assigned honestly (negatives are post-mortems, stated bluntly)
- [ ] I1 gate green (gate=0) before `accepted`
- [ ] Recall bounded (top-k ≤5), flagged, supersession respected
- [ ] No full dumps; no self-publishing; no writes into other agents' context
```
````

---

## 5. Context-builder cooperation protocol

**Mechanism (at run start):**
1. The context-builder extracts the task's key terms.
2. It runs the bounded lookup: `shoin/lookup.sh 5 <term> [<term> …]` (read-only).
3. It receives **≤5** flagged summaries (id · valence · category · status · one-line summary · evidence link).
4. It includes them in the context pack under a clearly-marked section — **"Library-derived lessons (reference only)"** — each carrying status + valence + evidence.
5. **Supersession respected:** a superseded entry surfaces only its superseding pointer.

**Anti-loop guardrails (restated):** bounded (k≤5, capped) · flagged (library-derived, advisory) · evidence-linked (every summary carries its citation) · supersession respected. **The librarian never writes into another agent's context** — the flow is strictly context-builder *pulls* from the index.

**Query interface (zero new dependencies):** a tiny read-only bash script `shoin/lookup.sh` (bash + grep + sort + head only) over the greppable `shoin/index.md`. Chosen over "context-builder greps raw" because the script enforces the k≤5 cap and the flagged output shape in one place; chosen over a node/bun service because it adds no runtime dependency. Contract:
```
usage: lookup.sh <k> <term> [<term> ...]   # k clamped to 1..5
stdout: ≤k lines, each: <id> | <valence> | <category> | <status> | <summary> | <evidence>
```

---

## 6. V1 catalog plan (the existing corpus → entries)

**Entry count: 22 entries = 17 positive + 5 negative.** Full mapping:

| # | working id | title | valence | category | evidence (source) |
|---|-----------|-------|---------|----------|-------------------|
| 1 | lib-001 | Checkable acceptance criteria survive long runs | positive | process | docs/cases/01-alerts-rebuild.md |
| 2 | lib-002 | Enforce "never delete the only copy" by data, not policy | positive | patterns | docs/cases/02-seed-watch.md |
| 3 | lib-003 | Design at xhigh keeps a change a pure addition | positive | process | docs/cases/03-agents-tab.md |
| 4 | lib-004 | A review that measures beats one that eyeballs | positive | patterns | docs/cases/05-polish-round.md |
| 5 | lib-005 | Reviewers catch real math bugs; read-only + one repair round | positive | patterns | docs/cases/04-feature-round.md |
| 6 | lib-006 | A privacy gate must fail loudly | positive | patterns | docs/cases/06-skill-map.md |
| 7 | lib-007 | Research first, design second, build third | positive | research | docs/cases/07-charts-reinvention.md |
| 8 | lib-008 | A documented planner call beats an unverified guess | positive | process | docs/cases/08-researchify.md |
| 9 | lib-009 | Research-first verdicts: keep / adopt / rewrite | positive | research | outputs/*/research.md (chart.js, TS-vs-Rust, TS-compiler) |
| 10 | lib-010 | Ecosystem facts before design (caps, limits, constraints) | positive | research | outputs/*/research.md (DuckDNS, Quickshell, graph-algos, studio panels) |
| 11 | lib-011 | Hardening patterns for unattended scripts | positive | research | /tmp/homelab-audit/research-hardening.md |
| 12 | lib-012 | Name the 1% gaps; never claim perfect | positive | process | .pi-subagents/artifacts/ebeedc1f-…_orchestrator_output.md (the 99%-list) |
| 13 | lib-013 | Lead with the delta; ask once | positive | prompting | learnings (ask-once, state-the-delta) — paraphrased |
| 14 | lib-014 | Name the referent; anchor the new to the known | positive | prompting | learnings (name-the-referent, anchor-the-new) — paraphrased |
| 15 | lib-015 | Challenge with evidence; delegate the how | positive | prompting | learnings (challenge-with-evidence, delegate-the-how) — paraphrased |
| 16 | lib-016 | Render before you deliver | positive | prompting | learnings (render-before-you-deliver) — paraphrased |
| 17 | lib-017 | Know the ecosystem's wiring; review on a cadence | positive | patterns | learnings (skillmap-records wiring/cadence) — paraphrased |
| 18 | lib-018 | Don't rewrite docs without a planner pass | negative | mistakes | docs/cases/03-readme-reconcile.md |
| 19 | lib-019 | Don't push records while the privacy gate is red | negative | mistakes | docs/cases/06-skill-map.md + session history |
| 20 | lib-020 | Don't place flow-map nodes by guess — run the coordinate audit | negative | mistakes | learnings/skillmap-reports/CONFORMANCE-report.md:74 + session history |
| 21 | lib-021 | Don't hand-wire services the orchestrator must rescue | negative | mistakes | learnings/skillmap-reports/progress.md:26 + session history (compose rescue) |
| 22 | lib-022 | Don't let a delegated judgment call hang without a timeout | negative | process | session history (oracle timeout saga) |

**Notes on the mapping:**
- **8 numbered field reports → 8 positive entries** (one flagship lesson each). The **03-readme-reconcile side-note → 1 negative** (lib-018).
- **7 research briefs → 3 grouped entries** (lib-009 decision-verdicts, lib-010 ecosystem-facts, lib-011 hardening). Grouping is honest and keeps the catalog usable.
- **Learnings → 5 entries** (lib-013…017), **paraphrased + identifiers stripped** (private, I1). glossary/profile fold into these as seeds, not separate entries.
- **99%-list → 1 entry** (lib-012).
- **4 post-mortems → 4 negative entries** (lib-019…022). These exist only in session history, so each carries the honest marker **"evidence: session history + nearest documented artifact"** plus the nearest on-disk relative (case 06, CONFORMANCE-report.md:74, progress.md:26).

**Sanitization pass:** ALL v1 entries pass I1, not just the learnings-sourced ones. lib-013…017 (learnings) are rewritten third-person, pattern-first, with all private paths (`~/.agents/…`), project identifiers, and verbatim speech stripped. **lib-009…012 re-root their evidence links to sanitized markers** — the design table's raw session-artifact paths (`/mnt/Sabrent/homelab/.pi-subagents/artifacts/…`, `/tmp/homelab-audit/…`, private run-IDs) are source references only and must never appear inside an entry; entries cite the field-report/record/brief equivalents or a sanitized run marker. Every entry runs the I1 audit (gate=0) before `accepted`. The session-history-only negatives (lib-019…022) keep their explicit "session history + nearest documented artifact" marker rather than a fabricated file link.

---

## 7. The negatives design

### 7.1 Curation rules
- **Qualifies:** a verified failure with a post-mortem / evidence trail (a field report, a record, a commit, or a documented session incident).
- **Does not qualify:** opinions, vibes, unverified complaints, "I feel like this is wrong." No evidence → rejected at the door.

### 7.2 The "don't repeat" format
Every negative entry body is: **Failure-mode statement** (one line) + **what actually happened** + **why it failed** + **the guardrail that prevents it** + **evidence**. Nothing else — no blame, no drama.

### 7.3 How negatives get superseded
A negative moves `accepted → superseded` when the failure becomes **moot** — the concrete criterion: **the guardrail is now structural/CI-enforced** (the failure can no longer recur), or a newer entry replaces the principle. Set `superseded_by` to the guardrail/positive entry. Recall then surfaces only the pointer. (Example trajectory: lib-019 push-while-red → superseded once the records-gate CI refuses red pushes by construction.)

### 7.4 Valence honesty rule
Negatives are stated as bluntly as positives. No sugar-coating, no self-flagellation. The garden keeps both because, as the owner put it, *we usually learn from the negatives more times*.

---

## 8. The slice plan

| slice | what | files touched | owner gate | verification |
|-------|------|---------------|------------|--------------|
| **S0** | library scaffold + schema + index | `shoin/` (entries/, index.md, lookup.sh, schema doc) | approve schema + placement + **privacy gate** (post-split or publish-forbidden) | index format valid; `lookup.sh` runs; example entries pass I1 audit gate=0 |
| **S1** | v1 catalog (from §6) | `shoin/entries/*.md` (22), `index.md` populated | approve catalog mapping + sanitization | all entries sanitized (gate=0); evidence links resolve; valence/category correct; count=22 |
| **S2** | librify skill | `memory/librify/SKILL.md`, `install.sh`, `README.md`, docs/index.html skills conformance | approve SKILL.md + family + placement | house-format match; `bash -n install.sh`; counter sweep; coordinate audit |
| **S3** | librarian agent + fleet-config | `agents/fleet-config.json`, `agents/README.md`, `agents/librarian.md` | approve agent config + prompt | `JSON.parse fleet-config`; README row present |
| **S4** | context-builder cooperation | context-builder awareness + `lookup.sh` wiring | approve protocol + k cap | bounded recall returns ≤5 flagged, supersession respected |
| **S5** | staleness audit timer | scheduled audit (garden transitions) | approve cadence + criteria | seed→accepted and accepted→superseded transitions fire per §7.3 |

**Phase B conformance (this run) covers: S2 + S3** (= parent's items 1–5) **+ field report 09 (item 6) + game-layer note (item 7).**
**Follow-up launches: S0, S1, S4, S5.**

> **⚠️ Flagged ambiguity for the parent/oracle:** the parent's Phase B list (items 1–7) does **not** include the library scaffold or catalog seeding (S0/S1). The RULES line "the v1 catalog entries are SANITIZED" implies seeding happens, but no Phase B item creates `shoin/`. **As specified, this run delivers the librarian agent + librify skill + all data conformance; §6 makes S0/S1 mechanical for the immediate next launch.** If the parent intends the catalog to be seeded *this* run, S0+S1 must be explicitly added to Phase B.

---

## 9. Phase B conformance — exact decisions (so the worker never re-decides)

### 9.1 Flow-map placement (12th fnode) — **librify at x:520, y:350**
- Node rect 140×62 → librify occupies x520–660, y350–412. Canvas 1380×450.
- **Disjoint check:** researchify (520–660, 250–312) is directly above with a 38px gap; recordify (1000–1140, 350–412) is 340px right. No overlap with any of the 11 existing nodes.
- **FLOWS additions (2 dashed handoff edges, matching researchify's 2-edge precedent):**
  - `['recordify','librify','shelve','dashed']` — horizontal at y381, clear of all nodes. Label **'shelve'** — not 'harvest', which shipify→promptify already uses (duplicate labels would be ambiguous). Label sits at the bezier midpoint (830,388), verified clear of every node.
  - `['researchify','librify','','dashed']` — **unlabeled** vertical edge, per the house vertical-edge limitation (explainify→recordify is deliberately unlabeled; CONFORMANCE-report.md:74). With the code's label math (`y:my+(y2>y1?-19:7)`, line 1145), a 'briefs' label would land at (590,312) — exactly on researchify's rect bottom edge (250+62) — and node rects are opaque (line 136), so the glyph would be occluded. Unlabeled by precedent.
- **The librify ↔ context-builder cooperation is a PROTOCOL, not an SVG edge** (context-builder is an agent, not a flow-map skill). It is documented in §5 and surfaced in librify's dossier `conn` field. This keeps the map clean and librify a harvest **sink** (like recordify, which also has no outgoing SVG edge).
- **Label spacing:** the single new label "shelve" at (830,388) — reviewer-measured minimum distance to any existing label = **134.6px** (nearest: "record" at (950,327)); the ≥54px rule is satisfied. **The ≥54px rule is scoped to NEW labels vs ALL existing labels:** the existing map itself already has "skill map" (950,318) vs "record" (950,327) at ~9px, so the rule is satisfiable only as "new labels ≥54px from all labels", not as a global pairwise rule.
- **Fallback coordinates if the five-audit rejects (520,350):** (280,350) below traceify, then (40,350) bottom-left. At (280,350) both edges are diagonal and CAN carry labels ('shelve' at (710,388), 'briefs' at (470,312) — both verified clear of all 11 nodes). The worker runs the audit; if the primary fails it uses the fallback and documents the rejection (case-08 precedent).
- **Coordinate audit (mandatory, FIVE checks):** (a) disjoint rects; (b) new labels ≥54px from ALL existing labels; (c) bezier curves sampled at 200 t-steps intersect no third node; (d) edge-label midpoints on the bezier midpoint rule (`x:mx, y:my+(y2>y1?-19:7)`); (e) **label-vs-node clearance** — every new label's glyph box clear of every node rect. The original four checks would have PASSED the occluded 'briefs' label; check (e) is what catches it. Vertical edges stay unlabeled per house limitation.

### 9.2 The 12th SK entry (all fields)
```js
 {id:'librify',emoji:'📚',mode:'curatorial',fam:'memory',color:'var(--sk-librify)',no:'12',x:520,y:350,
  does:'Compiles the fleet\u2019s verified lessons into <b>the library</b> (Shoin) — evidence-linked, valenced (what worked <b>and</b> what failed), sanitized entries you can look up. Recall is bounded: top-k summaries, flagged, never full dumps. Write-only librarian; agents read, never self-publish.',
  when:['\u201cCheck the library\u201d','\u201cWhat did we learn about X?\u201d','Post-run compile · owner feedback capture'],
  invoke:'/librify',trig:'\u201ccheck the library\u201d · \u201cwhat did we learn about X?\u201d',explicit:true,
  io:'verified artifacts + feedback <b>→</b> curated entries · a query <b>→</b> top-k summaries',
  conn:'harvests <b>recordify · researchify</b> · feeds <b>context-builder → shapeify</b> (bounded lookup)'}
```
Appended after the researchify entry, before `];`. **ROUTES additions:** `['check the library','librify']`, `['what did we learn about X','librify']`. **FAM addition:** `memory:{name:'the library',sub:'institutional memory · harvest → recall',color:'var(--sk-librify)'}`; append `'memory'` to the dossier `order` array.

### 9.3 Colors (both theme blocks, AA)
- **`--sk-librify`** — a muted **card-catalog red / dusty rose**, distinct from researchify's orange-coral `#dd7457` and reviewify's mauve `#b58ab0`. **Dark:** `#c9707e` · **Light:** `#90404e`. Add to the dark block (line ~27–28) and the light block (line ~46–47). Oracle-computed contrast: dark **6.07:1**, light **5.71:1** vs their grounds — both AA (calibrated against researchify #dd7457=6.68:1 / #8f3a24=6.18:1). Worker still verifies AA on both grounds; if short, adjust *lightness only*, keep the hue.
- **`--cs-librarian`** (case 09 accent) — same hue family as the skill, tying case 09 to librify. **Dark:** `#c9707e` · **Light:** `#90404e`. Add to both `--cs-*` blocks (dark ~285–292, light ~293–300).
- **Residual finding (flag, don't fix):** `--cs-done` is referenced by cases 04–08 but **never defined** in the CSS. Fixing it would alter existing cases' appearance → out of scope for this run. Documented so a future pass can decide.

### 9.4 The d-no timeline treatment (owner's note)
- **Ordinal mapping in JS (mandatory; verifier checks 1..12):** `var ORD=['1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'];` indexed by `parseInt(s.no,10)-1`.
- **d-no spans (skills dossier template, line ~1215):** change `'<span class="d-no">'+s.no+'</span>'` to render the ordinal visibly and carry the full narrative on hover: `'<span class="d-no" title="'+ORD[parseInt(s.no,10)-1]+' skill created — '+s.id+'">'+ORD[parseInt(s.no,10)-1]+'</span>'`. **The agents d-no template (~1447) stays plain-number** (agents pane byte-identical; the timeline is skills-only).
- **Timeline strip (skills masthead, ~435–445):** a compact horizontal strip `#skill-timeline` built by JS from SK (already in creation order): one tick per skill, `Nth · id`, each colored by `s.color`, house mono style. Zero new dependencies, inline.
- **CSS:** `.timeline{display:flex;flex-wrap:wrap;gap:.35rem 1rem;margin-top:.9rem}` + `.tl-step{font-family:var(--mono);font-size:var(--fs-xs);color:var(--c)}`; `.d-no` keeps its existing absolute-position rule (line ~180).

### 9.5 Counter sweep — every site (all hardcoded strings)
**eleven → twelve (skills):**
- line 6 `<title>` "eleven ways to think" → "twelve ways to think"
- line 7 meta "eleven cognitive skills" → "twelve cognitive skills"
- line 437 h1 "Eleven ways" → "Twelve ways"
- line 438 lede "Eleven cognitive skills" → "Twelve cognitive skills"
- line 444 "skills <b>11</b> · one method" → "skills <b>12</b> · one method"
- line 485 footer "eleven skills · one pipeline · MIT" → "twelve skills…"
- line 1046 comment "the eleven skills" → "the twelve skills"
- **skills mast-side (~441–443):** add a 4th pip line `<div><span class="pip" style="background:var(--sk-librify)"></span><b>1</b> library</div>`.
- **install i-note (~482):** "Five skills — orientify, promptify, explainify, recordify, researchify — wait for an explicit call" → "**Six** skills … researchify, **librify**".

**eight runs → nine runs (cases):**
- line 579 kicker "eight real orchestrator runs" → "nine…"
- line 580 h1 "Eight runs." → "Nine runs."
- line 581 lede "eight real orchestrator runs logged" → "nine…"
- line 606 footer "eight runs · real catches · lessons kept" → "nine runs…"
- **board (~584–587):** workflows `<b>8</b>`→`<b>9</b>` · complete `<b>8</b>`→`<b>9</b>` · in progress `<b>0</b>`→`<b>0</b>` · major catches `<b>5</b>` unchanged. **Final committed state = 9 workflows / 9 complete / 0 in progress** (run 09 lands complete; mid-run it would read 9/8/1 — commit the end state).

### 9.6 Case 09 CS object (append before `];` ~1606)
`{id:'librarian',no:'09',title:'The librarian',sub:'the fleet's memory · the 12th skill',status:'done',label:'complete',color:'var(--cs-librarian)',stat:'…',stats:[…],does:'…',moments:[…],verify:[…],lessons:[…]}` — fields filled from the run, house style.

### 9.7 install.sh + README.md + agents/README.md
- **install.sh:** `SKILLS=( … researchify librify )` (12 entries); `SKILL_FAMILY` += `[librify]=memory`. (No literal "11" exists — the array is the count.)
- **README.md:** line 3 "Eleven interlocking skills" → "Twelve interlocking skills"; line 8 "- **Eleven skills** — … researchify." → "**Twelve skills** — … researchify, **librify**."; catalog table += `| librify | Curatorial — compile & recall the fleet's evidence-linked lessons | "Check the library" |`; Repo Structure += `memory/` dir with librify.
- **agents/README.md:** fleet table += `| librarian | qwen3.8-max-preview | xhigh | librify, rtk-first | Compile & recall the fleet's evidence-linked library |`.
- **agents/fleet-config.json:** the §3.1 block after `delegate`.

### 9.8 game-layer.md decision note (progress.json untouched)
Add a boundary note mirroring lines 11–13 (the researchify precedent):
> **librify is outside the game layer:** it is fleet-internal memory, not a teaching skill; it does not coach the owner through a competency, it does not join this progression, and it is not a harvest source. promptify and explainify remain the two teaching skills; the pipeline-harvest list is unchanged.

### 9.9 Byte-identity (do NOT touch)
`pane-agents` HTML (489–574), `var AG` (1317–1368), `AGFAM` (1369–1372), `AFLOWS` (1374–1385), agent dossier renderer (1429–1476), and the entire ledger pane (610–1041 + its script 1009–1040). The librarian is a **skills-side** change only; the docs agents pane stays "Ten agents."

---

### 9.10 Field report 09 + cases README (parent item 6)
- **`docs/cases/09-librarian.md`** — follows the 08-researchify.md field-report structure (title, status/fleet/result lines, the run in one image, what shipped, what was caught, the audit, lessons). Title: "The librarian"; content: the librarian agent + librify skill + Shoin library design + the 12th-skill conformance + the negatives design; status lines completed at the end of the run.
- **`docs/cases/README.md`** — table row `| 09 | The librarian | … |` matching the existing row format.
- **The board** — per §9.5 (final committed state: 9 workflows / 9 complete / 0 in progress).

## 10. Verification (Phase B, before final report)
`node --check` both inline JS blocks · `bash -n install.sh` · `JSON.parse fleet-config.json` · counter sweep — **assert the enumerated §9.5 sites, NOT global zero-hits**: historical case data stays (the case-08 CS object contains "the eleventh skill · complete" and "eleven ways to think" (~lines 1595/1599); case-05 has "eight post-deploy findings" (~1554)) — those are field-report content and must NOT change; the sweep verifies the live sites (6,7,437,438,444,485,1046, 579–587, 606, the "Five skills" i-note, the 4th family pip) flipped to twelve/nine · byte-identity of agents/ledger panes (zero hunks) · flow-map coordinate audit (§9.1 FIVE checks) · secrets scan · d-no timeline renders (compiled JS contains the ORD mapping 1..12 + the timeline builder).

---

*End of design. Phase B worker: execute §9 exactly; when §9 and reality disagree, re-verify the live file first (race warning) and document the delta here.*

---
---

---

## Amendments — oracle fold-in (verdict: approve-with-conditions, 2026-08-03)

Folded into §1.4, §6, §9.1, §9.3, §9.5, §9.10, §10 by the orchestrator after the oracle review
(artifact `.pi-subagents/artifacts/718da813_oracle_0_output.md`):

1. §9.1 — 'briefs' edge made **unlabeled** (house vertical-edge limitation; a label at (590,312) would be occluded by the opaque researchify rect). recordify→librify label 'harvest' → **'shelve'** (duplicate-label ambiguity with shipify→promptify). Audit gains check (e) label-vs-node clearance; the ≥54px rule is scoped to new-vs-all labels.
2. §9.5/§10 — counter sweep asserts the enumerated §9.5 sites; historical strings inside the case-08/case-05 CS objects are field-report content and stay untouched.
3. §6 — sanitization pass extended to lib-009…012 (raw session-artifact paths never appear in entries; re-rooted to sanitized markers).
4. §1.4/S0 — publish gate reworded: `publish-manifest.txt` is an allowlist; the gate is "`shoin/` never listed" + RELEASE-PACKET A1 regex.
5. §9.10 added — field report 09 + `docs/cases/README.md` row spec (parent item 6).
6. §9.3 — oracle-computed AA ratios recorded (dark 6.07:1 / light 5.71:1).
7. Doc hygiene — planner preamble and trailing note stripped.
8. §9.1 — label-spacing number corrected post-conformance: reviewer measured the minimum new-label distance at 134.6px (nearest existing label "record"), not ≥205px; the ≥54px rule is satisfied.
