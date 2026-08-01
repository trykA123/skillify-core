# Simple HTML wiring page

A knowledge page with a wiring diagram as a single-file page. Inline CSS + inline SVG only — no CDN, no JS.

## Skeleton

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><module> — wiring</title>
<style>
  /* system font stack; light background, dark ink, teal accent;
     max-width ~48rem; the diagram gets the full width */
</style>
</head>
<body>
  <header>
    <p class="meta"><date> · explainify lesson</p>
    <h1><module> — how it's wired</h1>
  </header>
  <main>
    <section><h2>What it does</h2><p>2–3 sentences, plain language</p></section>
    <section class="diagram">
      <h2>The wiring</h2>
      <svg viewBox="0 0 800 400" role="img" aria-label="<one-line description>">
        <!-- one box per module (real names), arrows labeled with the
             communication (call / event / data), traced path highlighted -->
      </svg>
      <p class="caption"><the path, in words, with real line references></p>
    </section>
    <section><h2>Key symbols</h2><ul>…</ul></section>
    <section><h2>Gotchas</h2><ul>…</ul></section>
  </main>
  <footer><a href="../../progress.html">progress →</a></footer>
</body>
</html>
```

## Diagram rules

- Boxes: rounded rects, module names in the box, one accent (teal) + grays
- Arrows: labeled with what flows (call / event / data / config)
- The traced path is the highlighted (accent-colored) arrow — one path, not the whole graph
- Real names only — the diagram must be greppable against the code
