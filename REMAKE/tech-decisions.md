# Technical Decisions

Last updated: 2026-07-06

This file records accepted architecture decisions. Revisit only with evidence from implementation or risk spikes.

## TD-001: Use React With a Headless TypeScript Engine

Decision: use React for UI rendering and a framework-independent TypeScript engine for gameplay rules.

Reason:

- Most screens are stateful text UI, not sprite-heavy scenes.
- The engine must be testable without a browser.
- React components must render snapshots and dispatch commands only.

Enforcement:

- `src/engine` must not import `react`, `react-dom`, or UI modules.
- `src/data` must not import UI modules.
- `src/ui` must not mutate game state directly.
- Add dependency-boundary tests or lint rules in Phase 0.

## TD-002: Use Vite, TypeScript, Vitest, and Playwright

Decision:

- Vite for dev/build.
- TypeScript for source.
- Vitest for unit, engine, and data parity tests.
- Playwright for end-to-end and visual checks.

Reason:

- Low ceremony.
- Stable ecosystem.
- Good test ergonomics.
- Sufficient for desktop web target.

## TD-003: Use CSS Modules or Plain Scoped CSS

Decision: use local CSS, CSS custom properties, and a small internal UI primitive set. Do not use a heavyweight component library for parity.

Reason:

- The original atmosphere depends on sparse, restrained UI.
- Heavy component libraries tend to impose visual language and layout assumptions.

## TD-004: Use Typed TypeScript Content Modules, Not JSON-Only Data

Decision: source-derived gameplay data should be ported into typed TypeScript modules.

Reason:

- Original data includes callback behavior.
- Costs, availability checks, side effects, rewards, and scene branches are executable behavior.
- JSON-only conversion would either lose behavior or reintroduce ad hoc interpreters.

## TD-005: Deterministic RNG Is a Core Engine Requirement

Decision: all random behavior must go through an injectable deterministic RNG service.

Applies to:

- event scheduling
- trap drops
- world generation
- map landmark placement
- combat hits/misses
- loot tables
- scene chance branches
- space/asteroid randomness if gameplay-affecting

Reason:

- Parity tests need repeatability.
- Bugs in procedural systems need reproducible seeds.

## TD-006: Use Canvas Spike for Space, Do Not Commit Until Proven

Decision: Phase 0.5 must prototype the space sequence in Canvas and compare against DOM feasibility before final implementation.

Acceptance:

- stable movement at target refresh rates
- collision behavior can match original
- visual output remains minimalist
- 4K scaling is controlled

## TD-007: Original Data Is Immutable After Parity

Decision: `content/original` must become immutable after parity except for documented bug fixes.

Reason:

- Future expansions must not contaminate original mode.
- Strict original mode is required.

