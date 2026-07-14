# RA-P1-15 Closure: Parser Parity Graph

## Scope

Close H-08 by removing duplicate canonical source records and replacing title-only regex coverage with a parser-backed event graph whose event, scene, button, transition, effect, and reward requirements have stable IDs and mutation-sensitive verification.

## Delivered

- A TypeScript AST parser reads all seven pinned original event files without executing them.
- `DATA/parity-graph.json` and its test copy expose 48 events, 274 scenes, 462 buttons, 542 transitions, 869 effects, 352 rewards, 2,547 requirements, and 2,791 containment/transition edges.
- Hierarchy-based `ADR-*` requirement IDs are deterministic and remain stable when a transition target, callback body, combat/effect value, cost, or reward value changes.
- Internal scene and event transitions resolve to graph edges; terminal `end` transitions remain explicit transition requirements. Diagnostics reject duplicate IDs and unresolved internal targets.
- The canonical source inventory scans every root once, reducing 130 records with seven duplicated event paths to 123 unique records. Drift verification now hashes all 123 files instead of six selected files.
- `npm run parity:generate` writes deterministic canonical-manifest and parity-graph copies to `DATA/` and `src/generated/`. `npm run parity:check` detects stale generated artifacts without rewriting them.
- The legacy PowerShell entry point delegates to the reproducible generator and remains the documented baseline-refresh command.

## Mutation Evidence

- Changing a valid `nextScene` target changes the transition requirement payload while preserving its ID and resolved edge.
- Changing an `onChoose` callback changes the effect payload while preserving its ID.
- Changing a reward quantity changes the reward payload while preserving its ID.
- Changing a transition to a missing scene produces an unresolved-transition diagnostic.
- The committed original graph has zero duplicate requirement IDs and zero unresolved transitions.

## Verification

- `npm run parity:check`: passed; all four committed artifacts are current and graph diagnostics are empty.
- Focused Vitest run: 3 files, 16 tests passed, including four parser-graph and mutation tests.
- `npm test`: 40 files, 434 tests passed.
- `npm run lint`: passed.
- `npm run format:check`: passed.
- `npm run build`: TypeScript and Vite passed; the documented parity-phase chunk warning remains.
- `npm run test:e2e`: 302 passed, 130 expected skips, 4.8 minutes.

## Revision And Tree State

- Branch: `remake/parity`
- Base revision: `8b0938e963ba19df82779431f5aeaa4ff8ec06dd`
- The working tree was already dirty from the active remediation series. At closure it contains the prior package changes plus this package; no unrelated changes were reverted or overwritten.

## Residual Risks

- The graph is the original-content denominator, not proof that every requirement is implemented. The parity checklist and future coverage tooling must map remake behavior to these IDs.
- Presentation strings and audio are still covered by their existing source/data authorities; this package's effect nodes focus on executable event mechanics, conditions, costs, callbacks, cooldowns, and combat properties.
- `RA-P1-16` still owns typed Economy, World, and Combat mutation facades. Production gate separation, durable save recovery, cross-browser coverage, accessibility evidence, bundle boundaries, and performance budgets remain P2 work.

## Result

`RA-P1-15` is complete. The H-08 parser-specific Phase 9/12 breadth hold is lifted, and `RA-P1-16 Typed domain facades` is active.
