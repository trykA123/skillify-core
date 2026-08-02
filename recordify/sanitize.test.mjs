// ── recordify · sanitize.test.mjs — adversarial I1 test suite ───────────────
// Run: bun test recordify/sanitize.test.mjs  (or bun test from repo root)
import { test, expect } from 'bun:test';
import { sanitizeNote, detectLeaks } from './sanitize.mjs';

const CLEAN = (s) => {
  expect(detectLeaks(s), `expected clean: ${s}`).toEqual([]);
};

// ── detectLeaks: the hard gate ───────────────────────────────────────────────
test('flags verbatim quoted spans', () => {
  expect(detectLeaks("Round 1: 'the spectrum div is too short' — intent in one")).not.toEqual([]);
  expect(detectLeaks('said "it feels way too powerful" about the theme')).not.toEqual([]);
});
test('flags single+double quotes after whitespace or open paren', () => {
  expect(detectLeaks("( 'keep the mermaid concept, but from zero' )")).not.toEqual([]);
  expect(detectLeaks('Prompt: "no three.js, flat HTML only"')).not.toEqual([]);
});
test('flags file paths', () => {
  expect(detectLeaks('screenshots at /tmp/pi-clipboard-12345.png')).not.toEqual([]);
  expect(detectLeaks('artifact file:///mnt/Sabrent/homelab/TrueHL/foo.md')).not.toEqual([]);
  expect(detectLeaks('read ~/.agents/learnings/progress.json first')).not.toEqual([]);
});
test('flags URLs, emails, IPs, hex tokens', () => {
  expect(detectLeaks('the doc at https://example.com/spec')).not.toEqual([]);
  expect(detectLeaks('reach me at user@example.org today')).not.toEqual([]);
  expect(detectLeaks('the host 192.168.1.50 responded')).not.toEqual([]);
  expect(detectLeaks('token 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08')).not.toEqual([]);
});
test('flags project/class identifiers from real evidence', () => {
  expect(detectLeaks('the div class jb-row under sy in spectrum-card')).not.toEqual([]);
  expect(detectLeaks('we rebuilt the shortcuts app')).not.toEqual([]);
  expect(detectLeaks('alerts-dashboard v1.0.25 ships today')).not.toEqual([]);
  expect(detectLeaks('after the orchestrator finishes the alerts app, please rebuild')).not.toEqual([]);
  expect(detectLeaks('deepseek official api pricing')).not.toEqual([]);
  expect(detectLeaks('read models-store.json to pin the mapping')).not.toEqual([]);
  expect(detectLeaks('rendered with mermaid, opened in firefox')).not.toEqual([]);
});
test('passes clean sanitized gists (zero leaks)', () => {
  CLEAN('Stated the problem in the opening sentence — intent led the ask');
  CLEAN('Constraint named before the agent started guessing');
  CLEAN('Feedback scored and ordered, critical first — what wins was stated');
  CLEAN('Used the lite path where full ceremony would not have earned its keep');
  CLEAN('Named the referent with a key-line — the metaphor became a mnemonic');
  CLEAN('Challenged the cost model with my own bill and demanded reconciliation');
  CLEAN('Traced the code path before asking — the gap was answered by reading');
  CLEAN('Asked for a diagram only when chat reached its limit');
});
test('does not false-positive on apostrophes inside words', () => {
  CLEAN("Don't re-ask the same question — fold the context in");
  CLEAN("The agent's mental model was wrong by about ten times");
  CLEAN("I don't buy those two concepts — they read as similar");
});
test('allowlisted short borderline quote passes', () => {
  CLEAN('the "why" matters more than the what-again');
});

// ── sanitizeNote: the transform ──────────────────────────────────────────────
test('strips quoted spans, keeps the lesson gist', () => {
  const out = sanitizeNote("Round 1: 'the spectrum div inside this div spectrum-card it's too short height wise' — intent in sentence one");
  expect(out).toBe('Round 1: the [name] div inside this div [name] it\'s too short height wise — intent in sentence one');
  expect(detectLeaks(out)).toEqual([]);
  const out2 = sanitizeNote('the div class jb-row under sy — DOM-level specificity');
  expect(detectLeaks(out2)).toEqual([]);
  expect(out2).not.toMatch(/jb-row|sy/);
});
test('removes paths, urls, emails', () => {
  const out = sanitizeNote('screenshots at /tmp/pi-clipboard-*.png, doc at https://example.com/x, mail a@b.co');
  expect(detectLeaks(out)).toEqual([]);
  expect(out).not.toMatch(/\/tmp|example\.com|a@b/);
});
test('removes project names and camelCase symbols', () => {
  const out = sanitizeNote('read models-store.json and check what deepseek shows; spectrumCard layout');
  expect(detectLeaks(out)).toEqual([]);
  expect(out).not.toMatch(/models-store|deepseek|spectrumCard/);
});
test('normalizes whitespace and trims trailing punctuation', () => {
  expect(sanitizeNote('  a   gist   ; ')).toBe('a gist');
});
test('empty/null input yields empty output', () => {
  expect(sanitizeNote(null)).toBe('');
  expect(sanitizeNote('')).toBe('');
});
