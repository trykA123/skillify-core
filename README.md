# skillify

A set of six interlocking skills for AI-assisted work. Designed around one insight:
**the ceremony between skills should match the context boundary they cross.**

## The Skills

| Skill | Cognitive mode | Entry point |
|-------|---------------|-------------|
| `explore` | Divergent — generate radically different options | "I don't know what I want yet" |
| `undumbify` | Convergent — extract intent from ambiguity | "I have a direction but it's vague" |
| `shapeify` | Structural — decompose into executable slices | "I know what I want, plan it" |
| `shipify` | Disciplined — execute with adaptive validation | "Execute this plan" |
| `reviewify` | Critical — judge against intent, not taste | "Review what was built" |
| `diagnose` | Abductive — infer cause from symptoms | "Something broke" |

## How They Connect

```
                    ┌──────────┐
                    │ explore  │  (standalone, pre-pipeline)
                    └────┬─────┘
                         │ chosen direction
                         ▼
┌──────────    ┌──────────┐    ┌──────────    ┌──────────┐
│ undumbify│───▶│ shapeify │───▶│ shipify  │───▶│ reviewify│
└──────────┘    └──────────┘    └──────────┘    └──────────┘
      ▲               ▲               │               │
      │               │    BLOCKED    │    REPLAN     │
      │               └───────────────┘───────────────┘
      │                               │
      │         ┌──────────┐          │
      └─────────│ diagnose │──────────┘
   root-cause   └──────────   trivial fix
   brief                     (handled inline)
```

## Topology Awareness

Every skill detects its execution topology and adjusts ceremony accordingly:

- **Single-agent (all roles in one context):** Handoff artifacts are internal working notes.
  No formal briefs between steps — the agent already has the context.
- **Subagent (each role in isolated context):** Full handoff documents. The packet IS the
  only rope the next agent has. Ceremony = signal.
- **Hybrid (plan in main thread, execute in subagent):** Planning absorbs conversational
  nuance; execution follows the packet faithfully with no drift.

Skills signal topology via a `topology:` field in their output. When absent, assume
single-agent and collapse ceremony.

## Shared ID System

IDs flow through the pipeline without renaming:

- `R1, R2, ...` — Requirements (testable behaviors)
- `I1, I2, ...` — Invariants (boundaries that must remain true)
- `A1, A2, ...` — Acceptance checks (commands/observations that prove R* and I*)
- `P1, P2, ...` — Plan steps (ordered implementation actions)
- `S1, S2, ...` — Slices (independently shippable groups of steps)
- `F1, F2, ...` — Findings (review issues with location and fix)

## Design Principles

1. **Constraints over solutions.** Skills extract WHY, not HOW. The user provides intent;
   the agent figures out implementation.
2. **Anti-examples are high-signal.** "NOT like X" eliminates more bad options than
   "like Y" generates good ones.
3. **Priority ordering resolves conflicts silently.** When things clash, the stated
   priority wins without asking.
4. **Feeling of done > acceptance checklist.** The gestalt target guides micro-decisions
   that no checklist can enumerate.
5. **Adaptive granularity.** Not every step needs the same isolation. Risk determines
   validation frequency.
6. **Living documents.** Plans can be revised in place. Feedback loops don't require
   full regeneration.
7. **Solo mode is first-class.** Most work is one human + one agent. The pipeline
   shouldn't require a team to be useful.

## Installation

Copy the skill folders to `~/.qwen/skills/`:

```bash
cp -r explore undumbify shapeify shipify reviewify diagnose ~/.qwen/skills/
```

## License

MIT
