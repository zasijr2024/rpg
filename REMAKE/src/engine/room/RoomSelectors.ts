import {
  type RoomCraftableDefinition,
  type RoomTradeGoodDefinition,
  originalRoomCraftables,
  originalRoomCost,
  originalRoomMiscItems,
  originalRoomTradeGoods,
} from "../../content/original/room/roomData";
import { originalFabricatorCraftables } from "../../content/original/lateGame/lateGameData";

export type RoomActionKind = "build" | "craft" | "buy";

export interface RoomActionOptionSnapshot {
  kind: RoomActionKind;
  key: string;
  name: string;
  cost: Record<string, number>;
  maximum?: number;
  count: number;
  disabled: boolean;
}

export interface RoomStoreSnapshot {
  key: string;
  value: number;
  category: "resources" | "weapons" | "special";
}

type RoomNumberReader = (path: string) => number;

export function roomActionOption(
  kind: RoomActionKind,
  definition: RoomCraftableDefinition | RoomTradeGoodDefinition,
  buildings: Record<string, number>,
  numberAt: RoomNumberReader,
): RoomActionOptionSnapshot {
  const cost = originalRoomCost(definition, { buildings });
  const count = roomItemCount(definition.key, definition, numberAt);
  const maximum = definition.maximum;
  return {
    kind,
    key: definition.key,
    name: "name" in definition ? definition.name : definition.key,
    cost,
    maximum,
    count,
    disabled:
      (maximum !== undefined && count >= maximum) ||
      !roomCanAfford(cost, numberAt),
  };
}

export function roomItemCount(
  key: string,
  definition: RoomCraftableDefinition | RoomTradeGoodDefinition,
  numberAt: RoomNumberReader,
): number {
  return numberAt(roomItemStatePath(key, definition));
}

export function roomItemStatePath(
  key: string,
  definition: RoomCraftableDefinition | RoomTradeGoodDefinition,
): string {
  return definition.type === "building"
    ? `game.buildings["${key}"]`
    : `stores["${key}"]`;
}

export function roomCanAfford(
  cost: Record<string, number>,
  numberAt: RoomNumberReader,
): boolean {
  return Object.entries(cost).every(
    ([store, amount]) => numberAt(`stores["${store}"]`) >= amount,
  );
}

export function shouldShowRoomStore(key: string): boolean {
  if (key.includes("blueprint")) return false;
  const type = roomStoreItemType(key);
  return type !== "upgrade" && type !== "building";
}

export function roomStoreCategory(key: string): RoomStoreSnapshot["category"] {
  const type = roomStoreItemType(key);
  if (type === "weapon") return "weapons";
  if (type === "special") return "special";
  return "resources";
}

export function roomStoreItemType(key: string): string | undefined {
  const craftable = originalRoomCraftables.find((entry) => entry.key === key);
  const good = originalRoomTradeGoods.find((entry) => entry.key === key);
  const misc = originalRoomMiscItems.find((entry) => entry.key === key);
  const fabricator = originalFabricatorCraftables.find(
    (entry) => entry.key === key,
  );
  return craftable?.type ?? good?.type ?? misc?.type ?? fabricator?.type;
}
