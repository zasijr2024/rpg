# Source Baseline

Last updated: 2026-07-06

This file pins the remake target so "latest web version" is not a moving requirement.

## Upstream Target

- Repository: `https://github.com/doublespeakgames/adarkroom`
- Upstream branch checked: `main`
- Latest upstream source commit checked: `1fada4620b6c66bd07bf15a3f1eb8223df8bc1d7`
- Commit title: `Update world.js (#739)`
- Commit date recorded by validation report: 2025-05-23
- Local source folder: `F:\ADR20\ORIGINAL`
- Repository handling: tracked by the outer repository as a git submodule at the pinned source commit
- Validation source: `GUIDE/VALIDATION_REPORT.md`
- Extraction date: 2026-07-06

## Included Web-Version Content

The parity target includes all gameplay/content present in the local source folder:

- room
- outside/village
- path/outfitting
- world generation and exploration
- global, room, outside, marketing, encounter, setpiece, and executioner events
- combat
- ship
- space flight
- fabricator
- executioner/latest web content
- original audio manifest as data only
- original localization files as data only
- original CSS and entry/support files as reference

## Explicit Parity Exclusions

Gameplay/UI parity excludes the following deferred systems:

- audio playback
- music playback
- ambient audio playback
- mobile/touch layout
- durable save schema versioning
- save migration
- original browser save import
- active localization
- new content
- balance changes

These exclusions are scope choices, not missing source data.

## Canonical Machine Manifest

The canonical machine-readable manifest is:

- `DATA/canonical-manifest.json`

It is generated from `ORIGINAL/` by:

- `TOOLS/extract_adr_canonical_manifests.ps1`

Markdown extraction files in `DATA/*.md` are human-readable references. They are not the machine authority for parity tests.

## Source Integrity Rules

- Treat `ORIGINAL/` as vendor/reference source.
- Keep `ORIGINAL/` pinned as a submodule unless the repository policy is intentionally changed.
- Do not modify `ORIGINAL/` during remake implementation.
- If an upstream refresh is intentionally performed, record the new commit here and regenerate `DATA/canonical-manifest.json`.
- All source-derived remake data must trace back to this baseline.
