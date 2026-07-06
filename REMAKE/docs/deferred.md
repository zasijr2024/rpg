# Deferred Scope Contract

Last updated: 2026-07-06

This file locks what is intentionally not part of the first remake target.

## First Remake Target

The first remake target is gameplay/UI parity excluding deferred systems. It must be completable on desktop from a fresh save using original gameplay data and behavior as defined by `REMAKE/docs/source-baseline.md`.

## Deferred Until After Parity

### Audio

Deferred:

- music playback
- sound effect playback
- ambient audio
- audio settings
- browser autoplay handling

Allowed during parity:

- preserve the original audio manifest as data
- keep audio asset paths in manifests
- add no-op audio hooks only if they are necessary to keep gameplay code clean

### Mobile

Deferred:

- touch layout
- touch gestures
- mobile-specific navigation
- orientation handling
- mobile viewport tuning

Allowed during parity:

- avoid architecture that blocks mobile later
- keep desktop layout responsive enough to avoid catastrophic breakage when resized

### Saves

Deferred:

- durable save schema versioning
- migration framework
- migration from old remake saves
- original browser save import
- compatibility promises for pre-parity saves

Allowed during parity:

- one dev-only save shape
- localStorage key: `adr-remake-dev-save`
- dev-only export/import controls if useful
- save round-trip tests for the current shape

Mandatory warning:

Pre-parity saves are disposable. They may be invalidated at any time until Post-Parity Phase A implements versioning and migration.

### Localization

Deferred:

- runtime language switching
- localized UI rendering
- localization QA

Allowed during parity:

- preserve extracted locale files
- design string IDs so active localization can be enabled later

### New Content

Deferred:

- new events
- new craftables
- new resources
- new workers
- new landmarks
- new endings
- balance changes
- tutorials or onboarding additions

Allowed during parity:

- architecture for future content packs
- validation tools for future content packs
- strict separation between original and expansion content

## Release Gate

No deferred system may enter the active target until:

- gameplay/UI parity is accepted
- `REMAKE/docs/deviations.md` is complete
- `REMAKE/docs/parity-checklist.md` is complete
- Post-Parity Phase A save versioning is implemented if the change affects persisted state


