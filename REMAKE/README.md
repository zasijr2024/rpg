# REMAKE

Purpose: remake planning, implementation control docs, and future remake source.

Current readiness:

- Player-facing prototype: Room, Outside/Village, Path outfitting, a first World movement/return slice, event modal, and combat slices.
- Newly player-reachable: fresh-room progression can now reach Compass, Path, outfit Cured Meat, embark, move on the World map, and return to Path through an organic browser test.
- Not player-reachable yet: full original World generation/landmark parity, Ship, Fabricator, Space, ending, and full fresh-playthrough parity.
- Late-game encounter, setpiece, and executioner flows remain mostly harness/runtime regression coverage unless routed through the current minimal World slice.

Start here:

- `docs/context.md` - current scope and authority index.
- `docs/plan.md` - full implementation plan.
- `docs/source-baseline.md` - pinned original web-version target.
- `docs/parity-checklist.md` - implementation tracker.
- `docs/deferred.md` - locked deferred scope.
- `docs/tech-decisions.md` - accepted architecture decisions.
- `docs/ui-spec.md` - desktop/4K UI acceptance baseline.
- `docs/content-model.md` - original vs expansion content rules.
- `docs/deviations.md` - intentional parity deviations log.
- `docs/license-attribution.md` - licensing and attribution requirements.
- `docs/git-versioning.md` - branch, commit, and tag rules.
- `docs/changelog.md` - implementation history.

Implementation rule:

Build a new modern headless TypeScript engine and restrained desktop UI. Preserve original data and behavior, not the original jQuery architecture.

Current implementation commands:

```text
npm install
npm test
npm run build
npm run test:e2e
```
