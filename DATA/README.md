# DATA

Purpose: extracted original game data and generated source manifests.

Start here:

- `00-extraction-index.md` - human-readable index of all extracted data files.
- `canonical-manifest.json` - machine-readable manifest generated from `ORIGINAL/`.
- `18-canonical-catalogs.md` - quick lookup catalog for names and content groups.
- `locales/` - per-locale localization extracts.

Rules:

- Treat markdown extraction files as human reference.
- Treat `canonical-manifest.json` plus `ORIGINAL/` as the machine parity source.
- Regenerate the manifest with `TOOLS/extract_adr_canonical_manifests.ps1` after any intentional source-baseline change.

