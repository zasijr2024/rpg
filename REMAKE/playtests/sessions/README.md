# Session Records

Only schema-version-3 records qualify here. The validator and `../session.example.json` require exact wall start/end timestamps, reconciled foreground-active/background-open/closed-page time, timestamped active and wall milestones, and either a locked Classic/Hyper cohort or a recorded transition timeline.

Historical candidates do not qualify for new v3 collection. Every qualifying record must use revision `275c096247e5fe2026e00c1f67eb78cd4668ccaf`, artifact `sha256:147e06733788a771a8a3598c383b0f7b2103fec705ac6dabb10f101f3a95386c`, cohort `p14v-2026-08-01-275c096-original-classic-01`, ruleset `original`, and `modePolicy` `classic-locked`. Verify that exact served candidate `dist/` before each session.

Place one consented, de-identified JSON file per session here. Every file summarized together must use the same exact revision, canonical `sha256:<64 lowercase hex>` production artifact, cohort, ruleset, and mode policy; session and participant IDs must be unique. Familiar or experienced sessions may appear in exploratory summaries but never count toward the release minimum. Follow `../README.md`, validate after each record with `npm run study:human`, and run its fully candidate-bound `npm run study:human:gate -- ...` command at the five-first-time-session minimum.

Do not place names, contact details, recordings, debug/coached runs, automated sessions, version-2 records, or copied/duplicate records here. The summarizer ignores this README.
