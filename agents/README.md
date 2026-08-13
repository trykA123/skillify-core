# Agents — harness-agnostic roles

A **role** is what an agent is for. **Wiring** is what a particular harness needs to
run it — model, tool names, thinking level, attached skills. They are kept apart so the
same roles work under pi, Claude Code, or anything else.

```
roles/<group>/   one .md per agent: name, description, and the role prompt. No harness keys.
profiles/        one .json per harness: model, tools, skills, group, and the capability map.
```

Groups are how the fleet reads at a glance, not a runtime concept — profiles address
agents by name and carry the `role` path.

## Why split

The roles previously carried pi's vocabulary in their frontmatter — `thinking`,
`inheritSkills`, `systemPromptMode`, `fallbackModels`, and tool names like `read, grep,
bash, contact_supervisor`. Claude Code expects `Read, Grep, Bash` and model tiers rather
than `deepseek/deepseek-v4-flash`. Neither set is wrong; both are local. Anything local
belongs in a profile.

## Roles point at skills; they never restate them

Where a role has a skill attached, **the skill owns the method and the output format —
the role owns the boundary**: what this agent is, what it must not do, and what it hands
back.

The roles were written before the skills matured, and they had drifted into describing
the same jobs in weaker words. `planner` carried its own plan format alongside shapeify's
packet; `reviewer` had a `Blocker`/`Note` scale competing with reviewify's
`Blocking`/`Material`/`Advisory`; `researcher` restated a thinner version of researchify's
sourcing rules. A configured agent loads both, and where two instructions conflict,
which one wins is undefined.

So a rule with teeth: **if you find yourself explaining how to do the work in a role
file, the skill already says it — point at it instead.** Duplication here doesn't cost
tokens so much as it costs a decidable answer.

## Capabilities

Roles speak **capability names**; profiles map them to whatever the harness actually
offers.

| Capability | Meaning | pi | Claude Code |
|---|---|---|---|
| `escalate` | Ask the dispatcher for a decision and wait for the reply | `contact_supervisor` | *(none)* |
| `fallbackChannel` | Generic message channel when escalation is unavailable | `intercom` | *(none)* |

**When a harness provides no escalation channel**, an agent that needs a decision does
not guess and does not silently choose: it returns the decision as a blocking question
in its result and stops. That is the portable behaviour the capability abstracts — the
channel is an optimisation, not the rule.

## The roles

| Group | Role | What it does | Skill that owns its method |
|---|---|---|---|
| `oversight` | `orchestrator` | Conductor — delegates, verifies, escalates | — |
| `oversight` | `oracle` | Decision-consistency check (`advisor` is an alias) | — |
| `recon` | `scout` | Fast codebase recon | `orientify` |
| `recon` | `context-builder` | Intent extraction and the handoff pack | `undumbify` |
| `recon` | `researcher` | Autonomous web research | `researchify` |
| `pipeline` | `planner` | Turns intent into an executable packet | `shapeify` |
| `pipeline` | `worker` | The single writer thread | `shipify` |
| `pipeline` | `reviewer` | Judges work against intent | `reviewify`, `audify` |
| `memory` | `recorder` | Writes the sanitized session record | `recordify` |

`orchestrator` and `recorder` are ours. The other seven began as snapshots of the
`pi-subagents` package; their roles are now maintained here, and their wiring lives in
`profiles/pi.json`.

`orchestrator` and `oracle` have no owning skill — conducting and decision-consistency
aren't covered by one, so those two role files legitimately carry their own method.

## Retired

Kept out on evidence, not taste. Counted from every pi session log (2,518 subagent
spawns):

| Retired | Calls | Why |
|---|---:|---|
| `advisor` | 0 | Was a byte-for-byte copy of `oracle`. Now an alias in both profiles. |
| `delegate` | 0 | A generic no-context child — which is what every harness already ships as its default subagent. |
| `librarian` | 0 | `librify`'s own Status section says it isn't earning its keep yet: 22 entries, all hand-seeded on one day. The skill stays; the fleet slot didn't. |

Nine agents remain and six of them — worker, orchestrator, reviewer, planner,
researcher, scout — account for ~97% of all calls.

## No secrets

No credentials, tokens, or authenticated URLs. Runtime secrets live in the harness's own
auth store and the homelab `.env` — never here.
