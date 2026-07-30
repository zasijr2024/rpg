import type {
  CombatDomainFacade,
  EconomyDomainFacade,
  RuntimeStateDomain,
  StateStore,
  WorldDomainFacade,
} from "../../engine";

declare const economy: EconomyDomainFacade;
declare const world: WorldDomainFacade;
declare const combat: CombatDomainFacade;

// @ts-expect-error arbitrary paths are not Economy commands
economy.dispatch({ type: "economy.setPath", payload: { path: "stores.wood" } });
economy.dispatch({
  type: "economy.changeStores",
  payload: {
    changes: {
      // @ts-expect-error store deltas must be numeric
      wood: "many",
    },
  },
});
// @ts-expect-error World exposure counters are a closed union
world.dispatch({ type: "world.recordExposure", payload: { kind: "hunger" } });
// @ts-expect-error World maps must be string grids
world.dispatch({ type: "world.setMap", payload: { value: [[false]] } });
combat.dispatch({
  type: "combat.setHealth",
  payload: {
    value: 10,
    // @ts-expect-error Combat HP commands require a numeric maximum
    maximum: "twenty",
  },
});
// @ts-expect-error read models are immutable
economy.read().population = 99;
// @ts-expect-error read model records are immutable
combat.read().outfit.grenade = 99;

declare const state: StateStore;
const roomState = state.forRuntime("room");
roomState.set("stores.wood", 10);
roomState.set("game.fire.value", 2);
// @ts-expect-error Room cannot mutate combat character state
roomState.set("character.health", 10);
const combatState = state.forRuntime("combat");
combatState.set("character.health", 10);
// @ts-expect-error Combat cannot mutate feature unlock state
combatState.set("features.location.world", true);
// @ts-expect-error Unknown runtimes cannot acquire state capabilities
state.forRuntime("unowned-runtime");
state.category("stores").set("wood", 1);
// @ts-expect-error Version is metadata, not a mutable state category
state.category("version");

const everyRuntimeDomain: Record<RuntimeStateDomain, true> = {
  combat: true,
  economy: true,
  events: true,
  fabricator: true,
  path: true,
  pathOutfit: true,
  room: true,
  session: true,
  ship: true,
  space: true,
  expedition: true,
  world: true,
};
void everyRuntimeDomain;
