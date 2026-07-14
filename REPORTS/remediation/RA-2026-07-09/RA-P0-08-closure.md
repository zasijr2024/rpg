# RA-P0-08 Closure: P0 Contract Suite

Date: 2026-07-10  
Authority: `REPORTS/remake_full_browsergame_roasting_audit_2026-07-09_21-11-34.md`

P0 browser evidence is complete. Fresh-run Chromium evidence now covers one-worker cadence, carried-only Torch authority, encounter continuation, death rollback, and coordinate-isolated generated Caves. The suite uses controlled time, deterministic RNG where necessary, and read-only map inspection; those contracts do not mutate state through the browser harness.

Blueprint Commit uses a declarative test-harness seed, explicitly allowed by the remediation ledger, to place all six source-backed blueprints in an active expedition. The browser proves safe village return redeems every blueprint and death discards every blueprint before commit. The test source does not make direct state mutations.

This fixture verifies the transactional boundary, not acquisition reachability. Player-reachable Blueprint acquisition is deferred to `RA-P1-14 Fresh-save spine and pacing`, which owns the Ship, Fabricator, Space, and ending progression required to obtain it honestly.

Verification: 390 unit tests passed; 256 Playwright tests passed with 104 intentional project skips; build, lint, and format passed.
