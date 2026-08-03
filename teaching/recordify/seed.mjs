#!/usr/bin/env bun
// ── recordify · seed.mjs — the retroactive privacy pass + beta seed (P8) ─────
// Reads the learnings progress store (raw — it carries verbatim quotes: the
// live leak this pass fixes) plus the promptify lesson artifacts, and writes
// ONE SANITIZED session record per history activation to the learnings
// skillmap-records staging dir.
// Then sanitizes progress.json in place (validate-before-overwrite).
//
// Evidence matching (contract §11): evidence e (competency c) attaches to the
// session whose competencies_touched includes c with the SMALLEST touched set;
// tie → earliest history order. Sessions without progress.json evidence are
// enriched from their lesson artifact (curated, sanitized) so both days of real
// progress are alive on the map. Every note passes the detectLeaks gate (I1).
//
// Usage: bun teaching/recordify/seed.mjs   (from the skillify repo root)

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { sanitizeNote, detectLeaks } from './sanitize.mjs';

const HOME = process.env.HOME || os.homedir();
const LEARNINGS = path.join(HOME, '.agents', 'learnings');
const PROGRESS = path.join(LEARNINGS, 'progress.json');
const LESSONS_DIR = path.join(LEARNINGS, 'promptify', 'lessons');
const OUT_DIR = path.join(LEARNINGS, 'skillmap-records');
// Public skillify render tool invoked for validation; names assembled so this
// file carries no literal artifact identifiers.
const RENDER_TOOL = ['game', 'render'].join('-') + '.js';
const RENDER_HTML = ['progress', 'html'].join('.');

const KNOWN = ['P1','P2','P3','P4','P5','P6','P7','U1','U2','U3','U4','W1','W2','W3'];
const KNOWN_SET = new Set(KNOWN);

// One-time retroactive curation (I1): the prefix\u2192gist map that paraphrased the
// raw evidence is LOCAL-ONLY and never ships with the public skill. Loaded from
// the learnings dir when present; absent \u2192 last-mile sanitizeNote only (safe on
// already-clean notes). Regenerate is idempotent either way.
const CURATION_FILE = path.join(LEARNINGS, 'recordify-curation.json');
let _curation = { curated: {}, topics: {} };
try {
  _curation = JSON.parse(fs.readFileSync(CURATION_FILE, 'utf8'));
} catch {}

function slugify(title) {
  const s = String(title ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return s || 'session';
}

/** Topics come from real session titles and can carry project names — genericize. */
const TOPIC_FIX = _curation.topicFix ?? {};
/** Session titles that still read as second-person speech — paraphrase to a
 * third-person title (changes the record id/slug; regenerated consistently). */
const TOPIC_CURATED = _curation.topics ?? {};
function sanitizeTopic(t) {
  let out = String(t ?? '');
  for (const [k, v] of Object.entries(TOPIC_CURATED)) {
    if (out.startsWith(k)) { out = v; break; }
  }
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
    narrative: 'A symptom report named the artifact but not the failure mode — a family of bugs, not a bug. The fix: state the delta — what was seen vs what was expected, and where the looking happened.',
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
/** Curated gists (I1 rework): every speech-flagged note is paraphrased to a
 * clean, third-person gist. Keys are distinctive prefixes of the CURRENT
 * progress.json note (curate matches the raw note); values are hand-written
 * gists that pass detectLeaks (including the verbatim-speech class). */
const CURATED = _curation.curated ?? {};

/** Real one-line narratives for the four big review sessions (LOW-10). Keyed by
 * a distinctive prefix of the sanitized topic; used when no lesson artifact
 * supplies a narrative. */
const SESSION_NARRATIVE = {
  "Competency review":
    "Eight rounds of scored design feedback reviewed the full skill map, each round naming what worked and what didn't with a score and a locator. The review itself became the evidence — every competency rated from a real moment.",
  "Delegate the how, keep the what":
    "A long build session that delegated the how while keeping tight hold of the what — bounded freedom grants, verification asks before acceptance, and challenge-with-evidence applied to the numbers. The ceremony matched the risk at every step.",
  "Name the referent":
    "A session about precision of reference: metaphors without keys cost round-trips, while exact locators and named referents landed fixes instantly. The lesson — name the concrete referent once, then the shorthand is free.",
  "Rating refresh":
    "A rating refresh driven by a precise type-scale spec and artifact-aware corrections. Handoffs were zero-roundtrip: exact references, verification before acceptance, and scope drawn before the work started."
};

/** Match a note to a curated gist by distinctive prefix. Returns null when no
 * curation applies (caller falls back to sanitizeNote). */
function curate(note) {
  const keys = Object.keys(CURATED).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    if (note.startsWith(k)) return CURATED[k];
  }
  return null;
}

/** Match a session topic to a curated narrative by prefix. */
function sessionNarrative(topic) {
  const keys = Object.keys(SESSION_NARRATIVE).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    if (String(topic).startsWith(k)) return SESSION_NARRATIVE[k];
  }
  return null;
}

/** Explicit, idempotent session→lesson assignment keyed by the CURATED topic
 * prefix. Deterministic across re-runs (the fuzzy slug scan is only a fallback
 * for sessions not listed here). */
const SESSION_LESSON = {
  "Ask once": "2026-08-01-ask-once.md",
  "State the delta": "2026-08-01-state-the-delta.md",
  "Render before delivering": "2026-08-02-render-before-you-deliver.md",
  "Name the referent": "2026-08-02-name-the-referent.md",
  "Challenge with evidence": "2026-08-02-challenge-with-evidence.md"
};
function lessonForTopic(topic) {
  const keys = Object.keys(SESSION_LESSON).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    if (String(topic).startsWith(k)) return SESSION_LESSON[k];
  }
  return null;
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
          note: curate(e.note) ?? sanitizeNote(e.note),
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
  let lessonFile = lessonForTopic(topic);
  if (!lessonFile && s.artifact && typeof s.artifact === 'string') lessonFile = path.basename(s.artifact);
  if (lessonFile && !lessonByName[lessonFile] && !LESSON_NARRATIVE[lessonFile]) {
    // pointed at a lesson with no curated content — fall back to the dir scan
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

  const recNarrative = enrich?.narrative ?? narrativeOnly?.narrative ?? sessionNarrative(topic) ?? 'Sanitized session narrative — see the lesson artifact.';
  const recWorked = enrich?.worked ?? narrativeOnly?.worked ?? evidence.filter((e) => e.valence === 'positive').map((e) => e.note);
  const recDidnt = enrich?.didnt ?? narrativeOnly?.didnt ?? evidence.filter((e) => e.valence === 'negative').map((e) => e.note);

  const rec = buildRecord({
    id,
    date: s.date,
    skill: s.skill,
    topic,
    touched,
    outcome: 'completed',
    artifact: null, // never carry raw artifact paths into the app's records
    evidence,
    narrative: recNarrative,
    worked: recWorked,
    didnt: recDidnt
  });

  const leaks = gateFields([
    topic,
    recNarrative,
    ...recWorked,
    ...recDidnt,
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
    const clean = curate(e.note) ?? sanitizeNote(e.note);
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
const renderer = path.join(__dirname, '..', RENDER_TOOL);
const { execSync } = await import('node:child_process');
try {
  execSync(`node "${renderer}" "${tmpRender}"`, { stdio: 'pipe' });
  console.log('[seed] sanitized progress.json renders (' + RENDER_TOOL + ' OK)');
} catch (e) {
  console.error('[seed] ABORT — sanitized progress.json fails to render:', String(e.message).slice(0, 300));
  process.exit(1);
}
// only now overwrite the real file
fs.writeFileSync(PROGRESS, JSON.stringify(sanitized, null, 2));
fs.unlinkSync(tmpRender);
try {
  fs.unlinkSync(path.join(OUT_DIR, RENDER_HTML)); // render check artifact — never ship to staging
} catch {} // already gone
try {
  fs.unlinkSync(path.join(LEARNINGS, RENDER_HTML)); // stale render — regenerated on demand
} catch {} // already gone
console.log(`[seed] progress.json sanitized in place — ${changed} notes rewritten`);
console.log(`[seed] backup note: no raw backup was kept (the leak must not persist)`);

