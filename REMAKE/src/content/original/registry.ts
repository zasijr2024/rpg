import { originalPathWeightOverrides } from "./path/pathWeights";
import { originalPerks } from "./core/perks";
import { originalPrestigeStores } from "./core/prestige";

export const originalContentRegistry = {
  perks: originalPerks,
  prestigeStores: originalPrestigeStores,
  pathWeightOverrides: originalPathWeightOverrides
} as const;

export type OriginalContentRegistry = typeof originalContentRegistry;

