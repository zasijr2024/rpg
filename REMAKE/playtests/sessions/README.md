# Session Records

The version-2 schema, validator, tests, and `../session.example.json` are ready. P14V-06 froze candidate revision `d3696de28218bb6c7645302398e1a4b5fe7cba18`, the `original` ruleset, cohort `p14v-2026-07-14-d3696de-original-01`, and production artifact `sha256:619c6a8eefc27000a99c621a3bb3e6c656034830f2531eccc7dc1da881060e1e`. From the evidence-tooling checkout, verify the exact served candidate `dist/` with `npm run artifact:identity -- --dir=<candidate-dist> --expect=<artifact ID>` before each session; do not silently substitute a rebuilt or modified directory.

Place one consented, de-identified JSON file per qualifying session here. Every file in the release-decision cohort must use the same exact revision, production artifact, and ruleset; IDs must be unique. Follow `../README.md`, validate with `npm run study:human`, and close the preliminary three-session minimum with `npm run study:human:gate`.

Do not place names, contact details, recordings, debug/coached runs, automated sessions, or copied/duplicate records here. The summarizer ignores this README.
