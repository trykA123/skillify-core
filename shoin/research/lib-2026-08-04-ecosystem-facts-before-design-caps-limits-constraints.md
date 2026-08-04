---
id: lib-2026-08-04-ecosystem-facts-before-design-caps-limits-constraints
date: 2026-08-04
valence: positive
category: research
status: seed
evidence:
  - session history + research briefs (dynamic-DNS, shell toolkit, graph layout, studio panels, X2/3/4 dissection, gateway)
summary: Ecosystem facts (caps, limits, constraints) belong before design, not after.
tags: research, ecosystem, constraints, caps
superseded_by: null
---

# Ecosystem facts belong before design: caps, limits, constraints

**Principle:** Ecosystem facts belong before design: caps, limits, constraints.

**Why:** The dynamic-DNS brief measured the free tier at five subdomains per account with no rename and only address plus TXT records. The shell-toolkit brief pinned the distro version and its private-API coupling to the underlying toolkit release cycle. The graph brief showed the hairball is structural — the fix is a deterministic compile-time layout, a minimum-spanning backbone, and client-side reveal. The studio brief found the house already owned the DNA of both pages, with annotations living in a sidecar file, never inside write-once records. The database brief noted one file means one write-ahead log and one lock domain; table prefixes never contain corruption, and the apps that already speak the server dialect stay out of the shared file. The gateway brief priced Docker enumeration at one cheap call, a read-only socket proxy as the safe path, and liveness on the events stream plus a slow poll, never on stats.

**When to apply:** adopting any ecosystem piece — libraries, toolkits, services, storage.

**When not to:** when the facts are already verified in-house and the research would only re-derive them.
