# Case 09 — The librarian

**Status:** ✅ complete · **Fleet:** 4 agents flew (planner + oracle at qwen3.8-max-preview/xhigh, worker in three slices, reviewer) · **Result:** the 12th skill + the fleet's memory, fully conformed

## The design

The fleet forgets — every run rediscovers what a previous run already learned, or repeats a mistake that already cost a repair loop. Run 09 built the fix: **the librarian** — a new fleet agent, write-only compiler of institutional memory + bounded-recall server — with its skill **librify** (the 12th, in a new family: `memory`) and its library **Shoin** (書院 — the study where documents are shelved and consulted).

The schema carries valence from day one: frontmatter `id · date · valence (positive|negative) · category · status (seed→accepted→superseded) · evidence · summary`, body **principle/failure-mode · why · when-to-apply · when-not-to**. Positives are patterns that worked; negatives are evidence-linked post-mortems — "we tried this, it failed, don't repeat" — never vibes. The index is one greppable line per entry; the I1 gate applies (sanitize on entry, gate=0 before `accepted`).

The v1 catalog maps the existing corpus to **22 entries — 17 positive + 5 negative**: the 8 field reports, 7 research briefs, the promptify/explainify learnings (paraphrased and sanitized on entry), the audit's 99%-list, and 4 post-mortem negatives. Five anti-loop guardrails underpin the library: lookup-only access · evidence-linked doctrine · the garden state machine · principles + failure modes, not recipes · write-only librarian / read-only agents. context-builder cooperates with librify only as a bounded lookup — top-k (≤5) summaries, flagged library-derived, supersession respected; the librarian never writes into another agent's context.

## The build

The planner designed at qwen3.8-max-preview/xhigh. The oracle (same model, same thinking) verified the design against the owner's three locked answers + the five guardrails + I1 + the house skill format and returned **approve-with-conditions** — with a geometry catch that changed the map. The worker executed the conformance in three slices (small files → docs/index.html → this field report), self-verifying each. The reviewer re-ran the audits.

## The catch

The designer's second flow-map edge — researchify → librify, labeled "briefs" — failed the coordinate audit: a vertical edge's label would land at (590,312), exactly on researchify's opaque rect bottom edge (y 250+62). House precedent ruled — vertical edges stay unlabeled (the explainify → recordify precedent, CONFORMANCE-report.md:74). The planned label "harvest" also duplicated the existing shipify → promptify label, so the surviving edge reads **"shelve"**. The audit gained a fifth check — label-vs-node clearance — because the original four would have passed the occluded label.

## The conformance

librify landed at **(x:520, y:350)** — directly under researchify with a 38px gap — with two dashed handoff edges: recordify → librify ("shelve") and researchify → librify (unlabeled, vertical). Card-catalog rose `#c9707e`/`#90404e` — AA in both themes. ROUTES chips: "check the library" · "what did we learn about X". The d-no counters became a creation timeline: **1st skill created → 12th skill created** — ordinal + skill name on hover, plus a timeline strip in the skills masthead.

Every piece of data about skills and agents was updated: fleet-config (+ agents/librarian.md + the fleet table row), install.sh SKILLS 11→12 + SKILL_FAMILY[librify]=memory, README "Twelve interlocking skills" + catalog row, docs/index.html counters eleven→twelve / eight runs→nine runs, board 9/9/0. game-layer.md records the boundary: librify is fleet-internal memory — not a game skill.

## Verification

node --check both inline JS blocks ✓ · bash -n install.sh ✓ · JSON.parse fleet-config ✓ · counter sweep (twelve/nine at every live site; the historical strings inside the case-08/case-05 objects untouched) ✓ · byte-identity of agents/ledger panes (zero hunks in the protected zones) ✓ · flow-map coordinate audit — five checks: disjoint rects, new labels ≥54px from all existing labels, curves sampled at 200 t-steps, label midpoint rule, label-vs-node clearance ✓ · secrets scan clean ✓ · d-no ordinal mapping 1..12 present ✓

## Lessons

- Vertical edges can't carry labels — the label math lands them on the opaque node edge, so the coordinate audit needs label-vs-node clearance as a distinct check. House precedent is the spec.
- A bounded lookup (top-k ≤5, flagged, supersession-respected) is what keeps a memory system from becoming a loop. The library is a reference shelf, not a brain.
- Negatives earn their shelf space — we learn from failures at least as often as from wins: evidence-linked post-mortems, stated as bluntly as the wins.

## Artifacts

- Design commit `537ec05` — plans/2026-08-03-librarian-design.md (oracle conditions folded in)
- memory/librify/SKILL.md · agents/librarian.md · agents/fleet-config.json (librarian entry) · install.sh · README.md · docs/index.html (12th skill) · game-layer.md (boundary note)
