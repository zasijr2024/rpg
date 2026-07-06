import { describe, expect, it } from "vitest";
import {
  canonicalManifest,
  originalBaitUsedForTraps,
  originalContentRegistry,
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
  OUTSIDE_CART_GATHER_WOOD_AMOUNT,
  OUTSIDE_GATHER_DELAY,
  OUTSIDE_GATHER_WOOD_AMOUNT,
  OUTSIDE_HUT_ROOM,
  OUTSIDE_POP_DELAY_MAX,
  OUTSIDE_POP_DELAY_MIN,
  OUTSIDE_STORES_OFFSET,
  OUTSIDE_TRAPS_DELAY
} from "../../content/original";

describe("original outside data", () => {
  it("ports exact outside constants", () => {
    expect(OUTSIDE_STORES_OFFSET).toBe(0);
    expect(OUTSIDE_GATHER_DELAY).toBe(60);
    expect(OUTSIDE_TRAPS_DELAY).toBe(90);
    expect(OUTSIDE_POP_DELAY_MIN).toBe(0.5);
    expect(OUTSIDE_POP_DELAY_MAX).toBe(3);
    expect(OUTSIDE_HUT_ROOM).toBe(4);
    expect(OUTSIDE_GATHER_WOOD_AMOUNT).toBe(10);
    expect(OUTSIDE_CART_GATHER_WOOD_AMOUNT).toBe(50);
  });

  it("matches worker manifest keys", () => {
    expect(originalOutsideWorkerIncome.map((worker) => worker.key)).toEqual(
      canonicalManifest.keys.workers
    );
  });

  it("ports exact worker income definitions", () => {
    expect(originalOutsideWorkerIncome).toContainEqual({
      key: "gatherer",
      name: "gatherer",
      delay: 10,
      stores: { wood: 1 }
    });
    expect(originalOutsideWorkerIncome).toContainEqual({
      key: "hunter",
      name: "hunter",
      delay: 10,
      stores: { fur: 0.5, meat: 0.5 }
    });
    expect(originalOutsideWorkerIncome).toContainEqual({
      key: "charcutier",
      name: "charcutier",
      delay: 10,
      stores: { meat: -5, wood: -5, "cured meat": 1 }
    });
    expect(originalOutsideWorkerIncome).toContainEqual({
      key: "armourer",
      name: "armourer",
      delay: 10,
      stores: { steel: -1, sulphur: -1, bullets: 1 }
    });
  });

  it("ports exact trap drop thresholds and messages", () => {
    expect(originalTrapDrops).toEqual([
      { rollUnder: 0.5, name: "fur", message: "scraps of fur" },
      { rollUnder: 0.75, name: "meat", message: "bits of meat" },
      { rollUnder: 0.85, name: "scales", message: "strange scales" },
      { rollUnder: 0.93, name: "teeth", message: "scattered teeth" },
      { rollUnder: 0.995, name: "cloth", message: "tattered cloth" },
      { rollUnder: 1, name: "charm", message: "a crudely made charm" }
    ]);
  });

  it("ports exact worker unlock mapping", () => {
    expect(originalOutsideWorkerUnlocks).toEqual({
      lodge: ["hunter", "trapper"],
      tannery: ["tanner"],
      smokehouse: ["charcutier"],
      "iron mine": ["iron miner"],
      "coal mine": ["coal miner"],
      "sulphur mine": ["sulphur miner"],
      steelworks: ["steelworker"],
      armoury: ["armourer"]
    });
  });

  it("ports exact village and population message thresholds", () => {
    expect(originalVillageTitleThresholds).toEqual([
      { maxHuts: 0, title: "A Silent Forest" },
      { maxHuts: 1, title: "A Lonely Hut" },
      { maxHuts: 4, title: "A Tiny Village" },
      { maxHuts: 8, title: "A Modest Village" },
      { maxHuts: 14, title: "A Large Village" },
      { maxHuts: Infinity, title: "A Raucous Village" }
    ]);
    expect(originalPopulationMessageThresholds).toEqual([
      { maxArrivals: 1, message: "a stranger arrives in the night" },
      {
        maxArrivals: 4,
        message: "a weathered family takes up in one of the huts."
      },
      { maxArrivals: 9, message: "a small group arrives, all dust and bones." },
      {
        maxArrivals: 29,
        message: "a convoy lurches in, equal parts worry and hope."
      },
      { maxArrivals: Infinity, message: "the town's booming. word does get around." }
    ]);
  });

  it("preserves original outside helper formulas", () => {
    expect(originalMaxPopulation(0)).toBe(0);
    expect(originalMaxPopulation(3)).toBe(12);
    expect(originalGatherWoodAmount(false)).toBe(10);
    expect(originalGatherWoodAmount(true)).toBe(50);
    expect(originalTrapDropCount(4, 0)).toBe(4);
    expect(originalTrapDropCount(4, 2)).toBe(6);
    expect(originalTrapDropCount(4, 10)).toBe(8);
    expect(originalBaitUsedForTraps(4, 2)).toBe(2);
    expect(originalBaitUsedForTraps(4, 10)).toBe(4);
  });

  it("resolves original title and population message thresholds", () => {
    expect(originalVillageTitleForHuts(0)).toBe("A Silent Forest");
    expect(originalVillageTitleForHuts(1)).toBe("A Lonely Hut");
    expect(originalVillageTitleForHuts(4)).toBe("A Tiny Village");
    expect(originalVillageTitleForHuts(8)).toBe("A Modest Village");
    expect(originalVillageTitleForHuts(14)).toBe("A Large Village");
    expect(originalVillageTitleForHuts(15)).toBe("A Raucous Village");

    expect(originalPopulationMessageForArrivals(1)).toBe(
      "a stranger arrives in the night"
    );
    expect(originalPopulationMessageForArrivals(4)).toBe(
      "a weathered family takes up in one of the huts."
    );
    expect(originalPopulationMessageForArrivals(9)).toBe(
      "a small group arrives, all dust and bones."
    );
    expect(originalPopulationMessageForArrivals(29)).toBe(
      "a convoy lurches in, equal parts worry and hope."
    );
    expect(originalPopulationMessageForArrivals(30)).toBe(
      "the town's booming. word does get around."
    );
  });

  it("feeds the original content registry", () => {
    expect(originalContentRegistry.outsideWorkerIncome).toBe(
      originalOutsideWorkerIncome
    );
    expect(originalContentRegistry.outsideWorkerUnlocks).toBe(
      originalOutsideWorkerUnlocks
    );
    expect(originalContentRegistry.trapDrops).toBe(originalTrapDrops);
    expect(originalContentRegistry.villageTitleThresholds).toBe(
      originalVillageTitleThresholds
    );
  });
});
