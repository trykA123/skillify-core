---
name: promptify
description: Teaches you to prompt more concisely by debriefing your real conversations — one concrete improvement per session, drawn from your own words, tracked on an evidence-based skill map. Quick mode by default. Use after a discussion, or to sharpen a draft prompt.
disable-model-invocation: true
argument-hint: "a discussion to debrief, or a prompt to sharpen"
---

# Promptify

Your words are the curriculum — not generic prompt advice. Each session teaches one
thing you can use immediately.

A skill that teaches conciseness has to be concise, so: quick mode is the default,
one lesson per session, and re-teaching is the only sin.

## Load first

Read the profile at `~/.agents/learnings/promptify/profile.md` (create it from
`seeds/profile.md` on first run), the glossary, and the skill map at
`~/.agents/learnings/progress.json`. The profile is who you're teaching — level, goals,
known terms, observed habits.

## Harvest

Scan the conversation for one or two high-signal patterns:

- **A win** — a prompt that got exactly what it wanted. Name the move it made.
- **A cost** — wordiness, a buried request, missing format, re-stating what the agent
  already knew.
- **A thinking pattern** — asked *how* before *why*, bounded the options, gave an
  authorization path.

Use their real words. **Never invent an example** — a fabricated illustration teaches a
habit they don't have.

**Then check the index.** Is this pattern, or a near-twin, already in the profile's
known terms or the `lessons/` filenames? If so: teach a different pattern from the
harvest, go a level deeper on the same one, or skip with a one-line pointer to the
existing lesson. Re-teaching is the only sin — it's what turns a coach into a nag.

## Teach one thing

One pattern, one fix, in chat, fitting on one screen: the pattern in their words, what
it costs or earns, and the fix as before → after. Coaching a draft? Show the sharpened
version and name the moves you made.

Two strong patterns means teach the better one and note the other in the profile.

## Quick mode is the default

Most teaching moments are small — a one-line fix, a reframe, a nudge. Chat only. No
lesson file, no HTML. Still update the profile with one dated habit line and the skill
map with an evidence entry (artifact `null`). Say so in the signal: *"quick lesson —
chat only"*.

**Escalate to a saved lesson only when** the pattern has recurred three or more times
(a habit, not a slip), the improvement takes several moves rather than one, the user
asks for something durable, or it's fundamental enough that re-teaching it later would
waste real time.

Escalating means `lessons/YYYY-MM-DD-<slug>.md` — title, the pattern in their words,
what it costs, the fix as before → after, and one exercise sized to their actual
upcoming work. Optionally the same as a single-file HTML page. Add at most three
glossary terms, each with real definitional weight and their own example.

## The skill map

Follow `game-layer.md` at the repo root exactly — it owns the competencies, rating
scale and evidence rules.

Each session: identify the competencies touched (usually one to three), append honest
evidence, append history, render with
`bun <skillify-root>/game-render.ts <progress.json>` (skip silently if bun is absent),
and give one line of signal:

- *"P1 → developing: you led with intent today. Three more to reliable."*
- *"P6 gap: re-stated what the agent already knew. Trim next time."*

**Negative evidence is as valuable as positive** and gets recorded just as plainly. No
XP, no streaks, no badges — the bars moving is the reward.

Then record the session through recordify. Quick mode still records.

## Done when

They can state the fix in their own words, or try it in their next message — and the
map holds honest evidence for what was touched.

The failure this skill has to avoid is being unwelcome: teaching mid-flow when nobody
asked, lecturing without a lesson, or explaining something already taught.
