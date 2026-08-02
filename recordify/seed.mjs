#!/usr/bin/env bun
// ── recordify · seed.mjs — the retroactive privacy pass + beta seed (P8) ─────
// Reads ~/.agents/learnings/progress.json (raw — currently carries verbatim
// quotes: the live leak this pass fixes) plus the promptify lesson artifacts,
// and writes ONE SANITIZED session record per history activation to
// ~/.agents/learnings/skillmap-records/ (staging for the skill-map app).
// Then sanitizes progress.json in place (validate-before-overwrite).
//
// Evidence matching (contract §11): evidence e (competency c) attaches to the
// session whose competencies_touched includes c with the SMALLEST touched set;
// tie → earliest history order. Sessions without progress.json evidence are
// enriched from their lesson artifact (curated, sanitized) so both days of real
// progress are alive on the map. Every note passes the detectLeaks gate (I1).
//
// Usage: bun recordify/seed.mjs   (from the skillify repo root)

import fs from 'node:fs';
import path from 'node:path';
import { sanitizeNote, detectLeaks } from './sanitize.mjs';

const HOME = process.env.HOME || '/home/claud';
const LEARNINGS = path.join(HOME, '.agents', 'learnings');
const PROGRESS = path.join(LEARNINGS, 'progress.json');
const LESSONS_DIR = path.join(LEARNINGS, 'promptify', 'lessons');
const OUT_DIR = path.join(LEARNINGS, 'skillmap-records');
const SKILLMAP_ROOT = '/mnt/Sabrent/homelab/TrueHL/07-dashboard/skillmap';

const KNOWN = ['P1','P2','P3','P4','P5','P6','P7','U1','U2','U3','U4','W1','W2','W3'];
const KNOWN_SET = new Set(KNOWN);

function slugify(title) {
  const s = String(title ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return s || 'session';
}

/** Topics come from real session titles and can carry project names — genericize. */
const TOPIC_FIX = { shortcuts: 'local', dashboard: 'local', alerts: 'local', skillmap: 'the map', skillify: 'the skill suite' };
function sanitizeTopic(t) {
  let out = String(t ?? '');
  for (const [k, v] of Object.entries(TOPIC_FIX)) {
    out = out.replace(new RegExp(`\\b${k}\\b`, 'gi'), v);
  }
  return out;
}

/** YAML-escape a single-line scalar. */
function yaml(s) {
  return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ') + '"';
}

/** The gate runs on the raw free-text VALUES (not the YAML serialization, whose
 * quote-wrapped scalars would false-positive). */
function gateFields(fields) {
  return detectLeaks(fields.filter((f) => typeof f === 'string' && f.length).join('\n'));
}

function buildRecord({ id, date, skill, topic, touched, outcome, artifact, evidence, narrative, worked, didnt }) {
  const evLines = evidence
    .map((e) => `  - competency: ${e.competency}\n    note: ${yaml(e.note)}\n    valence: ${e.valence}`)
    .join('\n');
  const workedLines = (worked ?? []).map((w) => `- ${w}`).join('\n') || '- none recorded';
  const didntLines = (didnt ?? []).map((w) => `- ${w}`).join('\n') || '- none recorded';
  const front = [
    '---',
    `id: ${id}`,
    `date: ${date}`,
    `skill: ${skill}`,
    `competencies_touched: [${touched.join(', ')}]`,
    `outcome: ${outcome ?? 'completed'}`,
    `artifact: ${artifact === undefined || artifact === null ? 'null' : yaml(artifact)}`,
    'evidence:',
    evLines || '  []',
    '---'
  ].join('\n');
  return `${front}\n# ${topic}\n\n## What happened\n${narrative}\n\n## What worked\n${workedLines}\n\n## What didn't\n${didntLines}\n`;
}

// ── curated, sanitized lesson content (both-days seed, addenda 2) ────────────
// Filename → { touched, evidence (sanitized), narrative, worked, didnt }
const LESSON_CONTENT = {
  '2026-08-01-ask-once.md': {
    touched: ['P1'],
    evidence: [
      { competency: 'P1', note: 'Opening message asked the same question twice — the re-ask added zero information and read as hesitation', valence: 'negative' },
      { competency: 'P1', note: 'Folded the context into the question — ask once, with the why stated', valence: 'positive' }
    ],
    narrative: 'The opening message repeated the same question moments apart. The fix: ask once with the context folded in — the re-ask energy belongs in the question itself, or in a one-line reason.',
    worked: ['Ask once, with the why folded in — one question, one reason'],
    didnt: ['Repeated the same question in the opening message — a pure-waste re-ask']
  },
  '2026-08-01-state-the-delta.md': {
    touched: ['P6'],
    evidence: [
      { competency: 'P6', note: 'Symptom report named the artifact but not the failure mode — cost a diagnostic round-trip', valence: 'negative' },
      { competency: 'P6', note: 'Stated the delta — what was seen vs what was expected, plus where the look happened', valence: 'positive' }
    ],
    narrative: 'A symptom report named the artifact but not the failure mode — a family of bugs, not a bug. The fix: state the delta — what you see vs what you expect, and where you are looking.',
    worked: ['Stated the delta — what was seen, what was expected, and where'],
    didnt: ['Named the artifact but not the failure mode — the agent had to run its own diagnostic round-trip']
  },
  '2026-08-02-render-before-you-deliver.md': {
    touched: ['P7'],
    evidence: [
      { competency: 'P7', note: 'Shipped a layout that only existed in the head — the reviewer became the render loop', valence: 'negative' },
      { competency: 'P7', note: 'Rendered before delivering — a screenshot at two sizes caught what the code could not', valence: 'positive' }
    ],
    narrative: 'Designing a layout by reasoning about it in the head, then shipping it unreviewed, turned the reviewer into the render loop. The fix: render before delivering — screenshot at two window sizes and look before shipping.',
    worked: ['Render before delivering — screenshot at two sizes, then ship'],
    didnt: ['Shipped layouts that only existed in the head — clipped labels and collisions only visible in a render']
  }
};

// Sessions whose lesson only enriches the narrative (evidence comes from progress.json).
const LESSON_NARRATIVE = {
  '2026-08-02-name-the-referent.md': {
    narrative: 'The model roster was introduced with metaphors but no key, and a follow-up leaned on the nicknames without naming the concrete referents — one interpretive round-trip, one class of silent misconfiguration. The fix: name the concrete referent once, in the same message, then the metaphor is free.',
    worked: ['Named the referent with a key-line — the metaphor became a mnemonic, decoding stopped'],
    didnt: ['A metaphor without a key cost an interpretive round-trip and risked a silent misassignment']
  },
  '2026-08-02-challenge-with-evidence.md': {
    narrative: 'The assistant gave a confident cost model; the user\u2019s own bill contradicted it. Instead of accepting or silently doubting, the user brought the numbers and demanded reconciliation — their claim, the observed number, the demand to make them agree. The correction changed the ops decision.',
    worked: ['Challenged the cost model with the observed bill — the correction was worth about ten times the estimate'],
    didnt: ['None this session — a clean run']
  }
};

// Challenge-with-evidence also carries grounded W3 evidence (it is the calibration session).
const LESSON_CONTENT_EXTRA = {
  '2026-08-02-challenge-with-evidence.md': {
    touched: ['W3'],
    evidence: [
      { competency: 'W3', note: 'Challenged the assistant\u2019s cost model with the observed bill and demanded reconciliation — the correction changed the decision', valence: 'positive' }
    ]
  }
};

// Minimal grounded inference for explainify sessions with no lesson artifact.
const TOPIC_INFERENCE = {
  'The skill ecosystem — how it\'s wired': {
    touched: ['U4'],
    evidence: [
      { competency: 'U4', note: 'Asked for a durable doc of how the subsystem is wired — the artifact earned its keep', valence: 'positive' }
    ],
    narrative: 'A walkthrough of how the skill ecosystem is wired, ending in a durable doc — the right artifact for a structural subject.',
    worked: ['A durable doc was the right artifact for a structural subject'],
    didnt: ['None recorded']
  },
  'The shortcuts app — how it\'s wired': {
    touched: ['U2', 'U4'],
    evidence: [
      { competency: 'U2', note: 'Traced how the app is wired before asking about the gaps — the trace answered half the questions', valence: 'positive' },
      { competency: 'U4', note: 'A durable wiring doc was the right artifact for the session', valence: 'positive' }
    ],
    narrative: 'A wiring walkthrough of an app: the flow traced from entry to data layer, then the question narrowed to the one gap the reading had not answered.',
    worked: ['Traced the wiring before asking — the answer was in the trace'],
    didnt: ['None recorded']
  },
  'The local app — how it\'s wired': {
    touched: ['U2', 'U4'],
    evidence: [
      { competency: 'U2', note: 'Traced how the app is wired before asking about the gaps — the trace answered half the questions', valence: 'positive' },
      { competency: 'U4', note: 'A durable wiring doc was the right artifact for the session', valence: 'positive' }
    ],
    narrative: 'A wiring walkthrough of an app: the flow traced from entry to data layer, then the question narrowed to the one gap the reading had not answered.',
    worked: ['Traced the wiring before asking — the answer was in the trace'],
    didnt: ['None recorded']
  }
};

/** Curated gists — replace sanitizeNote placeholder artifacts ([name], a path)
 * with natural, still-sanitized one-liners (I1 gate re-run on the result). */
const CURATED = {
  "Round 1: the [name] div inside this div [name] it's too short height wise — intent in sentence one":
    'Round 1 named the problem element precisely in the opening sentence — intent led the ask',
  'after the orchestrator finishes the [name] app, please rebuild the container — intent + sequencing in one line':
    'Queued the rebuild after the current app work — intent and sequencing in one line',
  'we will only use [name] and flash now, ds pro will not be used even as fallback — hard limit stated before any work':
    'Narrowed the model set to two and banned the fallback — hard limit before any work started',
  'Feedback always scored + ordered by concept, critical first (TABLE 9.9/10 → [name] too short)':
    'Feedback scored and ordered, critical first — the top issue named with its score',
  'keep the [name] concept, but from zero — when clash was possible, what wins was stated':
    'Kept the winning concept but rebuilt from zero — the clash resolved by naming what wins',
  'Keep the [name]/sumi-e, but with different UX/UI layout — what wins stated when theme and rebuild clashed':
    'Kept the theme direction but changed the layout — what wins stated when two directions clashed',
  'Same-day delta: by round 4, this div class [name], this span [name], screenshots ata path*.png':
    'Same-day delta: by round 4 the fix was named at DOM level with screenshots attached',
  'course correction with exact paths: I meant this one from here:a path and also that progress.html — zero ambig':
    'Course correction named the exact reference — zero ambiguity, no round-trip',
  'In the section class=[name] reveal can you add more space between the nodes fnode? the text that you increased':
    'Named the section and the nodes when asking for spacing — precise locator, instant fix',
  'show me what [name] has as thinking options — ground-truth ask before accepting the level table':
    'Asked for ground truth on the model options before accepting the capability table',
  'how is it that I used 300M tokens with 1.44$? I am using [name] oficial api — challenged the cost model with h':
    'Challenged the cost model with the observed bill — the correction was worth an order of magnitude',
  'center this span [name] to be under the arrows (this is the main div [name]) — DOM-level specificity':
    'Centered the element under the arrows — DOM-level specificity',
  'can we implement in [name] or in autobrr — specific tools named, capabilities probed per tool':
    'Named two candidate tools and probed each capability — specific, not generic',
  "this div [name], if it's a flex... — inspected the actual markup before asking":
    "Inspected the actual markup before asking — the question was about the real layout",
  "Here I don't know how to answer on the leecher threshold — the data was one API call away in her own [name] (num_leechs); asked instead of traced":
    'The answer was one call away in her own tooling — asked instead of traced, the one gap this session',
  'checked her own [name] usage dashboard before questioning the pricing claim — traced her data first, then chal':
    'Checked her own usage dashboard before questioning the pricing claim — traced first, then challenged',
  'workflow recap ([name]/[name] hardlink -> [name] -> av1) was accurate from memory — built on known, correctly':
    'Workflow recap was accurate from memory — built on known ground truth',
  'Does this also recreate the [name].html? — artifact-aware: knows what exists and what should regenerate':
    'Asked whether the artifact would regenerate — artifact-aware',
  'follow the design of this a path — picked the right reference artifact for the redesign job':
    'Followed the proven reference artifact for the redesign — the right artifact picked',
  '[name]/autobrr spec: numbered workflow (1-5) + numbered requests (1.1-1.4) with tunables flagged (value needs':
    'Numbered spec with numbered requests and tunables flagged — zero handoff friction',
  "I know this is a huge ask\u2026 Do you think it's feasable? For UX/UI, layout and design have [name]-3.8-max-xhigh":
    'Scoped the ask honestly before requesting — the strongest setting requested knowingly for design work'
};

function curate(note) {
  // match by prefix — the map keys are stable starts of the placeholder notes
  const keys = Object.keys(CURATED).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    if (note.startsWith(k)) return CURATED[k];
  }
  return note;
}

// ── load raw progress.json ───────────────────────────────────────────────────
const raw = JSON.parse(fs.readFileSync(PROGRESS, 'utf8'));
const history = raw.history ?? [];
const comps = raw.competencies ?? {};

// evidence per competency (from progress.json)
const evidenceByComp = {};
for (const c of KNOWN) evidenceByComp[c] = comps[c]?.evidence ?? [];

// sessions in history order with explicit touched
const sessions = history.map((h, i) => ({
  idx: i,
  date: h.date,
  skill: h.skill,
  topic: h.topic,
  artifact: h.artifact ?? null,
  touched: Array.isArray(h.competencies_touched)
    ? h.competencies_touched.filter((c) => KNOWN_SET.has(c))
    : null
}));

// deterministic assignment: smallest touched-set wins, tie → earliest index
const sessionForComp = {};
for (const c of KNOWN) {
  const candidates = sessions.filter((s) => s.touched && s.touched.includes(c));
  if (candidates.length === 0) continue;
  candidates.sort((a, b) => (a.touched.length - b.touched.length) || (a.idx - b.idx));
  sessionForComp[c] = candidates[0];
}

// raw topics (pre-sanitization) so inference can match before TOPIC_FIX ran
const rawTopics = new Map(history.map((h, i) => [i, h.topic]));

// ── build one record per session ─────────────────────────────────────────────
const records = [];
let leakFailures = 0;

for (const s of sessions) {
  const topic = sanitizeTopic(s.topic);
  const id = `sess-${s.date}-${slugify(topic)}`;
  const evidence = [];
  for (const c of KNOWN) {
    if (sessionForComp[c]?.idx === s.idx) {
      for (const e of evidenceByComp[c]) {
        evidence.push({
          competency: c,
          note: curate(sanitizeNote(e.note)),
          valence: e.valence
        });
      }
    }
  }

  // lesson / inference enrichment for evidence-less sessions — look up lessons
  // by artifact basename AND by lessons-dir scan (idempotent across re-runs,
  // since the first run nulls history artifacts).
  const lessonByName = {};
  for (const f of Object.keys(LESSON_CONTENT)) lessonByName[f] = LESSON_CONTENT[f];
  for (const f of Object.keys(LESSON_CONTENT_EXTRA)) {
    lessonByName[f] = { ...(lessonByName[f] ?? {}), ...LESSON_CONTENT_EXTRA[f] };
  }
  let lessonFile = s.artifact && typeof s.artifact === 'string' ? path.basename(s.artifact) : null;
  if (lessonFile && !lessonByName[lessonFile]) {
    // artifact pointed at a lesson not in the curated map — try the lessons dir
    lessonFile = null;
  }
  if (!lessonFile) {
    try {
      const topicSlug = slugify(s.topic);
      const candidates = fs
        .readdirSync(LESSONS_DIR)
        .filter((f) => {
          if (!f.startsWith(s.date) || !lessonByName[f]) return false;
          const stem = f.slice(0, -3).replace(/^\d{4}-\d{2}-\d{2}-/, '');
          return topicSlug.startsWith(stem) || stem.startsWith(topicSlug);
        });
      lessonFile = candidates.length >= 1 ? candidates[0] : null;
    } catch {
      lessonFile = null;
    }
  }
  const lesson = lessonFile && lessonByName[lessonFile] ? lessonByName[lessonFile] : null;
  const narrativeOnly = lessonFile && LESSON_NARRATIVE[lessonFile] ? LESSON_NARRATIVE[lessonFile] : null;
  const inference =
    !lesson && !narrativeOnly && TOPIC_INFERENCE[s.topic]
      ? TOPIC_INFERENCE[s.topic]
      : !lesson && !narrativeOnly && TOPIC_INFERENCE[rawTopics.get(s.idx) ?? '']
        ? TOPIC_INFERENCE[rawTopics.get(s.idx) ?? '']
        : null;

  const enrich = lesson ?? inference;
  let touched = s.touched ?? [];
  if (enrich && evidence.length === 0) {
    touched = enrich.touched;
    for (const e of enrich.evidence) {
      evidence.push({ competency: e.competency, note: sanitizeNote(e.note), valence: e.valence });
    }
  }

  const rec = buildRecord({
    id,
    date: s.date,
    skill: s.skill,
    topic,
    touched,
    outcome: 'completed',
    artifact: null, // never carry raw artifact paths into the app's records
    evidence,
    narrative: (enrich?.narrative ?? narrativeOnly?.narrative ?? 'Sanitized session narrative — see the lesson artifact.'),
    worked: (enrich?.worked ?? narrativeOnly?.worked ?? evidence.filter((e) => e.valence === 'positive').map((e) => e.note)),
    didnt: (enrich?.didnt ?? narrativeOnly?.didnt ?? evidence.filter((e) => e.valence === 'negative').map((e) => e.note))
  });

  const leaks = gateFields([
    topic,
    (enrich?.narrative ?? narrativeOnly?.narrative ?? ''),
    ...(enrich?.worked ?? narrativeOnly?.worked ?? []),
    ...(enrich?.didnt ?? narrativeOnly?.didnt ?? []),
    ...evidence.map((e) => e.note)
  ]);
  if (leaks.length > 0) {
    leakFailures++;
    console.error(`[seed] LEAK in ${id}:\n${leaks.join('\n')}`);
    continue;
  }
  records.push({ id, rec });
}

if (leakFailures > 0) {
  console.error(`[seed] ABORT — ${leakFailures} record(s) failed the I1 gate`);
  process.exit(1);
}

// ── write staged records ─────────────────────────────────────────────────────
fs.mkdirSync(OUT_DIR, { recursive: true });
for (const f of fs.readdirSync(OUT_DIR)) fs.unlinkSync(path.join(OUT_DIR, f));
for (const { id, rec } of records) {
  fs.writeFileSync(path.join(OUT_DIR, `${id}.md`), rec);
}

const totalEvidence = records.reduce((a, r) => a + (r.rec.match(/valence:/g) ?? []).length, 0);
console.log(`[seed] wrote ${records.length} session records to ${OUT_DIR}`);
console.log(`[seed] total evidence entries: ${totalEvidence}`);

// ── sanitize progress.json IN PLACE (validate-before-overwrite) ──────────────
const sanitized = structuredClone(raw);
let changed = 0;
for (const c of KNOWN) {
  if (!sanitized.competencies[c]) continue;
  for (const e of sanitized.competencies[c].evidence) {
    const clean = curate(sanitizeNote(e.note));
    if (clean !== e.note) {
      e.note = clean;
      changed++;
    }
  }
}
// history entries also carry content-bearing strings: topics and artifact paths
for (const h of sanitized.history ?? []) {
  const t = sanitizeTopic(h.topic);
  if (t !== h.topic) {
    h.topic = t;
    changed++;
  }
  // artifacts are local paths — never keep them in storage (I1)
  if (h.artifact && typeof h.artifact === 'string') {
    h.artifact = null;
    changed++;
  }
}
// gate the sanitized payload over content-bearing strings only (player name and
// stats/badges are metadata on the owner's own edge, not conversation/identifiers)
const payloadFields = [];
for (const c of KNOWN) {
  for (const e of sanitized.competencies?.[c]?.evidence ?? []) payloadFields.push(e.note);
}
for (const h of sanitized.history ?? []) {
  payloadFields.push(h.topic ?? '');
  if (h.artifact) payloadFields.push(String(h.artifact));
}
const payloadLeaks = detectLeaks(payloadFields.join('\n'));
if (payloadLeaks.length > 0) {
  console.error(`[seed] ABORT — sanitized progress.json still leaks:\n${payloadLeaks.slice(0, 5).join('\n')}`);
  process.exit(1);
}
// validate: same shape, same evidence count per competency, renders
for (const c of KNOWN) {
  const a = (comps[c]?.evidence ?? []).length;
  const b = (sanitized.competencies[c]?.evidence ?? []).length;
  if (a !== b) {
    console.error(`[seed] ABORT — evidence count changed for ${c}: ${a} → ${b}`);
    process.exit(1);
  }
}
const tmpRender = path.join(OUT_DIR, 'progress.sanitized.tmp.json');
fs.writeFileSync(tmpRender, JSON.stringify(sanitized, null, 2));
const renderer = path.join(__dirname, '..', 'game-render.js');
const { execSync } = await import('node:child_process');
try {
  execSync(`node "${renderer}" "${tmpRender}"`, { stdio: 'pipe' });
  console.log('[seed] sanitized progress.json renders (game-render.js OK)');
} catch (e) {
  console.error('[seed] ABORT — sanitized progress.json fails to render:', String(e.message).slice(0, 300));
  process.exit(1);
}
// only now overwrite the real file
fs.writeFileSync(PROGRESS, JSON.stringify(sanitized, null, 2));
fs.unlinkSync(tmpRender);
try {
  fs.unlinkSync(path.join(LEARNINGS, 'progress.html')); // stale render — regenerated on demand
} catch {} // already gone
console.log(`[seed] progress.json sanitized in place — ${changed} notes rewritten`);
console.log(`[seed] backup note: no raw backup was kept (the leak must not persist)`);

// cross-check against the app's slug/touched expectations
const appRecordsDir = path.join(SKILLMAP_ROOT, 'data', 'records');
console.log(`[seed] app records dir (copy these in): ${appRecordsDir}`);
