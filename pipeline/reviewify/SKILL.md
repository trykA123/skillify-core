---
name: reviewify
description: Judges an implementation against what was intended rather than against taste — a few lenses deep instead of nine shallow, findings filtered to those with a location and a fix. Solo mode is a punch list; full mode is a handoff. Use after shipify, or to review a diff or PR.
---

# Reviewify

**Work in, verdict on whether it's actually senior-grade out.** Last rung of the ladder,
and the only one that can catch the other three failing.

Judge against the packet's requirements, invariants, priorities and anti-examples. Not
against your taste. Not against how you would have written it.

## Two modes

**Solo** — findings and fixes, nothing else. The builder was in the room. Use when the
topology is single-agent, when findings go back to whoever wrote it, or when the user
says "quick review" or "just tell me what's wrong".

**Full** — a document a stranger can act on without asking a follow-up question. Use for
subagent topology, a different human, or an explicit "write it up for the team".

Detection is inferred, so say which mode you picked in one word before the findings.
A wrong guess costs the user ceremony they didn't ask for.

## 1. Scope, then intent, then diff

State the boundary — which files, which commit range, which slice.

**Read the packet before the diff.** Reviewing diff-first anchors you to what was
written instead of what was required, and that single ordering mistake is responsible
for most reviews that approve the wrong thing confidently.

Then reconstruct the intended design in three to five lines: what this should do, which
contracts it honours, which invariants it preserves, what failures it survives. Derive
from the packet where there is one, from surrounding code where there isn't.

If intent cannot be reconstructed from available evidence, that is the first finding, at
Blocking.

## 2. Pick lenses with surface

Choose the three or four that have real surface in *this* diff and go deep. Say which
you skipped, in one line. Nine shallow lenses find nothing.

| Lens | Question |
|---|---|
| Requirement fit | Satisfies the `R*` IDs, and nothing beyond scope? |
| Invariant safety | Each `I*` still true, including on failure paths? |
| Boundaries | Does a module know something it shouldn't? A layer skipped? |
| Contracts | Do public signatures, schemas or events change compatibly? |
| Failure modes | Timeout, partial write, retry, concurrent call? |
| Data integrity | Can this corrupt, orphan, or silently drop state? |
| Security | Inputs validated at the boundary, secrets out of logs, auth server-side? |
| Priority alignment | Does it respect the stated priority ordering? |
| Anti-example | Does it produce something the user said it must not be? |

Requirement fit and invariant safety are always in — they are the contract. Pick one or
two more from what the diff actually touches; a one-file internal helper does not need
security, contracts and data integrity.

Trace at least one realistic failure path end to end.

## 3. Grade, and filter hard

| Severity | Meaning | Effect |
|---|---|---|
| **Blocking** | Violates a requirement, invariant, contract or safety property | Stops the merge |
| **Material** | Correct today, carries real risk or debt | Fix now or accept explicitly |
| **Advisory** | Improvement with no correctness consequence | Optional |

Drop anything that restates what the linter or type-checker already enforces, is a
naming or layout preference with no comprehension cost, proposes rewriting code this
change didn't touch, or can't be stated with a location and a concrete fix.

Cap advisory findings at three in solo, five in full. A review that lists everything
gets read as noise and actioned as nothing.

## 4. Write findings

Solo:

```markdown
### F<n>: <problem> [Blocking | Material | Advisory]
**Where:** `file:lines` → symbol
**Fix:** <concrete change — file, symbol, new behaviour>
**Verify:** <command or observation>
```

Full adds, for a reader with no context: the type (defect, risk, preference), which
`R*`/`I*` it affects, what the code actually does, the concrete consequence and who it
reaches, the one-line principle violated, and **what evidence would prove the finding
wrong**. That last field is what stops a review being an assertion.

## 5. Verdict

| Verdict | Condition | Route |
|---|---|---|
| **Approve** | No blocking; materials accepted as risks | done |
| **Approve with fixes** | Blocking exists, design holds | → shipify |
| **Rework** | Implementation wrong, plan sound | → shipify |
| **Replan** | The plan itself is wrong | → shapeify, as a Packet Defect |

Exactly one verdict.

## 6. Durable decisions — full mode only

An **ADR** only when all three hold: it constrains work beyond this diff, a real
alternative was rejected for a stated reason, and reversing it later costs real work.

A **glossary** entry only when all three hold: a competent engineer wouldn't guess the
meaning, it appears in code rather than only in prose, and misreading it causes a real
mistake.

Solo mode skips both. If something deserves recording, note it as a follow-up rather
than blocking the review on documentation.

## Report

Solo is the findings, the follow-ups, the verdict, and one skill-map signal — an honest
phrase about whether the intent was clear enough to review against. Full adds scope, the
reconstructed design, what genuinely works, a findings table, and a coverage table
mapping each requirement and invariant to what verified it. With a plan folder, write to
`reviews/S<n>-review.md` and update the README.

## Skip when

A one-line change with a passing test, a revert, a generated-file update, or a direct
question about code. Review is a gate, not a tax.

## Before you emit

The filters are the part that decays first, so the honest question is whether any
finding survived only because you wanted something to say — and whether the severities
would look the same to someone who had to act on them tonight.
