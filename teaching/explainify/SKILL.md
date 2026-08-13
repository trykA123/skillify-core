---
name: explainify
description: Teaches what code does and how its parts communicate, at your level and in your repo. Answers in chat by default; produces a knowledge doc, glossary terms and a mermaid wiring diagram only when the explanation earns them. Use when you ask about code, a module or a flow, or want the connections mapped.
disable-model-invocation: true
argument-hint: "code to explain, or a wiring question"
---

# Explainify

The codebase is the curriculum, and the target is a junior who has to be able to work in
it afterwards — not a summary that sounds right.

**Answer in chat. That's the default and usually the whole job.** Most tools of this kind
can't resist producing an artifact; an unread document is worse than a good answer.

## Load first

The profile at `~/.agents/learnings/explainify/profile.md` (create from `seeds/profile.md`
on first run) for level, known terms and preferences. The `docs/learnings/` index for what
this repo has already taught — update rather than duplicate. The skill map at
`~/.agents/learnings/progress.json`.

## Read the actual code

Never the assumption. Read the symbols in the question, their callers, their tests, their
config — and follow **one concrete path end to end**. That path is what separates an
explanation from a paraphrase of the file names.

## Teach at their level

- **What it does** — plain language, two or three sentences. Analogies only when they
  illuminate rather than decorate.
- **The wiring** — how the parts communicate: calls, events, data flow, config. One path
  traced, with real line references.

Real examples only. If the profile says skip the basics, skip them — explaining what a
promise is to someone who ships async code daily is how a teacher loses their audience.

## Escalate only when earned

Produce durable artifacts when the explanation spans **three or more modules** (chat
can't hold that much wiring), the user asks for something durable, or **the same module
gets asked about twice** — the second question is proof the first answer didn't stick.

- **Knowledge doc** — `docs/learnings/<slug>.md`, one per module or flow, **updated in
  place and dated**. Never one doc per question; that's how a learnings folder becomes
  unreadable. Cover what it does, the wiring, key symbols, gotchas.
- **Glossary** — one to three terms that a competent engineer genuinely wouldn't guess
  and where misreading costs real time.
- **Wiring diagram** — mermaid *source*, not hand-drawn SVG: the executor writes
  `A -->|call| B` rather than coordinates, so it survives regeneration and stays
  greppable against the code. One node per module with real names, edges labelled with
  the kind of communication, one diagram maximum.

If none of those fire, skip this entirely, note one dated observation in the profile,
and move on.

## The skill map

Shared with promptify, spec in `game-layer.md` at the repo root. Identify the
competencies touched, append honest evidence, append history, render via
`bun <skillify-root>/game-render.ts <progress.json>` (skip silently if bun is absent),
and give one line of signal. No XP, no streaks.

Then record the session through recordify. Chat-only sessions still record.

## Done when

They can explain it back, or ask a sharper follow-up question. The sharper follow-up is
the better signal.

Nothing outside `docs/learnings/` and the skill map should have changed — explaining code
is not licence to edit it.
