# Heavy execution overlay

Read this only for Heavy work. It adds controls to Shipify; it does not replace the
normal baseline, per-step verification, deviation classification or acceptance flow.

## Before mutation

- Use a dedicated branch and worktree when another writer or live delivery lane exists.
  Record the exact baseline revision and preserve unrelated dirty state.
- Resolve destructive targets read-only. Obtain explicit authority immediately before
  mutation; approval for the outcome is not blanket approval for every destructive path.
- Prove the backup or rollback mechanism restores the state that matters. A file's
  existence is not a restore drill.

## During execution

- Keep risky slices independently committable. Push or otherwise preserve the recovery
  point before crossing the next irreversible boundary.
- Exercise one realistic failure path for each changed safety, data, auth, deployment or
  public-contract boundary. Mocks may isolate the trigger; the asserted consequence must
  be observable.
- Keep web, worker and integration writers in separate worktrees. Read-only agents may
  inspect the same revision; only the named integration owner combines results.
- Record live mutations, approvals and recovery evidence without copying secrets or
  sensitive values into artifacts.

## Completion

Run the packet's rollback or recovery check, not only the happy path. Heavy work is not
complete until an independent Reviewify pass reaches a verdict. If independent review
is unavailable, report Partial with the residual risk; do not self-approve.
