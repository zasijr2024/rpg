# REMAKE Docs

This folder contains the planning and control documents for the A Dark Room remake.

Current readiness:

- Player-facing prototype: Room, Outside/Village, Path outfitting, original-shaped World map/mask movement/return foundation, event modal, and combat slices.
- Newly player-reachable: a fresh browser progression can reach Compass, reveal `A Dusty Path`, generate the original World map/mask foundation, outfit Cured Meat, embark, move on the World map, and return to Path through browser coverage.
- Not player-reachable yet: roads, outposts, mines, Ship, Fabricator, Space, ending, and full fresh-playthrough parity.
- Late-game encounter, setpiece, and executioner coverage remains mostly harness/runtime regression scaffolding unless routed through the current player-facing World foundation.

Recommended reading order:

1. `context.md`
2. `source-baseline.md`
3. `plan.md`
4. `parity-checklist.md`
5. `status/phase-7-path.md`
6. `status/phase-8-world.md`
7. `deferred.md`
8. `tech-decisions.md`
9. `ui-spec.md`
10. `content-model.md`
11. `deviations.md`
12. `license-attribution.md`
13. `git-versioning.md`
14. `changelog.md`

Current implementation stance:

- New modern engine: yes.
- Original architecture clone: no.
- Original data/behavior parity: yes.
- Desktop first, including 4K: yes.
- Debug settings tab: hidden by default, opt-in with `?debug=1`, default-off toggles, lifecycle dev save/load, and documented as non-original tooling.
- Clean visual baselines: use `?testHarness=1` without `debug=1`; manual parity/dev work may opt into the debug tab.
- Current UI hardening: event dialogs stay in the play column, store income rows group by source, tall Room action columns scroll internally, and disabled/worker controls have stronger affordance.
- Phase 8 preparation: start from the finalized Phase 7 Path/outfitting scope and the current original map/mask/landmark foundation; expand World without weakening Path embark/return contracts.
- Audio/mobile/durable save migration/new content: deferred.
