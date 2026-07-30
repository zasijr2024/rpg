# Deferred Scope Contract

Last updated: 2026-07-30

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

Completed by the production-readiness override (`RA-P2-02`) and hardened by
the 2026-07-30 remediation:

- checksummed storage schema version 1 under stable key `adr-remake-save`, with
  one-time namespace migration from legacy `adr-remake-dev-save`
- backup rotation only from a semantically valid committed primary, raw
  quarantine with typed recovery outcomes, and acknowledgement-gated autosave
- staged, explicit-confirmation recovery export/import through checksum,
  migration, and semantic validation
- explicit migration from unversioned session-v2, engine-v2, and legacy remake state snapshots

Still deferred:

- original browser save import
- migration from any remake format not listed above

Compatibility boundary:

- Schema-1 envelopes and the three named unversioned remake inputs are supported.
- Unknown or future schemas are quarantined and may recover the last supported backup; they are never guessed or silently downgraded.
- Original-browser import remains separate future work.

The older blanket warning that every pre-parity save is disposable is superseded by this explicit support list. No compatibility is promised outside it.

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

Post-parity balance evidence does not silently lift this deferral for original mode. Under `TD-017`, any rebalance must be separately named, save-compatible by explicit decision, and scoped only after the P14V progression and human evidence is interpreted.

## Release Gate

The executable and cumulative `Parity Complete`, `Production Beta`, and technical `Release Candidate` definitions live in `REMAKE/docs/release-gates.md` and `REMAKE/release-gates.json`. Public sign-off additionally follows `REMAKE/docs/status/phase-14-release-readiness-plan-2026-07-12.md`. LICENSE, NOTICE, and the source-derived inventory now ship with the remake; exact upstream-source availability, qualified legal review, human/assistive-technology evidence, and owner approval remain external sign-off requirements.

No deferred system may enter the active target until:

- gameplay/UI parity is accepted
- `REMAKE/docs/deviations.md` is complete
- `REMAKE/docs/parity-checklist.md` is complete
- Post-Parity Phase A save versioning is implemented if the change affects persisted state
