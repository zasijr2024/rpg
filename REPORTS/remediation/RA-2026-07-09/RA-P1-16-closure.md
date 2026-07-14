# RA-P1-16 Closure: Typed Domain Facades

## Scope

Close M-04 for the active P1 boundary by moving persistent Economy, World, and Combat mutations behind typed commands and readonly read models, with negative compile fixtures for invalid paths and payloads.

## Delivered

- `EconomyDomainFacade` owns Outside economy initialization, stores, buildings, population, workers, and income cadence mutations through a discriminated `EconomyCommand` union.
- `WorldDomainFacade` owns persistent map/mask, danger/supply flags, coordinate-scoped landmark/outpost state, perks, return unlocks, and Ship metadata through `WorldPersistentCommand`; the existing typed `ExpeditionTransaction` remains the HP/water/inventory/position/cadence transaction boundary.
- `CombatDomainFacade` owns persistent HP, outfit costs, punch/perk milestones, outfit return, and victory return markers through `CombatCommand`.
- Each facade exposes a typed read model with readonly properties and frozen record views. Outside, World, and Combat runtimes no longer access `StateStore` directly.
- Generic `state.set` and `state.add` commands were removed from the production `GameCommand` union and command bus, closing the arbitrary-path mutation backdoor.

## Compile And Architecture Evidence

- `src/tests/type-fixtures/domain-facades.invalid.ts` uses `@ts-expect-error` fixtures to prove rejection of arbitrary Economy paths, non-numeric store deltas, invalid World exposure kinds and maps, invalid Combat HP payloads, and mutation of readonly models.
- `npm run typecheck:fixtures` passed with the dedicated `tsconfig.type-fixtures.json` configuration.
- Architecture tests prove the three migrated runtimes contain no direct `engine.state`/`StateStore` access and that the production command bus does not expose generic state-path commands.
- Deterministic facade tests cover Economy records, coordinate-scoped World state, Combat HP/outfit/perk milestones, runtime freezing, and the difference between stored Ship coordinates and a completed Crashed Ship.

## Regression Found During Integration

The first full Playwright run passed 301 tests but failed the Chromium 1366 Ship slice because the initial World read model treated stored Ship coordinates as completion of the Crashed Ship landmark. `shipCleared` was narrowed to the original boolean completion flag, a regression assertion was added, and the focused Ship slice passed. The repeated full browser gate then passed.

## Verification

- Focused Vitest run: 8 files, 73 tests passed across facades, architecture, Economy cadence, World snapshot cache, Expedition, Combat, and engine behavior.
- `npm test`: 41 files, 439 tests passed.
- `npm run typecheck:fixtures`: passed.
- `npm run lint`: passed.
- `npm run format:check`: passed.
- `npm run build`: TypeScript and Vite passed; the documented parity-phase chunk warning remains.
- Focused Chromium 1366 Ship slice after correction: 1 passed.
- Repeated `npm run test:e2e`: 302 passed, 130 expected skips, 4.8 minutes.

## Revision And Tree State

- Branch: `remake/parity`
- Base revision: `8b0938e963ba19df82779431f5aeaa4ff8ec06dd`
- The working tree was already dirty from the active remediation series. This package preserved prior changes and added only its typed-boundary implementation, tests, and required documentation.

## Residual Risks

- `GameState` and `StateStore` remain legacy-compatible general containers for unmigrated domains and save restoration; this package closes the Economy, World, and Combat runtime boundary rather than rewriting the entire save schema.
- Event/content adapters can still translate original data effects into legacy paths internally. Their exhaustive behavior is measured by the parser parity graph and future parity breadth, not expanded opportunistically in this package.
- Production gate separation, durable recovery/migrations, cross-browser coverage, accessibility evidence, bundle boundaries, and performance budgets remain P2 work.

## Result

`RA-P1-16` is complete. All P1 remediation packages are green, and `RA-P2-01 Release gate separation` is active.
