// ── recordify · audit-records.test.mjs — shared audit runner suite ──────────
// Run: bun test recordify/audit-records.test.mjs  (or bun test from repo root)
//
// Every fixture below is SYNTHETIC (invented for the test) and built in a
// temp dir per test. Real session records, real user speech, and real work
// identifiers never appear here — the I1 gate's speech/identifier behavior is
// covered by sanitize.test.mjs; this suite pins the audit contract: schema
// classes, filename==id, duplicate ids, fail-closed, and leak pass-through.
import { test, expect, afterEach } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runAudit } from './audit-records.mjs';

const tmpDirs = [];
afterEach(() => {
  while (tmpDirs.length) fs.rmSync(tmpDirs.pop(), { recursive: true, force: true });
});

function fixtureDir(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'audit-records-test-'));
  tmpDirs.push(dir);
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), content);
  }
  return dir;
}

/** A clean synthetic record; every override mutates exactly one property. */
function record({
  id = 'sess-2026-08-02-sample-a',
  date = '2026-08-02',
  skill = 'promptify',
  touched = '[P1]',
  competency = 'P1',
  valence = 'positive',
  note = 'Stated the problem in the opening sentence — intent led the ask',
  evidence = true,
  body = 'A clean, third-person narrative about the pattern practiced.',
} = {}) {
  const evidenceBlock = evidence
    ? `evidence:\n  - competency: ${competency}\n    note: "${note}"\n    valence: ${valence}\n`
    : '';
  return `---
id: ${id}
date: ${date}
skill: ${skill}
competencies_touched: ${touched}
outcome: completed
artifact: null
${evidenceBlock}---
# Sample — a clean session

## What happened
${body}

## What worked
- Constraint named before the agent started guessing

## What didn't
- none recorded
`;
}

// ── clean corpus ─────────────────────────────────────────────────────────────
test('passes a clean two-record corpus', () => {
  const dir = fixtureDir({
    'sess-2026-08-02-sample-a.md': record(),
    'sess-2026-08-02-sample-b.md': record({
      id: 'sess-2026-08-02-sample-b',
      skill: 'explainify',
      touched: '[U3]',
      competency: 'U3',
      note: 'Traced the code path before asking — the gap was answered by reading',
    }),
  });
  const r = runAudit(dir);
  expect(r.ok).toBe(true);
  expect(r.count).toBe(2);
  expect(r.findings).toEqual([]);
});

test('accepts every known skill and competency family', () => {
  const dir = fixtureDir({
    'sess-2026-08-02-pipe.md': record({
      id: 'sess-2026-08-02-pipe',
      skill: 'pipeline',
      touched: '[W2]',
      competency: 'W2',
      note: 'Handoff carried the why, not just the what',
    }),
  });
  expect(runAudit(dir).ok).toBe(true);
});

// ── schema violation classes ────────────────────────────────────────────────
test('fails on a missing required key', () => {
  const dir = fixtureDir({ 'sess-2026-08-02-sample-a.md': record({ evidence: false }) });
  const r = runAudit(dir);
  expect(r.ok).toBe(false);
  expect(r.findings.some((f) => f.includes("missing required key 'evidence'"))).toBe(true);
});

test('fails on a bad id shape', () => {
  const dir = fixtureDir({
    'sess-2026-08-02-sample-a.md': record({ id: 'session-2026-08-02-Bad_ID' }),
  });
  const r = runAudit(dir);
  expect(r.ok).toBe(false);
  expect(r.findings.some((f) => f.includes('does not match sess-YYYY-MM-DD'))).toBe(true);
});

test('fails on a bad date shape', () => {
  const dir = fixtureDir({
    'sess-2026-08-02-sample-a.md': record({ date: '02/08/2026' }),
  });
  const r = runAudit(dir);
  expect(r.ok).toBe(false);
  expect(r.findings.some((f) => f.includes('date') && f.includes('YYYY-MM-DD'))).toBe(true);
});

test('fails on an unknown skill', () => {
  const dir = fixtureDir({
    'sess-2026-08-02-sample-a.md': record({ skill: 'orientify' }),
  });
  const r = runAudit(dir);
  expect(r.ok).toBe(false);
  expect(r.findings.some((f) => f.includes("skill 'orientify'"))).toBe(true);
});

test('fails on a bad evidence competency', () => {
  const dir = fixtureDir({
    'sess-2026-08-02-sample-a.md': record({ competency: 'P9' }),
  });
  const r = runAudit(dir);
  expect(r.ok).toBe(false);
  expect(r.findings.some((f) => f.includes("bad competency 'P9'"))).toBe(true);
});

test('fails on a bad evidence valence', () => {
  const dir = fixtureDir({
    'sess-2026-08-02-sample-a.md': record({ valence: 'neutral' }),
  });
  const r = runAudit(dir);
  expect(r.ok).toBe(false);
  expect(r.findings.some((f) => f.includes("bad valence 'neutral'"))).toBe(true);
});

test('fails when filename stem != id', () => {
  const dir = fixtureDir({ 'wrong-name.md': record() });
  const r = runAudit(dir);
  expect(r.ok).toBe(false);
  expect(r.findings.some((f) => f.includes("filename stem 'wrong-name'"))).toBe(true);
});

test('fails on a missing frontmatter block', () => {
  const dir = fixtureDir({
    'sess-2026-08-02-sample-a.md': '# no frontmatter here\n\nJust prose about the session.\n',
  });
  const r = runAudit(dir);
  expect(r.ok).toBe(false);
  expect(r.findings.some((f) => f.includes('missing frontmatter block'))).toBe(true);
});

// ── duplicate-id guard (multi-machine collision) ────────────────────────────
test('fails on duplicate ids across files', () => {
  const dup = 'sess-2026-08-02-dup';
  const dir = fixtureDir({
    'aaa-first.md': record({ id: dup }),
    'bbb-second.md': record({ id: dup }),
  });
  const r = runAudit(dir);
  expect(r.ok).toBe(false);
  expect(r.findings.some((f) => f.includes(`duplicate id: '${dup}' in aaa-first.md, bbb-second.md`))).toBe(true);
});

// ── I1 leak pass-through (scanRecord) ───────────────────────────────────────
test('fails on a leaking body line with the leak class in the report', () => {
  const dir = fixtureDir({
    'sess-2026-08-02-sample-a.md': record({ body: 'the config lives under /tmp/leak-check/x' }),
  });
  const r = runAudit(dir);
  expect(r.ok).toBe(false);
  expect(r.findings.some((f) => f.startsWith('sess-2026-08-02-sample-a.md: path:'))).toBe(true);
});

test('fails on a verbatim-speech note value', () => {
  const dir = fixtureDir({
    'sess-2026-08-02-sample-a.md': record({ note: 'DO NOT EDIT THIS CONFIG, just read it' }),
  });
  const r = runAudit(dir);
  expect(r.ok).toBe(false);
  expect(r.findings.some((f) => f.includes('verbatim-speech:'))).toBe(true);
});

// ── fail-closed on empty / missing dir ──────────────────────────────────────
test('fails closed on an empty records dir', () => {
  const dir = fixtureDir({});
  const r = runAudit(dir);
  expect(r.ok).toBe(false);
  expect(r.findings).toEqual([`audit: no records found in ${dir}`]);
});

test('fails closed on a missing records dir', () => {
  const r = runAudit('/tmp/audit-records-does-not-exist-xyz');
  expect(r.ok).toBe(false);
  expect(r.findings.length).toBe(1);
});

test('ignores non-.md files in the records dir', () => {
  const dir = fixtureDir({
    'sess-2026-08-02-sample-a.md': record(),
    'README.md.notes.txt': 'not a record',
  });
  const r = runAudit(dir);
  expect(r.ok).toBe(true);
  expect(r.count).toBe(1);
});
