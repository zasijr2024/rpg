# A Dark Room Remake Context

Current phase: pre-implementation planning and parity hardening.

Goal: recreate the pinned latest web version of *A Dark Room* in a modern, stable desktop web stack while preserving the original vision, data, pacing, and minimalist discovery curve. Improvements, optimizations, mobile support, audio, durable save migration, and new content come only after gameplay/UI parity is complete.

## Authorities

- Design authority: `ANALYSE/authors_vision_and_success.md`
- Source baseline: `REMAKE/docs/source-baseline.md`
- Main plan: `REMAKE/docs/plan.md`
- Original extracted data index: `DATA/00-extraction-index.md`
- Canonical generated manifest: `DATA/canonical-manifest.json`
- Original source folder: `ORIGINAL/`
- Roast audit that triggered hardening: `REPORTS/remake_context_plan_roast_2026-07-06_18-30-46.md`

## Active Scope

- Desktop-only browser remake.
- 1366x768 through 3840x2160 support.
- Exact original gameplay data and behavior where technically possible.
- Modern TypeScript/Vite/React UI over a headless TypeScript game engine.
- Deterministic engine tests, data parity tests, scenario tests, and visual regression tests.
- Dev-only save/load during parity, explicitly non-durable.

## Deferred Scope

The following are intentionally deferred until after gameplay/UI parity:

- music
- sound effects
- ambient audio
- mobile/touch support
- durable save versioning
- save migrations
- original save import
- active localization
- new content
- balance changes
- tutorialization

See `REMAKE/docs/deferred.md` for the locked deferred-scope contract.

## Required Before Implementation

- Git repository initialized with baseline commits.
- `REMAKE/docs/parity-checklist.md` created and used as the implementation tracker.
- `REMAKE/docs/ui-spec.md` used as the visual acceptance baseline.
- `REMAKE/docs/tech-decisions.md` records accepted architecture decisions.
- `REMAKE/docs/deviations.md` starts empty and is updated whenever parity is intentionally broken.
- `TOOLS/extract_adr_canonical_manifests.ps1` can regenerate `DATA/canonical-manifest.json`.


