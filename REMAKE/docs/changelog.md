# Changelog

## 2026-07-30

### Controlled - Post-remediation release handoff

- Added root `AGENTS.md` as the mandatory first read and created the dated post-remediation execution plan with owners, dependencies, exit criteria, invalidation rules, and explicit authority boundaries.
- Completed P14V-02's read-only path audit in `docs/status/phase-14-p14v-02-checkpoint-map-2026-07-30.md`: 122 dirty paths are accounted for as 71 product/runtime paths, 34 evidence/control paths, 16 handoff paths, and one protected user-owned worksheet. No path is duplicated or unexplained.
- Received maintainer approval for the three dependency-ordered commits, selected `0.1.0-rc.1` as the pre-freeze package version, and limited Git authorization to the exact listed paths while excluding the protected worksheet.
- Reconciled onboarding, context, package, evidence, report, Git, operator, owner-decision, and tag documents. Historical `d3696de` evidence remains immutable; P14V-05 is reopened for a separately named replacement-candidate corpus.
- Hardened the human release floor so only first-time participants count and every gated run is explicitly bound to the frozen revision, canonical artifact identity, cohort, ruleset, and mode policy. A bare gate now fails closed instead of trusting self-reported cohort identity.
- Reworked pull-request CI to always report stable branch-protection context `Remake CI required` while keeping the full three-engine verification scope-aware and fail-closed.
- Defined candidate `C` / artifact `A` / evidence descendant `F` lineage, actual-production-host smoke, and a non-circular P14V-09 pre-tag authorization followed by tag verification/publication evidence.
- No remote was configured, no workflow was dispatched, and no pull request, deployment, tag, human session, assistive-technology observation, public-release owner decision, or publication claim was made.

### Verified - Evidence-contract hardening

- Human-gate focused suite passed 8/8 with typecheck, syntax, lint, format, help, example-summary, expected missing-binding exit `2`, and expected fully bound empty-cohort 0/5 failure.
- Hosted-control focused suite passed 4/4 with lint, formatting, and scoped diff hygiene. Hosted execution and branch protection remain pending P14V-03.

### Remediated — Full evaluation and roast

- Replaced silent corrupt-save reset/rollback with typed load outcomes, durable raw quarantine, acknowledgement-gated autosave, semantic-valid backup rotation, and staged checksum/migration/semantic recovery import.
- Added atomic command rollback, structured runtime-failure recovery, finite numeric and hostile-path guards, scoped runtime state ownership, self-cancelling intervals, and bounded catch-up persistence with one debt-preserving checkpoint plus one final flush.
- Rebuilt late-game navigation and focus behavior: World and Hyper no longer collide, cooldown controls retain focus while disabled, Hyper Escape restores its trigger, notification contrast and semantic groups are corrected, and World keeps essential controls operable through effective 200% zoom.
- Hardened root/lazy-route recovery, split development-only CSS, preserved failed-chunk retry behavior with pre-hash cache identity, and added explicit LICENSE/NOTICE links to the player shell.
- Upgraded human evidence to strict schema v3 with a five-session floor and separate wall/foreground/background-open/closed-page, milestone, death, and mode exposure accounting. Renamed automation to a controlled reachability trace/policy diagnostic.
- Characterized inherited Classic balance mathematically, kept Classic unchanged, documented Executioner/Fabricator as optional prestige content, tested the no-Executioner ending, and preregistered a separately named evidence-gated Balanced Experiment A rather than silently rebalance parity mode.
- Pinned GitHub Actions to immutable SHAs and expanded the PR/main served-production lane to Chromium, Firefox, and WebKit. Versioned the remake as `0.1.0-beta.1`, added MPL-2.0 LICENSE/NOTICE artifacts and a source-derived inventory, and retained exact-source/legal-owner approval as an external public-distribution gate.

### Verified — Post-remediation integration

- Passed 77 files / 550 unit, content, and tooling tests after evidence-contract hardening; negative type fixtures; lint; formatting; parity generation; and the production build/boundary/budget checks.
- Final bundle: 436,405 B / 123,783 B gzip initial JavaScript; 601,417 B / 154,676 B gzip total JavaScript; 23,614 B / 5,367 B gzip CSS; 8 lazy entries. Artifact identity: `sha256:147e06733788a771a8a3598c383b0f7b2103fec705ac6dabb10f101f3a95386c`, 16 files / 646,179 bytes.
- Passed 15/15 served-production checks across Chromium/Firefox/WebKit, 1/1 external production ending spine, 33/33 release checks, 15/15 focused accessibility checks, 1/1 production performance, and 410 desktop parity executions with 166 intentional skips.
- The corrected four-seed policy diagnostic completed 4/4 with 11 legal deaths, 6,748 incidental events, 439 combats, and zero policy/game-defect/unclassified failures. It remains automation evidence, not a player statistic.
- Production and complete dependency audits reported zero vulnerabilities. The schema-v3 human gate correctly remains open at 0/5.
- Verdict remains `HOLD`: this is an uncommitted Production Beta integration, not a frozen candidate. A clean P14V-02 candidate, hosted CI/branch protection, human and real-screen-reader evidence, durable exact-source/legal-owner and product decisions, production-host smoke, and the final tag remain open.

- Historically froze P14V-06 cohort `p14v-2026-07-14-d3696de-original-01` and the exact clean-candidate production build. Added a tested canonical directory-identity command; the pre-existing RC output and a fresh rebuild both produced `sha256:619c6a8eefc27000a99c621a3bb3e6c656034830f2531eccc7dc1da881060e1e` across 14 files / 614,649 bytes. Schema v3 later retired that uncollected cohort; new human evidence remains open at 0/5.
- At clean pre-update HEAD `588443e`, reconciled the REMAKE plan with Git history: no Git-recorded reset/revert/rebase/checkout was found, the P14V dependency order had no skipped package, and post-candidate changes at that checkpoint were evidence/runbook documents, the retained corpus, and release-gate assertions rather than production behavior. The 2026-07-30 behavior/tooling remediation later superseded `d3696de` as a candidate.
- Added explicit fail-closed P14V-03, P14V-08, and P14V-09 evidence records. At that checkpoint hosted CI had no configured remote and public distribution remained `HOLD`. Repository licensing artifacts are now implemented; exact-source/legal-owner, hosted, human, assistive-technology, owner, and tag evidence remain open.
- Completed P14V-05 on historical clean candidate `d3696de`: eight validated four-seed shards retained one schema-versioned 32-seed artifact in 40m25s. It records 12 study-policy completions, 161 legal deaths, 42,692 incidental events, 2,937 combats, 20 policy-classified stops, and zero game-defect or unclassified stops. The automated completion rate is not a player statistic; schema v3 requires a newly frozen human cohort and remains at 0/5.
- Completed P14V-02 and P14V-04 on frozen candidate `d3696de`: coherent local checkpoints were reproduced from a separate clean worktree with the pinned submodule, `npm ci`, all three Playwright engines, and a 23m54s technical RC pass. The gate passed 513 unit/content tests, 400 desktop parity executions, 15/15 production smoke, the complete production spine, 30/30 release-browser executions, both dependency audits, and the clean four-seed 4/4 policy diagnostic with 11 legal deaths and no failures. At that checkpoint, hosted CI, the fixed 32-seed corpus, human and real-screen-reader evidence, product/licensing decisions, and the tag remained open; the next entry records the later corpus closure.
- Added the P14V-05 fixed-corpus runner: deterministic shards emit a versioned result contract, aggregation rejects missing/duplicate/extra/mutated seeds and unclassified outcomes, the final JSON records the exact revision/environment/command, and formal runs fail closed on a dirty worktree. A one-seed dirty-worktree smoke completed through the production-command route and was deleted after validating the writer; it is not retained as corpus evidence.
- Continued P14V-04 by splitting Executioner into committed device, Engineering/kinetic-armour, and Martial expeditions; corrected a won-combat continuation loop; replaced full-session progression reads with transient domain snapshots; batched ordinary Path supply commands; and added opt-in live checkpoint tracing for long deterministic seeds. The latest retained focused run is still classified policy evidence, and an over-budget rerun is not claimed as an outcome.
- Began Phase 14 release-readiness implementation with P14V-01: technical RC/product sign-off are explicitly separated; tag closure parses RA/P14R/P14V; progression is labelled diagnostic; the initial human-evidence validator was version 2 (superseded before collection by schema v3); and a console-free normal-clock Space fixture is available for the eventual screen-reader pass.

### Planned - Phase 14 Release-Readiness Validation

- Added `P14V-2026-07-12`, an evidence-gated sequence from honest closure/collection tooling through clean reproduction, hosted CI, progression-policy validation, a fixed 32-seed corpus, unassisted playtests, real screen-reader Space/ending evidence, public-distribution/product decisions, and final tag verification.
- Recorded that the then-current automated RC/closure tools did not yet enforce P14R/P14V operator evidence, the four-seed progression command was diagnostic despite 0/4 completion, and the version-1 human gate was not sufficient for a same-revision decision cohort.
- Blocked final operator collection until P14V-01 strengthens the playtest schema/validator and replaces the frozen Space test harness with a normal-clock, console-free manual fixture.
- Initially set a three-session preliminary policy; schema v3 superseded it before collection with a five-session release-evidence floor and up to eight only when outcomes remain materially inconsistent.
- Added a new P14V evidence index and screen-reader template without fabricating observations, and preserved the historical RA-P2-04 record through a forward link only.
- Elevated the unresolved remake license and required NOTICE/attribution artifact into the public-distribution decision gate.
- This documentation package made no commit, push, pull request, workflow dispatch, tag, balance change, human record, or assistive-technology claim.

### Remediated - Phase 14 Full Prototype Roast

- Made persistence failure durable and actionable: session snapshots expose health, blocked reads/writes fall back to an in-memory recovery generation, the UI warns until recovery, and players can retry or export a checksummed recovery document.
- Added semantic restore invariants for bounded integer stores, exact score state, population/worker/capacity relationships, 61x61 World maps, unlock dependencies, runtime lifecycles, and backup fallback. Supported store and cumulative-score arithmetic now remain exact safe integers.
- Split the immutable event catalog out of the interactive entry, pooled repeated production strings, tightened the entry budget to 480 kB raw / 125 kB gzip, and added recoverable fresh-URL retry boundaries for Fabricator, Ship, and Space.
- Added repository GitHub Actions for clean install, parity artifacts, types, unit/content, lint, format, build, audit, and production Chromium smoke on changes, with the full clean-tree cross-browser Release Candidate gate scheduled and manually dispatchable.
- Added an optional nonvisual Space feed with position, nearest-debris bearing/distance, collision urgency, and escape direction; strengthened the score/homefleet endings; defined a true-4K physical-density policy; regenerated and inspected the affected visual matrix.
- Retained bounded open-tab catch-up as the explicit product rule and now announces that a closed page earns nothing on first resume.
- Added a scheduled multi-seed real-command progression study, a de-identified unassisted-human-session schema/summarizer, and an external production complete-spine fixture that reaches and restores the ending without shipping test controls.
- The production complete spine exposed and corrected two semantic-validator false rejections hidden by short save smokes: timer-owned Builder income legitimately omits worker `timeLeft`, and World `shipPosition` is a signed village-relative compass vector rather than an absolute map index.
- Preserved source-authentic dominant strategies in the original ruleset by explicit decision; any future rebalance must be a separately named mode backed by collected player evidence.
- Added `docs/status/phase-14-roast-remediation-2026-07-11.md`. Real human pacing sessions and a recorded real-screen-reader Space flight remain honestly unverified until operators supply them.

### Finalized - Phase 14 Full Parity QA And Prototype Roast

- Closed the parity ledger at 284 complete items, 3 linked intentional deviations, and zero open/partial items; added an AST-backed full event identity/title/string/graph contract for 48 source events, 274 scenes, 462 buttons, 542 transitions, 869 effects, 352 rewards, 2,547 requirements, and 2,791 edges.
- Restored the original organic thief sink and Hyper x2 mode, suspended passive income during Space, generated World before Nomad Compass headings, separated ship coordinates from the Crashed Ship flag, and corrected active-flight save validation for the real `-40..740` debris domain.
- Hardened modal background isolation, compact-control tab recovery, Space midpoint contrast, source-exact Executioner text, 64-seed World generation/reachability, canonical Cave/Coal browser routes, and Space keyboard evidence.
- Expanded the visual matrix to 72 baselines: 18 states at each of 1366, 1920, 2560, and 3840, including true full-viewport framing plus event, combat, Space midpoint, and ending evidence.
- Added a served-production Chromium/Firefox/WebKit lane for save/reload, blocked storage, and Fabricator/Ship/active-Space lazy routes; repaired Windows/Node 25 execution in the cumulative release-gate runner.
- Added `docs/status/phase-14-full-parity-qa.md`, `REPORTS/phase14_data_parity_report_2026-07-11.md`, and `REPORTS/current_prototype_full_roasting_audit_2026-07-11.md`.
- Final verification at that checkpoint: cumulative Production Beta gate passed with 69 files / 483 unit tests, 381 Chromium parity executions with 139 expected skips, production build/performance and zero production vulnerabilities; served-production passed 9/9; release Chromium/Firefox/WebKit passed 27/27; complete dependency audit found zero vulnerabilities. Release Candidate was then blocked by the dirty worktree.

### Finalized - Phase 13 Space Flight and Ending

- Replaced representative input with frame-scaled held-key movement, including source thruster scaling, diagonal normalization, bounds, and persisted active controls.
- Corrected asteroid travel from the source `-40px` start through `740px`, retained altitude-dependent timing/waves and RNG duration, and aligned collision with the glyph footprint and ship point.
- Added the source Fleet Beacon ending and wait gate, randomized 24-store prestige reduction, total-score persistence, and restart semantics that clear the completed run while preserving prestige.
- Added deterministic star/ascent rendering and document-title region changes on the restrained Canvas surface; audio remains deferred by project scope.
- Added `docs/status/phase-13-space-ending.md`. Full parity QA remains Phase 14.
- Verification passed 64 files / 470 unit tests, lint, production build/bundle/performance checks, and the Chromium 1366 Space/ending browser contract.

### Finalized - Phase 12 Executioner Content

- Locked the pinned `ORIGINAL/script/events/executioner.js` denominator at 798 requirements: 6 events, 103 scenes, 203 buttons, 226 transitions, 196 effects, and 64 rewards.
- Finalized 38 deterministic routed Executioner variants spanning the Ravaged Battleship intro, antechamber, Engineering, Medical, Martial, and Command Deck content, including every branch represented in focused runtime contracts.
- Verified all 16 Executioner combat definitions, health and timed specials, unstable-automaton explosion behavior, healing-machine costs, wing completion flags, Fleet Beacon reward, and final Battleship-to-Outpost conversion.
- Verified Hypo, Kinetic Armour, Plasma Rifle, Disruptor, Glowstone, and Stim Blueprint acquisition plus safe-return redemption into Fabricator recipe visibility; the cleared-storage browser spine retains an organic Blueprint-to-ending proof.
- Added `docs/status/phase-12-executioner.md` and a source-graph denominator guard. Broader Space/ending parity remains Phase 13 and full parity QA remains Phase 14.
- Focused verification passed 9 files / 62 unit tests, all four Chromium 1366 Executioner browser contracts, and the cleared-storage fresh ending spine; final integration passed 64 files / 467 unit tests, parser parity, lint, formatting, the production build, bundle-boundary verification, and performance bundle budgets.

### Finalized - Phase 11 Fabricator Module

- Promoted the connected `RA-P1-12` and `RA-P1-14` Fabricator baseline into the finalized roadmap phase after Phase 10 completion.
- Expanded source-data coverage from representative recipes to the complete ordered nine-recipe contract, including every name, type, build message, Alien Alloy cost, Blueprint requirement, Upgrade maximum, and quantity.
- Verified guarded unlock and original tab placement, first-arrival notification, redeemed-Blueprint display, hidden gated recipes, exact atomic spending, Hypo quantity five, capped Upgrades, visible stores, and validated save persistence.
- Repaired the cleared-storage ending spine after canonical Phase 9 migration by using the cost-bearing Iron Mine `go inside` control and Coal Mine `continue` choices; organic Blueprint acquisition, redemption, Fabricator crafting, Ship, and ending coverage is green again.
- Added `docs/status/phase-11-fabricator.md`; exhaustive Executioner/Blueprint breadth remains Phase 12, broader Space/ending parity remains Phase 13, and full parity QA remains Phase 14.
- Focused verification passed 3 files / 34 unit tests and both Chromium 1366 Fabricator/fresh-save browser journeys; final integration passed 63 files / 466 unit tests, parser parity, lint, formatting, the production build, bundle-boundary verification, and performance bundle budgets.

### Finalized - Phase 10 Ship Module

- Promoted the connected `RA-P1-11`, `RA-P1-13`, and `RA-P1-14` Ship baseline into the finalized roadmap phase after Phase 9 completion.
- Verified the guarded Ship tab, original hull/engine display, one-Alien-Alloy hull and engine operations, first-arrival and insufficient-alloy notifications, atomic spending, and validated save persistence against `ORIGINAL/script/ship.js`.
- Verified original positive-hull lift-off gating, one-time departure warning, linger behavior, live Space handoff, crash return, and 120-second cooldown through focused runtime/session and browser journeys.
- Added `docs/status/phase-10-ship.md`; Phase 11 Fabricator, Phase 12 exhaustive Executioner content, Phase 13 broader Space/ending parity, and Phase 14 full parity QA remain outside this phase.
- Focused verification passed 3 files / 31 unit tests and both Chromium 1366 Ship/Space browser journeys; final integration passed 63 files / 466 unit tests, parser parity, lint, formatting, the production build, bundle-boundary verification, and performance bundle budgets.

### Finalized - Phase 9 Canonical Swamp Setpiece

- Closed the three-scene `ADR-EVENT-SETPIECES-SWAMP` graph against canonical `setpiece.swamp`, preserving its exact text, notification, transitions, one-Charm cost, `gastronome` perk reward, and visited-landmark effect.
- Retained organic World routing and coordinate-scoped consumed state through the existing World transaction boundary.
- Added exact source-scene and full 13-event inventory coverage, then strengthened focused EventRuntime, organic GameSession, and Chromium 1366 assertions for the complete wanderer route, carried-Charm consumption, perk acquisition, and consumed-landmark hiding.
- This is the thirteenth and final canonical Phase 9 Setpiece event; no Phase 9 content slices remain.
- Focused verification passed 3 files / 31 unit tests and the Chromium 1366 Swamp World contract; final integration passed 63 files / 466 unit tests, parser parity, lint, formatting, production build, bundle-boundary verification, and performance bundle budgets.

### Continued - Phase 9 Canonical Outpost Setpiece

- Closed the one-scene `ADR-EVENT-SETPIECES-OUTPOST` graph against canonical `setpiece.outpost`, preserving its exact text, notification, guaranteed Cured Meat loot, leave transition, water refill, and replenishment notification.
- Tightened the effect bridge to record only the active coordinate as used, removing the unrelated one-shot landmark water flag while retaining hidden repeat entry, the visible `P` glyph, safe-return reset, and reuse after re-embark.
- Added exact source-scene coverage and strengthened focused EventRuntime, organic GameSession, and Chromium 1366 browser assertions for the canonical effect and coordinate-scoped reuse contract.
- Focused verification passed 3 files / 32 unit tests and both Chromium 1366 Outpost World contracts; final integration passed 63 files / 464 unit tests, parser parity, lint, formatting, production build, bundle-boundary verification, and performance bundle budgets.

### Continued - Phase 9 Canonical Destroyed Village Cache Setpiece

- Migrated the complete three-scene `ADR-EVENT-SETPIECES-CACHE` graph from the Phase 8 semantic scaffold key `setpiece.destroyed-village` to canonical `setpiece.cache`.
- Preserved the exact source text, notification, `enter`/`take`/`leave` transitions, visited effect, and full previous-run prestige-store transfer and clearing behavior.
- Routed organic World Cache entry to the canonical key, added exact scene/button coverage, strengthened focused EventRuntime and organic GameSession assertions, and extended the Chromium 1366 contract with both cache-state flags.
- Focused verification passed 3 files / 29 unit tests and the Chromium 1366 canonical Destroyed Village World contract; final integration passed 63 files / 463 unit tests, parser parity, lint, formatting, production build, bundle-boundary verification, and performance bundle budgets.

### Continued - Phase 9 Canonical Iron Mine Setpiece

- Closed the three-scene `ADR-EVENT-SETPIECES-IRONMINE` graph against canonical `setpiece.ironmine`, restoring the exact `go inside` label and one-Torch entry cost while preserving the Beastly Matriarch combat, loot, notifications, and cleared-mine ending.
- Retained organic World routing and coordinate-scoped road, visited-landmark, safe-return building, and iron-miner unlock consequences through the existing World boundary.
- Added exact scene/button/cost coverage, strengthened focused EventRuntime and organic GameSession assertions, and added Chromium 1366 generated-entry plus full clear/safe-return worker-unlock evidence.
- Focused verification passed 3 files / 24 unit tests and both Chromium 1366 canonical Iron Mine World contracts; final integration passed 63 files / 463 unit tests, parser parity, lint, formatting, production build, bundle-boundary verification, and performance bundle budgets.

### Continued - Phase 9 Canonical Coal Mine Setpiece

- Closed the five-scene `ADR-EVENT-SETPIECES-COALMINE` graph against canonical `setpiece.coalmine`, preserving its exact entry text, notifications, two Man combats, Chief combat, loot tables, original `attack`/`continue`/`run` choices, and cleared-mine ending.
- Retained organic World routing and coordinate-scoped road, visited-landmark, safe-return building, and coal-miner unlock consequences through the existing World boundary.
- Added exact scene/button coverage and strengthened focused EventRuntime, organic GameSession, and Chromium 1366 assertions through visible source text, original combat choices, clearing, and safe-return worker unlock.
- Focused verification passed 3 files / 24 unit tests and the Chromium 1366 canonical Coal Mine World contract; final integration passed 63 files / 463 unit tests, parser parity, lint, formatting, production build, bundle-boundary verification, and performance bundle budgets.

### Continued - Phase 9 Canonical Sulphur Mine Setpiece

- Closed the five-scene `ADR-EVENT-SETPIECES-SULPHURMINE` graph against canonical `setpiece.sulphurmine`, preserving its exact entry text, notifications, two Soldier combats, Veteran combat, loot tables, original `attack`/`continue`/`run` choices, and cleared-mine ending.
- Retained organic World routing and coordinate-scoped road, visited-landmark, safe-return building, and sulphur-miner unlock consequences through the existing World boundary.
- Added exact scene/button coverage, strengthened focused EventRuntime and organic GameSession assertions, and a Chromium 1366 traversal through visible original combat choices and safe-return worker unlock.
- Focused verification passed 3 files / 31 unit tests and the Chromium 1366 canonical Sulphur Mine World contract; final integration passed 63 files / 463 unit tests, parser parity, lint, formatting, production build, bundle-boundary verification, and performance bundle budgets.

### Continued - Phase 9 Canonical Crashed Ship Setpiece

- Migrated the one-scene `ADR-EVENT-SETPIECES-SHIP` graph from the Phase 8 scaffold key `setpiece.crashed-ship` to canonical `setpiece.ship`.
- Preserved its exact text, Ship discovery and visited effects, original misspelled `leavel` action key with visible `salvage` label, leave transition, organic World routing, and original road drawing.
- Added exact source-scene coverage and strengthened focused EventRuntime, organic GameSession, and Chromium 1366 browser assertions.
- Focused verification passed 4 files / 42 unit tests and the Chromium 1366 canonical Crashed Ship World contract; final integration passed 63 files / 463 unit tests, parser parity, lint, formatting, production build, bundle-boundary verification, and performance bundle budgets.

### Continued - Phase 9 Canonical Borehole Setpiece

- Closed the one-scene `ADR-EVENT-SETPIECES-BOREHOLE` graph against canonical `setpiece.borehole`, preserving its exact text, visited effect, guaranteed one-to-three Alien Alloy salvage, and leave transition.
- Retained organic World routing and coordinate-scoped consumption through the existing World consequence boundary, and aligned the registry with the original Battlefield-before-Borehole source order.
- Added explicit source-scene and strengthened Chromium 1366 browser assertions alongside the existing focused EventRuntime and organic GameSession contracts.
- Focused verification passed 4 files / 42 unit tests and the Chromium 1366 canonical Borehole World contract; final integration passed 63 files / 463 unit tests, parser parity, lint, formatting, production build, bundle-boundary verification, and performance bundle budgets.

### Continued - Phase 9 Canonical Battlefield Setpiece

- Closed the one-scene `ADR-EVENT-SETPIECES-BATTLEFIELD` graph against canonical `setpiece.battlefield`, preserving its exact text, visited effect, six-entry probabilistic salvage table, and leave transition.
- Retained organic World routing and coordinate-scoped consumption through the existing World consequence boundary.
- Added explicit source-scene and focused runtime routing/loot assertions; existing GameSession and Chromium 1366 World contracts provide organic movement, salvage, capacity, and consumed-landmark evidence.
- Focused verification passed 3 files / 32 unit tests and the Chromium 1366 Battlefield World contract; final integration passed 63 files / 463 unit tests, parser parity, lint, formatting, production build, bundle-boundary verification, and performance bundle budgets.

### Continued - Phase 9 Canonical Old House Setpiece

- Migrated the complete four-scene Old House graph from `ADR-EVENT-SETPIECES-HOUSE` to canonical `setpiece.house`, preserving all three entry outcomes, exact loot, water replenishment, visited-landmark effects, and Squatter combat.
- Routed organic World House entry to the canonical key and retired the older `setpiece.old-house` scaffold key while preserving coordinate-scoped landmark consumption.
- Added exact scene-key and World-routing assertions; the existing branch, session, and browser contracts now prove all engine branches plus visible organic occupied-combat entry.
- Focused verification passed 4 files / 40 unit tests and the Chromium 1366 Old House World browser contract; final integration passed 63 files / 462 unit tests, parser parity, lint, formatting, production build, bundle-boundary verification, and performance bundle budgets.

### Continued - Phase 9 Canonical City Setpiece

- Added the canonical 52-scene original City graph from `ADR-EVENT-SETPIECES-CITY`, preserving all four entry routes, Torch costs, chance branches, 18 combat placements, intermediate loot, and 15 dungeon endings.
- Routed organic World City entry to `setpiece.city` while retaining focused City events as regression scaffolds; canonical completion now preserves `game.cityCleared` and clears the active coordinate through `game.world.cityCleared`.
- Added complete scene-key/data coverage, a headless organic World-to-Outpost route through chained tower combat, and Chromium 1366 coverage for visible original post-combat choices.
- Final integration passed 461 unit tests, parser parity, lint, formatting, TypeScript/production build, bundle-boundary verification, and performance bundle budgets.

### Continued - Phase 9 Canonical Town Setpiece

- Added the canonical 23-scene original Town graph from `ADR-EVENT-SETPIECES-TOWN`, preserving all three entry routes, Torch costs, chance branches, seven combat scenes, intermediate loot, and six dungeon endings.
- Routed organic World Town entry to `setpiece.town` while retaining the focused Town events as regression scaffolds, and kept clearing coordinate-scoped through `game.world.townCleared` and the World consequence boundary.
- Added content, headless runtime, organic World-to-Outpost, and Chromium 1366 browser coverage for the canonical graph and visible schoolhouse combat choices.
- Final integration passed 461 unit tests, parser parity, lint, formatting, TypeScript/production build, bundle-boundary verification, and performance bundle budgets.

### Started - Phase 9 Canonical Cave Setpiece

- Confirmed that the completed audit remediation lifts the Phase 9 breadth hold while the broader parity/release verdict correctly remains `HOLD`.
- Added the canonical 13-scene original Cave graph with exact Torch costs, chance branches, combats, loot endings, and coordinate-scoped dungeon clearing, then routed organic World Cave entry to it.
- Added player-facing post-combat Setpiece choices so branching fights expose the original `continue` and `leave cave` actions.
- Verified the clean pre-change baseline with 460 unit tests, parity generation, lint, formatting, and production build; focused implementation evidence passed 38 tests and all four Chromium 1366 expedition-resource scenarios, then the final 460-test, parity, lint, format, production-build, bundle-boundary, and bundle-budget gates passed.

### Closed - RA-P2-08 Reproducible Phase Closure

- Added `closure:status`, a deterministic remediation report with the exact revision, open RA package IDs, worktree state, and the static result of every cumulative release gate.
- Added tag verification that reads the ledger from the tag and rejects a non-HEAD tag, dirty worktree, or any open phase-owned package ID. No closure tag was claimed from the then-dirty worktree.
- Verified with 460 unit tests, lint, negative type fixtures, formatting, production build/budget checks, and all 21 Chromium/Firefox/WebKit release-browser executions.

### Closed - RA-P2-07 Performance Budgets

- Added versioned raw and gzip budgets for initial/total JavaScript, CSS, and each lazy entry; every production build now verifies them against the emitted Vite manifest.
- Added a production-only Chromium budget test for startup time, individual and cumulative Long Tasks, idle Long Tasks, and idle event-loop delay. The measurement JSON is retained as test evidence.
- Added the focused performance command to the Production Beta release gate. The baseline production build and focused browser performance run passed; `RA-P2-08 Reproducible phase closure` is now active.

### Closed - RA-P2-06 Production Bundle Boundary

- Added a compile-time Vite boundary that retains browser harnesses, debug Settings, deterministic seeds, and risk spikes in the dev server while removing their imports and markers from production output.
- Moved Spike Lab code and CSS behind a development-only dynamic import and lazy-loaded the Fabricator, Ship, and Space views into three explicit production chunks.
- Added a production-manifest verifier to `npm run build`; it fails if dev/test sources or markers re-enter emitted assets or if a late-game view stops being a dynamic entry.
- Preserved Space keyboard focus across asynchronous mounting and restored the shared production canvas style exposed by visual regression coverage. The remaining main-chunk warning was assigned to `RA-P2-07 Performance budgets` for measured regression enforcement.

### Closed - RA-P2-05 Test Ownership Split

- Split the former cross-domain browser, EventRuntime, GameSession, and event-data test monoliths into named Room/Event/World and Engine/Content domain-contract files.
- Added a deterministic tooling guard that rejects restored monolith paths, oversized unit test files, and any Playwright test without a declared evidence label.
- Every browser test now declares `fresh-run`, `scenario-seeded`, `headless`, `browser`, `visual`, or `manual-a11y` evidence. The integration checkpoint passed 457 unit tests, lint, formatting, build, and 330 Playwright executions with 130 intentional skips in 4.1 minutes. `RA-P2-06 Production bundle boundary` is now active.

### Closed - RA-P2-04 Accessibility Release Evidence

- Added axe-core WCAG 2.0/2.1/2.2 A/AA release smokes for the fresh Room/live log, compact World model, and active Combat dialog in desktop Chromium, Firefox, and WebKit. Every execution attaches a machine-readable JSON result.
- Added a dedicated `test:e2e:a11y` command and included the same tests in `test:e2e:release`; the focused matrix passed all 9 executions with zero violations.
- Added a real-screen-reader runbook and explicit evidence record. Oliver completed every Room, World, and Combat scenario with Windows 10 Narrator and Edge 150 on Windows 10 Pro 22H2; all announcements and focus transitions passed with no anomalies.
- Automated integration checkpoint: 455 unit tests, lint, build, 7 release-gate tooling tests, and all 21 Release Candidate browser executions passed; the release matrix completed in 5.3 minutes.
- Archived the complete automated and `manual-a11y` evidence in `RA-P2-04-closure.md`. `RA-P2-05 Test ownership split` is now active.

### Closed - RA-P2-03 Browser And Real Zoom Matrix

- Added a dedicated Release Candidate Playwright configuration for desktop Chromium, Firefox, and WebKit. `test:e2e:release` now owns only the fresh spine, save/background, modal-focus, and World real-zoom contracts; the pinned Chromium parity matrix is unchanged.
- Added full-viewport release artifacts. World is exercised at effective 100/125/150/200-percent browser zoom viewports without CSS `zoom`, while fresh spine, save/background, and focus attach their own full-viewport PNG evidence.
- Extended the controlled fresh-save ending spine to every release browser and recorded browser-specific timeout treatment for slower WebKit visible-control execution. `RA-P2-04 Accessibility release evidence` is now active.

### Closed - RA-P2-02 Save backup, recovery and migration tests

- Wrapped production autosaves in a checksummed schema-1 document, retained one last committed backup generation, made staging explicitly non-loadable, and made reset clear primary, staging, and backup together.
- Added deterministic quarantine and recovery for corrupt JSON, checksum damage, malformed/future schemas, and semantically invalid engine/session payloads; backup restore happens only after validation and cannot create a retry loop.
- Added explicit migrations for existing unversioned session-v2, engine-v2, and legacy remake state saves, plus focused storage/session and Chromium reload evidence. `RA-P2-03 Browser and real zoom matrix` is now active.
- Final integration gate: 43 unit-test files / 455 tests, parity artifacts, negative type fixtures, lint, formatting, and production build passed; 306 Playwright tests passed with 130 expected skips in 5.4 minutes.

### Closed - RA-P2-01 Release gate separation

- Added a versioned `release-gates.json` authority and executable hierarchical runner for `Parity Complete`, `Production Beta`, and `Release Candidate`, with human-readable and JSON reports.
- Made unresolved parity checklist items, missing remediation-package evidence, invalid deviation links, duplicate/unknown gate configuration, and Release Candidate worktree dirtiness deterministic blockers before expensive commands run.
- Added focused tooling regression coverage and documented the cumulative gate meanings, ownership split, commands, and truthful current `HOLD` result. `RA-P2-02 Save backup, recovery and migration tests` is now active.
- Final integration gate: 42 unit-test files / 446 tests, parity check, negative type fixtures, lint, formatting, and build passed; 302 Playwright tests passed with 130 expected skips in 5.0 minutes.

### Closed - RA-P1-16 Typed domain facades

- Added typed Economy, World, and Combat state boundaries with discriminated mutation commands and readonly/frozen read models; migrated Outside, World, and Combat runtimes away from direct `StateStore` access.
- Removed generic `state.set`/`state.add` production commands and added architecture enforcement plus negative compile fixtures for arbitrary paths, invalid payloads, invalid domain unions, and read-model mutation.
- Added deterministic facade coverage, including the regression distinction between stored Crashed Ship coordinates and completed Ship discovery; the focused Ship browser contract and full fresh-run/World/Combat matrix remain green.
- Final integration gate: 439 unit tests; negative compile fixtures, lint, formatting, and build; and 302 Playwright tests passed with 130 expected skips (4.8 minutes).

### Closed - RA-P1-15 Parser parity graph

- Replaced regex-only event-title extraction with a TypeScript AST graph covering all 48 events, 274 scenes, 462 buttons, 542 transitions, 869 effects, and 352 rewards under 2,547 stable requirement IDs and 2,791 explicit edges.
- Removed the duplicate recursive event scan, reducing the canonical inventory from 130 records to 123 unique files, and expanded SHA-256 source-drift coverage from six selected files to all 123.
- Added reproducible `parity:generate`/`parity:check` commands, zero-duplicate/unresolved-transition diagnostics, and mutation-sensitive tests for transitions, effects, rewards, and missing targets.
- Final integration gate: 434 unit tests; parity check, lint, formatting, and build; and 302 Playwright tests passed with 130 expected skips (4.8 minutes).

### Closed - RA-P1-14 Fresh-save spine and pacing

- Added a deterministic Chromium 1366 cleared-storage route that uses visible controls plus controlled clock/RNG to connect Room/Outside, Compass, generated Iron/Coal Mines, Steelworks and expedition upgrades, radius-28 Executioner Blueprint acquisition, safe-return redemption, Fabricator crafting, radius-28 Crashed Ship discovery, reinforcement, lift-off, Space, and ending.
- Asserted and attached the named 1x controlled reachability trace from the 30-second Builder arrival through the 12:16:02 ending without calling direct state-mutation or forced-event APIs; documented the original-source comparison boundary in `docs/status/controlled-reachability-trace.md`.
- Made repeated entries in the compact visible-landmark list use unique React keys, removing warnings exposed by the long generated-map route without changing the accessible model.
- Final integration gate: 429 unit tests; lint, formatting, and build; and 302 Playwright tests passed with 130 expected skips (4.8 minutes).

### Closed - RA-P1-13 Thin Space and Ending slice

- Added original hull-gated lift-off with the one-time departure warning, a serializable sixty-second Space ascent, altitude regions, asteroid waves and collisions, crash return/cooldown, escape, original score calculation, and ending surface.
- Added a restrained Canvas playfield with keyboard/button flight controls, active-flight save restoration, deterministic Runtime coverage, a Chromium visible-control route through the ending, and four desktop Space visual baselines.
- Final integration gate: 429 unit tests; lint, formatting, and build; and 301 Playwright tests passed with 127 expected skips (4.8 minutes).

### Closed - RA-P1-12 Thin playable Fabricator slice

- Added a guarded, persisted `A Whirring Fabricator` location with one-time original arrival narration, all nine original recipes, Blueprint visibility gates, exact Alien Alloy costs, Upgrade maxima, and original fabrication quantities.
- Added deterministic Runtime/save coverage, a Chromium player-action route from safe-return Blueprint redemption through `hypo (x5)` fabrication, and four desktop Fabricator visual baselines.
- Final integration gate: 424 unit tests; lint, formatting, and build; and 296 Playwright tests passed with 124 expected skips (4.7 minutes).

### Closed - RA-P1-11 Thin playable Ship slice

- Added a guarded, persisted `An Old Starship` location with original base hull/thrusters, one-time arrival narration, exact Alien Alloy reinforcement/engine costs, and an isolated UI subscription domain.
- Added deterministic Runtime/save coverage, a Chromium player-action route from World salvage and Ship discovery through hull reinforcement, and four desktop Ship visual baselines.
- Final integration gate: 417 unit tests; lint, formatting, and build; and 291 Playwright tests passed with 121 expected skips (4.7 minutes).

### Closed - RA-P1-10 Compact control semantics

- Raised Path and Worker stepper hit areas to 24x24px while preserving the compact arrow treatment; each four-action group now has one tab stop and Arrow/Home/End navigation.
- Added focusable, described supply and worker details; converted location navigation to the roving tab/tabpanel pattern; and exposed notifications as polite live logs.
- Added fresh-run and scenario-seeded Chromium contracts plus refreshed the four-viewport Path and Outside visual baselines.
- Final integration gate: 411 unit tests; lint, formatting, and build; and 286 Playwright tests passed with 118 expected skips (4.6 minutes).

All notable remake implementation changes are recorded here.

## 2026-07-10

### Fixed - RA-P1-09 Focus Ownership Lifecycle

- World now receives focus after keyboard embark. When an event ends or World crosses into a return/death destination, focus moves to the active Room, Path, Outside, World, or Settings region instead of falling to the document body.
- The event dialog now repairs focus when a combat action is disabled or removed, prioritizes visible event actions over loot-drop toggles, and contains accidental focus escape even when every action is temporarily cooling down.

### Verified - RA-P1-09 Focus Ownership Lifecycle

- Keyboard-only Chromium coverage proves embark into World, combat cooldown, victory, event close/return, combat death, and World return preserve a meaningful focused owner.
- `npm test` (411 passed); `npm run lint`; `npm run format:check`; and `npm run build` passed.
- `npm run test:e2e` passed with 278 tests and 118 expected skips (4.7 minutes).

### Closed - RA-P1-09 Focus Ownership Lifecycle

- The focus lifecycle contract and full integration gate are green. `RA-P1-10 Compact control semantics` is active.

### Fixed - RA-P1-08 Compact Accessible World Model

- Removed the 61x61 visual World grid and its landmark spans from the accessibility tree while preserving the visual map plus pointer, swipe, and keyboard controls.
- Added a cached compact World model with current position/terrain, health/water/food, village distance/direction, boundary-valid movement options, and up to three nearest visible landmarks.
- Added declarative accessibility browser coverage and a deterministic hidden-tile boundary test; existing World layout and subscription selectors now target the exact World region.

### Verified - RA-P1-08 Compact Accessible World Model

- `npm test` (411 passed); `npm run lint`; `npm run format:check`; and `npm run build` all passed.
- `npm run test:e2e` passed with 270 tests and 118 expected skips (5.6 minutes), including the new Chromium accessibility scenario.

### Closed - RA-P1-08 Compact Accessible World Model

- The focused product, accessibility, and integration gates are green. `RA-P1-09 Focus ownership lifecycle` is active.

### Fixed - RA-P1-07 Dedicated World Layout

- Moved World out of the Room/Path shell into a dedicated wide composition: a readable primary ASCII map sits beside a stable status, landmark, movement, and notification sidebar.
- Increased World cell legibility from compressed 12px/7px/1px geometry to 15px monospace tiles with 11px line height, while preserving the full 61x61 map, original glyphs, click/swipe/keyboard movement, and visibility mask.
- Added responsive World stacking for genuinely constrained viewports without reintroducing the old compact map contract.

### Verified - RA-P1-07 Dedicated World Layout

- `npx playwright test src/tests/e2e/world-layout.spec.ts --project=chromium-1366 --project=chromium-1920` (2 passed; scenario-seeded player movement at 100/125/150/200% zoom)
- Regenerated and passed World visual baselines at Chromium 1366, 1920, 2560, and 3840.
- `npm test` (410 passed)
- `npm run lint`, `npm run build`, `npm run format:check`
- `npm run test:e2e` (269 passed, 115 expected skips; 4.4 minutes)

### Closed - RA-P1-07 Dedicated World Layout

- The required World composition, zoom, and integration contracts are green. `RA-P1-08 Compact accessible World model` is active.

### Fixed - RA-P1-06 Domain UI Subscriptions

- Replaced the 250 ms root reducer refresh with `useSyncExternalStore` subscriptions for navigation, Room, Outside, Path, World, Settings, and Event UI domains.
- Unmounted location domains are neither snapshotted nor notified; remounting builds a fresh current snapshot instead of reusing stale inactive data.
- Catch-up retains 250 ms simulation steps but publishes UI changes once per outer realtime tick, and stable deep comparison preserves the cached World-row reference fast path.
- Added per-domain snapshot, notification, and committed-render diagnostics to the declarative browser harness.

### Verified - RA-P1-06 Domain UI Subscriptions

- `npx vitest run src/tests/engine/domain-ui-subscriptions.test.ts src/tests/engine/game-session.test.ts src/tests/engine/world-snapshot-cache.test.ts` (74 passed)
- `npx playwright test src/tests/e2e/domain-ui-subscriptions.spec.ts --project=chromium-1366` (1 passed; scenario-seeded player movement)
- Browser render counters prove a World move rerenders World while navigation/Root, Room, Outside, Path, and Settings remain unchanged.
- `npm test` (410 passed)
- `npm run lint`, `npm run build`, `npm run format:check`
- `npm run test:e2e` (267 passed, 113 expected skips; 4.3 minutes)

### Closed - RA-P1-06 Domain UI Subscriptions

- The domain subscription and full integration contracts are green. `RA-P1-07 Dedicated World layout` is active.

### Reopened - RA-P1-04 Background Catch-up Debt

- Independent review reproduced that a five-minute catch-up batch skipped update-gated Builder income: batched execution ended with 0 wood while continuous 250 ms advancement ended with 54.
- Reproduced that stop/restart discarded undrained debt: 9000 ms of a 10-second jump disappeared after the first bounded one-second batch.
- The original raw-clock and saved-clock tests did not cover full-session update semantics or reload while debt remained.

### Fixed - RA-P1-04 Corrective Rework

- Realtime debt is now serialized as elapsed-time segments with the time scale that was active when each segment arose.
- Stop, autosave, reload, and running in-game restore preserve undrained debt; a running restore resets its wall-time baseline without restarting the driver or double-counting pre-load time.
- Production catch-up drains ten seconds per outer tick and advances the headless simulation in normal 250 ms steps while retaining one UI refresh and autosave decision per outer driver tick.

### Verified - RA-P1-04 Corrective Rework

- `npx vitest run src/tests/engine/clock.test.ts src/tests/engine/atomic-save.test.ts` (15 passed)
- Builder batch-versus-continuous regression: identical level and 54 wood after five minutes
- Twenty ten-second headless batch probes: about 5.69 ms median and 12.48 ms p95; the rejected five-minute batch measured about 187 ms
- `npx playwright test src/tests/e2e/background-catch-up.spec.ts --project=chromium-1366` (1 passed, fresh-run with reload)
- Running LocalStorage restore: 4 viewport cases passed after the first integration run exposed and prompted correction of that boundary
- `npm test` (407 passed)
- `npm run lint`, `npm run build`, `npm run format:check`
- Final `npm run test:e2e` rerun (266 passed, 110 expected skips; 4.4 minutes)

### Reclosed - RA-P1-04 Background Catch-up Debt

- The corrected full-session, lifecycle, reload, and integration contracts are green. `RA-P1-06 Domain UI subscriptions` remains active.

### Fixed - RA-P1-05 World Snapshot Cache

- World map and mask structures are now validated once per object reference instead of once for every rendered cell.
- The derived 61x61 World rows are cached across warm snapshots and invalidated by grid replacement, movement, reveals, landmark conversion, and used-Outpost presentation changes.
- Invalid map or mask data falls back to a complete safe hidden-grid snapshot.

### Verified - RA-P1-05 World Snapshot Cache

- `npx vitest run src/tests/engine/world-snapshot-cache.test.ts` (3 passed; warm headless snapshot below 2 ms)
- `npm test` (403 passed)
- `npm run lint`, `npm run build`, `npm run format:check`
- `npm run test:e2e` (266 passed, 110 expected skips; 4.4 minutes)

### Closed - RA-P1-05 World Snapshot Cache

- The complete integration matrix is green. `RA-P1-06 Domain UI subscriptions` is active.

### Fixed - RA-P1-04 Background Catch-up Debt

- Realtime suspension time is now accumulated as debt and drained in bounded five-minute batches instead of discarding everything beyond the first batch.
- Added deterministic coverage proving that a one-hour suspension eventually produces exactly the same timeout and interval outcomes as continuous advancement.
- Added a fresh-run Chromium 1366 contract that simulates a one-hour production-tab suspension and observes the complete elapsed hour through the atomic autosave without direct state mutation.

### Verified - RA-P1-04 Background Catch-up Debt

- `npx vitest run src/tests/engine/clock.test.ts` (6 passed)
- `npx playwright test src/tests/e2e/background-catch-up.spec.ts --project=chromium-1366` (1 passed, fresh-run)
- `npm test` (400 passed)
- `npm run lint`, `npm run build`, `npm run format:check`
- `npm run test:e2e` (266 passed, 110 expected skips; 5.2 minutes)

### Closed - RA-P1-04 Background Catch-up Debt

- The complete integration matrix is green. `RA-P1-05 World snapshot cache` is active.

### Fixed - RA-P1-01 Stim Expiry Lifecycle

- Added the original three-second Stim boost timer to the CombatRuntime lifecycle, including explicit `playerBoostExpiresAt` snapshot data, cleanup on combat closure, and remainder-only restoration.
- Added deterministic 2999/3000 ms boundary coverage and a restore contract captured after 2000 ms.
- Added the declarative `testSeed=stim-lifecycle` browser fixture and a Chromium 1366 UI contract that observes a 1-second boosted weapon cooldown before expiry and the normal 2-second cooldown afterward without direct test-state mutation.

### Verified - RA-P1-01 Focused Evidence

- `npm test -- src/tests/engine/combat-runtime.test.ts` (31 passed)
- `npx playwright test src/tests/e2e/stim-lifecycle.spec.ts --project=chromium-1366` (1 passed)
- `npm test` (390 passed)
- `npm run lint`
- `npm run build`
- `npm run format:check`

### Pending - RA-P1-01 Integration Gate

- `npm run test:e2e` (257 passed, 107 expected skips; 5.5 minutes)

### Closed - RA-P1-01 Stim Expiry Lifecycle

- The complete Playwright matrix is green, so the Stim lifecycle package is complete and `RA-P1-02 Production RNG lifecycle` is active.

### Fixed - RA-P1-02 Production RNG Lifecycle

- Production sessions now seed Mulberry32 with `crypto.getRandomValues`; explicit seeds remain reproducible.
- Dev snapshots include validated RNG lifecycle state and restore it before clock-driven runtime lifecycles.
- Test-harness sessions explicitly retain their stable seed, while the production-RNG browser contract uses real entropy and proves distinct generated World maps.

### Verified - RA-P1-02 Production RNG Lifecycle

- `npm test` (394 passed)
- `npx playwright test src/tests/e2e/rng-production.spec.ts --project=chromium-1366` (1 passed)
- `npm run lint`, `npm run build`, `npm run format:check`
- `npm run test:e2e` (258 passed, 110 expected skips)

### Closed - RA-P1-02 Production RNG Lifecycle

- The Save/Load population contract now expects the resumed RNG sequence (`6/8`), replacing the prior reset-seed artifact (`5/8`). `RA-P1-03 Atomic save foundation` is active.

### Added - RA-P1-03 Atomic Save Foundation

- Production sessions now load the current disposable save automatically at startup, save after player commands, and checkpoint realtime timer progress every ten game seconds.
- Added staged localStorage commits that preserve the last good primary value when a replacement write is interrupted.
- Added full Engine/Session lifecycle validation before mutation, rollback on an unexpected restore failure, and explicit RNG-first restoration before clock, timer, and event lifecycles.
- Corrupt JSON and structurally invalid snapshots now move to a quarantine key and reset the active save slot instead of crashing or partially restoring gameplay.
- Kept durable schema compatibility, migrations, backups, and recovery guarantees deferred to `RA-P2-02`.

### Verified - RA-P1-03 Atomic Save Foundation

- `npx vitest run src/tests/engine/atomic-save.test.ts` (5 passed)
- `npx playwright test src/tests/e2e/atomic-save.spec.ts --project=chromium-1366` (1 passed, fresh-run)
- `npm test` (399 passed)
- `npm run lint`, `npm run build`, `npm run format:check`
- `npm run test:e2e` (262 passed, 110 expected skips; 5.2 minutes)

### Closed - RA-P1-03 Atomic Save Foundation

- The validated disposable autosave foundation is green across the complete integration matrix. `RA-P1-04 Background catch-up debt` is active.

## 2026-07-09

### Added - RA-P0-08 Organic Worker Cadence Evidence

- Added a fresh-run Chromium contract that lights the fire, gathers wood, builds a Hut, waits for population, and verifies the player-visible aggregate Gatherer payout remains unchanged at 9 seconds and pays exactly at 10 seconds.
- The route uses only UI actions, controlled test time, and read-only browser assertions; it does not call the state-mutation harness.

### Verified - RA-P0-08 Organic Worker Cadence Evidence

- `npx playwright test src/tests/e2e/app.spec.ts --project=chromium-1366 --grep "fresh-run: a player-created gatherer"` (1 passed)
- `npm run lint`
- `npm run build`
- `npm run format:check`
- `npm run test:e2e` (252 passed, 92 expected skips)

### Added - RA-P0-08 Organic Torch and Landmark Evidence

- Added fresh-run browser routes that organically progress through a Tannery and Workshop to craft a Torch, then find a real generated Cave through read-only map routing.
- Proved the Cave's Torch cost rejects a home-only Torch and accepts the same Torch after the player carries it on the Path.
- Added fresh-run generated-Cave isolation coverage: UI fist combat clears one Cave, converts that coordinate to an Outpost, and reaches a distinct still-enterable Cave without direct state mutation.

### Verified - RA-P0-08 Organic Torch and Landmark Evidence

- `npx playwright test src/tests/e2e/app.spec.ts --project=chromium-1366 --grep "fresh-run: a (home|carried) torch"` (2 passed)
- `npx playwright test src/tests/e2e/app.spec.ts --project=chromium-1366 --grep "fresh-run: clearing one generated Cave"` (1 passed)

### Closed - RA-P0-08 P0 Contract Suite

- Added declarative, test-harness-only browser seeds for the Blueprint Commit boundary. The browser now carries all six source-backed blueprints through safe village return and independently proves death discards them before commit, without direct state mutation in the test.
- Kept the distinction explicit: seed-backed commit/discard verification closes P0; player-reachable Blueprint acquisition remains P1-14 fresh-save-spine work.

### Verified - RA-P0-08 P0 Contract Suite

- `npm test` (390 passed)
- `npm run format:check`
- `npm run lint`
- `npm run build`
- `npm run test:e2e` (256 passed, 104 expected skips)

### Changed - Audit Intake and Remediation Tracking

- Archived the current full browsergame audit as `REPORTS/remake_full_browsergame_roasting_audit_2026-07-09_21-11-34.md` and indexed it as the current key report.
- Added `docs/planning.md` with atomic P0/P1/P2 report packages, dependencies, exit criteria, focused test requirements, and mandatory browser verification.
- Added `docs/status/audit-remediation-2026-07-09.md` and placed Phase 9 content expansion on hold until the P0 expedition contracts are repaired.
- Kept `docs/plan.md` as the long-term remake plan while making `docs/planning.md` the active remediation ledger.

### Verified - Audit Intake

- Confirmed there were no repository references to the former root `REPORT` path.
- Confirmed the archived report retains its original creation timestamp and content length.

### Added - RA-P0-01 Expedition Transaction Boundary

- Added a typed, serializable expedition transaction facade for position, HP, water, carried inventory, food/water/fight cadence, World draft commit, and World draft rollback.
- Routed the World runtime's active expedition resource access through the facade while retaining later behavior changes for their dedicated report packages.
- Added focused transaction tests for typed state ownership, commit, rollback, and nested-expedition rejection.

### Verified - RA-P0-01 Expedition Transaction Boundary

- `npm test -- src/tests/engine/expedition-transaction.test.ts src/tests/engine/game-session.test.ts` (70 passed)
- `npm run build`
- `npm run lint`
- `npm run format:check`
- `npx playwright test src/tests/e2e/app.spec.ts -g "plays organically from fresh room to Path, World movement, and return without resource injection" --project=chromium-1920` (1 passed)
- `npx playwright test src/tests/e2e/app.spec.ts -g "keeps Compass to Path to World contract at viewport extremes" --project=chromium-1366` (1 passed)

### Fixed - RA-P0-04 Worker Income Cadence

- Preserved each worker income source's existing countdown when worker definitions are synchronized.
- Initialized new worker income records at their configured delay instead of treating a missing countdown as immediately due.
- Corrected the obsolete debug-income test that expected a payout after one second.
- Added a focused economy cadence suite and a separate scenario-seeded browser contract.

### Verified - RA-P0-04 Worker Income Cadence

- `npx vitest run src/tests/engine/economy-cadence.test.ts src/tests/engine/outside-runtime.test.ts src/tests/content/outside-data.test.ts` (26 passed)
- `npm run build`
- `npm run lint`
- `npm run format:check`
- `npx playwright test src/tests/e2e/economy-cadence.spec.ts --project=chromium-1366` (1 passed)

### Fixed - RA-P0-02 Expedition Resource Authority

- Routed encounter, setpiece, and executioner costs through the active expedition's carried inventory, water, and HP while preserving Room, Outside, Global, and Marketing event costs on home stores.
- Unified World travel and combat HP through the expedition transaction and kept carried combat medicine isolated from home stock.
- Updated existing Scout and Swamp browser contracts to distinguish Room-origin costs from genuinely carried World supplies.
- Added focused Torch, Charm, Grenade, Medicine, water, HP, consecutive-combat, and Room-cost authority coverage.

### Verified - RA-P0-02 Expedition Resource Authority

- `npm test -- src/tests/engine/resource-authority.test.ts src/tests/engine/event-runtime.test.ts` (135 passed)
- `npx playwright test src/tests/e2e/expedition-resources.spec.ts --project=chromium-1366` (3 passed)
- `npm test` (382 passed)
- `npm run build`
- `npm run lint`
- `npm run format:check`
- `npm run test:e2e` (247 passed, 77 skipped)

### Fixed - RA-P0-03 Encounter Resumes World

- Routed terminal wilderness-encounter victory through CombatRuntime's existing scene-continuation outcome instead of the safe-return path.
- Preserved the active expedition draft, position, HP, water, carried supplies, and newly taken loot when leaving a won encounter.
- Kept setpiece terminal behavior, safe village return, and all death callbacks outside this package.
- Added engine coverage for the continuation callback, event close, session location, retained loot, and a successful subsequent World move.
- Added a fresh-run Chromium contract that reaches Compass through UI progression, triggers the encounter through the sixth World move, wins with visible controls, takes loot, leaves, and performs a seventh move.

### Verified - RA-P0-03 Encounter Resumes World

- `npm test -- src/tests/engine/game-session.test.ts src/tests/engine/event-runtime.test.ts src/tests/engine/combat-runtime.test.ts src/tests/engine/resource-authority.test.ts` (232 passed)
- `npx playwright test src/tests/e2e/app.spec.ts --project=chromium-1366 --grep "fresh-run: encounter victory"` (1 passed)
- `npm test` (383 passed)
- `npm run build`
- `npm run lint`
- `npm run format:check`
- `npm run test:e2e` (248 passed, 80 skipped)

### Fixed - RA-P0-05 Atomic Death and Cooldown

- Added one idempotent expedition death-abort boundary that restores the embark-time World draft before closing the expedition.
- Routed World survival death, Combat death, and lethal World-event HP costs through the same rollback, outfit-loss, Room-return, and cooldown contract.
- Blocked Path embark while World is active or the original 120-second death cooldown remains active.
- Added the visible Path embark countdown using the existing stable cooldown-button treatment.
- Added deterministic rollback, idempotence, lethal Combat/Event, and `119999/120000` boundary tests.
- Added a fresh-run Chromium contract that mutates an Old House, dies in its combat, verifies rollback and the visible cooldown, then re-embarks and sees the restored House.

### Verified - RA-P0-05 Atomic Death and Cooldown

- `npm test -- src/tests/engine/death-rollback.test.ts src/tests/engine/expedition-transaction.test.ts src/tests/engine/resource-authority.test.ts src/tests/engine/game-session.test.ts src/tests/engine/combat-runtime.test.ts src/tests/engine/event-runtime.test.ts` (240 passed)
- `npx playwright test src/tests/e2e/app.spec.ts --project=chromium-1366 --grep "fresh-run: death rolls back"` (1 passed)
- `npm test` (387 passed)
- `npm run build`
- `npm run lint`
- `npm run format:check`
- `npm run test:e2e` (249 passed, 83 skipped)

### Changed - Phase 8 Scope Closure

- Marked Phase 8 World Exploration as finalized for its scoped foundation: original World generation, movement, visibility, survival, random encounters, landmark-entry bridges, roads, Outpost use-state, mine safe-return consequences, and World-side Ship/Fabricator discovery consequences.
- Moved broader setpiece/outpost content to Phase 9, player-facing Ship/Fabricator modules to Phase 10/11, exhaustive Executioner content to Phase 12, and full World parity QA to Phase 14.

### Verified - Phase 8 Scope Closure

- `git diff --check`
- `npm run format:check`
- `npm run lint`
- `npm test`
- `npm run build`
- `npx playwright test`

### Added - Phase 8 Browser World Random Fight Cadence

- Added a Playwright-only RNG sequence hook for deterministic browser coverage of World random-fight movement.
- Added browser coverage proving movement does not trigger a random World encounter before the original fight delay, then triggers a World-selected encounter from normal movement after the delay and resets `game.world.fightMove`.

### Verified - Phase 8 Browser World Random Fight Cadence

- `npx playwright test src/tests/e2e/app.spec.ts -g "random World fight" --project=chromium-1366`
- `npm run format:check`
- `npm run lint`
- `npm test`
- `npm run build`
- `npx playwright test`

### Added - Phase 8 Browser Destroyed Village Cache

- Added Playwright coverage for visible `A Destroyed Village` World labeling, movement-based cache entry, original `enter`/`take` scene flow, prestige-store transfer, `previous.stores` clearing, and post-visit entry hiding.
- Narrowed the one-off landmark browser gap by bringing the Destroyed Village cache from organic GameSession coverage onto the player-facing World surface.

### Verified - Phase 8 Browser Destroyed Village Cache

- `npx playwright test src/tests/e2e/app.spec.ts -g "Destroyed Village cache" --project=chromium-1366`
- `npm run format:check`
- `npm run lint`
- `npm test`
- `npm run build`
- `npx playwright test`

### Added - Phase 8 Browser Executioner Command Deck Gate

- Added Playwright coverage for entering the already-cleared Executioner antechamber through normal World movement when Engineering, Medical, and Martial deck flags are complete.
- Proved the browser hides completed wing choices, exposes `command deck`, and enters the Command Deck route from the World-routed antechamber.

### Verified - Phase 8 Browser Executioner Command Deck Gate

- `npx playwright test src/tests/e2e/app.spec.ts -g "command deck through World movement" --project=chromium-1366`
- `npm run format:check`
- `npm run lint`
- `npm test`
- `npm run build`
- `npx playwright test`

### Added - Phase 8 Browser Executioner Return Visit

- Added Playwright coverage for returning to an already discovered Ravaged Battleship through normal World movement.
- Proved the browser-visible Executioner antechamber route exposes Engineering/Medical/Martial wing choices, keeps Command Deck hidden until wing flags are complete, and can enter the Medical Wing from the World-routed antechamber.

### Verified - Phase 8 Browser Executioner Return Visit

- `npx playwright test src/tests/e2e/app.spec.ts -g "executioner antechamber through World movement" --project=chromium-1366`
- `npm run format:check`
- `npm run lint`
- `npm test`
- `npm run build`
- `npx playwright test`

### Added - Phase 8 Browser Outpost Glyph Blocking

- Extended active Outpost browser coverage to prove that a used Outpost keeps its visible `P` map glyph while hiding its tooltip/entry for the current expedition.
- Extended the safe-return reset browser route to prove the same Outpost tooltip/entry returns after re-embark.

### Verified - Phase 8 Browser Outpost Glyph Blocking

- `npx playwright test src/tests/e2e/app.spec.ts -g "active World Outpost|resets used World Outposts" --project=chromium-1366`
- `npm run format:check`
- `npm run lint`
- `npm test`
- `npm run build`
- `npx playwright test`

### Added - Phase 8 Browser Generated Mine Route

- Added a test-harness state reader for Playwright-only inspection of generated World maps without replacing the generated map.
- Added Playwright coverage that buys a Compass, reads the real generated World map, routes through browser movement to a generated Iron Mine, proves the visible generated `Iron Mine` tooltip, enters the mine, and reaches the original combat start.

### Verified - Phase 8 Browser Generated Mine Route

- `npx playwright test src/tests/e2e/app.spec.ts -g "generated World mine" --project=chromium-1366`
- `npm run format:check`
- `npm run lint`
- `npm test`
- `npm run build`
- `npx playwright test`

### Added - Phase 8 Browser Swamp Wanderer

- Added Playwright coverage for visible `A Murky Swamp` World labeling, movement-based entry, Charm-gated wanderer talk, post-visit landmark hiding, safe return, and visible `gastronome` perk display on Path.
- Narrowed the one-off landmark browser gap while preserving the existing organic GameSession assertions for Charm spending and visited-map consequences.

### Verified - Phase 8 Browser Swamp Wanderer

- `npx playwright test src/tests/e2e/app.spec.ts -g "Swamp wanderer route" --project=chromium-1366`
- `npm run format:check`
- `npm run lint`
- `npm test`
- `npm run build`
- `npx playwright test`

### Added - Phase 8 Browser Old House Entry

- Added Playwright coverage for visible `An Old House` World labeling, movement-based entry, deterministic occupied-branch combat completion, and post-visit landmark hiding.
- Kept Old House supplies and water-refill assertions in the existing organic GameSession coverage while adding player-facing browser coverage for the visible World route.

### Verified - Phase 8 Browser Old House Entry

- `npx playwright test src/tests/e2e/app.spec.ts -g "Old House through World movement" --project=chromium-1366`
- `npm run format:check`
- `npm run lint`
- `npm test`
- `npm run build`
- `npx playwright test`

### Added - Phase 8 Browser Crashed Ship Discovery

- Added Playwright coverage for visible `A Crashed Starship` World labeling, movement-based entry into `A Crashed Ship`, original salvage action, post-discovery entry hiding, and visible road drawing.
- Kept the coverage inside Phase 8's World-side Ship discovery boundary without introducing player-facing Ship UI.

### Verified - Phase 8 Browser Crashed Ship Discovery

- `npx playwright test src/tests/e2e/app.spec.ts -g "Crashed Ship" --project=chromium-1366`
- `npm run format:check`
- `npm run lint`
- `npm test`
- `npm run build`
- `npx playwright test`

### Added - Phase 8 Browser Battlefield Salvage

- Added Playwright coverage for a visible `A Battlefield` World landmark, movement-based entry into `A Forgotten Battlefield`, deterministic scene loot pickup, and post-visit landmark hiding.
- Narrowed the one-off landmark browser gap beyond Borehole by proving the Battlefield salvage route on the player-facing World surface.

### Verified - Phase 8 Browser Battlefield Salvage

- `npx playwright test src/tests/e2e/app.spec.ts -g "Battlefield landmark" --project=chromium-1366`
- `npm run format:check`
- `npm run lint`
- `npm test`
- `npm run build`
- `npx playwright test`

### Added - Phase 8 Browser Terrain Narration

- Added Playwright coverage for visible original World terrain-transition narration from real movement through Forest to Field to Barrens.
- Locked the active World notification log against regressions where movement notifications existed in engine state but were not visible during travel.

### Changed - Post-Parity Bundle Optimization Tracking

- Added a Post-Parity release-hardening phase entry for revisiting Vite chunking after parity surfaces stabilize.
- Kept current Vite chunk-size warnings documented as non-blocking during Phase 8 parity work.

### Verified - Phase 8 Browser Terrain Narration

- `npx playwright test src/tests/e2e/app.spec.ts -g "terrain narration" --project=chromium-1366`
- `npm run format:check`
- `npm run lint`
- `npm test`
- `npm run build`
- `npx playwright test`

### Added - Phase 8 Browser World Notifications

- Exposed World-scoped notifications on the active World view using the shared notification log component so movement narration, danger, safer, starvation, thirst, and world-fade messages are visible while travelling.
- Extended the movement-driven danger browser test to prove the original `dangerous to be this far from the village without proper protection` and `safer here` notifications appear from real World movement.

### Verified - Phase 8 Browser World Notifications

- `npx playwright test src/tests/e2e/app.spec.ts -g "danger and safer transitions" --project=chromium-1366`
- `npm run format:check`
- `npm run lint`
- `npm test`
- `npm run build`
- `npx playwright test`

### Added - Phase 8 Browser Outpost Expedition Reset

- Added Playwright coverage for using an active World Outpost, safely returning to the village, embarking again, and re-entering the same Outpost after the per-expedition used state resets.
- Narrowed the Outpost polish gap by proving the reset contract on the player-facing World route instead of only through GameSession state coverage.

### Verified - Phase 8 Browser Outpost Expedition Reset

- `npx playwright test src/tests/e2e/app.spec.ts -g "resets used World Outposts" --project=chromium-1366`
- `npm run format:check`
- `npm run lint`
- `npm test`
- `npm run build`
- `npx playwright test`

### Added - Phase 8 Browser World Danger Movement

- Added Playwright coverage for reaching the original unarmoured World danger threshold through real movement, proving the browser shows `danger` at distance 8 and removes the visible World condition after moving back to distance 7.
- Narrowed the generated-map/player-facing interaction polish gap by covering the movement-driven danger status transition instead of only direct World status injection.

### Verified - Phase 8 Browser World Danger Movement

- `npx playwright test src/tests/e2e/app.spec.ts -g "danger and safer transitions" --project=chromium-1366`
- `npm run format:check`
- `npm run lint`
- `npm test`
- `npm run build`
- `npx playwright test`

### Added - Phase 8 Browser World Dehydration Death

- Added Playwright coverage for a real World travel move while already thirsting with no water, proving the browser returns to the Room, closes the World tab, and surfaces the original `the world fades` notification on dehydration death.
- Closed the browser-side gap between engine-level World thirst/dehydration death coverage and player-facing World movement death behavior.

### Verified - Phase 8 Browser World Dehydration Death

- `npx playwright test src/tests/e2e/app.spec.ts -g "dehydration death" --project=chromium-1366`
- `npm run format:check`
- `npm run lint`
- `npm test`
- `npm run build`
- `npx playwright test`

### Added - Phase 8 Browser Executioner World Entry

- Added Playwright coverage for a visible `A Ravaged Battleship` World map landmark and movement-based entry into the first-visit Executioner intro event.
- Narrowed the remaining Executioner Phase 8 gap by proving the player-facing World bridge into the Battleship, while keeping exhaustive wing traversal and Fabricator UI in later scoped work.

### Verified - Phase 8 Browser Executioner World Entry

- `npx playwright test src/tests/e2e/app.spec.ts -g "executioner battleship through World movement" --project=chromium-1366`

### Added - Phase 8 Browser World Starvation Death

- Added Playwright coverage for repeated World movement without Cured Meat, proving the browser surface shows the starvation condition, returns to the Room on World starvation death, closes the World tab, and surfaces the original `the world fades` notification.
- Closed the browser-side gap between engine-level World starvation/death coverage and player-facing World movement/death behavior.

### Verified - Phase 8 Browser World Starvation Death

- `npx playwright test src/tests/e2e/app.spec.ts -g "World starvation death" --project=chromium-1366`

### Added - Phase 8 Browser Mine Safe Return

- Added Playwright coverage for clearing a Coal Mine entered through normal World movement, resolving the full mine combat chain, leaving the cleared mine, returning safely to the village, and seeing the unlocked `coal miner` worker on the Outside panel.
- Closed the browser-side gap between Mine label-to-entry coverage and safe-return mine building/worker unlock consequences for the current Phase 8 slice.

### Verified - Phase 8 Browser Mine Safe Return

- `npx playwright test src/tests/e2e/app.spec.ts -g "coal mine and unlocks" --project=chromium-1366`

### Added - Phase 8 Browser One-Off Landmark Visit

- Added Playwright coverage for a player-facing World movement path into a visible Borehole landmark, proving the full 61x61 map exposes the original `A Borehole` tooltip label, starts the original `A Huge Borehole` setpiece, transfers Alien Alloy scene loot, and hides the landmark entry after the one-off visited consequence.
- Narrowed the remaining generated-map/player-facing map interaction gap by covering a non-mine, non-Outpost one-off landmark through normal World movement in the browser.

### Verified - Phase 8 Browser One-Off Landmark Visit

- `npx playwright test src/tests/e2e/app.spec.ts -g "one-off World landmark" --project=chromium-1366`

### Added - Phase 8 Browser Mine Landmark Entry

- Added Playwright coverage for a player-facing World movement path into a visible Mine landmark, proving the full 61x61 map exposes the original `Coal Mine` tooltip label and that moving onto the mine starts the original `The Coal Mine` setpiece through the World bridge.
- Narrowed the remaining generated-map/player-facing map interaction gap by covering landmark-label-to-auto-entry behavior in the browser instead of only direct setpiece triggering.

### Verified - Phase 8 Browser Mine Landmark Entry

- `npx playwright test src/tests/e2e/app.spec.ts -g "World mine landmark" --project=chromium-1366`

### Added - Phase 8 Browser Active Outpost Use

- Added Playwright coverage for entering an active World Outpost through normal World movement, proving the browser surface opens the original Outpost event, applies water replenishment to the visible World status, exposes original Cured Meat scene loot, and hides the landmark entry after the Outpost is used for the current expedition.
- Narrowed the remaining Outpost Phase 8 gap to broader traversal polish rather than the core active-use browser contract.

### Verified - Phase 8 Browser Active Outpost Use

- `npx playwright test src/tests/e2e/app.spec.ts -g "active World Outpost" --project=chromium-1366`

### Added - Phase 8 Browser Scout Map Reveal

- Added Playwright coverage for buying the Scout `buy map` action from an active World expedition, proving the player-facing event dialog can spend the original map resources, reveal the visible World map, and surface the original map-uncover notification after returning to the Room view.
- Verified that a fully revealed World state hides the Scout `buy map` button in the browser while leaving the scouting training option available, closing the Scout map player-facing interaction gap for the current World slice.

### Verified - Phase 8 Browser Scout Map Reveal

- `npx playwright test src/tests/e2e/app.spec.ts -g "buys the Scout map" --project=chromium-1366`

### Added - Phase 8 Organic Executioner Martial Clear

- Added GameSession regression coverage for organically routing from World movement into the return-visit Ravaged Battleship antechamber, clearing the Martial armory/training-complex path through grenade door access, weapon loot, turret combat, plasma-rifle blueprint loot, murderous-robot combat, and setting the original `game.world.martial` deck flag.
- Hardened the shared long-combat test helper so Shield is reserved for active dangerous enemy statuses instead of being consumed as a generic low-health action before energised attacks.
- Verified that the cleared Martial wing is removed from the return antechamber while Engineering and Medical remain available, closing the remaining organic Executioner wing-clear coverage gap for Phase 8.

### Verified - Phase 8 Organic Executioner Martial Clear

- `npm run format:check`
- `npm run lint`
- `npm test -- src/tests/engine/game-session.test.ts -t "martial wing organically"`
- `npm test`
- `npm run build`

### Added - Phase 8 Organic Executioner Medical Clear

- Added GameSession regression coverage for organically routing from World movement into the return-visit Ravaged Battleship antechamber, clearing the Medical guardians/strategy-room/cold-storage path through turret, medic, quadruped, unstable-automaton, malformed-experiment combat, and setting the original `game.world.medical` deck flag.
- Verified that the cleared Medical wing is removed from the return antechamber while Engineering and Martial remain available, narrowing the remaining Executioner Phase 8 traversal gap to Martial organic clear and broader polish.

### Verified - Phase 8 Organic Executioner Medical Clear

- `npm run format:check`
- `npm run lint`
- `npm test -- src/tests/engine/game-session.test.ts -t "medical wing organically"`
- `npm test`
- `npm run build`

### Added - Phase 8 Organic Executioner Engineering Clear

- Added GameSession regression coverage for organically routing from World movement into the return-visit Ravaged Battleship antechamber, clearing the Engineering Assembly/R&D path through welder, guard, turret, hypo-blueprint, and unstable-prototype combat, and setting the original `game.world.engineering` deck flag.
- Verified that the cleared Engineering wing is removed from the return antechamber while Medical and Martial remain available, narrowing the remaining Executioner Phase 8 traversal gap to deeper Medical/Martial organic clears and broader polish.

### Verified - Phase 8 Organic Executioner Engineering Clear

- `npm run format:check`
- `npm run lint`
- `npm test -- src/tests/engine/game-session.test.ts -t "engineering wing organically"`
- `npm test`
- `npm run build`

### Added - Phase 8 Organic Executioner Wing Entry

- Added GameSession regression coverage for organically entering the return-visit Ravaged Battleship antechamber from World movement and routing into the Engineering, Medical, and Martial wing entry events.
- Narrowed the remaining Executioner Phase 8 gap from basic wing reachability to deeper wing traversal polish beyond the already covered intro, wing entry, and Command Deck clear paths.

### Verified - Phase 8 Organic Executioner Wing Entry

- `npm run format:check`
- `npm run lint`
- `npm test -- src/tests/engine/game-session.test.ts -t "executioner antechamber into"`
- `npm test`
- `npm run build`

### Added - Phase 8 World Keyboard Movement Coverage

- Extracted the World keyboard movement mapping for Arrow keys and WASD into a pure UI helper while preserving the existing `WorldView` behavior.
- Added pure UI regression coverage for original-compatible Arrow/WASD movement keys and ignored non-movement keys.
- Added browser coverage proving focused World movement with keyboard input moves away from the village and returns safely with the original village-tile auto-return contract.

### Verified - Phase 8 World Keyboard Movement Coverage

- `npm test -- src/tests/ui/world-view.test.ts`
- `npx playwright test src/tests/e2e/app.spec.ts -g "moves the World map with keyboard input" --project=chromium-1366`

### Added - Phase 8 Converted Outpost Use Coverage

- Added shared GameSession regression coverage for immediately using organically converted Cave/Town/City/Battleship Outposts after the active clear consequence.
- Verified original converted-Outpost water refill, coordinate-specific used-Outpost state, hidden landmark state, and repeat-entry blocking for the current expedition across dungeon and final Battleship conversions.

### Verified - Phase 8 Converted Outpost Use Coverage

- `npm test -- src/tests/engine/game-session.test.ts -t "Town clinic|City sniper|executioner command deck organically"`

### Added - Phase 8 Generated-Map Mine Reachability

- Added GameSession regression coverage that buys the Compass, uses the generated original World map, locates generated Iron/Coal/Sulphur Mines, enters each through normal World movement from an adjacent tile, clears the setpiece, applies original road/visited consequences, returns safely to the village, and commits original mine building plus worker unlock state on safe return.
- Narrowed the remaining generated-map mine gap to broader player-facing map interaction/UI polish instead of mine reachability or mine-safe-return consequences.

### Verified - Phase 8 Generated-Map Mine Reachability

- `npm test -- src/tests/engine/game-session.test.ts -t "reaches a generated"`

### Added - Phase 8 Organic Mine Safe-Return Coverage

- Added GameSession regression coverage for organically clearing Coal and Sulphur Mine landmarks, leaving the setpiece, following the active mine road back to the village, and committing original mine building plus worker unlock state on safe return.
- Closed the previous organic safe-return coverage gap where Iron Mine had the full return-to-village contract while Coal and Sulphur only covered active road/visited consequences.

### Verified - Phase 8 Organic Mine Safe-Return Coverage

- `npm test -- src/tests/engine/game-session.test.ts -t "building and worker unlocks after organic"`

### Added - Phase 8 Organic Executioner Reachability

- Added GameSession regression coverage for reaching the Ravaged Battleship by stepping onto an original Executioner World tile instead of triggering the event directly.
- Covered the focused first-visit Executioner intro path through ancient-beast combat, automated-turret combat, device discovery, `game.world.executioner` state, and safe-return Fabricator discovery notification.
- Added organic return-visit Executioner coverage for routing from the World tile into the antechamber, entering Command Deck after the three wing flags are set, defeating the immortal wanderer, setting `game.world.executionerCleared`, and converting the active Battleship tile into a road-connected Outpost.
- Kept broader Executioner traversal parity out of Phase 8 closure until the remaining player traversal routes are explicitly covered.

### Verified - Phase 8 Organic Executioner Reachability

- `npm test -- src/tests/engine/game-session.test.ts -t "executioner intro organically"`
- `npm test -- src/tests/engine/game-session.test.ts -t "executioner command deck organically"`

### Changed - Phase 8 Ship/Fabricator Scope Boundary

- Decided that Phase 8 owns only World-side Ship/Fabricator discovery consequences: Ship direction, Ship unlock/base state on safe return, and Fabricator unlock notification from Executioner discovery.
- Kept player-facing Ship controls in Phase 10 and player-facing Fabricator controls in Phase 11, so Phase 8 can close around World exploration instead of expanding into late-game module UI.
- Updated the plan, context, status, parity checklist, UI spec, and technical decisions to make this boundary explicit.

### Added - Phase 8 World Condition Status UI

- Exposed original World `danger`, `starvation`, and `thirst` runtime flags through the World snapshot.
- Added a compact player-facing World status row for active danger, starvation, and thirst conditions without changing the original notification, movement, or death/perk rules.
- Added pure UI label coverage, session snapshot coverage for danger transitions, and browser coverage for the visible World condition status row.

### Verified - Phase 8 World Condition Status UI

- `npm test -- src/tests/ui/world-view.test.ts src/tests/engine/game-session.test.ts`
- `npx playwright test src/tests/e2e/app.spec.ts -g "World danger and supply condition status" --project=chromium-1366`

### Added - Phase 8 World Map Swipe Movement

- Added original World map swipe movement on the 61x61 ASCII map through pointer drag gestures, mapping left/right/up/down swipes to the same directions as the original handlers.
- Suppressed the follow-up click after a recognized swipe so one drag cannot accidentally apply both swipe movement and map-click movement.
- Added pure UI coverage for swipe direction thresholds plus browser coverage for swipe-to-move and swipe-back village auto-return.

### Verified - Phase 8 World Map Swipe Movement

- `npm test -- src/tests/ui/world-view.test.ts`
- `npx playwright test src/tests/e2e/app.spec.ts -g "swiping the World map" --project=chromium-1366`
- `npm run format:check`
- `npm run lint`
- `npm test`
- `npm run build`

### Added - Phase 8 World Map Tooltips

- Added original-style World map tooltip metadata for the current `Wanderer`, visible `The Village`, and visible unconsumed landmark cells on the 61x61 ASCII map.
- Rendered labelled map cells as landmark spans with original-style stronger glyph styling while keeping the full ASCII map geometry stable.
- Extended engine and browser coverage for tooltip labels, including visited landmark glyphs that correctly stop exposing landmark tooltips.

### Verified - Phase 8 World Map Tooltips

- `npm test -- src/tests/engine/game-session.test.ts -t "full World map"`
- `npm test -- src/tests/ui/world-view.test.ts`
- `npx playwright test src/tests/e2e/app.spec.ts -g "clicking the World map" --project=chromium-1366`
- `npx playwright test src/tests/e2e/room-visual.spec.ts -g "world movement visual"`
- `npm run format:check`
- `npm run lint`
- `npm test`
- `npm run build`

### Added - Phase 8 World Map Click Movement

- Ported the original World map click-quadrant movement behavior onto the player-facing 61x61 ASCII map.
- Added pure UI coverage for the original diagonal click quadrants plus browser coverage proving map-click east movement and village-tile auto-return by clicking back west.

### Verified - Phase 8 World Map Click Movement

- `npm test -- src/tests/ui/world-view.test.ts`
- `npx playwright test src/tests/e2e/app.spec.ts -g "clicking the World map" --project=chromium-1366`
- `npm run format:check`
- `npm run lint`
- `npm test`
- `npm run build`

### Added - Phase 8 Full World Map Rendering

- Replaced the player-facing 9x9 World viewport snapshot with the original full 61x61 mask-rendered World map surface while preserving hidden tiles as blank space, current-position `@`, and single-character glyphs for visited landmarks.
- Tightened the World map CSS to keep the full ASCII map, status, and movement controls inside the established desktop visual baseline.
- Updated browser flows to rely on the implemented original village-tile auto-return contract instead of clicking an obsolete manual return after stepping back onto the village.

### Verified - Phase 8 Full World Map Rendering

- `npm test -- src/tests/engine/game-session.test.ts -t "full World map"`
- `npm test -- src/tests/engine/game-session.test.ts`
- `npx playwright test src/tests/e2e/app.spec.ts -g "Compass to Path to World contract" --project=chromium-1366`
- `npx playwright test src/tests/e2e/app.spec.ts -g "Compass to Path to World contract" --project=chromium-3840`
- `npx playwright test src/tests/e2e/app.spec.ts -g "fresh room to Path" --project=chromium-1920`
- `npx playwright test src/tests/e2e/room-visual.spec.ts -g "world movement visual"`
- `npm run format:check`
- `npm run lint`
- `npm test`
- `npm run build`

### Added - Phase 8 Converted Outpost Use

- Extended the organic Cave clear regression so the newly converted road-connected Outpost can be entered immediately during the same expedition.
- Locked converted Outposts against regressions where dungeon clears changed the map glyph but the resulting Outpost did not replenish water, record coordinate-specific used state, or block repeat entry for the current expedition.

### Verified - Phase 8 Converted Outpost Use

- `npm test -- src/tests/engine/game-session.test.ts -t "organically cleared Cave"`
- `npm test -- src/tests/engine/game-session.test.ts`
- `npm run format:check`
- `npm run lint`
- `npm test`
- `npm run build`

### Added - Phase 8 Organic City Sniper To Outpost

- Added GameSession regression coverage for stepping onto a City landmark, deterministically routing to `setpiece.city-sniper`, clearing the sniper combat route, setting `game.world.citySniperCleared`, and converting the active World tile into a road-connected Outpost.
- Locked the organic City dungeon-to-Outpost path against regressions where direct cleared flags converted City tiles correctly but the player-facing World traversal skipped combat clear or map conversion.

### Verified - Phase 8 Organic City Sniper To Outpost

- `npm test -- src/tests/engine/game-session.test.ts -t "City sniper"`
- `npm test -- src/tests/engine/game-session.test.ts`
- `npm run format:check`
- `npm run lint`
- `npm test`
- `npm run build`

### Added - Phase 8 Organic Town Clinic To Outpost

- Added GameSession regression coverage for stepping onto a Town landmark, deterministically routing to `setpiece.town-clinic`, spending the original Torch cost, taking Medicine scene loot, setting `game.world.townClinicCleared`, and converting the active World tile into a road-connected Outpost.
- Locked the organic Town dungeon-to-Outpost path against regressions where direct cleared flags converted Town tiles correctly but the player-facing World traversal skipped Torch cost, loot, or map conversion.

### Verified - Phase 8 Organic Town Clinic To Outpost

- `npm test -- src/tests/engine/game-session.test.ts -t "Town clinic"`
- `npm test -- src/tests/engine/game-session.test.ts`
- `npm run format:check`
- `npm run lint`
- `npm test`
- `npm run build`

### Added - Phase 8 Organic Cave Clear To Outpost

- Added GameSession regression coverage for stepping onto a Cave landmark, auto-entering the routed `setpiece.cave-depths` event, clearing the beast and cave-lizard combat chain, setting `game.world.caveDepthsCleared`, and converting the active World tile into a road-connected Outpost.
- Locked the organic dungeon-to-Outpost path against regressions where direct cleared flags converted Cave tiles correctly but the player-facing World traversal failed to reach or apply the clear consequence.

### Verified - Phase 8 Organic Cave Clear To Outpost

- `npm test -- src/tests/engine/game-session.test.ts -t "organically cleared Cave"`
- `npm test -- src/tests/engine/game-session.test.ts`
- `npm run format:check`
- `npm run lint`
- `npm test`
- `npm run build`

### Added - Phase 8 Organic Old House Supplies

- Added GameSession regression coverage for stepping onto an Old House landmark, auto-entering the routed setpiece, taking the original supplies branch, applying water replenishment through the session update boundary, taking scene loot, and marking the landmark visited during active World exploration.
- Locked the organic Old House supplies path against regressions where focused EventRuntime loot and direct water flags worked but the player-facing World auto-entry path skipped refill, loot, or landmark consumption.

### Verified - Phase 8 Organic Old House Supplies

- `npm test -- src/tests/engine/game-session.test.ts -t "Old House"`
- `npm test -- src/tests/engine/game-session.test.ts`
- `npm run format:check`
- `npm run lint`
- `npm test`
- `npm run build`

### Added - Phase 8 Organic Swamp Wanderer

- Added GameSession regression coverage for stepping onto a Swamp landmark, auto-entering the routed setpiece, spending the original Charm cost with the wanderer, unlocking `gastronome`, and applying the visited-map consequence during the active World expedition.
- Locked the organic Swamp path against regressions where focused EventRuntime traversal granted the perk but the player-facing World auto-entry path skipped the perk, Charm cost, or landmark consumption.

### Verified - Phase 8 Organic Swamp Wanderer

- `npm test -- src/tests/engine/game-session.test.ts`
- `npm run format:check`
- `npm run lint`
- `npm test`
- `npm run build`

### Added - Phase 8 Organic Destroyed Village Cache

- Added GameSession regression coverage for stepping onto a Destroyed Village cache landmark, auto-entering the routed setpiece, collecting the underground cache, transferring original prestige stores, clearing `previous.stores`, and applying the visited-map consequence during the active World expedition.
- Locked the organic cache path against regressions where focused EventRuntime traversal moved prestige stores correctly but the player-facing World auto-entry path skipped cache collection or landmark consumption.

### Verified - Phase 8 Organic Destroyed Village Cache

- `npm test -- src/tests/engine/game-session.test.ts`
- `npm run format:check`
- `npm run lint`
- `npm test`
- `npm run build`

### Added - Phase 8 Organic Battlefield Salvage

- Added GameSession regression coverage for stepping onto a Battlefield landmark, auto-entering the routed setpiece, rolling original salvage loot, taking selected original supplies into the outfit, and applying the visited-map consequence during the active World expedition.
- Locked the organic Battlefield path against regressions where focused EventRuntime scene loot worked but the player-facing World auto-entry path skipped salvage or landmark consumption.

### Verified - Phase 8 Organic Battlefield Salvage

- `npm test -- --run src/tests/engine/game-session.test.ts`
- `npm run format:check`
- `npm run lint`
- `npm test`
- `npm run build`

### Added - Phase 8 Organic Borehole Salvage

- Added GameSession regression coverage for stepping onto a Borehole landmark, auto-entering the routed setpiece, taking original Alien Alloy scene loot into the outfit, and applying the visited-map consequence during the active World expedition.
- Locked the organic Borehole path against regressions where focused EventRuntime scene loot worked but the player-facing World auto-entry path skipped salvage or landmark consumption.

### Verified - Phase 8 Organic Borehole Salvage

- `npm test -- --run src/tests/engine/game-session.test.ts`
- `npm run format:check`
- `npm run lint`
- `npm test`
- `npm run build`

### Added - Phase 8 Organic Crashed Ship Discovery

- Added GameSession regression coverage for stepping onto a Crashed Ship landmark, auto-entering the routed setpiece, salvaging it, and applying original Crashed Ship road plus visited-map consequences during the active World expedition.
- Locked the organic Ship-discovery path against regressions where direct flag injection drew roads but the player-facing World setpiece route failed to mark the ship discovered.

### Verified - Phase 8 Organic Crashed Ship Discovery

- `npm test -- --run src/tests/engine/game-session.test.ts`
- `npm run format:check`
- `npm run lint`
- `npm test`
- `npm run build`

### Added - Phase 8 Organic Outpost Supplies

- Added GameSession regression coverage for stepping onto an Outpost from World movement, auto-entering the routed setpiece, taking original Cured Meat scene loot into the outfit, replenishing water, and marking the coordinate-specific Outpost used for the current expedition.
- Locked the organic Outpost path against regressions where focused EventRuntime scene loot worked but the player-facing World auto-entry path skipped supplies or used-state consequences.

### Verified - Phase 8 Organic Outpost Supplies

- `npm test -- --run src/tests/engine/game-session.test.ts`
- `npm run format:check`
- `npm run lint`
- `npm test`
- `npm run build`

### Added - Phase 8 Organic Mine Safe-Return Unlock

- Added GameSession regression coverage for clearing an Iron Mine through organic World movement, following the generated mine road back to the village, and committing the original mine building plus worker unlock state on safe return.
- Locked the end-to-end mine contract against regressions where active road/visited consequences passed but `World.goHome()` mine-building consequences were only covered by direct flag injection.

### Verified - Phase 8 Organic Mine Safe-Return Unlock

- `npm test -- --run src/tests/engine/game-session.test.ts`
- `npm run format:check`
- `npm run lint`
- `npm test`
- `npm run build`

### Added - Phase 8 Organic Coal and Sulphur Mine Traversal

- Added GameSession regression coverage for stepping onto Coal Mine and Sulphur Mine landmarks, auto-entering their routed setpieces, clearing their chained combat scenes, and applying original mine road plus visited-map consequences during the active World expedition.
- Added a local combat helper for deterministic multi-stage mine setpiece traversal without changing production runtime behavior.

### Verified - Phase 8 Organic Coal and Sulphur Mine Traversal

- `npm test -- --run src/tests/engine/game-session.test.ts`
- `npm run format:check`
- `npm run lint`
- `npm test`
- `npm run build`

### Added - Phase 8 Organic Mine Clear Traversal

- Added GameSession regression coverage for stepping onto an Iron Mine landmark, auto-entering the routed setpiece, clearing the beastly matriarch through combat, and applying original mine road plus visited-map consequences during the active World expedition.
- Locked the organic player-facing path against regressions where focused mine setpiece flags were set but the active World road/visited consequences were only covered through direct state injection.

### Verified - Phase 8 Organic Mine Clear Traversal

- `npm test -- --run src/tests/engine/game-session.test.ts`
- `npm run format:check`
- `npm run lint`
- `npm test`
- `npm run build`

### Added - Phase 8 Landmark Auto Entry

- Aligned World movement with original `World.doSpace()` landmark handling so stepping onto an unconsumed landmark tile starts its routed setpiece immediately.
- Updated Outpost traversal regressions for automatic entry while preserving used-Outpost re-entry blocking and per-expedition reset coverage.

### Verified - Phase 8 Landmark Auto Entry

- `npm test -- --run src/tests/engine/game-session.test.ts`
- `npm run format:check`
- `npm run lint`
- `npm test`
- `npm run build`

### Added - Phase 8 Village Auto Return

- Aligned World movement with original `World.doSpace()` village handling so stepping back onto the village tile performs the safe home return immediately.
- Added GameSession regression coverage proving movement into the village closes the active World expedition, returns carried supplies, and emits the safe-return notification.

### Verified - Phase 8 Village Auto Return

- `npm test -- --run src/tests/engine/game-session.test.ts`
- `npm run format:check`
- `npm run lint`
- `npm test`
- `npm run build`

## 2026-07-08

### Added - Phase 8 Travel Tile Supply Gating

- Aligned World movement with original `World.doSpace()` travel gating so food, water, and random-fight ticks only run on travel tiles, not when entering the village or landmark tiles.
- Updated safe-return and survival regression coverage to use explicit travel-tile paths, and added coverage proving village/Outpost movement does not advance supply counters.

### Verified - Phase 8 Travel Tile Supply Gating

- `npm test -- --run src/tests/engine/game-session.test.ts`
- `npm run format:check`
- `npm run lint`
- `npm test`
- `npm run build`

### Added - Phase 8 Terrain Movement Narration

- Added the original World terrain transition notifications for forest/field/barrens movement in both directions.
- Added GameSession regression coverage for all six original terrain transition messages during deterministic World movement.

### Verified - Phase 8 Terrain Movement Narration

- `npm test -- --run src/tests/engine/game-session.test.ts`
- `npm run format:check`
- `npm run lint`
- `npm test`
- `npm run build`

### Added - Phase 8 Safe-Return Map Completion

- Added the original `World.goHome()` map-completion check so safe village return evaluates the persisted World mask and sets `game.world.seenAll` after normal exploration reveals the last hidden tile.
- Added GameSession regression coverage for uncovering the final hidden mask tile through movement and committing `seenAll` on safe return.

### Verified - Phase 8 Safe-Return Map Completion

- `npm test -- --run src/tests/engine/game-session.test.ts`
- `npm run format:check`
- `npm run lint`
- `npm test`
- `npm run build`

### Added - Phase 8 Outpost Expedition Reset

- Reset active used-Outpost coordinates on each World embark so Outposts are consumed once per expedition instead of permanently across safe returns.
- Added GameSession regression coverage proving an Outpost used during one safe expedition is available again after returning home and embarking again.

### Verified - Phase 8 Outpost Expedition Reset

- `npm test -- --run src/tests/engine/game-session.test.ts`
- `npm run format:check`
- `npm run lint`
- `npm test`
- `npm run build`

### Added - Phase 8 Executioner Clear Consequence

- Added the original final Command Deck `clearDungeon` consequence for focused Executioner command routes: defeating the immortal wanderer now marks the Battleship cleared.
- Wired cleared Executioner world state into active World map consequences so the Ravaged Battleship tile becomes a road-connected Outpost.
- Added EventRuntime and GameSession regression coverage for the final Executioner clear flag and active World map conversion.

### Verified - Phase 8 Executioner Clear Consequence

- `npm run format:check`
- `npm test -- --run src/tests/engine/game-session.test.ts src/tests/engine/event-runtime.test.ts`
- `npm run lint`
- `npm test`
- `npm run build`

### Added - Phase 8 Landmark Clear Consequences

- Added original active World `clearDungeon` consequences for cleared Cave/Town/City setpieces: the current landmark becomes a road-connected Outpost instead of remaining re-enterable.
- Added original visited-map handling for non-dungeon landmarks, including Old House, Swamp, Borehole, Battlefield, Destroyed Village cache, and Crashed Ship; Crashed Ship discovery now also draws its original road during active exploration.
- Added active World water replenishment consumption for setpiece flags such as Outpost and Old House, and covered the newly wired Cave/Town/City clear flags in EventRuntime tests.
- Added session regression coverage for dungeon-to-Outpost road conversion, Crashed Ship road/visited consequences, and non-dungeon visited plus water refill behavior.

### Verified - Phase 8 Landmark Clear Consequences

- `npm run format:check`
- `npm test -- --run src/tests/engine/game-session.test.ts src/tests/engine/event-runtime.test.ts`
- `npm run lint`
- `npm test`
- `npm run build`

### Added - Phase 8 Scout Map Reveal Bridge

- Wired the Scout `buy map` event into the World runtime capability boundary so map purchases reveal a random hidden World mask tile with the original radius-5 diamond uncover behavior.
- Added World `seenAll` testing after Scout map purchases so the buy-map button disappears once the persisted visibility mask is fully revealed.
- Added session regression coverage proving Scout map purchases spend resources, send the original notification, update `game.world.mask`, and hide the map button at full reveal.

### Verified - Phase 8 Scout Map Reveal Bridge

- `npm run format:check`
- `npm run lint`
- `npm test -- --run src/tests/engine/game-session.test.ts src/tests/engine/event-runtime.test.ts`
- `npm test`
- `npm run build`

### Added - Phase 8 Ship and Fabricator Discovery State

- Added original safe-return Ship discovery consequences: `features.location.spaceShip` unlock plus base Ship hull/thruster initialization.
- Added original safe-return Fabricator discovery consequences from the Executioner world flag, including the original builder notification.
- Added session regression coverage for Ship/Fabricator discovery commit and preserving existing Ship upgrade state on later safe returns.

### Verified - Phase 8 Ship and Fabricator Discovery State

- `npm run format:check`
- `npm run lint`
- `npm test -- --run src/tests/engine/game-session.test.ts`
- `npm test`
- `npm run build`

### Added - Phase 8 World Danger and Fight Cadence

- Ported original World random encounter cadence using `FIGHT_DELAY`, `FIGHT_CHANCE`, and the `stealthy` perk before routing into the existing terrain/distance encounter bridge.
- Switched World distance calculations to original Manhattan distance for encounter bands, danger thresholds, and the visible World distance value.
- Added original danger and safer notifications when crossing armour/distance thresholds.
- Added session regression coverage for delayed fight triggering, `stealthy` chance suppression, and danger/safer notification transitions.

### Verified - Phase 8 World Danger and Fight Cadence

- `npm run format:check`
- `npm run lint`
- `npm test -- --run src/tests/engine/game-session.test.ts`
- `npm test`
- `npm run build`

### Added - Phase 8 World Supply Death Loop

- Ported the original World food/water movement loop for `slow metabolism`, `desert rat`, Cured Meat healing, `gastronome`, starvation, thirst, world-fade death, death counters, and tenth-death survival perk unlocks.
- Added session regression coverage for travel healing, perk-adjusted food cadence, starvation room-return death, and dehydration-based `desert rat` unlock.

### Verified - Phase 8 World Supply Death Loop

- `npm run format:check`
- `npm run lint`
- `npm test -- --run src/tests/engine/game-session.test.ts`
- `npm test`
- `npm run build`

### Added - Phase 8 Outpost and Mine Return Consequences

- Added original safe-return mine building unlocks for cleared iron, coal, and sulphur mines so Outside worker unlock state can follow World exploration.
- Added active Outpost use consequences: World water refills to the current max, used Outposts are tracked by coordinate, and consumed Outposts no longer expose landmark entry.
- Added session regression coverage for mine building unlocks, worker unlock state, active Outpost replenishment, and repeat-entry blocking.

### Verified - Phase 8 Outpost and Mine Return Consequences

- `npm run format:check`
- `npm run lint`
- `npm test -- --run src/tests/engine/game-session.test.ts`
- `npm test`
- `npm run build`

### Added - Phase 8 Mine Road Consequences

- Ported the original World mine-road drawing algorithm, including closest road/village/outpost anchor search and L-shaped terrain-to-road conversion.
- Added visited-marker handling for cleared mine tiles while keeping the compact World ASCII viewport to one glyph per cell.
- Wired active World exploration so cleared mine flags apply original road and visited-map consequences through the session update boundary.

### Verified - Phase 8 Mine Road Consequences

- `npm test -- --run src/tests/content/world-data.test.ts`
- `npm test -- --run src/tests/engine/game-session.test.ts`

### Added - Phase 7 Roast Report Recommendations

- Added an active-expedition guard to World home return and regression coverage proving a second inactive return does not duplicate stores.
- Replaced the fixed first World landmark slice with original 61x61 map generation, original terrain stickiness/probabilities, original landmark counts/radii, original visibility mask behavior, and stored ship direction for Compass messaging.
- Added generated-artifact lint ignores, viewport-extreme Compass/Path/World smoke coverage, phase-specific status docs, stale Phase 7 heading cleanup, and an explicit Vite chunk-warning policy.

### Verified - Phase 7 Roast Report Recommendations

- `npm run build`
- `npm test`
- `npm run lint`
- `npm run format:check`
- `npx playwright test`

### Finalized - Phase 7 Path and Outfitting

- Closed Phase 7 for the Path/outfitting scope after the organic Compass reveal guard, original supply/control rendering, carryable ordering/metadata, outfit normalization, upgrade priority, safe-return, repeated-embark, and full carryable-list overflow hardening were all covered.
- Updated project status docs so remaining full World arrival, map generation, ship placement, landmark distribution, and home-return world-state consequences are tracked under Phase 8 instead of Phase 7.

### Verified - Phase 7 Path and Outfitting

- `npm run build`
- `npm test`
- `npm run lint`
- `npm run format:check`
- `npx playwright test`

### Added - Phase 7 Organic Compass Reveal Guard

- Extended the fresh-room-to-Path browser scenario to assert the original `the compass points ...` reveal message after buying the Compass through normal gameplay progression.
- Added an organic Compass store-tooltip guard that verifies the visible store row uses the same original direction message before entering Path.

### Verified - Phase 7 Organic Compass Reveal Guard

- `npx playwright test src/tests/e2e/app.spec.ts -g "plays organically from fresh room to Path" --project=chromium-1920`

### Added - Phase 7 Original Path Control Rendering

- Changed Path supply rows to match the original row value model by showing only the carried outfit count in the row while keeping available store count in the tooltip.
- Replaced Path supply text controls with original-style single/many arrow controls while preserving accessible `+1`, `-1`, `+10`, and `-10` button names.
- Added browser coverage that guards against regressing to `outfit/store` row text while keeping the `+10` control reachable.
- Regenerated and re-verified Path visual baselines at 1366, 1920, 2560, and 3840 widths after the intended control rendering change.

### Verified - Phase 7 Original Path Control Rendering

- `npm run build`
- `npx playwright test src/tests/e2e/app.spec.ts -g "full Path outfitting" --project=chromium-1920`
- `npx playwright test src/tests/e2e/room-visual.spec.ts -g "path outfitting" --update-snapshots`
- `npx playwright test src/tests/e2e/room-visual.spec.ts -g "path outfitting"`

### Added - Phase 7 Return and Re-Embark Hardening

- Added session regression coverage for repeated safe expeditions so remaining carried Cured Meat is reserved again on the next embark without duplicating stores.
- Added session regression coverage for the all-food-consumed return case, keeping Path visible but preventing re-embark when no Cured Meat remains.

### Verified - Phase 7 Return and Re-Embark Hardening

- `npm test -- src/tests/engine/game-session.test.ts`

### Added - Phase 7 Path Visual Overflow Hardening

- Added original-style bounded scrolling to the Path play column so a full original carryable outfitting list stays inside the 700px desktop play area without horizontal overflow.
- Added browser coverage for the full Path carryable list, verifying internal vertical scrolling, stable width, and no document-level horizontal overflow.
- Regenerated and re-verified Path visual baselines at 1366, 1920, 2560, and 3840 widths after the intended scroll-container change.

### Verified - Phase 7 Path Visual Overflow Hardening

- `npm run build`
- `npx playwright test src/tests/e2e/app.spec.ts -g "full Path outfitting" --project=chromium-1920`
- `npx playwright test src/tests/e2e/room-visual.spec.ts -g "path outfitting" --update-snapshots`
- `npx playwright test src/tests/e2e/room-visual.spec.ts -g "path outfitting"`

### Added - Phase 7 Compass Store Tooltip

- Added original-style Compass store-row tooltip text through the shared stores panel, using the same Path compass direction source as the reveal notification.
- Wired the Compass direction through Room, Outside, and Path stores views so the tooltip stays available wherever the shared stores panel is visible.
- Added browser coverage for the Compass store tooltip direction while preserving store grouping and hidden-upgrade behavior.

### Verified - Phase 7 Compass Store Tooltip

- `npm run build`
- `npx playwright test src/tests/e2e/app.spec.ts -g "groups stores" --project=chromium-1920`

### Added - Phase 7 Outfit Invariant and Control Hardening

- Added Path-side outfit normalization matching original outfitting behavior: carryable outfit counts are clamped to available stores before Path display/actions/embark, while active World expeditions are not clamped.
- Adjusted Path `+10`/`-10` control flags to match original behavior: the many-control is enabled whenever the matching one-step control can act, and the action itself clamps to the available amount.
- Added session regression coverage for overlarge/negative outfit normalization, active-World non-clamping, and many-control one-item edge cases.

### Verified - Phase 7 Outfit Invariant and Control Hardening

- `npm test -- src/tests/engine/game-session.test.ts`
- `npm run build`

### Added - Phase 7 Compass Direction Hardening

- Added the original `World.compassDir` direction formula as `originalWorldCompassDirection` with coverage for axial and diagonal thresholds.
- Added state-driven Path compass direction snapshots from stored ship direction or ship-relative coordinates, with a safe `north` fallback until full Phase 8 ship placement exists.
- Changed successful Compass purchases through the session command boundary to reveal Path and emit `the compass points ...` immediately, while avoiding duplicate reveal notifications when the player later opens Path.

### Verified - Phase 7 Compass Direction Hardening

- `npm test -- src/tests/content/world-data.test.ts src/tests/engine/game-session.test.ts`
- `npm run build`

### Added - Phase 7 Path Upgrade and Reachability Hardening

- Added a Path command-boundary guard so only original carryable supplies can be moved into or out of `outfit`; non-carryable stores such as wood/fur cannot be injected through session commands.
- Centralized original Path armour label, max-health, max-water, carryable, and safe-return helpers so Path and World use the same upgrade priority logic.
- Added session regression coverage for all current capacity, water, and armour upgrade priority cases flowing from Path into World embark state.

### Verified - Phase 7 Path Upgrade and Reachability Hardening

- `npm test -- src/tests/engine/game-session.test.ts`
- `npm test -- src/tests/engine/game-session.test.ts src/tests/engine/combat-runtime.test.ts`
- `npm run build`

### Added - Phase 7 Path Outfitting Hardening

- Added a shared original Path outfit helper for carryable supply metadata, original name ordering, weapon damage/tool description tooltip data, and safe-return filtering.
- Updated the Path snapshot/UI to render supplies in original displayed-name order with original-derived weight, availability, damage, and tool description metadata.
- Changed normal World village return to use the same original safe-return outfit/stores rules already used by combat safe returns, preserving carryable equipment in `outfit` while restoring stores and leaving non-kept loot at home.
- Added session regression coverage for original Path supply order/metadata and safe World return outfit/store invariants.

### Verified - Phase 7 Path Outfitting Hardening

- `npm test -- src/tests/engine/game-session.test.ts src/tests/engine/combat-runtime.test.ts`

### Added - Post-Roast Path/World Player-Facing Remediation

- Implemented `A Dusty Path` as a real player-facing location unlocked by Compass ownership.
- Added Path snapshot/UI coverage for bag capacity, free space, armour, water capacity, carryable supplies, add/remove controls, perks, and embark gating.
- Added embark flow that transfers selected outfit from stores and opens an active World session.
- Added a minimal player-facing World runtime slice with original village position, bounded map coordinates, compact ASCII viewport, movement buttons, keyboard movement, food/water consumption, fixed initial landmark detection, encounter/setpiece bridge handoff, and village return to Path.
- Changed combat safe-return handling so `game.world.returnLocation = "path"` resolves to visible Path recovery instead of leaving only hidden pending state.
- Added Path and World UI components and restrained CSS matching the existing minimal interface.
- Added engine coverage for Compass-to-Path, outfitting, embark, World movement, supply consumption, and return.
- Added an organic Chromium browser smoke test from fresh room progression to Compass, Path, World movement, and return without direct resource injection.
- Added Path and World visual baselines at 1366x768, 1920x1080, 2560x1440, and 3840x2160.
- Tightened readiness docs so Phase 6 is described as a pragmatic runtime slice, while Phase 7/8 are marked as started but not parity-complete.
- Prepared the active docs for Phase 7 hardening by aligning README/status/spec/checklist language around the existing Path foundation, finalized pragmatic Phase 6 scope, and the rule that full World expansion waits behind Path parity.

### Verified - Post-Roast Path/World Player-Facing Remediation

- `npm run build`
- `npx vitest run src/tests/engine/game-session.test.ts src/tests/engine/event-runtime.test.ts`
- `npx playwright test src/tests/e2e/app.spec.ts -g "plays organically from fresh room to Path" --project=chromium-1920`
- `npx playwright test src/tests/e2e/room-visual.spec.ts --update-snapshots`
- `npm run lint`
- `npm run format:check`

### Updated - Phase 6 Progress Log and Setpiece Coverage

- Finalized Phase 6 for the pragmatic Combat Event Runtime scope after the focused executioner and setpiece audits and full verification matrix passed on 2026-07-08.
- Audited `docs/changelog.md` against the current Phase 6 implementation state after several incremental prompts and filled in missing Phase 6 history.
- Re-evaluated Phase 6 finalization scope after the focused catalog reached 38 executioner keys and 49 setpiece keys: after the organic World selection bridge, browser smoke coverage, session-level World return recovery, focused executioner key-set audit, and focused setpiece key-set audit, pragmatic closure is down to final verification and documentation cleanup; exhaustive original branch parity would be 15+ slices.
- Added an explicit Phase 6 executioner key-set coverage assertion that locks the focused 38-key battleship catalog and makes exhaustive executioner scene parity an intentional later-scope decision instead of an ambiguous remaining Phase 6 gap.
- Added an explicit Phase 6 setpiece key-set coverage assertion that locks the focused 49-key catalog, and fixed the World city landmark bridge to route hospital old-man cache/medicine variants to the existing `setpiece.city-hospital-cache` and `setpiece.city-hospital-medicine` keys.
- Added non-combat scene loot lifecycle support to `EventRuntime`, including deterministic loot rolling, lifecycle snapshot/restore, Path capacity checks, take-one/take-everything actions, and drop-for-loot actions outside combat scenes.
- Added UI and command-boundary support for non-combat scene loot through the event panel without routing those actions through `CombatRuntime`.
- Added browser-level executioner hub coverage for the antechamber `command deck` handoff into Command Deck combat, fleet-beacon loot pickup, and final event closeout through the event panel.
- Expanded focused setpiece coverage with the original Friendly Outpost slice:
  - original `An Outpost` title, text, and notification
  - water-replenishment effect marker and notification
  - cured-meat scene loot
  - headless EventRuntime traversal coverage
- Added the original `A Huge Borehole` setpiece slice with original text, visit marker, guaranteed alien-alloy scene loot, and headless EventRuntime traversal coverage.
- Added the original `A Forgotten Battlefield` setpiece slice with original text, visit marker, salvage scene loot, and headless EventRuntime traversal coverage.
- Added the original `A Crashed Ship` setpiece slice with original text, salvage button, and ship discovery world-state markers.
- Added the original `A Destroyed Village` cache setpiece traversal with original text, notification, underground/take/exit scenes, an explicit collection marker, original prestige-store transfer, and previous-store clearing.
- Expanded focused Old House setpiece coverage from only the squatter combat branch to all three original entry outcomes:
  - `medicine` branch with original medicine cache loot
  - `supplies` branch with water replenishment and cured meat/leather/cloth loot
  - `occupied` squatter combat branch
- Added focused Swamp setpiece traversal for the charm-gated wanderer scene and `gastronome` perk effect.
- Added focused Cave setpiece traversal through beast and cave-lizard combat scenes.
- Expanded focused Cave setpiece coverage with the original torch-gated camp branch, camp loot table, giant-lizard combat, back-cave supply-cache loot table, and a focused cave camp/cache clear marker.
- Expanded focused Cave setpiece coverage with the original wanderer-body branch, large-beast combat, animal-nest loot table, and a focused cave wanderer/nest clear marker.
- Expanded focused Cave setpiece coverage with the original narrow-passage old-case route, small-beast loot variant, giant-lizard combat, old-case loot table, and a focused cave old-case clear marker.
- Added focused Town and City setpiece traversal through thug and sniper combat scenes.
- Expanded focused Town setpiece coverage with the original torch-gated clinic branch and medicine cache loot.
- Expanded focused Town setpiece coverage with the original clinic madman branch, madman combat loot table, ransacked clinic ending, and a focused clinic-madman clear marker.
- Expanded focused Town setpiece coverage with the original torch-gated schoolhouse branch, rusting-locker loot, thug/scavenger combat chain, scavenger-camp loot table, and a focused schoolhouse clear marker.
- Expanded focused Town setpiece coverage with the original park/vigilante route, beast and vigilante combat, wanderer-rifle loot table, and a focused park-vigilante clear marker.
- Expanded focused Town setpiece coverage with the original caravan/vigilante route, overturned-caravan loot, hidden food-basket loot, trinket loot table, and a focused caravan-vigilante clear marker.
- Expanded focused City setpiece coverage with the original torch-gated hospital branch, operating-theatre scene, stockpile loot table, and city-cleared markers.
- Expanded focused City hospital coverage with the original old-man scalpel combat branch, dried-meat ward loot, medicine-cabinet loot, and a focused medicine-cabinet clear marker.
- Expanded focused City hospital coverage with the original old-man small-cache branch, including alien-alloy/medicine/cured-meat/bolas/fur loot and a focused hospital-cache clear marker.
- Expanded focused City hospital coverage with the original old-man dried-meat branch into the shared operating-theatres aftermath loot and a focused old-man-theatres clear marker.
- Expanded focused City hospital coverage with the original old-man branch into elderly-squatters combat, shared operating-theatres aftermath loot, and a focused old-man-squatters clear marker.
- Expanded focused City setpiece coverage with the original soldier-patrol route, chained soldier combats, intermediate voices scene, supplies loot table, and a focused soldier-patrol clear marker.
- Expanded focused City setpiece coverage with the original subway route, lizard and rat-swarm combats, torch-gated platform investigation, battle-platform supplies loot table, and a focused subway clear marker.
- Expanded focused City setpiece coverage with the original subway scavenged route, lizard and rat-swarm combats, torch-gated platform investigation, scavenged torch/cured-meat loot table, and a focused subway-scavenged clear marker.
- Expanded focused City setpiece coverage with the original subway beast-rubble route, lizard and beast combats, rubble loot table, scavenged torch/cured-meat loot table, and a focused subway-beast-rubble clear marker.
- Expanded focused City setpiece coverage with the original military-camp route, sniper and veteran combats, camp scene, military outpost supplies loot table, and a focused military-camp clear marker.
- Expanded focused City setpiece coverage with the original military-camp supplies route, sniper and veteran combats, body-supplies loot table, and a focused military-camp-supplies clear marker.
- Expanded focused City setpiece coverage with the original shanty-market route, frail-man and youth combats, improvised-shop loot table, canvas-sack loot table, and a focused shanty-market clear marker.
- Expanded focused City setpiece coverage with the original shanty crowd route, frail-man combat, crowd-surge squatters combat, abandoned-belongings loot table, and a focused shanty-crowd clear marker.
- Expanded focused City setpiece coverage with the original shanty crowd sack route, frail-man combat, crowd-surge squatters combat, canvas-sack loot table, and a focused shanty-crowd-sack clear marker.
- Expanded focused City setpiece coverage with the original shanty crowd youth route, frail-man combat, crowd text, youth combat, canvas-sack loot table, and a focused shanty-crowd-youth clear marker.
- Expanded focused City setpiece coverage with the original drying-hut route, street-side cured-meat loot, squatter combat, hut cache loot table, and a focused drying-hut clear marker.
- Expanded focused City setpiece coverage with the original drying-hut sack route, street-side cured-meat loot, squatter combat, canvas-sack loot table, and a focused drying-hut-sack clear marker.
- Expanded focused City setpiece coverage with the original drying-meat youth route, street-side cured-meat loot, youth combat, canvas-sack loot table, and a focused drying-meat-youth clear marker.
- Expanded focused City hospital coverage with the original ward route, lizard-pack combat, operating-theatre aftermath loot table, and a focused hospital-ward clear marker.
- Expanded focused City hospital coverage with the original elderly-squatters ward branch, squatters combat, operating-theatres aftermath loot table, and a focused hospital-squatters clear marker.
- Expanded focused City hospital coverage with the original deformed operating-theatre branch, warped-man equipment loot table, and a focused hospital-deformed clear marker.
- Expanded focused City hospital coverage with the original tentacular-horror operating-theatre branch, tentacles combat, victim-remains loot table, and a focused hospital-tentacles clear marker.
- Expanded focused City setpiece coverage with the original old-tower route, city thug combat, rooftop bird combat, nest loot table, and a focused old-tower clear marker.
- Expanded focused City setpiece coverage with the original old-tower scavenged route, city thug combat, rooftop bird combat, scavenged torch/cured-meat loot table, and a focused old-tower-scavenged clear marker.
- Expanded focused City setpiece coverage with the original old-tower thug rubble route, city thug combat, rubble loot table, scavenged torch/cured-meat loot table, and a focused old-tower-thug-rubble clear marker.
- Expanded focused City setpiece coverage with the original old-tower rubble route, beast-behind-car combat, rubble loot table, scavenged-ending loot table, and a focused old-tower rubble clear marker.
- Expanded focused City setpiece coverage with the original commando-settlement route, masked commando combat, burning-settlement loot table, and a focused commando-settlement clear marker.
- Expanded focused City setpiece coverage with the original commando supplies route, soldier and masked-commando combats, body-supplies loot table, and a focused commando-supplies clear marker.
- Added focused executioner intro traversal through ancient-beast and automated-turret combat.
- Expanded focused executioner intro coverage with the original webbed-corridor branch, knapsack scene loot, chitinous-horror combat, and chitinous-queen combat.
- Expanded focused executioner intro coverage with the original operative ambush, military-camp loot table, researcher combat, and continuation into the shared maintenance/turret/device ending.
- Expanded focused executioner intro coverage with the original barricade weapons loot, wanderer-remains loot, and continuation through ancient-beast combat into the shared maintenance/turret/device ending.
- Added original executioner antechamber hub coverage with `nextEvent` runtime transitions into the focused Engineering, Medical, Martial, and Command Deck slices.
- Expanded the executioner antechamber Engineering elevator handoff from a single hardwired assembly slice into the original-style chance-mapped assembly, engine-room, and fire-junction starting branches.
- Expanded the executioner antechamber Martial elevator handoff from a single hardwired robot slice into the original-style chance-mapped armory, right-corridor, and scrap starting branches.
- Added an organic World event bridge that selects encounter events by original terrain/distance bands, resolves original landmark scene names into focused setpiece/executioner events, exposes the bridge through the session/test harness, and covers a World-selected encounter in Playwright.
- Added session-level World return recovery that consumes combat `returnLocation` markers, records the last room/path return target, keeps death recovery in the room, and records safe-victory return targets. The later Path/World remediation now consumes those targets into visible Path recovery.
- Expanded focused Command Deck executioner coverage with the original bridge approach, mechanical-guard checkpoint, officer's lounge, weapons-cache loot, and handoff into the immortal-wanderer fight.
- Expanded focused Command Deck executioner coverage with the original officer's lounge discarded medical-supplies branch and handoff into the immortal-wanderer fight.
- Expanded focused Engineering Wing executioner coverage with the original assembly-line energy-cell/laser-rifle loot before the unruly-welder/mechanical-guard chain.
- Expanded focused Engineering Wing executioner coverage with the original quiet assembly-room branch, assembly-line energy-cell/laser-rifle loot, decrepit-machinery text, mechanical-guard combat, and R&D handoff.
- Expanded focused Engineering Wing executioner coverage with the original defence-turret engine-room branch, alien-alloy salvage, and mechanical-guard continuation.
- Expanded focused Engineering Wing executioner coverage with the original defence-turret engine-room quiet continuation, alien-alloy salvage, destroyed-engine text, and R&D handoff.
- Expanded focused Engineering Wing executioner coverage with the original fire-junction choice, water extinguish cost, rush-through HP cost, robot-hangar alternate, guard combat, and ransacked guard-post loot.
- Expanded focused Engineering Wing executioner coverage with the original R&D continuation, defence-turret/workbench fork, hypo-blueprint plans loot, and handoff into unstable-prototype combat.
- Expanded focused Engineering Wing R&D coverage with the original alien-alloy healing machine, max-health restoration, workbench fork, hypo-blueprint loot, unstable-prototype combat, kinetic-armour-blueprint loot, and Engineering deck-cleared flag.
- Hardened focused Engineering Wing R&D doorway coverage by connecting assembly, assembly-loot, engine-room, and fire/guard-post approach routes into the R&D/prototype event, with fire/guard-post runtime coverage through hypo-blueprint loot, unstable-prototype combat, kinetic-armour-blueprint loot, Engineering deck-cleared flag, and cleanup text.
- Added original-style special event cost handling for focused `hp` and `water` scene buttons while preserving normal store-cost behavior.
- Added focused executioner Engineering Assembly traversal through unruly-welder and mechanical-guard combat.
- Added focused executioner Medical Checkpoint traversal through defence-turret, mechanical-quadruped, and broken-medic combat.
- Hardened focused Medical Checkpoint coverage with dispatch-bay weapon loot, unstable-automaton explosion combat, glowstone-blueprint loot, and cold-storage handoff.
- Expanded focused Medical Checkpoint coverage with the original post-turret automated-guardians branch into the gurneys corridor.
- Expanded focused Medical Checkpoint coverage with the original gurneys-to-strategy-room branch, secure-locker loot, noisy-medic combat, quiet-move option, and quadruped rejoin.
- Expanded focused Medical Checkpoint coverage with the original post-medic friends/frozen-robots branch before dispatch-bay loot.
- Added chance-mapped `nextEvent` support to `EventRuntime` and wired the Medical checkpoint handoff into the existing guarded cold-storage, guarded surgical-tools, and slipped cold-storage focused slices.
- Expanded focused Martial Wing executioner coverage with the original right-corridor route through turret and quadruped combat, cabin loot, barricade text, and plasma-rifle blueprint documents.
- Expanded focused Martial Wing executioner coverage with the original ruined-defence-turret scrap route, alien-alloy salvage, mechanical-guard and quadruped combat chain, barricade text, and plasma-rifle blueprint documents.
- Expanded focused Martial Wing executioner coverage with the original security-checkpoint route, dead-guards weapon loot, quadruped combat, and training-complex handoff.
- Expanded focused Martial Wing executioner coverage with the original planning-room map-scavenging route, three `applyMap` effects, noisy guard combat, and second guard combat into the training-complex handoff.
- Expanded focused Martial Wing executioner coverage with the original training-complex handoff into murderous-robot combat, disruptor blueprint loot, and Martial deck completion flag.
- Expanded focused Martial Wing training-complex coverage with the original alien-alloy regenerative machine, max-health restoration, and murderous-robot handoff.
- Expanded focused Medical Wing executioner coverage with the original second-checkpoint unnoticed-passage route, cold-storage cured-meat loot, security-drone avoidance text, final medic combat, and containment-cell handoff.
- Expanded focused Medical Wing executioner coverage with the original guarded cold-storage route through two mechanical-guard combats, chained medic combats, cold-storage cured-meat loot, and containment-cell handoff.
- Expanded focused Medical Wing executioner coverage with the original guarded second-checkpoint route through mechanical-guard combat, medic combat, surgical-tools text, completed-explosives grenade loot, final medic combat, and containment-cell handoff.
- Expanded focused Medical Wing executioner coverage with the original gurneys branch where the first broken medic has friends, including chained medic combat, hypo use, dispatch-bay weapon loot, and unstable-automaton handoff.
- Expanded focused Medical Wing executioner coverage with the original automated-guardians avoidance branch, gurneys continuation, strategy-room quiet-movement route, quadruped combat, and unstable-automaton handoff.
- Expanded focused Medical Wing executioner coverage with the original surgical-tools direct-medic branch, chained medic combats, hypo use, and containment-cell handoff.
- Expanded focused Medical Wing executioner coverage with the original surgical-tools route, completed-explosives grenade loot, final medic combat, and containment-cell handoff.
- Expanded focused Medical Wing executioner coverage with the original strategy-room secure-locker branch, energy-cell/hypo loot, noise-drawn medic combat, quadruped combat, and unstable-automaton handoff.
- Expanded focused Medical Wing executioner coverage with the original frozen medical-robots branch, dispatch-bay weapon loot, unstable-automaton explosion combat, glowstone blueprint loot, and checkpoint handoff.
- Hardened focused Medical Wing automaton checkpoint coverage by connecting automated-guardians, gurneys/friends, strategy-room locker, and frozen-robots checkpoint scenes into the cold-storage route, with frozen-robots runtime coverage through cold-storage medic fights, malformed-experiment victory, stim-blueprint loot, Medical deck-cleared flag, and cleanup text.
- Expanded focused Martial Wing executioner coverage with the original sealed-door grenade blast route, weapon-rack loot, defence-turret combat, sealed-door continuation, plasma-rifle blueprint documents, and training-complex handoff.
- Expanded focused Martial Wing executioner coverage with the original security-checkpoint empty-containment-cells route through sparking power-cable text, quadruped combat, and training-complex handoff.
- Expanded focused Martial Wing executioner coverage with the original scrap-route wall-sensors avoidance branch into quadruped combat, barricade text, and plasma-rifle blueprint documents.
- Expanded focused Martial Wing executioner coverage with the original right-corridor silent-cabins branch, cabin loot, barricade text, and plasma-rifle blueprint documents.
- Hardened focused Medical Wing containment coverage by connecting guarded-surgical and cold-storage containment scenes into the malformed-experiment event, stim-blueprint combat loot, Medical deck-cleared flag, and cleanup text.
- Hardened the remaining focused Medical Wing containment coverage by connecting cold-guard, surgical-explosives, and surgical-medic containment scenes into the malformed-experiment event, with surgical-explosives runtime coverage through stim-blueprint loot, Medical deck-cleared flag, and cleanup text.
- Hardened focused Martial Wing planning-room coverage with the original automated-sentry avoidance branch into the second mechanical-guard combat and training-complex handoff.
- Hardened focused Martial Wing planning-room coverage by connecting the automated-sentry route into the murderous-robot event, disruptor-blueprint combat loot, Martial deck-cleared flag, and cleanup text.
- Hardened focused Martial Wing security empty-cells coverage by connecting the quadruped route into the murderous-robot event, disruptor-blueprint combat loot, Martial deck-cleared flag, and cleanup text.
- Hardened focused Martial Wing security dead-guards coverage by connecting the quadruped route into the murderous-robot event, disruptor-blueprint combat loot, Martial deck-cleared flag, and cleanup text.
- Hardened focused Martial Wing armory coverage by connecting the sealed-door route into the murderous-robot event, disruptor-blueprint combat loot, Martial deck-cleared flag, and cleanup text.
- Hardened focused Command Deck executioner coverage by driving the lounge weapons-cache route through the full immortal-wanderer victory, fleet-beacon loot, and cleared-deck cleanup text.
- Hardened focused Command Deck executioner coverage by driving the lounge medical-supplies route through the full immortal-wanderer victory, fleet-beacon loot, and cleared-deck cleanup text.
- Updated `docs/context.md`, `docs/plan.md`, and `docs/parity-checklist.md` to reflect Outpost, Swamp, Old House, Cave, Town, City, Mines, and focused executioner slices before the later finalization pass.

### Verified - Phase 6 Progress Log and Setpiece Coverage

- `npm test -- --run src/tests/content/event-data-coverage.test.ts`
- `npm test -- --run src/tests/engine/event-runtime.test.ts`
- `npm run format:check`
- `npm run check:architecture`
- `npm run build`
- `npm test`
- `npx playwright test src/tests/e2e/app.spec.ts -g "combat" --project=chromium-1366`

## 2026-07-07

### Started - Phase 6 Combat Runtime Boundary

- Extracted representative combat handling from `EventRuntime` into `CombatRuntime`.
- Kept `EventRuntime` responsible for event scheduling, scene loading, modal lifecycle, and non-combat buttons while `CombatRuntime` owns combat state, actions, enemy attack timers, loot, current death effects, and lifecycle snapshots.
- Preserved the existing `A Snarling Beast` event integration as a regression fixture.
- Added direct `CombatRuntime` tests for start/snapshot behavior, attack/cooldown/victory loot, player death callback, and lifecycle restore timing.
- Replaced the placeholder losing-path notification with the original world-death outcome: `the world fades`, outfit state is cleared, death state is marked, and a room-return outcome is exposed for later Path/World runtime wiring.
- Added original Path capacity enforcement to combat loot taking, including the `take all you can` partial-loot path when the current outfit is near capacity.
- Added targeted combat drop-and-take actions so blocked loot can be taken by dropping enough carried outfit weight, preserving the original mechanical behavior behind a flat UI control.
- Moved combat drop-and-take presentation into a loot-row hover/focus menu so blocked loot exposes original-style drop choices without cluttering the primary combat buttons.
- Added original safe-return outfit handling to the combat leave path, returning carried outfit items to stores and leaving non-travel loot at home while preserving travel supplies and weapons in the selected outfit.
- Added original blueprint redemption to the combat safe-return path, converting carried executioner blueprint loot into `character.blueprints` unlock flags before outfit return.
- Split combat victory leave semantics so scene-continuation combat buttons advance through `EventRuntime` without prematurely returning outfit to stores, while true combat exits still use the original safe-return path.
- Added original healing cooldowns for cured meat, medicine, and hypo actions.
- Added late-game combat action coverage for kinetic armour `shield` and carried `stim` boost controls, including cooldowns, shield break-on-hit behavior, stim HP cost, and boosted weapon cooldown timing.
- Added the original one-second post-victory cooldown for combat loot-taking and leave actions.
- Added combat-boundary support for original `atHealth` status triggers and the executioner-style `venomous` damage-over-time effect, including lifecycle snapshot/restore coverage for the owned venom timer.
- Added combat-boundary support for scheduled executioner-style enemy specials, including shield, energised, enraged, and meditation status effects plus lifecycle snapshot/restore for special timers.
- Added combat-boundary support for original delayed explosion-on-defeat combat, including blast death handling, shield interaction, and lifecycle snapshot/restore for pending explosions.
- Added a focused executioner combat catalog for the combat boundary, covering reusable mechanical enemies and representative scene-local combat definitions with status specials, explosion, and blueprint loot while keeping full executioner event scenes out of Phase 6 completion.
- Added a focused executioner event slice for the Command Deck immortal wanderer, routing avoid-repeat rotating shield/enraged/meditation specials through `EventRuntime` and preserving the original post-fight fleet beacon loot surface.
- Added a focused executioner event slice for the Martial Wing murderous robot, routing scheduled energised-special combat through `EventRuntime` and applying the original martial-cleared world-state flag after victory.
- Added a focused executioner event slice for the Engineering Wing unstable prototype, routing scheduled shield-special combat through `EventRuntime` and applying the original engineering-cleared world-state flag after victory.
- Added a focused executioner event slice for the Medical Wing malformed experiment, routing scheduled enraged-special combat through `EventRuntime` and applying the original medical-cleared world-state flag after victory.
- Added a focused executioner event slice for the Medical Wing unstable automaton, routing explosion-on-defeat combat through `EventRuntime` and redeeming glowstone blueprint loot on combat leave.
- Added a focused setpiece combat catalog for the combat boundary, covering cave, town, city, and mine-clearing enemy definitions while keeping full setpiece scene traversal out of Phase 6 completion.
- Added a focused Iron Mine setpiece traversal slice, routing the original beastly matriarch fight through `CombatRuntime` and applying the cleared mine world-state flag after combat victory.
- Added a focused Coal Mine setpiece traversal slice, covering chained man/man/chief combats through `CombatRuntime` and applying the cleared coal mine world-state flag without triggering safe-return outfit handling between combat scenes.
- Added a focused Sulphur Mine setpiece traversal slice, covering chained soldier/soldier/veteran combats through `CombatRuntime` and applying the cleared sulphur mine world-state flag without triggering safe-return outfit handling between combat scenes.
- Ported all 11 original wilderness encounter definitions from `ORIGINAL/script/events/encounters.js` through the event data layer, including enemy stats, ranged flags, notifications, and loot tables. Encounter availability was initially hard-gated until World-owned distance and terrain routing existed; the later World bridge now covers the first player-facing route.

### Verified - Phase 6 Combat Runtime Boundary

- `npm test -- --run src/tests/engine/combat-runtime.test.ts src/tests/engine/event-runtime.test.ts`
- `npm test -- --run src/tests/content/event-data-coverage.test.ts src/tests/engine/event-runtime.test.ts src/tests/engine/combat-runtime.test.ts`
- `npx playwright test src/tests/e2e/app.spec.ts -g "combat" --project=chromium-1366`

### Completed - Phase 5 Event Runtime

- Finalized Phase 5 for the original non-combat Global, Room, Outside, and Marketing event pools.
- Confirmed the remaining canonical event families, including encounters, setpieces, and executioner events, belong to later phases rather than the Phase 5 completion boundary.
- Kept the representative `A Snarling Beast` combat slice as the Phase 5 loot/combat foundation for Phase 6 expansion.

### Added - Phase 5 Event Content Expansion Slice

- Expanded original Event Runtime content from 5 representative definitions to 19 definitions, covering all Phase 5 non-combat Global, Room, Outside, and Marketing event pool definitions plus the representative combat encounter.
- Added original Room event slices for:
  - `The Nomad`
  - `Noises` outside
  - `Noises` inside
  - `The Shady Builder`
  - `The Mysterious Wanderer` fur variant
  - `The Scout`
  - `The Master`
  - `The Sick Man`
- Added original Outside event slices for:
  - `A Ruined Trap`
  - `Fire`
  - `Plague`
  - `A Beast Attack`
  - `A Military Raid`
- Added the original `Penrose` marketing event slice, including Marketing pool scheduling, the one-shot `marketing.penrose` flag, and link metadata for the external button.
- Added runtime support for original-style non-ending merchant buttons, button availability checks, and button `onChoose` handlers.
- Added a Scout `World.applyMap` effect bridge so Phase 5 validates event costs, notifications, and button behavior while the full map reveal algorithm remains owned by the World runtime capability boundary.
- Added event side-effect bridge support for Outside hut destruction so events reuse `OutsideRuntime` village/death behavior.
- Added a test-only config gate for passive random event scheduling so deterministic long-progression specs can opt out without disabling manual event triggers.
- Reviewed original event attention behavior and documented the intentional focused-modal replacement for browser title blinking in `REMAKE/docs/deviations.md#dev-008-focused-event-modal-instead-of-browser-title-blink`.

### Hardened - Latest Roast Audit Remediation

- Changed the Scout `buy map` event bridge from silent optional no-op behavior to an explicit `canApplyMap` capability gate, hiding the button and preventing resource spend until the full World map reveal handler is wired.
- Made `EventRuntime.restoreLifecycle()` clear its own scheduled event, enemy attack, and delayed-action timers before applying restored state.
- Added unit coverage for unwired Scout map behavior, lifecycle timer cleanup, and the current representative combat death path.
- Added a fresh-run browser scenario that reaches the original `Penrose` Marketing event through passive scheduling without forced event triggering or injected stores.
- Documented Phase 6 combat boundary constraints, death/outfit-return sequencing, and Path/World layout contracts in the technical and UI specs.

### Verified - Phase 5 Event Content Expansion Slice

- `npm run format:check`
- `npm run lint`
- `npx prettier --write src/content/original/events/eventData.ts src/engine/events/EventRuntime.ts src/ui/EventPanel.tsx src/tests/engine/event-runtime.test.ts src/tests/content/event-data-coverage.test.ts`
- `npm test -- src/tests/engine/event-runtime.test.ts src/tests/content/event-data-coverage.test.ts`
- `npm test`
- `npm run check:architecture`
- `npm run build`
- `npm run test:e2e`

### Added - Phase 5 Combat Runtime Slice

- Expanded the production Event Runtime from combat-shaped snapshots to a playable representative combat slice using the original `A Snarling Beast` encounter.
- Added original-derived combat handling for player/max HP, armour HP bonuses, hit chance, enemy attack timing, weapon costs, weapon cooldowns, weapon damage, stun, healing items, deterministic loot rolls, victory state, loot taking, and leave flow.
- Routed combat actions through the `GameSession` command boundary and rendered compact combat HP/loot/action controls inside the existing event modal.
- Preserved Event Runtime lifecycle snapshots for active combat state and enemy attack timing.

### Verified - Phase 5 Combat Runtime Slice

- `npm run lint`
- `npm run format:check`
- `npm test`
- `npm test -- src/tests/engine/event-runtime.test.ts`
- `npm run build`
- `npm run test:e2e -- src/tests/e2e/app.spec.ts`
- `npm run test:e2e`

### Changed - Debug Settings Opt-In

- Changed the non-original debug `settings` tab from default-visible tooling to explicit opt-in tooling behind `?debug=1`.
- Kept debug toggles default-off after opt-in.
- Kept `?testHarness=1` clean by default so deterministic visual baselines no longer need `debug=0`.
- Updated E2E coverage so normal `/` and `?debug=0` stay free of debug UI, while `?debug=1` exposes dev save/load and multipliers.

### Verified - Debug Settings Opt-In

- `npm run format`
- `npm run format:check`
- `npm run lint`
- `npm run build`
- `npm test`
- `npx playwright test src/tests/e2e/app.spec.ts --project=chromium-1366`
- `npx playwright test src/tests/e2e/room-visual.spec.ts`
- `npm run test:e2e`

### Changed - Final UI Hardening Before Next Phase

- Anchored Event Runtime dialogs to the active play column so events no longer overlap the stores column on desktop.
- Capped tall Room build/craft/buy action columns with compact internal scrolling.
- Grouped stores income rows by source and compacted income cadence text to reduce duplicate worker rows in the stores panel.
- Strengthened disabled button contrast while keeping inactive controls visibly unavailable.
- Added worker-control hover/focus affordance without expanding the original-near compact arrow layout.
- Switched Room visual parity baselines to a clean debug-free entry while preserving debug tooling for manual parity work.

### Verified - Final UI Hardening Before Next Phase

- `npm run format`
- `npm run format:check`
- `npm run lint`
- `npm run build`
- `npm test`
- `npx playwright test src/tests/e2e/app.spec.ts --project=chromium-1366`
- `npx playwright test src/tests/e2e/room-visual.spec.ts --update-snapshots`
- `npm run test:e2e`

### Added - Latest Audit Remediation

- Promoted dev save/load from state-only storage to a session lifecycle snapshot:
  - engine state
  - manual clock time
  - active cooldowns
  - notifications
  - Room timers
  - Outside timers
  - active/pending Event Runtime state
- Added resume-regression coverage for builder progression, population growth, active event state, and delayed event actions.
- Added a clean parity entry check for the then-default-visible debug tooling; this was superseded later the same day by the `?debug=1` opt-in change.
- Removed pre-discovery `outside` and `wood` rows from debug info until those concepts are visible in the run.
- Expanded Event Runtime coverage with original-sourced slices for:
  - `The Thief` global event with `onLoad` side effects
  - `Sickness` outside event with villager death side effect hook
  - `The Mysterious Wanderer` delayed reward action
  - `A Snarling Beast` combat-shaped encounter snapshot
- Added manifest-aware event coverage tests so partial event coverage remains explicit.
- Made the event panel a modal dialog with initial focus and keyboard focus containment.
- Added browser zoom/long event text overflow coverage.
- Enlarged worker-control hit boxes while keeping compact arrow styling.
- Added executable lint/format scripts and TypeScript-aware ESLint config.
- Removed unused `zustand`.

### Verified - Latest Audit Remediation

- `npx tsc --noEmit`
- `npm run lint`
- `npm test`
- `npx playwright test src/tests/e2e/app.spec.ts --project=chromium-1366`
- `npx playwright test src/tests/e2e/room-visual.spec.ts --update-snapshots`

### Added - Current Game Audit Remediation

- Wired browser dev save/load/clear through `LocalStorageDevSaveAdapter` under `adr-remake-dev-save`.
- Initially enabled the non-original debug settings tab by default during parity work; this was superseded later the same day by the `?debug=1` opt-in change.
- Added dev save/load e2e coverage with page reload persistence.
- Moved Room and Outside UI actions behind `GameSession` command methods instead of passing runtime classes into React views.
- Added the first production Event Runtime vertical slice using the original `The Beggar` Room event:
  - event scheduling range
  - availability check
  - scene text and notification
  - button costs
  - deterministic chance scene branching
  - scene rewards
  - leave/end flow
- Added sparse event panel UI and event runtime unit/e2e coverage.
- Added a natural Phase 4 browser progression test from fresh start through hut/lodge/population/worker assignment without direct state injection.
- Added Phase 4 Outside worker visual baselines across the desktop viewport matrix.
- Added an architecture-boundary test preventing UI components from importing mutable runtime classes directly.
- Updated status/checklist/deviation docs to distinguish data-only coverage, partial event runtime coverage, and parity-work debug tooling.

### Verified - Current Game Audit Remediation

- `npm run build`
- `npx vitest run src/tests/engine/event-runtime.test.ts src/tests/engine/game-engine.test.ts src/tests/architecture-boundaries.test.ts`
- `npx playwright test src/tests/e2e/app.spec.ts`
- `npx playwright test src/tests/e2e/room-visual.spec.ts --update-snapshots`

### Fixed - Cooldown and Worker Control Layout

- Fixed action buttons so cooldown text is absolutely positioned inside a fixed-size button instead of changing button dimensions or wrapping labels.
- Widened Outside action buttons so labels and cooldown seconds stay readable together.
- Matched cooldown text styling to the disabled button text instead of rendering it darker.
- Added E2E regression coverage that verifies Outside action button size and neighboring button position stay stable during cooldown.
- Increased worker-control hit area height, separated up/down arrow placement, and removed disabled arrows' inner cutout so zero-worker jobs no longer show an extra triangle artifact.
- Refreshed affected firelit visual baselines.

### Verified - Cooldown and Worker Control Layout

- `npx playwright test src/tests/e2e/app.spec.ts --project=chromium-1366`
- `npm run build`
- `npx playwright test src/tests/e2e/room-visual.spec.ts --update-snapshots`
- `npm test`
- `npm run test:e2e`

## 2026-07-06

### Changed - Original-Near UI Layout Polish

- Moved the shell closer to the original `A Dark Room` layout:
  - 920px wrapper with 220px left notification reserve and 700px location area
  - Times-style serif typography instead of monospace
  - header tabs as original text links with separators
  - Room actions in compact build/craft/buy columns instead of wide cards
  - Outside village/stores/workers positioned like original panels
  - worker +/- controls rendered as compact arrow buttons
- Refreshed visual regression baselines for the original-near layout.

### Verified - Original-Near UI Layout Polish

- `npx playwright test src/tests/e2e/app.spec.ts --project=chromium-1366`
- `npm test -- src/tests/engine/outside-runtime.test.ts src/tests/engine/room-runtime.test.ts`
- `npx playwright test src/tests/e2e/room-visual.spec.ts --update-snapshots`
- `npm run build`
- `npm test`
- `npm run test:e2e`

### Added - Phase 4 Outside and Village Runtime

- Implemented original Outside trap checking with 90s cooldown, baited drop count, bait consumption, trap drop table rolls, and original notification phrasing.
- Added original population scheduling from hut capacity, including arrival counts, village title changes, and population notifications.
- Added building/mine-dependent worker unlocks, worker assignment controls, gatherer accounting, and worker income collection with original consumption blocking.
- Added original hut destruction and villager death side effects, including worker reassignment trimming and returned victim counts for future event hooks.
- Expanded the Outside UI with `check traps`, village/forest legend switching, population display, and worker rows with +/- and +/-10 controls.
- Added deterministic Phase 4 engine tests for trap drops, population growth, worker assignment, worker income, debug income multiplier behavior, hut destruction, and villager deaths.
- Added E2E coverage for the Phase 4 Outside UI and refreshed Outside visual baselines for the now-visible trap control.

### Verified - Phase 4 Outside and Village Runtime

- `npm test -- src/tests/engine/outside-runtime.test.ts src/tests/content/outside-data.test.ts`
- `npm test -- src/tests/engine/outside-runtime.test.ts`
- `npm run build`
- `npm test`
- `npx playwright test src/tests/e2e/room-visual.spec.ts:62 --update-snapshots`
- `npm run test:e2e`

### Added - Debug Settings Tab

- Added a visible `settings` tab with default-off debug toggles:
  - `speed x 10`
  - `income x 10`
- Wired `speed x 10` into the realtime clock driver so cooldowns and scheduled timers advance faster automatically while enabled.
- Wired `income x 10` into passive Room builder income and income row display while leaving manual gather actions unchanged.
- Added compact debug info for current game time, active location, multipliers, Room state, Outside unlock state, and wood.
- Documented the tab as an intentional non-original debug/testing deviation.
- Updated full-shell visual baselines for the additional tab.

### Verified - Debug Settings Tab

- `npx vitest run src/tests/engine/clock.test.ts src/tests/engine/room-runtime.test.ts`
- `npx playwright test src/tests/e2e/app.spec.ts --project=chromium-1366`
- `npx playwright test src/tests/e2e/room-visual.spec.ts --update-snapshots`
- `npm test`
- `npm run build`
- `npm run test:e2e`

### Changed - Phase 3 UI Parity Polish

- Removed redundant visible Room/Outside headings below the location tabs.
- Anchored the app shell at the top so tab switches no longer vertically recenter the page.
- Reused the Room stores panel on Outside so wood and other visible stores remain inspectable after switching locations, matching the original moving `storesContainer` behavior.
- Added a minimal Outside forest status panel for built traps, while leaving trap checking, population growth, workers, and full village controls to Phase 4.
- Changed notification rendering to newest-first with a bounded faded log area instead of unbounded downward growth.
- Expanded E2E coverage for stable tab switching, Outside store visibility, and trap/forest display.
- Updated visual baselines for the heading removal, top anchoring, bounded notification log, Outside stores, and trap forest state.

### Verified - Phase 3 UI Parity Polish

- `npm test`
- `npm run build`
- `npx playwright test src/tests/e2e/room-visual.spec.ts --update-snapshots`
- `npm run test:e2e`

### Completed - Phase 3 Completion Audit Remediation

- Added `GameSession` as the engine-side runtime boundary for:
  - update lifecycle
  - elapsed realtime clock ownership
  - active location state
  - arrival lifecycle
  - test-only deterministic state/time hooks
- Added original Outside first-arrival behavior:
  - `game.outside.seenForest`
  - `the sky is grey and the wind blows relentlessly`
- Extended Room store classification to original misc items and Fabricator craftable item types.
- Sorted Room store rows by original-style stable key order.
- Fixed workshop craftable visibility so existing store items do not bypass workshop gating.
- Added explicit realtime catch-up capping to prevent unbounded timer drains after paused/background tabs.
- Added Outside notification rendering.
- Added unit/E2E/visual coverage for the newly closed audit gaps.
- Updated `deviations.md` with current intentional parity deviations.

### Verified - Phase 3 Completion Audit Remediation

- `npm test`
- `npm run build`
- `npx playwright test src/tests/e2e/room-visual.spec.ts --update-snapshots`
- `npm run test:e2e`

### Completed - Latest Prototype Roast Audit Suggestions

- Made Room, Outside, and cooldown snapshots side-effect free.
- Moved Room unlock side effects behind explicit availability refresh.
- Added original-style Room/Outside location tabs instead of stacked sections.
- Replaced fixed React clock ticking with an elapsed real-time driver while keeping manual time for tests.
- Rendered Room stores in resources/special and weapons groups while hiding original hidden store types.
- Made build/craft/buy costs visible in the UI.
- Added a test-only acceleration harness and full Phase 3 UI progression E2E coverage.
- Expanded visual baselines to stores, build, craft/buy, and outside gather states with frozen test time.
- Added notification retention and source filtering.
- Pinned top-level dependency versions exactly.
- Extracted pure Room selector/economy calculations from `RoomRuntime`.

### Verified - Latest Prototype Roast Audit Suggestions

- `npm test`
- `npm run build`
- `npm run test:e2e`

### Completed - Phase 3 Room Runtime

- Added final Room edge-case coverage for:
  - fire title transition from firelit back to dark as the fire cools
  - idempotent outside unlock notifications
  - maxed craftable notification behavior
  - original hut dynamic runtime cost after existing huts
  - outside title thresholds from original hut counts
- Added Room visual regression baselines for fresh and firelit states across all required desktop viewport projects.
- Updated `REMAKE/docs/context.md` to mark Phase 3 complete and identify Phase 4 Outside/Village as the next implementation area.
- Updated `REMAKE/docs/parity-checklist.md` for completed Phase 3 Room parity gates and remaining post-Phase-3 systems.

### Verified - Completed Phase 3 Room Runtime

- `npm test`
- `npm run build`
- `npx playwright test src/tests/e2e/room-visual.spec.ts --update-snapshots`
- `npm run test:e2e`

### Added - Phase 3 Cooldown Rendering and Viewport Matrix Slice

- Added visible cooldown countdown text and progress fill for Room fire and Outside gather buttons.
- Stabilized button dimensions so cooldown labels do not resize the Room layout.
- Expanded Playwright projects to the required desktop viewport matrix:
  - 1366x768
  - 1920x1080
  - 2560x1440
  - 3840x2160
- Added Room layout checks to prevent horizontal overflow at all target widths.
- Expanded discovery assertions for hidden craft, buy, outside, worker, outfitting, path, ship, and fabricator affordances before original unlocks.

### Verified - Phase 3 Cooldown Rendering and Viewport Matrix Slice

- `npm run build`
- `npm test`
- `npm run test:e2e`

### Added - Phase 3 Outside Gather and Income Slice

- Added headless `OutsideRuntime` for the original outside unlock boundary.
- Added original gather-wood behavior:
  - hidden before outside unlock
  - 60 second cooldown
  - 10 wood normally
  - 50 wood with cart
  - original gather notification
- Added minimal Outside UI that appears only after the original need-wood unlock.
- Added Room income snapshots and UI rows using the original `+N per Ds` wording.
- Added discovery coverage to keep the forest/gather controls hidden at fresh start.
- Added Outside runtime tests for unlock initialization, cooldown behavior, and cart gather amount.

### Verified - Phase 3 Outside Gather and Income Slice

- `npm test`
- `npm run build`
- `npm run test:e2e -- src/tests/e2e/app.spec.ts`

### Added - Phase 3 Room Economy Runtime Slice

- Generalized Room action snapshots into build, craft, and buy groups.
- Added full room craft/build handling for all original craftable item types:
  - buildings increment `game.buildings`
  - tools, weapons, and upgrades increment `stores`
  - original cost, maximum, and cold-builder checks are enforced
- Added Room trade-good buying after trading-post unlock with original seen-good/compass gates.
- Added store-row snapshots so all visible positive stores render, not only wood.
- Promoted the builder through the active Room UI tick so the single-panel remake reaches the helper state without requiring tab travel.
- Expanded Room runtime tests for workshop crafting, trade-good buying, and maximum/disabled behavior.

### Verified - Phase 3 Room Economy Runtime Slice

- `npm test`
- `npm run build`
- `npm run test:e2e`

### Added - Phase 3 Room Runtime Timer and Builder Slice

- Added scheduled Room timers for original fire cooling, room warming, builder progression, need-wood unlock, and builder wood income.
- Added original stoke cooldown state to the Room snapshot and disabled the active fire button while cooling down.
- Added need-wood outside unlock behavior with the original wood seed and notifications.
- Added builder helper promotion and first original building unlock/build flow for Room buildings.
- Added Room UI rendering for post-builder build buttons while keeping economy controls hidden before the original trigger.
- Expanded Room runtime tests for timer scheduling, cooldown behavior, outside unlock, first building unlocks, and dynamic building costs.

### Verified - Phase 3 Room Runtime Timer and Builder Slice

- `npm test`
- `npm run build`
- `npm run test:e2e`

### Added - Phase 3 Initial Room Runtime Vertical Slice

- Added headless `RoomRuntime` owned by the engine layer.
- Added original fresh-room initialization:
  - room feature enabled
  - builder level `-1`
  - fire `dead`
  - temperature `freezing`
- Added original-compatible `light fire` behavior for the initial no-wood state.
- Added `stoke fire` behavior with original no-wood semantics.
- Added fire title/state snapshot rendering for `A Dark Room` and `A Firelit Room`.
- Added temperature adjustment helper moving room temperature toward fire level.
- Added first builder progression helper and original fire/builder notifications.
- Replaced default scaffold UI with a minimal Room view.
- Kept Phase 0.5 spike UI available only via `?spikes=1`.
- Added Room runtime unit tests and Room E2E smoke tests at desktop and 4K projects.

### Verified - Phase 3 Initial Room Runtime Vertical Slice

- `npm test`
- `npm run build`
- `npm run test:e2e`

### Changed - Audit Hardening After Full Roast

- Fixed `StateStore` update events to emit the original-style full `stateName` path while keeping category separate.
- Fixed store clamping so both dot and bracket `stores` paths clamp through `set()` and `add()`.
- Added missing original state categories to the initial state shape:
  - `timers`
  - `wait`
  - `cooldown`
- Replaced duplicated engine source commit metadata with the canonical source baseline export.
- Quarantined Phase 0.5 spike UI behind `?spikes=1` so the default entry no longer exposes future `world` or `space` affordances.
- Added E2E coverage that default entry hides spike-only future systems.
- Expanded architecture-boundary tests for:
  - original content independence from UI and expansion content
  - UI not importing low-level state mutation modules directly
- Added source-derived snapshot parity tests that evaluate selected original JavaScript files directly and compare normalized original data against ported TypeScript data.
- Updated `REMAKE/docs/context.md` to reflect the current Phase 2 completion and Phase 3 readiness state.
- Tightened `REMAKE/docs/parity-checklist.md` so data-only coverage does not mark runtime parity as in progress.

### Verified - Audit Hardening After Full Roast

- `npm test`
- `npm run build`
- `npm run test:e2e`

### Added - Phase 2 Remaining Original Source Data Values

- Added typed original core engine/state/scoring data module.
- Ported exact engine constants:
  - site URL and encoded share URL
  - version
  - max store cap
  - save notification display timing
  - initial game-over flag
  - income tick and hyper-mode timing factor
- Ported exact engine option defaults.
- Ported exact StateManager categories.
- Documented original save migration steps from `1.0` to `1.3`.
- Ported exact score factor list and score bonuses for alien alloy, fleet beacon, and ship hull.
- Added pure helper for original score calculation.
- Completed Path constants with store offset, capacity upgrade priority, armour priority, non-craftable carryables, and capacity helper.
- Added deferred original audio manifest, including audio engine constants, every audio library key, asset path, and category.
- Added deferred localization inventory, including source template metadata, language registry path, locale data paths, and msgid counts.
- Wired core, path, audio, and localization data into the original content registry.
- Added parity tests for engine constants, state categories, migrations, scoring, Path constants, audio manifest, and localization inventory.

### Verified - Phase 2 Remaining Original Source Data Values

- `npm test`
- `npm run build`
- `npm run test:e2e`

### Added - Phase 2 Original Late-Game Data Values

- Added typed original late-game data module for Ship, Space, and Fabricator.
- Ported exact Ship constants:
  - lift-off cooldown
  - alloy cost per hull and thruster
  - base hull and thruster values
- Ported exact Space constants:
  - ship speed
  - asteroid delay and speed values
  - fade/ascent timing
  - starfield dimensions, star count, and animation speed
  - frame/timer intervals
  - original 700px playfield bounds and ship positions
  - asteroid speed randomization factor
- Ported exact Fabricator craftables, including type, cost, maximum, blueprint gate, quantity, and messages.
- Ported Space title thresholds, asteroid glyph probabilities, asteroid wave thresholds, hit-sound altitude tiers, and key bindings.
- Added pure helpers for ship speed, asteroid duration, asteroid scheduling delay, asteroid count by altitude, title lookup, hit audio tier, and background music volume.
- Wired late-game data into the original content registry.
- Added late-game parity tests for constants, manifest keys, Fabricator craftables, Space thresholds/tables, helper formulas, and registry wiring.

### Verified - Phase 2 Original Late-Game Data Values

- `npm test`
- `npm run build`
- `npm run test:e2e`

### Added - Phase 2 Original Room Data Values

- Added typed original room data module.
- Ported exact room timing constants:
  - fire cooling delay
  - room warming delay
  - builder state delay
  - stoke cooldown
  - need-wood delay
  - light/stoke wood costs
  - builder income timing and wood income
- Ported exact room temperature enum values and labels.
- Ported exact fire enum values and labels.
- Ported all original room craftables, including type, maximum, messages, base costs, dynamic cost formula metadata, and deferred audio identifiers.
- Ported all original trade goods, including type, maximum where present, costs, and deferred audio identifiers.
- Ported room misc item classification for `laser rifle`.
- Added pure helpers for original room cost evaluation and workshop gating.
- Wired room data into the original content registry.
- Added room data parity tests for constants, enums, manifest keys, representative craftables, dynamic costs, trade goods, misc classification, workshop gating, and registry wiring.

### Verified - Phase 2 Original Room Data Values

- `npm test`
- `npm run build`
- `npm run test:e2e`

### Added - Phase 2 Original Outside Data Values

- Added typed original outside data module.
- Ported exact outside constants:
  - store offset
  - gather cooldown
  - trap cooldown
  - population timing bounds
  - hut capacity
  - gather wood amounts with and without cart
- Ported exact worker income definitions for all original workers.
- Ported exact trap drop thresholds and messages.
- Ported exact worker unlock mapping from buildings and cleared mines.
- Ported village title thresholds and population-arrival notification thresholds.
- Added pure helper functions for original hut capacity, gather amount, trap drop count, bait consumption, village title lookup, and population message lookup.
- Wired outside data into the original content registry.
- Added outside data parity tests for constants, manifest worker keys, worker income, trap drops, unlocks, thresholds, helper formulas, and registry wiring.

### Verified - Phase 2 Original Outside Data Values

- `npm test`
- `npm run build`
- `npm run test:e2e`

### Added - Phase 2 Original World Data Values

- Added typed original world data module.
- Ported exact original world constants.
- Ported exact world tile symbols.
- Ported exact terrain probabilities.
- Ported exact world weapon definitions.
- Ported exact landmark definitions, including conditional prestige cache metadata.
- Wired world weapons and landmarks into the original content registry.
- Added world data parity tests for constants, tiles, probabilities, weapons, landmarks, and manifest key matching.

### Verified - Phase 2 Original World Data Values

- `npm test`
- `npm run build`

### Added - Phase 2 Original Core Data Values

- Replaced key-only perk registry entries with exact original names, descriptions, and notifications.
- Replaced key-only prestige registry entries with exact original store type mappings.
- Replaced key-only path weight entries with exact original weight values.
- Added original path constants:
  - `DEFAULT_BAG_SPACE = 10`
  - `DEFAULT_ITEM_WEIGHT = 1`
- Added `originalPathWeightFor()` with original default weight behavior.
- Added exact-value tests for perks, prestige mappings, and path weights.

### Verified - Phase 2 Original Core Data Values

- `npm test`
- `npm run build`

### Added - Phase 2 Data Port Foundation Slice

- Copied generated `DATA/canonical-manifest.json` into `src/generated` for typed app/test imports.
- Added typed canonical manifest definitions and baseline assertion.
- Added initial original content registry skeleton for:
  - perks
  - prestige store keys
  - path weight override keys
- Added source-baseline drift tests against selected `ORIGINAL/` file hashes.
- Added manifest parity tests for:
  - source commit
  - required source file checksums
  - initial core key sets
  - room definitions, workers, weapons, fabricator craftables, world tiles, and landmarks
  - event files and representative event titles

### Verified - Phase 2 Data Port Foundation Slice

- `npm test`
- `npm run build`

### Added - Phase 1 Engine Services

- Added typed `EventBus`.
- Added typed `CommandBus`.
- Added `NotificationCenter`.
- Added `CooldownManager` with renderable progress snapshots.
- Added memory-backed dev save adapter for deterministic save/load tests.
- Integrated core commands into `GameEngine`:
  - `state.set`
  - `state.add`
  - `notify`
  - `cooldown.start`
- Added dev-save round-trip support through the configured save adapter.
- Added unit tests for command dispatch, event publish/subscribe, notification recording, cooldown expiry/progress, engine command integration, and dev-save round trips.

### Verified - Phase 1 Engine Services

- `npm test`
- `npm run build`
- `npm run test:e2e`

### Added - Phase 0.5 Risk Spike

- Added separated spike modules under `src/spikes`.
- Added 61x61 ASCII world viewport generator.
- Added miniature deterministic event runtime with cost, reward, transition, and RNG branch behavior.
- Added cooldown pressure simulator to prove timer ticks can be coalesced into lower-frequency UI notifications.
- Added Canvas and DOM space prototypes.
- Added spike UI panel with tabs, keyboard focus probe, ASCII viewport, and both space prototypes.
- Added Playwright 4K project at 3840x2160.
- Added e2e checks for:
  - ASCII viewport stability and no horizontal overflow
  - keyboard focus and world movement probe
  - Canvas and DOM space prototype visibility
- Recorded Space rendering direction in `tech-decisions.md`: use Canvas for final Space implementation unless later parity evidence disproves it.

### Verified - Phase 0.5 Risk Spike

- `npm test`
- `npm run build`
- `npm run test:e2e`

### Added

- Started implementation on `remake/parity`.
- Added Vite + React + TypeScript scaffold under `REMAKE/`.
- Added Vitest unit test configuration.
- Added Playwright desktop smoke test configuration.
- Added strict Vite dev server port `41730` to avoid collisions with unrelated local apps.
- Added initial restrained desktop UI scaffold.
- Added headless engine foundation:
  - deterministic `Mulberry32Rng`
  - manual test clock
  - path-based state store
  - initial game engine snapshot
  - dev-only save adapter using `adr-remake-dev-save`
- Added architecture-boundary tests:
  - engine cannot import React/UI
  - source cannot call `Math.random()` directly
- Added engine unit tests for RNG, clock, and state store.

### Verified

- `npm install`
- `npm test`
- `npm run build`
- `npm run test:e2e`

### Notes

- No gameplay has been implemented yet.
- The app shell is explicitly an implementation scaffold, not the final first-screen gameplay state.
- Save/load remains dev-only and disposable until post-parity save versioning.
