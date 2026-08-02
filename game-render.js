#!/usr/bin/env node
// game-render.js — reads progress.json and renders the skill-map dashboard.
// The dashboard is a render, never hand-edited. Ratings are derived from evidence.
// Aesthetic: 修行録 — the practice record. Dark sumi, quiet, no confetti.
// The satisfaction is the bars moving, not a badge popup.
// Usage: node game-render.js [path/to/progress.json]
'use strict';
const fs = require('fs');
const path = require('path');

const COMPETENCIES = {
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
const STAGE = {
  emerging:   { kanji: '守', en: 'keep the form' },
  developing: { kanji: '破', en: 'break the form' },
  reliable:   { kanji: '離', en: 'leave the form' },
  mastered:   { kanji: '熟', en: 'ripened' },
};
const RATINGS = ['emerging', 'developing', 'reliable', 'mastered'];
const RATING_COLOR = { emerging: '#5b564d', developing: '#d9a04a', reliable: '#4a9e8e', mastered: '#7ba05a' };
const RATING_PCT = { emerging: 25, developing: 50, reliable: 75, mastered: 100 };
const GROUP = {
  prompting:     { kanji: '言', title: 'Prompting',     accent: '#d9a04a' },
  understanding: { kanji: '解', title: 'Understanding', accent: '#4a9e8e' },
  pipeline:      { kanji: '流', title: 'Pipeline',      accent: '#6f93b0' },
};

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function deriveRating(evidence) {
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
  const jsonPath = process.argv[2] || path.join(require('os').homedir(), '.agents/learnings/progress.json');
  const baseDir = path.dirname(jsonPath);
  const j = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const comps = j.competencies || {};
  const hist = j.history || [];
  const today = new Date().toISOString().slice(0, 10);

  // Derive ratings from evidence
  const derived = {};
  for (const [id, data] of Object.entries(comps)) {
    derived[id] = { rating: deriveRating(data.evidence), evidence: data.evidence || [] };
  }

  // All evidence entries, sorted by date desc
  const allEvidence = [];
  for (const [id, data] of Object.entries(derived)) {
    for (const e of data.evidence) {
      allEvidence.push({ ...e, comp: id });
    }
  }
  allEvidence.sort((a, b) => b.date.localeCompare(a.date));

  // Focus: competencies with most recent negative evidence
  const negByComp = {};
  for (const e of allEvidence) {
    if (e.valence === 'negative' && !negByComp[e.comp]) negByComp[e.comp] = e;
  }
  const focus = Object.entries(negByComp).slice(0, 2);

  // Summary line + ensō fullness (mean stage across competencies with evidence)
  const improving = Object.values(derived).filter((d) => d.rating === 'developing').length;
  const gaps = Object.keys(negByComp).length;
  const summary = `${improving} developing, ${gaps} gap${gaps !== 1 ? 's' : ''} exposed`;
  const active = Object.values(derived).filter((d) => d.evidence.length > 0);
  const fullness = active.length ? Math.round(active.reduce((a, d) => a + RATING_PCT[d.rating], 0) / active.length) : 0;
  const totalEvidence = allEvidence.length;
  const activeCount = active.length;

  // Skill map — brush bars, stage seals, last evidence on hover
  function renderGroup(key, entries) {
    const g = GROUP[key];
    const rows = entries.map(([id, label]) => {
      const d = derived[id] || { rating: 'emerging', evidence: [] };
      const st = STAGE[d.rating];
      const color = RATING_COLOR[d.rating];
      const pct = RATING_PCT[d.rating];
      const count = d.evidence.length;
      const last = d.evidence.length ? d.evidence[d.evidence.length - 1] : null;
      const lastHtml = last
        ? `<div class="comp-last"><span class="cl-v ${last.valence === 'positive' ? 'pos' : 'neg'}">${last.valence === 'positive' ? '▲' : '▼'}</span> ${esc(last.note)}</div>`
        : `<div class="comp-last dim">no evidence yet — the bar waits</div>`;
      return `<div class="comp" style="--pct:${pct}%;--rc:${color}">
        <span class="comp-stage" title="${d.rating} — ${st.en}">${st.kanji}</span>
        <div class="comp-main">
          <div class="comp-head">
            <span class="comp-id">${id}</span>
            <span class="comp-label">${esc(label)}</span>
            <span class="comp-meta"><span class="comp-word" style="color:${color}">${d.rating}</span> · ${count} ev</span>
          </div>
          <div class="comp-track"><i class="comp-fill"></i></div>
          ${lastHtml}
        </div>
      </div>`;
    }).join('\n');
    return `<section class="group">
      <header class="group-head"><span class="group-kanji" style="color:${g.accent}">${g.kanji}</span><h2>${g.title}</h2><span class="group-line"></span></header>
      ${rows}
    </section>`;
  }

  // Progressive unlock: only show groups that have evidence
  const hasEvidence = (entries) => entries.some(([id]) => (derived[id]?.evidence?.length || 0) > 0);
  const groups = [renderGroup('prompting', COMPETENCIES.prompting)];
  if (hasEvidence(COMPETENCIES.understanding)) groups.push(renderGroup('understanding', COMPETENCIES.understanding));
  if (hasEvidence(COMPETENCIES.pipeline)) groups.push(renderGroup('pipeline', COMPETENCIES.pipeline));
  const skillMap = groups.join('\n');

  // Evidence trail (last 10) — a vertical ink trail, not a table
  const trail = allEvidence.slice(0, 10).map((e) => {
    const cls = e.valence === 'positive' ? 'pos' : 'neg';
    const mark = e.valence === 'positive' ? '▲' : '▼';
    return `<div class="trail-item ${cls}">
      <span class="trail-dot">${mark}</span>
      <div class="trail-body"><span class="trail-date">${esc(e.date)}</span><span class="trail-comp">${e.comp}</span><span class="trail-note">${esc(e.note)}</span></div>
    </div>`;
  }).join('\n');

  // Focus — what to sit with
  const focusHtml = focus.length > 0
    ? focus.map(([id, e]) => `<div class="focus-item"><span class="focus-kanji">公</span><div><strong>${id}</strong> — ${esc(e.note)} <span class="focus-date">(${esc(e.date)})</span></div></div>`).join('')
    : '<div class="focus-item clean"><span class="focus-kanji">円</span><div>No recent gaps. A clean run — sit with what is working.</div></div>';

  // Sessions (last 10)
  const sessions = [...hist].reverse().slice(0, 10).map((h) => {
    const cls = h.skill === 'explainify' ? 'e' : h.skill === 'pipeline' ? 'w' : 'p';
    const touched = (h.competencies_touched || []).join(' ');
    return `<div class="sess">
      <span class="sess-date">${esc(h.date)}</span>
      <span class="tag ${cls}">${esc(h.skill)}</span>
      <span class="sess-topic">${esc(h.topic)}</span>
      <span class="sess-touched">${esc(touched)}</span>
    </div>`;
  }).join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>修行録 — ${esc(j.player)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;600;700;800&family=Zen+Kaku+Gothic+New:wght@400;500;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<style>
  /* 修行録 — the practice record. Dark sumi default, washi via [data-paper="day"].
     No confetti. The bars moving is the reward. */
  :root {
    color-scheme: dark;
    --paper:  #17130e;
    --paper-2:#1d1812;
    --paper-3:#241e16;
    --ink:    #ece1c9;
    --ink-soft:#b3a894;
    --ink-faint:#7d7260;
    --line:   #372e23;
    --line-soft:#2c241b;
    --verm:   #c4493b;
    --gold:   #d9a04a;
    --teal:   #4a9e8e;
    --blue:   #6f93b0;
    --green:  #7ba05a;
    --serif: 'Shippori Mincho','Hiragino Mincho ProN',Georgia,serif;
    --sans: 'Zen Kaku Gothic New','Hiragino Kaku Gothic ProN',system-ui,sans-serif;
    --mono: 'JetBrains Mono',ui-monospace,Menlo,monospace;
    --settle: cubic-bezier(0.22,1,0.36,1);
  }
  html[data-paper="day"] {
    color-scheme: light;
    --paper:  #ece1c9;
    --paper-2:#f2e9d6;
    --paper-3:#e7dbc2;
    --ink:    #241d15;
    --ink-soft:#5f5342;
    --ink-faint:#8a7c66;
    --line:   #d3c5a8;
    --line-soft:#ddd0b6;
    --verm:   #b13a2e;
    --gold:   #a06820;
    --teal:   #2d7a6a;
    --blue:   #3a6a95;
    --green:  #4f7a34;
  }
  * { box-sizing:border-box; margin:0; }
  html { scroll-behavior:smooth; }
  body { background:var(--paper); color:var(--ink); font-family:var(--sans); line-height:1.6;
         transition:background .5s var(--settle), color .5s var(--settle); overflow-x:hidden; }
  ::selection { background:var(--verm); color:var(--paper); }
  /* layered ground: two soft glows + a faint grid, masked toward the top */
  .ground { position:fixed; inset:0; z-index:0; pointer-events:none;
    background:
      radial-gradient(900px 560px at 88% -10%, color-mix(in srgb, var(--gold) 7%, transparent), transparent 62%),
      radial-gradient(760px 520px at -6% 106%, color-mix(in srgb, var(--teal) 6%, transparent), transparent 60%); }
  .ground::after { content:""; position:absolute; inset:0;
    background-image:linear-gradient(var(--line-soft) 1px, transparent 1px),linear-gradient(90deg, var(--line-soft) 1px, transparent 1px);
    background-size:64px 64px; opacity:.35;
    -webkit-mask-image:radial-gradient(900px 600px at 50% 0%, #000 0%, transparent 80%);
            mask-image:radial-gradient(900px 600px at 50% 0%, #000 0%, transparent 80%); }
  .wrap { position:relative; z-index:1; max-width:58rem; margin:0 auto; padding:3.2rem 1.6rem 5rem; }

  /* ── header: name on the left, ensō on the right ── */
  header.top { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:2.4rem; align-items:center;
    padding-bottom:2.2rem; border-bottom:3px double var(--line); margin-bottom:2.4rem; }
  .kicker { font-family:var(--mono); font-size:.66rem; letter-spacing:.32em; text-transform:uppercase; color:var(--gold); }
  .kicker::before { content:"◈ "; color:var(--verm); }
  h1.name { font-family:var(--serif); font-weight:800; letter-spacing:-.01em; line-height:1;
    font-size:clamp(2.6rem,7vw,4rem); margin:.5rem 0 .6rem; }
  .summary { font-family:var(--serif); font-style:italic; font-size:1.05rem; color:var(--ink-soft); }
  .meta { margin-top:.9rem; font-family:var(--mono); font-size:.66rem; letter-spacing:.12em; text-transform:uppercase;
    color:var(--ink-faint); display:flex; gap:1.3rem; flex-wrap:wrap; }
  .meta b { color:var(--ink-soft); }
  .enso-wrap { position:relative; width:172px; height:172px; flex-shrink:0; }
  .enso-wrap svg { width:100%; height:100%; transform:rotate(-90deg); }
  .enso-track { fill:none; stroke:var(--paper-3); stroke-width:12; }
  .enso-ring { fill:none; stroke:var(--ink); stroke-width:12; stroke-linecap:round;
    stroke-dasharray:0 628; transition:stroke-dasharray 1.6s var(--settle) .3s; }
  body.loaded .enso-ring { stroke-dasharray: var(--full) 628; }
  .enso-center { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
  .enso-num { font-family:var(--serif); font-size:2.6rem; font-weight:800; line-height:1; }
  .enso-num .pc { font-size:1.1rem; color:var(--verm); }
  .enso-cap { font-family:var(--mono); font-size:.56rem; letter-spacing:.26em; text-transform:uppercase; color:var(--ink-faint); margin-top:.4rem; text-align:center; }

  /* ── a group of competencies ── */
  .group { margin-bottom:2.2rem; }
  .group-head { display:flex; align-items:center; gap:.9rem; margin-bottom:.4rem; }
  .group-kanji { font-family:var(--serif); font-size:1.7rem; font-weight:700; line-height:1; }
  .group-head h2 { font-family:var(--mono); font-size:.72rem; font-weight:700; letter-spacing:.26em; text-transform:uppercase; color:var(--ink-soft); }
  .group-line { flex:1; height:1px; background:var(--line); }

  /* ── one competency: stage seal + brush bar + last evidence on hover ── */
  .comp { display:grid; grid-template-columns:auto 1fr; gap:1rem; align-items:start;
    padding:.85rem .9rem; border-radius:6px; position:relative; overflow:hidden;
    transition:background .4s var(--settle); }
  .comp::before { content:""; position:absolute; left:0; top:0; bottom:0; width:0;
    background:radial-gradient(120% 120% at 0% 50%, color-mix(in srgb, var(--ink) 6%, transparent), transparent 70%);
    transition:width .6s var(--settle); pointer-events:none; }
  .comp:hover { background:var(--paper-2); }
  .comp:hover::before { width:100%; }
  .comp-stage { font-family:var(--serif); font-weight:800; font-size:1.5rem; line-height:1;
    width:2.6rem; height:2.6rem; display:grid; place-items:center; flex-shrink:0;
    color:var(--rc); border:1.5px solid color-mix(in srgb, var(--rc) 55%, transparent);
    border-radius:6px; transform:rotate(-3deg); background:color-mix(in srgb, var(--rc) 9%, var(--paper-2));
    transition:transform .3s var(--settle); }
  .comp:hover .comp-stage { transform:rotate(0deg) scale(1.05); }
  .comp-head { display:flex; align-items:baseline; gap:.7rem; }
  .comp-id { font-family:var(--mono); font-size:.68rem; font-weight:700; color:var(--ink-faint); width:2rem; flex-shrink:0; }
  .comp-label { font-size:.95rem; font-weight:600; }
  .comp-meta { margin-left:auto; font-family:var(--mono); font-size:.64rem; color:var(--ink-faint); white-space:nowrap; }
  .comp-word { font-weight:700; }
  .comp-track { height:6px; background:var(--paper-3); border-radius:99px; overflow:hidden; margin:.55rem 0 .35rem; }
  .comp-fill { display:block; height:100%; width:0; border-radius:99px; background:var(--rc);
    box-shadow:0 0 10px color-mix(in srgb, var(--rc) 45%, transparent);
    transition:width 1.2s var(--settle); }
  body.loaded .comp-fill { width:var(--pct); }
  .comp-last { font-size:.76rem; color:var(--ink-faint); line-height:1.45;
    max-height:0; opacity:0; overflow:hidden; transition:max-height .45s var(--settle), opacity .45s var(--settle); }
  .comp:hover .comp-last { max-height:4.5em; opacity:1; }
  .comp-last.dim { font-style:italic; }
  .cl-v.pos { color:var(--green); } .cl-v.neg { color:var(--verm); }

  /* ── section headings ── */
  .sec-head { display:flex; align-items:baseline; gap:.9rem; border-top:1px solid var(--line);
    padding-top:1rem; margin:2.6rem 0 1.1rem; }
  .sec-head .no { font-family:var(--mono); font-size:.72rem; font-weight:700; color:var(--verm); }
  .sec-head h2 { font-family:var(--mono); font-size:.74rem; font-weight:700; letter-spacing:.26em; text-transform:uppercase; }
  .sec-head .note { margin-left:auto; font-family:var(--mono); font-size:.6rem; letter-spacing:.1em; text-transform:uppercase; color:var(--ink-faint); }

  /* ── focus ── */
  .focus-item { display:flex; gap:1rem; align-items:flex-start; background:var(--paper-2);
    border:1px solid var(--line); border-left:3px solid var(--verm); border-radius:6px;
    padding:.85rem 1rem; margin-bottom:.6rem; font-size:.88rem; color:var(--ink-soft); }
  .focus-item.clean { border-left-color:var(--green); }
  .focus-item strong { color:var(--ink); }
  .focus-kanji { font-family:var(--serif); font-size:1.2rem; font-weight:700; color:var(--verm); line-height:1.2; }
  .focus-item.clean .focus-kanji { color:var(--green); }
  .focus-date { color:var(--ink-faint); font-size:.78rem; }

  /* ── evidence trail ── */
  .trail { position:relative; padding-left:1.6rem; }
  .trail::before { content:""; position:absolute; left:.42rem; top:.4rem; bottom:.4rem; width:1px; background:var(--line); }
  .trail-item { position:relative; padding:.45rem 0 .45rem .4rem; }
  .trail-dot { position:absolute; left:-1.6rem; top:.55rem; width:1.05rem; height:1.05rem; border-radius:99px;
    display:grid; place-items:center; font-size:.55rem; font-weight:800; background:var(--paper);
    border:1.5px solid var(--line); }
  .trail-item.pos .trail-dot { color:var(--green); border-color:color-mix(in srgb, var(--green) 55%, var(--line)); }
  .trail-item.neg .trail-dot { color:var(--verm); border-color:color-mix(in srgb, var(--verm) 55%, var(--line)); }
  .trail-body { display:flex; align-items:baseline; gap:.8rem; font-size:.84rem; }
  .trail-date { font-family:var(--mono); font-size:.64rem; color:var(--ink-faint); flex-shrink:0; }
  .trail-comp { font-family:var(--mono); font-size:.66rem; font-weight:700; color:var(--gold); flex-shrink:0; }
  .trail-note { color:var(--ink-soft); }

  /* ── sessions ── */
  .sess { display:flex; align-items:baseline; gap:.9rem; padding:.55rem .4rem; border-bottom:1px solid var(--line-soft); font-size:.84rem; }
  .sess:last-child { border-bottom:0; }
  .sess-date { font-family:var(--mono); font-size:.64rem; color:var(--ink-faint); flex-shrink:0; }
  .tag { font-family:var(--mono); font-size:.62rem; font-weight:700; padding:.12rem .55rem; border-radius:99px; flex-shrink:0; }
  .tag.p { background:color-mix(in srgb, var(--gold) 16%, var(--paper-2)); color:var(--gold); }
  .tag.e { background:color-mix(in srgb, var(--teal) 16%, var(--paper-2)); color:var(--teal); }
  .tag.w { background:color-mix(in srgb, var(--blue) 16%, var(--paper-2)); color:var(--blue); }
  .sess-topic { color:var(--ink-soft); flex:1; min-width:0; }
  .sess-touched { font-family:var(--mono); font-size:.6rem; color:var(--ink-faint); white-space:nowrap; }

  footer { margin-top:3.4rem; padding-top:1.6rem; border-top:3px double var(--line);
    display:flex; align-items:center; gap:1rem; }
  .seal { display:inline-grid; place-items:center; width:2.6rem; height:2.6rem; background:var(--verm); color:var(--paper);
    font-family:var(--serif); font-weight:700; font-size:1.15rem; border-radius:6px; transform:rotate(-4deg); flex-shrink:0; }
  .foot-text { font-family:var(--serif); font-style:italic; font-size:.9rem; color:var(--ink-faint); }
  .foot-text b { color:var(--ink-soft); font-style:normal; }

  .paper-toggle { position:fixed; top:1.2rem; right:1.2rem; z-index:70; cursor:pointer;
    width:2.9rem; height:2.9rem; background:var(--verm); color:var(--paper); border:0; border-radius:7px;
    font-family:var(--serif); font-size:1.15rem; font-weight:700; transform:rotate(3deg);
    transition:transform .3s var(--settle); }
  .paper-toggle:hover { transform:rotate(0deg) scale(1.06); }

  .reveal { opacity:0; transform:translateY(16px); transition:opacity .7s var(--settle), transform .7s var(--settle); }
  .reveal.in { opacity:1; transform:none; }

  @media (max-width:760px){
    header.top { grid-template-columns:1fr; }
    .enso-wrap { margin:0 auto; }
    .comp-meta { display:none; }
    .sess-touched { display:none; }
  }
  @media (prefers-reduced-motion: reduce){
    *,*::before,*::after { transition:none!important; animation:none!important; }
    .reveal { opacity:1; transform:none; }
    .comp-fill { width:var(--pct); }
    .enso-ring { stroke-dasharray:var(--full) 628; }
    .comp-last { max-height:none; opacity:1; }
  }
</style>
</head>
<body>
<div class="ground" aria-hidden="true"></div>
<button class="paper-toggle" id="paper-toggle" aria-label="turn the paper">昼</button>

<div class="wrap">

  <header class="top">
    <div>
      <div class="kicker">修行録 · the practice record</div>
      <h1 class="name">${esc(j.player)}</h1>
      <p class="summary">${summary}</p>
      <div class="meta">
        <span>updated <b>${esc(j.updated || today)}</b></span>
        <span>competencies <b>${activeCount}</b></span>
        <span>evidence <b>${totalEvidence}</b></span>
        <span>sessions <b>${hist.length}</b></span>
      </div>
    </div>
    <div class="enso-wrap" aria-label="map fullness ${fullness} of 100">
      <svg viewBox="0 0 240 240">
        <circle class="enso-track" cx="120" cy="120" r="100"/>
        <circle class="enso-ring" cx="120" cy="120" r="100" style="--full:${Math.round(fullness / 100 * 628)}"/>
      </svg>
      <div class="enso-center">
        <div class="enso-num">${fullness}<span class="pc">%</span></div>
        <div class="enso-cap">map<br>fullness</div>
      </div>
    </div>
  </header>

  ${skillMap}

  <div class="sec-head reveal"><span class="no">公案</span><h2>Focus — what to sit with</h2><span class="note">most recent gaps</span></div>
  ${focusHtml}

  <div class="sec-head reveal"><span class="no">証</span><h2>Evidence trail</h2><span class="note">last ten</span></div>
  <div class="trail reveal">
    ${trail || '<div class="trail-item"><div class="trail-body"><span class="trail-note">No evidence yet. The trail begins with the first honest note.</span></div></div>'}
  </div>

  <div class="sec-head reveal"><span class="no">座</span><h2>Sessions</h2><span class="note">last ten</span></div>
  <div class="reveal">
    ${sessions || '<div class="sess"><span class="sess-topic">No activations yet.</span></div>'}
  </div>

  <footer class="reveal">
    <span class="seal">学</span>
    <p class="foot-text"><b>Evidence over points. Quality over frequency.</b> The bars move when you do — nothing here celebrates but the ink.</p>
  </footer>

</div>

<script>
(function(){
  var saved = localStorage.getItem('practice-paper');
  if (saved === 'day') document.documentElement.setAttribute('data-paper','day');
  var btn = document.getElementById('paper-toggle');
  function label(){ btn.textContent = document.documentElement.getAttribute('data-paper')==='day' ? '夜' : '昼'; }
  label();
  btn.addEventListener('click', function(){
    var next = document.documentElement.getAttribute('data-paper')==='day' ? 'night' : 'day';
    var apply = function(){
      if (next==='day') document.documentElement.setAttribute('data-paper','day');
      else document.documentElement.removeAttribute('data-paper');
      localStorage.setItem('practice-paper', next); label();
    };
    if (document.startViewTransition) document.startViewTransition(apply); else apply();
  });

  /* draw the bars + ensō once the ink settles */
  requestAnimationFrame(function(){ requestAnimationFrame(function(){ document.body.classList.add('loaded'); }); });

  /* reveal on scroll */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold:.12 });
    document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('in'); });
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
