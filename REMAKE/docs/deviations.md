# Parity Deviations Log

Last updated: 2026-07-07

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
- Test coverage: Playwright viewport checks and visual baselines for implemented Phase 3 states.

### DEV-002: Inline Action Costs Replace Original Hover Tooltip Dependency

- Status: accepted during parity implementation
- Date: 2026-07-06
- Area: UI/accessibility
- Original source: `ORIGINAL/script/room.js:1139-1198`
- Remake behavior: build, craft, and buy buttons render costs inline under the label instead of relying only on original-style tooltip behavior.
- Reason: visible costs are more inspectable, keyboard-friendly, and useful for screenshot regression.
- Player impact: costs are easier to read; progression, costs, disabled states, and affordability rules remain original.
- Test coverage: `src/tests/e2e/app.spec.ts` verifies explicit Room action costs.

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
- Remake behavior: `?testHarness=1` exposes deterministic test hooks for advancing time and setting state.
- Reason: Playwright and visual tests need deterministic setup for long original timers and hard-to-reach states.
- Player impact: none on the default entry; harness is query-gated and not visible in normal play.
- Test coverage: E2E and visual tests use the harness; default-entry tests verify spike/future systems stay hidden.

### DEV-005: Audio Data Preserved But Playback Deferred

- Status: accepted by deferred-scope contract
- Date: 2026-07-06
- Area: audio/deferred scope
- Original source: `ORIGINAL/script/audio.js`, `ORIGINAL/audio/`
- Remake behavior: audio manifest data is preserved, but sound effects, music, and ambience are not played during parity phases.
- Reason: audio, music, ambience, mobile support, and durable save migration are explicitly deferred until after gameplay/UI parity.
- Player impact: Phase 3 is silent compared with the original.
- Test coverage: deferred audio manifest data tests preserve source coverage.

### DEV-006: Realtime Catch-up Is Capped Per Browser Tick

- Status: accepted for runtime stability
- Date: 2026-07-06
- Area: engine/performance
- Original source: `ORIGINAL/script/engine.js` timer behavior through browser timeouts
- Remake behavior: production realtime driving advances by elapsed wall time, but one browser tick may catch up at most five minutes of simulation time.
- Reason: prevents a long-backgrounded tab from draining an unbounded number of scheduled timers synchronously when it resumes.
- Player impact: very long inactive/background sessions may not replay every missed minute immediately in one frame; normal active play and deterministic tests are unaffected.
- Test coverage: `src/tests/engine/clock.test.ts` covers elapsed-time driving and catch-up capping.

### DEV-007: In-App Debug Settings Tab

- Status: accepted for parity testing only
- Date: 2026-07-06
- Area: tooling/tests/UI
- Original source: none; the original production UI has no visible settings tab for speed or income multipliers.
- Remake behavior: `?debug=1` exposes a `settings` tab with default-off `speed x 10` and `income x 10` toggles, dev save/load/clear controls, and compact runtime debug info. Debug info avoids pre-discovery future-system labels. The default entry, `?debug=0`, and `?testHarness=1` without `debug=1` hide the tab for clean parity checks.
- Reason: accelerates manual verification and debugging of long original timers during parity implementation.
- Player impact: none on the default entry. Gameplay speed and income remain original unless the player/developer explicitly enters through `?debug=1` and enables a multiplier.
- Test coverage: `src/tests/engine/clock.test.ts`, `src/tests/engine/room-runtime.test.ts`, `src/tests/engine/game-engine.test.ts`, `src/tests/e2e/app.spec.ts`, and `src/tests/e2e/room-visual.spec.ts` cover default-hidden state, clean `?debug=0` state, opt-in `?debug=1` state, default-off multiplier behavior, lifecycle dev save/load, and clean visual baselines.

### DEV-008: Focused Event Modal Instead Of Browser Title Blink

- Status: accepted for Phase 5 Event Runtime
- Date: 2026-07-07
- Area: UI/accessibility
- Original source: `ORIGINAL/script/events.js:1299-1312`, `ORIGINAL/script/events.js:1407-1409`, and event scenes with `blink: true` in `ORIGINAL/script/events/global.js`, `ORIGINAL/script/events/room.js`, `ORIGINAL/script/events/outside.js`, and `ORIGINAL/script/events/marketing.js`.
- Remake behavior: event arrival is signaled through the visible event dialog, notification log, initial focus, and keyboard focus containment. The browser document title does not flash `*** EVENT ***`.
- Reason: browser title flashing is disruptive and unreliable across modern desktop browsers. The modal keeps attention and keyboard behavior local to the game surface while preserving event timing, text, notifications, costs, rewards, and choices.
- Player impact: event attention is still clear while the page is visible; background-tab title flashing is not reproduced.
- Test coverage: `src/tests/e2e/app.spec.ts` verifies event modal rendering, focus containment, stores-column separation, and long event text containment.

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
