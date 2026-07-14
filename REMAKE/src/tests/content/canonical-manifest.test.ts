import { describe, expect, it } from "vitest";
import {
  canonicalManifest,
  DEFAULT_BAG_SPACE,
  DEFAULT_ITEM_WEIGHT,
  originalContentRegistry,
  originalPathArmourPriority,
  originalPathBaseCarryables,
  originalPathCapacity,
  originalPathCapacityUpgrades,
  originalPathWeightFor,
  PATH_STORES_OFFSET,
  SOURCE_BASELINE_COMMIT,
} from "../../content/original";

describe("canonical manifest", () => {
  it("pins the expected source baseline commit", () => {
    expect(canonicalManifest.source.commit).toBe(SOURCE_BASELINE_COMMIT);
  });

  it("tracks required source files with checksums", () => {
    const files = new Map(
      canonicalManifest.files.map((file) => [file.path, file.sha256]),
    );

    expect(files.get("ORIGINAL/script/engine.js")).toMatch(/^[a-f0-9]{64}$/);
    expect(files.get("ORIGINAL/script/room.js")).toMatch(/^[a-f0-9]{64}$/);
    expect(files.get("ORIGINAL/script/world.js")).toMatch(/^[a-f0-9]{64}$/);
    expect(files.get("ORIGINAL/script/events/setpieces.js")).toMatch(
      /^[a-f0-9]{64}$/,
    );
  });

  it("tracks each canonical source file exactly once", () => {
    const paths = canonicalManifest.files.map((file) => file.path);
    expect(paths).toHaveLength(123);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("contains the initial core key sets needed for Phase 2", () => {
    expect(canonicalManifest.keys.perks).toEqual([
      "boxer",
      "martial artist",
      "unarmed master",
      "barbarian",
      "slow metabolism",
      "desert rat",
      "evasive",
      "precise",
      "scout",
      "stealthy",
      "gastronome",
    ]);

    expect(canonicalManifest.keys.prestigeStores).toContain("wood");
    expect(canonicalManifest.keys.prestigeStores).toContain("bolas");
    expect(canonicalManifest.keys.pathWeightOverrides).toContain(
      "plasma rifle",
    );
  });

  it("contains gameplay registry key groups that later phases must port", () => {
    expect(canonicalManifest.keys.roomDefinitions).toHaveLength(38);
    expect(canonicalManifest.keys.workers).toHaveLength(10);
    expect(canonicalManifest.keys.weapons).toHaveLength(12);
    expect(canonicalManifest.keys.fabricatorCraftables).toHaveLength(9);
    expect(canonicalManifest.keys.worldTileConstants).toHaveLength(19);
    expect(canonicalManifest.keys.worldLandmarkAssignments).toHaveLength(14);
  });

  it("contains all original event files and representative titles", () => {
    expect(canonicalManifest.events.files).toEqual([
      "ORIGINAL/script/events/encounters.js",
      "ORIGINAL/script/events/executioner.js",
      "ORIGINAL/script/events/global.js",
      "ORIGINAL/script/events/marketing.js",
      "ORIGINAL/script/events/outside.js",
      "ORIGINAL/script/events/room.js",
      "ORIGINAL/script/events/setpieces.js",
    ]);

    const titles = canonicalManifest.events.titles.map((event) => event.title);
    expect(titles).toHaveLength(48);
    expect(titles).toContain("The Nomad");
    expect(titles).toContain("A Snarling Beast");
    expect(titles).toContain("A Crashed Ship");
    expect(titles).toContain("A Ravaged Battleship");
  });

  it("feeds the initial original content registry", () => {
    expect(originalContentRegistry.perks.map((perk) => perk.key)).toEqual(
      canonicalManifest.keys.perks,
    );
    expect(
      originalContentRegistry.prestigeStores.map((store) => store.key),
    ).toEqual(canonicalManifest.keys.prestigeStores);
    expect(
      originalContentRegistry.pathWeightOverrides.map((weight) => weight.key),
    ).toEqual(canonicalManifest.keys.pathWeightOverrides);
  });

  it("ports exact perk text values", () => {
    expect(originalContentRegistry.perks).toContainEqual({
      key: "evasive",
      name: "evasive",
      desc: "dodge attacks more effectively",
      notify: "learned to be where they're not",
    });
    expect(originalContentRegistry.perks).toContainEqual({
      key: "martial artist",
      name: "martial artist",
      desc: "punches do even more damage.",
      notify: "learned to fight quite effectively without weapons",
    });
  });

  it("ports exact prestige store type mapping", () => {
    expect(originalContentRegistry.prestigeStores.slice(0, 4)).toEqual([
      { key: "wood", type: "g" },
      { key: "fur", type: "g" },
      { key: "meat", type: "g" },
      { key: "iron", type: "g" },
    ]);
    expect(originalContentRegistry.prestigeStores.slice(-4)).toEqual([
      { key: "bullets", type: "a" },
      { key: "energy cell", type: "a" },
      { key: "grenade", type: "a" },
      { key: "bolas", type: "a" },
    ]);
  });

  it("ports exact path weight values and default behavior", () => {
    expect(DEFAULT_BAG_SPACE).toBe(10);
    expect(DEFAULT_ITEM_WEIGHT).toBe(1);
    expect(PATH_STORES_OFFSET).toBe(0);
    expect(originalPathWeightFor("bone spear")).toBe(2);
    expect(originalPathWeightFor("iron sword")).toBe(3);
    expect(originalPathWeightFor("steel sword")).toBe(5);
    expect(originalPathWeightFor("rifle")).toBe(5);
    expect(originalPathWeightFor("bullets")).toBe(0.1);
    expect(originalPathWeightFor("energy cell")).toBe(0.2);
    expect(originalPathWeightFor("laser rifle")).toBe(5);
    expect(originalPathWeightFor("plasma rifle")).toBe(5);
    expect(originalPathWeightFor("bolas")).toBe(0.5);
    expect(originalPathWeightFor("wood")).toBe(1);
  });

  it("ports exact path capacity and carryable metadata", () => {
    expect(originalPathCapacityUpgrades).toEqual([
      { key: "cargo drone", bonus: 100 },
      { key: "convoy", bonus: 60 },
      { key: "wagon", bonus: 30 },
      { key: "rucksack", bonus: 10 },
    ]);
    expect(originalPathCapacity({})).toBe(10);
    expect(originalPathCapacity({ rucksack: 1 })).toBe(20);
    expect(originalPathCapacity({ wagon: 1, rucksack: 1 })).toBe(40);
    expect(originalPathCapacity({ "cargo drone": 1, convoy: 1 })).toBe(110);
    expect(originalPathArmourPriority).toEqual([
      "kinetic armour",
      "s armour",
      "i armour",
      "l armour",
    ]);
    expect(originalPathBaseCarryables).toContainEqual({
      key: "cured meat",
      type: "tool",
      desc: "cured meat heal",
    });
    expect(originalPathBaseCarryables).toContainEqual({
      key: "medicine",
      type: "tool",
      desc: "medicine heal",
    });
    expect(originalContentRegistry.pathCapacityUpgrades).toBe(
      originalPathCapacityUpgrades,
    );
    expect(originalContentRegistry.pathArmourPriority).toBe(
      originalPathArmourPriority,
    );
    expect(originalContentRegistry.pathBaseCarryables).toBe(
      originalPathBaseCarryables,
    );
  });
});
