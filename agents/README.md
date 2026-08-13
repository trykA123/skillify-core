# Agents — harness-agnostic roles

A **role** is what an agent is for. **Wiring** is what a particular harness needs to
run it — model, tool names, thinking level, attached skills. They are kept apart so the
same roles work under pi, Claude Code, or anything else.

```
roles/       one .md per agent: name, description, and the role prompt. No harness keys.
profiles/    one .json per harness: model, tools, skills, and the capability map.
```

## Why split

The roles previously carried pi's vocabulary in their frontmatter — `thinking`,
`inheritSkills`, `systemPromptMode`, `fallbackModels`, and tool names like `read, grep,
bash, contact_supervisor`. Claude Code expects `Read, Grep, Bash` and model tiers rather
than `deepseek/deepseek-v4-flash`. Neither set is wrong; both are local. Anything local
belongs in a profile.

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

| Role | What it does |
|---|---|
| `orchestrator` | Conductor — delegates, verifies, escalates |
| `planner` | Turns intent into a worker packet |
| `worker` | The single writer thread |
| `reviewer` | Verifies implementation against intent |
| `oracle` | Decision-consistency check (`advisor` is an alias) |
| `researcher` | Autonomous web research |
| `scout` | Fast codebase recon |
| `context-builder` | Intent extraction |
| `librarian` | Compiles and recalls the library |
| `delegate` | Lightweight generic child |

`orchestrator` and `librarian` are ours. The other eight began as snapshots of the
`pi-subagents` package; their roles are now maintained here, and their wiring lives in
`profiles/pi.json`.

## No secrets

No credentials, tokens, or authenticated URLs. Runtime secrets live in the harness's own
auth store and the homelab `.env` — never here.
