#!/usr/bin/env bun
// game-render.ts — reads progress.json and renders the skill-map dashboard.
// The dashboard is a render, never hand-edited. Ratings are derived from evidence.
// Aesthetic: The Practice Record — warm sumi-e, washi day / sumi night,
// one ink, one vermillion seal. Design language after RATINGS-FOURTH.html.
// Usage: bun game-render.ts [path/to/progress.json]
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

/* ── progress.json shape (~/.agents/learnings/progress.json) ── */
type Valence = 'positive' | 'negative';
type Rating = 'emerging' | 'developing' | 'reliable' | 'mastered';

interface EvidenceEntry {
  date: string;
  note: string;
  valence: Valence;
}

interface CompetencyData {
  rating: Rating;
  evidence: EvidenceEntry[];
}

interface HistoryEntry {
  date: string;
  skill: string;
  topic: string;
  xp?: number;
  artifact?: string | null;
  glossary_added?: number;
  competencies_touched?: string[];
}

interface ProgressJson {
  player: string;
  updated?: string;
  stats?: Record<string, unknown>;
  badges?: string[];
  history: HistoryEntry[];
  competencies: Record<string, CompetencyData>;
}

const COMPETENCIES: Record<'prompting' | 'understanding' | 'pipeline', [string, string][]> = {
  prompting: [
    ['P1', 'Lead with intent'],
    ['P2', 'Constraints upfront'],
    ['P3', 'Anti-examples'],
    ['P4', 'Priority ordering'],
    ['P5', 'Scope boundaries'],
    ['P6', 'Right-sized context'],
    ['P7', 'Verification asks'],
  ],
  understanding: [
    ['U1', 'Specific questions'],
    ['U2', 'Trace before asking'],
    ['U3', 'Build on known'],
    ['U4', 'Right artifact ask'],
  ],
  pipeline: [
    ['W1', 'Right skill, right moment'],
    ['W2', 'Handoff quality'],
    ['W3', 'Calibration'],
  ],
};

// 守破離熟 — the four stages of practice. A rating IS a stage.
const STAGE: Record<Rating, { kanji: string; en: string }> = {
  emerging:   { kanji: '守', en: 'keep the form' },
  developing: { kanji: '破', en: 'break the form' },
  reliable:   { kanji: '離', en: 'leave the form' },
  mastered:   { kanji: '熟', en: 'ripened' },
};
const RATINGS: Rating[] = ['emerging', 'developing', 'reliable', 'mastered'];
const RATING_STAGE: Record<Rating, string> = { emerging: '守', developing: '破', reliable: '離', mastered: '熟' };
const RATING_PCT: Record<Rating, number> = { emerging: 25, developing: 50, reliable: 75, mastered: 100 };
const GROUP: Record<string, { kanji: string; title: string; accent: string }> = {
  prompting:     { kanji: '言', title: 'Prompting',     accent: 'var(--amber)' },
  understanding: { kanji: '解', title: 'Understanding', accent: 'var(--teal)' },
  pipeline:      { kanji: '流', title: 'Pipeline',      accent: 'var(--blue)' },
};

const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function deriveRating(evidence: EvidenceEntry[] | undefined): Rating {
  if (!evidence || evidence.length === 0) return 'emerging';
  const pos = evidence.filter((e) => e.valence === 'positive').length;
  const neg = evidence.filter((e) => e.valence === 'negative').length;
  const last5 = evidence.slice(-5);
  const last5neg = last5.filter((e) => e.valence === 'negative').length;
  if (evidence.length >= 10 && last5neg === 0) return 'mastered';
  if (pos >= 6 && last5neg <= 1) return 'reliable';
  if (pos >= 3) return 'developing';
  return 'emerging';
}

function main() {
  const jsonPath = process.argv[2] || path.join(os.homedir(), '.agents/learnings/progress.json');
  const baseDir = path.dirname(jsonPath);
  const j = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as ProgressJson;
  const comps = j.competencies || {};
  const hist = j.history || [];
  const today = new Date().toISOString().slice(0, 10);

  // Derive ratings from evidence
  const derived: Record<string, { rating: Rating; evidence: EvidenceEntry[] }> = {};
  for (const [id, data] of Object.entries(comps)) {
    derived[id] = { rating: deriveRating(data.evidence), evidence: data.evidence || [] };
  }

  // All evidence entries, sorted by date desc
  const allEvidence: (EvidenceEntry & { comp: string })[] = [];
  for (const [id, data] of Object.entries(derived)) {
    for (const e of data.evidence) {
      allEvidence.push({ ...e, comp: id });
    }
  }
  allEvidence.sort((a, b) => b.date.localeCompare(a.date));

  // Focus: competencies with most recent negative evidence
  const negByComp: Record<string, EvidenceEntry & { comp: string }> = {};
  for (const e of allEvidence) {
    if (e.valence === 'negative' && !negByComp[e.comp]) negByComp[e.comp] = e;
  }
  const focus = Object.entries(negByComp).slice(0, 2);

  // Summary + fullness (mean stage across competencies with evidence)
  const active = Object.values(derived).filter((d) => d.evidence.length > 0);
  const fullness = active.length ? Math.round(active.reduce((a, d) => a + RATING_PCT[d.rating], 0) / active.length) : 0;
  const totalEvidence = allEvidence.length;
  const activeCount = active.length;
  const developing = Object.values(derived).filter((d) => d.rating === 'developing').length;
  const gaps = Object.keys(negByComp).length;
  const summary = `${activeCount} competencies with evidence · ${totalEvidence} entries · ${developing} developing · ${gaps} gap${gaps !== 1 ? 's' : ''} exposed`;

  // ── the map: one table per territory, RATINGS-FOURTH table language ──
  function renderGroup(key: string, entries: [string, string][]) {
    const g = GROUP[key];
    const rows = entries.map(([id, label]) => {
      const d = derived[id] || { rating: 'emerging', evidence: [] };
      const st = STAGE[d.rating];
      const count = d.evidence.length;
      const last = d.evidence.length ? d.evidence[d.evidence.length - 1] : null;
      const lead = focus.some(([fid]) => fid === id) ? ' lead' : '';
      const oneliner = last
        ? `<span class="v ${last.valence}">${last.valence === 'positive' ? '▲' : '▼'}</span> ${esc(last.note)}`
        : '<span class="dim">no evidence yet — the bar waits</span>';
      return `<tr class="${lead}">
        <td class="rank">${st.kanji}</td>
        <td class="name">${id} · ${esc(label)}<span class="role">${d.rating} — ${st.en}</span></td>
        <td class="oneliner">${oneliner}</td>
        <td class="n"><span class="cell" style="color:var(--${d.rating === 'developing' ? 'amber' : d.rating === 'reliable' ? 'teal' : d.rating === 'mastered' ? 'green' : 'ink-faint'})">${count}</span></td>
      </tr>`;
    }).join('\n');
    return `<div class="terr">
      <div class="terr-head"><span class="terr-kanji" style="color:${g.accent}">${g.kanji}</span><h3>${g.title}</h3><span class="terr-line"></span></div>
      <table>
        <thead><tr><th class="n" style="width:2.6rem">stage</th><th>competency</th><th class="h-one">last evidence</th><th class="n" style="width:3.4rem">ev</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  }

  const hasEvidence = (entries: [string, string][]) => entries.some(([id]) => (derived[id]?.evidence?.length || 0) > 0);
  const groups = [renderGroup('prompting', COMPETENCIES.prompting)];
  if (hasEvidence(COMPETENCIES.understanding)) groups.push(renderGroup('understanding', COMPETENCIES.understanding));
  if (hasEvidence(COMPETENCIES.pipeline)) groups.push(renderGroup('pipeline', COMPETENCIES.pipeline));
  const skillMap = groups.join('\n');

  // stage legend
  const legend = RATINGS.map((r) => {
    const st = STAGE[r];
    return `<span class="leg-cell"><b class="leg-kanji" style="color:var(--${r === 'developing' ? 'amber' : r === 'reliable' ? 'teal' : r === 'mastered' ? 'green' : 'ink-faint'})">${st.kanji}</b>${r}</span>`;
  }).join('');

  // ── focus: fixbox language ──
  const focusHtml = focus.length > 0
    ? focus.map(([id, e]) => `<div class="fixbox">
        <span class="fx">公案 · ${id} — ${esc(e.date)}</span>
        <p>${esc(e.note)}</p>
      </div>`).join('')
    : '<div class="fixbox clean"><span class="fx">公案</span><p>No recent gaps. A clean run — sit with what is working.</p></div>';

  // ── evidence trail: disagreement-row language ──
  const trail = allEvidence.slice(0, 10).map((e) => {
    const cls = e.valence === 'positive' ? 'pos' : 'neg';
    const mark = e.valence === 'positive' ? '▲' : '▼';
    return `<div class="dis-row ${cls}">
      <div class="where">${e.comp}<span class="nums">${esc(e.date)} · ${mark}</span></div>
      <div class="why">${esc(e.note)}</div>
    </div>`;
  }).join('\n');

  // ── sessions ──
  const sessions = [...hist].reverse().slice(0, 10).map((h) => {
    const cls = h.skill === 'explainify' ? 'e' : h.skill === 'pipeline' ? 'w' : 'p';
    const touched = (h.competencies_touched || []).join(' ');
    return `<tr>
      <td class="n dim">${esc(h.date)}</td>
      <td><span class="tag ${cls}">${esc(h.skill)}</span></td>
      <td class="oneliner">${esc(h.topic)}</td>
      <td class="n dim sess-touched">${esc(touched)}</td>
    </tr>`;
  }).join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>修行録 · the practice record — ${esc(j.player)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;600;700;800&family=Zen+Kaku+Gothic+New:wght@400;500;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<style>
/* ═══════════ 修行録 · the practice record ═══════════
   Warm sumi-e: washi day / sumi night, one ink, one vermillion seal.
   Evidence lights the way — the bars move when you do.
   Type: 20px base, major-third 1.250 scale (0.64/0.8/1/1.25/1.5625/1.953/2.441/3.052 rem).
   Color: every text color ≥ 4.5:1 WCAG AA on paper and panel, both modes. */
:root {
  color-scheme: light;
  --paper: #ece1c9;
  --paper-2: #f2e9d6;
  --panel: #f0e6d2;
  --panel-2: #e7dbc2;
  --ink: #241d15;
  --ink-soft: #5f5342;
  --ink-faint: #6a5e4b;
  --line: #d3c5a8;
  --line-soft: #ddd0b6;
  --seal: #b13a2e;
  --seal-glyph: #f3e7d2;
  --teal: #25675a;
  --amber: #8a5718;
  --blue: #335e87;
  --green: #446a2b;
  --grain-blend: multiply;
  --grain-op: .05;
  --serif: 'Shippori Mincho', 'Palatino Linotype', Palatino, Georgia, serif;
  --sans: 'Zen Kaku Gothic New', ui-sans-serif, system-ui, -apple-system, sans-serif;
  --mono: 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace;
  --settle: cubic-bezier(0.22, 1, 0.36, 1);
}
html[data-mode="sumi"] {
  color-scheme: dark;
  --paper: #15110d;
  --paper-2: #1c1712;
  --panel: #201a13;
  --panel-2: #282018;
  --ink: #ece1c9;
  --ink-soft: #b3a894;
  --ink-faint: #9a8d78;
  --line: #372e23;
  --line-soft: #2c241b;
  --seal: #d95b4d;
  --seal-glyph: #f3e7d2;
  --teal: #5aa894;
  --amber: #d09a44;
  --blue: #7ba3c9;
  --green: #8ba86a;
  --grain-blend: soft-light;
  --grain-op: .09;
}
* { box-sizing: border-box; }
html { background: var(--paper); scroll-behavior: smooth; font-size: 20px; }
body {
  margin: 0; background: var(--paper); color: var(--ink);
  font-family: var(--sans); line-height: 1.6; -webkit-font-smoothing: antialiased;
  transition: background .5s var(--settle), color .5s var(--settle);
}
::selection { background: var(--seal); color: var(--seal-glyph); }
.grain {
  position: fixed; inset: 0; z-index: 99; pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E");
  mix-blend-mode: var(--grain-blend); opacity: var(--grain-op);
}
.mono { font-family: var(--mono); font-variant-numeric: tabular-nums; }
.wrap { max-width: 64rem; margin: 0 auto; padding: 0 1.4rem 6rem; position: relative; z-index: 1; }

/* ── masthead ── */
.masthead { padding: 2.8rem 0 1.5rem; border-bottom: 3px double var(--line); position: relative; }
.kicker { font-family: var(--mono); font-size: .64rem; letter-spacing: .3em; text-transform: uppercase; color: var(--seal); }
.kicker::before { content: "◈ "; opacity: .8; }
.masthead h1 {
  font-family: var(--serif); font-weight: 800; letter-spacing: -.02em;
  font-size: clamp(2.441rem, 6vw, 3.052rem); line-height: 1.08; margin: .4rem 0 .7rem; max-width: 46rem;
}
.masthead .dek { font-family: var(--serif); font-style: italic; font-size: 1.25rem; color: var(--ink-soft); max-width: 46rem; }
.byline { display: flex; flex-wrap: wrap; gap: 1.4rem; margin-top: 1.2rem; font-family: var(--mono); font-size: .64rem; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-faint); }
.byline b { color: var(--ink-soft); }
.seal {
  position: absolute; top: 2.6rem; right: 0;
  width: 3.4rem; height: 3.4rem; border-radius: 7px;
  background: var(--seal); color: var(--seal-glyph);
  display: grid; place-items: center;
  font-family: var(--serif); font-size: 1.953rem; font-weight: 700;
  transform: rotate(-4deg);
  box-shadow: inset 0 0 0 2px rgba(243,231,210,.28);
}

/* ── the figure ── */
.figure { display: grid; grid-template-columns: auto 1fr; gap: 2.2rem; align-items: center; padding: 2.6rem 0; border-bottom: 1px solid var(--line); }
.enso-wrap { position: relative; width: 11rem; height: 11rem; flex-shrink: 0; }
.enso-wrap svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.enso-track { fill: none; stroke: var(--line-soft); stroke-width: 7; }
.enso-ring { fill: none; stroke: var(--ink); stroke-width: 7; stroke-linecap: round; stroke-dasharray: 0 660; transition: stroke-dasharray 1.6s var(--settle) .3s; }
body.loaded .enso-ring { stroke-dasharray: var(--full) 660; }
.enso-wrap .big {
  position: absolute; inset: 0; display: grid; place-items: center;
  font-family: var(--serif); font-weight: 800; font-size: 3.052rem; letter-spacing: -.04em; line-height: 1;
}
.enso-wrap .big .dec { color: var(--seal); font-size: 1.5625rem; }
.enso-wrap .scale { font-family: var(--mono); font-size: .64rem; letter-spacing: .22em; color: var(--ink-faint); text-align: center; margin-top: .5rem; }
.figure .take .lab { font-family: var(--mono); font-size: .64rem; letter-spacing: .26em; text-transform: uppercase; color: var(--seal); margin-bottom: .5rem; }
.figure .take h2 { font-family: var(--serif); font-size: 1.5625rem; font-weight: 800; line-height: 1.2; margin: 0 0 .6rem; }
.figure .take p { margin: 0; color: var(--ink-soft); font-size: 1rem; }

/* ── sections ── */
.sec { padding-top: 2.8rem; }
.sec-head { display: flex; align-items: baseline; gap: .9rem; border-top: 1px solid var(--line); padding-top: .8rem; margin-bottom: 1.4rem; }
.sec-no { font-family: var(--mono); font-size: .8rem; font-weight: 700; color: var(--seal); }
.sec-title { font-family: var(--mono); font-size: .8rem; font-weight: 700; letter-spacing: .26em; text-transform: uppercase; }
.sec-note { margin-left: auto; font-family: var(--mono); font-size: .64rem; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-faint); }
.lede { font-size: 1rem; color: var(--ink-soft); max-width: 50rem; margin: 0 0 1.2rem; }
.lede b { color: var(--ink); }

/* ── territories ── */
.terr { margin-bottom: 2rem; }
.terr-head { display: flex; align-items: center; gap: .9rem; margin-bottom: .6rem; }
.terr-kanji { font-family: var(--serif); font-size: 1.5625rem; font-weight: 700; line-height: 1; }
.terr-head h3 { font-family: var(--mono); font-size: .8rem; font-weight: 700; letter-spacing: .26em; text-transform: uppercase; color: var(--ink-soft); margin: 0; }
.terr-line { flex: 1; height: 1px; background: var(--line); }

/* ── tables ── */
table { width: 100%; border-collapse: collapse; }
th { text-align: left; font-family: var(--mono); font-size: .64rem; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--ink-faint); padding: .55rem .6rem; border-bottom: 1px solid var(--line); }
td { padding: .8rem .6rem; border-bottom: 1px solid var(--line-soft); vertical-align: top; }
tbody tr { transition: background .18s var(--settle); }
tbody tr:hover { background: var(--panel); }
th.n, td.n { text-align: center; font-family: var(--mono); font-variant-numeric: tabular-nums; }
td.rank { font-family: var(--mono); font-size: 1rem; font-weight: 700; color: var(--ink-faint); width: 2.6rem; text-align: center; }
tr.lead { box-shadow: inset 3px 0 0 var(--seal); }
tr.lead td.rank { color: var(--seal); }
td.name { font-weight: 700; font-size: 1rem; }
td.name .role { display: block; font-family: var(--mono); font-size: .64rem; letter-spacing: .08em; text-transform: uppercase; color: var(--ink-faint); font-weight: 400; margin-top: .15rem; }
td.oneliner { font-size: 1rem; color: var(--ink-soft); min-width: 12rem; }
td.oneliner .v { font-family: var(--mono); font-size: .64rem; }
.v.pos { color: var(--green); }
.v.neg { color: var(--seal); }
.cell { font-family: var(--mono); font-size: .8rem; font-weight: 700; }
.dim { color: var(--ink-faint); font-style: italic; }

/* stage legend */
.legend { display: flex; flex-wrap: wrap; gap: .4rem 1.6rem; padding: .9rem 0 .4rem; font-family: var(--mono); font-size: .64rem; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-faint); }
.leg-cell { display: inline-flex; align-items: baseline; gap: .4rem; }
.leg-kanji { font-size: .8rem; }

/* ── fixbox (focus) ── */
.fixbox { margin-bottom: .9rem; padding: .8rem 1rem; background: var(--panel); border-left: 3px solid var(--amber); font-size: .8rem; }
.fixbox.clean { border-left-color: var(--green); }
.fixbox .fx { font-family: var(--mono); font-size: .64rem; letter-spacing: .18em; text-transform: uppercase; color: var(--amber); display: block; margin-bottom: .35rem; }
.fixbox.clean .fx { color: var(--green); }
.fixbox p { margin: 0; color: var(--ink-soft); }
.fixbox p b { color: var(--ink); }

/* ── evidence trail ── */
.trail { display: grid; gap: 1px; background: var(--line); border: 1px solid var(--line); }
.dis-row { background: var(--panel); padding: 1.1rem 1.2rem; display: grid; grid-template-columns: 11rem 1fr; gap: 1.2rem; }
.dis-row.pos { border-left: 3px solid var(--green); }
.dis-row.neg { border-left: 3px solid var(--seal); }
.dis-row .where { font-family: var(--serif); font-weight: 800; font-size: 1rem; }
.dis-row .where .nums { display: block; font-family: var(--mono); font-size: .64rem; font-weight: 400; color: var(--seal); margin-top: .3rem; letter-spacing: .04em; }
.dis-row.pos .where .nums { color: var(--teal); }
.dis-row .why { font-size: 1rem; color: var(--ink-soft); }
.dis-row .why b { color: var(--ink); }

/* ── sessions ── */
.tag { display: inline-block; font-family: var(--mono); font-size: .64rem; font-weight: 700; padding: .12rem .55rem; border: 1px solid var(--line); }
.tag.p { border-color: var(--amber); color: var(--amber); }
.tag.e { border-color: var(--teal); color: var(--teal); }
.tag.w { border-color: var(--blue); color: var(--blue); }

/* ── quote ── */
.quote { border-top: 4px solid var(--line); border-bottom: 1px solid var(--line); padding: 2.2rem .4rem 2rem; display: grid; grid-template-columns: auto 1fr; gap: 1.6rem; margin-top: 2.8rem; }
.quote .qm { font-family: var(--serif); font-size: 3.815rem; line-height: .6; color: var(--seal); font-weight: 800; }
.quote blockquote { margin: 0; font-family: var(--serif); font-size: 1.25rem; line-height: 1.55; font-style: italic; }
.quote blockquote b { font-style: normal; }
.quote .attrib { margin-top: 1.1rem; font-family: var(--mono); font-size: .64rem; letter-spacing: .14em; text-transform: uppercase; color: var(--ink-faint); }
.quote .attrib b { color: var(--seal); }

.colophon { display: flex; justify-content: space-between; flex-wrap: wrap; gap: .8rem; margin-top: 3rem; padding-top: .9rem; border-top: 3px double var(--line); font-family: var(--mono); font-size: .64rem; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-faint); }

/* ── toggle ── */
.toggle {
  position: fixed; top: 1rem; right: 1rem; z-index: 100;
  font-family: var(--mono); font-size: .64rem; font-weight: 700; letter-spacing: .18em; text-transform: uppercase;
  padding: .55rem .85rem; background: var(--ink); color: var(--paper); border: 1px solid var(--ink); cursor: pointer;
  transition: background .3s var(--settle), color .3s var(--settle);
}
.toggle:hover { background: var(--seal); border-color: var(--seal); color: var(--seal-glyph); }

/* ── reveal ── */
.reveal { opacity: 0; transform: translateY(10px); transition: opacity .6s var(--settle), transform .6s var(--settle); }
.reveal.in { opacity: 1; transform: none; }

@media (max-width: 760px) {
  .figure { grid-template-columns: 1fr; gap: 1.4rem; }
  .enso-wrap { margin: 0 auto; }
  td.oneliner, th.h-one, .sess-touched { display: none; }
  .dis-row { grid-template-columns: 1fr; gap: .4rem; }
  .quote { grid-template-columns: 1fr; gap: .8rem; }
  .seal { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
  .reveal { opacity: 1; transform: none; }
  .enso-ring { stroke-dasharray: var(--full) 660; }
}
</style>
</head>
<body>

<div class="grain" aria-hidden="true"></div>
<button class="toggle" id="toggle" aria-label="switch paper and ink">Sumi</button>

<div class="wrap">

  <!-- masthead -->
  <header class="masthead">
    <div class="kicker">修行録 · the practice record</div>
    <h1>${esc(j.player)}</h1>
    <p class="dek">${summary}. Ratings are derived from evidence — the ink moves only when you do.</p>
    <div class="byline">
      <span>Updated · <b>${esc(j.updated || today)}</b></span>
      <span>Competencies · <b>${activeCount}</b></span>
      <span>Evidence · <b>${totalEvidence}</b></span>
      <span>Sessions · <b>${hist.length}</b></span>
    </div>
    <div class="seal" aria-hidden="true">修</div>
  </header>

  <!-- the figure -->
  <section class="figure">
    <div class="enso-wrap" aria-label="map fullness ${fullness} of 100">
      <svg viewBox="0 0 240 240">
        <circle class="enso-track" cx="120" cy="120" r="105"/>
        <circle class="enso-ring" cx="120" cy="120" r="105" style="--full:${Math.round(fullness / 100 * 660)}"/>
      </svg>
      <div class="big">${fullness}<span class="dec">%</span></div>
      <div class="scale">map fullness</div>
    </div>
    <div class="take">
      <div class="lab">the reading</div>
      <h2>${developing} developing · ${gaps} gap${gaps !== 1 ? 's' : ''} exposed</h2>
      <p>Four stages of practice — 守 keep the form, 破 break the form, 離 leave the form, 熟 ripened. Every positive entry is a step; every gap is a target, not a stain.</p>
    </div>
  </section>

  <!-- I · the map -->
  <section class="sec reveal">
    <div class="sec-head"><span class="sec-no">I.</span><span class="sec-title">The Map</span><span class="sec-note">stage · competency · last evidence</span></div>
    ${skillMap}
    <div class="legend">${legend}</div>
  </section>

  <!-- II · focus -->
  <section class="sec reveal">
    <div class="sec-head"><span class="sec-no">II.</span><span class="sec-title">Focus — what to sit with</span><span class="sec-note">most recent gaps</span></div>
    ${focusHtml}
  </section>

  <!-- III · evidence trail -->
  <section class="sec reveal">
    <div class="sec-head"><span class="sec-no">III.</span><span class="sec-title">Evidence Trail</span><span class="sec-note">last ten</span></div>
    <div class="trail">
      ${trail || '<div class="dis-row"><div class="where">—</div><div class="why">No evidence yet. The trail begins with the first honest note.</div></div>'}
    </div>
  </section>

  <!-- IV · sessions -->
  <section class="sec reveal">
    <div class="sec-head"><span class="sec-no">IV.</span><span class="sec-title">Sessions</span><span class="sec-note">last ten</span></div>
    <table>
      <thead><tr><th class="n" style="width:6.2rem">date</th><th style="width:6.4rem">skill</th><th>what happened</th><th class="n sess-touched" style="width:9rem">touched</th></tr></thead>
      <tbody>${sessions || '<tr><td class="n dim">—</td><td>—</td><td class="dim">No activations yet.</td></tr>'}</tbody>
    </table>
  </section>

  <!-- quote -->
  <div class="quote reveal">
    <div class="qm" aria-hidden="true">“</div>
    <div>
      <blockquote>Evidence over points. Quality over frequency. <b>Nothing here celebrates but the ink.</b></blockquote>
      <div class="attrib">the practice record · <b>${esc(j.player)}</b></div>
    </div>
  </div>

  <div class="colophon">
    <span>rendered by game-render.js · ${today}</span>
    <span>skillify · one progression, two teachers</span>
  </div>

</div>

<script>
(function () {
  var saved = localStorage.getItem('practice-paper');
  if (saved === 'sumi') document.documentElement.setAttribute('data-mode', 'sumi');
  var btn = document.getElementById('toggle');
  function label() {
    btn.textContent = document.documentElement.getAttribute('data-mode') === 'sumi' ? 'Washi' : 'Sumi';
  }
  label();
  btn.addEventListener('click', function () {
    var next = document.documentElement.getAttribute('data-mode') === 'sumi' ? 'day' : 'sumi';
    var apply = function () {
      if (next === 'sumi') document.documentElement.setAttribute('data-mode', 'sumi');
      else document.documentElement.removeAttribute('data-mode');
      localStorage.setItem('practice-paper', next);
      label();
    };
    if (document.startViewTransition) document.startViewTransition(apply); else apply();
  });

  requestAnimationFrame(function () { requestAnimationFrame(function () { document.body.classList.add('loaded'); }); });

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .12 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }
})();
</script>
</body>
</html>`;

  const outPath = path.join(baseDir, 'progress.html');
  fs.writeFileSync(outPath, html);
  const total = Object.values(derived).reduce((a, d) => a + d.evidence.length, 0);
  console.log(`rendered ${outPath} — ${Object.keys(derived).length} competencies, ${total} evidence entries, ${hist.length} activations, ${fullness}% full`);
}

main();
