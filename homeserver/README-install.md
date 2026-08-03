# README-install.md — skillify-pull timer: install + owner-confirm gate

Status 2026-08-03: the FS gate opened mid-pipeline (the TrueHL restructure
landed `apps/dashboard/`), so the units WERE installed on the host this run —
**owner confirmation requested** before considering the homeserver stage done.
Remaining owner steps are marked OWNER below.

## What was installed by the pipeline run

- `/etc/systemd/system/skillify-pull.service` (Type=oneshot, User=claud,
  ConditionPathExists=/opt/skillify-core — skips silently until the clone
  exists, so no failure noise before setup completes)
- `/etc/systemd/system/skillify-pull.timer` (OnBootSec=5min,
  OnUnitActiveSec=10min, Persistent=true — owner-approved 10-min cadence)
- `systemctl daemon-reload` + `systemctl enable --now skillify-pull.timer`

The script (`skillify-pull.sh`) is NOT copied anywhere — the unit executes it
from the clone itself (`/opt/skillify-core/homeserver/skillify-pull.sh`), so
it self-updates on every accepted pull. Until the clone exists the service
skips via ConditionPathExists.

## OWNER setup steps (the timer does nothing until these land)

1. **OWNER — deploy key (read-only, spec §2.8):**
   ```sh
   ssh-keygen -t ed25519 -f ~/.ssh/skillify_core_ro -N '' -C 'skillify-core homeserver RO'
   chmod 600 ~/.ssh/skillify_core_ro
   ```
   Add `~/.ssh/skillify_core_ro.pub` to GitHub → trykA123/skillify-core →
   Settings → Deploy keys (read-only; it must NOT be able to push poison).
2. **OWNER — the clone:**
   ```sh
   sudo mkdir -p /opt/skillify-core && sudo chown claud: /opt/skillify-core
   GIT_SSH_COMMAND="ssh -i ~/.ssh/skillify_core_ro -o IdentitiesOnly=yes" \
     git clone git@github.com:trykA123/skillify-core.git /opt/skillify-core
   ```
   (Requires the GitHub rename skillify → skillify-core + private flip first —
   RELEASE-PACKET STAGE 2.)
3. **OWNER — ntfy alerts (optional, consistent with the notification model):**
   `echo 'NTFY_URL=<homelab ntfy topic url>' | sudo tee /etc/default/skillify-pull`
4. **OWNER — apply the compose delta** (see compose-delta.md) so the map
   container reads `/opt/skillify-core/records` read-only.
5. Verify one tick: `systemctl start skillify-pull.service && journalctl -u
   skillify-pull.service -n 20` — expect `ingest OK — <sha> audited clean,
   skillmap restarted` (or exit 0 silence when nothing changed upstream).

## Behavior (spec §2.9)

- flock-guarded — no overlapping runs.
- HEAD unchanged upstream → exit 0, NO restart (timer hygiene, A8).
- `git pull --ff-only` only — divergence alerts and stops (human look).
- RE-AUDIT with the SAME script CI runs (`teaching/recordify/audit-records.mjs
  records/`): host bun, docker `oven/bun` fallback (R8). Audit failure →
  alert + NO restart — the last-good map keeps serving (R5).
- Clean + changed → `docker compose restart skillmap` + boot `compiled:` line
  logged as ingest proof.
- Overridable env (unit EnvironmentFile=/etc/default/skillify-pull):
  SKILLIFY_CORE_DIR, SKILLIFY_DEPLOY_KEY, SKILLIFY_COMPOSE_FILE,
  SKILLMAP_SERVICE, NTFY_URL — confirm names/paths once the TrueHL
  restructure settles.

## Uninstall

```sh
systemctl disable --now skillify-pull.timer
rm /etc/systemd/system/skillify-pull.service /etc/systemd/system/skillify-pull.timer
systemctl daemon-reload
```
