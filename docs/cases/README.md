# Case Studies for Agent Workflows

Curated, de-identified records of real orchestrator runs. These feed the docs site's tab titled **"Case studies for agent workflows"** (no other name) and serve as the fleet's institutional memory.

## The workflows

| # | Workflow | Status |
|---|----------|--------|
| 01 | [The alerts dashboard rebuild](01-alerts-rebuild.md) | ✅ complete |
| 02 | [The torrent seed-watch watcher](02-seed-watch.md) | ✅ complete |
| 03 | [The agents tab build](03-agents-tab.md) | 🔄 in progress |
| 04 | [The feature round](04-feature-round.md) | ✅ complete |
| 05 | [The polish round](05-polish-round.md) | ✅ complete |
| 06 | [The skill map build](06-skill-map.md) | ✅ complete |
| 07 | [The charts reinvention](07-charts-reinvention.md) | ✅ complete — researcher's debut |
| 08 | [The researchify skill](08-researchify.md) | ✅ complete |

Process lessons that are not full workflows (e.g. the [README reconcile](03-readme-reconcile.md)) stay on record as side notes, not as numbered workflows.

## Scrubbing policy (mandatory)

Every case is de-identified before publication:

- **No secrets, ever** — no API keys, tokens, passwords, credentials, or auth-bearing URLs. Credential mechanisms are described generically ("credentials passed via environment").
- **No environment variable names** — infrastructure specifics (tokens, API keys, webhook secrets) are referred to generically.
- **No personal data** — no names, emails, or personally identifying URLs (public endpoints are genericized, e.g. "the homelab's public dashboard URL").
- **Genericize, don't omit** — replace specifics with placeholders like `<public-url>`, `<downloads-mount>`, `<media-mount>` when the shape matters to the story.
- Model names, tool names (qBittorrent, tdarr, sonarr), commit hashes, and version numbers are **not** sensitive — keep them.
- When in doubt: genericize. If a detail can't be genericized without losing the lesson, drop the detail, keep the lesson.
