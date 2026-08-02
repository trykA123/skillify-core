---
name: promptify
description: Teaches you to think, speak, and prompt more concisely — by debriefing your real conversations. One concrete improvement per session; progress tracked on an evidence-based skill map, not gamification. Use after a discussion, or to coach a draft prompt.
disable-model-invocation: true
argument-hint: "a discussion to debrief, or a prompt to sharpen"
---

# Promptify

Your words are the curriculum. Not generic prompt tips — YOUR phrasing, your habits, your wins and your token-waste. Each session teaches one thing you can use immediately, saves what was learned, and levels you up.

## When To Use

- "Debrief that" / "what could I have said better?" after a meaty discussion
- "Make this prompt more concise" / "how should I have asked that?"
- A periodic review: "what patterns am I repeating?"

## When NOT To Use

- Mid-flow: don't stop momentum to teach unless asked
- User wants content, not coaching (a rewrite is fine; a lecture is not)
- Trivial exchanges — one good prompt doesn't need a lesson. The map is anti-grind: evidence only for genuine moments

## The Skill Map

Promptify shares the **skill map** with explainify: a competency-based progression tracked
in `~/.agents/learnings/progress.json` and rendered as `progress.html`. The full spec
(competencies, rating scale, evidence rules, dashboard layout) lives in **game-layer.md
at the skillify repo root** — follow it exactly.

Every activation: identify which competencies were touched (usually 1–3), append honest
evidence (positive or negative — both are valuable), append history, regenerate the
dashboard, and tell the user one line of signal:
- "P1 → developing: you led with intent today. 3 more to reliable."
- "P6 gap: re-stated what the agent already knew. Trim next time."

No XP. No streaks. No badges. The bars moving IS the reward.

## Process

### 1. Load The Player

Read `~/.agents/learnings/promptify/profile.md` (create from `seeds/profile.md` on first run), `glossary.md`, and the skill map (`progress.json`). Profile = who you're teaching: level, goals, known terms, observed habits, preferences.

### 2. Harvest The Conversation

Scan the discussion for 1–2 high-signal patterns:

- **A win** — a prompt that got exactly what it wanted; name the move it made
- **A cost** — wordiness, buried request, missing context/format, re-asking what was already said
- **A thinking pattern** — asked "how" before "why", bounded the options, gave an authorization path…

Use their real words. Never invent an example.

**Check the index first — no re-teaching.** Before committing to a pattern, check the profile's Known terms and the `lessons/` filenames: is this (or a near-twin) already taught? If yes, teach a different pattern from the harvest, go one level deeper on the same one, or skip with a one-line pointer to the existing lesson ('covered on <date> — link'). Re-teaching is the only sin.

### 3. Teach One Lesson (ZPD-sized)

One pattern, one fix, in chat, tight:

- The pattern (with their real words)
- What it costs or earns (tokens, clarity, speed)
- The fix (before → after, minimal)
- Coaching a draft? Show the sharpened version + the moves you made

A lesson fits in one screen. Two strong patterns? Teach the better one, note the other in the profile.

### 4. Save The Artifacts

- **Lesson**: `lessons/YYYY-MM-DD-<slug>.md` (template below) — the durable record
- **HTML** (optional, encouraged): the same lesson as a simple single-file page — inline CSS, one diagram max, no dependencies (see html-template.md)
- **Glossary**: add 1–3 terms max per session, only terms with real definitional weight; each entry uses the session's real example
- **Profile**: update habits (dated observations), adjust level if evidence says so

### 5. Update The Skill Map

Per game-layer.md: identify competencies touched, append evidence (honest valence),
append history, then render (when Node is available) with `node <skillify-root>/game-render.js <progress.json>`.
One line to the user — the signal, not ceremony.

## Default: Quick Mode

Quick mode is the **default**, not the exception. Most teaching moments are small — a
one-line fix, a reframe, a nudge. Teach chat-only, no lesson file, no HTML. Still update
the profile (one dated habit line) and the skill map (evidence entry, history with
artifact `null`). Say it in the signal line: 'quick lesson — chat only'.

### Escalate to full ceremony ONLY when:

- The user has repeated the same pattern 3+ times (it's a habit, not a slip)
- The lesson involves a multi-move improvement (not a one-line fix)
- The user explicitly asks for a durable artifact ("save this", "write it up")
- The pattern is fundamental enough that re-teaching it later would waste real time

When escalating: lesson file, optional HTML, glossary, the works. But the bar is high.
A skill that teaches conciseness must itself be concise.

## Artifact Templates

### Lesson

```markdown
# <One-line title>
<date>

## The pattern
<their real words>

## What it costs / earns

## The fix
<before → after>

## Try it
<one prompt-sized exercise using their own upcoming work>
```

### Glossary entry

`<term> — <definition in plain words> — <their real example, one line>`

### Profile

```markdown
# Profile — <user>
<updated date>

## Level
<novice | intermediate | advanced — inferred from evidence, confirmed with user>

## Goals
<from the user — e.g. think better, speak better, be more concise>

## Known terms
<linked to glossary — never re-teach these>

## Observed habits
- <date>: <pattern observed> — <strength or cost>

## Preferences
<lesson length, HTML yes/no, register, anything they've stated>
```

## Completion Criterion

The user can state the fix in their own words (or tries it in their next message) AND the skill map has honest evidence for the competencies touched. Full artifacts (lesson, glossary) only when escalation criteria were met. Quick mode: chat-only, evidence still recorded, artifact null.

## Final Gate

- [ ] Profile and skill map loaded before teaching
- [ ] Pattern checked against the lessons index + glossary — no re-teaching
- [ ] One pattern taught — real words, one screen, one fix
- [ ] Lesson saved (md; html when encouraged) — or quick mode declared (artifact null)
- [ ] Glossary updated with 1–3 weighted terms (when escalated)
- [ ] Profile updated with dated observations
- [ ] Skill map updated: evidence appended (honest valence); dashboard rendered when Node is available
- [ ] Session recorded via recordify (sanitized session record written to RECORDS_DIR) — the done path fires it; quick mode still records
- [ ] User told one line: which competency moved, or which gap was exposed
- [ ] No invented examples; no lecture without a lesson

## Topology Behavior

- **Single-agent:** You have the conversation — harvest from it, teach in it, keep artifacts tight.
- **Subagent:** You arrive with a transcript or a draft prompt. Harvest from what you're given; if the transcript is absent, ask for it — never fabricate a pattern.
