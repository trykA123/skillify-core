---
name: shapeify
description: Turns architect-grade intent into a plan a junior could execute without guessing — each step naming its location, its check, and the trap. Produces a living packet that can be amended in place when execution proves an assumption wrong. Use after undumbify, or when the "what" is clear and the "how" isn't.
---

# Shapeify

**Architect intent in, a plan a junior can execute out.** Second rung of the ladder.

The bar is not "a competent agent could follow this". It is: *someone who doesn't know
this codebase, and doesn't know what they don't know, executes it and produces senior
work.* That bar forces something the usual planning skills skip — **naming the trap**.
For any step where a reasonable person would plausibly do the wrong thing, say so.

The packet is a living document. When shipify finds an assumption wrong, it comes back
for an amendment, not a re-plan.

## Reliability contract

The worker may have only this packet — no conversation, no hidden reasoning.

- Stable IDs: `R*` `I*` `A*` `P*` `S*`. Never renamed mid-delivery.
- **Fact**, **Assumption** and **Decision** are tagged and never blurred.
- Concrete files, symbols, commands, observable results. Where the location is unknown,
  write a bounded discovery step instead of hand-waving.
- One authoritative instruction per change; later sections reference by ID.

## Pick the weight first

- **Light** — ≤5 steps, ≤3 files, one slice, one owner, reversible, no public contract
  change. Use the compact packet below.
- **Standard** — normal multi-file or feature work. Use the full packet unchanged.
- **Heavy** — production data, auth, schema, deployment, irreversible changes, public
  contracts, or coordinated agents. Use the full packet plus
  [the Heavy overlay](references/heavy.md).

When uncertain between Light and Standard, choose Light and name the assumption. Heavy
triggers are mandatory. Weight changes artifact depth, not authorization or safety, and
shipify may promote it when execution reveals more risk. Accept `Lite` as the legacy
name for `Light` in existing packets.

```markdown
## Light Packet
**Weight:** Light
**Outcome:** <what exists when done>
**Steps:**
1. <step> — `file` → `symbol` — verify: <command> — trap: <what a junior gets wrong, or none>
**Done when:** <observable check proving the outcome>
**Risks:** <one line each, or none>
**Out of scope:** <tempting adjacent work>
```

No risk register, no revision log, no plan folder. The Light packet *is* the plan.

## The full packet — Standard and Heavy

```markdown
## Worker Packet

**Weight:** Standard | Heavy

### Outcome
One paragraph: what exists when this is done.

### Scope
- **In:** exact components and behaviours
- **Out:** tempting adjacent work, explicitly excluded

### Requirements
- R1: <one testable behaviour>

### Invariants
- I1: <boundary that stays true, including on failure paths>

### Constraints & Priorities
- Hard limits, priority ordering `X > Y > Z`, anti-examples

### Evidence — tagged, never blurred
- [FACT] <fact> — <source>
- [ASSUMPTION] <assumption> — what breaks if false — how to check during execution
- [DECISION] <decision> — why, and what it rules out

### Risk Register
| Slice | Risk | L | Impact | Mitigation |

### Ordered Plan
- P1: <step> [ISOLATE | BATCH] — risk: low/med/high
  - Depends on: <P*>
  - Location: `path` → `symbol`
  - Change: <concrete behaviour>
  - Do not change: <invariant or boundary>
  - Verify: <exact command or observable check>
  - Failure signal: <what disproves this step>
  - Trap: <the plausible wrong move here — or omit if genuinely none>

### Acceptance
- A1: <command/observation> → <expected> — proves: R1, I1

### Stop Conditions
<what makes shipify stop rather than improvise>

### Revision Log
(shipify appends here)

### Topology
single-agent | subagent
```

## Traps — the junior bar

A trap is not a risk. A risk is what might go wrong with the *system*; a trap is what
goes wrong in the *executor's head*. Write one when a step has a plausible wrong move:

- *"Trap: the obvious fix is to make this async — don't, the caller holds a lock."*
- *"Trap: there are two `format()` in this file. You want the one in `Money`."*
- *"Trap: this test passes if you delete the assertion. Passing isn't the goal."*

Most steps have none. Forcing one everywhere produces noise, which is how a good rule
becomes ignored.

## Granularity tags

Tag every step. Shipify owns the execution semantics; you own the judgement.

- **[ISOLATE]** — high risk, touches irreversible state or a public contract, or its
  failure would obscure the next step's diagnosis.
- **[BATCH]** — additive, internal, low risk, or so tightly coupled to its neighbours
  that separate verification adds no signal.

## Slice when

More than 8 steps, more than one deployable unit, more than one irreversible transition,
a diff too large to review at once, or work that can't reach green in one sitting.

Each slice delivers one coherent outcome, leaves the repo green and committable alone,
carries its own acceptance checks, depends only on lower-numbered slices, and has a risk
entry.

## Amending in place

Shipify sends a **Revision Request** when a step's assumption is wrong but the intent
holds:

```markdown
## Revision Request
**Step:** P<n>
**Discovery:** <what the code or runtime actually shows>
**Affected assumption:** <which one is wrong>
**Proposed amendment:** <minimal plan change>
**Blast radius:** <other steps affected, or none>
```

Amend the step in place, append `[REV <date>] P<n>: <what changed and why>` to the
Revision Log, check whether downstream steps move, and return only the amended section.
One round-trip, not a re-shape.

Use a **Packet Defect** instead when the amendment would change requirements,
invariants or scope — the intent was wrong, not the plan. That routes to undumbify.

## Plan folder

Only when sliced, spanning sessions, or the user wants a file shipify reads later.

```
plans/<YYYY-MM-DD>-<slug>/
  README.md   index, execution order, status
  packet.md   the packet
  slices/     S1-<slug>.md, self-contained
  evidence/   shipify writes here
  reviews/    reviewify writes here
```

A single-slice inline packet is the artifact. Don't make a folder for it.

## Before you emit

Beyond what the template already forces: every `R*` and `I*` reaches at least one step
and one acceptance check, every acceptance check names who or what produces its proof,
dependencies are acyclic, and no step contains a vague verb —
*update as needed*, *handle edge cases*, *ensure quality* are not instructions. If the
packet says "see the discussion above", it has failed its own reliability contract.
