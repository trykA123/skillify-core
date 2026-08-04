# Case 10 — The librarian's first run

**Status:** ✅ complete · **Fleet:** planner + worker + reviewer, all on deepseek-v4-flash (the owner's directive — qwen quota exhausted, flash is the house default; no qwen overrides were attempted) · **Result:** the library's first shelf — 22 seeded entries, I1 gate clean

## The run

S1 was the owner-mandated first execution of the librarian: seed the Shoin scaffold from the design's v1 catalog plan. The library landed at the repo root — `shoin/{prompting,process,research,mistakes,patterns}/` — with the generated catalog `shoin/index.json`. Entry naming mirrors the records grammar: **lib-YYYY-MM-DD-<slug>.md**, all 22 dated 2026-08-04.

## What was saved

The first-run catalog: **22 entries = 17 positive + 5 negative**, all at `status: seed` (promotion to `accepted` is the staleness audit's job — the I1 gate is a condition, not the promotion itself).

| category | positive | negative | total |
|---|---|---|---|
| prompting | 4 | 0 | 4 |
| process | 4 | 1 | 5 |
| research | 4 | 0 | 4 |
| patterns | 5 | 0 | 5 |
| mistakes | 0 | 4 | 4 |
| **total** | **17** | **5** | **22** |

The source mapping: the 8 numbered field reports → 8 positives (one flagship lesson each) · the 7 research briefs → 3 grouped positives (decision verdicts, ecosystem facts, hardening) · the learnings → 5 positives (paraphrased, identifiers stripped) · the audit's 99%-list → 1 positive · the 4 post-mortems (push-while-red, guess-placed map nodes, hand-wired services, the hung oracle call) → 4 negatives, with the README-reconcile side note as the fifth negative.

## How it was saved

The compile ran **corpus → sanitize → frontmatter → index**:

- **Corpus** — the field reports, the research briefs, the learnings, the audit artifact, and the session-history markers for the post-mortems.
- **Sanitize** — the recordify I1 discipline: paraphrase-first, third-person, pattern-first; identifiers, private paths, and verbatim speech stripped. Every body was written against the leak classes from the start — no question marks, no first/second-person, no quoted speech, no blocklisted identifiers, evidence links in frontmatter only.
- **Frontmatter** — `id · date · valence · category · status · evidence · summary · tags · superseded_by`, with `category` equal to the entry's directory and `evidence` pointing at repo-relative field reports or the honest session-history marker.
- **Index** — `shoin/index.json`, generated after the entries were written: the O(1) lookup catalog keyed by id, carrying title, category, valence, status, evidence, and tags (plus date and summary).

## The gate

The audit harness — a shoin-shaped audit importing `scanRecord` from `teaching/recordify/sanitize.mjs`, run from `/tmp` so the repo stays free of stray files — returned **clean: 22 records, gate=0**. Leak classes scanned: verbatim speech, verbatim quotes, paths, urls, emails, ips, hex tokens, identifiers. Belt-and-suspenders greps over the whole `shoin/` tree came back zero for absolute paths, hex runs, and question marks. One finding surfaced on the first pass ("do not" in one body tripping the directive-marker class) and was fixed at the entry, then the gate went green — the gate was never weakened.

## The board

The docs site moved from nine runs to **ten runs**: 10 workflows / 10 complete / 0 in progress (major catches 5 kept). Case 09's wipnote flipped from shelves-empty-until-S1 to **S1 landed: 22 entries shelved**; the librarian's agents-tab entry flipped the same way (first seeding (S1) landed · 22 entries). `docs/cases/README.md` gained the row-10 entry. The skills-side counters ("Twelve skills") are untouched.

## Verification

gate=0 (clean: 22 records) ✓ · leak-class greps zero ✓ · `node --check` both inline scripts of docs/index.html ✓ · counter sweep (nine→ten at every live site) ✓ · index.json matches the entries (22 ids, keys aligned) ✓ · git status clean after two atomic commits ✓ · dojo delivery is push-gated: the homeserver pulls the remote via a read-only key, so the fresh content lands on the next pull tick after the parent pushes the two S1 commits ✓

## Lessons

- The library's first shelf is principles and failure modes, evidence-linked, never recipes — each entry names why and when, never step-by-step how.
- Negatives earn their shelf space — 5 of the first 22 are post-mortems, stated as bluntly as the wins.
- Seeding is a compile; promotion is an audit. Entries stay `seed` until the staleness audit moves them, no matter how green the gate.

## Artifacts

- Catalog commit `0d4df1b` — `shoin/`: 22 entries + `index.json`
- Docs commit (the commit that carries this report and the board flip — its own hash cannot be self-referenced)
- Audit harness: `/tmp/librarian-s1/audit-shoin.mjs` (not committed — the repo stays free of strays)
- Residual (informational, not fixed in S1): the `public-overlay/` and `.publish-staging/` docs copy is stale relative to the live site
