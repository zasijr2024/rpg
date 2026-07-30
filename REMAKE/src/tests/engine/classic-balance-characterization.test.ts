import { describe, expect, it } from "vitest";
import {
  originalCalculateScore,
  originalOutsideWorkerIncome,
  originalPrestigeStores,
  originalScoreFactors,
} from "../../content/original";
import {
  CombatRuntime,
  createGameEngine,
  GameSession,
  ShipRuntime,
  SpaceRuntime,
} from "../../engine";

describe("Classic balance characterization (not quality targets)", () => {
  it("locks the source-authentic worker score incentives named by TD-017", () => {
    expect(workerScoreDelta("gatherer")).toBe(1);
    expect(workerScoreDelta("hunter")).toBe(1.25);
    expect(workerScoreDelta("tanner")).toBe(-5.5);
    expect(workerScoreDelta("charcutier")).toBe(-8);
    expect(workerScoreDelta("steelworker")).toBe(-1);
    expect(workerScoreDelta("armourer")).toBe(-3);
  });

  it("characterizes uncapped Alien Alloy hull conversion as score-positive", () => {
    const engine = createGameEngine({ rngSeed: 301 });
    const ship = new ShipRuntime(engine);
    engine.state.set("features.location.spaceShip", true);
    engine.state.set('stores["alien alloy"]', 25);
    ship.onArrival();

    let purchases = 0;
    while (ship.reinforceHull()) purchases += 1;

    expect(purchases).toBe(25);
    expect(ship.snapshot()).toMatchObject({ hull: 25, alienAlloy: 0 });
    const converted = originalCalculateScore([], { "alien alloy": 0 }, 25);
    const oneHullAndUnspentAlloy = originalCalculateScore(
      [],
      { "alien alloy": 24 },
      1,
    );
    expect(converted).toBe(1250);
    expect(oneHullAndUnspentAlloy).toBe(290);
    expect(converted - oneHullAndUnspentAlloy).toBe(960);
  });

  it("records fully trained fists matching Plasma Rifle TTK without ammo", () => {
    const fists = measureGuaranteedHitTtk("fists", true);
    const plasma = measureGuaranteedHitTtk("plasma rifle");
    const blade = measureGuaranteedHitTtk("energy blade");
    const steel = measureGuaranteedHitTtk("steel sword");

    expect(fists).toEqual({ attacks: 10, elapsedMs: 9000, energyCellsUsed: 0 });
    expect(plasma).toEqual({
      attacks: 10,
      elapsedMs: 9000,
      energyCellsUsed: 10,
    });
    expect(blade.elapsedMs).toBe(22_000);
    expect(steel.elapsedMs).toBe(38_000);
  });

  it("preserves the audited 500-seed stationary Space hull curve", () => {
    expect([1, 10, 25].map(stationarySpaceEndings)).toEqual([0, 165, 500]);
  });

  it("keeps Executioner and Fabricator intentional optional prestige in Classic", () => {
    const session = new GameSession(createGameEngine({ rngSeed: 302 }));
    session.setStateForTest("game.world.executioner", false);
    session.setStateForTest("game.world.executionerCleared", false);
    session.setStateForTest("features.location.fabricator", false);
    session.setStateForTest("features.location.spaceShip", true);
    session.setStateForTest("game.spaceShip.hull", 1);
    session.setStateForTest("game.spaceShip.thrusters", 1);
    session.setLocation("ship");
    session.setRngSequenceForTest(Array(500).fill(0.9));

    session.requestShipLiftOff();
    session.confirmShipLiftOff();
    expect(session.snapshot()).toMatchObject({
      location: "space",
      space: { phase: "flying" },
      fabricator: { unlocked: false },
    });
    expect(session.getStateForTest("game.world.executioner")).toBe(false);
    expect(session.getStateForTest("game.world.executionerCleared")).toBe(
      false,
    );

    for (let step = 0; step < 100; step += 1) session.moveSpace("west");
    session.advanceForTest(60_000);

    expect(session.snapshot()).toMatchObject({
      location: "space",
      space: { phase: "ending", endingStage: "scores" },
      fabricator: { unlocked: false },
    });
    expect(session.getStateForTest("game.world.executioner")).toBe(false);
    expect(session.getStateForTest("game.world.executionerCleared")).toBe(
      false,
    );
  });
});

function workerScoreDelta(key: string): number {
  const worker = originalOutsideWorkerIncome.find((entry) => entry.key === key);
  if (!worker) throw new Error(`unknown worker ${key}`);
  const factors = new Map(
    originalPrestigeStores.map(({ key: store }, index) => [
      store,
      originalScoreFactors[index],
    ]),
  );
  return Object.entries(worker.stores).reduce(
    (delta, [store, amount]) => delta + amount * (factors.get(store) ?? 0),
    0,
  );
}

function measureGuaranteedHitTtk(weapon: string, trainedFists = false) {
  const engine = createGameEngine({ rngSeed: 303 });
  engine.rng.next = () => 0;
  if (trainedFists) {
    engine.state.set('character.perks["boxer"]', true);
    engine.state.set('character.perks["martial artist"]', true);
    engine.state.set('character.perks["unarmed master"]', true);
  } else {
    engine.state.set(`outfit["${weapon}"]`, 1);
  }
  engine.state.set('outfit["energy cell"]', 100);
  const combat = new CombatRuntime(engine);
  combat.start({
    enemy: "balance target",
    enemyName: "balance target",
    deathMessage: "the target is down",
    chara: "T",
    damage: 0,
    hit: 0,
    attackDelay: 100,
    health: 120,
    loot: {},
  });

  let attacks = 0;
  let elapsedMs = 0;
  while (combat.snapshot()?.phase === "fighting") {
    expect(combat.chooseAction(`attack:${weapon}`)).toBe(true);
    attacks += 1;
    if (combat.snapshot()?.phase !== "fighting") break;
    const cooldown = combat
      .snapshot()
      ?.actions.find(
        ({ key }) => key === `attack:${weapon}`,
      )?.cooldownRemainingMs;
    if (!cooldown) throw new Error(`missing ${weapon} cooldown`);
    engine.clock.advanceBy(cooldown);
    elapsedMs += cooldown;
  }
  return {
    attacks,
    elapsedMs,
    energyCellsUsed:
      100 - Number(engine.state.get('outfit["energy cell"]') ?? 0),
  };
}

function stationarySpaceEndings(hull: number): number {
  let endings = 0;
  for (let seed = 0; seed < 500; seed += 1) {
    const engine = createGameEngine({ rngSeed: seed });
    const space = new SpaceRuntime(engine);
    space.startFlight(hull);
    engine.clock.advanceBy(60_000);
    space.update();
    if (space.snapshot().phase === "ending") endings += 1;
  }
  return endings;
}
