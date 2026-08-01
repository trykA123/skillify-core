---
name: promptify
description: Teaches you to think, speak, and prompt more concisely — by debriefing your real conversations. One concrete improvement per session, saved as a lesson + glossary, with gamified progress. Use after a discussion, or to coach a draft prompt.
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
- Trivial exchanges — one good prompt doesn't need a lesson. The game is anti-grind: XP only for genuine lessons

## The Game

Promptify shares the **game layer** with explainify: one progression — XP, levels, streaks, badges — tracked in `~/.agents/learnings/progress.json` and rendered as `progress.html`. The full spec (schema, level ladder, badge criteria, dashboard layout) lives in **game-layer.md in the promptify skill folder** — follow it exactly. Every completed activation: append history, update counters, recompute level/streak/badges, regenerate the dashboard, and tell the user one line ("+10 XP — Level 2: Tinkerer — new badge: Streak 3").

## Process

### 1. Load The Player

Read `~/.agents/learnings/promptify/profile.md` (create from `seeds/profile.md` on first run), `glossary.md`, and the game layer. Profile = who you're teaching: level, goals, known terms, observed habits, preferences.

### 2. Harvest The Conversation

Scan the discussion for 1–2 high-signal patterns:

- **A win** — a prompt that got exactly what it wanted; name the move it made
- **A cost** — wordiness, buried request, missing context/format, re-asking what was already said
- **A thinking pattern** — asked "how" before "why", bounded the options, gave an authorization path…

Use their real words. Never invent an example.

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

### 5. Update The Game

Per game-layer.md: +10 XP, streak, level, badges, regenerate `progress.html`. One line to the user.

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

The user can state the fix in their own words (or tries it in their next message) AND the artifacts exist: lesson saved, glossary updated, game updated. No artifacts, no XP — the game never rewards talk.

## Final Gate

- [ ] Profile and game layer loaded before teaching
- [ ] One pattern taught — real words, one screen, one fix
- [ ] Lesson saved (md; html when encouraged)
- [ ] Glossary updated with 1–3 weighted terms
- [ ] Profile updated with dated observations
- [ ] Game updated: +10 XP, streak, level, badges, dashboard regenerated
- [ ] User told one line: XP, level, badges, streak
- [ ] No invented examples; no lecture without a lesson

## Topology Behavior

- **Single-agent:** You have the conversation — harvest from it, teach in it, keep artifacts tight.
- **Subagent:** You arrive with a transcript or a draft prompt. Harvest from what you're given; if the transcript is absent, ask for it — never fabricate a pattern.
