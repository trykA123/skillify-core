# Pi Subagents — the fleet

The subagent fleet used by this homelab's pi setup, versioned for reproducibility.

## What's here

| File | What it is |
|---|---|
| `fleet-config.json` | The `subagents` block from pi's user settings: `defaultModel` + per-agent overrides (model, fallback models, thinking level, attached skills). Drop it under `"subagents"` in `~/.pi/agent/settings.json` to reproduce the fleet. |
| `orchestrator.md` | **Custom agent** (ours): the pipeline conductor ("boss") — plans and delegates across scout/planner/worker/reviewer/oracle. Installed to `~/.agents/orchestrator.md`. |
| `librarian.md` | **Custom agent** (ours): the fleet's write-only memory — compiles verified lessons into the library (Shoin) and serves bounded recall; agents never self-publish. Installed to `~/.agents/librarian.md`. |
| `advisor.md` … `worker.md` | Snapshots of the 9 builtin agents from the `pi-subagents` npm package (their canonical source is the package — these are reference copies for review). |

## Fleet at a glance

| Agent | Model | Thinking | Skills | Role |
|---|---|---|---|---|
| `orchestrator` | flash | high | rtk-first | Conductor — delegates, verifies, escalates |
| `planner` | qwen3.8-max-preview | medium | undumbify, shapeify, explorify | Turns intent into a Worker Packet |
| `worker` | flash | high | shipify, ponytail, traceify, prototype, shadcn, caveman-commit, rtk-first | The single writer thread |
| `reviewer` | qwen3.8-max-preview | medium | reviewify, code-review, ponytail-review, ponytail-audit, ponytail-debt, caveman-review, rtk-first | Verifies implementation against intent |
| `oracle` / `advisor` | qwen3.8-max-preview | xhigh | grilling, domain-modeling, codebase-design, rtk-first | Decision-consistency check |
| `researcher` | flash | high | research, researchify | Autonomous web research |
| `scout` | flash | low* | caveman, rtk-first | Fast codebase recon |
| `context-builder` | flash | high | undumbify, domain-modeling, rtk-first | Intent extraction + meta-prompt |
| `librarian` | qwen3.8-max-preview | xhigh | librify, rtk-first | Compile & recall the fleet's evidence-linked library |
| `delegate` | inherits | inherits | rtk-first | Lightweight generic child |

\* scout's `low` clamps up to `high` at runtime — deepseek supports only `off`/`high`/`max`.

**Fallback models:** the fleet runs **qwen ↔ flash only** — qwen agents fall back to `deepseek-v4-flash`; flash agents fall back to `qwen3.8-max-preview` (cross-provider availability insurance; `deepseek-v4-pro` is not used, not even as fallback).

## No secrets

This folder deliberately contains **no credentials**: no API keys, no tokens, no passwords, no URLs with auth. Runtime secrets live in `~/.pi/agent/auth.json` and the homelab `.env` — never in agent files or fleet config.
