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
