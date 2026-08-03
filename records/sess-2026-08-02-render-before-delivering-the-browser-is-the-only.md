---
id: sess-2026-08-02-render-before-delivering-the-browser-is-the-only
date: 2026-08-02
skill: promptify
competencies_touched: [P7]
outcome: completed
artifact: null
evidence:
  - competency: P7
    note: "Shipped a layout that only existed in the head — the reviewer became the render loop"
    valence: negative
  - competency: P7
    note: "Rendered before delivering — a screenshot at two sizes caught what the code could not"
    valence: positive
---
# Render before delivering — the browser is the only truth

## What happened
Designing a layout by reasoning about it in the head, then shipping it unreviewed, turned the reviewer into the render loop. The fix: render before delivering — screenshot at two window sizes and look before shipping.

## What worked
- Render before delivering — screenshot at two sizes, then ship

## What didn't
- Shipped layouts that only existed in the head — clipped labels and collisions only visible in a render
