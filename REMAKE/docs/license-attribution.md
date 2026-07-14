# License and Attribution Plan

Last updated: 2026-07-12

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

Open question: final license for new remake code.

Recommendation: use a license compatible with MPL-2.0 obligations and keep source-derived files clearly marked. Decide before publishing or distributing the remake.

Release status: **open public-distribution blocker**. A technical Release Candidate gate may pass without resolving this legal/product requirement; that does not authorize publication. `P14V-08` owns the decision and its evidence.

## Attribution Requirements

At minimum, any public remake distribution should acknowledge:

- Michael Townsend / doublespeak games: original design and development
- Amir Rajan: mobile development history where discussed
- original A Dark Room repository and license
- any media/audio contributors used in the final product

## Implementation Rule

Phase 0 must add a visible internal `NOTICE` or attribution document before distribution work begins. Public-facing credits can be deferred until a release UI exists.

No compliant remake NOTICE/attribution artifact or final remake-code license decision is currently recorded. Before public Release Candidate sign-off, P14V-08 must:

1. inventory source-derived remake files and shipped original assets/data;
2. review the pinned MPL-2.0 text and applicable notice/source-availability obligations, obtaining qualified legal review if the distribution plan requires it;
3. select and record the remake-code license without implying that it relicenses third-party material;
4. add the required NOTICE/attribution and preserve the original license/credits in the distributed artifact;
5. verify the production package exposes or ships the required notices; and
6. link the exact license/NOTICE artifacts from the dated release decision.
