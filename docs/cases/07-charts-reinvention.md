# Case 07 — The charts reinvention

**Status:** ✅ complete · **Fleet:** 4 agents (researcher DEBUT, planner @ qwen-xhigh, worker, reviewer) · **Result:** 4 commits + annoying-pass fix, v1.0.35 → v1.0.40, deployed

## The research (the researcher's debut)

The fleet's untouched researcher flew first: ~30 sources consulted (shadcn charts, Beszel's source, Chart.js official samples, uPlot/ECharts benches, WCAG 1.4.3, Highcharts a11y, mobile-dashboard guidance), 15 dropped as fluff. Verdict: **keep chart.js 4.4.x** — ~90% of the sophistication delta is wrapper + CSS level; Recharts rejected (React-only), ECharts and uPlot rejected on bundle/feature grounds. No dependency swap → no escalation needed.

## The pattern language (what "sophisticated" means, measured)

One gradient-faded focal series per chart (others flat-alpha) · hairline-only horizontal grids · no axis borders · chip legends (8×8 rounded) · **external HTML tooltip** (date-first title, color dot, mono value, total row) · threshold lines with labels · baseline-aware per-segment coloring · empty states that look like empty charts · draw-in animation gated by `prefers-reduced-motion` · hidden secondary axis ≤480px · capped tick density · 48px touch targets.

## The new median chart

Median / Q1 / Q3 of `saved_pct` per bucket (the "-74.2%" card data), server-side, reusing already-fetched rows (zero new queries) — median line + IQR band + 50% threshold + amber-below-50 segments, y pinned 0–100, `Median: −74.2% · n=38` tooltips. Hand-verified on the live DB: 08-01 n=18 → 64.55% ✓ · 08-02 n=164 → 74.05% ✓ · year week → 73.55% ✓.

## The annoying pass

The parent gate reviewed in the owner's place and found what the owner would have found: a `#999` fallback literal in the new tooltip (token-only rule) and off-scale `0.58rem`/`0.66rem` labels in new code. Fixed preemptively, committed, deployed.

## Verification

- check: 7 baseline errors, 0 new · build green · SSR smoke 200s
- Contrast measured: torii 8.38 · washi 7.79 · chashi 4.56 (chart-ink darkened to lock the AA floor)
- 13× chart fonts at 10.24 (the 1.250 scale step) · zero color literals in chart configs after the pass

## Lessons

- The researcher's debut delivered a library verdict + a pattern catalog — research first, design second, build third.
- "Sophisticated" is a list of measurable details (tooltip anatomy, grid hairlines, gradient discipline), not a vibe.
- The annoying pass exists because the fleet ships what the contract says — the owner reviews what the taste says.

## Artifacts

- 4 commits (`5534623` → `f3a3a13`) + annoying pass (`0370d48`), deployed v1.0.40
