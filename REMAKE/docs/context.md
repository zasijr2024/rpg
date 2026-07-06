# A Dark Room Remake Context

Current phase: Phase 3 Room runtime has started with the fresh-room/fire vertical slice.

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

## Current Implementation Status

- Phase 0 scaffold is complete.
- Phase 0.5 risk spike is complete and quarantined behind `?spikes=1`.
- Phase 1 core engine services are complete at scaffold level.
- Phase 2 source data values are complete for core, room, outside, path, world, ship, space, fabricator, audio manifest, and localization inventory.
- Source-derived snapshot parity tests now compare selected original JS tables directly against ported TypeScript data.
- Initial Room runtime is implemented for fresh start, light fire, stoke fire, fire title/state changes, temperature adjustment helper, first builder progression helper, notifications, and default-entry discovery hygiene.
- Remaining Phase 3 work: real timer scheduling, builder timing, need-wood/outside unlock, stores reveal, craft/build/buy runtime, cooldown rendering, and full Room discovery parity.

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

## Required Before Phase 3 Runtime

- Keep default entry free of spike-only future systems.
- Keep `REMAKE/docs/parity-checklist.md` as behavior truth: data-only coverage does not make runtime parity complete.
- Preserve `REMAKE/docs/ui-spec.md` as the visual acceptance baseline.
- Update `REMAKE/docs/deviations.md` whenever parity is intentionally broken.
- Keep `TOOLS/extract_adr_canonical_manifests.ps1` able to regenerate `DATA/canonical-manifest.json`.
- Keep StateStore semantics aligned with original update paths and store clamping.


