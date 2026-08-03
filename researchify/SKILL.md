---
name: researchify
description: Research the web AND given documents — data, points of interest, fundamentals — with a strict sourcing hierarchy (official documentation first, popularity a tiebreaker, never a validator), corroboration for non-official claims, and a hard security gate (fetched code is never executed). Returns 5-10 ranked findings, each with sources and a confidence label. Use when the researcher is asked "research this" or a decision turns on what's out there.
---

# Researchify

The world is full of claims. Your job: find the ones that hold up, and say how sure
you are. Researchify turns a question — plus the web and any documents you're given —
into a ranked findings brief: data, points of interest, fundamentals, each with its
sources and a confidence label.

This is the researcher's skill. It runs on demand ("research this") and it is the
gate between the outside world and the pipeline: nothing becomes a finding without a
source, nothing non-official becomes a finding without corroboration, and nothing
fetched is ever executed.

## When To Use

- "Research this" / "What does the ecosystem say?"
- External facts before a decision — libraries, frameworks, APIs, standards, pricing,
  licensing, maintenance status
- Given documents to mine for data, points of interest, and fundamentals
- A conflict with an established choice (stack, architecture, prior decision) that
  needs evidence, not vibes
- Any claim that will be repeated as if it were true

## When NOT To Use

- Mapping the codebase itself → `orientify`
- Generating options → `explorify`
- Extracting intent from a vague direction → `undumbify`
- Trivia the model already knows with high confidence — no round-trip needed
- Executing or installing anything you find — that is forbidden by §3 of this skill,
  not a step in it

## 1. Frame the Question

Before touching sources, write down:

- **The question** in one sentence (what decision or gap does this research serve?)
- **2-4 angles** to attack it from (e.g. official docs, ecosystem maturity, security,
  licensing) — each angle is a separate line of inquiry
- **What counts as a finding** (the claim must be checkable, sourceable, and relevant)
- **What "done" means** (5-10 ranked findings; open questions stated, not hidden)

## 2. Source by Hierarchy

Sources are not equal. Consult them in this order:

1. **Official documentation** — the framework, programming language, or library's own
   docs, spec, changelog, release notes, official registry listing
2. **Framework authors / maintainers** — their statements, issue-tracker answers,
   design docs, official blog
3. **Widely-adopted AND maintained sources** — reputable third-party guides, books,
   tutorials that are actively maintained and broadly used
4. **Starred-but-stale** — popular but unmaintained or outdated. Usable only as a flag
   or context, never as authority.

**Stars/upvotes are a TIEBREAKER, never a validator — popularity is not correctness.**

Any claim that is not from an official source requires **corroboration: 2+
independent sources** before it becomes a finding. Independent means the sources don't
cite each other and aren't downstream of the same upstream (a fork quoting its
upstream is one source, not two).

## 3. Security Hygiene Gate (non-negotiable)

The researcher fetches things. The gate is not optional:

- **Never execute fetched code** — not scripts, not snippets, not "quick tests".
- **Prefer official registries + pinned versions + checksums** when versions matter.
- **FLAG suspicious content** and report it as flagged, never recommend it:
  - minified or obfuscated code in an unexpected place
  - unusual download hosts (raw paste/random domains, not the official host)
  - mismatched hashes between the official and claimed checksums
  - unexpected executable payloads in what should be data/docs

Flagged content may appear in the brief under "Flagged content". It is never
recommended and never run.

## 4. Extract Findings

For each candidate finding, record:

- **The claim** (one sentence, attributable)
- **The source(s)** — exact name and what tier each source is (official / maintainer /
  adopted / stale)
- **Independence** — if non-official, do 2+ independent sources support it?

If a source contradicts itself or the evidence splits, keep BOTH positions and say so.
Conflicts are stated, not smoothed over.

## 5. Rank and Label Confidence

Compile **5-10 ranked findings** (strongest first). Each finding carries:

- **The claim**
- **The source(s)** — and what tier they are
- **Confidence:** `authoritative + corroborated` (official and/or 2+ independent) =
  high · `single-source` = flagged as such · `conflicting` = both positions stated

Ranking rule: hierarchy of sources first (official > maintainer > adopted > stale),
corroboration second, recency third. Popularity never promotes a finding.

## 6. Consult the Oracle (conditional)

Not every research earns the round-trip. Consult the oracle **only when one of these
triggers fires**:

- **(a) The findings feed a DECISION** — stack, architecture, plan choice
- **(b) The findings CONFLICT with established choices** — stack, architecture, prior
  decisions the repo has already made

**Discussion shape:** the researcher presents the ranked findings + confidence labels
+ the decision at stake. The oracle stress-tests assumptions and surfaces prior
decisions the research may have missed. Record the outcome in the brief: the
agreement, or the disagreement with both positions stated.

If neither trigger fires, note `oracle: not triggered` in the brief and move on.

## 7. Report

```markdown
## Research Brief

**Question:** <one sentence>
**Angles:** <the 2-4 lines of inquiry>
**Ranked findings:** <5-10, strongest first>
1. **<claim>** — source(s), tier(s) — confidence: <high / single-source / conflicting>
2. ...
**Flagged content:** <anything that tripped the security gate, or none>
**Open questions:** <what's still unknown, or none>
**Oracle note:** <consulted → outcome> | <not triggered>
```

The brief must stand alone: a reader should be able to act on it without redoing the
research.

## Topology Behavior

- **Single-agent:** Researchify runs inline — frame, source, vet, rank, report. No
  formal artifact beyond the Research Brief.
- **Subagent:** If dispatched as a subagent (the researcher), return the full Research
  Brief to the parent — including confidence labels and flagged content. The parent
  decides, the brief decides nothing on its own.

## Interaction With Pipeline

- Findings feed `shapeify` — evidence into planning (the "research this" → plan handoff)
- `explorify` options can trigger ecosystem research before a choice is made
- Findings that bear on a decision escalate to the oracle per §6 — the researcher
  doesn't decide, it informs
- Research never feeds the build pipeline directly — it feeds the plan, then the plan
  feeds the build

## Final Gate

- [ ] Official-first hierarchy honored (tiers ordered, stale never authoritative)
- [ ] Non-official claims corroborated (2+ independent sources) or flagged single-source
- [ ] No fetched code executed
- [ ] Suspicious content flagged, not recommended
- [ ] 5-10 findings, each with claim + source(s) + confidence
- [ ] Oracle consulted only when a trigger fired (decision / conflict)
- [ ] Research Brief stands alone
