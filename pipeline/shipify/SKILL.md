---
name: shipify
description: Executes a packet at senior standard — isolating risky steps, batching safe ones, classifying every deviation rather than improvising. Returns a structured Revision Request when the plan is wrong. Use when the user says "implement this" or hands you a plan.
---

# Shipify

**A junior-executable plan in, senior-grade work out.** Third rung of the ladder.

The packet owns *what*. This owns *how carefully* — and carefulness is the entire
difference between the two levels. A junior makes the edit; a senior establishes a
baseline first, verifies each step before the next, and never improvises around a
surprise.

You may be running with only the packet — no conversation, no prior discussion. That's
by design. Trust it, validate it, and when it's wrong say precisely how.

## 1. Validate the packet

**No packet?** Don't block. Build a micro-packet inline and hold yourself to everything
below anyway — only the artifact is lighter.

```markdown
**Outcome:** <what exists when done>
**Steps:** <the few things you'll do>
**Done when:** <the observable check you'll run>
```

**With a packet**, confirm it has an outcome and scope, `R*`/`I*`, `P*` steps with
locations and verifications and tags, `A*` checks, stop conditions, and a risk register.
From a plan folder: README → packet → lowest ready slice, one slice per run.

Route it back rather than guessing:

- **Revision Request** — a step's assumption is wrong but the intent holds: the symbol
  isn't where the packet says, a dependency is missing, a file moved. Use shapeify's
  template. This is cheap; use it early rather than forcing a step.
- **Packet Defect** — a material decision is missing, requirements conflict, a
  destructive action is ungrounded, or the design needs rethinking. The intent is wrong,
  not the plan.

## 2. Establish a baseline

Before the first edit: read the location the first ready step names, read the owning
symbol and its nearest caller or test, run the cheapest existing check that exercises
the affected behaviour, and record pre-existing failures as out of scope.

Skipping this is the most common way a junior's work is indistinguishable from a
senior's until something breaks and nobody can say what was already broken.

## 3. Execute

**[ISOLATE]** — edit, verify immediately, repair until green before moving on. One at a
time.

**[BATCH]** — group consecutive batch steps sharing a verification boundary, edit them
all, verify once. If red, promote the failing step to isolate and bisect.

Overrides, with evidence: a batch step that fails twice is promoted to isolate; a step
that turns out to touch something riskier than tagged stops the batch immediately; an
isolate step that passes trivially stays isolated — the cost is already paid.

Per step: restate its `R*`/`I*`/`A*` IDs, make the smallest coherent edit for that
step's outcome only, run its verification, and record what changed and what was run.
Mark it complete only when evidence exists.

Never begin a step while the previous is red. Name the root cause of each failure before
attempting the next repair. **Two consecutive failures sharing a root cause means the
step's premise is wrong, not its implementation — stop and send a Revision Request.**

## 4. Classify every deviation

Improvising is the failure mode this table exists to prevent.

| Class | Action |
|---|---|
| Local correction | Typo, stale path, equivalent API. Fix and record. |
| Local defect | Repair the implementation without changing requirements. |
| Plan defect | Stop. Revision Request or Packet Defect. |
| Scope opportunity | Record as follow-up. Keep out of this delivery. |
| Destructive surprise | Stop before mutating. Ask. |

## 5. Final acceptance

Run every `A*` as specified. Run the repo's compile, lint, type and test for the touched
area — broader when the change is cross-module or user-facing. Inspect the diff for
unexplained files, debug artifacts, secrets and out-of-scope edits. Verify each `I*`
independently.

**An unavailable check is not a pass.** Record why, what substitute evidence exists, and
the residual risk.

## 6. Report

Single-agent — four lines. The user watched it happen.

```markdown
**Done:** Implemented | Partial | Blocked
**Deviations:** <what changed from the plan, or none>
**Follow-ups:** <out-of-scope observations, or none>
**Skill map signal:** <one line, or none>
```

Subagent or plan folder — the reader wasn't there, so give them scope, outcome, a step
table (step, granularity, files, verification, result), an acceptance table (check,
proves, result), classified deviations, residual risks, follow-ups, and the signal.
Write it to `evidence/S<n>-report.md`, update the README status, and name the next ready
slice.

Never claim a check ran when it didn't.

**Skill map signal** — one honest observation about the *input*, harvested passively:
did the packet work first try because the intent was clear, or did a Revision Request
happen because scope was thin? `"P1 positive: intent was one line, first-try result"`
or `"none"`. One phrase. Never lecture, never block on it.

## Before you finish

The discipline above is the deliverable, so the only thing worth re-checking is whether
you actually held to it: was there a baseline, did each step go green before the next,
and is every deviation in the table rather than in your head?
