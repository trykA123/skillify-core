# Case 01 — The alerts dashboard rebuild

**Status:** ✅ complete · **Fleet:** 16 agents (9 worker, 7 reviewer) · **Result:** 8 commits, app v1.0.10 → v1.0.18

## Context

A SvelteKit dashboard that started as a scripts-alerts app had outgrown its purpose: it was now a media + scripts dashboard with "too many places to check." The owner decided on a full frontend rebuild: keep the zen/sumi-e aesthetic and all backend contracts, rebuild the UX/UI from scratch. Mobile-first, desktop second. Topbar-first navigation (explicitly no bottom tab bar).

## The run

One orchestrator ("boss") executed a pre-made Worker Packet: 7 slices (design foundations → shell → three "rooms" → command palette → cleanup), each verified with type-check + build before the next. Worker ↔ reviewer per slice, up to 3 repair rounds.

```
planner (parent, @xhigh)  →  Worker Packet (contract)
boss (orchestrator) ──► worker × 9 ──► reviewer × 7  (one writer at a time)
                        └── escalations to parent: 3 rulings
```

## Key moments

1. **The protocol conflict.** Slice 0's acceptance criteria ("type-check must pass") collided with the do-not-touch rule on the backend layer (which carried 21 pre-existing type errors). The orchestrator escalated instead of guessing; the parent ruled: per-slice acceptance = zero *new* errors, baseline documented. Error count 21 → 7 over the run.
2. **The silent job drop (MAJOR).** A reviewer caught that the jobs wall followed a date-range parameter and *silently dropped jobs with no runs in the window*. A bug a human would have found weeks later. One repair round, resolved.
3. **The white-chart catch.** The orchestrator found a pre-existing color-conversion defect (charts never actually read theme colors — they'd rendered with defaults in the old app too). Its proposed one-character fix would have parsed percent-form lightness *without scaling* — every chart would have rendered white. The parent verified the math, corrected the spec (percent → fraction scaling), and authorized the minimal fix. Charts now read theme tokens and re-color on theme change.
4. **Governance self-corrections.** A reviewer once applied its own one-line fix — the orchestrator locked reviewers to read-only thereafter. A commit-policy slip (one slice committed without authorization) was caught by the parent and re-steered.
5. **The false-premise escalation.** The orchestrator escalated "unauthorized commits + invented version bumps" — wrong on both counts (the parent had made the commits; the version bumps were the repo's pre-existing commit hook). The parent proved it from git history and corrected the record. The right behavior was still the escalation, not silent acceptance.

## Verification

- Type-check: 21 errors / 31 warnings (baseline) → **7 errors / 0 warnings** (remaining 7 = the documented pre-existing backend baseline, untouched by design)
- Build: passes end-to-end
- Token-only rule: zero hardcoded color literals in all new UI code
- Not runtime-verified by the fleet: browser-level behaviors (polling, pull-to-refresh, live workers, theme transitions) — flagged for a human dev-server pass

## Lessons

- A packet with checkable acceptance criteria survives 7 slices without contract revision.
- Reviews that verify *structure* miss *behavior* — chart/color verification must run the real parser against real tokens (runtime, not structural).
- Escalation on a false premise is still correct behavior; the parent's job is to verify, not to assume the premise.
- One writer per tree, reviewers read-only, commits per verifiable unit — the discipline is the product.

## Artifacts

- 8 atomic commits (one per slice + the color fix), each a passing build, each carrying a version bump via the repo's commit hook
- Deleted: dead components, absorbed stats route (redirect preserved)
- New: 8 UI primitives, three-room information architecture
