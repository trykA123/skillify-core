# Family Structure -- skillify-core folder taxonomy (2026-08-03)

Status: DESIGN (Phase A). Execution PARKED Phase B (moves audit-owned
skillify files: install.sh + all skill dirs). Canonical authority: the
ADDENDUM in /tmp/split-pipeline-design.md (owner-approved family layout)
plus the verified current tree.

## 1. The owner-approved families

```
skillify-core/   (private repo; local path unchanged /mnt/Sabrent/homelab/skillify)
  entry/          the entry points -- standalone, start anywhere
    orientify/
    explorify/
    traceify/
  pipeline/       the build pipeline
    undumbify/
    shapeify/
    shipify/
    reviewify/
  teaching/       the teaching cluster -- about you, not the work
    promptify/
    explainify/
    recordify/    (owner-CONFIRMED part of teaching: the capture step)
  records/        stays records/ (owner ratified; no separate repo, no rename)
  agents/  docs/  plans/  game-layer.md  game-render.js  usage-stats.mjs
  install.sh  README.md  .gitignore  .github/  Makefile  public-overlay/
```

## 2. researchify -- OPEN DECISION (gap found in the locked board)

The locked family layout lists 10 skills; the repo has 11 (researchify
exists, 7.4K SKILL.md, tracked). The board does not place it.

- Recommended default: `entry/researchify` -- research/evidence gathering is
  a standalone start-anywhere activity (like orientify: map before acting;
  researchify: evidence before deciding) and the docs site groups it with
  the entry cluster today.
- Alternative: `pipeline/researchify` -- research feeds shaping and
  reviewify's evidence checks.
- researchify is PRIVATE (NOT in the public set of 7) and stays in
  skillify-core either way.
- Escalation: this is a naming/placement decision not ratified by the
  owner; the RELEASE-PACKET treats it as a pre-execution owner question with
  the default above.

## 3. install.sh nested-lookup fix (DESIGN -- install.sh is audit-owned)

Current install.sh (verified verbatim, 153 lines): flat layout assumption --
`SKILLS=(orientify explorify undumbify shapeify shipify reviewify traceify
promptify explainify recordify researchify)` and `src="$REPO_DIR/$skill"`
(plus the same `target_dir/$skill` uninstall path). After the family
refactor, `$REPO_DIR/$skill` no longer exists.

Required design (not applied here):

1. Keep the SKILLS array name-based (public contract: install by skill
   name, family-agnostic).
2. Replace the flat `src="$REPO_DIR/$skill"` with a find-based locator:
   ```bash
   find_skill() {
     local name="$1"
     find "$REPO_DIR/entry" "$REPO_DIR/pipeline" "$REPO_DIR/teaching" \
          -maxdepth 2 -type d -name "$name" -print -quit 2>/dev/null
   }
   ```
   (or an explicit family map `declare -A SKILL_FAMILY=( [orientify]=entry
   [explorify]=entry ... )` -- the map is faster and makes the taxonomy
   visible; find is more robust to future moves. Pick the map; it fails
   loudly on an unknown skill name instead of silently skipping.)
3. Use the SAME locator in uninstall (iterate SKILLS, resolve path, rm).
4. The destination naming stays `<harness-dir>/<skill>` (harness type=dir,
   skill-name/SKILL.md) -- the family nesting is repo-internal and must NOT
   leak into harness paths (no `entry/orientify` in ~/.claude/skills).
5. `--harness`/`--project`/`--copy`/`--uninstall` semantics unchanged.
6. Verification: from a fresh clone, `./install.sh --harness claude` in a
   scratch $HOME creates exactly the skill links; `--uninstall` removes all;
   no dangling links (acceptance A3 in the split design).

## 4. Public repo mirrors the nesting (owner default)

- Public `skillify/` uses the same family dirs: `entry/orientify`,
  `entry/explorify`, `entry/traceify`, `pipeline/{undumbify,shapeify,
  shipify,reviewify}` (7 skills). publish-manifest maps private nested
  paths -> public nested paths; diff -r acceptance covers it.
- The docs site's skills tab already groups by FAM -- no content change
  needed; invoke paths stay `/skill-name` (unchanged).
- Sequencing: this refactor is the FIRST slice of the split execution,
  BEFORE the first publish.sh run (so the first public commit already has
  the nested structure, ADDENDUM item 4).

## 5. Records pipeline touches

- recordify lives at teaching/recordify (owner-confirmed). Its gate commands
  and seed.mjs run "from the skillify repo root" -- audit-records.mjs and
  the CI step must resolve paths repo-root-relative (unchanged by nesting:
  `bun recordify/audit-records.mjs records/` still works from the root).
- records/ stays at the repo root (owner ratified) -- NOT under teaching/.

## 6. Execution status

PARKED (Phase B). Gates: owner review (researchify placement) + split
sequencing (refactor first, publish second). Blockers: install.sh +
README + docs are audit-owned/in-flight (one writer per tree) -> executes
post-audit. Rollback: `git mv` back per family; install.sh reverted to the
flat locator. Verification: fresh-clone install/uninstall (exactly the
installed set, no dangling links), `make check` green, privacy scan 0.
