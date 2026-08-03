# Split Design -- skillify -> skillify-core (private) + public skillify (2026-08-03)

Status: DESIGN (Phase A). Execution is PARKED Phase B (moves audit-owned
skillify files: install.sh, usage-stats.mjs, recordify/*, game-render.js).
Canonical authority: /tmp/split-pipeline-design.md (Sections 1.1-1.6, 2,
ADDENDUM, OWNER DECISIONS) -- read in full; this file is the executable
condensation plus the deltas the ADDENDUM added.

## 1. The decision

- Private repo: the existing skillify (GitHub rename to `skillify-core`,
  visibility -> private; local path stays `/mnt/Sabrent/homelab/skillify`).
- Public repo: NEW `skillify` (fresh, history-isolated). `npx skills add
  trykA123/skillify` keeps working.
- Local public checkout: `/mnt/Sabrent/homelab/skillify-public`.
- Public set = EXACTLY 7 skills: orientify, explorify, undumbify, shapeify,
  shipify, reviewify, traceify (grep-verified zero private references).
- Private forever: promptify, explainify, recordify, researchify (teaching +
  research = personal), game-layer.md, game-render.js, usage-stats.mjs,
  agents/, docs/cases/, docs/html/, records/, recordify/seed.mjs + local
  curation files, install.sh private variant.

## 2. publish.sh + overlay design (Section 1.4)

Private repo is the single source of truth; publishing is an explicit,
owner-triggered act (skills change rarely; no CI auto-mirror -- a privacy bug
must never auto-push).

```
skillify/  (private = skillify-core)
  public-overlay/
    README.md          # public variant (see public-readme plan)
    install.sh         # SKILLS=(7), family-aware (see family-structure plan)
    .gitignore         # public variant
    docs/index.html    # REBUILT derivative (inline content: deleting tabs is not enough)
    LICENSE            # MIT (new)
  publish-manifest.txt # verbatim-copy paths, private path -> public path:
                       #   entry/orientify/SKILL.md -> entry/orientify/SKILL.md
                       #   entry/explorify/SKILL.md -> entry/explorify/SKILL.md
                       #   entry/traceify/SKILL.md -> entry/traceify/SKILL.md
                       #   pipeline/undumbify/SKILL.md -> pipeline/undumbify/SKILL.md
                       #   ... (all 7, nested structure mirrored per ADDENDUM)
  publish.sh           # see below
```

publish.sh behavior:
1. Require a clean private worktree (`git status --porcelain` empty); record
   `SHA=$(git rev-parse HEAD)`.
2. Fresh-clone (or fetch) the public repo to ../skillify-public.
3. rsync the manifest paths + copy public-overlay/* over the checkout.
4. PRIVACY SCAN on the staged tree (Section 1.6 forbidden-token regex) --
   must return 0 matches or abort. Also `bash -n install.sh`.
5. Commit `sync from skillify-core @ <short-sha>` and push (single squash
   commit; history isolation).
6. Verify: `diff -r` staged tree vs public checkout is empty.

## 3. History isolation + the hard privacy line (Section 1.6)

- Public history is FRESH: file-copies only. Never subtree push, never fork,
  never branch-push. Every public commit is a squash `sync from
  skillify-core @ <sha>` (verify with `git merge-base` across the two repos
  FAILING).
- Forbidden-token regex (the publish privacy scan, must return 0):
  `promptify|explainify|game-layer|game-render|progress\.json|progress\.html|RATINGS-|SKILLMAP|fleet-config|recordify-curation|work-identifiers|seed\.mjs|\.agents/learnings|/mnt/|TrueHL|skillmap|seed-watch|tdarr|homelab`
  (`trykA123` is allowed -- already a public handle). work-identifiers is
  DROPPED (owner decision #4) but the token stays in the regex as a
  belt-and-braces guard.
- R1 (HIGH, verify first): the current GitHub visibility of
  trykA123/skillify is unknown from the repo. Step 0 of execution is
  confirming visibility; if it was public, decide with the owner whether the
  already-public history needs scrubbing (BFG) before the rename.

## 4. Naming/migration sequence (Section 1.5; do in one sitting)

1. GitHub: rename `skillify` -> `skillify-core`, set private (keeps history
   + redirect).
2. Local: `git remote set-url origin git@github.com:trykA123/skillify-core.git`;
   verify `git pull`.
3. GitHub: create new EMPTY public repo `skillify`; clone to
   ../skillify-public.
4. Run first `./publish.sh` (public history = one clean commit).
5. Audit settings: skillify-core Private confirmed; no forks of the old
   repo; `npx skills add trykA123/skillify` works against the new public
   repo. (Between steps 1 and 4 the install command is broken -- do it in
   one sitting.)

## 5. Records pipeline (Section 2 -- condensation)

- Local gate: recordify sanitize refuses dirty records (write-once,
  `sess-<date>-<slug>.md`).
- CI: records-gate.yml (see records-gate plan) = bun test sanitizer +
  `bun recordify/audit-records.mjs records/` + ntfy on failure.
- Homeserver: 10-min systemd pull (ff-only) + RE-AUDIT with the same script
  (read-only deploy key cannot see CI status; a leak can never be ingested)
  -> kokoro boot compile (RECORDS_DIR ro bind mount).
- ntfy: YES (owner ratified), folded into the daily 08:00 digest + --urgent
  path; 15-min storm guard on the instant path (notification model).
- audit-records.mjs + records/ land from the concurrent recordify build
  (R4) -- workflow activation gated on that.

## 6. Execution status

PARKED (Phase B). Gates: owner review + R1 visibility check + audit-records
landed + family-structure refactor first (so the first public publish
already has nested paths, ADDENDUM item 4). Rollback: GitHub renames are
reversible; local remotes trivially revert; publish.sh history can be reset
on the public repo (fresh repo, no consumers yet). Verification: A1 (privacy
scan 0 + bash -n + diff -r empty), A2 (merge-base fails), A3 (fresh public
clone installs exactly 7 skills; --uninstall clean), A4/A5 (records e2e),
A7 (multi-machine merge), A8 (timer hygiene) per the canonical spec.
