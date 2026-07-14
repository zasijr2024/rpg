# UI Specification

Last updated: 2026-07-11

Purpose: define a measurable minimalist desktop UI target for implementation and phase gates. This prevents "modernized" from turning into visually noisy or over-explained.

Design authority: `ANALYSE/authors_vision_and_success.md`

## Core UI Principle

The UI should feel sparse, cold, precise, and discoverable. It may be clearer and more stable than the original, but it must not feel like a dashboard, landing page, mobile game shell, or illustrated adventure UI.

## Supported Desktop Resolutions

- 1366x768: usable
- 1920x1080: primary
- 2560x1440: polished
- 3840x2160: polished 4K

Browser zoom checks:

- 100%
- 125%
- 150%
- 200%

## Layout Tokens

Initial recommended tokens:

- root font size: browser default through normal desktop/zoom layouts; use the physical-density exception below for a true 4K/1x CSS viewport
- main reading width: `min(72ch, calc(100vw - 4rem))`
- event panel max width: active play column width, currently `min(470px, viewport-safe width)`
- stores/resources side panel width: `220px` in the original-near desktop shell
- minimum button width: `6rem`
- maximum standard button width: `12rem`
- world map font: monospace
- world map visible grid: preserve original visible radius
- world map cell target: stable square-ish text cell, no wrapping
- line height: readable but compact, approximately `1.35` to `1.55`
- letter spacing: `0`
- card radius: avoid card styling for primary sections; if needed, radius no more than `4px`

These values can change only after screenshot review.

### Physical-Density / Large-Desktop Policy

A 3840x2160 viewport at `1dppx` is not treated as an ordinary 920px shell floating unchanged in empty space. At `min-width: 3000px`, `min-height: 1600px`, and `resolution: 1dppx`:

- root text is `20px`, ordinary copy uses at least `1rem` with approximately `1.45` line height, and standard headings use at least `1.25rem`;
- the normal shell grows to `1280px`, its play column to `960px`, and the wide World shell to `1540px`; whitespace remains part of the composition rather than being filled with cards;
- ordinary buttons expose at least a 44x44 CSS-pixel hit area; the deliberately compact four-way steppers grow from 24x24 to 32x32 each and retain their single-tab-stop keyboard model;
- Space may grow its playfield to `900px`, while final score numerals carry a materially larger typographic scale;
- OS-scaled, high-DPR, browser-zoomed, and sub-3000px layouts retain the regular density so the policy does not double-enlarge a viewport that is already physically scaled.

This is a physical-readability policy, not a dashboard expansion. The 4K screenshot matrix remains required, with explicit assertions for root type size, shell width, action hit area, and ending hierarchy.

## Current Layout Contracts

The current shell has one play column and one resources column. Room, Outside, Path, and the first World slice must keep using deliberate layout contracts instead of ad hoc fixed panels.

Path:

- Continue using the play column for outfitting controls, capacity/free-space feedback, and embark.
- Use the resources column for stores/outfit summaries only after those systems are originally unlocked.
- Keep outfit row controls stable in width during add/remove/cooldown-like state changes.
- Phase 7 hardening must not add tutorial prose, future-system previews, or dashboard-style grouping.

World:

- World uses a dedicated wide shell rather than the Room/Path play column: the map is primary and the status, landmark, movement, and notification regions form an adjacent sidebar.
- Preserve readable 15px monospace tiles with 11px line height; keep the full 61x61 map intact and allow the page to scroll at constrained zoom rather than compressing cell geometry.
- Keep the wide composition stable at 1366/1920 and 100/125/150/200 percent zoom; use the narrow responsive stack only when viewport width genuinely requires it.
- Keep health, food, water, and movement status adjacent to the map, not hidden in the resource column.
- Preserve event modal focus and prevent overlap with the map and resources column.

Combat:

- Combat may render inside the event modal for encounter scenes; Path/World return controls now resolve through visible room/path recovery and must stay stable while Phase 7 hardens outfit semantics.
- Victory loot and death/return states must not resize the modal enough to collide with resources at 1366x768 or 150% browser zoom.

## Required Reference States

Every state needs screenshots at 1366x768, 1920x1080, 2560x1440, and 3840x2160.

### First Screen

Must show:

- sparse room state
- one available action when appropriate
- no future systems
- no tutorial text
- no decorative illustration

Must not show:

- outside/path/world/ship/fabricator/space tabs
- resource economy preview
- lore exposition

### Room With Stores

Must show:

- room text/status
- fire action/cooldown
- stores/resources once unlocked
- build/craft/buy controls only when originally unlocked
- grouped passive income rows by source when multiple stores change from one worker or builder source
- compact internal scrolling for long action columns before they dominate the room height

Must not:

- pre-group resources in a way that reveals future progression
- use dashboard-style cards
- let event dialogs overlap the stores/resources column on desktop

### Debug Settings

Status: intentional tooling deviation, not original UI parity. See `REMAKE/docs/deviations.md#dev-007-in-app-debug-settings-tab`.

Must show only with `?debug=1`:

- one `settings` tab in the location tab row
- default-off `speed x 10` and `income x 10` toggles
- dev save/load/clear controls
- compact debug state only, without explanatory tutorial text

Must preserve:

- sparse typography and restrained grouping
- no default gameplay changes while toggles are off
- readable state at the supported desktop resolutions
- clean visual parity baselines through `?testHarness=1` without `debug=1`

Must not:

- hide that the toggles are debug-only behavior
- become a broad stats dashboard
- reveal future locked gameplay systems beyond compact runtime state needed for testing
- appear on the default entry without `?debug=1`

### Outside Village

Must show:

- outside/village title
- workers
- traps/gather controls
- resources readable

Must preserve:

- utilitarian worker assignment
- compact repeated rows

### Path

Must show:

- supplies/outfitting
- capacity/free-space feedback
- embark button
- perks if unlocked

Must not:

- imply future world landmarks before embark

### World

Must show:

- ASCII-first map
- player position
- visible tiles only
- supplies/health/water/food
- keyboard-first movement

Must preserve:

- original tile characters
- hidden world outside visibility mask

### Event Panel

Must show:

- title
- scene text
- available buttons
- costs/rewards through original behavior

Must enforce:

- controlled line length
- focus containment
- no overlap with stores/map

### Combat

Must show:

- player and enemy
- health
- attacks
- healing controls
- cooldowns
- loot after victory

Must preserve:

- plain symbolic fighter presentation unless a documented deviation is accepted

### Ship

Phase ownership: the thin player-facing Ship upgrade UI is complete in `RA-P1-11`; Phase 8 only owns World-side discovery, while `RA-P1-13` completes player-facing lift-off and its Space handoff.

Must show:

- hull
- engine
- reinforce hull
- upgrade engine
- lift off

### Fabricator

Phase ownership: player-facing Fabricator UI is Phase 11. Phase 8 may only unlock Fabricator discovery state from World safe return.

Must show:

- alien craftables according to blueprint rules
- blueprint visibility according to original rules
- no future expansion items

### Space

Must show:

- minimal ship symbol/playfield
- hull remaining
- asteroids/debris
- altitude/title progression
- an optional concise spatial feed with ship position, nearest-debris direction/distance, and actionable collision threat; routine polite summaries are throttled, while a newly unsafe lane emits only the immediate terse escape cue, and neither path may capture focus or block flight keys

Must not:

- become visually flashy
- introduce non-original pickups, particles, or effects during parity
- claim nonvisual flight verification until a real screen-reader operator completes the normal-clock flight-and-ending runbook in `accessibility-screen-reader-runbook.md`; use the P14V-01 console-free manual fixture only after the candidate is frozen

### Ending

Must preserve the original sparse monochrome identity while giving the final state enough visual and semantic authority to read as an ending:

- `homefleet` and `the end.` are real headings, and focus transfers to each ending stage;
- narrative lines remain narrow and quiet; score values, not decorative art, provide the visual climax;
- the ending occupies the viewport intentionally at every desktop target, with a minimum 44px restart/wait hit area and enlarged score numerals at true 4K/1x;
- fleet narrative order, wait transition, score values, and restart behavior remain unchanged.

## Accessibility Baseline

- All action buttons are semantic buttons.
- Keyboard focus is visible.
- Event panels trap focus.
- World movement supports original-compatible keyboard input.
- Space offers an opt-in throttled live spatial feed, reserves immediate alerts for newly unsafe collision lanes, and retains arrow/WASD/button control while either announcement runs.
- Text does not overlap at target resolutions and zoom levels.
- Accessibility labels must not reveal locked mechanics early.

## Review Gate

No UI implementation phase is complete until screenshots for its required states are checked against this spec and stored or linked from the phase report.
