// ── recordify · audit-records.mjs — the shared I1 audit runner ──────────────
// ONE script, run identically in three places so the gate is the same
// everywhere (spec §2.3): the recordify local flow, CI (.github/workflows/
// records-gate.yml), and the homeserver re-audit on pull (the actual ingest
// gate — a read-only deploy key cannot see CI status).
//
//   bun recordify/audit-records.mjs [records-dir]     (default: records)
//
// Per records/*.md:
//   1. scanRecord(md) — the shared I1 leak gate (verbatim speech, quotes,
//      paths, urls, emails, ips, hex, identifiers).
//   2. Schema check (regex on the frontmatter; no gray-matter): required
//      id|date|skill|competencies_touched|evidence; id matches
//      sess-YYYY-MM-DD-<slug>; date matches YYYY-MM-DD; skill ∈
//      {promptify, explainify, pipeline} (mirrors the map app's schema.ts);
//      every evidence entry has competency ∈ P1..P7|U1..U4|W1..W3 and
//      valence ∈ {positive, negative}.
//   3. Filename must equal <id>.md.
//   4. Cross-file duplicate-id check (the multi-machine collision guard).
//
// Exit 0 with `clean: N records` when clean; exit 1 with the full findings
// report otherwise. Missing/empty records dir FAILS CLOSED (a gate that
// passes on nothing is a broken gate). Bun, zero npm deps, deterministic
// (sorted file order, stable finding order). No writes, no network.

import fs from 'node:fs';
import path from 'node:path';
import { scanRecord } from './sanitize.mjs';

const KNOWN_SKILLS = new Set(['promptify', 'explainify', 'pipeline']);
const ID_RE = /^sess-\d{4}-\d{2}-\d{2}-[a-z0-9-]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const COMPETENCY_RE = /^(P[1-7]|U[1-4]|W[1-3])$/;
const REQUIRED_KEYS = ['id', 'date', 'skill', 'competencies_touched', 'evidence'];

function parseFrontmatter(md) {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/);
  return m ? m[1] : null;
}

function hasTopKey(front, key) {
  return new RegExp('^' + key + ':', 'm').test(front);
}

function topValue(front, key) {
  const m = front.match(new RegExp('^' + key + ':[ \\t]*(.*)$', 'm'));
  return m ? m[1].trim() : null;
}

/** Split the frontmatter's `evidence:` block into per-entry text blobs.
 * Entries start at a `- ` dash line; indented continuation lines belong to
 * the current entry; the next unindented top-level key ends the block. */
function evidenceEntries(front) {
  const lines = front.split(/\r?\n/);
  const start = lines.findIndex((l) => /^evidence:/.test(l));
  if (start === -1) return [];
  const entries = [];
  let current = null;
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i];
    if (/^[A-Za-z_][A-Za-z0-9_]*:/.test(l)) break; // next top-level key
    const dash = l.match(/^\s*-\s(.*)$/);
    if (dash) {
      if (current) entries.push(current);
      current = [dash[1]];
      continue;
    }
    if (current && /^\s+\S/.test(l)) current.push(l.trim());
  }
  if (current) entries.push(current);
  return entries.map((ls) => ls.join('\n'));
}

/** Audit every *.md record in `dir`. Returns { ok, count, findings }. */
export function runAudit(dir) {
  let names = [];
  try {
    names = fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith('.md'))
      .map((e) => e.name)
      .sort();
  } catch {
    names = [];
  }
  if (names.length === 0) {
    return { ok: false, count: 0, findings: [`audit: no records found in ${dir}`] };
  }

  const findings = [];
  const seenIds = new Map(); // id -> first file that carried it
  for (const name of names) {
    const md = fs.readFileSync(path.join(dir, name), 'utf8');

    // 1. I1 leak gate (shared with the capture-time gate)
    for (const hit of scanRecord(md)) findings.push(`${name}: ${hit}`);

    // 2. schema
    const front = parseFrontmatter(md);
    if (front === null) {
      findings.push(`${name}: schema: missing frontmatter block`);
    } else {
      for (const key of REQUIRED_KEYS) {
        if (!hasTopKey(front, key)) findings.push(`${name}: schema: missing required key '${key}'`);
      }
      const id = topValue(front, 'id');
      if (id !== null && !ID_RE.test(id)) {
        findings.push(`${name}: schema: id '${id}' does not match sess-YYYY-MM-DD-<slug>`);
      }
      const date = topValue(front, 'date');
      if (date !== null && !DATE_RE.test(date)) {
        findings.push(`${name}: schema: date '${date}' does not match YYYY-MM-DD`);
      }
      const skill = topValue(front, 'skill');
      if (skill !== null && !KNOWN_SKILLS.has(skill)) {
        findings.push(`${name}: schema: skill '${skill}' not in {promptify, explainify, pipeline}`);
      }
      if (hasTopKey(front, 'evidence')) {
        evidenceEntries(front).forEach((entry, i) => {
          const comp = entry.match(/(?:^|\n)competency:\s*(\S+)/);
          if (!comp) findings.push(`${name}: schema: evidence entry ${i + 1} missing competency`);
          else if (!COMPETENCY_RE.test(comp[1])) {
            findings.push(`${name}: schema: evidence entry ${i + 1} bad competency '${comp[1]}'`);
          }
          const val = entry.match(/(?:^|\n)valence:\s*(\S+)/);
          if (!val) findings.push(`${name}: schema: evidence entry ${i + 1} missing valence`);
          else if (val[1] !== 'positive' && val[1] !== 'negative') {
            findings.push(`${name}: schema: evidence entry ${i + 1} bad valence '${val[1]}'`);
          }
        });
      }
      // 3. filename must equal <id>.md
      const stem = name.replace(/\.md$/, '');
      if (id !== null && stem !== id) {
        findings.push(`${name}: schema: filename stem '${stem}' != id '${id}'`);
      }
      // 4. duplicate-id guard (collected below, keyed here)
      if (id !== null) {
        if (seenIds.has(id)) {
          findings.push(`duplicate id: '${id}' in ${seenIds.get(id)}, ${name}`);
        } else {
          seenIds.set(id, name);
        }
      }
    }
  }

  return { ok: findings.length === 0, count: names.length, findings };
}

if (import.meta.main) {
  const dir = process.argv[2] || 'records';
  const { ok, count, findings } = runAudit(dir);
  if (ok) {
    console.log(`clean: ${count} records`);
    process.exit(0);
  }
  for (const f of findings) console.log(f);
  console.log(`audit: FAILED (${findings.length} finding${findings.length === 1 ? '' : 's'}) in ${dir}`);
  process.exit(1);
}
