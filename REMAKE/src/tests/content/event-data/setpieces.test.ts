/* eslint-disable @typescript-eslint/no-unused-vars -- Contract slices retain shared local fixtures. */
import { describe, expect, it } from "vitest";
import {
  canonicalManifest,
  originalExecutionerCombatDefinitions,
  originalEventDefinitions,
  originalSetpieceCombatDefinitions,
} from "../../../content/original";

describe("Event data setpiece coverage", () => {
  it("represents all 13 parser-backed canonical Setpiece events", () => {
    const canonicalSetpieceKeys = [
      "setpiece.outpost",
      "setpiece.swamp",
      "setpiece.cave",
      "setpiece.town",
      "setpiece.city",
      "setpiece.house",
      "setpiece.battlefield",
      "setpiece.borehole",
      "setpiece.ship",
      "setpiece.sulphurmine",
      "setpiece.coalmine",
      "setpiece.ironmine",
      "setpiece.cache",
    ];
    const representedKeys = new Set(
      originalEventDefinitions.map((entry) => entry.key),
    );

    expect(
      canonicalSetpieceKeys.filter((key) => !representedKeys.has(key)),
    ).toEqual([]);
  });

  it("ports the complete canonical Outpost graph", () => {
    const outpost = originalEventDefinitions.find(
      (entry) => entry.key === "setpiece.outpost",
    );

    expect(outpost).toMatchObject({
      key: "setpiece.outpost",
      title: "An Outpost",
      pool: "setpiece",
    });
    expect(Object.keys(outpost?.scenes ?? {})).toEqual(["start"]);
    expect(outpost?.scenes.start).toMatchObject({
      key: "start",
      text: ["a safe place in the wilds."],
      notification: "a safe place in the wilds.",
      loot: {
        "cured meat": { min: 5, max: 10, chance: 1 },
      },
      buttons: [{ key: "leave", text: "leave", nextScene: "end" }],
    });
  });

  it("ports the complete canonical Swamp graph", () => {
    const swamp = originalEventDefinitions.find(
      (entry) => entry.key === "setpiece.swamp",
    );

    expect(swamp).toMatchObject({
      key: "setpiece.swamp",
      title: "A Murky Swamp",
      pool: "setpiece",
    });
    expect(Object.keys(swamp?.scenes ?? {})).toEqual([
      "start",
      "cabin",
      "talk",
    ]);
    expect(swamp?.scenes.start).toMatchObject({
      key: "start",
      text: [
        "rotting reeds rise out of the swampy earth.",
        "a lone frog sits in the muck, silently.",
      ],
      notification: "a swamp festers in the stagnant air.",
      buttons: [
        { key: "enter", text: "enter", nextScene: { 1: "cabin" } },
        { key: "leave", text: "leave", nextScene: "end" },
      ],
    });
    expect(swamp?.scenes.cabin).toMatchObject({
      key: "cabin",
      text: [
        "deep in the swamp is a moss-covered cabin.",
        "an old wanderer sits inside, in a seeming trance.",
      ],
      buttons: [
        {
          key: "talk",
          text: "talk",
          cost: { charm: 1 },
          nextScene: { 1: "talk" },
        },
        { key: "leave", text: "leave", nextScene: "end" },
      ],
    });
    expect(swamp?.scenes.talk).toMatchObject({
      key: "talk",
      text: [
        "the wanderer takes the charm and nods slowly.",
        "he speaks of once leading the great fleets to fresh worlds.",
        "unfathomable destruction to fuel wanderer hungers.",
        "his time here, now, is his penance.",
      ],
      buttons: [{ key: "leave", text: "leave", nextScene: "end" }],
    });
  });

  it("represents focused setpiece combat definitions and mine traversal slices", () => {
    const setpieceCombats = originalSetpieceCombatDefinitions;

    expect(Object.keys(setpieceCombats)).toEqual([
      "cave-beast",
      "cave-small-beast",
      "cave-large-beast",
      "cave-lizard",
      "cave-giant-lizard",
      "town-thug",
      "town-scavenger",
      "town-beast",
      "town-vigilante",
      "town-madman",
      "house-squatter",
      "city-sniper",
      "city-soldier",
      "city-commando",
      "city-thug",
      "city-bird",
      "city-beast",
      "city-old-man",
      "city-lizard",
      "city-lizards",
      "city-squatters",
      "city-crowd-squatters",
      "city-deformed",
      "city-tentacles",
      "city-rats",
      "city-veteran",
      "city-frail-man",
      "city-youth",
      "city-squatter",
      "sulphurmine-veteran",
      "coalmine-man",
      "coalmine-chief",
      "ironmine-matriarch",
    ]);
    expect(setpieceCombats["cave-beast"]).toMatchObject({
      enemy: "beast",
      damage: 1,
      attackDelay: 1,
      health: 5,
      loot: {
        fur: { min: 1, max: 10, chance: 1 },
        teeth: { min: 1, max: 5, chance: 0.8 },
      },
    });
    expect(setpieceCombats["cave-small-beast"]).toMatchObject({
      enemy: "beast",
      damage: 1,
      attackDelay: 1,
      health: 5,
      loot: {
        fur: { min: 1, max: 3, chance: 1 },
        teeth: { min: 1, max: 2, chance: 0.8 },
      },
    });
    expect(setpieceCombats["cave-large-beast"]).toMatchObject({
      enemy: "beast",
      damage: 3,
      attackDelay: 2,
      health: 10,
      loot: {
        fur: { min: 1, max: 3, chance: 1 },
        teeth: { min: 1, max: 3, chance: 1 },
      },
    });
    expect(setpieceCombats["cave-lizard"]).toMatchObject({
      enemy: "cave lizard",
      damage: 3,
      attackDelay: 2,
      health: 6,
      loot: {
        scales: { min: 1, max: 3, chance: 1 },
        teeth: { min: 1, max: 2, chance: 0.8 },
      },
    });
    expect(setpieceCombats["cave-giant-lizard"]).toMatchObject({
      enemy: "lizard",
      damage: 4,
      attackDelay: 2,
      health: 10,
      loot: {
        scales: { min: 1, max: 3, chance: 1 },
        teeth: { min: 1, max: 3, chance: 1 },
      },
    });
    expect(setpieceCombats["town-thug"]).toMatchObject({
      enemy: "thug",
      damage: 4,
      health: 30,
      loot: {
        cloth: { min: 5, max: 10, chance: 0.8 },
        leather: { min: 5, max: 10, chance: 0.8 },
        "cured meat": { min: 1, max: 5, chance: 0.5 },
      },
    });
    expect(setpieceCombats["town-scavenger"]).toMatchObject({
      enemy: "scavenger",
      damage: 5,
      health: 30,
      loot: {
        "cured meat": { min: 1, max: 5, chance: 1 },
        leather: { min: 5, max: 10, chance: 0.8 },
        "steel sword": { min: 1, max: 1, chance: 0.5 },
      },
    });
    expect(setpieceCombats["town-beast"]).toMatchObject({
      enemy: "beast",
      damage: 3,
      health: 25,
      loot: {
        teeth: { min: 1, max: 5, chance: 1 },
        fur: { min: 5, max: 10, chance: 1 },
      },
    });
    expect(setpieceCombats["town-vigilante"]).toMatchObject({
      enemy: "vigilante",
      damage: 6,
      health: 30,
      loot: {
        "cured meat": { min: 1, max: 5, chance: 1 },
        leather: { min: 5, max: 10, chance: 0.8 },
        "steel sword": { min: 1, max: 1, chance: 0.5 },
      },
    });
    expect(setpieceCombats["town-madman"]).toMatchObject({
      enemy: "madman",
      damage: 6,
      hit: 0.3,
      attackDelay: 1,
      health: 10,
      loot: {
        cloth: { min: 2, max: 4, chance: 0.3 },
        "cured meat": { min: 1, max: 5, chance: 0.9 },
        medicine: { min: 1, max: 2, chance: 0.4 },
      },
    });
    expect(setpieceCombats["house-squatter"]).toMatchObject({
      enemy: "squatter",
      damage: 3,
      health: 10,
      loot: {
        "cured meat": { min: 1, max: 10, chance: 0.8 },
        leather: { min: 1, max: 10, chance: 0.2 },
        cloth: { min: 1, max: 10, chance: 0.5 },
      },
    });
    expect(setpieceCombats["city-sniper"]).toMatchObject({
      enemy: "sniper",
      ranged: true,
      damage: 15,
      health: 30,
      loot: {
        "cured meat": { min: 1, max: 5, chance: 0.8 },
        bullets: { min: 1, max: 5, chance: 0.5 },
        rifle: { min: 1, max: 1, chance: 0.2 },
      },
    });
    expect(setpieceCombats["city-soldier"]).toMatchObject({
      enemy: "soldier",
      ranged: true,
      damage: 8,
      health: 50,
      loot: {
        "cured meat": { min: 1, max: 5, chance: 0.8 },
        bullets: { min: 1, max: 5, chance: 0.5 },
        rifle: { min: 1, max: 1, chance: 0.2 },
      },
    });
    expect(setpieceCombats["city-commando"]).toMatchObject({
      enemy: "commando",
      ranged: true,
      damage: 3,
      hit: 0.9,
      health: 55,
      loot: {
        rifle: { min: 1, max: 1, chance: 0.5 },
        bullets: { min: 1, max: 5, chance: 0.8 },
        "cured meat": { min: 1, max: 5, chance: 0.8 },
      },
    });
    expect(setpieceCombats["city-thug"]).toMatchObject({
      enemy: "thug",
      damage: 3,
      health: 30,
      loot: {
        "steel sword": { min: 1, max: 1, chance: 0.5 },
        "cured meat": { min: 1, max: 3, chance: 0.5 },
        cloth: { min: 1, max: 5, chance: 0.8 },
      },
    });
    expect(setpieceCombats["city-bird"]).toMatchObject({
      enemy: "bird",
      damage: 5,
      hit: 0.7,
      attackDelay: 1,
      health: 45,
      loot: {
        meat: { min: 5, max: 10, chance: 0.8 },
      },
    });
    expect(setpieceCombats["city-beast"]).toMatchObject({
      enemy: "beast",
      damage: 2,
      attackDelay: 1,
      health: 30,
      loot: {
        meat: { min: 1, max: 5, chance: 0.8 },
        fur: { min: 1, max: 5, chance: 0.8 },
        teeth: { min: 1, max: 5, chance: 0.5 },
      },
    });
    expect(setpieceCombats["city-old-man"]).toMatchObject({
      enemy: "old man",
      damage: 3,
      hit: 0.5,
      health: 10,
      loot: {
        "cured meat": { min: 1, max: 3, chance: 0.5 },
        cloth: { min: 1, max: 5, chance: 0.8 },
        medicine: { min: 1, max: 2, chance: 0.5 },
      },
    });
    expect(setpieceCombats["city-lizard"]).toMatchObject({
      enemy: "lizard",
      damage: 5,
      attackDelay: 2,
      health: 20,
      loot: {
        scales: { min: 5, max: 10, chance: 0.8 },
        teeth: { min: 5, max: 10, chance: 0.5 },
        meat: { min: 5, max: 10, chance: 0.8 },
      },
    });
    expect(setpieceCombats["city-lizards"]).toMatchObject({
      enemy: "lizards",
      damage: 4,
      attackDelay: 0.7,
      health: 30,
      loot: {
        meat: { min: 3, max: 8, chance: 1 },
        teeth: { min: 2, max: 4, chance: 1 },
        scales: { min: 3, max: 5, chance: 1 },
      },
    });
    expect(setpieceCombats["city-squatters"]).toMatchObject({
      enemy: "squatters",
      damage: 2,
      hit: 0.7,
      attackDelay: 0.5,
      health: 40,
      loot: {
        "cured meat": { min: 1, max: 3, chance: 0.5 },
        cloth: { min: 3, max: 8, chance: 0.8 },
        medicine: { min: 1, max: 3, chance: 0.3 },
      },
    });
    expect(setpieceCombats["city-crowd-squatters"]).toMatchObject({
      enemy: "squatters",
      damage: 2,
      hit: 0.7,
      attackDelay: 0.5,
      health: 40,
      loot: {
        cloth: { min: 1, max: 5, chance: 0.8 },
        teeth: { min: 1, max: 5, chance: 0.5 },
      },
    });
    expect(setpieceCombats["city-deformed"]).toMatchObject({
      enemy: "deformed",
      damage: 8,
      hit: 0.6,
      health: 40,
      loot: {
        cloth: { min: 1, max: 5, chance: 0.8 },
        teeth: { min: 2, max: 2, chance: 1 },
        steel: { min: 1, max: 3, chance: 0.6 },
        scales: { min: 2, max: 3, chance: 0.1 },
      },
    });
    expect(setpieceCombats["city-tentacles"]).toMatchObject({
      enemy: "tentacles",
      damage: 2,
      hit: 0.6,
      attackDelay: 0.5,
      health: 60,
      loot: {
        meat: { min: 10, max: 20, chance: 1 },
      },
    });
    expect(setpieceCombats["city-rats"]).toMatchObject({
      enemy: "rats",
      damage: 1,
      attackDelay: 0.25,
      health: 60,
      loot: {
        fur: { min: 5, max: 10, chance: 0.8 },
        teeth: { min: 5, max: 10, chance: 0.5 },
      },
    });
    expect(setpieceCombats["city-veteran"]).toMatchObject({
      enemy: "veteran",
      damage: 6,
      health: 45,
      loot: {
        bayonet: { min: 1, max: 1, chance: 0.5 },
        "cured meat": { min: 1, max: 5, chance: 0.8 },
      },
    });
    expect(setpieceCombats["city-frail-man"]).toMatchObject({
      enemy: "frail man",
      damage: 1,
      health: 10,
      loot: {
        "cured meat": { min: 1, max: 5, chance: 0.8 },
        cloth: { min: 1, max: 5, chance: 0.5 },
        leather: { min: 1, max: 1, chance: 0.2 },
        medicine: { min: 1, max: 3, chance: 0.05 },
      },
    });
    expect(setpieceCombats["city-youth"]).toMatchObject({
      enemy: "youth",
      damage: 2,
      health: 45,
      loot: {
        cloth: { min: 1, max: 5, chance: 0.8 },
        teeth: { min: 1, max: 5, chance: 0.5 },
      },
    });
    expect(setpieceCombats["city-squatter"]).toMatchObject({
      enemy: "squatter",
      damage: 3,
      health: 20,
      loot: {
        cloth: { min: 1, max: 5, chance: 0.8 },
        teeth: { min: 1, max: 5, chance: 0.5 },
      },
    });
    expect(setpieceCombats["sulphurmine-veteran"]).toMatchObject({
      enemy: "veteran",
      damage: 10,
      health: 65,
      loot: {
        bayonet: { min: 1, max: 1, chance: 0.5 },
        "cured meat": { min: 1, max: 5, chance: 0.8 },
      },
    });
    expect(setpieceCombats["coalmine-man"]).toMatchObject({
      enemy: "man",
      damage: 3,
      health: 10,
      loot: {
        "cured meat": { min: 1, max: 5, chance: 0.8 },
        cloth: { min: 1, max: 5, chance: 0.8 },
      },
    });
    expect(setpieceCombats["coalmine-chief"]).toMatchObject({
      enemy: "chief",
      damage: 5,
      health: 20,
      loot: {
        "cured meat": { min: 5, max: 10, chance: 1 },
        cloth: { min: 5, max: 10, chance: 0.8 },
        iron: { min: 1, max: 5, chance: 0.8 },
      },
    });
    expect(setpieceCombats["ironmine-matriarch"]).toMatchObject({
      enemy: "beastly matriarch",
      damage: 4,
      health: 10,
      loot: {
        teeth: { min: 5, max: 10, chance: 1 },
        scales: { min: 5, max: 10, chance: 0.8 },
        cloth: { min: 5, max: 10, chance: 0.5 },
      },
    });
    const setpieceEvents = originalEventDefinitions.filter(
      (entry) => entry.pool === "setpiece",
    );
    expect(setpieceEvents).toHaveLength(52);
    expect(setpieceEvents.map((entry) => entry.key)).toEqual([
      "setpiece.outpost",
      "setpiece.swamp",
      "setpiece.house",
      "setpiece.battlefield",
      "setpiece.borehole",
      "setpiece.ship",
      "setpiece.cache",
      "setpiece.cave",
      "setpiece.town",
      "setpiece.city",
      "setpiece.cave-depths",
      "setpiece.cave-camp-cache",
      "setpiece.cave-wanderer-nest",
      "setpiece.cave-old-case",
      "setpiece.town-thug",
      "setpiece.town-schoolhouse",
      "setpiece.town-park-vigilante",
      "setpiece.town-caravan-vigilante",
      "setpiece.town-clinic",
      "setpiece.town-clinic-madman",
      "setpiece.city-old-tower",
      "setpiece.city-old-tower-scavenged",
      "setpiece.city-old-tower-thug-rubble",
      "setpiece.city-old-tower-rubble",
      "setpiece.city-sniper",
      "setpiece.city-hospital",
      "setpiece.city-soldier-patrol",
      "setpiece.city-commando-settlement",
      "setpiece.city-subway",
      "setpiece.city-subway-beast-rubble",
      "setpiece.city-commando-supplies",
      "setpiece.city-military-camp",
      "setpiece.city-military-camp-supplies",
      "setpiece.city-subway-scavenged",
      "setpiece.city-shanty-market",
      "setpiece.city-drying-hut",
      "setpiece.city-drying-hut-sack",
      "setpiece.city-shanty-crowd",
      "setpiece.city-shanty-crowd-sack",
      "setpiece.city-drying-meat-youth",
      "setpiece.city-shanty-crowd-youth",
      "setpiece.city-hospital-medicine",
      "setpiece.city-hospital-cache",
      "setpiece.city-hospital-old-man-theatres",
      "setpiece.city-hospital-old-man-squatters",
      "setpiece.city-hospital-ward",
      "setpiece.city-hospital-squatters",
      "setpiece.city-hospital-deformed",
      "setpiece.city-hospital-tentacles",
      "setpiece.sulphurmine",
      "setpiece.coalmine",
      "setpiece.ironmine",
    ]);
    expect(
      Object.keys(
        setpieceEvents.find((entry) => entry.key === "setpiece.house")
          ?.scenes ?? {},
      ),
    ).toEqual(["start", "supplies", "medicine", "occupied"]);
    expect(
      Object.keys(
        setpieceEvents.find((entry) => entry.key === "setpiece.battlefield")
          ?.scenes ?? {},
      ),
    ).toEqual(["start"]);
    expect(
      Object.keys(
        setpieceEvents.find((entry) => entry.key === "setpiece.borehole")
          ?.scenes ?? {},
      ),
    ).toEqual(["start"]);
    expect(
      Object.keys(
        setpieceEvents.find((entry) => entry.key === "setpiece.ship")?.scenes ??
          {},
      ),
    ).toEqual(["start"]);
    expect(
      Object.keys(
        setpieceEvents.find((entry) => entry.key === "setpiece.cache")
          ?.scenes ?? {},
      ),
    ).toEqual(["start", "underground", "exit"]);
    expect(
      Object.keys(
        setpieceEvents.find((entry) => entry.key === "setpiece.sulphurmine")
          ?.scenes ?? {},
      ),
    ).toEqual(["start", "a1", "a2", "a3", "cleared"]);
    expect(
      Object.keys(
        setpieceEvents.find((entry) => entry.key === "setpiece.coalmine")
          ?.scenes ?? {},
      ),
    ).toEqual(["start", "a1", "a2", "a3", "cleared"]);
    expect(
      Object.keys(
        setpieceEvents.find((entry) => entry.key === "setpiece.ironmine")
          ?.scenes ?? {},
      ),
    ).toEqual(["start", "enter", "cleared"]);
    expect(setpieceEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "setpiece.outpost",
          title: "An Outpost",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              text: ["a safe place in the wilds."],
              notification: "a safe place in the wilds.",
              loot: {
                "cured meat": { min: 5, max: 10, chance: 1 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.swamp",
          title: "A Murky Swamp",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              notification: "a swamp festers in the stagnant air.",
            }),
            cabin: expect.objectContaining({
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "talk",
                  cost: { charm: 1 },
                }),
              ]),
            }),
            talk: expect.objectContaining({
              text: expect.arrayContaining([
                "the wanderer takes the charm and nods slowly.",
              ]),
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.cave",
          title: "A Damp Cave",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "enter",
                  cost: { torch: 1 },
                  nextScene: { 0.3: "a1", 0.6: "a2", 1: "a3" },
                }),
              ]),
            }),
            a1: expect.objectContaining({
              combat: originalSetpieceCombatDefinitions["cave-beast"],
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "continue",
                  nextScene: { 0.5: "b1", 1: "b2" },
                }),
              ]),
            }),
            a2: expect.any(Object),
            a3: expect.any(Object),
            b1: expect.any(Object),
            b2: expect.any(Object),
            b3: expect.any(Object),
            b4: expect.any(Object),
            c1: expect.any(Object),
            c2: expect.any(Object),
            end1: expect.any(Object),
            end2: expect.any(Object),
            end3: expect.any(Object),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.town",
          title: "A Deserted Town",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              notification: "the town lies abandoned, its citizens long dead",
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "enter",
                  nextScene: { 0.3: "a1", 0.7: "a3", 1: "a2" },
                }),
              ]),
            }),
            a1: expect.any(Object),
            a2: expect.objectContaining({
              combat: originalSetpieceCombatDefinitions["town-thug"],
            }),
            a3: expect.any(Object),
            b1: expect.any(Object),
            b2: expect.objectContaining({
              combat: expect.objectContaining({
                enemy: "scavenger",
                damage: 4,
              }),
            }),
            b3: expect.any(Object),
            b4: expect.any(Object),
            b5: expect.any(Object),
            c1: expect.any(Object),
            c2: expect.any(Object),
            c3: expect.any(Object),
            c4: expect.objectContaining({
              combat: expect.objectContaining({ enemy: "beast", damage: 4 }),
            }),
            c5: expect.any(Object),
            c6: expect.any(Object),
            d1: expect.any(Object),
            d2: expect.any(Object),
            end1: expect.any(Object),
            end2: expect.any(Object),
            end3: expect.any(Object),
            end4: expect.any(Object),
            end5: expect.any(Object),
            end6: expect.any(Object),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              notification:
                "the towers of a decaying city dominate the skyline",
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "enter",
                  nextScene: {
                    0.2: "a1",
                    0.5: "a2",
                    0.8: "a3",
                    1: "a4",
                  },
                }),
              ]),
            }),
            a1: expect.any(Object),
            a2: expect.any(Object),
            a3: expect.any(Object),
            a4: expect.any(Object),
            b1: expect.any(Object),
            b2: expect.objectContaining({
              combat: originalSetpieceCombatDefinitions["city-lizard"],
            }),
            b3: expect.objectContaining({
              combat: originalSetpieceCombatDefinitions["city-sniper"],
            }),
            b4: expect.objectContaining({
              combat: originalSetpieceCombatDefinitions["city-soldier"],
            }),
            b5: expect.any(Object),
            b6: expect.any(Object),
            b7: expect.any(Object),
            b8: expect.any(Object),
            c1: expect.any(Object),
            c2: expect.any(Object),
            c3: expect.any(Object),
            c4: expect.any(Object),
            c5: expect.any(Object),
            c6: expect.any(Object),
            c7: expect.any(Object),
            c8: expect.any(Object),
            c9: expect.any(Object),
            c10: expect.any(Object),
            c11: expect.any(Object),
            c12: expect.any(Object),
            c13: expect.any(Object),
            d1: expect.any(Object),
            d2: expect.any(Object),
            d3: expect.any(Object),
            d4: expect.any(Object),
            d5: expect.any(Object),
            d6: expect.any(Object),
            d7: expect.any(Object),
            d8: expect.any(Object),
            d9: expect.any(Object),
            d10: expect.any(Object),
            d11: expect.any(Object),
            end1: expect.any(Object),
            end2: expect.any(Object),
            end3: expect.any(Object),
            end4: expect.any(Object),
            end5: expect.any(Object),
            end6: expect.any(Object),
            end7: expect.any(Object),
            end8: expect.any(Object),
            end9: expect.any(Object),
            end10: expect.any(Object),
            end11: expect.any(Object),
            end12: expect.any(Object),
            end13: expect.any(Object),
            end14: expect.any(Object),
            end15: expect.any(Object),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.cave-depths",
          title: "A Damp Cave",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              notification:
                "the earth here is split, as if bearing an ancient wound",
            }),
            beast: expect.objectContaining({
              notification: "a startled beast defends its home",
              combat: expect.objectContaining({
                enemy: "beast",
              }),
            }),
            lizard: expect.objectContaining({
              notification: "a cave lizard attacks",
              combat: expect.objectContaining({
                enemy: "cave lizard",
              }),
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.cave-camp-cache",
          title: "A Damp Cave",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "enter",
                  cost: { torch: 1 },
                }),
              ]),
            }),
            camp: expect.objectContaining({
              text: [
                "the remains of an old camp sits just inside the cave.",
                "bedrolls, torn and blackened, lay beneath a thin layer of dust.",
              ],
              loot: {
                "cured meat": { min: 1, max: 5, chance: 1 },
                torch: { min: 1, max: 5, chance: 0.5 },
                leather: { min: 1, max: 5, chance: 0.3 },
              },
            }),
            lizard: expect.objectContaining({
              notification: "a giant lizard shambles forward",
              combat: expect.objectContaining({
                enemy: "lizard",
                health: 10,
              }),
            }),
            "supply-cache": expect.objectContaining({
              text: ["a small supply cache is hidden at the back of the cave."],
              loot: {
                cloth: { min: 5, max: 10, chance: 1 },
                leather: { min: 5, max: 10, chance: 1 },
                iron: { min: 5, max: 10, chance: 1 },
                "cured meat": { min: 5, max: 10, chance: 1 },
                steel: { min: 5, max: 10, chance: 0.5 },
                bolas: { min: 1, max: 3, chance: 0.3 },
                medicine: { min: 1, max: 4, chance: 0.15 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.cave-wanderer-nest",
          title: "A Damp Cave",
          scenes: expect.objectContaining({
            beast: expect.objectContaining({
              notification: "a startled beast defends its home",
              combat: expect.objectContaining({
                enemy: "beast",
              }),
            }),
            "wanderer-body": expect.objectContaining({
              text: [
                "the body of a wanderer lies in a small cavern.",
                "rot's been to work on it, and some of the pieces are missing.",
                "can't tell what left it here.",
              ],
              loot: {
                "iron sword": { min: 1, max: 1, chance: 1 },
                "cured meat": { min: 1, max: 5, chance: 0.8 },
                torch: { min: 1, max: 3, chance: 0.5 },
                medicine: { min: 1, max: 2, chance: 0.1 },
              },
            }),
            "large-beast": expect.objectContaining({
              notification: "a large beast charges out of the dark",
              combat: expect.objectContaining({
                enemy: "beast",
                health: 10,
              }),
            }),
            nest: expect.objectContaining({
              text: [
                "the nest of a large animal lies at the back of the cave.",
              ],
              loot: {
                meat: { min: 5, max: 10, chance: 1 },
                fur: { min: 5, max: 10, chance: 1 },
                scales: { min: 5, max: 10, chance: 1 },
                teeth: { min: 5, max: 10, chance: 1 },
                cloth: { min: 5, max: 10, chance: 0.5 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.cave-old-case",
          title: "A Damp Cave",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "enter",
                  cost: { torch: 1 },
                }),
              ]),
            }),
            narrow: expect.objectContaining({
              text: [
                "the cave narrows a few feet in.",
                "the walls are moist and moss-covered",
              ],
            }),
            beast: expect.objectContaining({
              notification: "a startled beast defends its home",
              combat: expect.objectContaining({
                enemy: "beast",
                loot: {
                  fur: { min: 1, max: 3, chance: 1 },
                  teeth: { min: 1, max: 2, chance: 0.8 },
                },
              }),
            }),
            lizard: expect.objectContaining({
              notification: "a giant lizard shambles forward",
              combat: expect.objectContaining({
                enemy: "lizard",
                health: 10,
              }),
            }),
            "old-case": expect.objectContaining({
              text: [
                "an old case is wedged behind a rock, covered in a thick layer of dust.",
              ],
              loot: {
                "steel sword": { min: 1, max: 1, chance: 1 },
                bolas: { min: 1, max: 3, chance: 0.5 },
                medicine: { min: 1, max: 3, chance: 0.3 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.house",
          title: "An Old House",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              notification:
                "the remains of an old house stand as a monument to simpler times",
            }),
            medicine: expect.objectContaining({
              text: [
                "the house has been ransacked.",
                "but there is a cache of medicine under the floorboards.",
              ],
              loot: {
                medicine: { min: 2, max: 5, chance: 1 },
              },
            }),
            supplies: expect.objectContaining({
              text: [
                "the house is abandoned, but not yet picked over.",
                "still a few drops of water in the old well.",
              ],
              loot: {
                "cured meat": { min: 1, max: 10, chance: 0.8 },
                leather: { min: 1, max: 10, chance: 0.2 },
                cloth: { min: 1, max: 10, chance: 0.5 },
              },
            }),
            occupied: expect.objectContaining({
              notification:
                "a man charges down the hall, a rusty blade in his hand",
              combat: expect.objectContaining({
                enemy: "squatter",
              }),
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.borehole",
          title: "A Huge Borehole",
          scenes: {
            start: expect.objectContaining({
              key: "start",
              text: [
                "a huge hole is cut deep into the earth, evidence of the past harvest.",
                "they took what they came for, and left.",
                "castoff from the mammoth drills can still be found by the edges of the precipice.",
              ],
              loot: {
                "alien alloy": { min: 1, max: 3, chance: 1 },
              },
              buttons: [
                {
                  key: "leave",
                  text: "leave",
                  nextScene: "end",
                },
              ],
            }),
          },
        }),
        expect.objectContaining({
          key: "setpiece.battlefield",
          title: "A Forgotten Battlefield",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              text: [
                "a battle was fought here, long ago.",
                "battered technology from both sides lays dormant on the blasted landscape.",
              ],
              loot: {
                rifle: { min: 1, max: 3, chance: 0.5 },
                bullets: { min: 5, max: 20, chance: 0.8 },
                "laser rifle": { min: 1, max: 3, chance: 0.3 },
                "energy cell": { min: 5, max: 10, chance: 0.5 },
                grenade: { min: 1, max: 5, chance: 0.5 },
                "alien alloy": { min: 1, max: 1, chance: 0.3 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.ship",
          title: "A Crashed Ship",
          scenes: {
            start: expect.objectContaining({
              key: "start",
              text: [
                "the familiar curves of a wanderer vessel rise up out of the dust and ash. ",
                "lucky that the natives can't work the mechanisms.",
                "with a little effort, it might fly again.",
              ],
              buttons: [
                {
                  key: "leavel",
                  text: "salvage",
                  nextScene: "end",
                },
              ],
            }),
          },
        }),
        expect.objectContaining({
          key: "setpiece.cache",
          title: "A Destroyed Village",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              text: [
                "a destroyed village lies in the dust.",
                "charred bodies litter the ground.",
              ],
              notification:
                "the metallic tang of wanderer afterburner hangs in the air.",
              buttons: [
                {
                  key: "enter",
                  text: "enter",
                  nextScene: { 1: "underground" },
                },
                { key: "leave", text: "leave", nextScene: "end" },
              ],
            }),
            underground: expect.objectContaining({
              text: [
                "a shack stands at the center of the village.",
                "there are still supplies inside.",
              ],
              buttons: [
                {
                  key: "take",
                  text: "take",
                  nextScene: { 1: "exit" },
                },
              ],
            }),
            exit: expect.objectContaining({
              text: [
                "all the work of a previous generation is here.",
                "ripe for the picking.",
              ],
              buttons: [{ key: "leave", text: "leave", nextScene: "end" }],
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.town-thug",
          title: "A Deserted Town",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              notification: "the town lies abandoned, its citizens long dead",
            }),
            ambush: expect.objectContaining({
              notification: "ambushed on the street.",
              combat: expect.objectContaining({
                enemy: "thug",
              }),
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.town-schoolhouse",
          title: "A Deserted Town",
          scenes: expect.objectContaining({
            schoolhouse: expect.objectContaining({
              text: [
                "where the windows of the schoolhouse aren't shattered, they're blackened with soot.",
                "the double doors creak endlessly in the wind.",
              ],
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "enter",
                  cost: { torch: 1 },
                }),
              ]),
            }),
            locker: expect.objectContaining({
              text: [
                "a small cache of supplies is tucked inside a rusting locker.",
              ],
              loot: {
                "cured meat": { min: 1, max: 5, chance: 1 },
                torch: { min: 1, max: 3, chance: 0.8 },
                bullets: { min: 1, max: 5, chance: 0.3 },
                medicine: { min: 1, max: 3, chance: 0.05 },
              },
            }),
            thug: expect.objectContaining({
              notification: "a thug moves out of the shadows.",
              combat: expect.objectContaining({
                enemy: "thug",
              }),
            }),
            scavenger: expect.objectContaining({
              notification:
                "a panicked scavenger bursts through the door, screaming.",
              combat: expect.objectContaining({
                enemy: "scavenger",
              }),
            }),
            camp: expect.objectContaining({
              text: [
                "scavenger had a small camp in the school.",
                "collected scraps spread across the floor like they fell from heaven.",
              ],
              loot: {
                "steel sword": { min: 1, max: 1, chance: 1 },
                steel: { min: 5, max: 10, chance: 1 },
                "cured meat": { min: 5, max: 10, chance: 1 },
                bolas: { min: 1, max: 5, chance: 0.5 },
                medicine: { min: 1, max: 2, chance: 0.3 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.town-park-vigilante",
          title: "A Deserted Town",
          scenes: expect.objectContaining({
            ambush: expect.objectContaining({
              notification: "ambushed on the street.",
              combat: expect.objectContaining({
                enemy: "thug",
              }),
            }),
            park: expect.objectContaining({
              notification: "a beast stands alone in an overgrown park.",
              combat: expect.objectContaining({
                enemy: "beast",
                health: 25,
              }),
            }),
            commotion: expect.objectContaining({
              text: [
                "something's causing a commotion a ways down the road.",
                "a fight, maybe.",
              ],
            }),
            vigilante: expect.objectContaining({
              notification:
                "a man stands over a dead wanderer. notices he's not alone.",
              combat: expect.objectContaining({
                enemy: "vigilante",
              }),
            }),
            "wanderer-rifle": expect.objectContaining({
              text: [
                "beneath the wanderer's rags, clutched in one of its many hands, a glint of steel.",
                "worth killing for, it seems.",
              ],
              loot: {
                rifle: { min: 1, max: 1, chance: 1 },
                bullets: { min: 1, max: 5, chance: 1 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.town-caravan-vigilante",
          title: "A Deserted Town",
          scenes: expect.objectContaining({
            ambush: expect.objectContaining({
              notification: "ambushed on the street.",
              combat: expect.objectContaining({
                enemy: "thug",
              }),
            }),
            caravan: expect.objectContaining({
              text: [
                "an overturned caravan is spread across the pockmarked street.",
                "it's been picked over by scavengers, but there's still some things worth taking.",
              ],
              loot: {
                "cured meat": { min: 1, max: 5, chance: 0.8 },
                torch: { min: 1, max: 3, chance: 0.5 },
                bullets: { min: 1, max: 5, chance: 0.3 },
                medicine: { min: 1, max: 3, chance: 0.1 },
              },
            }),
            "food-basket": expect.objectContaining({
              text: [
                "a small basket of food is hidden under a park bench, with a note attached.",
                "can't read the words.",
              ],
              loot: {
                "cured meat": { min: 1, max: 5, chance: 1 },
              },
            }),
            vigilante: expect.objectContaining({
              notification:
                "a man stands over a dead wanderer. notices he's not alone.",
              combat: expect.objectContaining({
                enemy: "vigilante",
              }),
            }),
            trinkets: expect.objectContaining({
              text: [
                "eye for an eye seems fair.",
                "always worked before, at least.",
                "picking the bones finds some useful trinkets.",
              ],
              loot: {
                "cured meat": { min: 5, max: 10, chance: 1 },
                iron: { min: 5, max: 10, chance: 1 },
                torch: { min: 1, max: 5, chance: 1 },
                bolas: { min: 1, max: 5, chance: 0.5 },
                medicine: { min: 1, max: 2, chance: 0.1 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.town-clinic",
          title: "A Deserted Town",
          scenes: expect.objectContaining({
            clinic: expect.objectContaining({
              text: [
                "a squat building up ahead.",
                "a green cross barely visible behind grimy windows.",
              ],
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "enter",
                  cost: { torch: 1 },
                }),
              ]),
            }),
            medicine: expect.objectContaining({
              text: ["some medicine abandoned in the drawers."],
              loot: {
                medicine: { min: 2, max: 5, chance: 1 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.town-clinic-madman",
          title: "A Deserted Town",
          scenes: expect.objectContaining({
            clinic: expect.objectContaining({
              text: [
                "a squat building up ahead.",
                "a green cross barely visible behind grimy windows.",
              ],
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "enter",
                  cost: { torch: 1 },
                }),
              ]),
            }),
            madman: expect.objectContaining({
              notification: "a madman attacks, screeching.",
              combat: expect.objectContaining({
                enemy: "madman",
                hit: 0.3,
              }),
            }),
            ransacked: expect.objectContaining({
              text: [
                "the clinic has been ransacked.",
                "only dust and stains remain.",
              ],
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-old-tower",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            "empty-streets": expect.objectContaining({
              text: [
                "the streets are empty.",
                "the air is filled with dust, driven relentlessly by the hard winds.",
              ],
            }),
            tower: expect.objectContaining({
              text: [
                "the old tower seems mostly intact.",
                "the shell of a burned out car blocks the entrance.",
                "most of the windows at ground level are busted anyway.",
              ],
            }),
            thug: expect.objectContaining({
              notification: "a thug is waiting on the other side of the wall.",
              combat: expect.objectContaining({
                enemy: "thug",
                health: 30,
              }),
            }),
            bird: expect.objectContaining({
              notification: "a large bird nests at the top of the stairs.",
              combat: expect.objectContaining({
                enemy: "bird",
                health: 45,
              }),
            }),
            nest: expect.objectContaining({
              text: [
                "bird must have liked shiney things.",
                "some good stuff woven into its nest.",
              ],
              loot: {
                bullets: { min: 5, max: 10, chance: 0.8 },
                bolas: { min: 1, max: 5, chance: 0.5 },
                "alien alloy": { min: 1, max: 1, chance: 0.5 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-old-tower-scavenged",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            tower: expect.objectContaining({
              text: [
                "the old tower seems mostly intact.",
                "the shell of a burned out car blocks the entrance.",
                "most of the windows at ground level are busted anyway.",
              ],
            }),
            thug: expect.objectContaining({
              notification: "a thug is waiting on the other side of the wall.",
              combat: expect.objectContaining({
                enemy: "thug",
                health: 30,
              }),
            }),
            bird: expect.objectContaining({
              notification: "a large bird nests at the top of the stairs.",
              combat: expect.objectContaining({
                enemy: "bird",
                health: 45,
              }),
            }),
            scavenged: expect.objectContaining({
              text: [
                "not much here.",
                "scavengers must have gotten to this place already.",
              ],
              loot: {
                torch: { min: 1, max: 5, chance: 0.8 },
                "cured meat": { min: 1, max: 5, chance: 0.5 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-old-tower-thug-rubble",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            tower: expect.objectContaining({
              text: [
                "the old tower seems mostly intact.",
                "the shell of a burned out car blocks the entrance.",
                "most of the windows at ground level are busted anyway.",
              ],
            }),
            thug: expect.objectContaining({
              notification: "a thug is waiting on the other side of the wall.",
              combat: expect.objectContaining({
                enemy: "thug",
              }),
            }),
            rubble: expect.objectContaining({
              text: [
                "the debris is denser here.",
                "maybe some useful stuff in the rubble.",
              ],
              loot: {
                bullets: { min: 1, max: 5, chance: 0.5 },
                steel: { min: 1, max: 10, chance: 0.8 },
                "alien alloy": { min: 1, max: 1, chance: 0.01 },
                cloth: { min: 1, max: 10, chance: 1 },
              },
            }),
            scavenged: expect.objectContaining({
              text: [
                "not much here.",
                "scavengers must have gotten to this place already.",
              ],
              loot: {
                torch: { min: 1, max: 5, chance: 0.8 },
                "cured meat": { min: 1, max: 5, chance: 0.5 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-old-tower-rubble",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            "empty-streets": expect.objectContaining({
              text: [
                "the streets are empty.",
                "the air is filled with dust, driven relentlessly by the hard winds.",
              ],
            }),
            tower: expect.objectContaining({
              text: [
                "the old tower seems mostly intact.",
                "the shell of a burned out car blocks the entrance.",
                "most of the windows at ground level are busted anyway.",
              ],
            }),
            beast: expect.objectContaining({
              notification: "a snarling beast jumps out from behind a car.",
              combat: expect.objectContaining({
                enemy: "beast",
                health: 30,
              }),
            }),
            rubble: expect.objectContaining({
              text: [
                "the debris is denser here.",
                "maybe some useful stuff in the rubble.",
              ],
              loot: {
                bullets: { min: 1, max: 5, chance: 0.5 },
                steel: { min: 1, max: 10, chance: 0.8 },
                "alien alloy": { min: 1, max: 1, chance: 0.01 },
                cloth: { min: 1, max: 10, chance: 1 },
              },
            }),
            scavenged: expect.objectContaining({
              text: [
                "not much here.",
                "scavengers must have gotten to this place already.",
              ],
              loot: {
                torch: { min: 1, max: 5, chance: 0.8 },
                "cured meat": { min: 1, max: 5, chance: 0.5 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-sniper",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              notification:
                "the towers of a decaying city dominate the skyline",
            }),
            sniper: expect.objectContaining({
              notification: "the shot echoes in the empty street.",
              combat: expect.objectContaining({
                enemy: "sniper",
                ranged: true,
              }),
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-hospital",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            hospital: expect.objectContaining({
              text: ["the shell of an abandoned hospital looms ahead."],
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "enter",
                  cost: { torch: 1 },
                }),
              ]),
            }),
            "operating-theatre": expect.objectContaining({
              text: [
                "someone has locked and barricaded the door to this operating theatre.",
              ],
            }),
            stockpile: expect.objectContaining({
              text: ["someone had been stockpiling loot here."],
              loot: {
                "energy cell": { min: 1, max: 3, chance: 0.2 },
                medicine: { min: 3, max: 10, chance: 0.5 },
                bullets: { min: 2, max: 8, chance: 1 },
                torch: { min: 1, max: 3, chance: 0.5 },
                grenade: { min: 1, max: 1, chance: 0.5 },
                "alien alloy": { min: 1, max: 2, chance: 0.8 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-soldier-patrol",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            checkpoint: expect.objectContaining({
              text: [
                "orange traffic cones are set across the street, faded and cracked.",
                "lights flash through the alleys between buildings.",
              ],
            }),
            soldier: expect.objectContaining({
              notification:
                "the soldier steps out from between the buildings, rifle raised.",
              combat: expect.objectContaining({
                enemy: "soldier",
                ranged: true,
              }),
            }),
            voices: expect.objectContaining({
              text: [
                "more voices can be heard ahead.",
                "they must be here for a reason.",
              ],
            }),
            "second-soldier": expect.objectContaining({
              notification: "a second soldier opens fire.",
              combat: expect.objectContaining({
                enemy: "soldier",
                ranged: true,
              }),
            }),
            supplies: expect.objectContaining({
              text: [
                "searching the bodies yields a few supplies.",
                "more soldiers will be on their way.",
                "time to move on.",
              ],
              loot: {
                rifle: { min: 1, max: 1, chance: 1 },
                bullets: { min: 1, max: 10, chance: 1 },
                "cured meat": { min: 1, max: 5, chance: 0.8 },
                medicine: { min: 1, max: 4, chance: 0.1 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-commando-settlement",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            soldier: expect.objectContaining({
              notification:
                "the soldier steps out from between the buildings, rifle raised.",
              combat: expect.objectContaining({
                enemy: "soldier",
                ranged: true,
              }),
            }),
            gunfire: expect.objectContaining({
              text: [
                "the sound of gunfire carries on the wind.",
                "the street ahead glows with firelight.",
              ],
            }),
            commando: expect.objectContaining({
              notification: "a masked soldier rounds the corner, gun drawn",
              combat: expect.objectContaining({
                enemy: "commando",
                ranged: true,
                health: 55,
              }),
            }),
            "burning-settlement": expect.objectContaining({
              text: [
                "the small settlement has clearly been burning a while.",
                "the bodies of the wanderers that lived here are still visible in the flames.",
                "still time to rescue a few supplies.",
              ],
              loot: {
                "laser rifle": { min: 1, max: 1, chance: 0.5 },
                "energy cell": { min: 1, max: 5, chance: 0.5 },
                "cured meat": { min: 1, max: 10, chance: 1 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-commando-supplies",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            soldier: expect.objectContaining({
              notification:
                "the soldier steps out from between the buildings, rifle raised.",
              combat: expect.objectContaining({
                enemy: "soldier",
                ranged: true,
              }),
            }),
            gunfire: expect.objectContaining({
              text: [
                "the sound of gunfire carries on the wind.",
                "the street ahead glows with firelight.",
              ],
            }),
            commando: expect.objectContaining({
              notification: "a masked soldier rounds the corner, gun drawn",
              combat: expect.objectContaining({
                enemy: "commando",
                ranged: true,
                health: 55,
              }),
            }),
            supplies: expect.objectContaining({
              text: [
                "searching the bodies yields a few supplies.",
                "more soldiers will be on their way.",
                "time to move on.",
              ],
              loot: {
                rifle: { min: 1, max: 1, chance: 1 },
                bullets: { min: 1, max: 10, chance: 1 },
                "cured meat": { min: 1, max: 5, chance: 0.8 },
                medicine: { min: 1, max: 4, chance: 0.1 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-subway",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            "empty-streets": expect.objectContaining({
              text: [
                "the streets are empty.",
                "the air is filled with dust, driven relentlessly by the hard winds.",
              ],
            }),
            lizard: expect.objectContaining({
              notification:
                "a huge lizard scrambles up out of the darkness of an old metro station.",
              combat: expect.objectContaining({
                enemy: "lizard",
              }),
            }),
            "subway-platform": expect.objectContaining({
              text: [
                "street above the subway platform is blown away.",
                "lets some light down into the dusty haze.",
                "a sound comes from the tunnel, just ahead.",
              ],
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "enter",
                  cost: { torch: 1 },
                }),
              ]),
            }),
            rats: expect.objectContaining({
              notification: "a swarm of rats rushes up the tunnel.",
              combat: expect.objectContaining({
                enemy: "rats",
                attackDelay: 0.25,
              }),
            }),
            "battle-platform": expect.objectContaining({
              text: [
                "the tunnel opens up at another platform.",
                "the walls are scorched from an old battle.",
                "bodies and supplies from both sides litter the ground.",
              ],
              loot: {
                rifle: { min: 1, max: 1, chance: 0.8 },
                bullets: { min: 1, max: 5, chance: 0.8 },
                "laser rifle": { min: 1, max: 1, chance: 0.3 },
                "energy cell": { min: 1, max: 5, chance: 0.3 },
                "alien alloy": { min: 1, max: 1, chance: 0.3 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-subway-beast-rubble",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            lizard: expect.objectContaining({
              notification:
                "a huge lizard scrambles up out of the darkness of an old metro station.",
              combat: expect.objectContaining({
                enemy: "lizard",
                health: 20,
              }),
            }),
            beast: expect.objectContaining({
              notification: "a snarling beast jumps out from behind a car.",
              combat: expect.objectContaining({
                enemy: "beast",
                health: 30,
              }),
            }),
            rubble: expect.objectContaining({
              text: [
                "the debris is denser here.",
                "maybe some useful stuff in the rubble.",
              ],
              loot: {
                bullets: { min: 1, max: 5, chance: 0.5 },
                steel: { min: 1, max: 10, chance: 0.8 },
                "alien alloy": { min: 1, max: 1, chance: 0.01 },
                cloth: { min: 1, max: 10, chance: 1 },
              },
            }),
            scavenged: expect.objectContaining({
              text: [
                "not much here.",
                "scavengers must have gotten to this place already.",
              ],
              loot: {
                torch: { min: 1, max: 5, chance: 0.8 },
                "cured meat": { min: 1, max: 5, chance: 0.5 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-subway-scavenged",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            lizard: expect.objectContaining({
              notification:
                "a huge lizard scrambles up out of the darkness of an old metro station.",
              combat: expect.objectContaining({
                enemy: "lizard",
                health: 20,
              }),
            }),
            "subway-platform": expect.objectContaining({
              text: [
                "street above the subway platform is blown away.",
                "lets some light down into the dusty haze.",
                "a sound comes from the tunnel, just ahead.",
              ],
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "enter",
                  cost: { torch: 1 },
                }),
              ]),
            }),
            rats: expect.objectContaining({
              notification: "a swarm of rats rushes up the tunnel.",
              combat: expect.objectContaining({
                enemy: "rats",
                attackDelay: 0.25,
              }),
            }),
            scavenged: expect.objectContaining({
              text: [
                "not much here.",
                "scavengers must have gotten to this place already.",
              ],
              loot: {
                torch: { min: 1, max: 5, chance: 0.8 },
                "cured meat": { min: 1, max: 5, chance: 0.5 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-military-camp",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            checkpoint: expect.objectContaining({
              text: [
                "orange traffic cones are set across the street, faded and cracked.",
                "lights flash through the alleys between buildings.",
              ],
            }),
            sniper: expect.objectContaining({
              notification: "the shot echoes in the empty street.",
              combat: expect.objectContaining({
                enemy: "sniper",
                ranged: true,
              }),
            }),
            camp: expect.objectContaining({
              text: [
                "looks like a camp of sorts up ahead.",
                "rusted chainlink is pulled across an alleyway.",
                "fires burn in the courtyard beyond.",
              ],
            }),
            veteran: expect.objectContaining({
              notification: "a large man attacks, waving a bayonet.",
              combat: expect.objectContaining({
                enemy: "veteran",
                damage: 6,
              }),
            }),
            outpost: expect.objectContaining({
              text: [
                "the small military outpost is well supplied.",
                "arms and munitions, relics from the war, are neatly arranged on the store-room floor.",
                "just as deadly now as they were then.",
              ],
              loot: {
                rifle: { min: 1, max: 1, chance: 1 },
                bullets: { min: 1, max: 10, chance: 1 },
                grenade: { min: 1, max: 5, chance: 0.8 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-military-camp-supplies",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            sniper: expect.objectContaining({
              notification: "the shot echoes in the empty street.",
              combat: expect.objectContaining({
                enemy: "sniper",
                ranged: true,
              }),
            }),
            camp: expect.objectContaining({
              text: [
                "looks like a camp of sorts up ahead.",
                "rusted chainlink is pulled across an alleyway.",
                "fires burn in the courtyard beyond.",
              ],
            }),
            veteran: expect.objectContaining({
              notification: "a large man attacks, waving a bayonet.",
              combat: expect.objectContaining({
                enemy: "veteran",
                damage: 6,
              }),
            }),
            supplies: expect.objectContaining({
              text: [
                "searching the bodies yields a few supplies.",
                "more soldiers will be on their way.",
                "time to move on.",
              ],
              loot: {
                rifle: { min: 1, max: 1, chance: 1 },
                bullets: { min: 1, max: 10, chance: 1 },
                "cured meat": { min: 1, max: 5, chance: 0.8 },
                medicine: { min: 1, max: 4, chance: 0.1 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-shanty-market",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            "shanty-town": expect.objectContaining({
              text: [
                "a large shanty town sprawls across the streets.",
                "faces, darkened by soot and blood, stare out from crooked huts.",
              ],
            }),
            "frail-man": expect.objectContaining({
              notification: "a frail man stands defiantly, blocking the path.",
              combat: expect.objectContaining({
                enemy: "frail man",
              }),
            }),
            shop: expect.objectContaining({
              text: [
                "an improvised shop is set up on the sidewalk.",
                "the owner stands by, stoic.",
              ],
              loot: {
                "steel sword": { min: 1, max: 1, chance: 0.8 },
                rifle: { min: 1, max: 1, chance: 0.5 },
                bullets: { min: 1, max: 8, chance: 0.25 },
                "alien alloy": { min: 1, max: 1, chance: 0.01 },
                medicine: { min: 1, max: 4, chance: 0.5 },
              },
            }),
            youth: expect.objectContaining({
              notification: "a youth lashes out with a tree branch.",
              combat: expect.objectContaining({
                enemy: "youth",
              }),
            }),
            "canvas-sack": expect.objectContaining({
              text: [
                "the young settler was carrying a canvas sack.",
                "it contains travelling gear, and a few trinkets.",
                "there's nothing else here.",
              ],
              loot: {
                "steel sword": { min: 1, max: 1, chance: 0.8 },
                bolas: { min: 1, max: 5, chance: 0.5 },
                "cured meat": { min: 1, max: 10, chance: 1 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-shanty-crowd",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            "frail-man": expect.objectContaining({
              notification: "a frail man stands defiantly, blocking the path.",
              combat: expect.objectContaining({
                enemy: "frail man",
              }),
            }),
            crowd: expect.objectContaining({
              text: [
                "more squatters are crowding around now.",
                "someone throws a stone.",
              ],
            }),
            squatters: expect.objectContaining({
              notification: "the crowd surges forward.",
              combat: expect.objectContaining({
                enemy: "squatters",
                attackDelay: 0.5,
              }),
            }),
            belongings: expect.objectContaining({
              text: [
                "the remaining settlers flee from the violence, their belongings forgotten.",
                "there's not much, but some useful things can still be found.",
              ],
              loot: {
                "steel sword": { min: 1, max: 1, chance: 0.8 },
                "energy cell": { min: 1, max: 5, chance: 0.5 },
                "cured meat": { min: 1, max: 10, chance: 1 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-shanty-crowd-sack",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            "frail-man": expect.objectContaining({
              notification: "a frail man stands defiantly, blocking the path.",
              combat: expect.objectContaining({
                enemy: "frail man",
              }),
            }),
            crowd: expect.objectContaining({
              text: [
                "more squatters are crowding around now.",
                "someone throws a stone.",
              ],
            }),
            squatters: expect.objectContaining({
              notification: "the crowd surges forward.",
              combat: expect.objectContaining({
                enemy: "squatters",
                attackDelay: 0.5,
              }),
            }),
            "canvas-sack": expect.objectContaining({
              text: [
                "the young settler was carrying a canvas sack.",
                "it contains travelling gear, and a few trinkets.",
                "there's nothing else here.",
              ],
              loot: {
                "steel sword": { min: 1, max: 1, chance: 0.8 },
                bolas: { min: 1, max: 5, chance: 0.5 },
                "cured meat": { min: 1, max: 10, chance: 1 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-drying-meat-youth",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            "broken-people": expect.objectContaining({
              text: [
                "nothing but downcast eyes.",
                "the people here were broken a long time ago.",
              ],
            }),
            "drying-meat": expect.objectContaining({
              text: [
                "strips of meat hang drying by the side of the street.",
                "the people back away, avoiding eye contact.",
              ],
              loot: {
                "cured meat": { min: 5, max: 10, chance: 1 },
              },
            }),
            youth: expect.objectContaining({
              notification: "a youth lashes out with a tree branch.",
              combat: expect.objectContaining({
                enemy: "youth",
                health: 45,
              }),
            }),
            "canvas-sack": expect.objectContaining({
              text: [
                "the young settler was carrying a canvas sack.",
                "it contains travelling gear, and a few trinkets.",
                "there's nothing else here.",
              ],
              loot: {
                "steel sword": { min: 1, max: 1, chance: 0.8 },
                bolas: { min: 1, max: 5, chance: 0.5 },
                "cured meat": { min: 1, max: 10, chance: 1 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-shanty-crowd-youth",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            crowd: expect.objectContaining({
              text: [
                "more squatters are crowding around now.",
                "someone throws a stone.",
              ],
            }),
            youth: expect.objectContaining({
              notification: "a youth lashes out with a tree branch.",
              combat: expect.objectContaining({
                enemy: "youth",
                health: 45,
              }),
            }),
            "canvas-sack": expect.objectContaining({
              text: [
                "the young settler was carrying a canvas sack.",
                "it contains travelling gear, and a few trinkets.",
                "there's nothing else here.",
              ],
              loot: {
                "steel sword": { min: 1, max: 1, chance: 0.8 },
                bolas: { min: 1, max: 5, chance: 0.5 },
                "cured meat": { min: 1, max: 10, chance: 1 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-drying-hut",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            "broken-people": expect.objectContaining({
              text: [
                "nothing but downcast eyes.",
                "the people here were broken a long time ago.",
              ],
            }),
            "drying-meat": expect.objectContaining({
              text: [
                "strips of meat hang drying by the side of the street.",
                "the people back away, avoiding eye contact.",
              ],
              loot: {
                "cured meat": { min: 5, max: 10, chance: 1 },
              },
            }),
            squatter: expect.objectContaining({
              notification:
                "a squatter stands firmly in the doorway of a small hut.",
              combat: expect.objectContaining({
                enemy: "squatter",
                health: 20,
              }),
            }),
            hut: expect.objectContaining({
              text: [
                "inside the hut, a child cries.",
                "a few belongings rest against the walls.",
                "there's nothing else here.",
              ],
              loot: {
                rifle: { min: 1, max: 1, chance: 0.8 },
                bullets: { min: 1, max: 5, chance: 0.8 },
                bolas: { min: 1, max: 5, chance: 0.5 },
                "alien alloy": { min: 1, max: 1, chance: 0.2 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-drying-hut-sack",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            "broken-people": expect.objectContaining({
              text: [
                "nothing but downcast eyes.",
                "the people here were broken a long time ago.",
              ],
            }),
            "drying-meat": expect.objectContaining({
              text: [
                "strips of meat hang drying by the side of the street.",
                "the people back away, avoiding eye contact.",
              ],
              loot: {
                "cured meat": { min: 5, max: 10, chance: 1 },
              },
            }),
            squatter: expect.objectContaining({
              notification:
                "a squatter stands firmly in the doorway of a small hut.",
              combat: expect.objectContaining({
                enemy: "squatter",
                health: 20,
              }),
            }),
            "canvas-sack": expect.objectContaining({
              text: [
                "the young settler was carrying a canvas sack.",
                "it contains travelling gear, and a few trinkets.",
                "there's nothing else here.",
              ],
              loot: {
                "steel sword": { min: 1, max: 1, chance: 0.8 },
                bolas: { min: 1, max: 5, chance: 0.5 },
                "cured meat": { min: 1, max: 10, chance: 1 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-hospital-medicine",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            "old-man": expect.objectContaining({
              notification:
                "an old man bursts through a door, wielding a scalpel.",
              combat: expect.objectContaining({
                enemy: "old man",
                hit: 0.5,
              }),
            }),
            "dried-meat": expect.objectContaining({
              text: ["strips of meat are hung up to dry in this ward."],
              loot: {
                "cured meat": { min: 3, max: 10, chance: 1 },
              },
            }),
            "medicine-cabinet": expect.objectContaining({
              text: [
                "a pristine medicine cabinet at the end of a hallway.",
                "the rest of the hospital is empty.",
              ],
              loot: {
                "energy cell": { min: 1, max: 1, chance: 0.2 },
                medicine: { min: 3, max: 10, chance: 1 },
                teeth: { min: 1, max: 2, chance: 0.2 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-hospital-cache",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            "old-man": expect.objectContaining({
              notification:
                "an old man bursts through a door, wielding a scalpel.",
              combat: expect.objectContaining({
                enemy: "old man",
                hit: 0.5,
              }),
            }),
            cache: expect.objectContaining({
              text: ["the old man had a small cache of interesting items."],
              loot: {
                "alien alloy": { min: 1, max: 1, chance: 0.8 },
                medicine: { min: 1, max: 4, chance: 1 },
                "cured meat": { min: 3, max: 7, chance: 1 },
                bolas: { min: 1, max: 3, chance: 0.5 },
                fur: { min: 1, max: 5, chance: 0.8 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-hospital-old-man-theatres",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            "old-man": expect.objectContaining({
              notification:
                "an old man bursts through a door, wielding a scalpel.",
              combat: expect.objectContaining({
                enemy: "old man",
                hit: 0.5,
              }),
            }),
            "dried-meat": expect.objectContaining({
              text: ["strips of meat are hung up to dry in this ward."],
              loot: {
                "cured meat": { min: 3, max: 10, chance: 1 },
              },
            }),
            "operating-theatres": expect.objectContaining({
              text: [
                "the stench of rot and death fills the operating theatres.",
                "a few items are scattered on the ground.",
                "there is nothing else here.",
              ],
              loot: {
                "energy cell": { min: 1, max: 1, chance: 0.3 },
                medicine: { min: 1, max: 5, chance: 0.3 },
                teeth: { min: 3, max: 8, chance: 1 },
                scales: { min: 4, max: 7, chance: 0.9 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-hospital-old-man-squatters",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            "old-man": expect.objectContaining({
              notification:
                "an old man bursts through a door, wielding a scalpel.",
              combat: expect.objectContaining({
                enemy: "old man",
                hit: 0.5,
              }),
            }),
            squatters: expect.objectContaining({
              notification:
                "a tribe of elderly squatters is camped out in this ward.",
              combat: expect.objectContaining({
                enemy: "squatters",
                attackDelay: 0.5,
                health: 40,
              }),
            }),
            "operating-theatres": expect.objectContaining({
              text: [
                "the stench of rot and death fills the operating theatres.",
                "a few items are scattered on the ground.",
                "there is nothing else here.",
              ],
              loot: {
                "energy cell": { min: 1, max: 1, chance: 0.3 },
                medicine: { min: 1, max: 5, chance: 0.3 },
                teeth: { min: 3, max: 8, chance: 1 },
                scales: { min: 4, max: 7, chance: 0.9 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-hospital-ward",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            hospital: expect.objectContaining({
              text: ["the shell of an abandoned hospital looms ahead."],
              buttons: expect.arrayContaining([
                expect.objectContaining({
                  key: "enter",
                  cost: { torch: 1 },
                }),
              ]),
            }),
            corridors: expect.objectContaining({
              text: [
                "empty corridors.",
                "the place has been swept clean by scavengers.",
              ],
            }),
            lizards: expect.objectContaining({
              notification: "a pack of lizards rounds the corner.",
              combat: expect.objectContaining({
                enemy: "lizards",
                attackDelay: 0.7,
              }),
            }),
            "operating-theatres": expect.objectContaining({
              text: [
                "the stench of rot and death fills the operating theatres.",
                "a few items are scattered on the ground.",
                "there is nothing else here.",
              ],
              loot: {
                "energy cell": { min: 1, max: 1, chance: 0.3 },
                medicine: { min: 1, max: 5, chance: 0.3 },
                teeth: { min: 3, max: 8, chance: 1 },
                scales: { min: 4, max: 7, chance: 0.9 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-hospital-squatters",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            corridors: expect.objectContaining({
              text: [
                "empty corridors.",
                "the place has been swept clean by scavengers.",
              ],
            }),
            squatters: expect.objectContaining({
              notification:
                "a tribe of elderly squatters is camped out in this ward.",
              combat: expect.objectContaining({
                enemy: "squatters",
                attackDelay: 0.5,
                health: 40,
              }),
            }),
            "operating-theatres": expect.objectContaining({
              text: [
                "the stench of rot and death fills the operating theatres.",
                "a few items are scattered on the ground.",
                "there is nothing else here.",
              ],
              loot: {
                "energy cell": { min: 1, max: 1, chance: 0.3 },
                medicine: { min: 1, max: 5, chance: 0.3 },
                teeth: { min: 3, max: 8, chance: 1 },
                scales: { min: 4, max: 7, chance: 0.9 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-hospital-deformed",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            "operating-theatre": expect.objectContaining({
              text: [
                "someone has locked and barricaded the door to this operating theatre.",
              ],
            }),
            deformed: expect.objectContaining({
              notification:
                "behind the door, a deformed figure awakes and attacks.",
              combat: expect.objectContaining({
                enemy: "deformed",
                hit: 0.6,
              }),
            }),
            equipment: expect.objectContaining({
              text: [
                "the warped man lies dead.",
                "the operating theatre has a lot of curious equipment.",
              ],
              loot: {
                "energy cell": { min: 2, max: 5, chance: 0.8 },
                medicine: { min: 3, max: 12, chance: 1 },
                cloth: { min: 1, max: 3, chance: 0.5 },
                steel: { min: 2, max: 3, chance: 0.3 },
                "alien alloy": { min: 1, max: 1, chance: 0.3 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.city-hospital-tentacles",
          title: "A Ruined City",
          scenes: expect.objectContaining({
            "operating-theatre": expect.objectContaining({
              text: [
                "someone has locked and barricaded the door to this operating theatre.",
              ],
            }),
            tentacles: expect.objectContaining({
              notification:
                "as soon as the door is open a little bit, hundreds of tentacles erupt.",
              combat: expect.objectContaining({
                enemy: "tentacles",
                attackDelay: 0.5,
              }),
            }),
            victims: expect.objectContaining({
              text: [
                "the tentacular horror is defeated.",
                "inside, the remains of its victims are everywhere.",
              ],
              loot: {
                "steel sword": { min: 1, max: 3, chance: 0.5 },
                rifle: { min: 1, max: 2, chance: 0.3 },
                teeth: { min: 2, max: 8, chance: 1 },
                cloth: { min: 3, max: 6, chance: 0.5 },
                "alien alloy": { min: 1, max: 1, chance: 0.1 },
              },
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.sulphurmine",
          title: "The Sulphur Mine",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              notification: "a military perimeter is set up around the mine.",
              buttons: [
                {
                  key: "attack",
                  text: "attack",
                  nextScene: { 1: "a1" },
                },
                { key: "leave", text: "leave", nextScene: "end" },
              ],
            }),
            a1: expect.objectContaining({
              combat: expect.objectContaining({
                enemy: "soldier",
              }),
              buttons: [
                {
                  key: "continue",
                  text: "continue",
                  nextScene: { 1: "a2" },
                },
                { key: "run", text: "run", nextScene: "end" },
              ],
            }),
            a2: expect.objectContaining({
              combat: expect.objectContaining({
                enemy: "soldier",
              }),
              buttons: [
                {
                  key: "continue",
                  text: "continue",
                  nextScene: { 1: "a3" },
                },
                { key: "run", text: "run", nextScene: "end" },
              ],
            }),
            a3: expect.objectContaining({
              combat: expect.objectContaining({
                enemy: "veteran",
              }),
              buttons: [
                {
                  key: "continue",
                  text: "continue",
                  nextScene: { 1: "cleared" },
                },
              ],
            }),
            cleared: expect.objectContaining({
              notification: "the sulphur mine is clear of dangers",
            }),
          }),
        }),
        expect.objectContaining({
          key: "setpiece.coalmine",
          title: "The Coal Mine",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              text: [
                "camp fires burn by the entrance to the mine.",
                "men mill about, weapons at the ready.",
              ],
              notification: "this old mine is not abandoned",
              buttons: [
                {
                  key: "attack",
                  text: "attack",
                  nextScene: { 1: "a1" },
                },
                { key: "leave", text: "leave", nextScene: "end" },
              ],
            }),
            a1: expect.objectContaining({
              combat: expect.objectContaining({
                enemy: "man",
              }),
              buttons: [
                {
                  key: "continue",
                  text: "continue",
                  nextScene: { 1: "a2" },
                },
                { key: "run", text: "run", nextScene: "end" },
              ],
            }),
            a2: expect.objectContaining({
              combat: expect.objectContaining({
                enemy: "man",
              }),
              buttons: [
                {
                  key: "continue",
                  text: "continue",
                  nextScene: { 1: "a3" },
                },
                { key: "run", text: "run", nextScene: "end" },
              ],
            }),
            a3: expect.objectContaining({
              combat: expect.objectContaining({
                enemy: "chief",
              }),
              buttons: [
                {
                  key: "continue",
                  text: "continue",
                  nextScene: { 1: "cleared" },
                },
              ],
            }),
            cleared: expect.objectContaining({
              notification: "the coal mine is clear of dangers",
            }),
          }),
        }),
      ]),
    );
    expect(setpieceEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "setpiece.ironmine",
          title: "The Iron Mine",
          scenes: expect.objectContaining({
            start: expect.objectContaining({
              notification: "the path leads to an abandoned mine",
              text: [
                "an old iron mine sits here, tools abandoned and left to rust.",
                "bleached bones are strewn about the entrance. many, deeply scored with jagged grooves.",
                "feral howls echo out of the darkness.",
              ],
              buttons: [
                {
                  key: "enter",
                  text: "go inside",
                  cost: { torch: 1 },
                  nextScene: { 1: "enter" },
                },
                { key: "leave", text: "leave", nextScene: "end" },
              ],
            }),
            enter: expect.objectContaining({
              combat: expect.objectContaining({
                enemy: "beastly matriarch",
              }),
            }),
            cleared: expect.objectContaining({
              notification: "the iron mine is clear of dangers",
            }),
          }),
        }),
      ]),
    );
  });
});
