# Audit Remediation Planning

Last updated: 2026-07-14

Authorities: `REPORTS/remake_full_browsergame_roasting_audit_2026-07-09_21-11-34.md`, `REPORTS/current_prototype_full_roasting_audit_2026-07-11.md`, and `docs/status/phase-14-release-readiness-plan-2026-07-12.md`

This file is the operational implementation and release-validation ledger for the current audit remediation. `REMAKE/docs/plan.md` remains the long-term remake plan. Every implementation task must belong to exactly one package below; do not mix opportunistic fixes into an active package.

## Package Contract

A package may move to `done` only when all of the following are recorded:

- implementation and scope review;
- focused deterministic engine or content tests;
- player-facing product packages: a Playwright scenario without direct state injection for the contract under test plus browser verification at Chromium 1366x768 at minimum;
- non-visual tooling and documentation packages: deterministic CLI/fixture verification instead of artificial browser coverage;
- visual packages additionally verified at 1920x1080 and the zoom/viewports named by the package;
- `planning.md`, `changelog.md`, `context.md`, and the relevant `docs/status/*` file updated in the same package;
- full lint, typecheck/build, unit, and Playwright gates run at the package's integration checkpoint.

Evidence labels: `fresh-run`, `scenario-seeded`, `headless`, `browser`, `visual`, and `manual-a11y`. A test-harness seed or controlled clock is allowed; direct state mutation is not accepted for fresh-run contract evidence.

## Current Gate

- Verdict: `HOLD` for public Release Candidate sign-off; Phase 14 parity and roast implementation are complete
- Readiness: Production Beta implementation with Release Candidate evidence in progress
- Historical implementation program: `RA-2026-07-09`, complete
- Active validation program: `P14V-2026-07-12`
- Active package: none; `P14V-01` is complete and `P14V-02` is next, requiring maintainer scope review and checkpoint authorization before candidate freeze
- Core-loop gate: P0/P1/P2, P14R implementation, and roadmap Phases 9-14 complete for the declared parity scope
- Remaining work: clean reproduction, hosted CI, clean-candidate reproduction of the corrected policy plus its retained 32-seed corpus, at least 3 unassisted sessions with 5 normally targeted and up to 8 if results conflict, real screen-reader Space/ending, license/NOTICE and product decision, and final clean tag
- Current unknowns must not be collapsed into automation: the provisional dirty-worktree 4/4 policy result is not a player statistic, and axe is not a real screen-reader flight
- Report archive: current through the `P14V-2026-07-12` evidence index
- Planning baseline: synchronized 2026-07-14

## Control Package

| ID         | Package                              | Source     | Exit criteria                                                                                                                      | Status |
| ---------- | ------------------------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------ |
| RA-CTRL-00 | Audit intake and remediation control | M-10, H-08 | Timestamped report authority, atomic package ledger, status ownership, evidence rules and closure-report convention are documented | done   |

## P0 Core Loop

| ID       | Package                          | Source           | Depends on   | Exit criteria                                                                                                                                                                                                                                                              | Status |
| -------- | -------------------------------- | ---------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| RA-P0-01 | Expedition transaction boundary  | C-02, C-03, M-04 | none         | Typed transaction API owns HP, water, carried inventory, position, cadence and serializable draft lifecycle without changing later package semantics                                                                                                                       | done   |
| RA-P0-02 | Expedition resource authority    | C-02             | P0-01        | World event costs use carried supplies/world water/world HP; room events continue using home stores                                                                                                                                                                        | done   |
| RA-P0-03 | Encounter resumes World          | C-01             | P0-01, P0-02 | Seeded victory, loot and leave resume the same active World position and allow another move                                                                                                                                                                                | done   |
| RA-P0-04 | Worker income cadence            | C-04             | none         | One gatherer pays exactly once per ten seconds; consuming jobs and debug x10 retain cadence                                                                                                                                                                                | done   |
| RA-P0-05 | Atomic death and cooldown        | C-03             | P0-01        | Death rolls back the expedition, closes World, loses outfit and blocks embark for 120 seconds                                                                                                                                                                              | done   |
| RA-P0-06 | Coordinate-scoped landmarks      | H-01             | P0-01        | Clearing or visiting one coordinate cannot consume another landmark of the same type                                                                                                                                                                                       | done   |
| RA-P0-07 | Safe-return blueprint redemption | M-01             | P0-01, P0-05 | All blueprint types redeem only on successful village commit and never on death                                                                                                                                                                                            | done   |
| RA-P0-08 | P0 contract suite                | M-08             | P0-01..P0-07 | Fresh-run tests prove resource authority, encounter continuation, cadence, rollback and landmark isolation; a declarative browser seed proves all-blueprint village commit and death discard without direct test mutation. Actual blueprint acquisition is owned by P1-14. | done   |

P0 browser evidence:

- `ResourceAuthority`: carried-only/home-only/exact/insufficient matrix for Torch, Charm, Grenade, Medicine, water and HP.
- `EncounterResume`: embark, move into a seeded random encounter, win, take loot, leave and move again.
- `EconomyCadence`: visible one-worker output at 1, 2, 9, 10 and 11 seconds, plus consuming worker and debug x10.
- `DeathRollback`: reveal and mutate a landmark, die before village return, verify rollback and the embark cooldown.
- `LandmarkIsolation`: two same-type generated landmarks; clear one and enter the other.
- `BlueprintCommit`: a declarative browser seed carries every blueprint through village return, then repeats the contract with death. Player-reachable blueprint acquisition belongs to P1-14's full fresh-save spine.

## P1 Integration And Vertical Spine

| ID       | Package                        | Source | Depends on   | Exit criteria                                                                                                                                    | Status                                   |
| -------- | ------------------------------ | ------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| RA-P1-01 | Stim expiry lifecycle          | M-02   | P0-08        | Boost expires at 3000 ms and restores correctly from a 2000 ms lifecycle snapshot                                                                | done                                     |
| RA-P1-02 | Production RNG lifecycle       | H-06   | P0-08        | Random production seed, reproducible explicit seed, serializable state and exact 100-draw resume                                                 | done                                     |
| RA-P1-03 | Atomic save foundation         | M-05   | P1-02        | Validated atomic autosave supports reset/quarantine and restores RNG before timers/events; compatibility guarantees remain deferred              | done                                     |
| RA-P1-04 | Background catch-up debt       | M-03   | P0-08        | Serialized debt survives reload; bounded 250 ms simulation steps make one-hour suspension and update-gated outcomes match continuous advancement | done (reopened and corrected 2026-07-10) |
| RA-P1-05 | World snapshot cache           | H-02   | P0-08        | Validated map/mask and cached rows keep a warm headless snapshot below 2 ms on the audit host                                                    | done                                     |
| RA-P1-06 | Domain UI subscriptions        | H-02   | P1-05        | The 250 ms driver no longer invalidates inactive domains or the full React tree                                                                  | done                                     |
| RA-P1-07 | Dedicated World layout         | H-03   | P1-05        | Readable stable map composition at 1366/1920 and 100/125/150/200 percent zoom                                                                    | done                                     |
| RA-P1-08 | Compact accessible World model | H-04   | P1-07        | Visual grid is hidden from AT; compact position, terrain, resources, landmarks, directions and moves expose no hidden tiles                      | done                                     |
| RA-P1-09 | Focus ownership lifecycle      | H-05   | P1-07        | Keyboard-only embark, combat cooldown, victory, event end, death and return keep a meaningful active element                                     | done                                     |
| RA-P1-10 | Compact control semantics      | M-07   | P1-09        | Minimum 24x24 hit areas, grouped steppers, described details, correct tab pattern and targeted live announcements                                | done                                     |
| RA-P1-11 | Thin playable Ship slice       | H-07   | P0-08, P1-03 | Fresh progression can discover, open and operate the minimal original Ship module                                                                | done                                     |
| RA-P1-12 | Thin playable Fabricator slice | H-07   | P0-07, P1-11 | Redeemed blueprints drive a minimal player-facing Fabricator progression                                                                         | done                                     |
| RA-P1-13 | Thin Space and Ending slice    | H-07   | P1-11, P1-12 | Player-facing lift-off, representative Space loop and ending are reachable                                                                       | done                                     |
| RA-P1-14 | Fresh-save spine and pacing    | H-07   | P1-11..P1-13 | Deterministic browser run reaches ending without setState/forced events and records named milestone times                                        | done                                     |
| RA-P1-15 | Parser parity graph            | H-08   | none         | Duplicates removed; event/scene/button/transition/effect/reward graph has stable requirement IDs and mutation-sensitive tests                    | done                                     |
| RA-P1-16 | Typed domain facades           | M-04   | P0-01        | Economy, World and Combat mutations use typed commands/read models with negative compile fixtures                                                | done                                     |

P1-13 browser evidence:

- `scenario-seeded`: visible Ship reinforcement, one-time departure warning, lift-off, the live Space/debris loop, altitude-title progression, and the score ending complete without browser-side state mutation.
- `visual`: Ship and Space baselines pass at Chromium 1366, 1920, 2560, and 3840.
- `headless`: deterministic coverage proves hull gating, movement bounds, collision/crash cooldown, sixty-second escape, original score calculation, and active-flight save restoration.

P1-14 browser evidence:

- `fresh-run`: a Chromium 1366 run starts from cleared storage and uses only visible actions, controlled clock advancement, and controlled RNG to reach Builder, Outside, Compass, generated Iron/Coal Mines, Steelworks, Water Tank/Wagon, the radius-28 Executioner, player-acquired Blueprint redemption, Fabricator crafting, the radius-28 Crashed Ship, lift-off, Space, and the ending.
- The contract calls neither `setState` nor any forced-event API. It asserts and attaches the named pacing series: Builder `00:00:30`, Outside `00:00:50`, Compass `08:32:10`, first expedition `10:42:10`, Fabricator `12:15:02`, Ship `12:15:02`, Ending `12:16:02`.
- Full integration gate: 429 unit tests, lint, formatting, and build passed; 302 Playwright tests passed with 130 expected skips in 4.8 minutes.

P1-15 tooling evidence:

- `headless`: the TypeScript AST parser produces a deterministic graph from all seven original event files with 48 events, 274 scenes, 462 buttons, 542 transitions, 869 effects, 352 rewards, 2,547 stable requirement IDs, and 2,791 edges.
- The canonical source inventory contains 123 unique file records instead of the duplicated 130-record scan; checksum drift verification now covers all 123 files instead of six selected files.
- Graph diagnostics contain zero duplicate requirement IDs and zero unresolved internal transitions. Fixture mutations prove transition targets, callback effects, and rewards change without changing their stable IDs; a missing scene target fails diagnostics.
- Full integration gate: 434 unit tests, lint, formatting, build, and the reproducible `parity:check` CLI passed; 302 Playwright tests passed with 130 expected skips in 4.8 minutes.

P1-16 type-boundary evidence:

- `headless`: Economy, World, and Combat persistent mutations are owned by discriminated command unions; their read models expose readonly scalars and frozen record views. Outside, World, and Combat runtimes no longer access `StateStore` directly.
- Negative compile fixtures reject arbitrary Economy paths, invalid store value types, invalid World exposure kinds/maps, invalid Combat HP payloads, and attempted read-model mutation. The production command bus no longer exposes generic `state.set` or `state.add` commands.
- Architecture tests enforce the runtime/facade boundary. Focused domain, Economy cadence, World cache, expedition, Combat, Ship, and engine suites passed; the browser gate caught and then regression-covered the distinction between stored Ship coordinates and a cleared Crashed Ship.
- Full integration gate: 41 unit-test files / 439 tests, negative compile fixtures, lint, formatting, and build passed; 302 Playwright tests passed with 130 expected skips in 4.8 minutes.

## P2 Production Readiness

| ID       | Package                                   | Source     | Depends on          | Exit criteria                                                                                                    | Status |
| -------- | ----------------------------------------- | ---------- | ------------------- | ---------------------------------------------------------------------------------------------------------------- | ------ |
| RA-P2-01 | Release gate separation                   | M-05       | P1-03, P1-14        | `Parity Complete`, `Production Beta` and `Release Candidate` have distinct executable gates                      | done   |
| RA-P2-02 | Save backup, recovery and migration tests | M-05       | P1-03, P2-01        | Corruption, partial write, incompatible schema, backup recovery and supported migrations are deterministic       | done   |
| RA-P2-03 | Browser and real zoom matrix              | M-09       | P1-14               | Fresh spine, save/background, focus and World pass Chromium, Firefox and WebKit with full-viewport zoom evidence | done   |
| RA-P2-04 | Accessibility release evidence            | H-04, M-07 | P1-08..P1-10        | Automated accessibility smokes plus a recorded real screen-reader pass                                           | done   |
| RA-P2-05 | Test ownership split                      | M-08       | P0-08, P1-14        | Monoliths are split by domain contracts and every E2E declares its evidence label                                | done   |
| RA-P2-06 | Production bundle boundary                | M-06       | P1-14               | Test harness and spikes are compile-time excluded; late game is intentionally lazy-loaded                        | done   |
| RA-P2-07 | Performance budgets                       | H-02, M-06 | P1-05, P2-06        | Bundle, startup, long-task and long-idle budgets fail CI on regression                                           | done   |
| RA-P2-08 | Reproducible phase closure                | H-08, M-10 | P1-15, P2-01..P2-07 | One command prints revision, open IDs and gate results; clean closure tag has zero phase-owned open IDs          | done    |

P2-06 production-bundle evidence:

- Vite defines development surfaces from the compile command: the dev server retains deterministic browser seeds, `window.__adrTest`, debug Settings, and the quarantined Spike Lab, while production replaces the boundary with `false` before tree-shaking.
- Spike CSS and code are dynamically owned by `SpikeLab`; the production manifest contains no `src/testing`, `src/spikes`, `SpikeLab`, or `SettingsView` entries and emitted JS/CSS/HTML contains none of the named harness/spike markers.
- Fabricator, Ship, and Space views are React lazy boundaries with three manifest-declared dynamic entries. The Space focus owner is reacquired after its asynchronous mount, preserving the keyboard contract and all four visual baselines.
- Phase 14 adds a separate served-`dist` lane that passes fresh save/reload, blocked-storage startup, and Fabricator/Ship/active-Space lazy routes in Chromium, Firefox, and WebKit without shipping the fixture factory or `window.__adrTest`.
- `npm run build` emits and verifies the Vite manifest through `verify-production-bundle.mjs`. The Phase 14 entry is 599,941 B / 141,041 B gzip against 600 kB / 150 kB; it passes but the 59-byte raw margin is an explicit post-parity architecture risk.

P2-07 performance-budget evidence:

- `performance-budgets.json` is the versioned source of truth. Every production build rejects an initial JavaScript payload above 600 kB raw / 150 kB gzip, total JavaScript above 610 kB / 155 kB gzip, CSS above 24 kB / 6 kB gzip, or a lazy entry above 4 kB / 2 kB gzip.
- `npm run test:e2e:performance` serves the already-built production bundle in desktop Chromium and rejects startup above 4 seconds, a long task above 250 ms, cumulative long-task time above 500 ms, an idle long task above 100 ms, or idle timer delay above 150 ms. The focused production run is a Production Beta release-gate command.
- Phase 14 evidence: build emitted 599,941 B / 141,041 B gzip initial JavaScript, 18,088 B / 4,100 B gzip CSS, and all three lazy entries at or below 3,508 B raw. The focused production performance gate passed.

P2-01 tooling evidence:

- `release-gates.json` and the validated runner define cumulative Parity Complete, Production Beta, and Release Candidate package/check/command ownership without promoting the fresh-run smoke into a release claim.
- Parity owns the pinned four-project Chromium suite through `test:e2e:parity`; Release Candidate separately owns `test:e2e:release`, which `RA-P2-03` will expand to the cross-browser/real-zoom matrix.
- Phase 14 static CLI evidence reports 284 complete and 3 linked-deviation checklist items with zero open/partial entries. Parity Complete and Production Beta are ready; Release Candidate has exactly one blocker: the dirty worktree.

P2-02 durable-save evidence:

- `adr-remake-dev-save` now stores a checksummed schema-1 envelope, keeps one last committed backup generation, never promotes staging data, and clears primary/staging/backup together on reset.
- Load deterministically quarantines invalid JSON, checksum corruption, malformed documents, and incompatible schemas. Format failures recover automatically; session/engine validation failures quarantine before attempting the backup, without mutating live state.
- Existing unversioned remake session-v2, engine-v2, and legacy state snapshots are supported migration inputs and are rewritten into the versioned envelope after a successful format decode. Unknown and future schemas are not guessed.
- Focused evidence covers corrupt primary recovery, stale/partial staging, interrupted primary writes, incompatible schemas, all supported legacy families, semantic backup recovery, reset, exact RNG/lifecycle continuation, and a real Chromium reload through a corrupted primary.
- Full integration gate: 43 unit-test files / 455 tests, parity artifacts, negative type fixtures, lint, formatting, and build passed; 306 Playwright tests passed with 130 expected skips in 5.4 minutes.
- Final integration gate: 42 unit-test files / 446 tests, parity artifacts, negative type fixtures, lint, formatting, and build passed; 302 Playwright tests passed with 130 expected skips in 5.0 minutes.

P2-03 release-browser evidence:

- `test:e2e:release` is now isolated from the Chromium parity matrix and runs the release contracts in desktop Chromium, Firefox, and WebKit at a physical 1366x768 baseline.
- The release suite executes the complete controlled fresh-save spine to the ending, fresh autosave/background-debt reload, modal focus ownership, and seeded World movement in every engine.
- The World contract models real 100/125/150/200 percent browser zoom by changing the effective CSS viewport of that physical desktop instead of applying the non-portable CSS `zoom` property. Each level verifies no document overflow and attaches a full-viewport PNG; the other contracts attach their own full-viewport evidence.
- Fresh-spine pacing and generated-landmark JSON attachments remain available per engine. WebKit has an explicit five-minute contract timeout because the real visible-control route completes more slowly there; Chromium and Firefox retain the three-minute limit.
- Phase 14 release-browser gate: `npm run test:e2e:release` passed all 27 executions across Chromium, Firefox, and WebKit in 4.8 minutes, including the full spine, long-event real-zoom matrix, modal isolation, and axe scans.

P2-04 accessibility evidence:

- `headless`: axe-core scans the fresh Room/live-log surface, compact World model, and active Combat dialog against WCAG 2.0/2.1/2.2 A/AA tags in Chromium, Firefox, and WebKit. `npm run test:e2e:a11y -- --workers=3` passed all nine executions with zero violations; each execution attaches machine-readable rule results.
- `manual-a11y`: Oliver completed the keyboard-only runbook with Windows 10 Narrator and Edge 150 on Windows 10 Pro 22H2. Room/live announcements, compact World without hidden-map leakage, and Combat dialog/focus containment all passed with no anomalies. The environment and observations are recorded in `REPORTS/remediation/RA-2026-07-09/RA-P2-04-closure.md`.
- Automated ARIA snapshots and axe results were not substituted for the real assistive-technology pass; the recorded human observation closes the package.

P2-08 reproducible-closure evidence:

- `npm run closure:status` prints the phase identifier, exact revision, every non-`done` RA package ID, worktree state, and a static result with blockers for Parity Complete, Production Beta, and Release Candidate.
- `npm run closure:verify-tag -- <tag>` reads the ledger from the tag rather than the working copy and fails unless the tag resolves to `HEAD`, the worktree is clean, and no phase-owned package IDs remain open. A tag was deliberately not created in this dirty remediation worktree.
- Focused tooling tests prove that an open package is reported, every gate result is present, and a synthetic clean HEAD tag passes only after the final package is marked done.
- Integration checkpoint: 63 unit-test files / 460 tests, lint, negative type fixtures, formatting, production build/budget verification, and all 21 release-browser executions passed in 5.5 minutes.

P2-05 test ownership evidence:

- `headless`: the former `app.spec.ts`, `event-runtime.test.ts`, `game-session.test.ts`, and `event-data-coverage.test.ts` monoliths are now split into Room/Event/World browser contracts and named Engine/Content domain-contract directories. The tooling guard rejects their return and rejects any test source above 2,600 lines.
- Every Playwright test title starts with one of `fresh-run`, `scenario-seeded`, `headless`, `browser`, `visual`, or `manual-a11y`; the same tooling guard fails an unlabeled browser test before integration execution.
- Final integration gate: 63 unit-test files / 457 tests, lint, formatting, production build, and `npm run test:e2e -- --workers=3` passed 330 browser executions with 130 intentional skips in 4.1 minutes.
- Automated integration checkpoint: 43 unit-test files / 455 tests, lint, build, and 7 release-gate tooling tests passed; `npm run test:e2e:release -- --workers=3` passed all 21 executions in 5.3 minutes.

## Phase 14 Roast Remediation Packages

Authority: `REPORTS/current_prototype_full_roasting_audit_2026-07-11.md`. These packages are post-parity remediation and do not rewrite the historical `RA-2026-07-09` closure ledger.

| ID      | Package                  | Exit criterion                                                                                                   | Status                                                                                |
| ------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| P14R-01 | Persistence trust        | Health snapshot, durable warning, memory fallback, retry/export, blocked read/write/private-mode/reload evidence | done                                                                                  |
| P14R-02 | Bundle headroom          | Initial entry below 480 kB without raising aggregate budgets; catalog boundary enforced                          | done                                                                                  |
| P14R-03 | Semantic saves           | Domain/cross-field validation plus generated malformed-state and backup recovery tests                           | done                                                                                  |
| P14R-04 | Repository CI            | Clean-install change lane plus scheduled/manual full Release Candidate gate                                      | done                                                                                  |
| P14R-05 | Lazy recovery            | Save-preserving Fabricator/Ship/Space error boundary and cross-browser aborted-chunk retry                       | done                                                                                  |
| P14R-06 | Nonvisual Space          | Optional spatial feed, hazard alerts, automated accessibility and an honest real-AT runbook                      | implementation done; candidate operator pass pending P14V-02/P14V-07                   |
| P14R-07 | Large desktop and ending | Physical-density policy, stronger ending hierarchy, regenerated/inspected 4K matrix                              | done                                                                                  |
| P14R-08 | Background economics     | Retain bounded open-tab debt, disclose closed-page no-progress rule on first resume                              | done                                                                                  |
| P14R-09 | Pacing distribution      | Scheduled multi-seed real-command study plus schema and summarizer for unassisted sessions                       | implementation done; policy/corpus/cohort evidence pending P14V-04..P14V-06            |
| P14R-10 | Exact scoring            | Realistic semantic cap and saturating safe-integer cumulative score                                              | done                                                                                  |
| P14R-11 | Production completion    | External complete-spine fixture restores the full ending in the shipped bundle                                   | done                                                                                  |
| P14R-12 | Source-authentic balance | Explicit original-mode preservation decision; future rebalance isolated behind a named ruleset                   | done                                                                                  |

Evidence and remaining operator work are recorded in `docs/status/phase-14-roast-remediation-2026-07-11.md`.

## Phase 14 Release-Readiness Validation Packages

Authority: `docs/status/phase-14-release-readiness-plan-2026-07-12.md`. These packages validate a stable candidate; they do not reopen the completed parity or implementation packages. The executable `Release Candidate` gate is necessary but does not substitute for P14V human or product evidence.

| ID      | Package                                            | Depends on                         | Exit criterion                                                                                                                                                                     | Status  |
| ------- | -------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| P14V-00 | Plan and document synchronization                  | none                               | Ledgers, status, runbooks, indexes, and evidence locations agree without claiming missing evidence                                                                                 | done    |
| P14V-01 | Honest evidence gates and collection tooling       | P14V-00                            | Closure understands P14R/P14V or separates technical/product sign-off; diagnostic naming is honest; cohort records fail closed; a normal-clock nonvisual Space fixture is runnable | done    |
| P14V-02 | Scope-safe checkpoint and clean reproduction       | P14V-01                            | Reviewed coherent commits; clean separate checkout initializes submodules, installs with `npm ci`, and passes the technical RC gate                                                | pending |
| P14V-03 | Hosted CI validation                               | P14V-02                            | Change-lane and manual full technical-RC workflows pass on the same SHA with retained run IDs/URLs                                                                                 | pending |
| P14V-04 | Progression-policy validity                        | P14V-02                            | Current four failures classified; legal death/resource recovery represented; policy and game failures separated                                                                    | provisional: 4/4 in dirty worktree |
| P14V-05 | Fixed 32-seed progression corpus                   | P14V-04                            | Reproducible aggregate report exists and no verified game-origin hard/soft lock remains unresolved                                                                                 | runner ready; corpus pending |
| P14V-06 | Unassisted production playtests                    | P14V-05                            | At least 3 valid unique, same-revision records pass the strengthened gate; normally continue to 5 and up to 8 if outcomes conflict                                                 | pending |
| P14V-07 | Real screen-reader Space and ending                | P14V-02                            | Candidate-revision runbook passes on the normal clock, including a complete nonvisual flight and ending, with no pending observations                                              | pending |
| P14V-08 | Release, balance, and public-distribution decision | P14V-03, P14V-05, P14V-06, P14V-07 | Dated `GO`/`HOLD` classifies evidence, resolves license/NOTICE, and preserves original mode unless a separate ruleset is explicitly scoped                                         | pending |
| P14V-09 | Final clean gate and tag                           | P14V-08                            | Final SHA passes local/hosted technical RC gates and P14V-aware tag verification; every document points to the same evidence                                                       | pending |

Evidence belongs under `REPORTS/remediation/P14V-2026-07-12/`. Any candidate-changing fix returns the program to P14V-02 (or P14V-01 if evidence semantics change) and invalidates later evidence for the replaced revision.

## Documentation Package

`RA-DOC-01` owns the documentation decomposition requested by M-10. It keeps this operational ledger short, moves package detail into phase-owned status files, treats the changelog as history only, and prevents `context.md` from accumulating implementation narration. It completes with `RA-P2-08`.

## Change Protocol

1. Mark exactly one package `active`.
2. Record its scope and baseline before editing product code.
3. Implement only that package.
4. Run its focused headless and browser evidence.
5. Update this file, `changelog.md`, `context.md`, and relevant status documentation.
6. Run the integration gate, mark the package `done`, then activate its successor.
