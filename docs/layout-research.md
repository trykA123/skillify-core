# Research: SVG container layout — full-container usage with zero node/label overlaps

## Problem statement
A self-contained static SVG flow diagram (viewBox 1380×420, no build step, ~12 node cards + 1 parent box + 12 labeled quadratic-Bézier edges) needs deterministic positions that use the whole container and guarantee no node-vs-node, node-vs-label, or label-vs-label overlap while keeping the parent → conductor → pipeline hierarchy readable.

## Research notes (all five families covered, ranked below)

### 1. Force-directed: d3-force (Fruchterman–Reingold style)
- d3-force v3 is deterministic out of the box: the default random source is a **fixed-seed linear congruential generator** (`simulation.randomSource`), and PR #175 made forceCollide's jiggle reproducible — same inputs → same positions every load. Initial NaN positions are seeded in a deterministic phyllotaxis arrangement. [d3-force/simulation](https://d3js.org/d3-force/simulation), [PR #175](https://github.com/d3/d3-force/pull/175)
- Static layout without animation: `simulation.stop()` + `simulation.tick(300)` computes the full layout synchronously (default decay ≈ 300 iterations). [d3-force/simulation](https://d3js.org/d3-force/simulation)
- Stock `forceCollide` treats nodes as **circles**; rectangles need a ~30-line custom quadtree collide or d3-bboxCollide. [issue #38](https://github.com/d3/d3-force/issues/38), [d3-bboxCollide](https://github.com/emeeks/d3-bboxcollide)
- Nodes can be pinned with `fx`/`fy` — the anchor-constraint trick for the parent box and hierarchy rows. [d3-force/simulation](https://d3js.org/d3-force/simulation)
- Effort: ~80–120 lines vanilla JS; one CDN script (~8 KB min for d3-force alone). [d3-force](https://d3js.org/d3-force)

### 2. Layered/DAG: Sugiyama, dagre, elkjs
- dagre (Sugiyama) is a pure, deterministic function (~96 KB min / 29 KB gz) and preserves rank hierarchy by construction — but it provides ranks only: no edge-label placement or label-space reservation (that is a separate pass), and it lays out to content size, not to the container (you fit/scale afterwards). [DepScope size](https://depscope.dev/pkg/npm/@dagrejs/dagre), [Svelte Flow layouting overview](https://svelteflow.dev/learn/layouting/overview)
- elkjs (ELK layered) is the full engine: 5-phase Sugiyama (cycle breaking → layer assignment → crossing minimization → node placement → edge routing) that folds edge labels in as layering "dummy nodes" — but it is ~1.3 MB minified per the maintainers; overkill for 13 nodes. [ELK layered blog](https://eclipse.dev/elk/blog/posts/2025/25-08-21-layered.html), [elkjs issue #6](https://github.com/OpenKieler/elkjs/issues/6)
- Effort: dagre ~30 lines + a label pass; elkjs ~40 lines but a heavy download/parse for a no-build page.

### 3. Simulated annealing / spring embedders
- Davidson–Harel SA encodes aesthetics (node distance, border, edge length/crossings, node-edge distance) as weighted cost terms; the border term makes full-container usage natural. [DH paper](https://doi.org/10.1145/234535.234538), [igraph layout_with_dh](https://r.igraph.org/reference/layout_with_dh.html)
- Same physics family as d3-force, but you write the whole engine (~150–250 lines) for no advantage at n=13; SA is also used as a force-layout pre-processing step for crossing reduction, which is not this problem. [SA preprocessing paper](https://dl.acm.org/doi/10.1145/2908961.2931660)

### 4. Constraint-based: Cassowary/Kiwi
- Kiwi (@lume/kiwi, TS) is a fast incremental linear-constraint solver; non-overlap becomes separation constraints (xᵢ + w ≤ xⱼ) — but you must generate *which* pairs to separate yourself: the standard recipe is Dwyer et al.'s O(n log n) sweep constraint-generation followed by a Cassowary solve ("fast node overlap removal"). [lume/kiwi](https://github.com/lume/kiwi), [Fast Node Overlap Removal](https://doi.org/10.1007/11618058_15)
- Elegant for hard guarantees and exact anchoring, but it is a second algorithm layered on a layout; overkill at n=13.

### 5. Label placement literature (the label-vs-node pain specifically)
- Point-feature label placement (PFLP) and edge label placement (ELP) are NP-hard; practice relies on heuristics. [GD Handbook: Labeling Algorithms](https://cs.brown.edu/people/rtamassi/gdhandbook/chapters/labeling.pdf)
- Christensen, Marks & Shieber empirically compared greedy, gradient descent, simulated annealing, and genetic algorithms for label placement; the non-greedy heuristics win on label count at higher compute cost. [TOG 1995](https://www.eecs.harvard.edu/~shieber/Biblio/Papers/tog-final.pdf)
- Practical recipe for 12 curved-edge labels: 3–4 candidate positions along the Bézier (t ≈ 0.3 / 0.5 / 0.7), greedy pick that intersects no node box and no other label, then a final pairwise overlap sweep. Alternative: make labels collidable particles (option 1 below), which unifies the problem.

## Ranked options

| # | option | what it is | effort (vanilla JS) | determinism | fit for this case | verdict |
|---|---|---|---|---|---|---|
| 1 | d3-force v3 + rectCollide + anchor rows | Fruchterman–Reingold-style physics: custom rectangle collide over nodes AND labels, forceX/forceY row anchors, pinned parent (`fx`/`fy`), container clamp force | ~100 lines + one ~8 KB min CDN script | Yes — default fixed-seed LCG; identical positions every load | Excellent: overlap, full-container usage, and hierarchy anchors solved by one mechanism; converges in <300 synchronous ticks for 13 bodies | **Recommended** |
| 2 | dagre layered + container fit + greedy label pass | Sugiyama ranks (parent → conductor → pipeline by construction), then space/scale to fill 1380×420, then place labels at Bézier midpoints with overlap rejection | ~60–80 lines + one ~29 KB gz script | Yes — pure deterministic function | Good: clean guaranteed node separation; but container fill and ALL label handling are post-passes you write | Good fallback; more separate pieces |
| 3 | Cassowary/Kiwi or hand-rolled SA | Exact linear-constraint solve (separation constraints) or weighted-cost annealing with an overlap penalty | ~150–250 lines + solver script | Yes, with seeded RNG | Hard guarantees, but you still author constraint/candidate generation yourself; heavyweight for n=13 | Overkill here; its "anchor" idea is absorbed into option 1 |

(elkjs: same Sugiyama family as #2 but ~1.3 MB minified; its built-in edge-label support does not justify the weight for 13 nodes on a no-build page.)

## Recommendation
Use **d3-force v3 via one CDN `<script>`** with a custom rectangle collide (~30 lines: quadtree + axis-separated push-out), a boundary/clamp force to fill 1380×420, and the anchor trick: pin the parent box with `fx`/`fy`, give each rank (conductor, pipeline) a `forceY` target row, and add the 12 edge labels as zero-mass particles anchored near each Bézier midpoint with their own collide boxes — so node-vs-node, node-vs-label, and label-vs-label non-overlap are all handled by the same collision force. Determinism is free: v3's default random source is a fixed-seed LCG, so `simulation.stop(); simulation.tick(300)` yields identical positions every load (seed it explicitly via `randomSource` if you want a different but still fixed arrangement). If the CDN is unacceptable, the same ~100-line recipe is easy to hand-roll with a seeded PRNG — which also covers the "tiny custom algorithm" option the owner prefers.

## Sources
- d3-force simulation docs (https://d3js.org/d3-force/simulation) — fixed-seed LCG default, stop/tick static layout, fx/fy pinning, phyllotaxis init.
- d3-force PR #175 (https://github.com/d3/d3-force/pull/175) — deterministic collide: jiggle uses the seeded random source (fixes issue #121).
- d3-force issue #38 (https://github.com/d3/d3-force/issues/38) — forceCollide is circle-only; rectangle collision is a custom force (see also https://github.com/emeeks/d3-bboxcollide).
- Svelte Flow layouting overview (https://svelteflow.dev/learn/layouting/overview) — dagre vs d3-force vs elkjs capability/size comparison.
- ELK layered blog (https://eclipse.dev/elk/blog/posts/2025/25-08-21-layered.html) + elkjs issue #6 (https://github.com/OpenKieler/elkjs/issues/6) — Sugiyama phases, edge labels as layering dummy nodes, ~1.3 MB minified.
- Christensen, Marks & Shieber, TOG 1995 (https://www.eecs.harvard.edu/~shieber/Biblio/Papers/tog-final.pdf) + GD Handbook labeling chapter (https://cs.brown.edu/people/rtamassi/gdhandbook/chapters/labeling.pdf) — label placement heuristics; ELP NP-hard.
