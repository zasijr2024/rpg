# Phase 8 World Status

Phase 8 is active.

Current baseline:

- Compass purchase ensures an original-shaped 61x61 World map exists.
- Terrain generation follows the original spiral/ring fill, terrain probabilities, and stickiness rules through deterministic engine RNG.
- Landmark placement uses original counts and radius bands, with a bounded fallback for degenerate deterministic RNG.
- Visibility uses the original diamond light mask and persists in `game.world.mask`.
- Ship direction is stored from generated ship placement for Compass messaging.
- Embark starts at the original village coordinate, renders the compact player-facing ASCII viewport, supports movement, consumes food/water counters, can route generated landmark scene names into the event bridge, and can return safely from the village.

Still open:

- Roads.
- Outpost replenishment/use behavior.
- Mine discovery and worker/building unlock consequences.
- Ship discovery consequences and ship module unlock.
- Fabricator and executioner discovery consequences.
- Full visibility rendering/persistence parity beyond the compact viewport.
- Danger, fight delay, starvation/thirst death loops, and perk interactions.
- Full original world UI interaction parity.

Guardrails:

- Preserve Phase 7 Path/outfitting behavior while expanding World.
- Add source-backed engine/session coverage plus UI, smoke, or visual coverage for player-facing changes.
- Do not mark World parity complete until the open items above are player-reachable.
