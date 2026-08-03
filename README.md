# skillify

Eleven interlocking skills for AI-assisted work. Harness-agnostic — works with Qwen Code,
Claude Code, Cursor, OpenCode, Codex, Windsurf, or any agent that reads markdown.

## What's Inside

- **Eleven skills** — `orientify`, `explorify`, `undumbify`, `shapeify`, `shipify`,
  `reviewify`, `traceify`, `promptify`, `explainify`, `recordify`, `researchify`. Each folder holds one `SKILL.md` — the skills ARE the prompts. Catalog below.
- **The fleet** — [`agents/`](agents/README.md): orchestrator + 9 builtin snapshots + `fleet-config.json`. No credentials.
- **Docs** — [`docs/index.html`](docs/index.html) (skill map) + [`docs/html/`](docs/html/) — 17 standalone HTML artifacts.

## The Skills
| Skill | Cognitive mode | Trigger |
|-------|---------------|---------|
| `orientify` | Cartographic — map an unknown codebase before acting | "I just landed in this repo" |
| `explorify` | Divergent — generate radically different options | "I don't know what I want yet" |
| `undumbify` | Convergent — extract intent from ambiguity | "I have a direction but it's vague" |
| `shapeify` | Structural — decompose into executable slices | "Plan this" |
| `shipify` | Disciplined — execute with adaptive validation | "Build this" |
| `reviewify` | Critical — judge against intent, not taste | "Review this" |
| `traceify` | Abductive — infer cause from symptoms | "Something broke" |
| `promptify` | Coaching — teach prompt craft from your real conversations | "Debrief that" |
| `explainify` | Teaching — explain code and its wiring at your level | "What does this do?" |
| `recordify` | Recording — capture a sanitized session record | "Record this session" |
| `researchify` | Investigative — gather and vet evidence from the web and given documents | "Research this" |

They chain: `orientify → explorify → undumbify → shapeify → shipify → reviewify`
(map → diverge → converge → plan → build → judge). `traceify` is the debug entry;
`researchify` gathers the evidence on demand; `promptify` + `explainify` harvest into the game layer; `recordify` writes the sanitized session records that feed the skill map. Ceremony scales with the work — every skill has a lite path; "just do it" overrides.

## Install
### Option 1: `npx skills` (recommended, uses symlinks by default)
```bash
# Global install (all detected agents)
npx skills add trykA123/skillify -g

# Target specific agents
npx skills add trykA123/skillify -g -a claude-code -a cursor

# Copy instead of symlink
npx skills add trykA123/skillify -g --copy
```

### Option 2: Manual symlinks via install script
```bash
git clone git@github.com:trykA123/skillify.git ~/path/to/skillify
cd ~/path/to/skillify

# Auto-detect harnesses, symlink globally
./install.sh

# Target specific harnesses
./install.sh --harness qwen,claude,cursor

# Project-local instead of global
./install.sh --project

# Copy instead of symlink (for systems without symlink support)
./install.sh --copy

# Remove
./install.sh --uninstall
```

`install.sh` supports Qwen Code, Claude Code, Cursor, OpenCode, Codex, Windsurf, and
GitHub Copilot. The `npx skills` CLI supports even more — check `npx skills add --help`.

### Option 3: Reference directly in rules/system prompt
```markdown
<!-- In CLAUDE.md, .cursorrules, AGENTS.md, QWEN.md, etc. -->
When planning implementation, follow: /path/to/skillify/shapeify/SKILL.md
When debugging, follow: /path/to/skillify/traceify/SKILL.md
```

## The Game Layer
- **Spec:** [`game-layer.md`](game-layer.md) — single source of truth for both teaching skills.
- **Runtime data:** `~/.agents/learnings/progress.json` — lives outside this repo.
- **Session records:** `recordify` writes sanitized session records (git-native, the skill-map app's source of truth) at commit/push or an explicit "done".
- **Dashboard:** [`docs/html/progress.html`](docs/html/progress.html) — a render, never hand-edited.
```bash
node game-render.js                     # default: reads ~/.agents/learnings/progress.json
node game-render.js path/to/progress.json  # or point at any progress file
```

## The Fleet — `agents/`
The pi-subagents fleet, versioned for reproducibility: a custom `orchestrator` + 9 builtin
snapshots from the `pi-subagents` npm package + `fleet-config.json` (model/thinking/skill
overrides). Full table, roles, fallback models: [agents/README.md](agents/README.md).

## The Docs Site — `docs/`
- [`docs/index.html`](docs/index.html) — skill map: the cognitive pipeline as spec-sheet dossiers, 20px base / 1.250 (major third) type scale.
- [`docs/html/`](docs/html/) — 17 tracked HTML artifacts: 16 `RATINGS-*.html` design
  iterations + `progress.html`, the practice record rendered by `game-render.js`.

## Repo Structure
```
skillify/
├── README.md
├── game-layer.md          # spec shared by promptify + explainify
├── game-render.js         # renders progress.json → progress.html
├── install.sh             # symlink skills into AI harnesses
├── agents/                # fleet — see agents/README.md
├── docs/                  # skill map + html/ artifacts
├── orientify/  explorify/  undumbify/  shapeify/  shipify/
└── reviewify/  traceify/  promptify/  explainify/  recordify/  researchify/
```

## No Secrets
No credentials — no API keys, tokens, or auth URLs. Runtime secrets live in `~/.pi/agent/auth.json`, `~/.agents/`, and the homelab `.env` — never in committed files.

## Design Principles
- **Constraints over solutions** — extract WHY, not HOW
- **Anti-examples are high-signal** — "NOT like X" eliminates more than "like Y" generates
- **Priority ordering resolves conflicts silently** — no asking when things clash
- **Living documents** — plans amend in place, no full regeneration

## License
MIT
