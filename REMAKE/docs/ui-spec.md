# UI Specification

Last updated: 2026-07-06

Purpose: define a measurable minimalist desktop UI target before implementation begins. This prevents "modernized" from turning into visually noisy or over-explained.

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

- root font size: browser default, do not scale directly by viewport width
- main reading width: `min(72ch, calc(100vw - 4rem))`
- event panel max width: `76ch`
- stores/resources side panel width: `18rem` to `24rem`, depending on state density
- minimum button width: `6rem`
- maximum standard button width: `12rem`
- world map font: monospace
- world map visible grid: preserve original visible radius
- world map cell target: stable square-ish text cell, no wrapping
- line height: readable but compact, approximately `1.35` to `1.55`
- letter spacing: `0`
- card radius: avoid card styling for primary sections; if needed, radius no more than `4px`

These values can change only after screenshot review.

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

Must not:

- pre-group resources in a way that reveals future progression
- use dashboard-style cards

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

Must show:

- hull
- engine
- reinforce hull
- upgrade engine
- lift off

### Fabricator

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

Must not:

- become visually flashy
- introduce non-original pickups, particles, or effects during parity

## Accessibility Baseline

- All action buttons are semantic buttons.
- Keyboard focus is visible.
- Event panels trap focus.
- World movement supports original-compatible keyboard input.
- Text does not overlap at target resolutions and zoom levels.
- Accessibility labels must not reveal locked mechanics early.

## Review Gate

No UI implementation phase is complete until screenshots for its required states are checked against this spec and stored or linked from the phase report.

