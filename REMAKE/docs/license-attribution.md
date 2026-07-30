# License and Attribution Plan

Last updated: 2026-07-30

The remake uses original source code, text, data, and assets as reference material. License handling is a project requirement, not a final polish task.

## Original Project

- Original repository: `https://github.com/doublespeakgames/adarkroom`
- Local source folder: `ORIGINAL/`
- Original license file: `ORIGINAL/LICENSE.md`
- License identified from repository/extraction: MPL-2.0

## Required Handling

- Preserve the original license file.
- Preserve notices and attribution for original source-derived data/text.
- Treat `ORIGINAL/` as reference/vendor source.
- Track all source-derived remake files.
- Do not remove original credits.
- Do not imply the remake is the original official release unless that is legally true.

## Remake License Decision

Repository decision: new remake code is licensed under **MPL-2.0**, matching the
conservative handling of source-derived material. `REMAKE/LICENSE` carries the
full terms. This decision does not relicense trademarks, third-party media, or
material the remake contributors do not own.

Release status: the repository-side license choice and notice artifacts are
implemented. Public distribution remains **HOLD** until the exact corresponding
source revision has a durable public URL and the owner obtains any qualified
review required by the intended distribution. A technical gate does not grant
publication authority.

## Attribution Requirements

At minimum, any public remake distribution should acknowledge:

- Michael Townsend / doublespeak games: original design and development
- Amir Rajan: mobile development history where discussed
- original A Dark Room repository and license
- any media/audio contributors used in the final product

## Implementation Rule

The repository now includes:

- `REMAKE/LICENSE` — full MPL-2.0 terms for the source package;
- `REMAKE/NOTICE.md` — attribution, independence, source-availability, and
  media notices;
- `REMAKE/docs/source-derived-inventory.md` — conservative material inventory;
- `REMAKE/public/LICENSE.txt` and `REMAKE/public/NOTICE.txt` — files copied by
  Vite into every production build.

Before public Release Candidate sign-off, P14V-08 must still:

1. verify and record the exact production artifact contents;
2. publish the exact corresponding source revision at a durable URL;
3. place that URL alongside the executable distribution;
4. review any new media/dependencies and update the inventory;
5. obtain qualified legal review if the distribution plan requires it; and
6. link the exact license/NOTICE/source artifacts from the dated decision.
