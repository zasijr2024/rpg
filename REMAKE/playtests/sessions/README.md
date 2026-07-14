# Session Records

The version-2 schema, validator, tests, and `../session.example.json` are ready. P14V-05 froze candidate revision `d3696de28218bb6c7645302398e1a4b5fe7cba18` and the `original` ruleset for P14V-06. Before session 1, choose one exact production build, record its SHA-256 artifact ID, and reuse it for the entire cohort.

Place one consented, de-identified JSON file per qualifying session here. Every file in the release-decision cohort must use the same exact revision, production artifact, and ruleset; IDs must be unique. Follow `../README.md`, validate with `npm run study:human`, and close the preliminary three-session minimum with `npm run study:human:gate`.

Do not place names, contact details, recordings, debug/coached runs, automated sessions, or copied/duplicate records here. The summarizer ignores this README.
