# =============================================================================
# skillify make check -- one entrypoint for the skill-repo gates.
#
#   make check   runs: bash -n + shellcheck (install.sh), node --check on all
#                       tracked .js/.mjs, tsc --noEmit on the TS engine scripts,
#                       security-gate.sh (L1-L3).
#
# skillify's package.json carries devDependencies ONLY (typescript ~6 + @types/node
# for the compile gate); the runtime scripts stay plain bun/node with zero runtime
# deps. `bun install` materializes node_modules/ (gitignored); CI installs deps too.
#
# The authoritative personal-data gate for this repo is the records pipeline:
#   bun test teaching/recordify/sanitize.test.mjs
#   bun teaching/recordify/audit-records.mjs records/
# wired into .github/workflows/records-gate.yml (and the homeserver re-audit).
#
# security-gate.sh lives in the sibling TrueHL repo. In this monorepo layout
# it is at $(CURDIR)/../TrueHL/.githooks/security-gate.sh; override
# SECURITY_GATE to point at a vendored copy for a standalone checkout/CI.
# =============================================================================

.PHONY: check check-bash check-js check-ts check-security

SECURITY_GATE ?= $(CURDIR)/../TrueHL/.githooks/security-gate.sh

check: check-bash check-js check-ts check-security
	@echo "== make check: OK (skillify) =="

check-bash:
	@echo "== [check-bash] bash -n + shellcheck over tracked .sh =="
	@files="$$(git ls-files '*.sh')"; \
	if [ -z "$$files" ]; then echo "  (no tracked .sh files)"; exit 0; fi; \
	echo "$$files" | tr '\n' ' ' | xargs bash -n || { echo "  FAIL: bash syntax error"; exit 1; }; \
	if command -v shellcheck >/dev/null 2>&1; then \
	  echo "$$files" | tr '\n' ' ' | xargs shellcheck || { echo "  FAIL: shellcheck findings"; exit 1; }; \
	else \
	  echo "  WARN: shellcheck not installed - skipping"; \
	fi

check-js:
	@echo "== [check-js] node --check over tracked .js/.mjs =="
	@files="$$(git ls-files '*.js' '*.mjs')"; \
	if [ -z "$$files" ]; then echo "  (no tracked .js/.mjs files)"; exit 0; fi; \
	rc=0; \
	for f in $$files; do \
	  node --check "$$f" || { echo "  FAIL: node --check $$f"; rc=1; }; \
	done; \
	if [ $$rc -ne 0 ]; then exit 1; fi; \
	echo "  OK: $$(echo "$$files" | wc -l) files parsed"

check-ts:
	@echo "== [check-ts] tsc --noEmit over the TS engine scripts =="
	@if [ -x node_modules/.bin/tsc ]; then \
	  node_modules/.bin/tsc -p tsconfig.json || { echo "  FAIL: tsc --noEmit findings"; exit 1; }; \
	  echo "  OK: tsc --noEmit clean (typescript gate)"; \
	else \
	  echo "  WARN: tsc missing - skipping (run bun install; CI installs deps)"; \
	fi

check-security:
	@echo "== [check-security] security-gate.sh (L1 secrets, L2 env, L3 records) =="
	@if [ -x "$(SECURITY_GATE)" ]; then \
	  bash "$(SECURITY_GATE)" tracked; \
	else \
	  echo "  WARN: security-gate.sh not found at $(SECURITY_GATE) - skipping"; \
	  echo "  note: the records gate (records-gate.yml) is authoritative for L3 in CI"; \
	fi
