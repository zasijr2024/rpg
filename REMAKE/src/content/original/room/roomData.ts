import { canonicalManifest } from "../manifest/canonicalManifest";

export type RoomCraftableType = "building" | "tool" | "upgrade" | "weapon";
export type RoomTradeGoodType = "good" | "weapon" | "special";
export type RoomItemType = RoomCraftableType | RoomTradeGoodType;
export type RoomDynamicCost = "trap" | "hut";

export interface RoomStateDefinition {
  key: string;
  value: number;
  text: string;
}

export interface RoomCraftableDefinition {
  key: string;
  name: string;
  type: RoomCraftableType;
  cost: Record<string, number>;
  dynamicCost?: RoomDynamicCost;
  maximum?: number;
  availableMsg?: string;
  buildMsg: string;
  maxMsg?: string;
  audio: string;
}

export interface RoomTradeGoodDefinition {
  key: string;
  type: RoomTradeGoodType;
  cost: Record<string, number>;
  maximum?: number;
  audio: string;
}

export interface RoomMiscItemDefinition {
  key: string;
  type: RoomItemType;
}

export interface RoomCostContext {
  buildings?: Partial<Record<string, number>>;
}

export const ROOM_FIRE_COOL_DELAY = 5 * 60 * 1000;
export const ROOM_WARM_DELAY = 30 * 1000;
export const ROOM_BUILDER_STATE_DELAY = 0.5 * 60 * 1000;
export const ROOM_STOKE_COOLDOWN = 10;
export const ROOM_NEED_WOOD_DELAY = 15 * 1000;
export const ROOM_LIGHT_FIRE_WOOD_COST = 5;
export const ROOM_STOKE_FIRE_WOOD_COST = 1;
export const ROOM_BUILDER_INCOME_DELAY = 10;
export const ROOM_BUILDER_WOOD_INCOME = 2;

export const originalRoomTemperatures: RoomStateDefinition[] = [
  { key: "Freezing", value: 0, text: "freezing" },
  { key: "Cold", value: 1, text: "cold" },
  { key: "Mild", value: 2, text: "mild" },
  { key: "Warm", value: 3, text: "warm" },
  { key: "Hot", value: 4, text: "hot" }
];

export const originalRoomFireStates: RoomStateDefinition[] = [
  { key: "Dead", value: 0, text: "dead" },
  { key: "Smoldering", value: 1, text: "smoldering" },
  { key: "Flickering", value: 2, text: "flickering" },
  { key: "Burning", value: 3, text: "burning" },
  { key: "Roaring", value: 4, text: "roaring" }
];

export const originalRoomCraftables: RoomCraftableDefinition[] = [
  {
    key: "trap",
    name: "trap",
    type: "building",
    maximum: 10,
    availableMsg:
      "builder says she can make traps to catch any creatures might still be alive out there",
    buildMsg: "more traps to catch more creatures",
    maxMsg: "more traps won't help now",
    cost: { wood: 10 },
    dynamicCost: "trap",
    audio: "BUILD_TRAP"
  },
  {
    key: "cart",
    name: "cart",
    type: "building",
    maximum: 1,
    availableMsg: "builder says she can make a cart for carrying wood",
    buildMsg: "the rickety cart will carry more wood from the forest",
    cost: { wood: 30 },
    audio: "BUILD_CART"
  },
  {
    key: "hut",
    name: "hut",
    type: "building",
    maximum: 20,
    availableMsg: "builder says there are more wanderers. says they'll work, too.",
    buildMsg: "builder puts up a hut, out in the forest. says word will get around.",
    maxMsg: "no more room for huts.",
    cost: { wood: 100 },
    dynamicCost: "hut",
    audio: "BUILD_HUT"
  },
  {
    key: "lodge",
    name: "lodge",
    type: "building",
    maximum: 1,
    availableMsg: "villagers could help hunt, given the means",
    buildMsg: "the hunting lodge stands in the forest, a ways out of town",
    cost: { wood: 200, fur: 10, meat: 5 },
    audio: "BUILD_LODGE"
  },
  {
    key: "trading post",
    name: "trading post",
    type: "building",
    maximum: 1,
    availableMsg: "a trading post would make commerce easier",
    buildMsg: "now the nomads have a place to set up shop, they might stick around a while",
    cost: { wood: 400, fur: 100 },
    audio: "BUILD_TRADING_POST"
  },
  {
    key: "tannery",
    name: "tannery",
    type: "building",
    maximum: 1,
    availableMsg: "builder says leather could be useful. says the villagers could make it.",
    buildMsg: "tannery goes up quick, on the edge of the village",
    cost: { wood: 500, fur: 50 },
    audio: "BUILD_TANNERY"
  },
  {
    key: "smokehouse",
    name: "smokehouse",
    type: "building",
    maximum: 1,
    availableMsg: "should cure the meat, or it'll spoil. builder says she can fix something up.",
    buildMsg: "builder finishes the smokehouse. she looks hungry.",
    cost: { wood: 600, meat: 50 },
    audio: "BUILD_SMOKEHOUSE"
  },
  {
    key: "workshop",
    name: "workshop",
    type: "building",
    maximum: 1,
    availableMsg: "builder says she could make finer things, if she had the tools",
    buildMsg: "workshop's finally ready. builder's excited to get to it",
    cost: { wood: 800, leather: 100, scales: 10 },
    audio: "BUILD_WORKSHOP"
  },
  {
    key: "steelworks",
    name: "steelworks",
    type: "building",
    maximum: 1,
    availableMsg: "builder says the villagers could make steel, given the tools",
    buildMsg: "a haze falls over the village as the steelworks fires up",
    cost: { wood: 1500, iron: 100, coal: 100 },
    audio: "BUILD_STEELWORKS"
  },
  {
    key: "armoury",
    name: "armoury",
    type: "building",
    maximum: 1,
    availableMsg: "builder says it'd be useful to have a steady source of bullets",
    buildMsg: "armoury's done, welcoming back the weapons of the past.",
    cost: { wood: 3000, steel: 100, sulphur: 50 },
    audio: "BUILD_ARMOURY"
  },
  {
    key: "torch",
    name: "torch",
    type: "tool",
    buildMsg: "a torch to keep the dark away",
    cost: { wood: 1, cloth: 1 },
    audio: "CRAFT_TORCH"
  },
  {
    key: "waterskin",
    name: "waterskin",
    type: "upgrade",
    maximum: 1,
    buildMsg: "this waterskin'll hold a bit of water, at least",
    cost: { leather: 50 },
    audio: "CRAFT_WATERSKIN"
  },
  {
    key: "cask",
    name: "cask",
    type: "upgrade",
    maximum: 1,
    buildMsg: "the cask holds enough water for longer expeditions",
    cost: { leather: 100, iron: 20 },
    audio: "CRAFT_CASK"
  },
  {
    key: "water tank",
    name: "water tank",
    type: "upgrade",
    maximum: 1,
    buildMsg: "never go thirsty again",
    cost: { iron: 100, steel: 50 },
    audio: "CRAFT_WATER_TANK"
  },
  {
    key: "bone spear",
    name: "bone spear",
    type: "weapon",
    buildMsg: "this spear's not elegant, but it's pretty good at stabbing",
    cost: { wood: 100, teeth: 5 },
    audio: "CRAFT_BONE_SPEAR"
  },
  {
    key: "rucksack",
    name: "rucksack",
    type: "upgrade",
    maximum: 1,
    buildMsg: "carrying more means longer expeditions to the wilds",
    cost: { leather: 200 },
    audio: "CRAFT_RUCKSACK"
  },
  {
    key: "wagon",
    name: "wagon",
    type: "upgrade",
    maximum: 1,
    buildMsg: "the wagon can carry a lot of supplies",
    cost: { wood: 500, iron: 100 },
    audio: "CRAFT_WAGON"
  },
  {
    key: "convoy",
    name: "convoy",
    type: "upgrade",
    maximum: 1,
    buildMsg: "the convoy can haul mostly everything",
    cost: { wood: 1000, iron: 200, steel: 100 },
    audio: "CRAFT_CONVOY"
  },
  {
    key: "l armour",
    name: "l armour",
    type: "upgrade",
    maximum: 1,
    buildMsg: "leather's not strong. better than rags, though.",
    cost: { leather: 200, scales: 20 },
    audio: "CRAFT_LEATHER_ARMOUR"
  },
  {
    key: "i armour",
    name: "i armour",
    type: "upgrade",
    maximum: 1,
    buildMsg: "iron's stronger than leather",
    cost: { leather: 200, iron: 100 },
    audio: "CRAFT_IRON_ARMOUR"
  },
  {
    key: "s armour",
    name: "s armour",
    type: "upgrade",
    maximum: 1,
    buildMsg: "steel's stronger than iron",
    cost: { leather: 200, steel: 100 },
    audio: "CRAFT_STEEL_ARMOUR"
  },
  {
    key: "iron sword",
    name: "iron sword",
    type: "weapon",
    buildMsg: "sword is sharp. good protection out in the wilds.",
    cost: { wood: 200, leather: 50, iron: 20 },
    audio: "CRAFT_IRON_SWORD"
  },
  {
    key: "steel sword",
    name: "steel sword",
    type: "weapon",
    buildMsg: "the steel is strong, and the blade true.",
    cost: { wood: 500, leather: 100, steel: 20 },
    audio: "CRAFT_STEEL_SWORD"
  },
  {
    key: "rifle",
    name: "rifle",
    type: "weapon",
    buildMsg: "black powder and bullets, like the old days.",
    cost: { wood: 200, steel: 50, sulphur: 50 },
    audio: "CRAFT_RIFLE"
  }
];

export const originalRoomTradeGoods: RoomTradeGoodDefinition[] = [
  { key: "scales", type: "good", cost: { fur: 150 }, audio: "BUY_SCALES" },
  { key: "teeth", type: "good", cost: { fur: 300 }, audio: "BUY_TEETH" },
  {
    key: "iron",
    type: "good",
    cost: { fur: 150, scales: 50 },
    audio: "BUY_IRON"
  },
  {
    key: "coal",
    type: "good",
    cost: { fur: 200, teeth: 50 },
    audio: "BUY_COAL"
  },
  {
    key: "steel",
    type: "good",
    cost: { fur: 300, scales: 50, teeth: 50 },
    audio: "BUY_STEEL"
  },
  {
    key: "medicine",
    type: "good",
    cost: { scales: 50, teeth: 30 },
    audio: "BUY_MEDICINE"
  },
  {
    key: "bullets",
    type: "good",
    cost: { scales: 10 },
    audio: "BUY_BULLETS"
  },
  {
    key: "energy cell",
    type: "good",
    cost: { scales: 10, teeth: 10 },
    audio: "BUY_ENERGY_CELL"
  },
  { key: "bolas", type: "weapon", cost: { teeth: 10 }, audio: "BUY_BOLAS" },
  {
    key: "grenade",
    type: "weapon",
    cost: { scales: 100, teeth: 50 },
    audio: "BUY_GRENADES"
  },
  {
    key: "bayonet",
    type: "weapon",
    cost: { scales: 500, teeth: 250 },
    audio: "BUY_BAYONET"
  },
  {
    key: "alien alloy",
    type: "good",
    cost: { fur: 1500, scales: 750, teeth: 300 },
    audio: "BUY_ALIEN_ALLOY"
  },
  {
    key: "compass",
    type: "special",
    maximum: 1,
    cost: { fur: 400, scales: 20, teeth: 10 },
    audio: "BUY_COMPASS"
  }
];

export const originalRoomMiscItems: RoomMiscItemDefinition[] = [
  { key: "laser rifle", type: "weapon" }
];

export function originalRoomCost(
  definition: RoomCraftableDefinition | RoomTradeGoodDefinition,
  context: RoomCostContext = {}
): Record<string, number> {
  if (!("dynamicCost" in definition) || !definition.dynamicCost) {
    return { ...definition.cost };
  }

  const n = context.buildings?.[definition.key] ?? 0;
  switch (definition.dynamicCost) {
    case "trap":
      return { wood: 10 + n * 10 };
    case "hut":
      return { wood: 100 + n * 50 };
  }
}

export function originalRoomNeedsWorkshop(type: RoomCraftableType): boolean {
  return type === "weapon" || type === "upgrade" || type === "tool";
}

assertKeysMatchManifest();

function assertKeysMatchManifest(): void {
  const roomKeys = [
    ...originalRoomCraftables.map((craftable) => craftable.key),
    ...originalRoomTradeGoods.map((good) => good.key),
    ...originalRoomMiscItems.map((item) => item.key)
  ];

  if (roomKeys.join("\u0000") !== canonicalManifest.keys.roomDefinitions.join("\u0000")) {
    throw new Error("Original room definition keys do not match canonical manifest");
  }
}
