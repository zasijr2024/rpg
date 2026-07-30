# Source-Derived Material Inventory

Last updated: 2026-07-30

This inventory is deliberately conservative. It identifies remake surfaces
that copy, adapt, translate, encode, or closely implement material from the
pinned `ORIGINAL/` source. It supports attribution and source-availability
review; it is not legal advice.

## Pinned source

- Upstream: `https://github.com/doublespeakgames/adarkroom`
- Local source: `ORIGINAL/`
- License: Mozilla Public License 2.0
- Baseline and extraction provenance: `docs/source-baseline.md`

## Source-derived remake material

| Remake path | Material | Handling |
|---|---|---|
| `src/content/original/**` | Original gameplay text, values, recipes, landmarks, events, scoring, and rules encoded as TypeScript data | MPL-2.0; source shipped |
| `src/generated/canonical-manifest.json` | Generated inventory of pinned original content | Regenerable; source and generator shipped |
| `src/generated/parity-graph.json` | Generated source-to-remake requirement graph | Regenerable; source and generator shipped |
| `src/engine/**` | Clean-room/ported runtime behavior implementing original rules, with intentional deviations recorded separately | Remake code under MPL-2.0 |
| `src/ui/**` | Remake presentation following original desktop interaction and text conventions | Remake code under MPL-2.0 |
| `src/tests/content/**` | Source-parity assertions and expected original values/text | MPL-2.0; source shipped |
| `scripts/generate-parity-graph.mjs` and `scripts/parity-graph.mjs` | Extraction and parity tooling operating on pinned original source | Remake code under MPL-2.0 |
| `docs/parity-checklist.md`, `docs/deviations.md`, `docs/source-baseline.md` | Provenance, fidelity, and intentional-difference records | Documentation shipped with source |

## Original material not shipped in the audited production build

- `ORIGINAL/` itself is a source/reference directory and is not bundled into
  the browser artifact.
- Original audio files are not shipped.
- Mobile-specific implementation and platform assets are not shipped.
- No third-party font package is bundled.

## Distribution checklist

Before public distribution:

1. keep `LICENSE`, `NOTICE.md`, and this inventory with the source;
2. include `LICENSE.txt` and `NOTICE.txt` in the production artifact;
3. publish the exact corresponding source revision at a durable URL;
4. put that URL in the dated release evidence and public release surface;
5. review new assets/dependencies and update this inventory;
6. obtain qualified review where the intended distribution requires it;
7. do not claim official status or trademark ownership.
