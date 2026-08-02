# Game Layer — skill map for promptify & explainify

One progression, two teachers, evidence from the whole pipeline. Not XP and badges —
a **competency map** that shows what you're getting better at, with dated proof from
real conversations.

Runtime data: `~/.agents/learnings/progress.json` (source of truth).
Rendered dashboard: `progress.html` (regenerated on every update).
This spec lives here — once — and both skills follow it.

## Philosophy

- **Quality over frequency.** "You led with intent + constraints in one line and got a
  first-try result" beats "+10 XP." The goal is observable improvement, not streaks.
- **Evidence over points.** Every competency rating is backed by dated one-liners from
  real interactions. No rating without evidence. No evidence without a real moment.
- **Harvest from everything.** The teaching skills (promptify, explainify) are the
  primary harvesters, but ANY pipeline interaction is a data point:
  - undumbify had to ask 3 questions → under-specified prompt (evidence for "constraints upfront")
  - shapeify's lite packet worked first try → good scope calibration
  - reviewify found 0 blocking findings → clear intent communication
  - traceify resolved in 2 hypotheses → good symptom description
  - shipify hit a Revision Request → plan input was incomplete (not the user's fault
    always — but it's signal)
- **Anti-grind.** No XP for talk. No streaks for showing up. The map updates only when
  there's genuine evidence of growth or a genuine gap exposed.

## Competencies

The list is **progressive**. Start tracking only Prompting (P1–P7). The Understanding
and Pipeline groups unlock when the first evidence entry appears for any competency in
that group — the renderer shows locked groups as a single "not yet active" line instead
of 4–3 empty bars. This prevents the dashboard from looking like a report card full of
zeros on day one.

Unlock rules:
- **Understanding (U1–U4):** unlocks on first explainify activation that records evidence
- **Pipeline (W1–W3):** unlocks on first pipeline harvest (shipify/reviewify signal)

Before unlock, the renderer omits the group entirely. After unlock, all competencies in
that group appear (most will be "emerging" with 0 evidence — that's fine, they'll fill).

### Prompting (promptify's domain) — active from day one

| ID | Competency | What "reliable" looks like |
|----|-----------|---------------------------|
| P1 | Lead with intent | Request is in the first sentence. Context follows, not precedes. |
| P2 | Constraints upfront | Hard limits stated before the agent starts guessing. |
| P3 | Anti-examples | "Not like X" used to kill wrong directions early. |
| P4 | Priority ordering | When things can clash, what wins is stated. |
| P5 | Scope boundaries | In/out stated. "Don't touch Y" when Y is tempting. |
| P6 | Right-sized context | Enough to decide, not a novel. No re-stating what's known. |
| P7 | Verification asks | "Prove it by running X" — the agent knows what "done" looks like. |

### Understanding (explainify's domain)

| ID | Competency | What "reliable" looks like |
|----|-----------|---------------------------|
| U1 | Specific questions | "How does X talk to Y?" not "explain this file." |
| U2 | Trace before asking | Read one path, then ask about the gap — not "what does everything do?" |
| U3 | Build on known | Reference what you already understand. Skip what you don't need. |
| U4 | Right artifact ask | Know when chat suffices vs. when a diagram/doc earns its cost. |

### Working the pipeline (harvested from all skills)

| ID | Competency | What "reliable" looks like |
|----|-----------|---------------------------|
| W1 | Right skill, right moment | Reach for traceify when broken, undumbify when vague — not "do everything." |
| W2 | Handoff quality | Inputs to the next skill are complete enough to avoid round-trips. |
| W3 | Calibration | Know when lite suffices vs. when full ceremony earns its keep. |

## Rating scale

Each competency: `emerging → developing → reliable → mastered`

| Rating | Meaning | Evidence bar |
|--------|---------|-------------|
| emerging | Seen it done once or twice, not yet habitual | 1–2 evidence entries |
| developing | Happens regularly but still slips under pressure | 3–5 evidence entries |
| reliable | Default behavior. Slips are rare and self-corrected | 6+ entries, recent ones positive |
| mastered | Second nature. Could teach it. | 10+ entries, no negative in last 5 |

Ratings are **derived from evidence**, not assigned arbitrarily. The renderer computes
them. The agent's job is to record evidence honestly — including negative evidence
("slid back: buried the request in paragraph 3 today").

## progress.json

```json
{
  "player": "<name>",
  "updated": "YYYY-MM-DD",
  "competencies": {
    "P1": { "rating": "developing", "evidence": [
      { "date": "2026-08-02", "note": "Led with intent in one line, got first-try result", "valence": "positive" },
      { "date": "2026-07-28", "note": "Buried request after 3 paragraphs of context", "valence": "negative" }
    ]},
    "P2": { "rating": "emerging", "evidence": [...] },
    "...": "..."
  },
  "history": [
    {
      "date": "YYYY-MM-DD",
      "skill": "promptify | explainify | pipeline",
      "topic": "<one line — what happened>",
      "competencies_touched": ["P1", "P3"],
      "artifact": "<path or null>"
    }
  ]
}
```

Notes:
- `valence`: "positive" (growth evidence) or "negative" (gap exposed). Both are valuable.
- `history[].skill`: "pipeline" entries are harvested from undumbify/shapeify/shipify/
  reviewify/traceify interactions — not just the teaching skills.
- `artifact`: path to a lesson/doc if one was produced, null for chat-only moments.
- Ratings in the JSON are a cache — the renderer recomputes from evidence. If they
  disagree, evidence wins.

## Update procedure (every activation)

1. Load `progress.json` (create with defaults if missing — ask the player name or infer it)
2. Identify which competencies this interaction touched (usually 1–3)
3. Append evidence entries (dated, one line, honest valence)
4. Append history record
5. Write `progress.json` ← **this is the source of truth. Everything else is derived.**
6. Render (optional): `node <skillify-root>/game-render.js <progress.json>`
7. Tell the user one line — the signal, not the ceremony:
   - Good: "P1 → developing: you led with intent today. 3 more positive entries to reliable."
   - Good: "U1 gap: 'explain this file' is broad — next time try 'how does X call Y?'"
   - Bad: "+10 XP — Level 2: Tinkerer — new badge: Streak 3"

### On the render step

The HTML dashboard is **eye candy, not state**. If the render is skipped (no Node,
agent forgot, context is tight), nothing breaks — the JSON still accumulates evidence
correctly. The dashboard can be regenerated at any time from the JSON alone.

Practical guidance:
- Render at the end of a session (batch), not per-activation, if multiple activations
  happen in one sitting.
- If Node isn't available, skip silently. Don't error, don't apologize, don't block.
- The user can always run the renderer manually:
  `node game-render.js ~/.agents/learnings/progress.json`

## Pipeline harvesting (passive)

When ANY pipeline skill runs, the executing agent notes (silently, in the completion
report or as a one-line addendum):

- Did the user's input require clarification? → negative evidence for P2 or P5
- Did the first attempt succeed? → positive evidence for P1, P6
- Did the user pick the right skill for the moment? → evidence for W1
- Was the handoff complete (no round-trips)? → evidence for W2

This is **passive** — the pipeline skills don't stop to teach. They note the signal
and move on. The teaching skills (promptify, explainify) are where the evidence gets
reviewed and discussed.

## The dashboard (progress.html)

Generated by `game-render.js`. Sections:

1. **Header** — player name, last updated, one-line summary ("3 competencies improving, 1 gap exposed this week")
2. **Skill map** — horizontal bars per competency, colored by rating:
   - emerging: muted gray
   - developing: amber
   - reliable: teal
   - mastered: green
   Grouped: Prompting (P1–P7) / Understanding (U1–U4) / Pipeline (W1–W3)
3. **Growth timeline** — last 10 evidence entries, positive in green, negative in red,
   with competency tag and date
4. **Focus** — the 1–2 competencies with the most recent negative evidence (what to
   work on next). Computed, not hand-picked.
5. **History** — last 10 activations, compact table

Aesthetic: dark, clean, generous whitespace. Prompting = amber, Understanding = teal,
Pipeline = blue. No celebration animations, no confetti. The satisfaction is in the
bars moving, not in a badge popup.

## Artifact path rule

Same as before:
- Artifacts under `~/.agents/learnings/` → relative paths from the JSON's directory
- Artifacts elsewhere → absolute `file://` URLs
- `null` for chat-only moments

The renderer verifies every link before emitting it.

## Records (recordify)

`recordify` persists each session as a **sanitized session record** — the durable,
git-native source of truth for the skill-map app. It fires at commit/push or an
explicit "done", and follows the same evidence rules as this spec (honest valence,
dated, per-competency). The privacy gate is non-negotiable: records store the
pattern + a sanitized gist — never verbatim speech, file paths, project names, or
identifiers. The skill-map app compiles the records into its graph; ratings are
still derived from evidence, never stored as truth.
