# Current Prototype Full Roasting Audit

Date: 2026-07-11  
Revision inspected: `8b0938e963ba19df82779431f5aeaa4ff8ec06dd` plus the current Phase 14 working tree  
Audit scope: game design, progression, economy, runtime architecture, persistence, UI/UX, accessibility, performance, tests, delivery controls, and planning truth  
Verdict: **HOLD for Release Candidate; strong Alpha / parity-complete vertical slice**  
Confidence: **94%**

## Executive Roast

This is no longer a toy pretending to be a game. The connected loop reaches the ending, the content denominator is real, and the engine has unusually strong deterministic evidence. It is also not a release candidate. The prototype can currently lose an entire run when persistence fails and never tell the player, its main bundle has 59 bytes of budget headroom, its lazy routes can white-screen on chunk failure, and none of its impressive local gates are enforced by CI.

The implementation is strongest where most browser-game prototypes are weakest: deterministic timers, serializable RNG, transaction rollback, exact source data, and deep behavioral tests. It is weakest where players experience trust: saving, degraded network/storage behavior, physical readability, and evidence from uncontrolled long sessions.

What breaks first is probably not the ordinary progression path. It is the safety envelope around it: quota/storage loss, a stale lazy chunk, or the next harmless code change crossing the main-bundle ceiling.

## Scorecard

| Surface | Score | Confidence | Blunt assessment |
| --- | ---: | ---: | --- |
| Core game and progression | 8.0/10 | 93% | Connected, source-shaped, and completable; organic long-run distribution is still unmeasured. |
| Economy and balance | 7.0/10 | 90% | Faithful faucets/sinks after Phase 14 fixes; background lifecycle and source-authentic dominant choices remain awkward. |
| Runtime architecture | 7.5/10 | 90% | Strong typed boundaries and deterministic ownership; restoration invariants are shallower than the runtime contracts. |
| Event/combat/content system | 8.5/10 | 94% | The best part of the remake: machine denominator, exact graph checks, routed behavior, and specialized combat coverage. |
| Persistence and recovery | 6.5/10 | 96% | Checksums/backups are good; silent unavailability is unacceptable for a twelve-hour game. |
| UI/UX | 6.5/10 | 87% | Minimalist and stable, but frequently confuses “sparse” with “finished,” especially at 4K and at the ending. |
| Accessibility | 6.0/10 | 88% | Semantic controls/modal work is solid; the Canvas flight is not meaningfully nonvisual. |
| Performance and loading | 6.5/10 | 96% | Runtime budgets pass, but a 599,941-byte entry against 600,000 is a budget hostage situation. |
| Tests and tooling | 8.5/10 | 97% | Broad, deterministic, and unusually disciplined; full production progression remains thinner than dev evidence. |
| CI and release operations | 5.5/10 | 94% | Excellent local gates, zero repository CI, dirty-tree RC blocker. |
| Planning and documentation | 7.0/10 | 89% | Strong authorities, but accumulated historical prose repeatedly drifted past the actual implementation. |

## Methodology

The audit combined:

- direct comparison with the pinned original source and generated parity graph;
- runtime tracing across Room, Outside, Path, World, events, combat, Ship, Fabricator, and Space;
- deterministic reproductions for economy, Compass, save lifecycle, and scoring;
- focused and full Vitest execution;
- Chromium behavior and visual checks at 1366, 1920, 2560, and 3840;
- production `dist` execution in Chromium, Firefox, and WebKit;
- dependency, build, performance, accessibility, and release-gate inspection;
- visual inspection of Room, World, event, combat, Space midpoint, ending, and true full-viewport 4K evidence.

The audit distinguishes verified defects from structural risks, product decisions, and evidence gaps. Source-authentic ugliness is still called ugly, but it is not mislabeled as a parity defect.

## Findings

### High — Saving can fail for an entire run without telling the player

Verified defect. Browser storage read failures are now contained so startup does not blank, but `GameSession` returns a fresh session with no production warning. Autosave write failures are caught to protect the realtime loop and likewise expose no persistent state or UI warning.

Impact: a player can spend hours progressing while every save attempt fails, then discover the loss only after reload. For a game whose controlled route reaches `12:16:02`, silent persistence failure is not graceful degradation; it is a trust failure.

Required fix: expose persistence health in the session snapshot, show a durable “saving unavailable” warning, retain an in-memory last snapshot, and retry or offer export/recovery. Test blocked reads, quota writes, private-mode restrictions, and recovery across a real reload.

### Medium — The production entry has 59 bytes of raw budget headroom

Verified structural risk. The final build emits 599,941 bytes against a 600,000-byte limit and still triggers Vite’s over-500 kB warning. Fabricator, Ship, and Space view components are lazy, while the large content/runtime catalogs remain eager.

Impact: the next punctuation-sized production change can turn every build red. That encourages cap inflation or discourages safety fixes—both are signs that the boundary has stopped guiding architecture and started holding it hostage.

Required fix: split content by event pool or late-game domain and target meaningful headroom, ideally below roughly 80% of the current initial budget. Do not “solve” this by moving the number to 610,000.

### Medium — Save validation checks shape more deeply than meaning

Verified structural risk. Session lifecycle validation is detailed, but restored engine state and supported legacy state remain broadly record-shaped. Store clamping protects mutations, not every accepted restored value. Cross-domain invariants such as population/workers, map dimensions, mutually dependent unlock flags, and semantic store bounds are not comprehensively validated before live replacement.

Impact: malformed or hand-edited legacy data can be checksummed, accepted, migrated, and then softlock progression without technically corrupt JSON.

Required fix: add domain schemas and cross-field invariant validation before replacing live state, then property/fuzz tests for negative stores, malformed maps, worker over-allocation, impossible lifecycles, and backup recovery.

### Medium — The local release machine is impressive; the repository has no CI

Verified delivery risk. The project has layered parity, beta, release, audit, bundle, performance, and closure commands, but no checked-in GitHub Actions, GitLab, Azure, CircleCI, Jenkins, or equivalent pipeline.

Impact: nothing automatically stops gate drift or broken branches. The new production lane initially failed before manual execution exposed its loader mistake—exactly the class of failure CI should catch on every change.

Required fix: run clean-install, parity artifacts, types, unit/content, lint, format, build, production smoke, and dependency audit in CI. Keep the expensive four-resolution and cross-browser suites scheduled or release-gated if per-commit cost is excessive.

### Medium — Lazy late-game chunks have loading UI but no failure recovery

Verified structural risk. `React.lazy` and `Suspense` cover Fabricator, Ship, and Space loading. There is no route-level error boundary.

Impact: a stale deployment, offline transition, cache mismatch, or failed chunk request can blank the application precisely when a late-game player changes locations.

Required fix: wrap lazy locations in a save-preserving error boundary with retry/reload recovery. Abort each chunk request in Playwright and require recoverable UI instead of an unhandled render failure.

### Medium — Space remains effectively inaccessible to a nonvisual player

Verified accessibility limitation. The Canvas exposes only “ship and N pieces of debris.” It does not announce ship position, debris direction/distance, collision threat, or an alternative avoidance model. Manual Narrator evidence covers Room, compact World, and Combat—not Space.

Impact: semantic movement buttons and a clean axe scan do not make collision avoidance playable without sight. The main game can be navigated; the final skill gate cannot.

Required fix: provide a concise optional spatial feed or nonvisual lane, then perform real screen-reader flight and ending evidence. If nonvisual Space is explicitly out of scope, document that limitation instead of treating automated WCAG output as completion.

### Medium — 4K is stable but behaves like a postage stamp

Verified UX limitation. The true 3840x2160 screenshot shows the complete initial game occupying a narrow 920-pixel maximum shell with ordinary small type in a field of unused white. It does not overflow, but “does not break” is weaker than “is readable and intentional.” The score ending is an especially tiny island of three lines and one button.

Impact: on a physically dense unscaled display, the interface is technically present and visually underpowered. The result can look like an unstyled test fixture rather than deliberate severe minimalism.

Required fix: define a physical-density/large-desktop typography policy and manually validate actual 4K hardware. Preserve whitespace, but let type, hit areas, and the ending carry enough visual authority to feel intentional.

### Medium — Open-tab catch-up and closed-tab time have radically different economics

Accepted product deviation, not an undisclosed bug. An open background tab serializes and eventually replays all suspended time in bounded batches; a closed page earns nothing. At 80 gatherers plus Builder, a one-hour replay produced about 29,508 wood versus roughly one overdue tick under a naïve suspended-timeout interpretation.

Impact: “leave the tab open” becomes a materially dominant metagame choice. This is deterministic and documented, but it is not neutral.

Required decision: retain the deviation and own the behavior as a product rule, or cap/coarsen old debt. Add a player-facing expectation if the game is distributed beyond a technical preview.

### Medium — Completion proof is a reachability trace, not a balance distribution

Evidence gap. The visible-control fresh spine is excellent regression evidence, but it controls the clock and RNG and uses a selected generated route. The 64-seed World corpus proves map/landmark reachability, not full-run completion under deaths, random fights, loot variance, event timing, backgrounding, or prestige.

Impact: the game can be completed; how reliably and enjoyably ordinary players complete it remains unknown. The asserted `12:16:02` milestone is not a median, percentile, or usability result.

Required evidence: multi-seed headless progression simulation plus several unassisted human sessions. Record completion/failure rate, deaths, resource bottlenecks, time by phase, and abandonment points.

### Low — Supported store bounds exceed exact score arithmetic

Verified boundary defect. Store values can reach roughly `10^14`, while score sums/multiplies ordinary JavaScript numbers. A maximum-stock score exceeds `Number.MAX_SAFE_INTEGER`; changing a component by one can produce the same displayed result.

Impact: normal play will not approach the boundary, but imported/tampered saves can no longer claim exact scoring.

Required fix: lower semantic caps, validate realistic maxima, or use bounded integer/`bigint` score arithmetic.

### Low — Several source-authentic choices remain obviously dominant

Design observation, not a remake regression:

- Hunter produces more ending-score value per worker-second than Gatherer.
- Alien Alloy converted to hull is worth far more score than leaving it unspent once survival is secured.
- The 100-unit Mysterious Wanderer gamble is positive expected value while the 500-unit option is negative under linear value.
- Beggar’s smaller Fur option dominates the larger donation in expected score terms.
- Most processing workers destroy ending-score value and exist mainly as progression utilities.

Impact: strategic diversity near the ending is thinner than the number of available controls suggests. Preserve this for parity, then decide explicitly whether post-parity balance work should keep the original’s rough edges.

### Low — Full production progression evidence remains thinner than dev evidence

The new production suite genuinely serves `dist` and passes startup, save/reload, blocked storage, and Fabricator/Ship/active-Space lazy routes in Chromium, Firefox, and WebKit. The complete controlled fresh ending spine and full release/zoom matrix still run against the development server so they can use compiled-out deterministic hooks.

Required evidence: add a scheduled production-preview complete spine or a build-external fixture mechanism that can drive the whole route without shipping test controls.

## Defects Found And Fixed During This Audit

The roast changed the prototype materially before this report was finalized:

1. **Critical active-flight save loss:** Space spawned debris at `y = -40`, but save validation rejected negative Y. Immediate save/load quarantined a normal flight. Validation now accepts the bounded `-40..740` runtime domain, with immediate and consecutive-flight save tests.
2. **High Ship progression corruption:** generated ship coordinates reused `game.world.ship`, overwriting the canonical Crashed Ship boolean and revoking Ship unlock on safe return. Coordinates now live at `game.world.shipPosition` with legacy reads and boolean preservation.
3. **High unreachable thief system:** the post-World `>5000` stock trigger and ten-second theft accounting were missing. Organic theft, actual stolen amounts, restitution, and the `stealthy` branch are now reachable.
4. **High missing production Hyper:** the original player-facing x2 mode existed only as dead data. It now confirms first activation, persists, doubles eligible timers/cooldowns, and leaves Space at classic timing.
5. **High Space score inflation:** Builder/worker income continued during ascent and entered the ending score. Passive income is now suspended while Space is active.
6. **Medium false Compass heading:** a Nomad-bought Compass could announce a direction before a map/ship position existed. Compass acquisition now ensures World generation first.
7. **Medium modal leakage:** background tabs, World pointer controls, and command dispatch remained usable behind `aria-modal`. The surface is now inert and command-guarded until the event closes.
8. **Medium Space contrast failure:** foreground and background crossed near altitude 30 at about 1.12:1. Every altitude now guarantees at least 4.5:1 for essential glyphs.
9. **Medium compact-control focus loss:** an all-disabled stepper could remain without any tab stop after becoming enabled. Roving focus now recovers.
10. **High blocked-storage blank screen:** a thrown storage read could abort initial render. Startup now falls back to a fresh playable session, and the production cross-browser lane verifies it.
11. **High gate-runner false failure:** Windows/Node 25 could not execute configured `npm.cmd` children, so every expensive gate stopped at its first green command. The runner now invokes the Windows command processor explicitly, reports spawn errors, and completed the cumulative Beta gate.

## Systems And Economy Notes

The normal economy is comprehensively data-driven. Builder adds 2 Wood per 10 seconds; Gather and Cart preserve their original 10/50 Wood per 60 seconds; worker converters run at ten-second cadence; Traps retain the original 90-second rolls. No infinite normal-play conversion loop was found, and every home trade is score-negative.

The strongest systems choice is central authority: expedition resources, combat lifecycle, World transaction commit/rollback, score, and persistence are not scattered through React handlers. That makes exact one-time costs/rewards and death rollback genuinely testable.

The weakest systems unknown is emergent pacing. Determinism makes bugs reproducible; it does not automatically prove that the resulting game is well paced.

## Test And Release Evidence

- Full unit/content corpus: 69 files / 483 tests reported green after fixes.
- Exact event graph: 48 source identities, 274 scenes, 462 buttons, 542 transitions, 869 effects, 352 rewards, 2,547 requirements, 2,791 edges.
- World randomized corpus: 64 production RNG seeds with exact landmark counts and reachability.
- Visual matrix: 18 states at each of 1366, 1920, 2560, and 3840, including true full-viewport framing.
- Production bundle: 599,941 B raw / 141,041 B gzip initial JavaScript; three late-game lazy entries; development/test markers absent.
- Production browser smoke: 9/9 across Chromium, Firefox, and WebKit.
- Production performance: startup, long-task, total-long-task, idle-long-task, and timer-delay budgets pass.
- Dependency audits: zero known vulnerabilities in production and complete dependency trees.
- Static gates: Parity Complete ready, Production Beta ready, Release Candidate blocked by the dirty worktree.

## Priority Order

1. Make persistence failure visible and recoverable.
2. Split eager content before the 59-byte budget margin becomes permanent friction.
3. Add clean-checkout CI for the executable gates.
4. Add lazy-route error containment.
5. Deepen semantic save validation and fuzz it.
6. Decide whether nonvisual Space is a supported requirement and test the decision honestly.
7. Run multi-seed and human pacing studies before calling the product balanced or broadly ready.
8. Revisit 4K typography and ending presentation without destroying the sparse identity.

## Final Verdict

The prototype has earned Phase 14 parity acceptance. It has not earned “ship it and stop worrying.” The core game is substantially more rigorous than its visual austerity suggests, but the delivery envelope is still Alpha-grade. Call it parity-complete. Call it a strong vertical slice. Do not call it a Release Candidate until saving can fail loudly, the bundle can breathe, the lazy routes can recover, the gates run somewhere other than one developer’s machine, and the worktree can produce a clean reproducible artifact.
