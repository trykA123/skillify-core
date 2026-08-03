# Public README + docs restructure (2026-08-03)

Status: DESIGN (Phase A). Execution PARKED Phase B (README.md and
docs/index.html are audit-owned/in-flight). Canonical authority:
/tmp/split-pipeline-design.md Section 1.3 + R3.

## 1. Public README (public-overlay/README.md)

The public README is a VARIANT, not a filtered copy (the private README
keeps the full catalog). The public variant is the pipeline-only story:

KEEP (reworded for 7 skills):
- The "interlocking skills" intro + chain description
  (orientify -> explorify -> undumbify -> shapeify -> shipify -> reviewify).
- Install options: `npx skills add trykA123/skillify -g`, `./install.sh`,
  direct SKILL.md reference. (npx path unchanged by the split.)
- Design principles section.
- The family taxonomy (entry / pipeline) as the structure section --
  teaching is absent publicly, so the docs must not imply a gap: phrase as
  "the public pipeline" with the 7 skills listed.

DROP (privacy, section 1.6):
- Teaching-skill rows (promptify, explainify, recordify, researchify).
- The "harvest into the game layer" paragraph.
- Entire Game Layer section (game-layer.md, progress.json, game-render.js).
- Entire Fleet section (agents/, fleet-config.json).
- Entire docs/html/ section (progress.html, RATINGS-*.html, SKILLMAP.html).
- docs/cases/ references (homelab workflows, even scrubbed).
- The current "No Secrets" paragraph -- it names the homelab `.env`;
  rewrite to: no credentials, no personal data, no homelab identifiers are
  committed to this repository; the 7 skills are the entire content.
- Any homelab identifiers: hostnames, /mnt/ paths, TrueHL, skillmap,
  seed-watch, tdarr, "homelab" prose.

CHANGES:
- License section -> MIT (LICENSE ships in the overlay; the private repo
  README can keep its license note).

## 2. Public docs/index.html -- REBUILT derivative, not a filtered copy

R3 is the binding constraint: `docs/index.html` embeds ALL tabs' content
inline (cases text lives in the HTML body, not just behind a tab toggle).
Deleting the tab buttons leaks the text in view-source. Therefore the public
page is a rebuilt derivative built from the private page with the content
removed, not hidden:

- Remove the agents + cases tabs AND their inline content/CSS/JS.
- Masthead copy: "Nine ways to think" -> the 7-skill pipeline phrasing;
  drop the "2 teaching cluster" pip.
- Drop promptify/explainify dossiers and their flow-graph nodes (also
  recordify/researchify).
- Keep the skill-map graph limited to the 7 public skills, grouped by FAM
  (entry / pipeline) -- the existing fam grouping code is reused.
- Invoke paths stay `/skill-name` (unchanged).
- Dojo branding: the public docs page is the "dojo" surface (zen name on
  the naming board) -- masthead/copy may carry the dojo identity once the
  owner ratifies how it renders (docs site name, not a subdomain).

Where: `public-overlay/docs/index.html` in the private repo (like the
README, the overlay file IS the public artifact). The private `docs/`
directory keeps its own full index.html for the private docs site.

## 3. Family-mirror acceptance

The public tree after publish:

```
skillify/  (public)
  README.md  LICENSE  install.sh  .gitignore
  entry/orientify/SKILL.md  entry/explorify/SKILL.md  entry/traceify/SKILL.md
  pipeline/undumbify/SKILL.md  pipeline/shapeify/SKILL.md
  pipeline/shipify/SKILL.md  pipeline/reviewify/SKILL.md
  docs/index.html
```

Verification: `diff -r` private publish-staged tree vs public checkout
empty; privacy scan 0 matches; `./install.sh --harness claude` in a scratch
$HOME installs exactly 7 skills.

## 4. Execution status

PARKED (Phase B). Blockers: skillify README.md + docs/index.html are
audit-owned/in-flight (one writer per tree) -> post-audit, and the split
execution runs before the first publish (family refactor first). Rollback:
overlay files are private-repo content; a bad publish is fixed by editing
the overlay and re-running publish.sh (public repo is squash-commit only).
