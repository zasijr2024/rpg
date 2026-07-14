# Parity Deviations Log

Last updated: 2026-07-11

This file records every intentional deviation from original web behavior or data.

## Rules

- Do not change original behavior silently.
- Add an entry before or with the implementation that creates the deviation.
- Link to the source behavior in `ORIGINAL/` or `DATA/`.
- Explain why the deviation is necessary.
- Classify whether it affects gameplay, UI, accessibility, performance, stability, or tooling.

## Current Deviations

### DEV-001: Modern Desktop UI Instead Of Original CSS Pixel Parity

- Status: accepted during parity implementation
- Date: 2026-07-06
- Area: UI
- Original source: `ORIGINAL/script/room.js`, `ORIGINAL/script/outside.js`, original CSS assets
- Remake behavior: preserves sparse layout, text-first controls, reveal order, and desktop readability, but uses modern React markup and local CSS rather than original jQuery/CSS structure and pixel behavior.
- Reason: the remake target is stable modern desktop UI parity, not exact DOM/CSS cloning.
- Player impact: intended to preserve tone and progression while improving layout stability at 1366 through 3840 widths.
- Test coverage: `src/tests/e2e/room-visual.spec.ts` locks 17 production states at 1366x768, 1920x1080, 2560x1440, and 3840x2160; release zoom/containment checks cover the longest modal content.

### DEV-002: Inline Action Costs Replace Original Hover Tooltip Dependency

- Status: accepted during parity implementation
- Date: 2026-07-06
- Area: UI/accessibility
- Original source: `ORIGINAL/script/room.js:1139-1198`
- Remake behavior: build, craft, and buy buttons render costs inline under the label instead of relying only on original-style tooltip behavior.
- Reason: visible costs are more inspectable, keyboard-friendly, and useful for screenshot regression.
- Player impact: costs are easier to read; progression, costs, disabled states, and affordability rules remain original.
- Test coverage: `src/tests/e2e/room-contracts.spec.ts` and `src/tests/e2e/room-visual.spec.ts` verify explicit Room action costs and their desktop presentation.

### DEV-003: React Tab Shell Instead Of Original Location Slider DOM

- Status: accepted during parity implementation
- Date: 2026-07-06
- Area: UI/navigation
- Original source: `ORIGINAL/script/room.js:520`, `ORIGINAL/script/outside.js:141-147`
- Remake behavior: locations render as semantic React tabs/panels rather than the original jQuery location slider DOM.
- Reason: semantic tabs preserve the original reveal model while fitting the modern React UI architecture.
- Player impact: Room and Outside reveal in the same order with original titles; transition animation and slider mechanics are not cloned.
- Test coverage: E2E discovery tests, Outside tab progression tests, and full-shell Phase 3 visual baselines.

### DEV-004: Dev-Only Test Harness Route

- Status: accepted for parity testing only
- Date: 2026-07-06
- Area: tooling/tests
- Original source: none; original debug handling differs and is not user-facing parity behavior.
- Remake behavior: the development server accepts `?testHarness=1` and exposes deterministic test hooks for advancing time and setting state. Production builds compile the harness and declarative seed catalog out.
- Reason: Playwright and visual tests need deterministic setup for long original timers and hard-to-reach states.
- Player impact: none on the default development entry and no shipped production code path.
- Test coverage: E2E and visual tests use the development harness; `scripts/verify-production-bundle.mjs` plus `src/tests/e2e/production-bundle.spec.ts` prove production exclusion in the emitted `dist` bundle.

### DEV-005: Audio Data Preserved But Playback Deferred

- Status: accepted by deferred-scope contract
- Date: 2026-07-06
- Area: audio/deferred scope
- Original source: `ORIGINAL/script/audio.js`, `ORIGINAL/audio/`
- Remake behavior: audio manifest data is preserved, but sound effects, music, and ambience are not played during parity phases.
- Reason: audio, music, and ambience are explicitly deferred until after gameplay/UI parity. Durable remake-save recovery was pulled forward by the production-readiness program; original-browser save import remains deferred.
- Player impact: the current complete desktop game is silent compared with the original.
- Test coverage: deferred audio manifest data tests preserve source coverage.

### DEV-006: Realtime Background Debt Is Replayed In Bounded Batches

- Status: accepted for runtime stability
- Date: 2026-07-06
- Area: engine/performance
- Original source: `ORIGINAL/script/engine.js` timer behavior through browser timeouts
- Remake behavior: while the page remains open, production records all suspended wall time as serialized debt and eventually replays it in normal 250 ms simulation steps. Each outer browser tick drains at most ten seconds of wall-time debt. Closing the page does not create new debt, so closed-page time earns no production.
- Reason: deterministic bounded replay prevents browser throttling from deleting progress while also preventing a long-backgrounded tab from draining an unbounded number of scheduled timers in one frame.
- Player impact: an open background tab eventually earns the same production as continuous play, while a closed page earns none. Very long debt takes multiple browser ticks to drain. This lifecycle strategy is intentionally more deterministic than the original browser's throttled timeout behavior.
- Player disclosure: the first successful saved-session resume posts a dismissible global notice that time catches up only while the tab remains open and that closing the page earns nothing.
- Test coverage: `src/tests/engine/clock.test.ts`, `src/tests/engine/economy-cadence.test.ts`, `src/tests/engine/atomic-save.test.ts`, `src/tests/e2e/background-catch-up.spec.ts`, and the release save/background matrix cover bounded replay, continuous equivalence, debt serialization, reload, and the player-facing notice.

### DEV-007: In-App Debug Settings Tab

- Status: accepted for parity testing only
- Date: 2026-07-06
- Area: tooling/tests/UI
- Original source: none; the original production UI has no visible settings tab for speed or income multipliers.
- Remake behavior: `?debug=1` exposes a `settings` tab with default-off `speed x 10` and `income x 10` toggles, dev save/load/clear controls, and compact runtime debug info. Debug info avoids pre-discovery future-system labels. The default entry, `?debug=0`, and `?testHarness=1` without `debug=1` hide the tab for clean parity checks.
- Reason: accelerates manual verification and debugging of long original timers during parity implementation.
- Player impact: none on the default entry. Gameplay speed and income remain original unless the player/developer explicitly enters through `?debug=1` and enables a multiplier.
- Test coverage: engine clock/session contracts, `src/tests/e2e/room-contracts.spec.ts`, `src/tests/e2e/room-visual.spec.ts`, and the production-bundle verifier cover default-hidden state, opt-in development state, multipliers, lifecycle save/load, clean visual baselines, and compile-time production exclusion.

### DEV-008: Focused Event Modal Instead Of Browser Title Blink

- Status: accepted for Phase 5 Event Runtime
- Date: 2026-07-07
- Area: UI/accessibility
- Original source: `ORIGINAL/script/events.js:1299-1312`, `ORIGINAL/script/events.js:1407-1409`, and event scenes with `blink: true` in `ORIGINAL/script/events/global.js`, `ORIGINAL/script/events/room.js`, `ORIGINAL/script/events/outside.js`, and `ORIGINAL/script/events/marketing.js`.
- Remake behavior: event arrival is signaled through the visible event dialog, notification log, initial focus, and keyboard focus containment. The browser document title does not flash `*** EVENT ***`.
- Reason: browser title flashing is disruptive and unreliable across modern desktop browsers. The modal keeps attention and keyboard behavior local to the game surface while preserving event timing, text, notifications, costs, rewards, and choices.
- Player impact: event attention is still clear while the page is visible; background-tab title flashing is not reproduced.
- Test coverage: `src/tests/e2e/event-contracts.spec.ts`, `src/tests/e2e/release-matrix.spec.ts`, `src/tests/e2e/accessibility-release.spec.ts`, and the four-target visual matrix verify modal rendering, inert background isolation, focus containment, stores separation, combat containment, and long-text scrolling.

## Template

```text
### DEV-000: Title

- Status:
- Date:
- Area:
- Original source:
- Remake behavior:
- Reason:
- Player impact:
- Test coverage:
```
