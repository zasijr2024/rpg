import {
  originalPathArmourPriority,
  originalPathBaseCarryables,
  originalPathCapacityUpgrades,
  originalPathWeightOverrides
} from "./path/pathWeights";
import {
  originalEngineOptionDefaults,
  originalScoreBonuses,
  originalScoreFactors,
  originalStateCategories,
  originalStateMigrationSteps
} from "./core/engineData";
import { originalPerks } from "./core/perks";
import { originalPrestigeStores } from "./core/prestige";
import { originalAudioManifest } from "./audio/audioManifest";
import {
  originalLanguageCodes,
  originalLocaleInventory
} from "./localization/localizationManifest";
import {
  originalOutsideWorkerIncome,
  originalOutsideWorkerUnlocks,
  originalTrapDrops,
  originalVillageTitleThresholds
} from "./outside/outsideData";
import {
  originalRoomCraftables,
  originalRoomFireStates,
  originalRoomMiscItems,
  originalRoomTemperatures,
  originalRoomTradeGoods
} from "./room/roomData";
import {
  originalFabricatorCraftables,
  originalSpaceAsteroids,
  originalSpaceAsteroidWaveThresholds,
  originalSpaceHitAudioTiers,
  originalSpaceTitleThresholds
} from "./lateGame/lateGameData";
import { originalWorldLandmarks, originalWorldWeapons } from "./world/worldData";

export const originalContentRegistry = {
  perks: originalPerks,
  prestigeStores: originalPrestigeStores,
  engineOptionDefaults: originalEngineOptionDefaults,
  stateCategories: originalStateCategories,
  stateMigrationSteps: originalStateMigrationSteps,
  scoreFactors: originalScoreFactors,
  scoreBonuses: originalScoreBonuses,
  audioManifest: originalAudioManifest,
  languageCodes: originalLanguageCodes,
  localeInventory: originalLocaleInventory,
  pathWeightOverrides: originalPathWeightOverrides,
  pathCapacityUpgrades: originalPathCapacityUpgrades,
  pathArmourPriority: originalPathArmourPriority,
  pathBaseCarryables: originalPathBaseCarryables,
  roomTemperatures: originalRoomTemperatures,
  roomFireStates: originalRoomFireStates,
  roomCraftables: originalRoomCraftables,
  roomTradeGoods: originalRoomTradeGoods,
  roomMiscItems: originalRoomMiscItems,
  fabricatorCraftables: originalFabricatorCraftables,
  spaceTitleThresholds: originalSpaceTitleThresholds,
  spaceAsteroids: originalSpaceAsteroids,
  spaceAsteroidWaveThresholds: originalSpaceAsteroidWaveThresholds,
  spaceHitAudioTiers: originalSpaceHitAudioTiers,
  outsideWorkerIncome: originalOutsideWorkerIncome,
  outsideWorkerUnlocks: originalOutsideWorkerUnlocks,
  trapDrops: originalTrapDrops,
  villageTitleThresholds: originalVillageTitleThresholds,
  worldWeapons: originalWorldWeapons,
  worldLandmarks: originalWorldLandmarks
} as const;

export type OriginalContentRegistry = typeof originalContentRegistry;
