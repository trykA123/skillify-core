#!/usr/bin/env node
// game-render.js — reads ~/.agents/learnings/progress.json and renders progress.html.
// The dashboard is a render, never hand-edited. Level, badges, and charts are
// derived here from stats + history — the agent maintains data, not markup.
// Usage: node game-render.js [path/to/progress.json]
'use strict';
const fs = require('fs');
const path = require('path');

const LEVELS = [
  [0, 'Apprentice'], [25, 'Tinkerer'], [75, 'Journeyman'], [150, 'Artisan'],
  [250, 'Craftsman'], [375, 'Master'], [525, 'Grandmaster'], [700, 'Sage'],
  [900, 'Elder'], [1125, 'Legend'],
];
const BADGES = [
  ['first-lesson', '🌱', (s) => s.lessons >= 1],
  ['both-skills', '🤝', (s) => s.promptify_xp > 0 && s.explainify_xp > 0],
  ['lessons-5', '📚', (s) => s.lessons >= 5],
  ['lessons-15', '🏆', (s) => s.lessons >= 15],
  ['glossary-5', '📖', (s) => s.glossary_terms >= 5],
  ['glossary-15', '📖', (s) => s.glossary_terms >= 15],
  ['glossary-30', '📖', (s) => s.glossary_terms >= 30],
  ['streak-3', '🔥', (s) => Math.max(s.streak, s.best_streak) >= 3],
  ['streak-7', '🔥', (s) => Math.max(s.streak, s.best_streak) >= 7],
  ['streak-14', '🔥', (s) => Math.max(s.streak, s.best_streak) >= 14],
  ['level-2', '⚒️', (s) => levelFrom(s.xp) >= 2],
  ['level-4', '🛡️', (s) => levelFrom(s.xp) >= 4],
];

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const shortDate = (d) => { const [y, m, day] = d.split('-').map(Number); return new Date(y, m - 1, day).toLocaleDateString('en', { month: 'short', day: 'numeric' }); };

function levelFrom(xp) {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i][0]) idx = i;
  return idx + 1;
}

function artifactHref(baseDir, artifact) {
  if (!artifact) return null;
  const candidates = (p) => (p.endsWith('.md') ? [p.replace(/\.md$/, '.html'), p] : [p]);
  if (artifact.startsWith('file://')) {
    const base = artifact.slice('file://'.length);
    for (const c of candidates(base)) if (fs.existsSync(c)) return 'file://' + c;
    return null;
  }
  for (const c of candidates(artifact)) if (fs.existsSync(path.resolve(baseDir, c))) return c;
  return null;
}

function main() {
  const jsonPath = process.argv[2] || path.join(require('os').homedir(), '.agents/learnings/progress.json');
  const baseDir = path.dirname(jsonPath);
  const j = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const s = j.stats || {};
  const hist = j.history || [];
  const today = new Date().toISOString().slice(0, 10);

  const level = levelFrom(s.xp || 0);
  const cur = LEVELS[level - 1];
  const next = LEVELS[level] || null;
  const pct = next ? Math.min(100, Math.round(((s.xp - cur[0]) / (next[0] - cur[0])) * 100)) : 100;
  const earned = new Set(BADGES.filter(([, , f]) => f(s)).map(([id]) => id));
  const days = [...new Set(hist.map((h) => h.date))].sort();
  const dailyXp = days.map((d) => hist.filter((h) => h.date === d).reduce((a, h) => a + (h.xp || 0), 0));
  const dailyGl = days.map((d) => hist.filter((h) => h.date === d).reduce((a, h) => a + (h.glossary_added || 0), 0));
  const maxXp = Math.max(10, ...dailyXp);
  const total = s.xp || 0;
  const glPct = Math.min(100, Math.round(((s.glossary_terms || 0) / 30) * 100));

  // ── XP-over-time SVG (bars per day) ─────────────────────────────
  const W = 320, H = 110, left = 34, right = 306, base = 88;
  const slot = (right - left) / Math.max(1, days.length);
  const bw = Math.min(84, slot * 0.6);
  const bars = days.map((d, i) => {
    const cx = left + slot * i + slot / 2;
    const h = Math.max(3, (dailyXp[i] / maxXp) * 70);
    return `<rect x="${(cx - bw / 2).toFixed(1)}" y="${(base - h).toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="4" fill="#f59e0b"/>
      <text x="${cx.toFixed(1)}" y="${(base - h - 8).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="700" fill="#e2e8f0">${dailyXp[i]}</text>
      <text x="${cx.toFixed(1)}" y="103" text-anchor="middle" font-size="10" fill="#64748b">${shortDate(d)}</text>`;
  });
  const xpChart = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Bar chart: XP earned per day">
    <line x1="${left}" y1="10" x2="${left}" y2="${base}" stroke="#1e293b" stroke-width="1"/>
    <line x1="${left}" y1="${base}" x2="${right}" y2="${base}" stroke="#1e293b" stroke-width="1"/>
    ${bars.join('\n    ')}
    <text x="${left - 6}" y="16" text-anchor="end" font-size="9" fill="#64748b">${maxXp}</text>
    <text x="${left - 6}" y="${base + 4}" text-anchor="end" font-size="9" fill="#64748b">0</text>
  </svg>`;

  const pXp = s.promptify_xp || 0, eXp = s.explainify_xp || 0;
  const pW = total ? Math.round((pXp / total) * 100) : 0;
  const eW = total ? Math.round((eXp / total) * 100) : 0;

  const rows = [...hist].reverse().slice(0, 10).map((h) => {
    const href = artifactHref(baseDir, h.artifact);
    const topic = href ? `<a href="${esc(href)}">${esc(h.topic)}</a>` : esc(h.topic || '—');
    const tag = h.skill === 'explainify' ? '<span class="tag e">explainify</span>' : '<span class="tag p">promptify</span>';
    return `<tr><td>${esc(h.date)}</td><td>${tag}</td><td>${topic}</td><td>+${h.glossary_added || 0}</td><td>+${h.xp || 0}</td></tr>`;
  }).join('\n          ');

  const badgeHtml = BADGES.map(([id, ic]) =>
    `<div class="badge${earned.has(id) ? ' on' : ''}"><span class="ic">${ic}</span>${id}</div>`).join('\n        ');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Learning progress — ${esc(j.player)}</title>
<style>
  :root { --bg: #0b0f14; --panel: #111827; --panel2: #1a2332; --ink: #e2e8f0; --muted: #64748b; --line: #1e293b; --amber: #f59e0b; --teal: #2dd4bf; }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--ink); font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; line-height: 1.5; }
  .wrap { max-width: 56rem; margin: 0 auto; padding: 2.5rem 1.5rem 4rem; }
  header.level { text-align: center; padding: 2.5rem 1.5rem 2rem; border-bottom: 1px solid var(--line); }
  .kicker { color: var(--muted); font-size: .8rem; letter-spacing: .25em; text-transform: uppercase; margin: 0 0 .75rem; }
  h1 { margin: 0 0 .5rem; font-size: 2.75rem; font-weight: 800; letter-spacing: -.02em; }
  .title { color: var(--amber); font-size: 1.35rem; font-weight: 700; margin: 0 0 1.25rem; }
  .xp { color: var(--muted); font-size: .95rem; margin: 0 0 1.5rem; }
  .xp b { color: var(--ink); font-size: 1.4rem; }
  .bar { max-width: 30rem; margin: 0 auto; }
  .bar .track { height: .6rem; background: var(--panel2); border-radius: 99px; overflow: hidden; }
  .bar .fill { height: 100%; width: ${pct}%; background: linear-gradient(90deg, var(--amber), #fbbf24); border-radius: 99px; }
  .bar .labels { display: flex; justify-content: space-between; color: var(--muted); font-size: .8rem; margin-top: .4rem; }
  .stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: .75rem; margin: 1.5rem 0 2rem; }
  .stat { background: var(--panel); border: 1px solid var(--line); border-radius: .75rem; padding: 1rem; text-align: center; }
  .stat .v { font-size: 1.6rem; font-weight: 800; }
  .stat .k { color: var(--muted); font-size: .75rem; letter-spacing: .1em; text-transform: uppercase; margin-top: .25rem; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; margin-bottom: 2rem; }
  .card { background: var(--panel); border: 1px solid var(--line); border-radius: .75rem; padding: 1.25rem; }
  .card h2 { margin: 0 0 1rem; font-size: .85rem; color: var(--muted); letter-spacing: .15em; text-transform: uppercase; }
  .card.full { grid-column: 1 / -1; }
  .hbar { margin-bottom: .9rem; }
  .hbar .lbl { display: flex; justify-content: space-between; font-size: .85rem; margin-bottom: .3rem; }
  .hbar .lbl .val { color: var(--muted); }
  .hbar .track { height: .55rem; background: var(--panel2); border-radius: 99px; overflow: hidden; }
  .hbar .fill { height: 100%; border-radius: 99px; }
  .fill.amber { background: linear-gradient(90deg, #b45309, var(--amber)); }
  .fill.teal { background: linear-gradient(90deg, #0f766e, var(--teal)); }
  .badges { display: grid; grid-template-columns: repeat(4, 1fr); gap: .6rem; }
  .badge { background: var(--panel2); border: 1px solid var(--line); border-radius: .6rem; padding: .7rem .5rem; text-align: center; font-size: .8rem; color: var(--muted); }
  .badge .ic { font-size: 1.3rem; display: block; margin-bottom: .3rem; filter: grayscale(1); opacity: .45; }
  .badge.on { border-color: #3f2d0f; background: #1c1405; color: var(--amber); }
  .badge.on .ic { filter: none; opacity: 1; }
  table { width: 100%; border-collapse: collapse; font-size: .85rem; }
  th { text-align: left; color: var(--muted); font-weight: 600; padding: .4rem .6rem; border-bottom: 1px solid var(--line); }
  td { padding: .5rem .6rem; border-bottom: 1px solid var(--line); }
  td .tag { font-size: .7rem; padding: .15rem .45rem; border-radius: 99px; font-weight: 700; }
  .tag.p { background: #3f2d0f; color: var(--amber); }
  .tag.e { background: #0f3a36; color: var(--teal); }
  a { color: var(--teal); text-decoration: none; }
  footer { text-align: center; color: var(--muted); font-size: .8rem; margin-top: 2.5rem; }
  .flame { color: #fb923c; }
</style>
</head>
<body>
<header class="level">
  <p class="kicker">Learning progress</p>
  <h1>${esc(j.player)}</h1>
  <p class="title">Level ${level} · ${cur[1]}</p>
  <p class="xp"><b>${s.xp || 0}</b>${next ? ` / ${next[0]} XP → Level ${level + 1} · ${next[1]}` : ' XP — max level'}</p>
  <div class="bar"><div class="track"><div class="fill"></div></div>
    <div class="labels"><span>${cur[1]}</span><span>${next ? next[1] : 'Legend'}</span></div></div>
</header>
<div class="wrap">
  <div class="stats">
    <div class="stat"><div class="v flame">${s.streak || 0} 🔥</div><div class="k">Current streak</div></div>
    <div class="stat"><div class="v">${s.best_streak || 0}</div><div class="k">Best streak</div></div>
    <div class="stat"><div class="v">${s.lessons || 0}</div><div class="k">Lessons</div></div>
    <div class="stat"><div class="v">${s.glossary_terms || 0}</div><div class="k">Glossary terms</div></div>
    <div class="stat"><div class="v">${earned.size}</div><div class="k">Badges</div></div>
  </div>
  <div class="grid">
    <div class="card"><h2>XP over time</h2>${xpChart}</div>
    <div class="card">
      <h2>XP by skill</h2>
      <div class="hbar"><div class="lbl"><span>promptify</span><span class="val">${pXp} XP</span></div>
        <div class="track"><div class="fill amber" style="width:${pW}%"></div></div></div>
      <div class="hbar"><div class="lbl"><span>explainify</span><span class="val">${eXp} XP</span></div>
        <div class="track"><div class="fill teal" style="width:${eW}%"></div></div></div>
      <div class="hbar" style="margin-top:1.4rem"><div class="lbl"><span>Glossary growth (of 30)</span><span class="val">${s.glossary_terms || 0} terms</span></div>
        <div class="track"><div class="fill teal" style="width:${glPct}%"></div></div></div>
    </div>
    <div class="card full"><h2>Badges</h2><div class="badges">${badgeHtml}</div></div>
    <div class="card full"><h2>History</h2>
      <table><thead><tr><th>Date</th><th>Skill</th><th>Topic</th><th>Glossary</th><th>XP</th></tr></thead>
      <tbody>${rows}</tbody></table></div>
  </div>
  <footer>generated ${today} by game-render.js · +10 XP per completed lesson · anti-grind: talk earns nothing</footer>
</div>
</body>
</html>
`;
  const outPath = path.join(baseDir, 'progress.html');
  fs.writeFileSync(outPath, html);
  console.log(`rendered ${outPath} — ${hist.length} activations, ${s.xp || 0} XP, level ${level} (${cur[1]}), ${earned.size} badges`);
}

main();
