# Simple HTML lesson page

A lesson as a single-file page. Inline CSS only — no CDN, no JS, no frameworks. One diagram max.

## Skeleton

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><lesson title></title>
<style>
  /* system font stack; light background, dark ink, one accent color;
     generous whitespace; max-width ~42rem for the prose column */
</style>
</head>
<body>
  <header>
    <p class="meta"><date> · promptify lesson</p>
    <h1><lesson title></h1>
  </header>
  <main>
    <section><h2>The pattern</h2><blockquote><their real words></blockquote></section>
    <section><h2>What it costs / earns</h2></section>
    <section><h2>The fix</h2><pre><before → after></pre></section>
    <section><h2>Try it</h2></section>
  </main>
  <footer><a href="../../progress.html">progress →</a></footer>
</body>
</html>
```

## Rules

- One accent color (amber for promptify, teal for explainify) — ink stays near-black
- `blockquote` for the user's real words — the lesson is built on them
- `pre` for before/after diffs — the fix must be copy-pasteable
- Link back to the dashboard (`../../progress.html`) — the game is one journey
- Prints well — someone should be able to pin it to a wall
