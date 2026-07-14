import type { GameSession } from "../engine";
import { WORLD_RADIUS, WORLD_TILE } from "../content/original";

export const BROWSER_TEST_SEEDS = {
  "blueprint-commit": {
    blueprints: [
      "hypo blueprint",
      "kinetic armour blueprint",
      "disruptor blueprint",
      "plasma rifle blueprint",
      "stim blueprint",
      "glowstone blueprint",
    ],
    health: 10,
    water: 10,
  },
  "blueprint-death": {
    blueprints: [
      "hypo blueprint",
      "kinetic armour blueprint",
      "disruptor blueprint",
      "plasma rifle blueprint",
      "stim blueprint",
      "glowstone blueprint",
    ],
    health: 10,
    water: 0,
  },
  "stim-lifecycle": {
    combatEvent: "encounter.snarling-beast",
    stores: { "kinetic armour": 1 },
    outfit: { stim: 1, "bone spear": 1 },
    health: 30,
  },
  "rng-map": {
    generateWorldMap: true,
  },
  "domain-ui-subscriptions": {
    worldSubscriptionScenario: true,
    health: 10,
    water: 10,
  },
  "world-accessibility": {
    worldAccessibilityScenario: true,
    health: 10,
    water: 10,
  },
  "ship-slice": {
    shipSliceScenario: true,
  },
  "space-slice": {
    spaceSliceScenario: true,
  },
  "fabricator-slice": {
    fabricatorSliceScenario: true,
    health: 10,
    water: 10,
  },
} as const;

export type BrowserTestSeedName = keyof typeof BROWSER_TEST_SEEDS;

export const MANUAL_EVIDENCE_FIXTURES = ["space-realtime"] as const;
export type ManualEvidenceFixtureName =
  (typeof MANUAL_EVIDENCE_FIXTURES)[number];

export function applyManualEvidenceFixture(
  session: GameSession,
  fixtureName: string | null,
): fixtureName is ManualEvidenceFixtureName {
  if (fixtureName !== "space-realtime") return false;
  session.setStateForTest("config.events.randomDisabled", true);
  session.setStateForTest("features.location.spaceShip", true);
  session.setStateForTest("game.spaceShip.hull", 20);
  session.setStateForTest("game.spaceShip.thrusters", 1);
  session.setStateForTest("game.spaceShip.seenWarning", true);
  session.setStateForTest("game.spaceShip.awaitingLiftOffConfirmation", false);
  session.setLocation("ship");
  return true;
}

export function applyBrowserTestSeed(
  session: GameSession,
  seedName: string | null,
): boolean {
  if (!isBrowserTestSeedName(seedName)) return false;
  const seed = BROWSER_TEST_SEEDS[seedName];

  if ("generateWorldMap" in seed) {
    session.world.ensureMap();
    return true;
  }

  if ("worldSubscriptionScenario" in seed) {
    session.world.ensureMap();
    session.setStateForTest("features.location.path", true);
    session.setStateForTest("features.location.world", true);
    session.setStateForTest("game.world.active", true);
    session.setStateForTest("game.world.x", 30);
    session.setStateForTest("game.world.y", 30);
    session.setStateForTest("game.world.health", seed.health);
    session.setStateForTest("game.world.water", seed.water);
    session.setStateForTest('outfit["cured meat"]', 10);
    session.setStateForTest("game.expedition.baselineWorld", {});
    return true;
  }

  if ("worldAccessibilityScenario" in seed) {
    const size = WORLD_RADIUS * 2 + 1;
    const map = Array.from({ length: size }, () =>
      Array<string>(size).fill(WORLD_TILE.FIELD),
    );
    const mask = Array.from({ length: size }, () =>
      Array<boolean>(size).fill(false),
    );
    map[WORLD_RADIUS][WORLD_RADIUS] = WORLD_TILE.VILLAGE;
    map[WORLD_RADIUS + 1][WORLD_RADIUS] = WORLD_TILE.CAVE;
    map[WORLD_RADIUS + 2][WORLD_RADIUS] = WORLD_TILE.SHIP;
    mask[WORLD_RADIUS][WORLD_RADIUS] = true;
    mask[WORLD_RADIUS + 1][WORLD_RADIUS] = true;
    session.setStateForTest("game.world.map", map);
    session.setStateForTest("game.world.mask", mask);
    session.setStateForTest("features.location.path", true);
    session.setStateForTest("features.location.world", true);
    session.setStateForTest("game.world.active", true);
    session.setStateForTest("game.world.x", WORLD_RADIUS);
    session.setStateForTest("game.world.y", WORLD_RADIUS);
    session.setStateForTest("game.world.health", seed.health);
    session.setStateForTest("game.world.water", seed.water);
    session.setStateForTest('outfit["cured meat"]', 10);
    session.setStateForTest("game.expedition.baselineWorld", {});
    return true;
  }

  if ("shipSliceScenario" in seed) {
    const size = WORLD_RADIUS * 2 + 1;
    const map = Array.from({ length: size }, () =>
      Array<string>(size).fill(WORLD_TILE.FIELD),
    );
    map[WORLD_RADIUS][WORLD_RADIUS] = WORLD_TILE.VILLAGE;
    map[WORLD_RADIUS][WORLD_RADIUS - 1] = WORLD_TILE.BOREHOLE;
    map[WORLD_RADIUS + 1][WORLD_RADIUS] = WORLD_TILE.SHIP;
    session.setStateForTest("config.events.randomDisabled", true);
    session.setStateForTest("game.world.map", map);
    session.setStateForTest("stores.compass", 1);
    session.setStateForTest('stores["cured meat"]', 4);
    return true;
  }

  if ("spaceSliceScenario" in seed) {
    session.setStateForTest("features.location.spaceShip", true);
    session.setStateForTest("game.spaceShip.hull", 0);
    session.setStateForTest("game.spaceShip.thrusters", 1);
    session.setStateForTest('stores["alien alloy"]', 6);
    session.setRngSequenceForTest([0.9]);
    return true;
  }

  if ("fabricatorSliceScenario" in seed) {
    session.setStateForTest("features.location.path", true);
    session.setStateForTest("features.location.world", true);
    session.setStateForTest("game.world.active", true);
    session.setStateForTest("game.world.x", WORLD_RADIUS);
    session.setStateForTest("game.world.y", WORLD_RADIUS);
    session.setStateForTest("game.world.health", seed.health);
    session.setStateForTest("game.world.water", seed.water);
    session.setStateForTest("game.world.executioner", true);
    session.setStateForTest("game.expedition.baselineWorld", {});
    session.setStateForTest('outfit["hypo blueprint"]', 1);
    session.setStateForTest('outfit["alien alloy"]', 1);
    return true;
  }

  if ("combatEvent" in seed) {
    for (const [key, amount] of Object.entries(seed.stores)) {
      session.setStateForTest(`stores["${key}"]`, amount);
    }
    for (const [key, amount] of Object.entries(seed.outfit)) {
      session.setStateForTest(`outfit["${key}"]`, amount);
    }
    session.setStateForTest("character.health", seed.health);
    session.triggerEventByKeyForTest(seed.combatEvent);
    return true;
  }

  session.setStateForTest("features.location.path", true);
  session.setStateForTest("features.location.world", true);
  session.setStateForTest("game.world.active", true);
  session.setStateForTest("game.world.x", 30);
  session.setStateForTest("game.world.y", 30);
  session.setStateForTest("game.world.health", seed.health);
  session.setStateForTest("game.world.water", seed.water);
  session.setStateForTest("game.expedition.baselineWorld", {});
  for (const blueprint of seed.blueprints) {
    session.setStateForTest(`outfit["${blueprint}"]`, 1);
  }
  return true;
}

function isBrowserTestSeedName(
  seedName: string | null,
): seedName is BrowserTestSeedName {
  return seedName !== null && seedName in BROWSER_TEST_SEEDS;
}
