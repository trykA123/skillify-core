---
name: explainify
description: Teaches you what code does and how its parts communicate — at your level, in your repo. Saves knowledge docs, glossary, and wiring diagrams; skill-map progress shared with promptify. Use when you ask about code, a module, a flow, or want the connections mapped.
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
- The question is answerable in one line — answer it; don't build a lesson. The map is anti-grind

## The Skill Map

Shared with promptify — one competency-based progression, `~/.agents/learnings/progress.json`
+ `progress.html`, spec in **game-layer.md (skillify repo root)**. Same rules: identify
competencies touched (usually U1–U4), append honest evidence, regenerate the dashboard,
one line of signal to the user. No XP, no streaks — the bars moving is the reward.

## Process

### 1. Load The Player And The Index

- Profile: `~/.agents/learnings/explainify/profile.md` (create from `seeds/profile.md` on first run) — level, known terms, preferences
- `docs/learnings/` index in this repo — what's already taught (update, don't duplicate)
- The skill map (`progress.json`)
- If your harness offers compact/filtered read wrappers, prefer them; otherwise read the code directly

### 2. Read The Code In Scope

The actual code — never the assumption. Read the symbols in the question, their callers, their tests, their config. Follow one concrete path end-to-end.

### 3. Teach At Their Level (chat-first)

- **What it does** — plain language, 2–3 sentences; analogies only when they illuminate
- **The wiring** — how parts communicate: calls, events, data flow, imports, config; one path traced with real line references
- Real examples only. If the profile says skip basics — skip them.

**Default: teach in chat, done.** The explanation lives in the conversation. No file,
no HTML, no diagram. The user asked a question, you answered it well. That's the job.

### 4. Escalate To Artifacts (only when earned)

Produce durable artifacts ONLY when:

- The explanation spans **3+ modules** (chat can't hold the wiring in working memory)
- The user explicitly asks for a durable artifact ("save this", "make a doc", "diagram it")
- The same module gets asked about **again** (it's a knowledge gap worth filling permanently)

When escalating:

- **Knowledge doc**: `docs/learnings/<slug>.md` — one doc per module/flow, **updated in place** (merged, dated), never one doc per question (anti-sprawl)
- **Glossary**: repo terms that earn definitional weight — a competent engineer wouldn't guess them, and misreading costs real time. 1–3 per activation
- **HTML page** (when connections are central AND the user wants it): single-file, inline CSS, **mermaid wiring diagram** — nodes = modules, labeled edges = communication, real names (see html-template.md)

If none of the escalation criteria fire: skip this step entirely. Update the profile
(one dated observation), move on.

### 5. Update The Skill Map

Identify competencies touched, append evidence (honest valence), append history,
render `progress.html` (when Node is available) via `node <skillify-root>/game-render.js <progress.json>`.
One line of signal to the user.

## Artifact Templates

### Knowledge doc

```markdown
# <Module / Flow>
<updated date — updated in place, not duplicated>

## What it does
<3 lines, plain language>

## The wiring
<the path through the system: who calls whom, what flows where — add a `mermaid` flowchart block when it clarifies; renders in GitHub/Obsidian>

## Key symbols
<name — what it is — where>

## Gotchas
<surprises, landmines, half-migrations>

## Glossary links
<terms defined in this repo's learnings glossary>
```

### Glossary entry

`<term> — <definition> — <where it appears, one line>`

### Wiring diagram

Mermaid source, not hand-drawn SVG — the executor writes declarative text (`A -->|call| B`), not coordinates, so the diagram is robust to generate and greppable against the code. One node per module (real names), edges labeled with the communication (call / event / data), the traced path highlighted with a `classDef`. One diagram max per artifact.

- **Knowledge doc:** a fenced `mermaid` block — renders natively in GitHub / Obsidian, degrades to readable source elsewhere.
- **HTML page:** the same source inside `<pre class="mermaid">`, rendered by the mermaid library; offline it stays readable (see html-template.md).

### Profile

Same shape as promptify's: level, known terms, preferences (depth, diagrams yes/no, doc yes/no), dated observations.

## Completion Criterion

The user can explain the thing back (or asks a sharper follow-up) AND the skill map was updated with honest evidence. Artifacts (doc, diagram) only when escalation criteria were met.

## Final Gate

- [ ] Profile, learnings index, and skill map loaded
- [ ] Real code read — one path traced end-to-end
- [ ] Taught at their level: what + wiring, real examples
- [ ] Knowledge doc saved/updated ONLY if escalation fired — otherwise chat-only declared
- [ ] Glossary updated with weighted terms (when escalated)
- [ ] HTML + diagram produced only when connections were central AND the user wanted it
- [ ] Skill map updated; one line of signal to the user
- [ ] Nothing modified outside `docs/learnings/` and the skill map

## Topology Behavior

- **Single-agent:** You have the conversation — read, teach, save. Keep artifacts tight; the user's follow-up questions are the feedback loop.
- **Subagent:** You arrive with a question and a target path. Read the real code, teach, save artifacts. If the path is missing, ask — never teach from memory.
