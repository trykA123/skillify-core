# Heavy packet overlay

Read this only when Shapeify selects Heavy weight. Keep the full packet intact and add
the fields below where they change execution decisions.

## Required additions

- Name the **decision owner** for destructive actions, production mutations, security
  posture and accepted Material risk. A worker cannot inherit approval by implication.
- For each acceptance check, name the **proof owner** and whether the proof is static,
  fixture-based, live or owner-observed. Do not let a static check stand in for a live
  property without saying so.
- Add a **rollback and recovery** section: protected state, backup or restore mechanism,
  rollback trigger, exact recovery check and the point after which rollback changes.
- Add **execution topology**: dedicated branch/worktree boundaries, the single writer,
  read-only parallel lanes, integration owner and allowed handoff order.
- Test the dependency graph for circular or future dependencies. A step may depend only
  on accepted lower-numbered work or an explicitly available external prerequisite.
- Give every slice a committable boundary and state which evidence must exist before the
  next slice begins.

## Heavy stop conditions

Stop for missing mutation authority, an unverified backup, unexplained data or contract
drift, a failed recovery drill, a writer collision, or evidence that the chosen topology
cannot satisfy an invariant. These are decision failures, not invitations to improvise.
