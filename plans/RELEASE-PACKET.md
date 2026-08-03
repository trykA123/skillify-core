# RELEASE-PACKET -- skillify split + records pipeline, execution order (2026-08-03)

Status: READY-PACKET (Phase B -- NOT executed now). Every step below is
parked behind an owner-review gate; steps that move audit-owned skillify
files (install.sh, usage-stats.mjs, recordify/*, game-render.js) execute
POST-AUDIT. Canonical spec: /tmp/split-pipeline-design.md (all sections) +
the sibling plan files in this directory.

## 0. Preconditions (all must be true)

- [ ] Concurrent recordify build landed: recordify/{audit-records.mjs,
      work-identifiers-free sanitize.mjs}, records/ dir exists with at
      least one clean record.
- [ ] R1 visibility check done (current GitHub visibility of
      trykA123/skillify confirmed; scrub decision recorded if it was
      public).
- [ ] Owner decided researchify placement (default: entry/researchify).
- [ ] Owner reviewed this packet + split-design/family-structure/
      public-readme/records-gate.
- [ ] TrueHL-side gates (naming-registry stages 0-1) are at a consistent
      commit (the skillify docs site is the "dojo"; its URL/branding change
      rides the same session).

## 1. Execution order (one sitting per stage; do NOT split stage 2)

STAGE 1 -- Family refactor (private repo, post-audit)
1. `git mv` skill dirs into entry/ + pipeline/ + teaching/ per
   family-structure.md (researchify per owner decision).
2. Rewrite install.sh with the family map / find-locator (design in
   family-structure.md section 3); keep harness paths flat by skill name.
3. Update private README structure section + Makefile if paths referenced.
4. Verify: fresh-clone install/uninstall in scratch $HOME (exactly the
   installed set, no dangling links); `make check` green.
   Rollback: `git mv` back; revert install.sh.

STAGE 2 -- GitHub split (one sitting; `npx skills add` breaks mid-stage)
5. Rename GitHub skillify -> skillify-core; set Private.
6. `git remote set-url origin git@github.com:trykA123/skillify-core.git`;
   `git pull` OK.
7. Create new empty public repo `skillify`; clone to ../skillify-public.
8. Write public-overlay/ (README, install.sh, .gitignore, docs/index.html,
   LICENSE) + publish-manifest.txt + publish.sh (split-design.md section 2).
9. First `./publish.sh`.
10. Verify A1-A3 (below). Rollback: GitHub renames reversible; local
    remotes revert; public repo resettable (no consumers yet).

STAGE 3 -- Records pipeline wiring
11. Commit records-gate.yml (already written) + any records/ seed records.
12. Confirm workflow green on the first records push (A4), then A5 (leak
    branch -> red + refusal).
13. Homeserver: deploy key (read-only), /opt/skillify-core clone,
    skillmap-ingest.sh + systemd units (host-side, TrueHL task; the
    task-runner/scripts + systemd unit files are audit-owned -> schedule
    with the audit orchestrator).
14. ntfy topic wiring: NTFY_URL secret on the repo; digest folds CI
    failures (notification model consistency).

STAGE 4 -- Docs/dojo branding (post-split, optional)
15. Public docs/index.html derivative (public-readme.md section 2); dojo
    masthead when owner ratifies.

## 2. Verification (acceptance from the canonical spec)

- A1 -- publish privacy: publish.sh dry-run staged tree; forbidden-token
  regex returns 0; `bash -n install.sh` passes; `diff -r` staged vs public
  checkout empty after push.
- A2 -- history isolation: public `git log` shows only `sync from
  skillify-core @ ...` commits; `git merge-base` across the two repos
  FAILS.
- A3 -- public install: fresh public clone, `./install.sh --harness claude`
  in scratch $HOME creates exactly 7 skill links; `--uninstall` removes
  all; no dangling links.
- A4 -- end-to-end: synthetic record sess-2100-01-01-e2e-probe.md (skill
  pipeline, clean third-person) -> CI green -> homeserver pulls, re-audit
  passes, kokoro restarts, boot log session count +1, probe on the map ->
  delete commit -> count returns.
- A5 -- leak path: throwaway branch with a synthetic work identifier +
  JIRA-style ticket id -> CI red (ticket-id class in report) -> homeserver
  pointed at that commit refuses ingest, keeps last-good map.
- A6 -- sanitizer contract: bun test green locally AND in CI (incl. the
  structural classes).
- A7 -- multi-machine merge: two clones add distinct records, push with
  pull --rebase; dup-id case fails CI as designed.
- A8 -- timer hygiene: two runs with no upstream change -> zero restarts;
  one change -> exactly one restart.

## 3. Rollback summary

- Any stage: revert the last commit (private repo) / reset the public repo
  (fresh, no consumers).
- install.sh regression: restore the flat-locator version from git.
- records leak discovered late: remediation commit (rewrite the offending
  note), homeserver never ingests (re-audit blocks), CI marks history red.

## 4. Open decisions blocking execution

1. researchify placement (default entry/researchify).
2. R1 outcome (was the repo ever public? scrub or not).
3. Dojo branding shape (docs site name only vs URL change).

## 5. Ownership map

- This run (Phase A) already delivered: split-design.md, family-structure.md,
  public-readme.md, records-gate.md, RELEASE-PACKET.md, skillify/Makefile,
  skillify/.github/workflows/records-gate.yml.
- Executes post-audit (audit-owned): install.sh, usage-stats.mjs,
  recordify/*, game-render.js edits; TrueHL task-runner/scripts + systemd
  units (homeserver stage).
- Executes by the owner: GitHub rename + new repo + secrets + R1 decision.
