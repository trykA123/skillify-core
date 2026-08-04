---
id: lib-2026-08-04-render-before-delivering
date: 2026-08-04
valence: positive
category: prompting
status: seed
evidence:
  - learnings (render-before-you-deliver) — paraphrased
summary: Render before delivering.
tags: prompting, render, screenshot, visual-verification
superseded_by: null
---

# Render before delivering

**Principle:** Render before delivering.

**Why:** Every failure in the session — clipped labels, an auto-opened drawer covering the flow, tooltip contrast, colliding symbol labels — was something a screenshot would have caught in one look. The fix is to render headless at two window sizes, screenshot, look, then ship. Nothing opens by default; labels are guests; text stays inside its own box; a theme change alters paper and ink, never identity; small text is a design decision.

**When to apply:** any UI delivery where the artifact can be rendered and looked at.

**When not to:** backend-only changes where rendering adds nothing.
