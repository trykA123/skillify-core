---
name: explainify
description: Teaches you what code does and how its parts communicate — at your level, in your repo. Saves knowledge docs, glossary, and wiring diagrams; gamified progress shared with promptify. Use when you ask about code, a module, a flow, or want the connections mapped.
disable-model-invocation: true
argument-hint: "code to explain, or a wiring question"
---

# Explainify

The codebase is the curriculum. Every question becomes a durable, browsable artifact: a knowledge doc for the module, glossary terms for its vocabulary, and when connections are the point — an HTML page with a wiring diagram.

## When To Use

- "What does this do?" / "Explain this file / module / flow"
- "How do X and Y communicate?" / "Map the connections"
- Learning a repo (pair with orientify for the whole-map view)

## When NOT To Use

- Something is broken → traceify
- Planning a change → orientify, then shapeify
- "Is this code good?" → reviewify
- The question is answerable in one line — answer it; don't build a lesson. The game is anti-grind

## The Game

Shared with promptify — one progression, `~/.agents/learnings/progress.json` + `progress.html`, spec in **game-layer.md (promptify skill folder)**. Same rules: +10 XP per completed activation, streak, level, badges, regenerate the dashboard, one line to the user.

## Process

### 1. Load The Player And The Index

- Profile: `~/.agents/learnings/explainify/profile.md` (create from `seeds/profile.md` on first run) — level, known terms, preferences
- `docs/learnings/` index in this repo — what's already taught (update, don't duplicate)
- The game layer
- Prefer rtk-wrapped reads (`rtk read`, `rtk rg`) for compact, filtered views

### 2. Read The Code In Scope

The actual code — never the assumption. Read the symbols in the question, their callers, their tests, their config. Follow one concrete path end-to-end.

### 3. Teach At Their Level

- **What it does** — plain language, 2–3 sentences; analogies only when they illuminate
- **The wiring** — how parts communicate: calls, events, data flow, imports, config; one path traced with real line references
- Real examples only. If the profile says skip basics — skip them.

### 4. Save The Artifacts

- **Knowledge doc**: `docs/learnings/<slug>.md` — one doc per module/flow, **updated in place** (merged, dated), never one doc per question (anti-sprawl)
- **Glossary**: repo terms that earn definitional weight — a competent engineer wouldn't guess them, and misreading costs real time. 1–3 per activation
- **HTML page** (required when connections are central): single-file, inline CSS, **inline SVG wiring diagram** — boxes = modules, arrows = communication, real names (see html-template.md)

### 5. Update The Game

+10 XP, streak, level, badges, regenerate `progress.html`. One line to the user.

## Artifact Templates

### Knowledge doc

```markdown
# <Module / Flow>
<updated date — updated in place, not duplicated>

## What it does
<3 lines, plain language>

## The wiring
<the path through the system: who calls whom, what flows where>

## Key symbols
<name — what it is — where>

## Gotchas
<surprises, landmines, half-migrations>

## Glossary links
<terms defined in this repo's learnings glossary>
```

### Glossary entry

`<term> — <definition> — <where it appears, one line>`

### Wiring diagram (inside HTML pages)

SVG, inline: one box per module (real names), arrows labeled with the communication (call / event / data), the traced path highlighted. One diagram max per page.

### Profile

Same shape as promptify's: level, known terms, preferences (depth, diagrams yes/no, doc yes/no), dated observations.

## Completion Criterion

The user can explain the thing back (or asks a sharper follow-up) AND the artifacts exist: knowledge doc saved or updated, glossary updated, game updated. No artifacts, no XP.

## Final Gate

- [ ] Profile, learnings index, and game loaded
- [ ] Real code read — one path traced end-to-end
- [ ] Taught at their level: what + wiring, real examples
- [ ] Knowledge doc saved or updated in place
- [ ] Glossary updated with weighted terms
- [ ] HTML + diagram produced when connections were central
- [ ] Game updated; one line to the user
- [ ] Nothing modified outside `docs/learnings/` and the game layer

## Topology Behavior

- **Single-agent:** You have the conversation — read, teach, save. Keep artifacts tight; the user's follow-up questions are the feedback loop.
- **Subagent:** You arrive with a question and a target path. Read the real code, teach, save artifacts. If the path is missing, ask — never teach from memory.
