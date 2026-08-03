#!/usr/bin/env bun
// usage-stats.ts — the fleet ledger: agent-usage analytics for the skillify docs site.
// Reads every session log under ~/.pi/agent/sessions (each *.jsonl file = one run),
// counts subagent spawns per agent, and renders:
//   docs/html/usage.json  — the raw aggregate (for reuse)
//   docs/html/usage.html  — a standalone page in the docs design language
// Private tooling like game-render.ts: plain bun/node, zero npm runtime deps, idempotent.
// Counting convention (stated on the page): a "call" = one subagent spawn
// (a toolCall record with name:"subagent" whose arguments carry an agent and no action).
// Usage: bun usage-stats.ts [path/to/sessions-root]
import fs from 'node:fs';
import type { Dirent } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/* ── session-record shape (one JSON line inside a run's *.jsonl) ── */
interface ToolCallItem {
  type?: string;
  name?: string;
  arguments?: { agent?: string; action?: string };
}

interface SessionLogRecord {
  type?: string;
  customType?: string;
  timestamp?: string;
  message?: { content?: ToolCallItem[] };
}

interface Spawn { agent: string; ts: number | null; }
interface Mgmt { action: string; agent: string | null; }
interface Run {
  file: string;
  records: number;
  spawns: Spawn[];
  mgmt: Mgmt[];
  escalations: number;
  minTs: number | null;
  maxTs: number | null;
  ordinal?: number;
}

/* ── the aggregate shape (docs/html/usage.json; renderHtml renders from it) ── */
interface AgentRow { name: string; calls: number; share: string; trend: string | null; }
interface Issue { severity: string; text: string; }
interface RunMixRow {
  label: string;
  calls: number;
  escalations: number;
  repairRounds: number;
  records: number;
  mix: Record<string, string>;
}
interface TimelinePoint { date: string; calls: number; partial: boolean; }
interface UsageAggregate {
  generatedAt: string;
  scope: string;
  counting: string;
  windowDays: number;
  trendAvailable: boolean;
  totals: { calls: number; runs: number; escalations: number; repairRounds: number; unclassified: number };
  agents: AgentRow[];
  coldSpots: { unused: string[]; underused: { name: string; calls: number; share: string }[] };
  issues: Issue[];
  runLength: { medianRecords: number; longest: { label: string; records: number } | null };
  runs: RunMixRow[];
  timeline: TimelinePoint[];
}

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT_JSON = path.join(HERE, 'docs', 'html', 'usage.json');
const OUT_HTML = path.join(HERE, 'docs', 'html', 'usage.html');
const DEFAULT_ROOT = path.join(process.env.HOME || '/home/claud', '.pi', 'agent', 'sessions');
const SESSIONS_ROOT = process.argv[2] || DEFAULT_ROOT;

// The fleet, in display order (mirrors the agents tab of docs/index.html).
const FLEET = ['orchestrator', 'scout', 'context-builder', 'planner', 'worker', 'reviewer', 'oracle', 'advisor', 'researcher', 'delegate'];

const WINDOW_DAYS = 14; // timeline span
const TREND_DAYS = 7;   // trend compares last 7d vs the 7d before that
const COLD_SHARE = 5;   // underused = share < 5% AND count <= 1
const COLD_COUNT = 1;
const CLUSTER_MIN = 2;  // repair cluster = >= 2 consecutive worker→reviewer rounds in a run
const MIX_ROWS = 25;    // per-run mix table shows the most recent 25 runs with calls
const ISSUE_CAP = 5;    // per-issue-group cap on surfaced rows (noise guard)

/* ── walking ── */
function walkJsonl(dir: string, out: string[] = []): string[] {
  let entries: Dirent[];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return out; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkJsonl(p, out);
    else if (e.name.endsWith('.jsonl')) out.push(p);
  }
  return out;
}

/* ── per-run parsing ── */
function parseRun(file: string): Run {
  const run: Run = { file, records: 0, spawns: [], mgmt: [], escalations: 0, minTs: null, maxTs: null };
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { return run; }
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    run.records++;
    let rec: SessionLogRecord;
    try { rec = JSON.parse(line) as SessionLogRecord; } catch { continue; }
    const ts = rec.timestamp ? new Date(rec.timestamp).getTime() : null;
    if (typeof ts === 'number' && Number.isFinite(ts)) {
      run.minTs = run.minTs === null ? ts : Math.min(run.minTs, ts);
      run.maxTs = run.maxTs === null ? ts : Math.max(run.maxTs, ts);
    }
    if (rec.type === 'custom_message' && rec.customType === 'subagent_supervisor_request') {
      run.escalations++; // a real supervisor escalation event
    }
    if (rec.type !== 'message' || !rec.message || !Array.isArray(rec.message.content)) continue;
    for (const item of rec.message.content) {
      if (!item || item.type !== 'toolCall' || !item.name) continue;
      const args = item.arguments || {};
      if (item.name === 'subagent') {
        if (args.agent && !args.action) run.spawns.push({ agent: args.agent, ts }); // a call = a spawn
        else if (args.action) run.mgmt.push({ action: args.action, agent: args.agent || null }); // management, not a call
      } else if (item.name === 'contact_supervisor' || item.name === 'intercom') {
        run.escalations++; // escalation via the supervisor channel
      }
    }
  }
  return run;
}

/* ── session grouping: topmost path segment under the sessions root ── */
function sessionKeyOf(file: string): string {
  const rel = path.relative(SESSIONS_ROOT, file);
  const parts = rel.split(path.sep);
  const key = parts.length >= 2 ? parts[1] : parts[0];
  return key.replace(/\.jsonl$/, '');
}

/* ── helpers ── */
const median = (xs: number[]): number => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round(((s[m - 1] + s[m]) / 2) * 10) / 10;
};
const pct = (n: number, d: number): string => (d ? ((n / d) * 100).toFixed(2) : '0.00');
const dayKey = (ts: number): string => new Date(ts).toISOString().slice(0, 10);
const esc = (s: unknown): string => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ── build the aggregate ── */
function aggregate(runs: Run[]): UsageAggregate {
  // ordinals: sessions by first activity, runs within a session by first activity
  const bySession = new Map<string, Run[]>();
  for (const r of runs) {
    const k = sessionKeyOf(r.file);
    if (!bySession.has(k)) bySession.set(k, []);
    bySession.get(k)!.push(r);
  }
  const sessionKeys = [...bySession.keys()].sort((a, b) => {
    const fa = Math.min(...bySession.get(a)!.map((r) => r.minTs ?? Infinity));
    const fb = Math.min(...bySession.get(b)!.map((r) => r.minTs ?? Infinity));
    return fa - fb;
  });
  const labelled: { label: string; run: Run }[] = []; // {label, run}
  sessionKeys.forEach((k, i) => {
    const list = [...bySession.get(k)!].sort((a, b) => (a.minTs ?? Infinity) - (b.minTs ?? Infinity));
    list.forEach((r, j) => labelled.push({ label: `session ${i + 1} · run ${j + 1}`, run: r }));
  });
  labelled.forEach(({ run }, idx) => { run.ordinal = idx + 1; });

  const now = new Date();
  const today = dayKey(now.getTime());
  const buckets = [];
  for (let d = WINDOW_DAYS - 1; d >= 0; d--) {
    const t = new Date(now.getTime() - d * 86400000);
    buckets.push({ date: dayKey(t.getTime()), partial: d === 0 });
  }
  const bucketSet = new Set(buckets.map((b) => b.date));

  // agent universe = fleet ∪ observed
  const agentSet = new Set<string>(FLEET);
  let total = 0;
  for (const { run } of labelled) for (const s of run.spawns) { agentSet.add(s.agent); total++; }
  const agents = [...agentSet];
  const callsBy: Record<string, number> = Object.fromEntries(agents.map((a) => [a, 0] as [string, number]));
  const spawnBy: Record<string, number> = Object.fromEntries(agents.map((a) => [a, 0] as [string, number])); // windowed for trend/timeline
  const timeline: Record<string, number> = Object.fromEntries(buckets.map((b) => [b.date, 0] as [string, number]));
  for (const { run } of labelled) {
    for (const s of run.spawns) {
      callsBy[s.agent] = (callsBy[s.agent] || 0) + 1;
      const k = s.ts ? dayKey(s.ts) : null;
      if (k && bucketSet.has(k)) { spawnBy[s.agent] = (spawnBy[s.agent] || 0) + 1; timeline[k]++; }
    }
  }

  // repair rounds: consecutive worker→reviewer spawns within a run
  let repairRounds = 0;
  let unclassified = 0;
  const runRows: RunMixRow[] = [];
  for (const { label, run } of labelled) {
    let rounds = 0;
    for (let i = 0; i + 1 < run.spawns.length; i++) {
      if (run.spawns[i].agent === 'worker' && run.spawns[i + 1].agent === 'reviewer') rounds++;
      else if (!run.spawns[i].agent) unclassified++;
    }
    repairRounds += rounds;
    const mix: Record<string, number> = {};
    let runCalls = 0;
    for (const s of run.spawns) { mix[s.agent] = (mix[s.agent] || 0) + 1; runCalls++; }
    if (runCalls) {
      const mixPct: Record<string, string> = {};
      for (const a of agents) mixPct[a] = pct(mix[a] || 0, runCalls);
      runRows.push({ label, calls: runCalls, escalations: run.escalations, repairRounds: rounds, records: run.records, mix: mixPct });
    }
  }
  runRows.sort((a, b) => (b.calls === a.calls ? a.label.localeCompare(b.label) : b.calls - a.calls));
  // sort most-recent-first for display: use run.ordinal desc
  const orderByOrd = new Map(labelled.map(({ label, run }) => [label, run.ordinal ?? 0] as [string, number]));
  runRows.sort((a, b) => (orderByOrd.get(b.label) || 0) - (orderByOrd.get(a.label) || 0));

  // cold spots & issues
  const coldUnused = agents.filter((a) => !callsBy[a]).sort();
  const coldUnderused = agents
    .filter((a) => callsBy[a] > 0 && Number(pct(callsBy[a], total)) < COLD_SHARE && callsBy[a] <= COLD_COUNT)
    .sort((a, b) => callsBy[a] - callsBy[b] || a.localeCompare(b));

  // trend: only when >= 14 days of data exist (span between earliest/latest record)
  const allTs = labelled.map(({ run }) => run.minTs).filter((t) => t !== null);
  const spanDays = allTs.length ? (Math.max(...allTs) - Math.min(...allTs)) / 86400000 : 0;
  const trendAvailable = spanDays >= WINDOW_DAYS - 0.5;
  let trend: Record<string, string> = {};
  if (trendAvailable) {
    // count spawns per agent inside each window, anchored on the same UTC day buckets as the timeline
    const countIn = (winDates: string[]) => {
      const c: Record<string, number> = Object.fromEntries(agents.map((a) => [a, 0] as [string, number]));
      let tot = 0;
      for (const { run } of labelled) {
        for (const s of run.spawns) {
          const k = s.ts ? dayKey(s.ts) : null;
          if (k && winDates.includes(k)) { c[s.agent]++; tot++; }
        }
      }
      return { c, tot };
    };
    const dA = buckets.slice(0, TREND_DAYS).map((b) => b.date);
    const dB = buckets.slice(TREND_DAYS, TREND_DAYS * 2).map((b) => b.date);
    const { c: cA, tot: tA } = countIn(dA);
    const { c: cB, tot: tB } = countIn(dB);
    trend = Object.fromEntries(agents.map((a) => {
      const pA = tA ? (cA[a] / tA) * 100 : 0;
      const pB = tB ? (cB[a] / tB) * 100 : 0;
      const d = pB - pA;
      return [a, d > 0.5 ? 'up' : d < -0.5 ? 'down' : 'flat'] as [string, string];
    }));
  }

  // issues — severity tagged
  const issues: Issue[] = [];
  for (const a of coldUnused) issues.push({ severity: 'high', text: `${a} — zero calls in the window` });
  for (const a of coldUnderused) issues.push({ severity: 'medium', text: `${a} — under ${COLD_SHARE}% share (${callsBy[a]} call${callsBy[a] === 1 ? '' : 's'})` });
  const escRuns = labelled.filter(({ run }) => run.escalations > 0).sort((a, b) => b.run.escalations - a.run.escalations);
  escRuns.slice(0, ISSUE_CAP).forEach(({ label, run }) =>
    issues.push({ severity: 'medium', text: `${label} — ${run.escalations} escalation${run.escalations === 1 ? '' : 's'}` }));
  if (escRuns.length > ISSUE_CAP) issues.push({ severity: 'low', text: `+${escRuns.length - ISSUE_CAP} more runs with escalations` });
  const clRuns = runRows.filter((r) => r.repairRounds >= CLUSTER_MIN).sort((a, b) => b.repairRounds - a.repairRounds);
  clRuns.slice(0, ISSUE_CAP).forEach((r) =>
    issues.push({ severity: 'medium', text: `${r.label} — ${r.repairRounds} consecutive worker→reviewer rounds (repair cluster)` }));
  if (clRuns.length > ISSUE_CAP) issues.push({ severity: 'low', text: `+${clRuns.length - ISSUE_CAP} more repair clusters` });

  // run length: median + longest
  const allRecords = labelled.map(({ run }) => run.records);
  const medRecords = median(allRecords);
  let longest: { label: string; records: number } | null = null;
  for (const { label, run } of labelled) {
    if (!longest || run.records > longest.records) longest = { label, records: run.records };
  }
  issues.push({ severity: 'low', text: `${longest!.label} — longest run, ${longest!.records} records (median ${medRecords})` });

  const escalationsTotal = labelled.reduce((a, { run }) => a + run.escalations, 0);

  const agentRows = agents.map((a) => ({
    name: a,
    calls: callsBy[a] || 0,
    share: pct(callsBy[a] || 0, total),
    trend: trend[a] || null,
  })).sort((a, b) => b.calls - a.calls || a.name.localeCompare(b.name));

  return {
    generatedAt: now.toISOString(),
    scope: 'pi agent session logs — every subagent call recorded per run',
    counting: 'call = one subagent spawn (toolCall name:"subagent" with an agent and no action)',
    windowDays: WINDOW_DAYS,
    trendAvailable,
    totals: { calls: total, runs: labelled.length, escalations: escalationsTotal, repairRounds, unclassified },
    agents: agentRows,
    coldSpots: { unused: coldUnused, underused: coldUnderused.map((a) => ({ name: a, calls: callsBy[a], share: pct(callsBy[a], total) })) },
    issues,
    runLength: { medianRecords: medRecords, longest },
    runs: runRows.map(({ label, calls, escalations, repairRounds: rr, records, mix }) => ({
      label, calls, escalations, repairRounds: rr, records, mix,
    })),
    timeline: buckets.map((b) => ({ date: b.date, calls: timeline[b.date] || 0, partial: b.partial })),
  };
}

/* ── html rendering (scoped under .ledger so it can be embedded into docs/index.html) ── */
const STYLE = `
.ledger{
  --bg:oklch(15% 0.02 260);--bg-2:oklch(18% 0.022 260);--bg-3:oklch(21% 0.024 260);
  --ink:oklch(94% 0.01 250);--ink-soft:oklch(74% 0.015 250);--ink-faint:oklch(62% 0.02 250);
  --line:oklch(94% 0.01 250 / .12);--line-strong:oklch(94% 0.01 250 / .26);
  --ag-orchestrator:#d8a24a;--ag-scout:#7ba05a;--ag-context-builder:#4aa8a0;
  --ag-planner:#5b8ab5;--ag-worker:#5a9ec5;--ag-reviewer:#b58ab0;
  --ag-oracle:#9d8ac9;--ag-advisor:#9d8ac9;--ag-researcher:#d97a4a;--ag-delegate:#8fa0b5;
  --disp:'Bricolage Grotesque',ui-sans-serif,system-ui,sans-serif;
  --body:'Source Sans 3',ui-sans-serif,system-ui,sans-serif;
  --mono:'JetBrains Mono',ui-monospace,Menlo,monospace;
  --fs-xs:.64rem;--fs-s:.8rem;--fs-0:1rem;--fs-1:1.25rem;--fs-2:1.5625rem;
  --fs-3:1.953rem;--fs-4:2.441rem;--fs-5:3.052rem;--fs-6:3.815rem;
  color-scheme:dark;background:var(--bg);color:var(--ink);
  font-family:var(--body);line-height:1.6;min-height:100vh;
}
html[data-theme="light"] .ledger{
  --bg:oklch(97% 0.006 250);--bg-2:oklch(99% 0.004 250);--bg-3:oklch(94% 0.008 250);
  --ink:oklch(20% 0.02 250);--ink-soft:oklch(42% 0.02 250);--ink-faint:oklch(46% 0.02 250);
  --line:oklch(20% 0.02 250 / .14);--line-strong:oklch(20% 0.02 250 / .3);
  --ag-orchestrator:#8a6420;--ag-scout:#55702e;--ag-context-builder:#20655e;
  --ag-planner:#37597e;--ag-worker:#2f6186;--ag-reviewer:#755170;
  --ag-oracle:#5c4a92;--ag-advisor:#5c4a92;--ag-researcher:#a34d1e;--ag-delegate:#4f5f75;
  color-scheme:light;
}
.ledger .wrap{max-width:56rem;margin:0 auto;padding:0 1.5rem}
.ledger .ltheme{position:fixed;top:1.1rem;right:1.9rem;z-index:20;font-family:var(--mono);
  font-size:var(--fs-xs);font-weight:700;letter-spacing:.1em;border:1px solid var(--line-strong);
  background:var(--bg-2);color:var(--ink-soft);padding:.5rem .85rem;border-radius:9px;cursor:pointer;
  transition:border-color .2s,color .2s}
.ledger .ltheme:hover{border-color:var(--ink-faint);color:var(--ink)}
/* embedded into docs/index.html: the site's own appearance menu owns theming */
.ledger.ledger-inline{min-height:0}
.ledger.ledger-inline .ltheme{display:none}
.ledger .masthead{display:grid;grid-template-columns:1fr auto;gap:2.5rem;align-items:end;padding:4.2rem 0 2.2rem}
.ledger .kicker{font-family:var(--mono);font-size:var(--fs-xs);letter-spacing:.34em;text-transform:uppercase;color:var(--ink-faint)}
.ledger .kicker b{color:var(--ag-orchestrator)}
.ledger h1{font-family:var(--disp);font-weight:800;letter-spacing:-.025em;line-height:.98;
  font-size:clamp(var(--fs-5),8vw,var(--fs-6));margin:.7rem 0 .9rem}
.ledger h1 .thin{font-weight:500;color:var(--ink-soft)}
.ledger .lede{font-size:var(--fs-1);color:var(--ink-soft);max-width:36rem}
.ledger .lede b{color:var(--ink)}
.ledger .mast-side{text-align:right;font-family:var(--mono);font-size:var(--fs-xs);color:var(--ink-faint);letter-spacing:.1em;line-height:2}
.ledger .mast-side b{color:var(--ink);font-size:1rem}
.ledger .panel{border:1px solid var(--line);border-radius:14px;background:var(--bg-2);
  padding:1.4rem 1.5rem;margin-bottom:1.2rem}
.ledger .flow-head{display:flex;align-items:baseline;gap:1rem;margin-bottom:1rem}
.ledger .flow-head h2{font-family:var(--mono);font-size:var(--fs-xs);font-weight:700;letter-spacing:.3em;text-transform:uppercase;color:var(--ink-soft)}
.ledger .flow-head .note{font-family:var(--mono);font-size:var(--fs-xs);color:var(--ink-faint);letter-spacing:.08em;margin-left:auto;text-align:right}
.ledger .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.2rem}
.ledger .kpi{border:1px solid var(--line);border-radius:12px;background:var(--bg-2);padding:1rem 1.2rem}
.ledger .kpi .k-lab{font-family:var(--mono);font-size:var(--fs-xs);font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:var(--ink-faint)}
.ledger .kpi .k-num{font-family:var(--disp);font-weight:800;font-size:var(--fs-3);line-height:1.15;margin-top:.3rem;color:var(--ink)}
.ledger .kpi .k-sub{font-family:var(--mono);font-size:var(--fs-xs);color:var(--ink-faint);margin-top:.2rem}
.ledger .lbar{display:grid;grid-template-columns:11rem 1fr 7rem;align-items:center;gap:1rem;padding:.5rem 0}
.ledger .lbar .lb-name{font-family:var(--mono);font-size:var(--fs-s);font-weight:700;color:var(--c,#d8a24a);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ledger .lbar .lb-track{height:1.1rem;border-radius:3px;background:var(--bg-3);border:1px solid var(--line);overflow:hidden}
.ledger .lbar .lb-fill{height:100%;border-radius:3px;background:var(--c,#d8a24a);opacity:.85;transition:opacity .2s}
.ledger .lbar:hover .lb-fill{opacity:1}
.ledger .lbar .lb-pct{font-family:var(--mono);font-size:var(--fs-s);color:var(--ink-soft);text-align:right;white-space:nowrap}
.ledger .lbar .lb-pct b{color:var(--ink);font-weight:700}
.ledger .cold-grid{display:grid;grid-template-columns:1fr 1fr;gap:1.2rem}
.ledger .cold h3{font-family:var(--mono);font-size:var(--fs-xs);font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:var(--ag-researcher);margin-bottom:.6rem}
.ledger .cold ul{list-style:none}
.ledger .cold li{font-family:var(--mono);font-size:var(--fs-s);color:var(--ink-soft);padding:.3rem 0;border-bottom:1px solid var(--line)}
.ledger .cold li:last-child{border-bottom:0}
.ledger .cold li b{color:var(--ink)}
.ledger .issue{display:flex;align-items:baseline;gap:.8rem;padding:.55rem 0;border-bottom:1px solid var(--line);font-size:var(--fs-s);color:var(--ink-soft)}
.ledger .issue:last-child{border-bottom:0}
.ledger .issue .sev{font-family:var(--mono);font-size:var(--fs-xs);font-weight:700;letter-spacing:.18em;text-transform:uppercase;padding:.15rem .6rem;border-radius:3px;border:1px solid}
.ledger .issue .sev.high{color:var(--ag-researcher);border-color:color-mix(in srgb,var(--ag-researcher) 55%,transparent)}
.ledger .issue .sev.medium{color:var(--ag-orchestrator);border-color:color-mix(in srgb,var(--ag-orchestrator) 55%,transparent)}
.ledger .issue .sev.low{color:var(--ink-faint);border-color:var(--line-strong)}
.ledger .issue b{color:var(--ink)}
.ledger .ltable{width:100%;border-collapse:collapse;font-family:var(--mono);font-size:var(--fs-xs);min-width:56rem}
.ledger .ltable th{font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-faint);
  text-align:right;padding:.45rem .5rem;border-bottom:1px solid var(--line-strong);white-space:nowrap}
.ledger .ltable th:first-child,.ledger .ltable td:first-child{text-align:left}
.ledger .ltable td{padding:.45rem .5rem;border-bottom:1px solid var(--line);color:var(--ink-soft);text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
.ledger .ltable td.rname{color:var(--ink);font-weight:700}
.ledger .ltable td .dot{display:inline-block;width:.5rem;height:.5rem;border-radius:2px;margin-right:.4rem;vertical-align:.05rem}
.ledger .ltable tbody tr:hover{background:color-mix(in srgb,var(--ink) 6%,transparent)}
.ledger .ltable tr:last-child td{border-bottom:0}
.ledger .tbl-scroll{overflow-x:auto}
.ledger .spark{display:flex;align-items:flex-end;gap:.35rem;height:7rem;padding-top:.5rem}
.ledger .spark .s-bar{flex:1;background:color-mix(in srgb,var(--ag-orchestrator) 40%,transparent);border-radius:2px 2px 0 0;position:relative;min-width:0}
.ledger .spark .s-bar.full{background:var(--ag-orchestrator)}
.ledger .spark .s-bar:hover{outline:1px solid var(--ag-orchestrator)}
.ledger .spark-labs{display:flex;gap:.35rem;font-family:var(--mono);font-size:var(--fs-xs);color:var(--ink-faint);margin-top:.35rem}
.ledger .spark-labs span{flex:1;text-align:center}
.ledger footer{margin:3.6rem 0 4rem;display:flex;align-items:center;gap:1rem;font-family:var(--mono);font-size:var(--fs-xs);color:var(--ink-faint);letter-spacing:.12em;flex-wrap:wrap}
.ledger footer .fmark{font-family:var(--disp);font-weight:800;font-size:1rem;color:var(--ink-soft)}
.ledger footer .fline{flex:1;height:1px;background:var(--line)}
@media (max-width:860px){
  .ledger .masthead{grid-template-columns:1fr}
  .ledger .mast-side{text-align:left}
  .ledger .kpis{grid-template-columns:1fr 1fr}
  .ledger .cold-grid{grid-template-columns:1fr}
  .ledger .lbar{grid-template-columns:8rem 1fr 5rem;gap:.6rem}
}
@media (prefers-reduced-motion:reduce){
  .ledger *,.ledger *::before,.ledger *::after{animation:none!important;transition:none!important}
}
`;

const STANDALONE_EXTRA = `
html{font-size:125%} /* 20px base */
body{margin:0}
`;

const SCRIPT = `
(function(){
  var btn=document.getElementById('ledger-theme');
  function label(){
    if(!btn)return;
    var light=document.documentElement.getAttribute('data-theme')==='light';
    btn.textContent=light?'☀ light':'☾ dark';
  }
  if(btn){
    btn.addEventListener('click',function(){
      var light=document.documentElement.getAttribute('data-theme')==='light';
      if(light)document.documentElement.removeAttribute('data-theme');
      else document.documentElement.setAttribute('data-theme','light');
      try{
        var t=light?'dark':'light';
        localStorage.setItem('skillify-guide-theme',t);
        localStorage.setItem('skillify-ledger-theme',t);
      }catch(e){}
      label();
    });
  }
  try{
    var saved=localStorage.getItem('skillify-guide-theme')||localStorage.getItem('skillify-ledger-theme');
    if(saved==='light')document.documentElement.setAttribute('data-theme','light');
  }catch(e){}
  label();
})();
`;

function renderHtml(j: UsageAggregate): string {
  const bars = j.agents.filter((a) => a.calls > 0).map((a, i) => {
    const w = Math.max(2, Math.round((a.calls / j.totals.calls) * 1000) / 10);
    return `<div class="lbar" style="--c:var(--ag-${a.name})">
      <div class="lb-name">${esc(a.name)}</div>
      <div class="lb-track"><div class="lb-fill" style="width:${w}%"></div></div>
      <div class="lb-pct"><b>${a.share}%</b> · ${a.calls}</div>
    </div>`;
  }).join('\n');

  const coldHtml = `<div class="cold">
      <h3>unused · zero calls</h3>
      <ul>${j.coldSpots.unused.length ? j.coldSpots.unused.map((a) => `<li>${esc(a)}</li>`).join('') : '<li>none — every agent got called</li>'}</ul>
    </div>
    <div class="cold">
      <h3>underused · under 5% share</h3>
      <ul>${j.coldSpots.underused.length ? j.coldSpots.underused.map((a) => `<li><b>${esc(a.name)}</b> · ${a.share}% · ${a.calls} call${a.calls === 1 ? '' : 's'}</li>`).join('') : '<li>none</li>'}</ul>
    </div>`;

  const sevCls: Record<string, string> = { high: 'high', medium: 'medium', low: 'low' };
  const issuesHtml = j.issues.length
    ? j.issues.map((i) => `<div class="issue"><span class="sev ${sevCls[i.severity]}">${i.severity}</span><span>${esc(i.text)}</span></div>`).join('')
    : '';

  const mixHead = `<tr><th>run</th>${j.agents.map((a) => `<th style="color:var(--ag-${a.name})">${esc(a.name)}</th>`).join('')}<th>calls</th></tr>`;
  const shownRuns = j.runs.slice(0, MIX_ROWS);
  const mixRows = shownRuns.map((r) => `<tr>
      <td class="rname">${esc(r.label)}</td>
      ${j.agents.map((a) => `<td>${r.mix[a.name]}</td>`).join('')}
      <td style="color:var(--ink)">${r.calls}</td>
    </tr>`).join('\n');

  const maxDay = Math.max(1, ...j.timeline.map((t) => t.calls));
  const sparkBars = j.timeline.map((t) => {
    const h = t.calls === 0 ? 0 : Math.max(4, Math.round((t.calls / maxDay) * 100));
    return `<div class="s-bar ${t.partial ? 'full' : ''}" style="height:${h}%" title="${t.date} · ${t.calls} call${t.calls === 1 ? '' : 's'}${t.partial ? ' · today, partial' : ''}"></div>`;
  }).join('');
  const sparkLabs = j.timeline.map((t, i) => `<span>${i % 2 === 1 ? '' : t.date.slice(5).replace('-', '/')}${t.partial ? '·' : ''}</span>`).join('');

  const trendHead = j.trendAvailable ? '<th>7d Δ</th>' : '';
  const trendCell = (a: AgentRow) => j.trendAvailable ? `<td>${a.trend === 'up' ? '↑' : a.trend === 'down' ? '↓' : '·'}</td>` : '';
  const agentRows = j.agents.map((a) => `<tr style="--c:var(--ag-${a.name})">
      <td class="rname"><span class="dot" style="background:var(--ag-${a.name})"></span>${esc(a.name)}</td>
      <td style="text-align:right">${a.calls}</td>
      <td style="text-align:right"><b style="color:var(--ag-${a.name})">${a.share}%</b></td>
      ${trendCell(a)}
    </tr>`).join('\n');

  const issuesPanel = j.issues.length ? `<div class="panel">
    <div class="flow-head"><h2>surfaced issues</h2><span class="note">severity · what to look at</span></div>
    ${issuesHtml}
  </div>` : '';

  const timelinePanel = `<div class="panel">
    <div class="flow-head"><h2>activity · last ${j.windowDays} days</h2><span class="note">UTC days · today marked, partial</span></div>
    <div class="spark">${sparkBars}</div>
    <div class="spark-labs">${sparkLabs}</div>
  </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>the fleet ledger · agent usage — skillify</title>
<meta name="description" content="skillify — the fleet ledger: which agent gets called, hotspots, cold spots, and surfaced issues.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700;12..96,800&family=Source+Sans+3:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<style>/* fleet ledger — scoped under .ledger for embedding into docs/index.html */
${STYLE}
</style>
<style>/* standalone page only */
${STANDALONE_EXTRA}
</style>
</head>
<body>
<div class="ledger">
  <button class="ltheme" id="ledger-theme" aria-label="toggle light or dark theme">☾ dark</button>
  <div class="wrap">
    <header class="masthead">
      <div>
        <div class="kicker">skillify · <b>the fleet ledger</b></div>
        <h1>The fleet,<br><span class="thin">called and counted.</span></h1>
        <p class="lede">Every subagent spawn across the fleet — <b>share of calls per agent</b>, cold spots, and issues worth surfacing. A call is one spawn; management actions (status, steer, get) are not calls.</p>
      </div>
      <div class="mast-side">
        <div><b>${j.totals.calls}</b> calls</div>
        <div><b>${j.totals.runs}</b> runs</div>
        <div><b>${j.totals.escalations}</b> escalations</div>
        <div><b>${j.totals.repairRounds}</b> repair rounds</div>
      </div>
    </header>

    <div class="kpis">
      <div class="kpi"><div class="k-lab">calls</div><div class="k-num">${j.totals.calls}</div><div class="k-sub">subagent spawns</div></div>
      <div class="kpi"><div class="k-lab">runs</div><div class="k-num">${j.totals.runs}</div><div class="k-sub">session files</div></div>
      <div class="kpi"><div class="k-lab">escalations</div><div class="k-num">${j.totals.escalations}</div><div class="k-sub">supervisor requests</div></div>
      <div class="kpi"><div class="k-lab">repair rounds</div><div class="k-num">${j.totals.repairRounds}</div><div class="k-sub">worker→reviewer</div></div>
    </div>

    <div class="panel">
      <div class="flow-head"><h2>call share · per agent</h2><span class="note">hotspot at the top · sorted by calls</span></div>
      <div style="overflow-x:auto">
        <table class="ltable">
          <thead><tr><th>agent</th><th style="text-align:right">calls</th><th style="text-align:right">share</th>${trendHead}</tr></thead>
          <tbody>${agentRows}</tbody>
        </table>
      </div>
      ${bars ? `<div style="margin-top:1rem">${bars}</div>` : ''}
    </div>

    <div class="panel">
      <div class="flow-head"><h2>cold spots</h2><span class="note">never-used · barely-used</span></div>
      <div class="cold-grid">${coldHtml}</div>
    </div>

    ${issuesPanel}

    <div class="panel">
      <div class="flow-head"><h2>per-run agent mix</h2><span class="note">row-normalized % · most recent ${shownRuns.length} of ${j.runs.length} runs with calls</span></div>
      <div class="tbl-scroll"><table class="ltable">
        <thead>${mixHead}</thead>
        <tbody>${mixRows || '<tr><td colspan="' + (j.agents.length + 2) + '">no runs with agent calls yet</td></tr>'}</tbody>
      </table></div>
    </div>

    ${timelinePanel}

    <footer>
      <span class="fmark">skillify</span>
      <span class="fline"></span>
      <span>${esc(j.scope)} · median run ${j.runLength.medianRecords} records · generated ${j.generatedAt.slice(0, 10)}</span>
    </footer>
  </div>
</div>
<script>
${SCRIPT}
</script>
</body>
</html>`;
}

/* ── main ── */
function main() {
  const files = walkJsonl(SESSIONS_ROOT);
  const runs = files.map(parseRun).filter((r) => r.records > 0 || r.spawns.length || r.escalations);
  const agg = aggregate(runs);
  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(agg, null, 2) + '\n');
  const j = JSON.parse(fs.readFileSync(OUT_JSON, 'utf8')) as UsageAggregate; // render from the JSON, not the live object
  fs.writeFileSync(OUT_HTML, renderHtml(j));
  const cold = agg.coldSpots.unused.length + agg.coldSpots.underused.length;
  console.log(`rendered ${OUT_HTML}`);
  console.log(`  ${agg.totals.runs} runs · ${agg.totals.calls} calls · ${agg.totals.escalations} escalations · ${agg.totals.repairRounds} repair rounds · ${agg.totals.unclassified} unclassified`);
  console.log(`  share: ${agg.agents.map((a) => `${a.name} ${a.share}%`).join(' · ')}`);
  console.log(`  cold spots: ${cold} (${agg.coldSpots.unused.map((a) => a).join(', ') || 'none unused'}${agg.coldSpots.underused.length ? '; underused: ' + agg.coldSpots.underused.map((a) => a.name).join(', ') : ''})`);
  console.log(`  issues: ${agg.issues.length} (${agg.issues.slice(0, 6).map((i) => `${i.severity}:${i.text}`).join(' | ')}${agg.issues.length > 6 ? ' | …' : ''})`);
  console.log(`  median run: ${agg.runLength.medianRecords} records · longest: ${agg.runLength.longest?.label} (${agg.runLength.longest?.records}) · trend available: ${agg.trendAvailable}`);
}

main();
