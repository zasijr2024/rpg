import { originalPathWeightOverrides } from "./path/pathWeights";
import { originalPerks } from "./core/perks";
import { originalPrestigeStores } from "./core/prestige";
import { originalWorldLandmarks, originalWorldWeapons } from "./world/worldData";

export const originalContentRegistry = {
  perks: originalPerks,
  prestigeStores: originalPrestigeStores,
  pathWeightOverrides: originalPathWeightOverrides,
  worldWeapons: originalWorldWeapons,
  worldLandmarks: originalWorldLandmarks
} as const;

export type OriginalContentRegistry = typeof originalContentRegistry;
