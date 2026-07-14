# RA-P0-06 Closure: Coordinate-Scoped Landmarks

Date: 2026-07-09  
Authority: `REPORTS/remake_full_browsergame_roasting_audit_2026-07-09_21-11-34.md`  
Baseline revision: `8b0938e963ba19df82779431f5aeaa4ff8ec06dd`  
Implementation state: uncommitted working tree; package SHA pending a user-directed commit

## Scope

Closed High finding H-01. Landmark consequences are now bound to the coordinate at which a World event set its matching clear or visit effect. A persistent global progression flag can no longer convert another Cave, Town, City, mine, one-off landmark or Executioner landmark merely because it shares a tile type.

Changed paths:

- `REMAKE/src/engine/world/WorldRuntime.ts`
- `REMAKE/src/engine/events/EventRuntime.ts`
- `REMAKE/src/tests/engine/game-session.test.ts`
- `REMAKE/src/tests/e2e/landmark-isolation.spec.ts`
- `REMAKE/docs/planning.md`
- `REMAKE/docs/status/audit-remediation-2026-07-09.md`

## Contract

`EventRuntime` forwards true World landmark effects to `WorldRuntime` after applying the original effect. `WorldRuntime` validates that the effect belongs to the active tile and records that coordinate under `game.world.resolvedLandmarks`. Map conversion consumes only this coordinate-scoped marker; global flags remain available for their separate progression and safe-return contracts.

The regression clears a first Cave through its actual event and combat flow, then moves into a second Cave. It proves the first coordinate becomes an Outpost while the second remains a Cave and opens `setpiece.cave-depths`.

## Verification

- Focused GameSession suite: 67 passed.
- Targeted Chromium 1366 browser contract: 1 passed.
- Full unit suite: 33 files, 388 tests passed.
- Lint and formatting checks: passed.
- Production build: passed.
- Full Playwright gate: 250 passed, 86 intentional project skips.

## Residual Risks

- Safe-return-only blueprint redemption remains assigned to `RA-P0-07`.
- The aggregate organic P0 contract suite remains assigned to `RA-P0-08`.
- The repository was already dirty before this package; no clean-tree or closure-tag claim is made.
