// ── recordify · sanitize.mjs — the I1 privacy gate ─────────────────────────
// Store the PATTERN + a SANITIZED GIST. Never verbatim quotes, file paths,
// project names, class/DOM identifiers, URLs, emails, IPs, or hex tokens.
//
// Two exports:
//   sanitizeNote(raw)  → sanitized gist string (transform)
//   detectLeaks(text)  → string[] of matched leak patterns ([] = clean)
// The gate: a record is refused when detectLeaks(note) is non-empty.
//
// Keep the pattern set in sync with the app audit (07-dashboard/skillmap/
// scripts/audit.ts) — verified at deploy time.

const QUOTED_SPAN = /(^|[\s(])(['"])([^'"\n]{4,})\2/g; // structural fallback
const SINGLE_Q_OPEN = /(^|[\s(])'/g;
const SINGLE_Q_CLOSE = /'(?![\w'])/g;
const DOUBLE_Q = /(^|[\s(])(")([^"\n]{4,})\2/g;
const PATH = /(?:file:\/\/[^\s"')>,]+|~\/[^\s"')>,]+|\/tmp\/[^\s"')>,]+|\/mnt\/[^\s"')>,]+|\/home\/[^\s"')>,]+|\/var\/[^\s"')>,]+|\/opt\/[^\s"')>,]+|\/usr\/[^\s"')>,]+|\/etc\/[^\s"')>,]+|(?:^|[\s(])\/(?:[A-Za-z0-9_.-]+\/)+[A-Za-z0-9_.-]+)/g;
const URL = /https?:\/\/[^\s"'<>)]+|www\.[A-Za-z0-9.-]+|(?:^|[^A-Za-z0-9])([A-Za-z0-9-]+\.(?:duckdns|github|gitlab|googleapis|gstatic|example|test)\.(?:org|com|net|io|dev|app|local))/g;
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const IP = /\b\d{1,3}(?:\.\d{1,3}){3}\b/g;
const HEX = /\b[0-9a-fA-F]{16,}\b|\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/g;

// Work identifiers that must never appear: project/repo/product names and
// code/DOM/class identifiers observed in real evidence. Add as discovered.
const IDENTIFIERS = [
  // project / repo / product names
  'shortcuts', 'shortcuts-wiki', 'alerts', 'alerts-dashboard', 'task-runner', 'dashboard-app',
  'skillify', 'skillmap', 'spectrum', 'tdarr', 'seerr', 'jellyfin', 'qbittorrent',
  'sonarr', 'radarr', 'prowlarr', 'bazarr', 'dockhand', 'uptime-kuma', 'musique',
  'bookorbit', 'shelfmark', 'zen-sso', 'zen-auth', 'duckdns', 'ntfy', 'models-store',
  'deepseek', 'qwen', 'claude', 'github', 'firefox', 'mermaid', 'bohr', 'gluetun',
  'tracearr', 'profilarr', 'port-sync', 'unpackerr', 'zen', 'opencode', 'cursor',
  // code / DOM / class identifiers seen in evidence
  'jb-row', 'sy', 'flow-cluster', 'spectrum-card', 'deriveRating', 'game-render',
  'viewBox', 'table-9', 'table-10', 'pulse-ring', 'fedge-label', 'flow-shell'
];

const IDENTIFIER_RE = new RegExp(
  '\\b(' +
    [...IDENTIFIERS]
      .sort((a, b) => b.length - a.length)
      .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|') +
    ')\\b',
  'gi'
);

// camelCase / PascalCase code symbols (e.g. spectrumCard, FlowShell) — replaced
// by a generic role word; too noisy for the hard gate, so detectLeaks relies on
// the curated list + structural patterns.
const CAMEL = /\b[a-z][A-Za-z0-9]*[A-Z][A-Za-z0-9]*\b/g;

function matchSpans(re, text) {
  re.lastIndex = 0;
  const out = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    out.push({ start: m.index, end: re.lastIndex, len: m[0].length });
    if (m[0].length === 0) re.lastIndex++;
  }
  return out;
}

/** Return every leak pattern matched in `text` (empty array = clean). */
export function detectLeaks(text) {
  if (typeof text !== 'string' || text.length === 0) return [];
  const hits = [];
  const collect = (re, label) => {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      hits.push(`${label}: ${m[0].slice(0, 60)}`);
      if (m[0].length === 0) re.lastIndex++;
    }
  };
  // quoted spans: single-quoted spans may contain contractions ('it's …'), so
  // pair openings (quote after start/space/paren) with closings (quote before
  // a boundary).
  const singles = matchSpans(SINGLE_Q_OPEN, text);
  const singleCloses = matchSpans(SINGLE_Q_CLOSE, text);
  let k = 0;
  for (const o of singles) {
    while (k < singleCloses.length && singleCloses[k].start <= o.start) k++;
    if (k >= singleCloses.length) break;
    const c = singleCloses[k++];
    const quoteStart = o.start + (o.len > 1 ? 1 : 0);
    const inner = text.slice(quoteStart + 1, c.start);
    if (inner.length >= 4) {
      hits.push(`verbatim-quote: ${text.slice(quoteStart, c.start + 1).slice(0, 60)}`);
    }
  }
  collect(DOUBLE_Q, 'verbatim-quote');
  collect(PATH, 'path');
  collect(URL, 'url');
  collect(EMAIL, 'email');
  collect(IP, 'ip');
  collect(HEX, 'hex-token');
  collect(IDENTIFIER_RE, 'identifier');
  return hits;
}

/** Replace quoted spans (by char range) with their inner text (sanitized later). */
function stripQuotedSpans(s) {
  // double quotes first (safe: no apostrophe ambiguity)
  s = s.replace(DOUBLE_Q, (m, pre, q, inner) => (pre === '(' ? '(' : ' ') + inner.trim());
  // single quotes: pair openings/closings, strip spans >= 4 chars
  const singles = matchSpans(SINGLE_Q_OPEN, s).map((o) => ({
    quoteStart: o.start + (o.len > 1 ? 1 : 0),
    prefixChar: o.len > 1 ? s[o.start] : null,
    ...o
  }));
  const closes = matchSpans(SINGLE_Q_CLOSE, s);
  let k = 0;
  const spans = [];
  for (const o of singles) {
    while (k < closes.length && closes[k].start <= o.start) k++;
    if (k >= closes.length) break;
    const c = closes[k++];
    if (c.start - o.quoteStart >= 4) {
      spans.push({
        quoteStart: o.quoteStart,
        closeStart: c.start,
        prefixChar: o.prefixChar
      });
    }
  }
  if (spans.length === 0) return s;
  let out = '';
  let pos = 0;
  for (const sp of spans) {
    out += s.slice(pos, sp.quoteStart - (sp.prefixChar ? 1 : 0));
    out += sp.prefixChar ? sp.prefixChar : '';
    out += s.slice(sp.quoteStart + 1, sp.closeStart).trim();
    pos = sp.closeStart + 1;
  }
  return out + s.slice(pos);
}

/** Strip quoted spans, paths, URLs, emails, IPs, hex, and known identifiers. */
export function sanitizeNote(raw) {
  if (typeof raw !== 'string') return '';
  let s = raw;
  s = stripQuotedSpans(s);
  s = s.replace(PATH, 'a path');
  s = s.replace(URL, 'a link');
  s = s.replace(EMAIL, 'an email');
  s = s.replace(IP, 'an address');
  s = s.replace(HEX, 'a token');
  s = s.replace(IDENTIFIER_RE, '[name]');
  s = s.replace(CAMEL, '[symbol]');
  s = s.replace(/\s+/g, ' ').trim();
  s = s.replace(/\s*[;:,]\s*$/g, '');
  return s;
}

export const PATTERNS = { QUOTED_SPAN, PATH, URL, EMAIL, IP, HEX, IDENTIFIERS };

export default { sanitizeNote, detectLeaks, PATTERNS };
