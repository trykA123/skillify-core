# compose-delta.md — records bind mount for the map container (PENDING)

Status: DELTA — NOT applied. The TrueHL compose tree is restructure-owned;
this delta is applied by the restructure/parent when the homeserver stage is
confirmed (spec §2.7). Container/service naming (compose `skillmap`, app
codename kokoro) to be confirmed against the restructured stack.

## Current state (post-restructure compose, verified 2026-08-03)

`/mnt/Sabrent/homelab/TrueHL/apps/dashboard/docker-compose.yml`:

```yaml
  skillmap:
    build: ./skillmap
    image: localhost/skillmap:v1.0.6
    container_name: skillmap
    labels:
      - dockhand.update=false
    ports:
      - "127.0.0.1:3080:3000"
    environment:
      - RECORDS_DIR=/app/data/records     # ← baked-in image seed today
      - TZ=Europe/Bucharest
    restart: unless-stopped
    networks:
      - proxy-network
```

## The delta

Add the read-only bind mount of the repo's records corpus and point
`RECORDS_DIR` at it:

```yaml
  skillmap:
    volumes:
      - /opt/skillify-core/records:/app/records:ro
    environment:
      - RECORDS_DIR=/app/records
      - TZ=Europe/Bucharest
```

Everything else stays as-is. The image's baked-in `data/records` seed is
harmless — `RECORDS_DIR` overrides it at runtime (spec §2.7). `compileRecords()`
runs at boot and is idempotent, so ingest = pull + re-audit + restart.

## Apply (after the deploy-key clone exists at /opt/skillify-core)

1. Edit the compose file above (or have the restructure apply it).
2. `docker compose -f <file> build skillmap` only if the image needs it —
   the delta is volumes/env only, so `up -d skillmap` re-creates with the mount:
   `docker compose -f /mnt/Sabrent/homelab/TrueHL/apps/dashboard/docker-compose.yml up -d skillmap`
3. Verify: `docker inspect skillmap --format '{{json .Mounts}}' | jq` shows
   `/opt/skillify-core/records -> /app/records (ro)`; boot log shows the
   `compiled: N record files, …` line.
