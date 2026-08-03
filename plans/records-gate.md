# records-gate -- design twin of the workflow + notification model (2026-08-03)

Status: DESIGN (Phase A). The workflow file itself is already written at
`.github/workflows/records-gate.yml` (new, additive). This file is its
design twin: rationale, the exact content, and how it folds into the
notification model.

## 1. Purpose and placement

- Repo: skillify-core (the PRIVATE repo; locally `skillify` until the
  GitHub rename). The workflow file lives in the private repo only -- it
  never ships to the public repo.
- Trigger: every push to main (NOT path-filtered). The audit is seconds on
  dozens of files and also catches sanitizer regressions when
  recordify/** changes.
- No secrets needed beyond `NTFY_URL` (the blocklist-free design means the
  workflow runs on structural classes + committed synthetic fixtures;
  standard GITHUB_TOKEN suffices for the run itself).
- Activation gating: recordify/audit-records.mjs and records/ do not exist
  yet (concurrent recordify build). The workflow is committed now and
  becomes live when those land (spec R4 -- do NOT create records/ here).

## 2. Workflow content (authoritative copy; keep in sync with the .yml)

```yaml
name: records-gate
on:
  push:
    branches: [main]
jobs:
  gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - name: Sanitizer contract (I1 test suite)
        run: bun test recordify/sanitize.test.mjs
      - name: Full-corpus audit (structure + speech + structural identifiers)
        run: bun recordify/audit-records.mjs records/
      - name: make check (bash -n, node --check, security scan)
        run: make check
      - name: Notify ntfy on failure
        if: failure()
        env:
          NTFY_URL: ${{ secrets.NTFY_URL }}
        run: |
          : "${NTFY_URL:?NTFY_URL secret not set on the repo}"
          curl -sS -o /dev/null "$NTFY_URL" \
            -H "Title: records-gate FAILED (skillify-core ${GITHUB_SHA:0:8})" \
            -H "Priority: urgent" \
            -H "Tags: warning,git" \
            --data-binary "records-gate failed for commit ${GITHUB_SHA} in ${GITHUB_REPOSITORY}. Run: https://github.com/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}"
```

What the audit step checks (spec 2.3): for each records/*.md -- scanRecord
(leaks with file+class lines), schema check (required frontmatter
id|date|skill|competencies_touched|evidence; id matches
sess-\d{4}-\d{2}-\d{2}-[a-z0-9-]+; skill in {promptify, explainify,
pipeline}; evidence competency in P1..P7,U1..U4,W1..W3; valence positive|
negative), filename == <id>.md, cross-file duplicate-id check. Exit 1 with
the full report on any failure; exit 0 with `clean: N records` otherwise.

work-identifiers: DROPPED (owner decision #4). No real-name blocklist is
ever committed to ANY repo. Enforcement = structural classes (ticket-id
`[A-Z]{2,8}-[0-9]{2,6}`, internal-domain `\w+\.(corp|internal|local)`,
verbatim speech, existing identifier classes) + the genericization
vocabulary at capture time (employer -> "the employer", client -> "a
client", ticket -> "a tracked ticket").

## 3. Notification model (keep consistent with the audit run)

Locked model (steered by the audit orchestrator):
- Daily 08:00 digest (systemd timer, Persistent=true) compiles ALL data.
- ONLY --urgent-classified failures + seerr requests bypass instantly.
- 15-minute storm guard on the instant path.
- ntfy on CI failure: YES (owner ratified) -- folded into the digest AND
  the --urgent path.

This workflow's ntfy step implements the CI-failure half:
- The failure step posts directly (instant, urgent) -- a red records-gate is
  exactly the class of failure that must page NOW (a leak candidate is on
  main or the sanitizer regressed).
- The digest folds the same failures into its daily compilation (the digest
  aggregates job evidence; CI failures are part of that evidence set). The
  instant ntfy and the digest are the same delivery path (homelab ntfy,
  topic homelab-system) -- no parallel notification mechanism.
- The 15-min storm guard applies to the INSTANT path generally; GitHub
  Actions already rate-limits runs per repo, and a red workflow fires at
  most once per push, so the guard is satisfied structurally here (the
  guard is enforced host-side in the digest/urgent machinery).

## 4. Homeserver re-audit (the actual ingest gate)

A read-only deploy key cannot see CI status, so the homeserver re-runs the
SAME audit-records.mjs on every 10-min pull (flock-guarded, ff-only). A
leak can never be ingested even if CI was bypassed or red: re-audit fails ->
alert, no restart, last-good kokoro map keeps serving. This is the R5
design; do not "simplify" it away.

## 5. Execution status

The workflow FILE is done (Phase A, additive). Wiring/activation = PARKED
Phase B: gate = audit-records.mjs + records/ land (concurrent recordify
build), owner review of the split; rollback = remove the workflow file or
the ntfy step; verification = acceptance A4 (synthetic clean record -> CI
green -> homeserver ingests) and A5 (leak record on a throwaway branch -> CI
red with ticket-id/work-identifier classes in the report -> homeserver
refuses ingest).
