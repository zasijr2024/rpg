# Content Model

Last updated: 2026-07-06

Purpose: define how original and future content are separated so expansions do not corrupt parity.

## Content Roots

Recommended source layout:

```text
src/content/original/
src/content/expansions/
```

`src/content/original/` contains source-derived parity content only.

`src/content/expansions/<pack-name>/` contains optional future additions.

## Original Content Rules

- Original content is the default and only active content during parity.
- Original content keys must match the source baseline exactly.
- Original content must not depend on expansion content.
- Original content becomes immutable after parity except documented bug fixes.
- Any original behavior change must be recorded in `REMAKE/docs/deviations.md`.

## Expansion Content Rules

- Expansions are disabled by default.
- Expansions cannot mutate original content in place.
- Expansions register through explicit extension points.
- Expansions must declare dependencies.
- Expansions must pass content validation before loading.
- Strict original mode disables all expansions.

## Required Registries

- resources
- craftables
- trade goods
- workers
- perks
- weapons
- world tiles
- landmarks
- event pools
- setpieces
- encounters
- modules
- UI panels
- save adapters after post-parity save versioning exists

## Validation Requirements

Content validation must catch:

- duplicate keys
- invalid costs
- rewards for unknown resources
- impossible scene transitions
- missing scene start nodes
- unreachable scenes
- missing localization keys after localization is active
- invalid landmark tile collisions
- invalid worker production/consumption references
- invalid blueprint references
- expansion attempts to mutate original content directly

## Strict Original Mode

Strict original mode must:

- load only `content/original`
- disable all expansion registries
- use original source-derived constants
- produce parity-testable behavior
- be the default mode until after parity completion


