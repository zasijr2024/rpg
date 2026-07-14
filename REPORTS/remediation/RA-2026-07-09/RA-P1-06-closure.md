# RA-P1-06 Closure: Domain UI Subscriptions

Date: 2026-07-10  
Authority: `REPORTS/remake_full_browsergame_roasting_audit_2026-07-09_21-11-34.md`

The 250 ms realtime driver no longer forces a React root refresh. Navigation, Room, Outside, Path, World, Settings, and Event regions now consume stable external-store snapshots from `GameSession`. Only mounted domains are snapshotted and compared; unchanged domains emit nothing, and unmounted-domain caches are discarded so a later remount receives current state.

Catch-up still advances the headless session in bounded 250 ms steps, but UI publication occurs once per outer realtime tick. Per-domain diagnostics count snapshot builds, notifications, and committed React renders. A scenario-seeded Chromium 1366 contract performs a player World movement and proves that World rerenders while navigation/Root, Room, Outside, Path, and Settings do not.

Verification: 410 unit tests passed; 267 Playwright tests passed with 113 intentional project skips; build, lint, and format passed.
