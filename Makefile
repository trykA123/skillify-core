# =============================================================================
# skillify make check -- one entrypoint for the skill-repo gates.
#
#   make check   runs: bash -n + shellcheck (install.sh), node --check on all
#                       tracked .js/.mjs, security-gate.sh (L1-L3).
#
# skillify deliberately has NO package.json (plain node/bun scripts only) --
# that stays true; see plans/split-design.md.
#
# The authoritative personal-data gate for this repo is the records pipeline:
#   bun test recordify/sanitize.test.mjs
#   bun recordify/audit-records.mjs records/
# wired into .github/workflows/records-gate.yml (and the homeserver re-audit).
#
# security-gate.sh lives in the sibling TrueHL repo. In this monorepo layout
# it is at $(CURDIR)/../TrueHL/.githooks/security-gate.sh; override
# SECURITY_GATE to point at a vendored copy for a standalone checkout/CI.
# =============================================================================

.PHONY: check check-bash check-js check-security

SECURITY_GATE ?= $(CURDIR)/../TrueHL/.githooks/security-gate.sh

check: check-bash check-js check-security
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

check-security:
	@echo "== [check-security] security-gate.sh (L1 secrets, L2 env, L3 records) =="
	@if [ -x "$(SECURITY_GATE)" ]; then \
	  bash "$(SECURITY_GATE)" tracked; \
	else \
	  echo "  WARN: security-gate.sh not found at $(SECURITY_GATE) - skipping"; \
	  echo "  note: the records gate (records-gate.yml) is authoritative for L3 in CI"; \
	fi
