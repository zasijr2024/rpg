import { originalPathWeightOverrides } from "./path/pathWeights";
import { originalPerks } from "./core/perks";
import { originalPrestigeStores } from "./core/prestige";
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
import { originalWorldLandmarks, originalWorldWeapons } from "./world/worldData";

export const originalContentRegistry = {
  perks: originalPerks,
  prestigeStores: originalPrestigeStores,
  pathWeightOverrides: originalPathWeightOverrides,
  roomTemperatures: originalRoomTemperatures,
  roomFireStates: originalRoomFireStates,
  roomCraftables: originalRoomCraftables,
  roomTradeGoods: originalRoomTradeGoods,
  roomMiscItems: originalRoomMiscItems,
  outsideWorkerIncome: originalOutsideWorkerIncome,
  outsideWorkerUnlocks: originalOutsideWorkerUnlocks,
  trapDrops: originalTrapDrops,
  villageTitleThresholds: originalVillageTitleThresholds,
  worldWeapons: originalWorldWeapons,
  worldLandmarks: originalWorldLandmarks
} as const;

export type OriginalContentRegistry = typeof originalContentRegistry;
