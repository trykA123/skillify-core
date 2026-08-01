# Game Layer — shared progression for promptify & explainify

One progression, two teachers. Runtime data lives at `~/.agents/learnings/progress.json` (the source of truth); `progress.html` is the rendered dashboard, regenerated from the JSON on every activation. The spec lives here — once — and both skills follow it. promptify's folder is the canonical home; explainify references this file.

## Rules

- **XP**: +10 per completed activation (lesson / knowledge doc saved). Nothing else earns XP. No XP for talk, praise, or partial work — anti-grind.
- **Levels** (combined across both skills — one ladder):

  | Level | Title | Cumulative XP |
  |---|---|---|
  | 1 | Apprentice | 0 |
  | 2 | Tinkerer | 25 |
  | 3 | Journeyman | 75 |
  | 4 | Artisan | 150 |
  | 5 | Craftsman | 250 |
  | 6 | Master | 375 |
  | 7 | Grandmaster | 525 |
  | 8 | Sage | 700 |
  | 9 | Elder | 900 |
  | 10 | Legend | 1125 |

- **Streak**: consecutive calendar days with ≥1 activation (either skill). Same-day activations don't extend it. Store `last_activity_date` (YYYY-MM-DD): today − last = 1 day → extend by 1; same day → unchanged; anything else → reset to 1.
- **Badges** (fixed criteria — never invented post-hoc, never awarded to be nice):

  | Badge | Criterion |
  |---|---|
  | first-lesson | any first activation |
  | both-skills | an activation in each skill |
  | lessons-5 | 5 total activations |
  | lessons-15 | 15 total activations |
  | glossary-5 | 5 total glossary terms (both skills) |
  | glossary-15 | 15 total glossary terms |
  | glossary-30 | 30 total glossary terms |
  | streak-3 | current or best streak ≥ 3 |
  | streak-7 | current or best streak ≥ 7 |
  | streak-14 | current or best streak ≥ 14 |
  | level-2 | level ≥ 2 |
  | level-4 | level ≥ 4 |

## progress.json

```json
{
  "player": "<name, set on first activation>",
  "updated": "YYYY-MM-DD",
  "stats": {
    "xp": 0,
    "level": 1,
    "lessons": 0,
    "glossary_terms": 0,
    "promptify_xp": 0,
    "explainify_xp": 0,
    "streak": 0,
    "best_streak": 0,
    "last_activity_date": null
  },
  "badges": [],
  "history": [
    {
      "date": "YYYY-MM-DD",
      "skill": "promptify | explainify",
      "topic": "<one line>",
      "xp": 10,
      "artifact": "<relative path>",
      "glossary_added": 2
    }
  ]
}
```

## Update procedure (every activation)

1. Load `progress.json` (create with defaults if missing — ask the player name or infer it)
2. Append the history record
3. Update counters; recompute level (from xp), streak, badges
4. Write `progress.json`
5. Regenerate `progress.html` per the dashboard spec below — the dashboard is a render, never hand-edited
6. Tell the user one line: `+10 XP — <level: title> — <new badges> — <streak>🔥`

## The dashboard (progress.html)

Single file. Inline CSS + inline SVG only. No CDN, no JS. Dark theme. Sections, in order:

1. **Header** — player name, current level + title (the loudest element — level-ups get their moment), total XP, progress bar to the next level
2. **Stat row** — current streak 🔥, best streak, lessons, glossary terms, badges earned
3. **XP over time** — SVG line/area chart from history (one point per activation day)
4. **Per-skill bars** — horizontal bars: promptify XP vs explainify XP
5. **Glossary growth** — SVG bars per activation day, terms added
6. **Badges grid** — earned in color, locked in gray
7. **History** — last 10 activations, compact table

Aesthetic: dark, clean, generous whitespace, subtle grid. One accent per skill — promptify = amber, explainify = teal. Charts celebrate growth, not grind.
