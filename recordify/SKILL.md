# recordify — capture a sanitized session record

Records a session as a **sanitized session record**: the pattern you practiced
plus a sanitized gist — never verbatim quotes, file paths, project names, or
identifiers. Fires at commit / push or an explicit "done", and feeds the skill
map's evidence pipeline.

## When to fire

- **Commit / push:** when the session's artifacts (lesson, fix, feature) land in a
  commit — write the record alongside.
- **Explicit done:** "record this session", "log what happened", or when a teaching
  skill (promptify / explainify) finishes and calls its done path.
- **Never:** write a record from memory of a session that didn't happen, or from a
  transcript you have not read.

## The record format

One markdown file per session, YAML frontmatter + prose body. Write to
`RECORDS_DIR` (default: the skill map app's `data/records/` — a mounted volume in
deployment). Filename = `<id>.md` with `id: sess-<YYYY-MM-DD>-<slug>`.

```markdown
---
id: sess-2026-08-02-name-the-referent
date: 2026-08-02
skill: promptify                # promptify | explainify | pipeline
competencies_touched: [P6, U2, W2]
outcome: completed              # completed | partial | abandoned (optional)
artifact: null                  # sanitized rel path or null (optional)
evidence:
  - competency: P6
    note: "Under-specified ask cost a guessing round — the lesson was named in one line"
    valence: negative
  - competency: U2
    note: "Read the actual configuration before asking — the answer was in the file"
    valence: positive
---
# Name the referent — metaphor without a key costs a round-trip

## What happened
<sanitized prose — the pattern, the cost, the fix. No quotes, paths, names, identifiers.>

## What worked
- <sanitized bullet — the lesson that worked>

## What didn't
- <sanitized bullet — the gap exposed>
```

## Sanitization — the privacy gate (I1, non-negotiable)

Store the **pattern + a sanitized gist**. NEVER store:

1. **Verbatim conversation quotes** — paraphrase to the lesson. "The user said 'it
   feels too powerful'" becomes "The felt effect was named first, then the fix."
2. **File paths / URLs** — `/tmp/…`, `/mnt/…`, `http(s)://`, `file://`, `~/` →
   "a screenshot was attached", "the local config".
3. **Project / repo / product names** — `shortcuts`, `spectrum`, `alerts`,
   `tdarr`, `deepseek`, `github`, … → their generic category ("a dashboard app").
4. **Code / DOM identifiers** — class names, function names, DOM ids (`jb-row`,
   `sy`, `spectrum-card`, `deriveRating`) → their role ("a row container", "the
   rating function").
5. **Personal identifiers** — names, emails, handles, IPs, hex tokens, UUIDs.

**The gate is automated, not a hope.** Run the sanitizer over the record's
free-text fields (evidence notes, narrative, what-worked/what-didn't bullets —
not the YAML serialization, whose quote-wrapped scalars would false-positive):

```bash
# from the skillify repo — check every staged record's text fields
bun -e "
import { detectLeaks } from './recordify/sanitize.mjs';
import fs from 'node:fs';
for (const f of process.argv.slice(1)) {
  const text = fs.readFileSync(f, 'utf8')
    .split(/\r?\n/)
    .filter((l) => !/^(id|date|skill|competencies_touched|outcome|artifact):/.test(l))
    .join('\n');
  const leaks = detectLeaks(text);
  if (leaks.length) { console.error('LEAKS in ' + f + ':\\n' + leaks.join('\\n')); process.exit(1); }
  console.log('clean: ' + f);
}
" data/records/*.md
```

Or check a single note: `bun -e "import {sanitizeNote} from './recordify/sanitize.mjs'; console.log(sanitizeNote(process.argv[1]))" "…"`.

**If `detectLeaks` returns anything, the record is refused.** Fix the note (use
`sanitizeNote` to get a clean gist, then review it for meaning) and re-check. The
test suite (`bun test recordify/sanitize.test.mjs`) is the contract — if a new
identifier family appears in real sessions, add it to `IDENTIFIERS` in
`sanitize.mjs` with a test case.

## The workflow

1. Read the session material (transcript, lesson, diff) — never write from memory
   alone.
2. Extract: the pattern practiced, the evidence (dated, per competency, honest
   valence), the outcome, the artifact.
3. Build the record from the format above. Every evidence `note` is a sanitized
   gist (`sanitizeNote` + judgment — the gist must keep its meaning).
4. Run the gate (above). Refuse-to-write on any leak.
5. Write `<id>.md` to RECORDS_DIR. If the skill map app is up, its compiler picks
   the record up on the next boot (or `RECORDS_DIR` is a live mount — the map
   refreshes when the server recompiles).
6. Tell the user one line: which competency gained evidence, or which gap was
   exposed.

## Competency ids (the skill map's vocabulary)

`P1`–`P7` prompting (lead with intent, constraints upfront, anti-examples,
priority ordering, scope boundaries, right-sized context, verification asks);
`U1`–`U4` understanding (specific questions, trace before asking, build on known,
right artifact ask); `W1`–`W3` pipeline (right skill right moment, handoff
quality, calibration). `evidence[].competency` must be one of these.

## Final Gate

- [ ] Record written at commit/push or explicit done — never fabricated
- [ ] `detectLeaks` clean on the WHOLE record file (quotes, paths, names, identifiers)
- [ ] Schema-valid frontmatter (id/date/skill/competencies_touched/evidence)
- [ ] Evidence honest valence — negative entries are growth, not stains
- [ ] One-line signal to the user about what moved
