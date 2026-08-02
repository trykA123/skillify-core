# Case 05 — The polish round

**Status:** ✅ complete · **Fleet:** 4 spawns (planner @ qwen-xhigh, worker, read-only reviewer, repair) · **Result:** 9 commits, v1.0.25 → v1.0.34 (+ preemptive pass → v1.0.35)

## The findings (owner's post-deploy review — all eight)

1. **Charts belong in stats** — tdarr gain + estate charts moved to a new `/stats?tab=media` (jobs|media tabs); operational tdarr stays in the media room. Single source, zero duplication.
2. **Enso figure too big** — onto the 1.25 scale with a hard cap (was 0.34× ring size; now clamp with a 16px floor after the preemptive pass).
3. **Gain chart readability** — TB ticks, dated tooltips with exact values, slim legend, monotone curves, token-gradient fill.
4. **Mobile pagination** — viewport-aware `?limit=6` on mobile, desktop sizes kept; bounded rosters documented as exempt.
5. **Chip centering** — seed-watch chips vertically centered (multi-line holds chip fixed).
6. **DayLine redesign** — "day ruler": shape-coded marks, time axis, batch band, now-needle with UTC label, quieter.
7. **Scripts page too long** — tabs: wall / reliability / consistency (was "streak"; renamed in the taste pass).
8. **Background art** — quieter: two-wash ink, smaller still enso, halved grain, opacity-only breathe.

## The preemptive pass (the parent gate in action)

After the fleet shipped, the strongest model (qwen xhigh) reviewed the diff **in the owner's place** against the taste checklist — and found what the owner would have found:

- **Chashi contrast failures** — the new DayLine axis/labels/tooltips measured 2.7–3.3:1 on tea paper; the chashi text tokens were darkened to pass AA everywhere.
- **Off-scale rem values** — five new font sizes missed the 1.25 scale; all snapped.
- **SSR first-paint flicker** — mobile loaded the desktop row count then jumped; fixed with first-paint CSS (6 rows hidden beyond) + `replaceState` syncs (no history pollution).
- **Estate chart honesty** — sibling chart still showed raw floats ("10234.5673 GB") in default tooltips; got TB ticks + themed dated tooltips + 2dp.
- **Enso numeral still a wall** — 27px at real ring sizes, clipping past 1 TB; re-capped at 0.18× with a 16px floor (the owner's "~16px?" ask).
- Plus: /media → stats pointer, job-detail page clamp, dead class removed, legends (GB)→(TB).

All fixed preemptively in one commit (`77e9a7e`, v1.0.35) — the owner never saw the violations.

## Verification

- `bun run check`: 7 baseline errors throughout, zero new · `bun run build`: passes every slice
- Taste-pass re-check: zero px, zero off-scale, zero hardcoded colors, chashi AA on all new text surfaces

## Lessons

- A review that measures (computed contrast, measured font sizes) beats a review that eyeballs.
- The parent gate exists because the fleet ships what the contract says — the owner reviews what the *taste* says.
- One commit of preemptive fixes is cheaper than one round of owner complaints.

## Artifacts

- 9 commits (`5e7cba3` → `d53382e`) + taste pass (`77e9a7e`), deployed v1.0.35
