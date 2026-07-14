/* eslint-disable @typescript-eslint/no-unused-vars -- Contract slices retain shared local fixtures. */
import { describe, expect, it } from "vitest";
import {
  canonicalManifest,
  originalExecutionerCombatDefinitions,
  originalEventDefinitions,
  originalSetpieceCombatDefinitions,
} from "../../../content/original";

describe("Event data event pool coverage", () => {
  it("tracks current event coverage against the canonical manifest", () => {
    const canonicalTitles = canonicalManifest.events.titles.map(
      (entry) => entry.title,
    );
    const portedTitles = new Set(
      originalEventDefinitions.map((entry) => entry.title),
    );

    expect(canonicalManifest.events.titles).toHaveLength(48);
    expect(originalEventDefinitions).toHaveLength(119);
    expect(portedTitles.size).toBeGreaterThanOrEqual(12);
    expect(canonicalTitles).toEqual(expect.arrayContaining([...portedTitles]));
  });

  it("covers every original Phase 5 non-combat event pool definition", () => {
    const phase5Events = originalEventDefinitions.filter((entry) =>
      ["global", "room", "outside", "marketing"].includes(entry.pool),
    );
    const phase5Titles = new Set(phase5Events.map((entry) => entry.title));
    const phase5CanonicalTitles = canonicalManifest.events.titles
      .filter((entry) =>
        [
          "ORIGINAL/script/events/global.js",
          "ORIGINAL/script/events/room.js",
          "ORIGINAL/script/events/outside.js",
          "ORIGINAL/script/events/marketing.js",
        ].includes(entry.file),
      )
      .map((entry) => entry.title);

    expect(phase5Events).toHaveLength(18);
    expect(
      phase5Events.filter((entry) => entry.pool === "global"),
    ).toHaveLength(1);
    expect(phase5Events.filter((entry) => entry.pool === "room")).toHaveLength(
      10,
    );
    expect(
      phase5Events.filter((entry) => entry.pool === "outside"),
    ).toHaveLength(6);
    expect(
      phase5Events.filter((entry) => entry.pool === "marketing"),
    ).toHaveLength(1);
    expect([...phase5Titles]).toEqual(
      expect.arrayContaining(phase5CanonicalTitles),
    );
  });

  it("covers every original Phase 6 wilderness encounter definition", () => {
    const encounters = originalEventDefinitions.filter(
      (entry) => entry.pool === "encounter",
    );
    const encounterTitles = encounters.map((entry) => entry.title);
    const canonicalEncounterTitles = canonicalManifest.events.titles
      .filter((entry) => entry.file === "ORIGINAL/script/events/encounters.js")
      .map((entry) => entry.title);

    expect(encounters).toHaveLength(11);
    expect(encounterTitles).toEqual(canonicalEncounterTitles);
    expect(encounters.map((entry) => entry.scenes.start.combat?.enemy)).toEqual(
      [
        "snarling beast",
        "gaunt man",
        "strange bird",
        "two-headed creature",
        "shivering man",
        "man-eater",
        "scavenger",
        "lizard",
        "feral terror",
        "soldier",
        "sniper",
      ],
    );
    expect(
      encounters.map((entry) => entry.scenes.start.combat?.health),
    ).toEqual([5, 6, 4, 10, 20, 25, 30, 20, 45, 50, 30]);
    expect(
      encounters.filter((entry) => entry.scenes.start.combat?.ranged),
    ).toHaveLength(2);
  });
});
