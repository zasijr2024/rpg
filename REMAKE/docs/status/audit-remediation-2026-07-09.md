# Audit Remediation Status

Last updated: 2026-07-12 00:31 +02:00

Authority: `REPORTS/remake_full_browsergame_roasting_audit_2026-07-09_21-11-34.md`

## Decision

The historical RA remediation program is complete: P0, P1, and all eight P2 packages are done. Phase 14 desktop parity is accepted, and the cumulative Production Beta gate passes. The later code-level roast risks were remediated in `phase-14-roast-remediation-2026-07-11.md`; current Release Candidate evidence and blockers are superseded by `phase-14-release-readiness-plan-2026-07-12.md`. Preserve the package evidence below as its dated record.

## Current Package

- ID: none active in the historical RA program; `P14V-02` and `P14V-04` are complete and `P14V-05` is next in the separate validation ledger
- Name: RA remediation closed; see `REMAKE/docs/planning.md` for P14V
- State: all RA packages complete; no closure tag is claimed because the worktree remains dirty.
- Final Phase 14 checkpoint: 69 unit-test files / 483 tests; cumulative Beta gate passed; 381 Chromium parity executions passed with 139 expected skips; 9 served-production and 27 release-browser executions passed; dependency audits found zero vulnerabilities.
- Closure command: P14V-01 extended `npm run closure:status` and `closure:verify-tag` to fail closed for open RA/P14R/P14V packages while keeping the executable RC gate explicitly technical.

## Completed Packages

### RA-P2-07 Performance Budgets

- Versioned limits: `performance-budgets.json` caps initial JavaScript at 600 kB raw / 150 kB gzip, all JavaScript at 610 kB / 155 kB gzip, CSS at 24 kB / 6 kB gzip, and each lazy entry at 4 kB / 2 kB gzip. `npm run build` fails through `verify-performance-budgets.mjs` on any regression.
- Baseline artifact evidence: initial JavaScript is 569,316 B / 136,506 B gzip, CSS is 17,797 B / 4,026 B gzip, and the three lazy entries range from 1,417 to 2,224 B raw.
- Browser limits: the production-only Chromium test rejects startup above 4 seconds, an individual long task above 250 ms, cumulative long-task time above 500 ms, idle long tasks above 100 ms, and idle timer delay above 150 ms. It attaches its collected measurements as JSON.
- Release ownership: `npm run test:e2e:performance` is now a Production Beta gate command; the focused gate passed alongside 63 unit-test files / 457 tests and the production build.

### RA-P2-06 Production Bundle Boundary

- Compile-time isolation: `__ADR_DEV_SURFACES__` is true only for Vite serve; production tree-shaking removes browser seeds, the global test harness, debug Settings, and Spike Lab imports.
- Lazy boundary: Fabricator, Ship, and Space render through React lazy entries; async Space mount explicitly restores its focus owner.
- Artifact enforcement: every production build emits a manifest and runs `verify-production-bundle.mjs`, which rejects dev/test source entries, named emitted markers, or loss of any late-game dynamic entry.
- Output evidence: production emitted 17.79 kB CSS, 1.41 kB Fabricator, 2.14 kB Space, 2.22 kB Ship, and a 569.31 kB main JS chunk. The remaining size warning is owned by P2-07 budgets.
- Final integration checkpoint: 63 unit-test files / 457 tests, parity artifacts, negative type fixtures, lint, formatting, production build verification, and 330 Playwright executions with 130 intentional skips passed.

### RA-P2-05 Test Ownership Split

- Domain ownership: the former `app.spec.ts`, `event-runtime.test.ts`, `game-session.test.ts`, and `event-data-coverage.test.ts` monoliths are split into named Room/Event/World browser contracts plus Engine and Content domain-contract directories.
- Evidence ownership: every Playwright test title declares one of the six package labels: `fresh-run`, `scenario-seeded`, `headless`, `browser`, `visual`, or `manual-a11y`.
- Enforcement: the deterministic tooling suite rejects restored monolith paths, test sources larger than 2,600 lines, missing expected domain contracts, and unlabeled E2E tests.
- Final integration checkpoint: 63 unit-test files / 457 tests, lint, formatting, production build, and 330 Playwright executions with 130 intentional skips passed in 4.1 minutes.

### RA-P2-04 Accessibility Release Evidence

- Automated coverage: axe-core scans Room/live log, compact World, and active Combat against WCAG 2.0/2.1/2.2 A/AA tags in desktop Chromium, Firefox, and WebKit. All nine executions passed with zero violations and attached JSON findings.
- Real assistive technology: Oliver completed the keyboard-only runbook with Windows 10 Narrator and Edge 150 on Windows 10 Pro 22H2. All planned announcements and focus transitions passed; hidden World tiles/grid punctuation were not announced, and no anomalies were observed.
- Evidence boundary: the real screen-reader observation is recorded separately from automated ARIA/axe evidence in `REPORTS/remediation/RA-2026-07-09/RA-P2-04-closure.md`.
- Final integration checkpoint: 43 unit-test files / 455 tests, lint, build, 7 release-gate tooling tests, and all 21 release-browser executions passed in 5.3 minutes.

### RA-P2-03 Browser And Real Zoom Matrix

- Release suite: `test:e2e:release` now uses a dedicated configuration with 1366x768 desktop Chromium, Firefox, and WebKit projects. It is intentionally separate from the four-project Chromium parity suite.
- Contracts: all three engines execute the full controlled fresh-save spine to the ending; fresh autosave plus suspended background reload; seeded combat modal focus ownership; and seeded World movement.
- Real zoom and artifacts: World runs at effective 100, 125, 150, and 200-percent viewport dimensions for the same physical desktop, checks that document/body width does not overflow, and attaches a PNG of every complete viewport. Fresh ending, save/background, and modal-focus contracts attach their own complete viewport PNGs.
- Runtime treatment: WebKit completes the visible-control fresh spine more slowly, so only its release-spine timeout is five minutes; Chromium and Firefox remain three minutes. The interaction remains entirely on rendered controls.
- Final release-browser gate: all 12 Chromium/Firefox/WebKit executions passed in 5.2 minutes.

### RA-P2-02 Save Backup, Recovery And Migration Tests

- Durable format: the existing localStorage key now contains a checksummed schema-1 envelope, while session/engine lifecycle versioning remains an internal payload concern. One previous committed generation is retained under a backup key; staging is never treated as committed state.
- Recovery: invalid JSON, checksum mismatch, malformed documents, incompatible schemas, and semantically invalid engine/session snapshots are quarantined before the adapter restores the backup. A consumed backup cannot loop forever, and reset clears every active generation.
- Compatibility: unversioned session-v2, engine-v2, and legacy remake state snapshots are explicit supported migration inputs. Successful decoding rewrites them into schema 1; future/unknown schemas are rejected rather than guessed.
- Evidence: deterministic unit coverage exercises corruption, stale staging/partial commits, incompatible schema, three migration families, semantic rollback/recovery, reset, and existing RNG/timer lifecycle contracts. Chromium proves a corrupted primary reloads the prior visible generation.
- Final integration gate: 43 unit-test files / 455 tests, parity artifacts, negative type fixtures, lint, formatting, and build passed; 306 Playwright tests passed with 130 expected skips in 5.4 minutes.

### RA-P2-01 Release Gate Separation

- Gate authority: `release-gates.json` defines three versioned cumulative targets. Parity owns original-scope completion and the integration matrix; Beta adds durable-save, test-ownership, production-bundle, and performance packages; RC adds browser/real-zoom, accessibility, reproducible closure, and clean-tree evidence.
- Executable runner: `gate:list`, `gate:parity`, `gate:beta`, and `gate:rc` expose human-readable output, machine JSON, deterministic exit codes, inherited commands, and cheap static preflight before expensive checks.
- Truthful readiness: the current Parity gate reports 2 open and 56 partial checklist entries. Beta and RC add their own pending-package blockers; RC also rejects the dirty remediation tree. No representative smoke is promoted into a release claim.
- Enforcement: focused tooling tests cover hierarchy, unknown parents, cycles, duplicate commands, unknown static checks, annotated `done` ledger states, deviation evidence, package ownership split, and RC-only repository cleanliness.
- Final integration gate: 42 unit-test files / 446 tests, parity artifacts, negative type fixtures, lint, formatting, and build passed; 302 Playwright tests passed with 130 expected skips in 5.0 minutes.

### RA-P1-16 Typed Domain Facades

- Product code: `EconomyDomainFacade`, `WorldDomainFacade`, and `CombatDomainFacade` own persistent mutations through discriminated commands and expose readonly/frozen read models. Outside, World, and Combat runtimes contain no direct `StateStore` access.
- Compiler boundary: generic production `state.set`/`state.add` commands were removed. Negative fixtures reject arbitrary paths, invalid numeric/map/union payloads, and attempted read-model mutation through the dedicated `typecheck:fixtures` gate.
- Enforcement: architecture tests scan the three runtimes for raw state access and guard the removed generic command surface. Deterministic facade tests cover Economy, coordinate-scoped World state, Combat HP/outfit/perk milestones, and the difference between Ship coordinates and completed discovery.
- Browser regression: the first full run exposed premature Ship unlock from coordinate metadata; the Bool/Object distinction was corrected, regression-covered, and the focused Ship slice plus repeated full browser gate passed.
- Final integration gate: 41 unit-test files / 439 tests passed; negative compile fixtures, lint, format check, and build passed; 302 Playwright tests passed with 130 expected skips in 4.8 minutes.

### RA-P1-15 Parser Parity Graph

- Source inventory: the generator scans each original source root once and emits 123 unique canonical file records, removing the seven duplicated event-file records from the previous 130-record manifest. SHA-256 drift verification now covers every canonical file.
- Parser graph: the TypeScript AST parser reads all seven original event files and emits 48 events, 274 scenes, 462 buttons, 542 transitions, 869 effects, 352 rewards, 2,547 stable requirement IDs, and 2,791 containment/transition edges.
- Reproducibility: `npm run parity:generate` writes identical canonical-manifest and parity-graph artifacts to `DATA/` and `src/generated/`; `npm run parity:check` fails when any committed artifact is stale, any requirement ID is duplicated, or any internal transition is unresolved.
- Mutation evidence: deterministic fixtures change a transition target, callback mutation, and reward value while preserving requirement IDs, and prove a missing target is reported. The committed graph has zero duplicate IDs and zero unresolved transitions.
- Final integration gate: 40 unit-test files / 434 tests passed; parity check, lint, format check, and build passed; 302 Playwright tests passed with 130 expected skips in 4.8 minutes.

### RA-P1-14 Fresh-save Spine and Pacing

- Product path: cleared storage progresses through the original Room/Outside economy, Compass, generated Iron and Coal Mines, mine-worker production, Steelworks, Water Tank/Wagon, radius-28 Executioner discovery, a player-acquired Plasma Rifle Blueprint, safe-return redemption, visible Fabricator crafting, radius-28 Crashed Ship salvage, hull reinforcement, lift-off, Space, and ending.
- Evidence boundary: the Chromium 1366 test calls visible controls only. It uses the allowed deterministic clock and RNG controls, reads the generated map for route planning/evidence, and never calls `setState`, `triggerEvent`, `triggerEventByKey`, `triggerWorldEncounter`, or `triggerWorldSetpiece`.
- Pacing artifact: the test asserts and attaches Builder `00:00:30`, Outside `00:00:50`, Compass `08:32:10`, first expedition `10:42:10`, Fabricator `12:15:02`, Ship `12:15:02`, and Ending `12:16:02`; methodology and original-source comparison are recorded in `docs/status/fresh-save-pacing.md`.
- Integration cleanup: repeated visible landmarks now receive unique React list keys, eliminating the warnings exposed by the long generated-map route without changing accessible content.
- Final integration gate: 39 unit-test files / 429 tests passed; lint, format check, and build passed; 302 Playwright tests passed with 130 expected skips in 4.8 minutes.

### RA-P1-13 Thin Space and Ending Slice

- Product code: `SpaceRuntime` owns a deterministic and serializable sixty-second ascent with the original movement-speed formula, altitude regions, asteroid glyph/wave/timing/speed formulas, hull collision loss, crash return, 120-second lift-off cooldown, escape threshold, and score calculation.
- Player surface: Ship exposes the original hull gate and one-time `Ready to Leave?` warning. Lift-off enters a restrained Canvas playfield with `@`, original debris glyphs, hull/altitude/title readouts, keyboard and visible controls, then the original score/total-score/restart ending surface.
- Persistence: active Space position, altitude, hull, debris, RNG authority, timers, and ending state round-trip through the validated session save shape.
- Focused evidence: five Runtime/session tests cover movement bounds, title progression, ending/score, warning/linger/lift-off, crash cooldown, and save restoration. A scenario-seeded Chromium 1366 journey reaches the ending through visible controls without browser-side state mutation. Ship and Space visual baselines pass at all four desktop targets.
- Final integration gate: 429 unit tests passed; lint, format, and build passed; and 301 Playwright tests passed with 127 expected skips (4.8 minutes).

### RA-P1-12 Thin Playable Fabricator Slice

- Product code: `FabricatorRuntime` owns unlock guards, one-time original arrival narration, all nine original recipes, Blueprint gates, exact Alien Alloy costs, Upgrade maxima, original quantities, and atomic store mutation. `GameSession` exposes Fabricator as a guarded, persisted location and isolated UI subscription domain.
- Player surface: `A Whirring Fabricator` appears only after safe-return discovery, lists redeemed Blueprints, hides unredeemed gated recipes, shows explicit costs and visible stores, and adds fabricated weapons/tools to stores. The location is ordered before Ship to preserve the original late-game navigation shape.
- Focused evidence: seven Runtime/session tests cover locked state, arrival idempotence, recipe visibility, exact cost/quantity behavior, maximum and insufficient-cost rejection, location guarding, and validated save restore. A scenario-seeded Chromium 1366 journey proves safe-return Blueprint redemption into visible `hypo (x5)` fabrication without direct state mutation in the browser test.
- Final integration gate: 424 unit tests passed; lint, format, and build passed; and 296 Playwright tests passed with 124 expected skips (4.7 minutes). Four Fabricator visual baselines passed.

### RA-P1-11 Thin Playable Ship Slice

- Product code: `ShipRuntime` owns unlock guards, base hull/thrusters, one-time original arrival narration, and the original one-Alien-Alloy hull/engine operations. `GameSession` exposes Ship as a guarded, persisted location and isolated UI subscription domain.
- Player surface at P1-11 closure: `An Old Starship` appears only after safe-return discovery and shows sparse hull/engine state, Ship actions with explicit costs, available Alien Alloy, and a polite Ship notification log. The then-deferred lift-off and Space transition are now complete in `RA-P1-13`.
- Focused evidence: six Runtime/session tests cover locked state, arrival idempotence, exact operations, insufficient resources, location guarding, and validated save restore. A scenario-seeded Chromium 1366 journey proves the World discovery/return/Ship operation chain through visible controls.
- Final integration gate: 417 unit tests passed; lint, format, and build passed; and 291 Playwright tests passed with 121 expected skips (4.7 minutes). Four Ship visual baselines passed.

### RA-P1-10 Compact Control Semantics

- Product code: four-action Path and Worker steppers are labelled groups with one tab stop. Arrow keys cycle enabled actions, and Home/End reach the first/last enabled action; the visual arrows retain their compact treatment inside 24x24px targets.
- Detail semantics: focusable supply and worker names use `aria-describedby` for weight/damage/availability and worker-income details rather than inaccessible title-only tooltips.
- Navigation and announcements: locations implement roving `tabindex`, Left/Right/Up/Down/Home/End selection, and `aria-controls`/`tabpanel` linkage. Notification feeds expose a non-atomic, additions-only polite live log.
- Focused evidence: fresh-run and scenario-seeded Chromium 1366 coverage passed. The scenario asserts hit areas, stepper grouping/navigation, descriptions, tab relationships, and live-log attributes; the fresh run reaches Outside with only deterministic clock advancement.
- Final integration gate: 411 unit tests passed; lint, format, and build passed; and 286 Playwright tests passed with 118 expected skips (4.6 minutes). Path and Outside visual baselines pass at 1366, 1920, 2560, and 3840.

### RA-P1-09 Focus Ownership Lifecycle

- Product code: World takes focus at embark. A location-level focus owner restores focus after event close and World boundaries, covering safe returns and deaths. Event dialogs repair disabled/removed focus targets, contain focus even when all actions are cooling down, and prefer visible event actions over incidental loot-drop toggles.
- Focused evidence: keyboard-only Chromium exercises embark, combat cooldown, victory, event close/return, combat death, and World keyboard return without manually focusing World or relying on the body.
- Integration gate: 411 unit tests passed; lint, format, and build passed; 278 Playwright tests passed with 118 intentional skips (4.7 minutes).

### RA-P1-08 Compact Accessible World Model

- Product code: the interactive visual 61x61 ASCII grid is now `aria-hidden`, retaining pointer, swipe, and keyboard movement for sighted interaction without contributing thousands of map-cell nodes to assistive technology.
- Accessible model: World exposes a concise parallel region with named position and terrain, health/water/food, distance and direction to the village, boundary-valid moves, and at most three nearest visible landmarks with their relative distance and direction.
- Information boundary: landmark enumeration is calculated only from revealed mask cells. Hidden tiles—including a seeded Crashed Starship—are not represented in the accessible model or accessibility tree.
- Focused evidence: deterministic World runtime coverage asserts the visibility boundary; scenario-seeded Chromium checks the compact region, readable landmark list, map exclusion, and existing World layout/domain-subscription contracts. The final integration gate passed with 411 unit tests, lint, format, build, and 270 Playwright tests with 118 expected skips (5.6 minutes).

### RA-P1-07 Dedicated World Layout

- Product code: World has a dedicated 1180px-capable shell instead of inheriting the Room/Path play-column width. The full ASCII map is the primary surface, with World status, landmark action, movement controls, return, and notifications placed in an adjacent sidebar.
- Legibility: World cells use 15px monospace text and 11px line height; the visibility mask and original glyph geometry remain unchanged, and constrained layouts stack regions rather than compressing map cells.
- Focused evidence: a declarative World scenario performs player movement at Chromium 1366 and 1920 under 100/125/150/200% zoom while asserting map/sidebar separation and live controls. Visual baselines were regenerated at 1366, 1920, 2560, and 3840.
- Integration gate: 410 unit tests passed; lint, format, and build passed; 269 Playwright tests passed with 115 intentional skips.

### RA-P1-06 Domain UI Subscriptions

- Product code: the React shell uses stable `useSyncExternalStore` snapshots for navigation, Room, Outside, Path, World, Settings, and Event regions instead of a 250 ms root reducer refresh.
- Runtime boundary: only subscribed domains are snapshotted; unchanged snapshots retain their identity and emit nothing, while unsubscribed caches are discarded so later remounts observe current state.
- Driver cadence: background catch-up continues to simulate in bounded 250 ms steps and publishes domain changes once after each outer realtime tick.
- Focused evidence: 3 deterministic tests cover inactive-domain isolation, changed-domain notification, and fresh remount snapshots; Chromium 1366 render counters prove an actual World move does not rerender the app shell or inactive locations.
- Integration gate: 410 unit tests passed; lint, format, and build passed; 267 Playwright tests passed with 113 intentional skips.

### RA-P1-05 World Snapshot Cache

- Product code: World map and mask objects are structurally validated once per reference; the 61x61 derived row model is reused until map, mask, position, or an explicit World grid revision changes.
- Mutation safety: map reveal, landmark conversion, generation, embark visibility, and used-Outpost label changes invalidate the row cache through World-owned setters/revisions.
- Focused evidence: 3 deterministic tests cover cache reuse/invalidation, malformed-grid fallback, and the warm headless `< 2 ms` budget.
- Integration gate: 403 unit tests passed; lint, format, and build passed; 266 Playwright tests passed with 110 intentional skips.

### RA-P1-04 Background Catch-up Debt

- Reopen finding: independent review reproduced two closure defects. A five-minute catch-up produced 0 Builder wood while continuous 250 ms advancement produced 54, and stop/restart discarded 9000 ms of a 10-second debt after the first one-second batch.
- Corrected product code: debt is a validated serializable sequence of elapsed-time/time-scale segments, survives stop, autosave, reload, and running in-game restore, and is drained in bounded ten-second production batches.
- Simulation contract: each batch advances the headless session in 250 ms wall-time steps with the time scale captured when the debt arose; UI refresh and autosave remain once per outer driver tick.
- Batch budget: 20 diagnostic ten-second headless batches measured about 5.69 ms median and 12.48 ms p95 on the audit host; the rejected five-minute version took about 187 ms.
- Focused evidence: 9 clock tests and 6 atomic-save tests cover raw timers, stop/restart, serialized scale, running restore, and the reproduced Builder `54 == 54` session outcome.
- Browser: fresh-run Chromium 1366 suspends for one hour, observes the first ten-second batch, reloads, restores the remaining debt, and reaches the exact saved hour without state injection.
- Integration review: the first full Playwright run exposed four running-load failures across the viewport matrix; running restore was corrected and the four focused save/load cases passed before the complete rerun.
- Final integration gate: 407 unit tests passed; lint, format, and build passed; 266 Playwright tests passed with 110 intentional skips (4.4 minutes).

### RA-P1-03 Atomic Save Foundation

- Product code: production startup now validates and autoloads the disposable session snapshot, player commands and ten-second realtime boundaries autosave, and localStorage commits retain the last good primary value across interrupted writes.
- Failure boundary: invalid JSON and invalid full Engine/Session lifecycle shapes are quarantined and removed from the active slot; validation occurs before mutation, failed restores roll back, and RNG is installed before clock, timers, or events resume.
- Scope decision: durable compatibility, migrations, backup recovery, and supported-schema guarantees remain deferred to `RA-P2-02`.
- Focused evidence: 5 atomic-save tests passed; fresh-run Chromium 1366 autosave/autoload passed without direct state injection or debug controls.
- Integration gate: 399 unit tests passed; lint, format, and build passed; 262 Playwright tests passed with 110 intentional skips.

### RA-P0-08 P0 Contract Suite

- Product code: added test-harness-only declarative browser seeds for the Blueprint Commit boundary; product runtime behavior is unchanged.
- Browser: fresh-run Chromium 1366 contracts cover visible Gatherer cadence, home-only versus carried Torch Cave costs, and coordinate-isolated generated Caves. Seeded Chromium 1366 contracts carry all six blueprints through village return and repeat the contract with death.
- Integration gate: 390 unit tests passed; 256 Playwright tests passed with 104 intentional skips; build, lint, and format passed.
- Scope decision: P0 owns the commit/discard boundary. The player-reachable acquisition of Blueprints remains an explicit P1-14 fresh-save-spine requirement; it is not claimed by the seeded P0 fixture.

### RA-P0-07 Safe-Return Blueprint Redemption

- Product code: complete; all six blueprint types redeem only during successful village return, before outfit return.
- Focused tests: 228 passed across GameSession, EventRuntime, CombatRuntime, and death rollback suites; all blueprint types are covered for return and death.
- Build/lint/format: passed
- Browser: scenario-seeded Chromium 1366 return redeemed a carried Plasma Rifle blueprint only after clicking return.
- Integration gate: 390 unit tests passed; the preceding full Playwright gate remains green (250 passed, 86 intentional skips); the new targeted browser contract passed.
- Residual work: aggregate organic P0 evidence belongs to `RA-P0-08`.

### RA-P0-06 Coordinate-Scoped Landmarks

- Product code: complete; landmark resolution now records the active coordinate at the event-effect boundary, so global progression flags cannot transform a second landmark.
- Focused tests: 67 GameSession tests, including organic Cave clear -> second Cave entry; Chromium 1366 browser contract passed.
- Build/lint/format: passed
- Browser: scenario-seeded two-Cave flow cleared the first Cave through the UI, then entered the unchanged second Cave at Chromium 1366.
- Integration gate: 388 unit tests passed; 250 Playwright tests passed with 86 intentional project skips.
- Residual work: safe-return-only blueprint redemption belongs to `RA-P0-07`.

### RA-P0-05 Atomic Death and Cooldown

- Product code: complete
- Focused tests: 240 passed across death rollback, expedition transaction, resource authority, GameSession, CombatRuntime, and EventRuntime suites
- Build/lint/format: passed
- Browser: fresh UI progression mutated an Old House, died in combat, verified rollback and visible 120-second cooldown boundaries, then re-embarked into the restored House at Chromium 1366
- Integration gate: 387 unit tests passed; 249 Playwright tests passed with 83 intentional project skips
- Residual work: coordinate landmark identity belongs to `RA-P0-06`; blueprint commit belongs to `RA-P0-07`

### RA-P0-03 Encounter Resumes World

- Product code: complete
- Focused tests: 232 passed across GameSession, EventRuntime, CombatRuntime, and resource-authority suites
- Build/lint/format: passed
- Browser: fresh UI progression triggered the sixth-move encounter, retained loot and expedition state after victory, and completed a seventh move at Chromium 1366
- Integration gate: 383 unit tests passed; 248 Playwright tests passed with 80 intentional project skips
- Residual work: terminal setpiece semantics were deliberately unchanged and remain outside this package

### RA-P0-02 Expedition Resource Authority

- Product code: complete
- Focused tests: 135 passed across resource-authority and EventRuntime suites
- Build/lint/format: passed
- Browser: crafted home-only and carried Torch contracts plus shared World/Combat HP passed at Chromium 1366
- Integration gate: 382 unit tests passed; 247 Playwright tests passed with 77 intentional project skips
- Residual work: none within C-02; the dependent death contract is closed by `RA-P0-05`

### RA-P0-01 Expedition Transaction Boundary

- Product code: complete
- Focused tests: 70 passed
- Build/lint/format: passed
- Browser: organic fresh Room-to-World return passed at 1920; World contract smoke passed at 1366
- Residual work: later P0 packages still build on this boundary; death rollback is closed by `RA-P0-05`

### RA-P0-04 Worker Income Cadence

- Product code: complete
- Focused tests: 26 passed
- Build/lint/format: passed
- Browser: scenario-seeded 9/10/11-second visible cadence and debug x10 cadence passed at Chromium 1366
- Residual work: P0 organic evidence classification remains assigned to `RA-P0-08`

## Completed Control Work

- Archived the root `REPORT` as `REPORTS/remake_full_browsergame_roasting_audit_2026-07-09_21-11-34.md` using its original creation timestamp.
- Indexed the report in `REPORTS/README.md`.
- Added `REMAKE/docs/planning.md` as the atomic package ledger.
- Replaced the Phase 9 continuation instruction with an audit-remediation gate.

## Exit From Hold

`RA-P0-01` through `RA-P0-08` and `RA-P1-01` through `RA-P1-16` are complete with focused tests and green integration gates. The H-08 parser-specific hold on Phase 9/12 breadth is lifted. The overall audit verdict remains `HOLD` at `Prototype` readiness while the production-readiness packages remain open.
