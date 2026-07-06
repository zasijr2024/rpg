export {
  canonicalManifest,
  SOURCE_BASELINE_COMMIT
} from "./manifest/canonicalManifest";
export type {
  CanonicalEventTitle,
  CanonicalManifest,
  CanonicalSourceFile
} from "./manifest/types";
export { originalContentRegistry } from "./registry";
export { originalPerks } from "./core/perks";
export {
  originalPrestigeStores,
  type OriginalPrestigeStoreType
} from "./core/prestige";
export {
  DEFAULT_BAG_SPACE,
  DEFAULT_ITEM_WEIGHT,
  originalPathWeightFor,
  originalPathWeightOverrides
} from "./path/pathWeights";
export {
  ROOM_BUILDER_INCOME_DELAY,
  ROOM_BUILDER_STATE_DELAY,
  ROOM_BUILDER_WOOD_INCOME,
  ROOM_FIRE_COOL_DELAY,
  ROOM_LIGHT_FIRE_WOOD_COST,
  ROOM_NEED_WOOD_DELAY,
  ROOM_STOKE_COOLDOWN,
  ROOM_STOKE_FIRE_WOOD_COST,
  ROOM_WARM_DELAY,
  originalRoomCost,
  originalRoomCraftables,
  originalRoomFireStates,
  originalRoomMiscItems,
  originalRoomNeedsWorkshop,
  originalRoomTemperatures,
  originalRoomTradeGoods,
  type RoomCostContext,
  type RoomCraftableDefinition,
  type RoomCraftableType,
  type RoomDynamicCost,
  type RoomItemType,
  type RoomMiscItemDefinition,
  type RoomStateDefinition,
  type RoomTradeGoodDefinition,
  type RoomTradeGoodType
} from "./room/roomData";
export {
  OUTSIDE_CART_GATHER_WOOD_AMOUNT,
  OUTSIDE_GATHER_DELAY,
  OUTSIDE_GATHER_WOOD_AMOUNT,
  OUTSIDE_HUT_ROOM,
  OUTSIDE_POP_DELAY_MAX,
  OUTSIDE_POP_DELAY_MIN,
  OUTSIDE_STORES_OFFSET,
  OUTSIDE_TRAPS_DELAY,
  originalBaitUsedForTraps,
  originalGatherWoodAmount,
  originalMaxPopulation,
  originalOutsideWorkerIncome,
  originalOutsideWorkerUnlocks,
  originalPopulationMessageForArrivals,
  originalPopulationMessageThresholds,
  originalTrapDropCount,
  originalTrapDrops,
  originalVillageTitleForHuts,
  originalVillageTitleThresholds,
  type OutsidePopulationMessageThreshold,
  type OutsideTrapDropDefinition,
  type OutsideVillageTitleThreshold,
  type OutsideWorkerIncomeDefinition
} from "./outside/outsideData";
export {
  WORLD_BASE_HEALTH,
  WORLD_BASE_HIT_CHANCE,
  WORLD_BASE_WATER,
  WORLD_DEATH_COOLDOWN,
  WORLD_DIRECTIONS,
  WORLD_FIGHT_CHANCE,
  WORLD_FIGHT_DELAY,
  WORLD_HYPO_HEAL,
  WORLD_LIGHT_RADIUS,
  WORLD_MEAT_HEAL,
  WORLD_MEDS_HEAL,
  WORLD_MOVES_PER_FOOD,
  WORLD_MOVES_PER_WATER,
  WORLD_RADIUS,
  WORLD_STICKINESS,
  WORLD_TILE,
  WORLD_TILE_PROBS,
  WORLD_VILLAGE_POS,
  originalWorldLandmarks,
  originalWorldWeapons,
  type WorldLandmarkDefinition,
  type WorldWeaponDefinition
} from "./world/worldData";
