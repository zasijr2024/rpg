# RA-P0-02 Closure: Expedition Resource Authority

Closed: 2026-07-09 22:27 +02:00

Source finding: C-02  
Audit authority: `REPORTS/remake_full_browsergame_roasting_audit_2026-07-09_21-11-34.md`  
Baseline revision: `8b0938e963ba19df82779431f5aeaa4ff8ec06dd`  
Implementation state: uncommitted working tree; package SHA pending a user-directed commit

## Scope

Made the active expedition authoritative for World-event costs, HP, water, and carried combat supplies. Room-origin event costs remain home-store costs even while a World expedition exists. Encounter continuation, death rollback, landmark instancing, and blueprint commit remain owned by later packages.

Changed paths:

- `REMAKE/src/engine/events/EventRuntime.ts`
- `REMAKE/src/engine/combat/CombatRuntime.ts`
- `REMAKE/src/tests/engine/resource-authority.test.ts`
- `REMAKE/src/tests/engine/event-runtime.test.ts`
- `REMAKE/src/tests/e2e/expedition-resources.spec.ts`
- `REMAKE/src/tests/e2e/app.spec.ts`

## Requirements

- Torch, Charm, and Grenade costs accept carried stock and reject home-only stock during World events: passed.
- World water and HP costs use the expedition values for exact and insufficient cases: passed.
- Combat damage, travel healing, consecutive fights, and carried Medicine share expedition HP and inventory: passed.
- Home-only Medicine is unavailable in expedition combat: passed.
- Room-origin costs continue using home stores even when an expedition is active: passed.
- Browser-crafted Torch left at home cannot pay a cave cost; the same Torch carried through Path can: passed.

## Evidence

- Focused Vitest suites: 135 passed.
- Chromium 1366 resource-authority scenarios: 3 passed.
- Full Vitest gate: 382 passed.
- Build, lint and formatting: passed.
- Full Playwright gate: 247 passed, 77 intentional project skips.

## Residual Risks

- Normal World encounter victory still exits to Path until `RA-P0-03`.
- Death still commits/clears expedition state instead of rollback and cooldown until `RA-P0-05`.
- Coordinate-scoped landmarks remain assigned to `RA-P0-06`.
- The repository was already dirty before this package; no clean-tree or closure-tag claim is made.
