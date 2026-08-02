# Case 06 — The skill map build

**Status:** ✅ complete · **Fleet:** 11 delegations + 3 resumes + 2 steers (planner @ xhigh, oracle, 3 workers, 2 reviewers, fix workers) · **Result:** the "map of the brain" built and deployed behind zenauth

## The build

The roadmap battleplan executed end-to-end: SvelteKit + bun:sqlite app (generic nodes/edges/evidence schema — I4), d3-force layout in a worker + Canvas 2D renderer behind a swappable interface (I5/I6), four-lens competency studios, session records, glossary + search/focus, keyboard path. The oracle's decision-consistency check caught a gitignore negation that would have re-committed the derived db — fixed before it mattered.

## The I1 saga (the run's defining battle)

The S2 privacy review found **real verbatim speech in the stored records** — and the parent's own mid-round pushes had swept the raw records to the private remote. The repo was verified private (404 unauthenticated), fix-forward ruled, and the gate was rebuilt stronger: frontmatter-aware `scanRecord` + a **verbatim-speech leak class** (27 flags, 0 false hits on curated content) + paraphrase-first sanitization. The regenerated records re-landed with **gate=0, parent probe zero**. The gate caught its own breach before deployment — I1 worked.

## The conformance

recordify became the 10th skill: install.sh (10), README, game-layer Records section, and the docs skills tab — 10th flow node at x:1000,y:350 with handoff edges, router chip, teach cluster, violet accents, **"ten ways to think"**. Byte-identity of the other panes preserved.

## The deploy

Docker image `localhost/skillmap:v1.0.0` on proxy-network, Caddy subdomain, zen-sso allowlist. Direct port 200; subdomain 302 → zen-auth (SSO gate). `/api/graph`: **24 nodes (14 hubs + 10 sessions) · 54 edges · fullness 71%** — P2/P7 mastered, exactly matching the game layer.

## Lessons

- The privacy gate is only as good as its ability to fail loudly — it failed, we fixed the gate, not the records.
- An oracle consulted before the build caught a gitignore landmine the planner missed.
- Deploying behind the homelab edge (zenauth) is the pattern; "auth beyond the edge" stays out of scope.

## Artifacts

- App at `07-dashboard/skillmap/`, recordify at `skillify/recordify/`, deployed v1.0.1, compose + zen_apps registered
