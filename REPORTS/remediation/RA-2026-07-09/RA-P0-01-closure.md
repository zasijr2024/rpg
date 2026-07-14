# RA-P0-01 Closure: Expedition Transaction Boundary

Closed: 2026-07-09 21:49 +02:00

Source findings: C-02, C-03, M-04  
Audit authority: `REPORTS/remake_full_browsergame_roasting_audit_2026-07-09_21-11-34.md`  
Baseline revision: `8b0938e963ba19df82779431f5aeaa4ff8ec06dd`  
Implementation state: uncommitted working tree; package SHA pending a user-directed commit

## Scope

Added the typed and serializable transaction boundary only. Resource-authority behavior, encounter continuation, death rollback, landmark instancing, and blueprint commit remain owned by later packages.

Changed paths:

- `REMAKE/src/engine/world/ExpeditionTransaction.ts`
- `REMAKE/src/engine/world/WorldRuntime.ts`
- `REMAKE/src/engine/GameSession.ts`
- `REMAKE/src/tests/engine/expedition-transaction.test.ts`

## Requirements

- Typed access for active position, HP, water, carried inventory and food/water/fight cadence: passed.
- Serializable World baseline draft in engine state: passed.
- Explicit commit preserves working World state and removes the draft: passed.
- Explicit rollback restores the embark World baseline and removes the draft: passed.
- Nested expedition rejection: passed.
- Existing World embark, movement, generated-mine return, and organic browser return remain functional: passed.

## Evidence

- `npm test -- src/tests/engine/expedition-transaction.test.ts src/tests/engine/game-session.test.ts`: 70 passed.
- `npm run build`: passed; existing Vite chunk-size warning remains assigned to `RA-P2-06`/`RA-P2-07`.
- `npm run lint`: passed.
- `npm run format:check`: passed.
- Organic Chromium 1920 fresh Room-to-Path-to-World-return scenario: passed.
- Chromium 1366 Compass/Path/World viewport contract: passed.

## Residual Risks

- Event and Combat still access expedition resources directly until `RA-P0-02`.
- Current death paths still commit instead of rolling back until `RA-P0-05`.
- Direct global landmark flags remain until `RA-P0-06`.
- The repository was already dirty before this package; no clean-tree or closure-tag claim is made.

