# Skillify

Portable, harness-neutral contracts for AI-assisted work: twelve skills and ten
agent roles. The skills define methods and handoffs; runtimes map them to their own
tools and models.

## Skills

| Family | Skills |
|---|---|
| Entry | `audify`, `orientify`, `researchify`, `traceify` |
| Pipeline | `undumbify`, `shapeify`, `shipify`, `reviewify` |
| Teaching | `promptify`, `explainify`, `recordify` |
| Memory | `librify` |

The normal delivery path is `orientify → undumbify → shapeify → shipify → reviewify`.
The other skills are independent entry points or opt-in side paths.

## Agents

The portable fleet lives in [`agents/`](agents/). [`agents/manifest.json`](agents/manifest.json)
declares each role's skills, capabilities, mutability, and aliases. Roles contain no
vendor-specific model names, tool names, credentials, or runtime configuration.

## Install

Clone the repository, then run the installer:

```bash
git clone https://github.com/trykA123/skillify-core.git
cd skillify-core

# Auto-detect known harnesses
./install.sh

# Select harnesses explicitly
./install.sh --harness qwen,claude,codex

# Install into a project-local .agents/skills directory
./install.sh --project --harness universal

# Install the portable agent fleet as well
./install.sh --project --harness universal --with-agents

# Use any harness directory, or copy instead of symlinking
./install.sh --target /path/to/harness/skills
./install.sh --copy --target /path/to/harness/skills
```

Use `./install.sh --list` to see known harness presets. Symlinks are the default, so
pulling a new Skillify revision updates installed skills automatically. Use
`--uninstall` to remove managed installations; unrecognized destinations are never
removed unless `--force` is supplied.

## Supporting files

Each skill keeps its own templates, seed profiles, and small runtime helpers beside
its `SKILL.md`. Runtime learning data, records, libraries, and durable artifacts stay
outside this repository.

The root [`index.html`](index.html) is a standalone GitHub Pages presentation of the
skills and agent fleet.

## License

MIT
