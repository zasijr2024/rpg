import { describe, expect, it } from "vitest";
import {
  canonicalManifest,
  originalContentRegistry,
  originalRoomCost,
  originalRoomCraftables,
  originalRoomFireStates,
  originalRoomMiscItems,
  originalRoomNeedsWorkshop,
  originalRoomTemperatures,
  originalRoomTradeGoods,
  ROOM_BUILDER_INCOME_DELAY,
  ROOM_BUILDER_STATE_DELAY,
  ROOM_BUILDER_WOOD_INCOME,
  ROOM_FIRE_COOL_DELAY,
  ROOM_LIGHT_FIRE_WOOD_COST,
  ROOM_NEED_WOOD_DELAY,
  ROOM_STOKE_COOLDOWN,
  ROOM_STOKE_FIRE_WOOD_COST,
  ROOM_WARM_DELAY
} from "../../content/original";

describe("original room data", () => {
  it("ports exact room constants", () => {
    expect(ROOM_FIRE_COOL_DELAY).toBe(300000);
    expect(ROOM_WARM_DELAY).toBe(30000);
    expect(ROOM_BUILDER_STATE_DELAY).toBe(30000);
    expect(ROOM_STOKE_COOLDOWN).toBe(10);
    expect(ROOM_NEED_WOOD_DELAY).toBe(15000);
    expect(ROOM_LIGHT_FIRE_WOOD_COST).toBe(5);
    expect(ROOM_STOKE_FIRE_WOOD_COST).toBe(1);
    expect(ROOM_BUILDER_INCOME_DELAY).toBe(10);
    expect(ROOM_BUILDER_WOOD_INCOME).toBe(2);
  });

  it("ports exact temperature and fire enums", () => {
    expect(originalRoomTemperatures).toEqual([
      { key: "Freezing", value: 0, text: "freezing" },
      { key: "Cold", value: 1, text: "cold" },
      { key: "Mild", value: 2, text: "mild" },
      { key: "Warm", value: 3, text: "warm" },
      { key: "Hot", value: 4, text: "hot" }
    ]);
    expect(originalRoomFireStates).toEqual([
      { key: "Dead", value: 0, text: "dead" },
      { key: "Smoldering", value: 1, text: "smoldering" },
      { key: "Flickering", value: 2, text: "flickering" },
      { key: "Burning", value: 3, text: "burning" },
      { key: "Roaring", value: 4, text: "roaring" }
    ]);
  });

  it("matches room definition manifest keys", () => {
    const keys = [
      ...originalRoomCraftables.map((craftable) => craftable.key),
      ...originalRoomTradeGoods.map((good) => good.key),
      ...originalRoomMiscItems.map((item) => item.key)
    ];
    expect(keys).toEqual(canonicalManifest.keys.roomDefinitions);
  });

  it("ports representative building craftables exactly", () => {
    expect(originalRoomCraftables).toContainEqual({
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
    });
    expect(originalRoomCraftables).toContainEqual({
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
    });
    expect(originalRoomCraftables).toContainEqual({
      key: "workshop",
      name: "workshop",
      type: "building",
      maximum: 1,
      availableMsg: "builder says she could make finer things, if she had the tools",
      buildMsg: "workshop's finally ready. builder's excited to get to it",
      cost: { wood: 800, leather: 100, scales: 10 },
      audio: "BUILD_WORKSHOP"
    });
  });

  it("ports representative workshop craftables exactly", () => {
    expect(originalRoomCraftables).toContainEqual({
      key: "waterskin",
      name: "waterskin",
      type: "upgrade",
      maximum: 1,
      buildMsg: "this waterskin'll hold a bit of water, at least",
      cost: { leather: 50 },
      audio: "CRAFT_WATERSKIN"
    });
    expect(originalRoomCraftables).toContainEqual({
      key: "convoy",
      name: "convoy",
      type: "upgrade",
      maximum: 1,
      buildMsg: "the convoy can haul mostly everything",
      cost: { wood: 1000, iron: 200, steel: 100 },
      audio: "CRAFT_CONVOY"
    });
    expect(originalRoomCraftables).toContainEqual({
      key: "rifle",
      name: "rifle",
      type: "weapon",
      buildMsg: "black powder and bullets, like the old days.",
      cost: { wood: 200, steel: 50, sulphur: 50 },
      audio: "CRAFT_RIFLE"
    });
  });

  it("ports exact dynamic cost formulas", () => {
    const trap = originalRoomCraftables.find((item) => item.key === "trap");
    const hut = originalRoomCraftables.find((item) => item.key === "hut");
    expect(trap).toBeDefined();
    expect(hut).toBeDefined();
    expect(originalRoomCost(trap!, { buildings: { trap: 0 } })).toEqual({
      wood: 10
    });
    expect(originalRoomCost(trap!, { buildings: { trap: 4 } })).toEqual({
      wood: 50
    });
    expect(originalRoomCost(hut!, { buildings: { hut: 0 } })).toEqual({
      wood: 100
    });
    expect(originalRoomCost(hut!, { buildings: { hut: 4 } })).toEqual({
      wood: 300
    });
  });

  it("ports exact trade goods", () => {
    expect(originalRoomTradeGoods).toContainEqual({
      key: "steel",
      type: "good",
      cost: { fur: 300, scales: 50, teeth: 50 },
      audio: "BUY_STEEL"
    });
    expect(originalRoomTradeGoods).toContainEqual({
      key: "grenade",
      type: "weapon",
      cost: { scales: 100, teeth: 50 },
      audio: "BUY_GRENADES"
    });
    expect(originalRoomTradeGoods).toContainEqual({
      key: "alien alloy",
      type: "good",
      cost: { fur: 1500, scales: 750, teeth: 300 },
      audio: "BUY_ALIEN_ALLOY"
    });
    expect(originalRoomTradeGoods).toContainEqual({
      key: "compass",
      type: "special",
      maximum: 1,
      cost: { fur: 400, scales: 20, teeth: 10 },
      audio: "BUY_COMPASS"
    });
  });

  it("ports misc item classification and workshop gating", () => {
    expect(originalRoomMiscItems).toEqual([{ key: "laser rifle", type: "weapon" }]);
    expect(originalRoomNeedsWorkshop("weapon")).toBe(true);
    expect(originalRoomNeedsWorkshop("upgrade")).toBe(true);
    expect(originalRoomNeedsWorkshop("tool")).toBe(true);
    expect(originalRoomNeedsWorkshop("building")).toBe(false);
  });

  it("feeds the original content registry", () => {
    expect(originalContentRegistry.roomTemperatures).toBe(originalRoomTemperatures);
    expect(originalContentRegistry.roomFireStates).toBe(originalRoomFireStates);
    expect(originalContentRegistry.roomCraftables).toBe(originalRoomCraftables);
    expect(originalContentRegistry.roomTradeGoods).toBe(originalRoomTradeGoods);
    expect(originalContentRegistry.roomMiscItems).toBe(originalRoomMiscItems);
  });
});
