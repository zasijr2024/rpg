# RA-P0-03 Closure: Encounter Resumes World

Closed: 2026-07-09 22:43 +02:00

Source finding: C-01  
Audit authority: `REPORTS/remake_full_browsergame_roasting_audit_2026-07-09_21-11-34.md`  
Baseline revision: `8b0938e963ba19df82779431f5aeaa4ff8ec06dd`  
Implementation state: uncommitted working tree; package SHA pending a user-directed commit

## Scope

Changed only terminal wilderness-encounter victory semantics. A won encounter now closes its event and resumes the active World expedition. Setpiece terminal behavior, safe village return, death rollback, landmark instancing, and blueprint commit remain owned by their existing packages.

Changed paths:

- `REMAKE/src/engine/events/EventRuntime.ts`
- `REMAKE/src/tests/engine/game-session.test.ts`
- `REMAKE/src/tests/engine/event-runtime.test.ts`
- `REMAKE/src/tests/engine/combat-runtime.test.ts`
- `REMAKE/src/tests/e2e/app.spec.ts`
- `REMAKE/docs/status/phase-8-world.md`

## Requirements

- Encounter victory selects CombatRuntime's continuation outcome instead of safe return: passed.
- Loot remains carried and is not transferred to home stores on leave: passed.
- Active transaction draft, coordinates, HP, water, and location remain unchanged by leave: passed.
- No Path return marker is written: passed.
- A subsequent World move succeeds in the same expedition: passed.
- Existing setpiece continuation and safe-return contracts remain green: passed.

## Evidence

- Focused Vitest suites: 232 passed.
- Chromium 1366 fresh-run encounter-resume contract: passed in 46 seconds.
- Full Vitest gate: 383 passed.
- Build, lint and formatting: passed.
- Full Playwright gate: 248 passed, 80 intentional project skips.

## Residual Risks

- World and combat death rollback plus the 120-second embark cooldown remain assigned to `RA-P0-05`.
- Terminal setpiece and blueprint redemption semantics were deliberately not broadened in this package.
- Coordinate-scoped landmarks remain assigned to `RA-P0-06`.
- The repository was already dirty before this package; no clean-tree or closure-tag claim is made.
