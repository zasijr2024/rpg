# Session Records

Only schema-version-3 records qualify here. The validator and `../session.example.json` require exact wall start/end timestamps, reconciled foreground-active/background-open/closed-page time, timestamped active and wall milestones, and either a locked Classic/Hyper cohort or a recorded transition timeline.

The old `d3696de` candidate/artifact is historical and does not qualify for new v3 collection. Before adding any record, freeze one post-remediation revision, production artifact identity, ruleset, `modePolicy`, and cohort ID. Verify that exact served candidate `dist/` with `npm run artifact:identity -- --dir=<candidate-dist> --expect=<artifact ID>` before each session.

Place one consented, de-identified JSON file per session here. Every file summarized together must use the same exact revision, canonical `sha256:<64 lowercase hex>` production artifact, cohort, ruleset, and mode policy; session and participant IDs must be unique. Familiar or experienced sessions may appear in exploratory summaries but never count toward the release minimum. Follow `../README.md`, validate after each record with `npm run study:human`, and run its fully candidate-bound `npm run study:human:gate -- ...` command at the five-first-time-session minimum.

Do not place names, contact details, recordings, debug/coached runs, automated sessions, version-2 records, or copied/duplicate records here. The summarizer ignores this README.
