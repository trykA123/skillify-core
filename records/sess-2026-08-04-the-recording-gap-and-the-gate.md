---
id: sess-2026-08-04-the-recording-gap-and-the-gate
date: 2026-08-04
skill: pipeline
competencies_touched: [W1, W2, W3, P7]
outcome: completed
artifact: null
evidence:
  - competency: W1
    note: "The session was captured at commit time — the recorder fired because the work landed, not from memory"
    valence: positive
  - competency: W1
    note: "The missing-sessions report was diagnosed honestly: sessions happened, records did not — the right skill was the recorder, not the map"
    valence: positive
  - competency: W2
    note: "The handoff to the recorder carried the session material — enough to write from, no round-trips needed"
    valence: positive
  - competency: W2
    note: "The design slice handed to the pipeline carried the evidence material and the gate path — the worker could run without clarification"
    valence: positive
  - competency: W3
    note: "The night's output was committed as it landed — docs, fixes, decisions — calibration on what earns a commit"
    valence: positive
  - competency: W3
    note: "The daily records cadence slipped for a full day — the capture discipline was not calibrated to the night's volume"
    valence: negative
  - competency: P7
    note: "The recording gate was run before committing — the sanitizer and the audit, not a hope"
    valence: positive
  - competency: P7
    note: "A first attempt at this capture echoed a summary instead of doing the work — acceptance was rejected and the job was redone for real"
    valence: negative
---
# Capturing the night — the recording gap and the gate

## What happened
The owner asked for the night captured into records across three skills. The first revival attempt produced a status summary instead of records and was rejected. The real run read the schema from the corpus, the gate from the repository, and the competency vocabulary from the map — discovering that the recorder's practice has no competency codes of its own and must ride the pipeline family. Three records were written, sanitized, gated, and committed.

## What worked
- The capture fired at commit time with the session material in hand
- The gap diagnosis was honest: sessions happened, records did not — a process miss, not a display bug
- The gate ran before the commit — the sanitizer and the audit both green
- The recordify practice found its honest home in the pipeline skill family

## What didn't
- The daily records cadence slipped a full day — the capture discipline needs a watcher, not a memory
- The first revival attempt echoed instead of executed — the acceptance gate caught it and the job was redone
