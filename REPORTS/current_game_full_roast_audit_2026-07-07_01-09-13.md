# Current Game Full Roast Audit

Date: 2026-07-07 01:09 Europe/Berlin  
Scope: `REMAKE` current game, code, engine, UI, tests, planning, context, and parity posture.

## Executive Verdict

The current remake is no longer a toy prototype. It has a real headless engine, deterministic tests, browser coverage across 1366/1920/2560/3840, visual baselines, a cleaner session boundary, and a plausible Room/Outside implementation. The recent Outside overlap fix also held up under screenshots and e2e coverage.

The roast: the project is now good enough to be dangerous. The green suite makes the implementation look more complete than it is, because several lifecycle systems are still fake-thin. Saves do not restore runtime timers/cooldowns/events. The default screen now includes a non-original settings tab that leaks debug state and weakens the discovery promise. Event runtime coverage is one Beggar slice against a manifest with 45 event titles. The plan is strong, but the current game should not be described as parity-ready beyond Room/Outside.

No critical build failure was found. The main risk is architectural debt hardening into the next phases.

## Methodology

Inspected:

- planning/control docs: `context.md`, `plan.md`, `parity-checklist.md`, `deviations.md`, `ui-spec.md`
- engine: `GameEngine`, `GameSession`, `RoomRuntime`, `OutsideRuntime`, `EventRuntime`, clock/state/save services
- UI: `App`, `RoomView`, `OutsideView`, `SettingsView`, `EventPanel`, global CSS
- tests: unit/engine/content/e2e/visual coverage
- canonical manifest and extracted source docs for event coverage
- current visual snapshots for Outside/Room layout
- current git status and package scripts

Checks run:

- `npm run build` - passed
- `npm test` - 25 files, 127 tests passed
- `npm run test:e2e` - 120 Playwright tests passed

## Findings

### High - Dev Save/Load Restores State But Not The Game

Evidence:

- `GameEngine.saveDevState()` stores only `this.state.snapshot()` and `loadDevState()` only replaces `StateStore`: `REMAKE/src/engine/GameEngine.ts:76`, `REMAKE/src/engine/GameEngine.ts:83`, `REMAKE/src/engine/GameEngine.ts:89`.
- Runtime lifecycle is held outside state: `RoomRuntime` has `private initialized = false` and private timer ids: `REMAKE/src/engine/room/RoomRuntime.ts:78`; builder progression is scheduled by object-local timers: `REMAKE/src/engine/room/RoomRuntime.ts:521`.
- Outside population/income also uses object-local timers: `REMAKE/src/engine/outside/OutsideRuntime.ts:77`, `REMAKE/src/engine/outside/OutsideRuntime.ts:280`.
- Current save tests only prove a plain state value round-trip and title restoration, not resumed progression: `REMAKE/src/tests/engine/game-engine.test.ts:51`, `REMAKE/src/tests/e2e/app.spec.ts:78`.

Why this matters:

If a player saves after lighting the fire or while population growth/event timing is pending, load can restore visible state while silently losing the runtime schedule that should continue it. That is worse than no save because it lies.

Recommendation:

Either make dev save explicitly state-only and hide it from normal default UI, or promote it to a session save that serializes/restores clock time, cooldowns, pending timers, active event state, and notification state. At minimum add regression tests: save after lighting fire, reload, load, advance original builder delay, assert builder arrives; save with hut capacity, load, advance, assert population grows.

### High - Default Debug Settings Break The Game's First Promise

Evidence:

- Debug is enabled unless `?debug=0`: `REMAKE/src/ui/App.tsx:27`.
- The default-entry test now expects `settings` visible: `REMAKE/src/tests/e2e/app.spec.ts:45`.
- Settings exposes internal future-state labels like `outside` before Outside is discovered: `REMAKE/src/ui/SettingsView.tsx:78`.
- Docs still say the start should hide future systems: `REMAKE/docs/parity-checklist.md:201`, while separately accepting the visible debug deviation: `REMAKE/docs/parity-checklist.md:31`, `REMAKE/docs/parity-checklist.md:261`.

Why this matters:

A Dark Room works because the first interface is almost nothing. The visible `settings` tab makes the default experience no longer clean parity. It also leaks the existence of "outside" through debug info before the player earns that concept.

Recommendation:

Keep debug default-on only for local dev builds if you insist, but gate production/parity entry behind a build-time or environment flag. Better: make `/` parity-clean and use `?debug=1` or `/dev` for tooling. If debug remains default, the reportable state should stop claiming "default-entry discovery hygiene" without the asterisk.

### High - Event Runtime Is A Thin Slice, Not A System Yet

Evidence:

- `originalEventDefinitions` contains only `The Beggar`: `REMAKE/src/content/original/events/eventData.ts:28`, `REMAKE/src/content/original/events/eventData.ts:31`.
- The canonical manifest lists 45 event titles: `DATA/canonical-manifest.json:1054`.
- Extracted event docs include full Global/Room/Outside/Marketing event trees, e.g. `The Thief` and `The Nomad`: `DATA/canonical-manifest.json:1121`, `DATA/canonical-manifest.json:1153`.
- The checklist correctly marks event pool composition incomplete: `REMAKE/docs/parity-checklist.md` Event Runtime/Event Content sections.

Why this matters:

The current `EventRuntime` proves a happy-path story event can render, spend, reward, branch, and end. It does not yet prove event parity, delayed events, combat scenes, onLoad side effects, blink/attention behavior, or marketing/outside/global pool composition. This is fine for Phase 5, but dangerous if the code shape becomes the event architecture before the hard cases arrive.

Recommendation:

Port the next event in each category before generalizing further: one Global event with `onLoad`, one Outside event with population/building side effects, one delayed event, and one combat event skeleton. Add event coverage counts against `DATA/canonical-manifest.json` so "one event exists" can never masquerade as event coverage.

### High - Event Panel Ignores The UI Spec's Modal/Focus Requirement

Evidence:

- UI spec requires event panels to trap focus: `REMAKE/docs/ui-spec.md:211`.
- `EventPanel` renders a plain `<section>` with `aria-label="event"` and no role, focus management, escape handling, or focus containment: `REMAKE/src/ui/EventPanel.tsx:12`.
- CSS absolutely overlays it at a fixed top offset: `REMAKE/src/ui/styles/global.css:587`.

Why this matters:

Once events matter, letting focus wander behind the event panel creates accidental background actions and weak accessibility. The original event experience demands attention; this implementation visually overlays but does not behaviorally modalize.

Recommendation:

Make events a proper modal/dialog surface: `role="dialog"` or equivalent semantics, initial focus on the first valid choice, focus containment while active, escape behavior only if original-compatible, and tests that tabbing cannot reach Room/Outside controls while an event is active.

### Medium - Tests Are Green But Over-Injected

Evidence:

- E2E tests heavily use `?testHarness=1` and direct state mutation: `REMAKE/src/tests/e2e/app.spec.ts:52`, `REMAKE/src/tests/e2e/app.spec.ts:188`, `REMAKE/src/tests/e2e/app.spec.ts:203`, `REMAKE/src/tests/e2e/app.spec.ts:270`, `REMAKE/src/tests/e2e/app.spec.ts:389`.
- Harness APIs expose direct state set and event trigger: `REMAKE/src/engine/GameSession.ts:154`, `REMAKE/src/engine/GameSession.ts:167`.
- There is one valuable natural Phase 4 progression test, but no full playthrough smoke yet: `REMAKE/docs/parity-checklist.md` still lists full playthrough smoke as open.

Why this matters:

Harness tests are good for determinism, but they can skip exactly the unlock/timer sequences where this game tends to break. The suite currently proves many pieces in isolation and one mid-game path. It does not yet prove the game can survive long-form progression, saves, reloads, events, and timing in combination.

Recommendation:

Add a small set of "no direct state injection" browser scenarios for every completed phase boundary. Especially add save/load-resume, Room-to-Outside-to-Hut with real timers under speed debug, and first event scheduling without `triggerEventForTest()`.

### Medium - Timer Ownership Is Scattered Across Runtime Objects

Evidence:

- Room owns fire, temperature, builder, need-wood, and income timer ids internally: `REMAKE/src/engine/room/RoomRuntime.ts:78`.
- Outside owns population and income timer ids internally: `REMAKE/src/engine/outside/OutsideRuntime.ts:64`.
- Event runtime owns an internal event timer: `REMAKE/src/engine/events/EventRuntime.ts:105`.
- `GameEngine` has a clock but no domain-level scheduler state snapshot.

Why this matters:

This works while modules are alive in one session. It becomes brittle under save/load, module reconstruction, hot reload, future pause/resume, and tests that jump state. The timer graph is not inspectable as game state.

Recommendation:

Centralize scheduled game tasks in the engine/session layer or make each runtime reconstruct timers from state idempotently. A `RuntimeScheduler` with typed task keys would make save/load, debugging, and tests much less guessy.

### Medium - CSS Is Better, But Still Layout-Fragile

Evidence:

- The shell uses fixed 700px panel minimums and 220px left notification reserve: `REMAKE/src/ui/styles/global.css:35`, `REMAKE/src/ui/styles/global.css:88`, `REMAKE/src/ui/styles/global.css:105`.
- Notifications are absolutely positioned left of the play column: `REMAKE/src/ui/styles/global.css:419`.
- Event panel is absolute with fixed `top: 90px`: `REMAKE/src/ui/styles/global.css:587`.
- Checklist still has browser zoom checks open: `REMAKE/docs/parity-checklist.md` UI section.

Why this matters:

The recent forest/pop overlap is fixed, and screenshots pass at target widths. But the layout is still a pile of carefully tuned old-school offsets. It will keep breaking as Path/World/Combat/Ship surfaces are added unless zoom, long text, and modal interactions get tested.

Recommendation:

Keep the original-near composition, but add zoom/long-text visual tests before adding Path/Combat. Also introduce layout primitives for shell, side panel, log, modal, and action columns so every new module does not copy fixed offsets.

### Medium - Tooling Claims Outrun Package Scripts

Evidence:

- Plan requires linting/formatting in Phase 0: `REMAKE/docs/plan.md` Phase 0.
- `package.json` includes `eslint` and `prettier`, but scripts only expose `dev`, `build`, `preview`, `test`, `test:e2e`, and `check:architecture`: `REMAKE/package.json:6`.
- `zustand` is installed but unused: `REMAKE/package.json:21`.

Why this matters:

This is not a runtime bug, but it is process drift. The plan says linting/formatting are part of the scaffold; the repo currently relies on TypeScript/tests and human discipline.

Recommendation:

Either add real `lint`, `format`, and `format:check` scripts with config, or delete the claim until it exists. Remove unused `zustand` until the app actually adopts an external-store architecture.

### Medium - Git State Is Too Dirty For A Fast-Moving Parity Project

Evidence:

- `git status --short` shows a large set of modified and untracked files across docs, engine, UI, tests, screenshots, and reports.

Why this matters:

The project is making broad architectural changes quickly. Without commits at clean milestones, future regressions become archaeology. Visual baselines and behavior changes are especially hard to review when all phases are one unbounded diff.

Recommendation:

Commit in reviewable slices: audit report, report remediation, layout fix, debug default change, event slice, visual baselines. Use tags or milestone branches as planned in `git-versioning.md`.

### Low - Worker Controls Are Functionally Tested But Still Tiny

Evidence:

- Worker controls are 14x12 absolute-positioned arrow buttons: `REMAKE/src/ui/styles/global.css:301`, `REMAKE/src/ui/styles/global.css:314`.
- They have aria labels and focus styles, but the visual target remains tiny.

Why this matters:

This matches the sparse style, but repeated village assignment is one of the first dense interactions. Tiny controls are easy to misclick and harder to scan, especially at browser zoom.

Recommendation:

Keep the compact arrows, but make the actual hit box larger than the visible glyph and add focused/hover affordances that do not visually bloat the table.

## Game Evaluation

The Room and Outside/Village loop is now materially playable: fire, builder, wood, traps, huts, population, workers, income, and basic events exist. The pacing is still recognizably A Dark Room.

The danger is false confidence. There is no Path, World, Combat, Ship, Fabricator, Space, or ending runtime. Event content is only one Room event. Save/load is not trustworthy beyond a disposable demo. The current game is a strong vertical slice, not a remake yet.

## UI Evaluation

The UI has moved closer to the original sparse feel. Times-style text, narrow controls, side stores, and left notification log work. The Outside overlap issue is fixed in screenshots and tests.

The default settings tab damages first-impression purity. The event panel is visually present but not interaction-modal. The CSS layout is acceptable for current screens but still fragile enough that every new module can reopen overlap problems.

## Code And Engine Evaluation

The best code decisions are the headless engine, deterministic RNG, path-based state compatibility, `GameSession` command boundary, and architecture tests. Those are the right bones.

The weakest part is lifecycle ownership. State, timers, cooldowns, event activity, and notifications are split across services without a unified snapshot/reconstruction story. That is manageable now and expensive later. Fix it before Path/World/Combat multiplies the number of long-running state machines.

## Tests Evaluation

The test suite is much better than the average prototype: 127 unit tests, 120 e2e/visual tests, manifest/data parity checks, and architecture boundaries.

The gap is that many browser tests are setup-heavy with direct state injection. That is useful, but it under-tests natural progression, resumed progression, and real-time behavior. The current green suite says "implemented components work"; it does not yet say "the game survives being played like a game."

## Planning And Context Evaluation

The planning docs are unusually good: the source baseline is pinned, deferred scope is clear, deviations are logged, and the parity checklist is honest about unfinished systems.

The weak spot is that the debug-default change creates a constant asterisk around "default entry" claims. The docs acknowledge the deviation, but product truth is product truth: the default screen now exposes tooling. Keep that distinction sharp or future audits will start treating dev convenience as design.

## Prioritized Next Actions

1. Fix or explicitly downgrade dev save/load: either serialize runtime lifecycle or label it as state-only and remove it from default-facing UI.
2. Add save/load-resume tests for builder progression, cooldowns, population growth, and active/pending event state.
3. Decide whether `/` is a parity entry or a dev entry. If parity, hide settings by default again. If dev, document a clean parity URL and test it.
4. Expand Event Runtime with one global, one outside, one delayed, and one combat-shaped event before porting dozens of definitions.
5. Make `EventPanel` a real modal/dialog with focus containment.
6. Add zoom and long-text visual checks before Path/World/Combat UI begins.
7. Add real lint/format scripts or remove the tooling claim.
8. Commit the current broad diff into reviewable milestones.

## Residual Risk

I did not perform a manual long-play session. The audit used static inspection, docs, screenshots, and automated checks. The highest-risk unverified path is resumed progression after save/load, because the code structure strongly suggests a failure and current tests do not cover it.

