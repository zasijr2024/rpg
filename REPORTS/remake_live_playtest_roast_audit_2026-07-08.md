# REMAKE Live-Playtest Roast Audit

Date: 2026-07-08  
Target: `REMAKE/`

## Executive Verdict

The REMAKE is a technically clean, test-heavy, early-game slice. It is not a complete playable remake.

The current build passes lint, build, unit tests, E2E tests, formatting, and dependency audit. That is good engineering hygiene. It does not change the product verdict: a normal player can play Room, Outside/Village, events, and combat slices, then hits a hard product wall before Path/World/Ship/Fabricator/Space/ending. Calling this "full remake parity" would be misleading. Calling it a strong Room/Outside/Event/Combat foundation is accurate.

Roast version: the codebase has built a surprisingly serious machine around a game that still cannot leave the village through the player-facing UI.

## Scope And Methodology

Inspected:

- `REMAKE/README.md`
- `REMAKE/docs/plan.md`
- `REMAKE/docs/parity-checklist.md`
- `REMAKE/docs/deferred.md`
- `REMAKE/docs/deviations.md`
- `REMAKE/src/ui/App.tsx`
- `REMAKE/src/ui/RoomView.tsx`
- `REMAKE/src/ui/OutsideView.tsx`
- `REMAKE/src/ui/EventPanel.tsx`
- `REMAKE/src/ui/styles/global.css`
- `REMAKE/src/engine/GameSession.ts`
- `REMAKE/src/engine/GameEngine.ts`
- `REMAKE/src/engine/room/RoomRuntime.ts`
- `REMAKE/src/engine/outside/OutsideRuntime.ts`
- `REMAKE/src/engine/path/PathRuntime.ts`
- `REMAKE/src/engine/world/WorldRuntime.ts`
- `REMAKE/src/engine/events/EventRuntime.ts`
- `REMAKE/src/engine/combat/CombatRuntime.ts`
- `REMAKE/src/engine/state/*`
- `REMAKE/src/tests/e2e/app.spec.ts`

Live-playtest method:

- Started Vite locally.
- Played in Chromium at 1920x1080.
- Used the in-app debug entry `?debug=1` and visible debug toggles `speed x 10` / `income x 10` to accelerate long original timers.
- Did not inject stores/resources during the live playtest.
- Interacted through visible UI buttons.
- Dismissed random events through visible event buttons.

Live-playtest screenshots:

- `REPORTS/audit-assets/remake-live-fresh-2026-07-08.png`
- `REPORTS/audit-assets/remake-live-after-outside-unlock-2026-07-08.png`
- `REPORTS/audit-assets/remake-live-workers-2026-07-08.png`
- `REPORTS/audit-assets/remake-live-stop-state-2026-07-08.png`

## Checks Run

All checks passed:

- `npm run lint`
- `npm run build`
- `npm test`: 28 test files, 288 tests passed
- `npm run test:e2e`: 192 Playwright tests passed
- `npm run format:check`
- `npm audit --audit-level=moderate`: 0 vulnerabilities

This is the strongest part of the project: the implemented slice is not falling apart under basic automation.

## Live-Playtest Summary

Fresh start:

- Visible tabs: `A Dark Room`, plus `settings` only because `?debug=1` was used.
- Future systems hidden at start: no Path, World, Ship, Fabricator, or Space UI.
- Starting room correctly showed dead fire / freezing room and only `light fire`.

Progress reached through visible UI:

- Lit the fire.
- Reached Outside/Village unlock.
- Gathered wood.
- Built `trap`, `cart`, `hut`, `lodge`, and `trading post`.
- Checked traps.
- Saw `Penrose` marketing event and beast attack event.
- Assigned hunters.
- Reached visible worker economy.
- Saw `compass` appear as a trading-post buy option.

Stop state:

- Final visible tabs: `A Firelit Room`, `A Lonely Hut`, `settings`.
- Final future-tab counts: `dusty path=0`, `world=0`, `ship=0`, `fabricator=0`, `space=0`.
- The UI was still Room/Village only.

Conclusion from live play: the current player-facing game stops before Path. The stop is not a flaky test issue; it is consistent with the code and the parity checklist.

## Findings

### Critical: The Current Build Is Not A Full Playable Game

Evidence:

- `REMAKE/README.md:7-8` explicitly says the player-facing prototype is Room, Outside/Village, event modal, and combat slices, while Path, World, Ship, Fabricator, Space, ending, and full fresh-playthrough parity are not player-reachable.
- `REMAKE/src/engine/GameSession.ts:23` defines `GameLocationKey` as only `"room" | "outside" | "settings"`.
- `REMAKE/src/ui/App.tsx:149-191` renders only `RoomView`, `OutsideView`, or `SettingsView`.
- `REMAKE/docs/parity-checklist.md:179-226` still marks Path, World, Ship, Fabricator, Space, and Ending parity open.
- `REMAKE/docs/parity-checklist.md:283` still marks the full playthrough smoke test open.
- Live playtest reached Trading Post / Compass visibility but still had no Path or World tab.

Impact:

The game cannot satisfy the core remake promise yet. A player cannot organically leave the village, explore the world, find the ship, launch, play space, or finish.

Recommendation:

Stop treating late-game combat/setpiece coverage as a substitute for the missing journey. Phase 7 and Phase 8 need to become player-facing before more late-game catalog work is allowed to count as progress toward playability.

### Critical: The Player Funnel Breaks At Path

Evidence:

- `compass` exists as a Room trade good in `REMAKE/src/content/original/room/roomData.ts:366`.
- `RoomRuntime` exposes `compass` eligibility through Trading Post logic in `REMAKE/src/engine/room/RoomRuntime.ts:514`.
- `PathRuntime` can set `features.location.path` and `game.path.pendingReturn` in `REMAKE/src/engine/path/PathRuntime.ts:25-26`.
- But `GameSession` cannot switch to a `path` location because `GameLocationKey` excludes it.
- `App.tsx` has no Path view and no Path tab rendering branch.

Impact:

The remake has data and internal hints for Path, but not a playable surface. That is worse than simply not starting Phase 7, because it can create false confidence: state flags exist, but the player cannot use them.

Recommendation:

Implement Path as a real first-class `GameLocationKey`, route, tab, snapshot, UI, command surface, and organic E2E path from buying compass to outfitting to embark. Do not hide this behind harness calls.

### High: Late-Game Browser Coverage Is Mostly Synthetic

Evidence:

- E2E helper `setState` directly mutates arbitrary state in `REMAKE/src/tests/e2e/app.spec.ts:9-16`.
- Late encounter tests trigger content directly with `triggerEventByKey` and `triggerWorldEncounter`, for example `REMAKE/src/tests/e2e/app.spec.ts:674-708`.
- Setpiece and executioner tests pre-seed perks, weapons, armor, and world flags, then call late-game event keys directly at `REMAKE/src/tests/e2e/app.spec.ts:842-905`.
- The genuinely organic browser test is the Phase 4 village worker path at `REMAKE/src/tests/e2e/app.spec.ts:514`.

Impact:

The browser suite proves that selected event/combat slices can render and resolve. It does not prove that the game can reach those slices through the real progression loop.

Recommendation:

Keep harness tests for edge cases, but separate them from reachability claims. Every completed phase needs one no-resource-injection browser path. Phase completion should require player-reachable proof, not just `window.__adrTest`.

### High: Phase 6 Is "Finalized" Only Under A Pragmatic Definition

Evidence:

- `REMAKE/docs/plan.md:579` says Phase 6 is finalized for a "pragmatic Combat Event Runtime scope".
- The same line documents 38 focused executioner keys and 49 focused setpiece keys.
- `REMAKE/docs/plan.md:579` also says exhaustive original branch parity remains later scope.
- `REMAKE/docs/parity-checklist.md:145` still leaves all event titles / later scene parity open.

Impact:

The project language can be overread as readiness. "Finalized" is true only for a limited combat-runtime slice, not for full event/setpiece/executioner parity.

Recommendation:

Rename status language in active docs to avoid ambiguity. Use "Phase 6 runtime slice complete" and keep "full event parity incomplete" visibly attached to it.

### High: WorldRuntime Is A Resolver, Not World Gameplay

Evidence:

- `WorldRuntime` maps distance/terrain to encounter keys and scene names to setpiece event keys in `REMAKE/src/engine/world/WorldRuntime.ts:22-109`.
- There is no player-facing world map UI in `App.tsx`.
- World parity items remain unchecked in `REMAKE/docs/parity-checklist.md:193-211`.

Impact:

This is not a world system yet. It is a routing table that lets tests ask, "which event would this world context pick?" Useful, but not exploration.

Recommendation:

Build actual World runtime state: map generation, position, visibility, food/water consumption, movement, landmark entry, and return paths. Then wire it to UI before expanding more world-selected event branches.

### High: Path Return State Exists Without A Path Surface

Evidence:

- Combat victory can set return markers through Path-related state.
- `PathRuntime.consumeWorldReturnLocation()` sets `features.location.path` and `game.path.pendingReturn` for `"path"` returns.
- `GameSession.consumeWorldReturnLocation()` only switches location when return is `"room"` in `REMAKE/src/engine/GameSession.ts:366-371`.
- `GameLocationKey` has no `"path"`.

Impact:

Victory/return semantics can leave correct-looking hidden state that the player cannot see. This is a classic integration trap: tests pass at the boundary, but the product has nowhere to go.

Recommendation:

Do not add more return-marker semantics until Path has a visible state consumer. Add a regression test that wins a combat organically from World/Path and lands in the visible Path UI.

### Medium: The State Model Is Still Too Loose For The Next Phases

Evidence:

- `GameState` is mostly `Record<string, unknown>` in `REMAKE/src/engine/state/types.ts:3-14`.
- Cross-system behavior uses string paths heavily.
- `StateStore` supports broad path mutation and multi-set APIs.

Impact:

This was pragmatic for porting original data, but Path/World/Ship/Space will multiply state coupling. Silent typo paths and shape drift are now a real risk.

Recommendation:

Before Phase 7/8 deepens integration, add typed selectors and command-level APIs for Path, World, Ship, and Fabricator. Keep raw path access available for parity ports, but do not let new UI/runtime code scatter string paths everywhere.

### Medium: Event Scheduling Works, But It Can Obscure Manual Verification

Evidence:

- `EventRuntime` schedules random events automatically through `scheduleNextEvent()` at `REMAKE/src/engine/events/EventRuntime.ts:319-328`.
- `randomEventsDisabled()` exists at `REMAKE/src/engine/events/EventRuntime.ts:746-747`, but this is test/config state, not a normal manual control.
- During live play, `Penrose` and `A Beast Attack` interrupted progression and had to be dismissed.

Impact:

This is not inherently wrong for the game. It is, however, noisy for manual QA and can hide whether a progression failure is due to missing UI, event overlay, or resource gating.

Recommendation:

Keep the original event behavior for parity, but add a documented QA-only route for random-event suppression that is clearly separate from player-facing debug. The current test harness has the capability; manual QA needs a clean, intentional workflow.

### Medium: UI Coverage Is Strong Only For Implemented Surfaces

Evidence:

- Playwright screenshots cover fresh Room, Room stores/build/craft/buy, Outside gather/workers, and spike views.
- `REMAKE/docs/parity-checklist.md:257-265` still leaves Path outfitting, World map grid, Ship/Fabricator controls, and Space playfield visual stability open.

Impact:

The implemented UI is restrained and stable. The unimplemented UI is still the majority of the game.

Recommendation:

Add visual baselines only when each system becomes real gameplay UI, not as isolated spike proof. The 4K requirement should follow actual player flows.

### Low: Debug Settings Are Useful But Must Stay Clearly Non-Product

Evidence:

- `REMAKE/docs/deviations.md:83-92` documents `?debug=1`, speed multiplier, income multiplier, and dev save controls.
- `App.tsx` hides settings unless `debug=1`.

Impact:

This is acceptable and useful for long-idle game testing. The risk is accidental screenshots or evaluation notes treating debug-visible state as normal parity UX.

Recommendation:

Keep it. Continue excluding it from clean screenshots and release builds. Label every manual playtest that uses it, as this report does.

## Game Evaluation

What works:

- The first screen has the right minimalism.
- Fire lighting, builder progression, Outside unlock, gathering, traps, huts, lodge, workers, and trading post create the expected early-game expansion.
- Random events are present enough to make the world feel alive.
- The stores/income model is readable once village production starts.

What fails:

- The game does not reach the real adventure. No Path. No World. No Ship. No Space. No ending.
- Combat and executioner content exist as slices, but the player cannot naturally earn their way into them.
- The current "big" late-game work is more like a regression harness than a game loop.

Product verdict:

This is a good prototype slice, not a remake. It currently proves the team can build the game. It does not yet let the player play the game.

## UI Evaluation

Strengths:

- The UI correctly avoids a modern dashboard look.
- No future systems are visible at fresh start.
- Tabs stay sparse.
- Room/Outside layout is stable at tested desktop widths.
- Event modal focus behavior is materially better than a loose overlay.
- Worker controls are compact and close to the original tone.

Weaknesses:

- The UI architecture is too small for the planned game: only Room, Outside, and Settings are routable.
- The player sees the economy approaching Path but never gets a Path surface.
- Later surfaces are represented by spikes/tests, not production screens.

UI verdict:

The implemented UI has restraint. The product problem is absence, not ugliness.

## Code And Architecture Evaluation

Strengths:

- Headless engine direction is correct.
- `GameSession` gives the UI a clear command boundary.
- `CombatRuntime` separation is a good correction against dumping combat into event modal logic.
- Deterministic RNG and clock-driven tests are the right foundation.
- Test volume is healthy for a parity project.
- Dependency versions are pinned and current checks are green.

Weaknesses:

- The location model is not ready for the real game.
- Path and World runtime work currently has no visible end-to-end player loop.
- The state model remains loose enough that future integration bugs will be easy to create.
- The E2E suite blends organic play and harness injection in a way that can inflate readiness perception.

Code verdict:

The code is not sloppy. The architecture is just currently ahead of the product surface in some places and behind it in the one place that matters most: a playable progression loop.

## Prioritized Next Actions

1. Implement Path as a real location: buy compass, reveal Path tab, outfit UI, capacity, add/remove supplies, perks, embark.
2. Add one organic browser test from fresh start to Path unlock without direct resource injection.
3. Implement World as actual gameplay: map generation, movement, food/water, visibility, encounters, landmarks, return.
4. Add one organic browser test from fresh start to first World embark and return.
5. Keep late-game event/combat harness tests, but stop counting them as player reachability.
6. Tighten docs language around "Phase 6 finalized" so it cannot be mistaken for full event parity.
7. Add typed Path/World selectors before more string-path integration spreads.
8. Convert combat victory/death return markers into visible Path/Room transitions with no hidden pending state.
9. Continue visual baselines for each new production surface at 1366, 1920, 2560, and 3840.
10. Only after Path/World are playable should Ship/Fabricator/Space work be evaluated as game progression rather than isolated modules.

## Residual Risk

The current implementation may keep passing all checks while still being unplayable past Village. That is the main risk: technical green lights are masking product incompleteness.

The project needs fewer proof slices and more uninterrupted player journey.

