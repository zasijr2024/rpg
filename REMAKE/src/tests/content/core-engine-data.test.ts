import { describe, expect, it } from "vitest";
import {
  canonicalManifest,
  ENGINE_GAME_OVER_INITIAL,
  ENGINE_HYPER_MODE_FACTOR,
  ENGINE_INCOME_TICK_MS,
  ENGINE_MAX_STORE,
  ENGINE_SAVE_DISPLAY,
  ENGINE_SITE_URL,
  ENGINE_SITE_URL_ENCODED,
  ENGINE_VERSION,
  originalCalculateScore,
  originalContentRegistry,
  originalEngineOptionDefaults,
  originalScoreBonuses,
  originalScoreFactors,
  originalStateCategories,
  originalStateMigrationSteps,
  STATE_MANAGER_MAX_STORE
} from "../../content/original";

describe("original core engine, state, and scoring data", () => {
  it("ports exact engine constants and defaults", () => {
    expect(ENGINE_SITE_URL).toBe("http://adarkroom.doublespeakgames.com");
    expect(ENGINE_SITE_URL_ENCODED).toBe(
      "http%3A%2F%2Fadarkroom.doublespeakgames.com"
    );
    expect(ENGINE_VERSION).toBe(1.3);
    expect(ENGINE_MAX_STORE).toBe(99999999999999);
    expect(STATE_MANAGER_MAX_STORE).toBe(99999999999999);
    expect(ENGINE_SAVE_DISPLAY).toBe(30000);
    expect(ENGINE_GAME_OVER_INITIAL).toBe(false);
    expect(ENGINE_INCOME_TICK_MS).toBe(1000);
    expect(ENGINE_HYPER_MODE_FACTOR).toBe(2);
    expect(originalEngineOptionDefaults).toEqual({
      state: null,
      debug: false,
      log: false,
      dropbox: false,
      doubleTime: false
    });
  });

  it("ports exact state categories", () => {
    expect(originalStateCategories).toEqual([
      "features",
      "stores",
      "character",
      "income",
      "timers",
      "game",
      "playStats",
      "previous",
      "outfit",
      "config",
      "wait",
      "cooldown"
    ]);
  });

  it("documents original save migration steps", () => {
    expect(originalStateMigrationSteps.map((step) => [step.from, step.to])).toEqual([
      [1.0, 1.1],
      [1.1, 1.2],
      [1.2, 1.3]
    ]);
    expect(originalStateMigrationSteps[2].operations).toContain(
      "move ship hull, thrusters, seenWarning, and seenShip under game.spaceShip"
    );
  });

  it("ports exact scoring factors and bonuses", () => {
    expect(originalScoreFactors).toEqual([
      1,
      1.5,
      1,
      2,
      2,
      3,
      3,
      2,
      2,
      2,
      2,
      1.5,
      1,
      1,
      10,
      30,
      50,
      100,
      150,
      150,
      3,
      3,
      5,
      4
    ]);
    expect(originalScoreFactors).toHaveLength(
      canonicalManifest.keys.prestigeStores.length
    );
    expect(originalScoreBonuses).toEqual([
      { key: "alien alloy", factor: 10 },
      { key: "fleet beacon", factor: 500 },
      { key: "ship hull", factor: 50 }
    ]);
  });

  it("preserves original score calculation", () => {
    const prestigeStores = Array.from(
      { length: canonicalManifest.keys.prestigeStores.length },
      (_, index) => index + 1
    );
    expect(
      originalCalculateScore(
        prestigeStores,
        { "alien alloy": 3, "fleet beacon": 1 },
        2
      )
    ).toBe(10285);
  });

  it("feeds the original content registry", () => {
    expect(originalContentRegistry.engineOptionDefaults).toBe(
      originalEngineOptionDefaults
    );
    expect(originalContentRegistry.stateCategories).toBe(originalStateCategories);
    expect(originalContentRegistry.stateMigrationSteps).toBe(
      originalStateMigrationSteps
    );
    expect(originalContentRegistry.scoreFactors).toBe(originalScoreFactors);
    expect(originalContentRegistry.scoreBonuses).toBe(originalScoreBonuses);
  });
});
