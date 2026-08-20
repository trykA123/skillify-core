# Heavy review overlay

Read this only for Heavy work. The ordinary Reviewify contract, severity scale and
verdicts still apply.

## Independence and coverage

- The reviewer must not be the implementation's writer. If true independence is
  unavailable, disclose that limitation and do not issue Approve.
- Map every requirement and invariant to its proof owner, proof type and observed result.
  Flag a static or mocked proof that is being used to claim a live property.
- Inspect the branch/worktree and integration history for unrelated edits, missing slice
  boundaries or evidence produced from a different revision.

## Proof to execute

Trace and, where safely possible, execute at least one realistic failure path for every
changed production-data, auth, schema, deployment or public-contract boundary. Verify
rollback or recovery from the protected artifact rather than checking only that the
artifact exists.

For production mutations, reconcile intended and actual scope with counts or identifiers
that do not expose secrets. For schema changes, check clean install, supported upgrade,
repeat detection and failure atomicity.

## Decisions

A Material risk can be accepted only by a named decision owner with a recorded reason.
The writer and reviewer may recommend acceptance; neither silently becomes the owner.
Missing authority for a destructive or safety-sensitive decision is Blocking.
