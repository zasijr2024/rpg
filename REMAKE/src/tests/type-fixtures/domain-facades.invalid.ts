import type {
  CombatDomainFacade,
  EconomyDomainFacade,
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
