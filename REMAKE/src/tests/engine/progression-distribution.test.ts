import { describe, expect, it } from "vitest";
import {
  progressionSeed,
  summarizeProgressionResults,
  writeProgressionShard,
} from "../../../scripts/progression-corpus.mjs";
import {
  createGameEngine,
  GameSession,
  Mulberry32Rng,
  type GameUiDomain,
  type GameUiSnapshotMap,
  type Rng,
} from "../../engine";
import {
  originalSpaceShipSpeed,
  originalWorldWeapons,
  SPACE_SHIP_MAX_POSITION,
  SPACE_SHIP_MIN_POSITION,
} from "../../content/original";

const WORLD_RADIUS = 30;
const requestedSeedCount = Number(process.env.PHASE14_STUDY_SEEDS ?? 4);
const requestedSeedStart = Number(process.env.PHASE14_STUDY_START ?? 0);
const traceProgression = process.env.PHASE14_STUDY_TRACE === "1";
const STUDY_SEEDS = Array.from({ length: requestedSeedCount }, (_, index) =>
  progressionSeed(index + requestedSeedStart),
);

type Stage =
  | "opening"
  | "compass"
  | "first-expedition"
  | "deep-economy"
  | "executioner"
  | "ship"
  | "space"
  | "complete";

interface StudyResult {
  seed: number;
  completed: boolean;
  stage: Stage;
  elapsedMs: number;
  deaths: number;
  incidentalEvents: number;
  combats: number;
  bottleneck: string | null;
  failureClass: "policy" | "game-defect" | "unclassified" | null;
  checkpoints: string[];
  milestones: Partial<Record<Stage, number>>;
}

class PolicyDeath extends Error {
  constructor(detail: string) {
    super(detail);
    this.name = "PolicyDeath";
  }
}

class PolicyRetry extends Error {
  constructor(detail: string) {
    super(detail);
    this.name = "PolicyRetry";
  }
}

class StudyRng implements Rng {
  private readonly base: Mulberry32Rng;

  constructor(seed: number) {
    this.base = new Mulberry32Rng(seed);
  }

  next(): number {
    return this.base.next();
  }

  nextInt(maxExclusive: number): number {
    return Math.floor(this.next() * maxExclusive);
  }

  fork(seed: number): Rng {
    return new StudyRng(seed);
  }
}

class StudyRun {
  readonly session: GameSession;
  readonly result: StudyResult;

  constructor(
    seed: number,
    readonly rng = new StudyRng(seed),
  ) {
    this.session = new GameSession(createGameEngine({ rng }));
    this.result = {
      seed,
      completed: false,
      stage: "opening",
      elapsedMs: 0,
      deaths: 0,
      incidentalEvents: 0,
      combats: 0,
      bottleneck: null,
      failureClass: null,
      checkpoints: [],
      milestones: {},
    };
  }

  mark(stage: Stage): void {
    this.result.stage = stage;
    this.result.milestones[stage] = this.result.elapsedMs;
    this.checkpoint(`milestone:${stage}`);
  }

  checkpoint(detail: string): void {
    const checkpoint = `${this.result.elapsedMs}:${detail}`;
    this.result.checkpoints.push(checkpoint);
    if (traceProgression) {
      console.info(
        `PHASE14_PROGRESSION_CHECKPOINT ${this.result.seed} ${checkpoint}`,
      );
    }
  }

  advance(ms: number, resolveEvents = true): void {
    // Five minutes is below the longest ordinary event window while avoiding
    // thousands of UI publication snapshots during twelve hours of economy.
    const chunkMs = 5 * 60_000;
    let remaining = ms;
    while (remaining > 0) {
      const step = Math.min(chunkMs, remaining);
      this.session.advanceForTest(step);
      this.result.elapsedMs += step;
      remaining -= step;
      if (resolveEvents && studySnapshot(this, "event")) {
        this.result.incidentalEvents += 1;
        resolveIncidentalEvent(this);
      }
    }
  }
}

function studySnapshot<TDomain extends GameUiDomain>(
  run: StudyRun,
  domain: TDomain,
): GameUiSnapshotMap[TDomain] {
  // The progression probe has no mounted UI. Keep reads domain-scoped and
  // transient so a combat tick does not construct every other UI snapshot.
  const unsubscribe = run.session.subscribeUi(domain, () => {});
  const snapshot = run.session.uiSnapshot(domain);
  unsubscribe();
  return snapshot;
}

describe("Phase 14 uncontrolled progression distribution", () => {
  it(
    "runs a real-command completion policy across deterministic production RNG seeds",
    () => {
      const results = STUDY_SEEDS.map(runProgressionStudy);
      const completed = results.filter((result) => result.completed);
      const summary = summarizeProgressionResults(results);

      const output = process.env.PHASE14_STUDY_OUTPUT;
      if (output) writeProgressionShard(output, requestedSeedStart, results);

      // This JSON line is intentionally stable so scheduled CI can retain it as
      // evidence without shipping a browser test API or pretending one route is
      // a player-time percentile.
      console.info(`PHASE14_PROGRESSION_STUDY ${JSON.stringify(summary)}`);

      expect(results).toHaveLength(requestedSeedCount);
      expect(
        results.every(
          (result) => result.completed || result.bottleneck !== null,
        ),
      ).toBe(true);
      expect(
        results.every(
          (result) => result.completed || result.failureClass !== null,
        ),
      ).toBe(true);
      expect(completed.every((result) => result.stage === "complete")).toBe(
        true,
      );
      expect(
        results.every((result) => Object.keys(result.milestones).length > 0),
      ).toBe(true);
      if (requestedSeedCount >= 4) {
        expect(summary.incidentalEvents).toBeGreaterThan(0);
      }
    },
    requestedSeedCount * 600_000,
  );
});

function runProgressionStudy(seed: number): StudyResult {
  const run = new StudyRun(seed);
  try {
    completeOpening(run);
    progressToCompass(run);
    run.mark("compass");
    prepareFirstExpedition(run);
    run.mark("first-expedition");
    completeMineRoutes(run);
    prepareDeepExpeditions(run);
    run.mark("deep-economy");
    collectSettlementSupplies(run, "town", "O");
    collectSettlementSupplies(run, "city", "Y");
    collectBattlefieldSupplies(run);
    completeSulphurRoute(run);
    collectBoreholeAlloy(run);
    completeExecutionerRoute(run);
    run.mark("executioner");
    completeShipRoute(run);
    run.mark("ship");
    completeSpace(run);
    run.mark("space");
    run.result.completed = true;
    run.mark("complete");
  } catch (error) {
    run.result.bottleneck =
      error instanceof Error ? error.message : String(error);
    run.result.failureClass = classifyFailure(run.result.bottleneck);
  }
  return run.result;
}

function completeOpening(run: StudyRun): void {
  run.session.lightFire();
  for (let step = 0; step < 13; step += 1) run.advance(10_000);
  if (!studySnapshot(run, "outside").outside.unlocked) {
    throw new Error("outside did not unlock");
  }
}

function progressToCompass(run: StudyRun): void {
  for (let cycle = 0; cycle < 120; cycle += 1) {
    resolveIncidentalEvent(run);
    run.session.setLocation("outside");
    run.session.gatherWood();
    run.session.checkTraps();
    increaseWorker(run, "hunter", 10);
    increaseWorker(run, "hunter", 1);
    if (worker(run, "charcutier")) {
      decreaseWorker(run, "hunter", 10);
      increaseWorker(run, "charcutier", 10);
      decreaseWorker(run, "hunter", 1);
      increaseWorker(run, "charcutier", 1);
    }

    run.advance(10 * 60_000);
    run.session.setLocation("room");
    for (const action of [
      "trap",
      "cart",
      "hut",
      "lodge",
      "trading post",
      "smokehouse",
    ]) {
      chooseRoomAction(run, action);
    }
    buyUntil(run, "scales", 20);
    buyUntil(run, "teeth", 10);
    chooseRoomAction(run, "compass", "buy");
    if (studySnapshot(run, "path").path.unlocked) return;
  }
  throw new Error("compass economy exceeded 120 cycles");
}

function prepareFirstExpedition(run: StudyRun): void {
  run.session.setLocation("outside");
  drainWorker(run, "charcutier");
  assignWorker(run, "hunter", 30);
  run.advance(60 * 60_000);

  run.session.setLocation("room");
  requireRoomAction(run, "tannery");
  run.session.setLocation("outside");
  drainWorker(run, "hunter");
  assignWorker(run, "hunter", 30);
  assignWorker(run, "tanner", 10);
  assignWorker(run, "charcutier", 10);
  run.advance(60 * 60_000);
  drainWorker(run, "tanner");
  drainWorker(run, "charcutier");
  assignWorker(run, "hunter", 50);
  run.advance(10 * 60_000);

  run.session.setLocation("room");
  buyUntil(run, "scales", 10);
  ensureWorkshopMaterials(run);
  requireRoomAction(run, "workshop");
  buyUntil(run, "scales", 20);
  if (storeAmount(run, "scales") < 20) {
    trapUntil(run, "scales", 20, 80);
  }
  requireRoomAction(run, "l armour");
  for (const craft of ["waterskin", "rucksack", "bone spear"]) {
    requireRoomAction(run, craft);
  }
  trapUntil(run, "cloth", 1, 40);
  run.session.setLocation("room");
  requireRoomAction(run, "torch");
}

function completeMineRoutes(run: StudyRun): void {
  completeExpeditionWithRecovery(run, "iron-mine", () => {
    const ironRoute = requireRoute(worldMap(run), "I");
    ensureCraftedItem(run, "torch");
    ensureCraftedItem(run, "bone spear");
    setOutfit(run, "cured meat", 8);
    setOutfit(run, "torch", 1);
    setOutfit(run, "bone spear", 1);
    embark(run);
    followRoute(run, ironRoute, false);
    chooseEvent(run, "go inside");
    fight(run, "bone spear");
    chooseEvent(run, "leave");
    chooseEvent(run, "leave");
    followRoute(run, ironRoute, true);
  });

  completeExpeditionWithRecovery(run, "coal-mine", () => {
    const coalRoute = requireRoute(worldMap(run), "C");
    ensureIronArmour(run);
    ensureCraftedItem(run, "iron sword");
    setOutfit(run, "cured meat", 14);
    setOutfit(run, "bone spear", 0);
    setOutfit(run, "iron sword", 1);
    embark(run);
    followRoute(run, coalRoute, false);
    chooseEvent(run, "attack");
    fight(run, "iron sword");
    chooseEvent(run, "continue");
    fight(run, "iron sword");
    chooseEvent(run, "continue");
    fight(run, "iron sword");
    chooseEvent(run, "continue");
    chooseEvent(run, "leave");
    followRoute(run, coalRoute, true);
  });
}

function ensureIronArmour(run: StudyRun): void {
  if (storeAmount(run, "i armour") > 0) return;
  // Keep the next iron sword in reserve. A fixed two-minute production window
  // was only sufficient when enough villagers happened to be idle and enough
  // leather survived the first expedition.
  ensureCraftingMaterials(run, { leather: 250, iron: 120 });
  run.session.setLocation("room");
  requireRoomAction(run, "i armour");
  run.checkpoint("coal-mine:iron-armour-ready");
}

function completeExpeditionWithRecovery(
  run: StudyRun,
  label: string,
  attemptExpedition: () => void,
  maxAttempts = 4,
): void {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      attemptExpedition();
      run.checkpoint(`${label}:complete:attempt-${attempt}`);
      return;
    } catch (error) {
      if (!(error instanceof PolicyDeath || error instanceof PolicyRetry)) {
        throw error;
      }
      const outcome = error instanceof PolicyDeath ? "death" : "retry";
      run.checkpoint(`${label}:${outcome}:attempt-${attempt}:${error.message}`);
      if (attempt === maxAttempts) {
        throw new Error(`${label} exhausted ${maxAttempts} legal attempts`, {
          cause: error,
        });
      }

      // Death returns the player to the ordinary Room state, rolls the World
      // expedition back, clears carried supplies, and starts the normal
      // two-minute embark cooldown. Recovery uses only visible game commands.
      run.advance(120_000);
    }
  }
}

function ensureCraftedItem(run: StudyRun, name: string, target = 1): void {
  if (storeAmount(run, name) >= target) return;
  while (storeAmount(run, name) < target) {
    if (name === "iron sword") {
      ensureCraftingMaterials(run, { wood: 200, leather: 50, iron: 20 });
    }
    if (name === "steel sword") {
      ensureCraftingMaterials(run, { wood: 500, leather: 100, steel: 20 });
    }
    if (name === "rifle") {
      ensureCraftingMaterials(run, { wood: 200, steel: 50, sulphur: 50 });
    }
    if (name === "grenade") {
      run.checkpoint(
        `executioner:martial-grenade-reserves:${storeAmount(run, "scales")}/${storeAmount(run, "teeth")}`,
      );
      buyUntil(run, "scales", 100);
      if (storeAmount(run, "scales") < 100) {
        trapUntil(run, "scales", 100, 240);
      }
      buyUntil(run, "teeth", 50);
      if (storeAmount(run, "teeth") < 50) {
        trapUntil(run, "teeth", 50, 240);
      }
    }
    if (name === "torch" && storeAmount(run, "cloth") < 1) {
      trapUntil(run, "cloth", 1, 40);
    }
    if (name === "bone spear" && storeAmount(run, "teeth") < 5) {
      run.session.setLocation("room");
      buyUntil(run, "teeth", 5);
      if (storeAmount(run, "teeth") < 5) trapUntil(run, "teeth", 5, 40);
    }
    run.session.setLocation("room");
    requireRoomAction(run, name);
  }
}

function ensureCraftingMaterials(
  run: StudyRun,
  targets: Partial<
    Record<"wood" | "leather" | "iron" | "coal" | "steel" | "sulphur", number>
  >,
): void {
  if (targets.leather !== undefined) ensureLeather(run, targets.leather);
  // Steel production consumes iron and coal, so establish the final reserves
  // only after the requested steel has been made.
  if (targets.steel !== undefined) ensureSteel(run, targets.steel);
  if (targets.iron !== undefined)
    ensureMineOutput(run, "iron miner", "iron", targets.iron);
  if (targets.coal !== undefined)
    ensureMineOutput(run, "coal miner", "coal", targets.coal);
  if (targets.sulphur !== undefined)
    ensureMineOutput(run, "sulphur miner", "sulphur", targets.sulphur);
  // Charcutier work used to provision miners consumes wood, so establish the
  // final wood reserve after every worker-backed material target.
  if (targets.wood !== undefined) ensureWood(run, targets.wood);
}

function ensureWood(run: StudyRun, target: number): void {
  for (let cycle = 0; cycle < 60; cycle += 1) {
    if (storeAmount(run, "wood") >= target) return;
    run.session.setLocation("outside");
    run.session.gatherWood();
    run.advance(5 * 60_000);
  }
  throw new Error(`wood reserve ${target} unavailable`);
}

function ensureLeather(run: StudyRun, target: number): void {
  ensureWorkerUnlocked(run, "tanner", "tannery");
  for (let cycle = 0; cycle < 12; cycle += 1) {
    if (storeAmount(run, "leather") >= target) return;
    run.session.setLocation("outside");
    for (const name of [
      "hunter",
      "tanner",
      "charcutier",
      "iron miner",
      "coal miner",
      "steelworker",
    ]) {
      drainWorker(run, name);
    }

    const missingLeather = target - storeAmount(run, "leather");
    const requiredFur = missingLeather * 5;
    if (storeAmount(run, "fur") < requiredFur) {
      assignWorker(run, "hunter", 40);
      run.advance(10 * 60_000);
      drainWorker(run, "hunter");
    }

    const population = studySnapshot(run, "outside").outside.population;
    const tanners = Math.min(10, Math.floor(population / 3));
    const hunters = Math.min(30, Math.max(0, population - tanners));
    assignWorker(run, "tanner", tanners);
    assignWorker(run, "hunter", hunters);
    run.advance(5 * 60_000);
  }
  throw new Error(`leather reserve ${target} unavailable`);
}

function ensureFur(run: StudyRun, target: number): void {
  for (let cycle = 0; cycle < 60; cycle += 1) {
    if (storeAmount(run, "fur") >= target) return;
    run.session.setLocation("outside");
    for (const name of [
      "hunter",
      "tanner",
      "charcutier",
      "iron miner",
      "coal miner",
      "sulphur miner",
      "steelworker",
    ]) {
      drainWorker(run, name);
    }
    assignWorker(
      run,
      "hunter",
      studySnapshot(run, "outside").outside.population,
    );
    run.advance(10 * 60_000);
  }
  throw new Error(`fur reserve ${target} unavailable`);
}

function ensureBullets(run: StudyRun, target: number): void {
  for (let purchase = 0; purchase < target; purchase += 1) {
    if (storeAmount(run, "bullets") >= target) return;
    ensureFur(run, 1_500);
    run.session.setLocation("room");
    buyUntil(run, "scales", 10);
    if (!chooseRoomAction(run, "bullets", "buy")) {
      throw new Error(`bullet reserve ${target} unavailable`);
    }
  }
  if (storeAmount(run, "bullets") >= target) return;
  throw new Error(`bullet reserve ${target} unavailable`);
}

function ensureMedicine(run: StudyRun, target: number): void {
  for (let purchase = 0; purchase < target; purchase += 1) {
    if (storeAmount(run, "medicine") >= target) return;
    const missingScales = Math.max(0, 50 - storeAmount(run, "scales"));
    const missingTeeth = Math.max(0, 30 - storeAmount(run, "teeth"));
    ensureFur(run, missingScales * 150 + missingTeeth * 300);
    run.session.setLocation("room");
    buyUntil(run, "scales", 50);
    buyUntil(run, "teeth", 30);
    if (!chooseRoomAction(run, "medicine", "buy")) {
      throw new Error(`medicine reserve ${target} unavailable`);
    }
  }
  if (storeAmount(run, "medicine") >= target) return;
  throw new Error(`medicine reserve ${target} unavailable`);
}

function ensureMineOutput(
  run: StudyRun,
  workerName: "iron miner" | "coal miner" | "sulphur miner",
  resource: "iron" | "coal" | "sulphur",
  target: number,
): void {
  for (let cycle = 0; cycle < 12; cycle += 1) {
    if (storeAmount(run, resource) >= target) return;
    const missing = target - storeAmount(run, resource);
    ensureCuredMeat(run, missing + 50);
    run.session.setLocation("outside");
    for (const name of [
      "hunter",
      "tanner",
      "charcutier",
      "iron miner",
      "coal miner",
      "sulphur miner",
      "steelworker",
    ]) {
      drainWorker(run, name);
    }
    assignWorker(run, workerName, 10);
    run.advance(5 * 60_000);
  }
  throw new Error(`${resource} reserve ${target} unavailable`);
}

function ensureSteel(run: StudyRun, target: number): void {
  for (let cycle = 0; cycle < 12; cycle += 1) {
    if (storeAmount(run, "steel") >= target) return;
    const missing = target - storeAmount(run, "steel");
    ensureMineOutput(
      run,
      "iron miner",
      "iron",
      storeAmount(run, "iron") + missing,
    );
    ensureMineOutput(
      run,
      "coal miner",
      "coal",
      storeAmount(run, "coal") + missing,
    );
    run.session.setLocation("outside");
    for (const name of [
      "hunter",
      "tanner",
      "charcutier",
      "iron miner",
      "coal miner",
      "steelworker",
    ]) {
      drainWorker(run, name);
    }
    assignWorker(run, "steelworker", 10);
    run.advance(5 * 60_000);
  }
  throw new Error(`steel reserve ${target} unavailable`);
}

function prepareDeepExpeditions(run: StudyRun): void {
  ensureCraftingMaterials(run, { wood: 1500, iron: 100, coal: 100 });
  run.session.setLocation("room");
  requireRoomAction(run, "steelworks");

  // Exact purchase totals, a convoy for the long late-game routes, and one
  // iron- and steel-sword replacement. This makes later recovery independent
  // of how many resources survived the mines.
  ensureCraftingMaterials(run, {
    wood: 2700,
    leather: 450,
    iron: 420,
    steel: 290,
  });

  run.session.setLocation("room");
  for (const craft of [
    "convoy",
    "water tank",
    "wagon",
    "s armour",
    "steel sword",
  ]) {
    requireRoomAction(run, craft);
  }
  run.session.setLocation("outside");
  drainWorker(run, "iron miner");
  drainWorker(run, "coal miner");
  assignWorker(run, "charcutier", 10);
  run.advance(10 * 60_000);
}

function collectBattlefieldSupplies(run: StudyRun): void {
  completeExpeditionWithRecovery(
    run,
    "battlefield",
    () => {
      const route = requireRoute(worldMap(run), "F");
      ensureCraftedItem(run, "iron sword");
      ensureCraftedItem(run, "steel sword");
      for (const item of [
        "rifle",
        "laser rifle",
        "plasma rifle",
        "bayonet",
        "bullets",
        "energy cell",
        "medicine",
        "hypo",
        "grenade",
        "bolas",
        "charm",
        "alien alloy",
      ]) {
        if (outfitAmount(run, item) > 0) setOutfit(run, item, 0);
      }
      run.session.setLocation("room");
      if (
        studySnapshot(run, "room").room.buyOptions.some(
          (option) => option.key === "medicine",
        )
      ) {
        ensureMedicine(run, 5);
      }
      setOutfit(run, "bone spear", 0);
      setOutfit(run, "iron sword", 0);
      setOutfit(run, "steel sword", 1);
      setOutfit(run, "torch", 0);
      if (storeAmount(run, "medicine") > 0) {
        setOutfit(run, "medicine", Math.min(5, storeAmount(run, "medicine")));
      }
      setOutfit(run, "cured meat", 55);
      embark(run);
      followRoute(run, route, false);
      run.checkpoint(
        `battlefield:loot:${JSON.stringify(studySnapshot(run, "event")?.loot)}`,
      );
      takePreferredBattlefieldWeapon(run);
      takePriorityLoot(run);
      takeEverything(run);
      chooseEvent(run, "leave");
      returnHomeViaOutpost(run, route);
      const hasRangedWeapon =
        storeAmount(run, "rifle") > 0 || storeAmount(run, "laser rifle") > 0;
      const hasGrenade = storeAmount(run, "grenade") > 0;
      if (!hasRangedWeapon || !hasGrenade) {
        throw new PolicyRetry(
          `battlefield supplies incomplete (ranged=${hasRangedWeapon}, grenade=${hasGrenade})`,
        );
      }
    },
    8,
  );
}

function takePreferredBattlefieldWeapon(run: StudyRun): void {
  let event = studySnapshot(run, "event");
  const loot = event?.loot?.loot ?? {};
  const availableEnergyCells =
    outfitAmount(run, "energy cell") + (loot["energy cell"] ?? 0);
  const weapon =
    (loot["laser rifle"] ?? 0) > 0 && availableEnergyCells > 0
      ? "laser rifle"
      : (loot.rifle ?? 0) > 0
        ? "rifle"
        : null;
  if (!weapon || !event?.loot) return;
  const ammunition = weapon === "laser rifle" ? "energy cell" : "bullets";
  for (let count = 0; count < 100; count += 1) {
    const takeAmmunition = event.loot.actions.find(
      (action) => action.key === `take:${ammunition}` && !action.disabled,
    );
    if (!takeAmmunition) break;
    run.session.chooseEventLootAction(takeAmmunition.key);
    event = studySnapshot(run, "event");
    if (!event?.loot) return;
  }
  const direct = event.loot.actions.find(
    (action) => action.key === `take:${weapon}` && !action.disabled,
  );
  const exchange = event.loot.actions.find(
    (action) => action.key.startsWith(`dropFor:${weapon}:`) && !action.disabled,
  );
  const action = direct ?? exchange;
  if (action) {
    run.session.chooseEventLootAction(action.key);
    run.checkpoint(
      `battlefield:weapon:${weapon}:outfit=${outfitAmount(run, weapon)}:ammo=${outfitAmount(run, ammunition)}`,
    );
  }
}

function collectBoreholeAlloy(run: StudyRun): void {
  completeExpeditionWithRecovery(run, "borehole", () => {
    const route = requireRoute(worldMap(run), "B");
    ensureCraftedItem(run, "steel sword");
    setOutfit(run, "cured meat", 45);
    embark(run);
    followRoute(run, route, false);
    run.checkpoint(
      `borehole:loot:${JSON.stringify(studySnapshot(run, "event")?.loot)}`,
    );
    takeEverything(run);
    takePriorityLoot(run);
    chooseEvent(run, "leave");
    followRoute(run, route, true);
  });
}

function collectSettlementSupplies(
  run: StudyRun,
  label: "town" | "city",
  tile: "O" | "Y",
): void {
  completeExpeditionWithRecovery(run, label, () => {
    const route = requireRoute(worldMap(run), tile);
    ensureCraftedItem(run, "torch");
    ensureCraftedItem(run, "steel sword");
    setOutfit(run, "bone spear", 0);
    setOutfit(run, "iron sword", 0);
    setOutfit(run, "steel sword", 1);
    setOutfit(run, "torch", 1);
    setOutfit(run, "cured meat", 55);
    embark(run);
    followRoute(run, route, false);
    resolveSupplySetpiece(run, label);
    followRoute(run, route, true);
  });
}

function resolveSupplySetpiece(run: StudyRun, label: "town" | "city"): void {
  for (let step = 0; step < 120; step += 1) {
    const event = studySnapshot(run, "event");
    if (!event) return;
    if (event.combat?.phase === "fighting") {
      fight(run, "steel sword");
      continue;
    }
    if (event.combat?.phase === "exploding") {
      run.advance(3_000, false);
      continue;
    }
    if (
      event.combat?.phase === "won" &&
      !event.buttons.some((button) => !button.disabled)
    ) {
      collectCombatOutcome(run);
      continue;
    }
    if (event.loot) {
      run.checkpoint(`${label}:loot:${JSON.stringify(event.loot)}`);
      takeEverything(run);
      takePriorityLoot(run);
    }
    const current = studySnapshot(run, "event");
    if (!current) return;
    const exits = new Set([
      "leave",
      "leave town",
      "leave city",
      "run",
      "go home",
    ]);
    const enabled = current.buttons.filter((button) => !button.disabled);
    const button =
      enabled.find(
        (candidate) =>
          !exits.has(candidate.text) &&
          Object.keys(candidate.cost).length === 0,
      ) ??
      enabled.find((candidate) => !exits.has(candidate.text)) ??
      enabled[0];
    if (!button) {
      throw new Error(
        `${label} event ${current.eventKey}/${current.sceneKey} has no legal choice`,
      );
    }
    run.session.chooseEventButton(button.key);
  }
  throw new Error(`${label} supply route exceeded 120 decisions`);
}

function completeSulphurRoute(run: StudyRun): void {
  completeExpeditionWithRecovery(run, "sulphur-mine", () => {
    const route = requireRoute(worldMap(run), "S");
    ensureCraftedItem(run, "steel sword");
    if (storeAmount(run, "rifle") > 0) ensureBullets(run, 100);
    run.session.setLocation("room");
    if (
      studySnapshot(run, "room").room.buyOptions.some(
        (option) => option.key === "medicine",
      )
    ) {
      ensureMedicine(run, 5);
    }
    for (const item of [
      "rifle",
      "laser rifle",
      "bayonet",
      "bullets",
      "energy cell",
      "medicine",
      "grenade",
      "bolas",
      "alien alloy",
    ]) {
      if (outfitAmount(run, item) > 0) setOutfit(run, item, 0);
    }
    const energyCells = Math.min(20, storeAmount(run, "energy cell"));
    const bullets = Math.min(100, storeAmount(run, "bullets"));
    const medicine = Math.min(5, storeAmount(run, "medicine"));
    const tacticalCapacity = Math.max(0, 5 - medicine);
    const bolas = Math.min(
      Math.floor(tacticalCapacity * 2),
      storeAmount(run, "bolas"),
    );
    const grenades = Math.min(
      Math.floor(tacticalCapacity - bolas * 0.5),
      storeAmount(run, "grenade"),
    );
    const hasLaserRifle =
      storeAmount(run, "laser rifle") > 0 && energyCells > 0;
    const hasRifle = storeAmount(run, "rifle") > 0 && bullets > 0;
    const hasBayonet = storeAmount(run, "bayonet") > 0;
    const preferredWeapon = hasLaserRifle
      ? "laser rifle"
      : hasRifle
        ? "rifle"
        : hasBayonet
          ? "bayonet"
          : "steel sword";
    run.checkpoint(
      `sulphur-mine:loadout:${preferredWeapon}:stores=${storeAmount(run, "laser rifle")}/${storeAmount(run, "energy cell")}/${storeAmount(run, "rifle")}/${storeAmount(run, "bullets")}/${storeAmount(run, "medicine")}`,
    );
    setOutfit(run, "bone spear", 0);
    setOutfit(run, "iron sword", 0);
    setOutfit(run, "steel sword", 1);
    if (hasLaserRifle) {
      setOutfit(run, "laser rifle", 1);
      setOutfit(run, "energy cell", energyCells);
    }
    if (hasRifle) {
      setOutfit(run, "rifle", 1);
      setOutfit(run, "bullets", bullets);
    }
    if (hasBayonet) setOutfit(run, "bayonet", 1);
    setOutfit(run, "medicine", medicine);
    if (bolas > 0) setOutfit(run, "bolas", bolas);
    if (grenades > 0) setOutfit(run, "grenade", grenades);
    setOutfit(run, "cured meat", 45);
    embark(run);
    followRoute(run, route, false);
    chooseEvent(run, "attack");
    fight(run, preferredWeapon, 25, 50);
    collectCombatOutcome(run);
    chooseEvent(run, "continue");
    fight(run, preferredWeapon, 25, 50);
    collectCombatOutcome(run);
    chooseEvent(run, "continue");
    fight(run, preferredWeapon, 25, 50);
    collectCombatOutcome(run);
    chooseEvent(run, "continue");
    chooseEvent(run, "leave");
    followRoute(run, route, true);
  });
}

function completeExecutionerRoute(run: StudyRun): void {
  const route = requireRoute(worldMap(run), "X");

  // The source event intentionally exposes the battleship in resumable wings.
  // Commit each useful branch at home so a later death cannot roll the device,
  // Engineering blueprint, or fabricated armour back with the expedition.
  completeExpeditionWithRecovery(run, "executioner-device", () => {
    const preferredWeapon = prepareExecutionerExpedition(run, "device");
    embark(run);
    followRoute(run, route, false, 35, 50);
    chooseEvent(run, "enter");
    chooseEvent(run, "continue");
    chooseEvent(run, "continue");
    fight(run, preferredWeapon, 35, 50);
    collectCombatOutcome(run);
    takeEverything(run);
    chooseEvent(run, "continue");
    chooseEvent(run, "power cycle");
    fight(run, preferredWeapon, 35, 50);
    collectCombatOutcome(run);
    takeEverything(run);
    chooseEvent(run, "continue");
    chooseEvent(run, "take device and leave");
    followRoute(run, route, true, 35, 50);
    run.checkpoint(`executioner:device-committed:${preferredWeapon}`);
  });

  if (!studySnapshot(run, "fabricator").unlocked) {
    throw new Error("device did not unlock Fabricator");
  }

  completeExpeditionWithRecovery(
    run,
    "executioner-engineering",
    () => {
      const preferredWeapon = prepareExecutionerExpedition(run, "engineering");
      embark(run);
      followRoute(run, route, false);
      requireEvent(run, "executioner.antechamber", "start");
      chooseEvent(run, "engineering");
      if (!completeExecutionerWing(run, "engineering", preferredWeapon)) {
        throw new Error("engineering route ended without its recovery flag");
      }
      followRoute(run, route, true);
    },
    8,
  );

  fabricateExecutionerUpgrade(run, "kinetic armour");
  run.checkpoint(
    `executioner:kinetic-armour-ready:health=${String(run.session.getStateForTest("game.world.health"))}`,
  );

  completeExpeditionWithRecovery(
    run,
    "executioner-martial",
    () => {
      const preferredWeapon = prepareExecutionerExpedition(run, "martial");
      embark(run);
      followRoute(run, route, false);
      requireEvent(run, "executioner.antechamber", "start");
      let martialCleared = false;
      for (let branchAttempt = 1; branchAttempt <= 6; branchAttempt += 1) {
        chooseEvent(run, "martial");
        if (completeExecutionerWing(run, "martial", preferredWeapon)) {
          martialCleared = true;
          break;
        }
        run.checkpoint(
          `executioner:martial-incomplete:attempt-${branchAttempt}`,
        );
        reenterLandmark(run, route);
        requireEvent(run, "executioner.antechamber", "start");
      }
      if (!martialCleared) {
        throw new Error("martial route exhausted six legal branch attempts");
      }
      followRoute(run, route, true);
    },
    8,
  );

  fabricateExecutionerUpgrade(run, "plasma rifle");

  completeExpeditionWithRecovery(
    run,
    "executioner-medical",
    () => {
      const preferredWeapon = prepareExecutionerExpedition(run, "medical");
      embark(run);
      followRoute(run, route, false);
      requireEvent(run, "executioner.antechamber", "start");
      chooseEvent(run, "medical");
      if (!completeExecutionerWing(run, "medical", preferredWeapon)) {
        throw new Error("medical route ended without its recovery flag");
      }
      followRoute(run, route, true);
    },
    8,
  );

  for (const commandUpgrade of ["disruptor", "hypo"] as const) {
    fabricateExecutionerUpgrade(run, commandUpgrade);
  }
  fabricateExecutionerItemIfAvailable(run, "disruptor");

  completeExpeditionWithRecovery(
    run,
    "executioner-command",
    () => {
      const preferredWeapon = prepareExecutionerExpedition(run, "command");
      embark(run);
      followRoute(run, route, false);
      requireEvent(run, "executioner.antechamber", "start");
      chooseEvent(run, "command deck");
      requireEvent(run, "executioner.command-wanderer", "start");
      chooseEvent(run, "approach");
      chooseEvent(run, "observe");
      fight(run, preferredWeapon, 35);
      takePriorityCombatLoot(run);
      collectCombatOutcome(run);
      leaveWonCombat(run);
      requireEvent(run, "executioner.command-wanderer", "cleared");
      if (
        run.session.getStateForTest("game.world.executionerCleared") !== true
      ) {
        throw new Error("command deck did not clear the Executioner");
      }
      chooseEvent(run, "leave");
      followRoute(run, route, true);
      if (storeAmount(run, "fleet beacon") < 1) {
        throw new Error("command deck fleet beacon missing after safe return");
      }
    },
    8,
  );
}

function prepareExecutionerExpedition(
  run: StudyRun,
  phase: "device" | "engineering" | "medical" | "martial" | "command",
): string {
  const bulletTarget =
    phase === "device"
      ? 80
      : phase === "engineering"
        ? 120
        : phase === "command"
          ? 100
          : 70;
  const medicineTarget = 10;
  ensureCraftedItem(run, "iron sword");
  ensureCraftedItem(run, "steel sword");
  ensureCraftedItem(run, "rifle");
  const grenadeTarget =
    phase === "device" || phase === "martial" || phase === "command"
      ? 3
      : phase === "engineering" || phase === "medical"
        ? 1
        : 0;
  if (grenadeTarget > 0) ensureCraftedItem(run, "grenade", grenadeTarget);
  for (const item of [
    "rifle",
    "laser rifle",
    "plasma rifle",
    "disruptor",
    "bayonet",
    "bullets",
    "energy cell",
    "medicine",
    "hypo",
    "stim",
    "grenade",
    "bolas",
    "charm",
    "alien alloy",
    "cured meat",
  ]) {
    if (outfitAmount(run, item) > 0) setOutfit(run, item, 0);
  }
  const hasPlasmaRifle =
    storeAmount(run, "plasma rifle") > 0 && storeAmount(run, "energy cell") > 0;
  const hasDisruptor = storeAmount(run, "disruptor") > 0;
  ensureBullets(run, bulletTarget);
  run.session.setLocation("room");
  if (
    studySnapshot(run, "room").room.buyOptions.some(
      (option) => option.key === "medicine",
    )
  ) {
    ensureMedicine(run, medicineTarget);
  }
  if (
    studySnapshot(run, "room").room.buyOptions.some(
      (option) => option.key === "bolas",
    )
  ) {
    buyUntil(run, "bolas", 10);
  }
  const hasLaserRifle =
    storeAmount(run, "laser rifle") > 0 &&
    storeAmount(run, "energy cell") >= 40;
  const hasRifle =
    storeAmount(run, "rifle") > 0 && storeAmount(run, "bullets") > 0;
  const hasBayonet = storeAmount(run, "bayonet") > 0;
  const energyCells = Math.min(80, storeAmount(run, "energy cell"));
  const bullets = Math.min(bulletTarget, storeAmount(run, "bullets"));
  const grenades = Math.min(grenadeTarget, storeAmount(run, "grenade"));
  const bolas = hasDisruptor ? 0 : Math.min(10, storeAmount(run, "bolas"));
  const preferredWeapon = hasPlasmaRifle
    ? "plasma rifle"
    : hasLaserRifle
      ? hasRifle
        ? "rifle"
        : "laser rifle"
      : hasRifle
        ? "rifle"
        : hasBayonet
          ? "bayonet"
          : "steel sword";
  run.checkpoint(
    `executioner:loadout:${preferredWeapon}:stores=${storeAmount(run, "plasma rifle")}/${storeAmount(run, "laser rifle")}/${storeAmount(run, "energy cell")}/${storeAmount(run, "rifle")}/${storeAmount(run, "bullets")}/${storeAmount(run, "medicine")}/${storeAmount(run, "hypo")}`,
  );
  setOutfit(run, "bone spear", 0);
  setOutfit(run, "iron sword", 0);
  setOutfit(
    run,
    "steel sword",
    phase !== "device"
      ? hasPlasmaRifle
        ? 1
        : phase === "engineering" && (hasRifle || hasLaserRifle)
          ? 0
          : hasBayonet
            ? 0
            : 1
      : hasLaserRifle || hasRifle || hasBayonet
        ? 0
        : 1,
  );
  setOutfit(run, "torch", 0);
  if (storeAmount(run, "laser rifle") > 0)
    setOutfit(run, "laser rifle", preferredWeapon === "laser rifle" ? 1 : 0);
  if (storeAmount(run, "plasma rifle") > 0)
    setOutfit(run, "plasma rifle", preferredWeapon === "plasma rifle" ? 1 : 0);
  if (hasDisruptor) setOutfit(run, "disruptor", 1);
  if (storeAmount(run, "rifle") > 0)
    setOutfit(
      run,
      "rifle",
      preferredWeapon === "rifle" || preferredWeapon === "plasma rifle" ? 1 : 0,
    );
  if (storeAmount(run, "bayonet") > 0)
    setOutfit(run, "bayonet", preferredWeapon === "bayonet" ? 1 : 0);
  if (energyCells > 0)
    setOutfit(
      run,
      "energy cell",
      preferredWeapon === "laser rifle" || preferredWeapon === "plasma rifle"
        ? energyCells
        : 0,
    );
  if (bullets > 0)
    setOutfit(
      run,
      "bullets",
      preferredWeapon === "rifle" || preferredWeapon === "plasma rifle"
        ? bullets
        : 0,
    );
  if (outfitAmount(run, "grenade") > grenades) {
    setOutfit(run, "grenade", grenades);
  } else if (grenades > 0) {
    setOutfit(run, "grenade", grenades);
  }
  if (bolas > 0) setOutfit(run, "bolas", bolas);
  let recoverySlots = medicineTarget;
  for (const recovery of ["hypo", "medicine"] as const) {
    const available = Math.min(recoverySlots, storeAmount(run, recovery));
    if (available > 0) setOutfit(run, recovery, available);
    recoverySlots -= available;
  }
  const pathBeforeFood = studySnapshot(run, "path").path;
  const meatTarget = Math.floor(pathBeforeFood.capacity - pathBeforeFood.used);
  setOutfit(run, "cured meat", meatTarget);
  run.checkpoint(
    `executioner:outfit:${phase}:grenade=${outfitAmount(run, "grenade")}/${storeAmount(run, "grenade")}:weight=${studySnapshot(run, "path").path.used}/${studySnapshot(run, "path").path.capacity}`,
  );
  return preferredWeapon;
}

function fabricateExecutionerUpgrade(
  run: StudyRun,
  name: "kinetic armour" | "plasma rifle" | "disruptor" | "hypo" | "stim",
): void {
  run.session.setLocation("fabricator");
  const recipe = studySnapshot(run, "fabricator").craftables.find(
    (candidate) => candidate.name === name,
  );
  if (!recipe || recipe.disabled) {
    throw new Error(`${name} unavailable after Executioner return`);
  }
  run.session.fabricate(recipe.key);
  if (storeAmount(run, name) < 1) {
    throw new Error(`${name} fabrication did not produce the upgrade`);
  }
}

function fabricateExecutionerItemIfAvailable(
  run: StudyRun,
  name: "disruptor",
): boolean {
  run.session.setLocation("fabricator");
  const recipe = studySnapshot(run, "fabricator").craftables.find(
    (candidate) => candidate.name === name,
  );
  if (!recipe || recipe.disabled) return false;
  const before = storeAmount(run, name);
  run.session.fabricate(recipe.key);
  return storeAmount(run, name) > before;
}

function reenterLandmark(run: StudyRun, route: Direction[]): void {
  const finalStep = route.at(-1);
  if (!finalStep) throw new Error("cannot re-enter an empty landmark route");
  run.session.moveWorld(oppositeDirection(finalStep));
  if (studySnapshot(run, "event")) {
    run.result.incidentalEvents += 1;
    resolveIncidentalEvent(run);
  }
  run.session.moveWorld(finalStep);
}

function requireEvent(run: StudyRun, eventKey: string, sceneKey: string): void {
  const event = studySnapshot(run, "event");
  if (event?.eventKey !== eventKey || event.sceneKey !== sceneKey) {
    throw new Error(
      `expected ${eventKey}/${sceneKey} after landmark re-entry, got ${event?.eventKey ?? "none"}/${event?.sceneKey ?? "none"}`,
    );
  }
}

function completeExecutionerWing(
  run: StudyRun,
  wing: "engineering" | "medical" | "martial",
  preferredWeapon: string,
): boolean {
  const initialEvent = studySnapshot(run, "event");
  run.checkpoint(
    `executioner:${wing}-branch:${initialEvent?.eventKey ?? "none"}:grenade=${outfitAmount(run, "grenade")}`,
  );

  const exitLabels = new Set(["leave", "go home", "run"]);
  for (let step = 0; step < 240; step += 1) {
    let event = studySnapshot(run, "event");
    if (!event) {
      return run.session.getStateForTest(`game.world.${wing}`) === true;
    }
    if (!event.eventKey.startsWith(`executioner.${wing}`)) {
      throw new Error(
        `${wing} route escaped to ${event.eventKey}/${event.sceneKey}`,
      );
    }
    if (wing === "martial" && event.sceneKey === "branch") {
      run.checkpoint(
        `executioner:martial-choice:${event.eventKey}:grenade=${outfitAmount(run, "grenade")}:buttons=${event.buttons.map((button) => `${button.key}:${button.disabled}`).join(",")}`,
      );
    }
    if (event.combat?.phase === "fighting") {
      fight(run, preferredWeapon, 35);
      continue;
    }
    if (event.combat?.phase === "exploding") {
      run.advance(3_000, false);
      continue;
    }
    if (event.combat?.phase === "won") {
      takePriorityCombatLoot(run, wing === "medical");
      collectCombatOutcome(run);
      event = studySnapshot(run, "event");
      if (!event) {
        return run.session.getStateForTest(`game.world.${wing}`) === true;
      }
      // A won combat may immediately expose its scene continuation. Process
      // that button below instead of repeatedly observing the won snapshot.
      if (
        event.combat?.phase === "fighting" ||
        event.combat?.phase === "exploding"
      ) {
        continue;
      }
    }
    if (event.loot) {
      takeEverything(run);
      takePriorityLoot(run, wing === "medical");
      event = studySnapshot(run, "event");
      if (!event) {
        return run.session.getStateForTest(`game.world.${wing}`) === true;
      }
      if (!event.loot) continue;
    }
    if (
      event.eventKey === "executioner.engineering-rd-blueprint" &&
      event.sceneKey === "start"
    ) {
      run.checkpoint(
        `executioner:engineering-rd-start:health=${String(run.session.getStateForTest("game.world.health"))}:alloy=${outfitAmount(run, "alien alloy")}/${storeAmount(run, "alien alloy")}:buttons=${event.buttons.map((candidate) => `${candidate.key}:${candidate.disabled}`).join(",")}`,
      );
    }
    const enabled = event.buttons.filter((button) => !button.disabled);
    const recoveryMachine = enabled.find(
      (candidate) =>
        candidate.key === "use" && candidate.text === "use machine",
    );
    const shouldUseRecoveryMachine =
      recoveryMachine !== undefined &&
      Number(run.session.getStateForTest("game.world.health")) < 45;
    if (shouldUseRecoveryMachine) {
      run.checkpoint(
        `executioner:${wing}-recovery-machine:health=${String(run.session.getStateForTest("game.world.health"))}:alloy=${outfitAmount(run, "alien alloy")}`,
      );
    }
    const button =
      (shouldUseRecoveryMachine ? recoveryMachine : undefined) ??
      enabled.find((candidate) => candidate.key === "continue") ??
      enabled.find((candidate) => candidate.key === "fight") ??
      enabled.find((candidate) => !exitLabels.has(candidate.text)) ??
      enabled[0];
    if (!button) {
      throw new Error(
        `${wing} event ${event.eventKey}/${event.sceneKey} has no legal choice`,
      );
    }
    run.session.chooseEventButton(button.key);
  }
  throw new Error(`${wing} route exceeded 240 decisions`);
}

function takePriorityCombatLoot(
  run: StudyRun,
  preserveRecoverySupplies = false,
): void {
  const priorities = [
    "fleet beacon",
    ...(preserveRecoverySupplies ? ["cured meat"] : []),
    "plasma rifle blueprint",
    "disruptor blueprint",
    "kinetic armour blueprint",
    "hypo blueprint",
    "stim blueprint",
    "grenade",
    "bolas",
    "alien alloy",
    ...(preserveRecoverySupplies ? [] : ["energy cell"]),
  ];
  const discardOrder = [
    "cloth",
    "leather",
    "teeth",
    "scales",
    "iron",
    "steel",
    ...(preserveRecoverySupplies ? ["energy cell"] : ["cured meat"]),
    "bullets",
    ...(preserveRecoverySupplies ? [] : ["medicine"]),
  ];

  for (let step = 0; step < 100; step += 1) {
    const combat = studySnapshot(run, "event")?.combat;
    if (combat?.phase !== "won") return;
    let selectedAction: string | null = null;
    for (const item of priorities) {
      if ((combat.loot[item] ?? 0) <= 0) continue;
      const direct = combat.actions.find(
        (action) => action.key === `take:${item}` && !action.disabled,
      );
      const exchanges = combat.actions.filter(
        (action) =>
          action.key.startsWith(`dropFor:${item}:`) && !action.disabled,
      );
      const exchange =
        discardOrder
          .map((discard) =>
            exchanges.find((action) =>
              action.key.startsWith(`dropFor:${item}:${discard}`),
            ),
          )
          .find((action) => action !== undefined) ??
        (preserveRecoverySupplies ? undefined : exchanges[0]);
      selectedAction = direct?.key ?? exchange?.key ?? null;
      if (selectedAction) break;
    }
    if (!selectedAction) return;
    run.session.chooseEventCombatAction(selectedAction);
  }
  throw new Error("priority combat loot exchange exceeded 100 decisions");
}

function takePriorityLoot(
  run: StudyRun,
  preserveRecoverySupplies = false,
): void {
  const priorities = [
    "fleet beacon",
    ...(preserveRecoverySupplies ? ["cured meat"] : []),
    "plasma rifle blueprint",
    "disruptor blueprint",
    "kinetic armour blueprint",
    "hypo blueprint",
    "stim blueprint",
    "grenade",
    "bolas",
    "alien alloy",
    ...(preserveRecoverySupplies ? [] : ["energy cell"]),
  ];
  const discardOrder = [
    "cloth",
    "leather",
    "teeth",
    "scales",
    "iron",
    "steel",
    ...(preserveRecoverySupplies ? ["energy cell"] : ["cured meat"]),
    "bullets",
    ...(preserveRecoverySupplies ? [] : ["medicine"]),
  ];

  for (let step = 0; step < 100; step += 1) {
    const loot = studySnapshot(run, "event")?.loot;
    if (!loot) return;
    let selectedAction: string | null = null;
    for (const item of priorities) {
      if ((loot.loot[item] ?? 0) <= 0) continue;
      const direct = loot.actions.find(
        (action) => action.key === `take:${item}` && !action.disabled,
      );
      const exchanges = loot.actions.filter(
        (action) =>
          action.key.startsWith(`dropFor:${item}:`) && !action.disabled,
      );
      const exchange =
        discardOrder
          .map((discard) =>
            exchanges.find((action) =>
              action.key.startsWith(`dropFor:${item}:${discard}`),
            ),
          )
          .find((action) => action !== undefined) ??
        (preserveRecoverySupplies ? undefined : exchanges[0]);
      selectedAction = direct?.key ?? exchange?.key ?? null;
      if (selectedAction) break;
    }
    if (!selectedAction) return;
    run.session.chooseEventLootAction(selectedAction);
  }
  throw new Error("priority loot exchange exceeded 100 decisions");
}

function classifyFailure(
  bottleneck: string,
): "policy" | "game-defect" | "unclassified" {
  if (
    /(?:did not unlock|lift-off failed|space did not reach ending|blueprint did not unlock|generated World map unavailable|no route to)/.test(
      bottleneck,
    )
  ) {
    return "game-defect";
  }
  if (
    /(?:unavailable|could not|exceeded|exhausted|died|ended after|missing|no safe choice|no legal)/.test(
      bottleneck,
    )
  ) {
    return "policy";
  }
  return "unclassified";
}

function completeShipRoute(run: StudyRun): void {
  const route = requireRoute(worldMap(run), "W");
  for (const item of [
    "rifle",
    "laser rifle",
    "plasma rifle",
    "bayonet",
    "bullets",
    "energy cell",
    "medicine",
    "hypo",
    "grenade",
    "bolas",
    "charm",
    "alien alloy",
    "torch",
    "cured meat",
  ]) {
    if (outfitAmount(run, item) > 0) setOutfit(run, item, 0);
  }
  if (storeAmount(run, "plasma rifle") > 0) {
    setOutfit(run, "plasma rifle", 1);
  }
  let recoverySlots = 10;
  for (const recovery of ["hypo", "medicine"] as const) {
    const available = Math.min(recoverySlots, storeAmount(run, recovery));
    if (available > 0) setOutfit(run, recovery, available);
    recoverySlots -= available;
  }
  const pathBeforeFood = studySnapshot(run, "path").path;
  setOutfit(
    run,
    "cured meat",
    Math.floor(pathBeforeFood.capacity - pathBeforeFood.used),
  );
  embark(run);
  followRoute(run, route, false);
  chooseEvent(run, "salvage");
  followRoute(run, route, true);
  if (!studySnapshot(run, "ship").unlocked)
    throw new Error("ship not unlocked");
  run.session.setLocation("ship");
  for (let reinforcement = 0; reinforcement < 5; reinforcement += 1) {
    const ship = studySnapshot(run, "ship");
    if (ship.hull >= 5 || !ship.canReinforce) break;
    run.session.reinforceShipHull();
  }
  const ship = studySnapshot(run, "ship");
  if (ship.hull < 1) throw new Error("ship hull could not be reinforced");
  run.checkpoint(
    `ship:prepared:hull=${ship.hull}:thrusters=${ship.thrusters}:alloy=${ship.alienAlloy}`,
  );
}

function completeSpace(run: StudyRun): void {
  run.session.requestShipLiftOff();
  run.session.confirmShipLiftOff();
  if (!studySnapshot(run, "space").active) throw new Error("lift-off failed");
  for (let tick = 0; tick < 650; tick += 1) {
    const flight = studySnapshot(run, "space");
    if (flight.phase === "ending") break;
    if (!flight.active || flight.phase !== "flying") {
      throw new Error(
        `space flight crashed at altitude ${flight.altitude} with hull ${flight.hull}`,
      );
    }
    moveSpaceToSafety(run, 100);
    run.advance(100, false);
  }
  const ending = studySnapshot(run, "space");
  if (ending.phase !== "ending") {
    throw new Error(
      `space ascent exceeded 65 seconds at altitude ${ending.altitude} with hull ${ending.hull}`,
    );
  }
  run.checkpoint(
    `space:ending:altitude=${ending.altitude}:hull=${ending.hull}/${ending.maxHull}`,
  );
}

function moveSpaceToSafety(run: StudyRun, horizonMs: number): void {
  const flight = studySnapshot(run, "space");
  const threats = flight.asteroids.filter(
    (asteroid) =>
      asteroid.y <= flight.shipY &&
      asteroid.y + asteroid.speed * horizonMs + 37 >= flight.shipY,
  );
  const isSafe = (x: number): boolean =>
    threats.every((asteroid) => x < asteroid.x || x > asteroid.x + 20);
  if (isSafe(flight.shipX)) return;

  const speed = originalSpaceShipSpeed(studySnapshot(run, "ship").thrusters);
  const escapes = (["west", "east"] as const)
    .map((direction) => {
      let x = flight.shipX;
      for (let moves = 1; moves <= 200; moves += 1) {
        x =
          direction === "west"
            ? Math.max(SPACE_SHIP_MIN_POSITION, x - speed)
            : Math.min(SPACE_SHIP_MAX_POSITION, x + speed);
        if (isSafe(x)) return { direction, moves };
        if (x === SPACE_SHIP_MIN_POSITION || x === SPACE_SHIP_MAX_POSITION) {
          break;
        }
      }
      return null;
    })
    .filter((escape): escape is NonNullable<typeof escape> => escape !== null)
    .sort((left, right) => left.moves - right.moves);
  const escape = escapes[0];
  if (!escape) {
    throw new Error(
      `space policy found no safe lane at altitude ${flight.altitude}`,
    );
  }
  for (let move = 0; move < escape.moves; move += 1) {
    run.session.moveSpace(escape.direction);
  }
}

function chooseRoomAction(
  run: StudyRun,
  name: string,
  kind: "build" | "buy" | "either" = "either",
): boolean {
  const room = studySnapshot(run, "room").room;
  const build = [...room.buildOptions, ...room.craftOptions].find(
    (option) =>
      (option.name === name || option.key === name) && !option.disabled,
  );
  const buy = room.buyOptions.find(
    (option) =>
      (option.name === name || option.key === name) && !option.disabled,
  );
  if (kind !== "buy" && build) {
    ensureRoomWarm(run);
    run.session.build(build.key);
    return true;
  }
  if (kind !== "build" && buy) {
    run.session.buy(buy.key);
    return true;
  }
  return false;
}

function ensureRoomWarm(run: StudyRun): void {
  run.session.setLocation("room");
  for (let cycle = 0; cycle < 12; cycle += 1) {
    const room = studySnapshot(run, "room").room;
    if (room.temperatureValue > 1) return;
    if (room.activeButton === "light fire") run.session.lightFire();
    else run.session.stokeFire();
    run.advance(30_000);
  }
  throw new Error("room could not be warmed for crafting");
}

function requireRoomAction(run: StudyRun, name: string): void {
  if (!chooseRoomAction(run, name)) {
    throw new Error(`${name} was unavailable`);
  }
}

function buyUntil(run: StudyRun, store: string, target: number): void {
  let attempts = 0;
  while (storeAmount(run, store) < target && attempts < target + 20) {
    if (!chooseRoomAction(run, store, "buy")) break;
    attempts += 1;
  }
}

function trapUntil(
  run: StudyRun,
  store: string,
  target: number,
  attempts: number,
): void {
  ensureTraps(run, 5);
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (storeAmount(run, store) >= target) return;
    ensureTraps(run, 5);
    run.session.setLocation("outside");
    run.session.checkTraps();
    if (storeAmount(run, store) >= target) return;
    run.advance(90_000);
  }
  throw new Error(
    `${store} did not drop after ${attempts} trap checks (traps=${String(
      run.session.getStateForTest('game.buildings["trap"]'),
    )}, cooldown=${studySnapshot(run, "outside").outside.trapCooldown.remainingMs})`,
  );
}

function ensureTraps(run: StudyRun, target: number): void {
  for (let cycle = 0; cycle < 40; cycle += 1) {
    const current = run.session.getStateForTest('game.buildings["trap"]');
    if (typeof current === "number" && current >= target) return;
    run.session.setLocation("room");
    if (!chooseRoomAction(run, "trap", "build")) {
      run.session.setLocation("outside");
      run.session.gatherWood();
      run.advance(5 * 60_000);
    }
  }
  throw new Error(`could not rebuild ${target} traps`);
}

function ensureWorkshopMaterials(run: StudyRun): void {
  for (let cycle = 0; cycle < 16; cycle += 1) {
    run.session.setLocation("room");
    buyUntil(run, "scales", 10);
    if (storeAmount(run, "scales") < 10) {
      run.checkpoint(`workshop:recover-scales:${storeAmount(run, "scales")}`);
      trapUntil(run, "scales", 10, 40);
    }
    const workshop = studySnapshot(run, "room").room.buildOptions.find(
      (option) => option.name === "workshop",
    );
    if (workshop && !workshop.disabled) return;

    run.session.setLocation("outside");
    drainWorker(run, "charcutier");
    drainWorker(run, "hunter");
    drainWorker(run, "tanner");
    const population = studySnapshot(run, "outside").outside.population;
    const tanners = Math.min(10, Math.floor(population / 3));
    const hunters = Math.min(30, Math.max(0, population - tanners));
    assignWorker(run, "tanner", tanners);
    assignWorker(run, "hunter", hunters);
    run.advance(30 * 60_000);
  }
  throw new Error(
    `workshop materials unavailable after eight hours (wood=${storeAmount(run, "wood")}, leather=${storeAmount(run, "leather")}, scales=${storeAmount(run, "scales")})`,
  );
}

function storeAmount(run: StudyRun, store: string): number {
  const value = run.session.getStateForTest(`stores["${store}"]`);
  return typeof value === "number" ? value : 0;
}

function outfitAmount(run: StudyRun, item: string): number {
  const value = run.session.getStateForTest(`outfit["${item}"]`);
  return typeof value === "number" ? value : 0;
}

function worker(run: StudyRun, name: string) {
  return studySnapshot(run, "outside").outside.workerRows.find(
    (row) => row.name === name,
  );
}

function increaseWorker(run: StudyRun, name: string, amount: number): void {
  const row = worker(run, name);
  if (row?.canIncrease) run.session.increaseWorker(row.key, amount);
}

function decreaseWorker(run: StudyRun, name: string, amount: number): void {
  const row = worker(run, name);
  if (row?.canDecrease) run.session.decreaseWorker(row.key, amount);
}

function drainWorker(run: StudyRun, name: string): void {
  for (let attempts = 0; attempts < 100; attempts += 1) {
    const row = worker(run, name);
    if (!row || row.value <= 0) return;
    run.session.decreaseWorker(row.key, Math.min(10, row.value));
  }
  throw new Error(`could not drain ${name}`);
}

function assignWorker(run: StudyRun, name: string, target: number): void {
  for (let attempts = 0; attempts < target + 10; attempts += 1) {
    const row = worker(run, name);
    if (!row || row.value >= target) return;
    run.session.increaseWorker(row.key, Math.min(10, target - row.value));
  }
}

function setOutfit(run: StudyRun, name: string, target: number): void {
  if (name === "cured meat" && target > 0) {
    ensureCuredMeat(run, target);
  }
  run.session.setLocation("path");
  for (let attempts = 0; attempts < 200; attempts += 1) {
    const supply = studySnapshot(run, "path").path.supplies.find(
      (candidate) => candidate.name === name,
    );
    const current = supply?.outfit ?? 0;
    if (current === target) return;
    if (!supply) throw new Error(`outfit item ${name} missing`);
    const delta = Math.abs(target - current);
    if (current < target) run.session.increaseSupply(supply.key, delta);
    else run.session.decreaseSupply(supply.key, delta);
    const next = studySnapshot(run, "path").path.supplies.find(
      (candidate) => candidate.key === supply.key,
    )?.outfit;
    if (next === current) break;
  }
  throw new Error(`could not set ${name} outfit to ${target}`);
}

function ensureCuredMeat(run: StudyRun, target: number): void {
  ensureWorkerUnlocked(run, "charcutier", "smokehouse");
  for (let cycle = 0; cycle < 12; cycle += 1) {
    if (storeAmount(run, "cured meat") >= target) return;
    run.session.setLocation("outside");
    drainWorker(run, "tanner");
    drainWorker(run, "hunter");
    drainWorker(run, "charcutier");
    drainWorker(run, "iron miner");
    drainWorker(run, "coal miner");
    drainWorker(run, "sulphur miner");
    drainWorker(run, "steelworker");
    const population = studySnapshot(run, "outside").outside.population;
    const charcutiers = Math.min(5, Math.floor(population / 3));
    const hunters = Math.min(30, Math.max(0, population - charcutiers));
    assignWorker(run, "charcutier", charcutiers);
    assignWorker(run, "hunter", hunters);
    run.advance(10 * 60_000);
  }
  throw new Error(
    `could not produce ${target} cured meat (population=${studySnapshot(run, "outside").outside.population}, workers=${studySnapshot(
      run,
      "outside",
    )
      .outside.workerRows.map((row) => `${row.name}:${row.value}`)
      .join(",")}, meat=${storeAmount(run, "meat")})`,
  );
}

function ensureWorkerUnlocked(
  run: StudyRun,
  workerName: string,
  building: string,
): void {
  for (let cycle = 0; cycle < 8; cycle += 1) {
    if (worker(run, workerName)) return;
    run.session.setLocation("room");
    if (chooseRoomAction(run, building, "build") && worker(run, workerName)) {
      return;
    }
    run.session.setLocation("outside");
    run.session.gatherWood();
    run.advance(30 * 60_000);
  }
  throw new Error(`${building} did not unlock ${workerName}`);
}

function embark(run: StudyRun): void {
  run.session.embark();
  if (run.session.getStateForTest("game.world.active") !== true)
    throw new Error("embark failed");
}

type Direction = "north" | "south" | "east" | "west";

function worldMap(run: StudyRun): string[][] {
  const map = run.session.getStateForTest("game.world.map");
  if (!Array.isArray(map)) throw new Error("generated World map unavailable");
  return map as string[][];
}

function requireRoute(map: string[][], tile: string): Direction[] {
  const route = routeToTile(map, tile);
  if (!route) throw new Error(`no route to ${tile}`);
  return route;
}

function followRoute(
  run: StudyRun,
  route: Direction[],
  reverse: boolean,
  emergencyHealThreshold = 25,
  stunEnemyThreshold = 70,
): void {
  const steps = reverse ? [...route].reverse().map(oppositeDirection) : route;
  for (let index = 0; index < steps.length; index += 1) {
    run.session.moveWorld(steps[index]!);
    const isTargetStep = !reverse && index === steps.length - 1;
    if (studySnapshot(run, "event") && !isTargetStep) {
      run.result.incidentalEvents += 1;
      resolveIncidentalEvent(run, emergencyHealThreshold, stunEnemyThreshold);
    }
    if (
      run.session.getStateForTest("game.world.active") !== true &&
      index < steps.length - 1
    ) {
      run.result.deaths += 1;
      throw new PolicyDeath(
        `expedition ended after ${index + 1}/${steps.length} moves`,
      );
    }
  }
}

function returnHomeViaOutpost(
  run: StudyRun,
  directRoute: Direction[],
  alwaysRefill = false,
): void {
  if (run.session.getStateForTest("game.world.active") !== true) return;
  const remainingWater = Number(
    run.session.getStateForTest("game.world.water"),
  );
  if (!alwaysRefill && remainingWater >= directRoute.length) {
    followRoute(run, directRoute, true);
    return;
  }

  const map = worldMap(run);
  const start = worldPosition(run);
  const toOutpost = routeFromPosition(
    map,
    start,
    (x, y) => map[x]?.[y] === "P",
  );
  if (!toOutpost) {
    throw new Error(
      `return needs resupply (${remainingWater}/${directRoute.length}) but no outpost is reachable`,
    );
  }
  run.checkpoint(
    `return:via-outpost:${toOutpost.length}/${directRoute.length}:water=${remainingWater}`,
  );
  followRoute(run, toOutpost, false);
  requireEvent(run, "setpiece.outpost", "start");
  takeEverything(run);
  chooseEvent(run, "leave");

  const homeRoute = routeFromPosition(
    worldMap(run),
    worldPosition(run),
    (x, y) => x === WORLD_RADIUS && y === WORLD_RADIUS,
  );
  if (!homeRoute) throw new Error("no legal route from outpost to village");
  followRoute(run, homeRoute, false);
}

function worldPosition(run: StudyRun): readonly [number, number] {
  const x = run.session.getStateForTest("game.world.x");
  const y = run.session.getStateForTest("game.world.y");
  if (typeof x !== "number" || typeof y !== "number") {
    throw new Error("world position unavailable");
  }
  return [x, y];
}

function routeFromPosition(
  map: string[][],
  start: readonly [number, number],
  isTarget: (x: number, y: number) => boolean,
): Direction[] | null {
  if (isTarget(start[0], start[1])) return [];
  const landmarks = new Set([
    "I",
    "C",
    "S",
    "H",
    "V",
    "O",
    "Y",
    "P",
    "W",
    "B",
    "F",
    "M",
    "U",
    "X",
  ]);
  const steps: ReadonlyArray<{
    direction: Direction;
    dx: number;
    dy: number;
  }> = [
    { direction: "east", dx: 1, dy: 0 },
    { direction: "west", dx: -1, dy: 0 },
    { direction: "south", dx: 0, dy: 1 },
    { direction: "north", dx: 0, dy: -1 },
  ];
  const queue = [{ x: start[0], y: start[1], route: [] as Direction[] }];
  const seen = new Set([`${start[0]},${start[1]}`]);
  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index]!;
    for (const step of steps) {
      const x = current.x + step.dx;
      const y = current.y + step.dy;
      const tile = map[x]?.[y];
      if (tile === undefined) continue;
      const route = [...current.route, step.direction];
      if (isTarget(x, y)) return route;
      const key = `${x},${y}`;
      if (seen.has(key) || landmarks.has(tile)) continue;
      seen.add(key);
      queue.push({ x, y, route });
    }
  }
  return null;
}

function routeToTile(map: string[][], target: string): Direction[] | null {
  const landmarks = new Set([
    "I",
    "C",
    "S",
    "H",
    "V",
    "O",
    "Y",
    "P",
    "W",
    "B",
    "F",
    "M",
    "U",
    "X",
  ]);
  const steps: ReadonlyArray<{
    direction: Direction;
    dx: number;
    dy: number;
  }> = [
    { direction: "east", dx: 1, dy: 0 },
    { direction: "west", dx: -1, dy: 0 },
    { direction: "south", dx: 0, dy: 1 },
    { direction: "north", dx: 0, dy: -1 },
  ];
  const queue = [
    { x: WORLD_RADIUS, y: WORLD_RADIUS, route: [] as Direction[] },
  ];
  const seen = new Set([`${WORLD_RADIUS},${WORLD_RADIUS}`]);
  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index]!;
    for (const step of steps) {
      const x = current.x + step.dx;
      const y = current.y + step.dy;
      const tile = map[x]?.[y];
      if (tile === undefined) continue;
      const route = [...current.route, step.direction];
      if (tile === target) return route;
      const key = `${x},${y}`;
      if (seen.has(key) || landmarks.has(tile)) continue;
      seen.add(key);
      queue.push({ x, y, route });
    }
  }
  return null;
}

function oppositeDirection(direction: Direction): Direction {
  if (direction === "north") return "south";
  if (direction === "south") return "north";
  if (direction === "east") return "west";
  return "east";
}

function chooseEvent(run: StudyRun, text: string): void {
  const event = studySnapshot(run, "event");
  const button = event?.buttons.find(
    (candidate) => candidate.text === text && !candidate.disabled,
  );
  if (!button) {
    throw new Error(
      `event choice ${JSON.stringify(text)} unavailable at ${event?.eventKey ?? "none"}/${event?.sceneKey ?? "none"}`,
    );
  }
  run.session.chooseEventButton(button.key);
}

function fight(
  run: StudyRun,
  preferredWeapon?: string,
  emergencyHealThreshold = 25,
  stunEnemyThreshold = 70,
): void {
  run.result.combats += 1;
  const opening = studySnapshot(run, "event");
  run.checkpoint(
    `combat:start:${opening?.eventKey ?? "unknown"}:${preferredWeapon ?? "auto"}:${opening?.combat?.playerHp ?? "?"}/${opening?.combat?.enemyHp ?? "?"}:heals=${outfitAmount(run, "cured meat")}/${outfitAmount(run, "medicine")}/${outfitAmount(run, "hypo")}`,
  );
  let lastCombatState: string;
  for (let actionCount = 0; actionCount < 960; actionCount += 1) {
    const event = studySnapshot(run, "event");
    const combat = event?.combat;
    if (!combat) return;
    if (combat.phase === "won") return;
    if (combat.phase === "exploding") {
      run.advance(3_000, false);
      continue;
    }
    const meat = combat.actions.find(
      (action) =>
        action.key === "heal:cured meat" &&
        !action.disabled &&
        combat.playerHp < combat.playerMaxHp,
    );
    const emergencyHeal = combat.actions.find(
      (action) =>
        action.kind === "heal" &&
        action.key !== "heal:cured meat" &&
        !action.disabled &&
        combat.playerHp <= emergencyHealThreshold,
    );
    const readyDefend = combat.actions.find(
      (action) => action.kind === "defend" && !action.disabled,
    );
    const defend = readyDefend;
    const attacks = combat.actions.filter(
      (action) => action.kind === "attack" && !action.disabled,
    );
    const stun =
      combat.enemyMaxHp >= stunEnemyThreshold
        ? (attacks.find((action) => action.key === "attack:disruptor") ??
          attacks.find((action) => action.key === "attack:bolas"))
        : undefined;
    const grenadeStrike =
      combat.enemyMaxHp >= 150 ||
      (combat.enemyHp <= 30 && combat.playerHp <= 15)
        ? attacks.find((action) => action.key === "attack:grenade")
        : undefined;
    const ordinaryAttacks = attacks.filter(
      (action) =>
        action.key !== "attack:grenade" &&
        action.key !== "attack:bolas" &&
        action.key !== "attack:disruptor",
    );
    const attack =
      attacks.find(
        (action) =>
          action.text === preferredWeapon ||
          action.key === `attack:${preferredWeapon}`,
      ) ??
      ordinaryAttacks.find((action) => action.key === "attack:steel sword") ??
      ordinaryAttacks.find((action) => action.key === "attack:iron sword") ??
      ordinaryAttacks.find((action) => action.key === "attack:bone spear") ??
      ordinaryAttacks.find((action) => action.key === "attack:plasma rifle") ??
      ordinaryAttacks.at(-1);
    const secondaryAttacks = ordinaryAttacks.filter(
      (candidate) => candidate.key !== attack?.key,
    );
    const damagingAttacks = [attack, ...secondaryAttacks].filter(
      (action): action is NonNullable<typeof action> => action !== undefined,
    );
    const weakestAttack = damagingAttacks
      .map((action) => ({
        action,
        damage:
          originalWorldWeapons.find(
            (weapon) => `attack:${weapon.key}` === action.key,
          )?.damage ?? Number.POSITIVE_INFINITY,
      }))
      .filter(
        (
          candidate,
        ): candidate is {
          action: (typeof damagingAttacks)[number];
          damage: number;
        } => typeof candidate.damage === "number",
      )
      .sort((left, right) => left.damage - right.damage)[0]?.action;
    const statusOrderedAttacks =
      combat.enemyStatus === "shield" && weakestAttack
        ? [
            weakestAttack,
            ...damagingAttacks.filter(
              (candidate) => candidate.key !== weakestAttack.key,
            ),
            grenadeStrike,
          ]
        : [grenadeStrike, ...damagingAttacks];
    const shouldHoldReflectedFire =
      combat.enemyMaxHp >= 500 &&
      combat.enemyStatus === "meditation" &&
      defend === undefined;
    const weapon = attack
      ? originalWorldWeapons.find(
          (candidate) => `attack:${candidate.key}` === attack.key,
        )
      : undefined;
    const attackDamage = typeof weapon?.damage === "number" ? weapon.damage : 0;
    const criticalMeat =
      combat.playerHp <= 15 &&
      (combat.enemyStatus === "shield" || combat.enemyHp > attackDamage)
        ? meat
        : undefined;
    const hasPackedMedicine =
      outfitAmount(run, "medicine") + outfitAmount(run, "hypo") > 0;
    const emergencyMeat =
      !hasPackedMedicine && combat.playerHp <= emergencyHealThreshold
        ? meat
        : undefined;
    const sustainingMeat =
      emergencyHealThreshold > 25 &&
      combat.enemyMaxHp >= 100 &&
      combat.playerHp <= 35
        ? meat
        : undefined;
    // Every weapon, healing item, and kinetic armour has an independent
    // cooldown. Model the visible commands independently so a ready secondary
    // weapon or recovery action cannot be skipped behind the preferred weapon.
    const recovery =
      emergencyHeal ?? emergencyMeat ?? sustainingMeat ?? criticalMeat;
    let acted = false;
    if (
      grenadeStrike !== undefined ||
      stun !== undefined ||
      (attack !== undefined && recovery !== undefined) ||
      defend !== undefined
    ) {
      const actions = [
        defend,
        ...(shouldHoldReflectedFire ? [] : statusOrderedAttacks),
        stun,
        recovery ?? (!attack && !stun ? meat : undefined),
      ];
      const availableActions = actions.filter(
        (action): action is NonNullable<typeof action> => action !== undefined,
      );
      lastCombatState = `${event.eventKey}:${combat.playerHp}/${combat.enemyHp}:${availableActions.map((action) => action.text).join("+") || "wait"}`;
      for (const action of availableActions) {
        run.session.chooseEventCombatAction(action.key);
        acted = true;
      }
    } else {
      const action = recovery ?? attack ?? meat ?? defend;
      lastCombatState = `${event.eventKey}:${combat.playerHp}/${combat.enemyHp}:${action?.text ?? "wait"}`;
      if (action) {
        run.session.chooseEventCombatAction(action.key);
        acted = true;
      }
    }
    run.advance(acted ? 1_000 : 250, false);
    if (
      run.session.getStateForTest("game.world.active") !== true ||
      !studySnapshot(run, "event")
    ) {
      run.result.deaths += 1;
      throw new PolicyDeath(`player died in combat (${lastCombatState})`);
    }
  }
  throw new Error(`combat exceeded 960 command polls (${lastCombatState!})`);
}

function takeEverything(run: StudyRun): void {
  const action = studySnapshot(run, "event")?.loot?.actions.find(
    (candidate) => candidate.key === "takeEverything" && !candidate.disabled,
  );
  if (action) run.session.chooseEventLootAction(action.key);
}

function collectCombatOutcome(run: StudyRun): void {
  for (let step = 0; step < 20; step += 1) {
    const event = studySnapshot(run, "event");
    if (event?.buttons.some((button) => !button.disabled)) return;
    const combat = event?.combat;
    if (!combat) return;
    if (combat.phase !== "won")
      throw new Error("combat outcome requested before victory");
    const action =
      combat.actions.find(
        (candidate) =>
          candidate.key === "takeEverything" && !candidate.disabled,
      ) ??
      combat.actions.find(
        (candidate) => candidate.kind === "take" && !candidate.disabled,
      ) ??
      combat.actions.find(
        (candidate) => candidate.kind === "leave" && !candidate.disabled,
      );
    if (action) run.session.chooseEventCombatAction(action.key);
    else run.advance(1_000, false);
  }
  throw new Error("combat victory outcome exceeded 20 decisions");
}

function leaveWonCombat(run: StudyRun): void {
  for (let step = 0; step < 20; step += 1) {
    const combat = studySnapshot(run, "event")?.combat;
    if (!combat) return;
    if (combat.phase !== "won") {
      throw new Error("combat leave requested before victory");
    }
    const leave = combat.actions.find(
      (candidate) => candidate.kind === "leave" && !candidate.disabled,
    );
    if (leave) {
      run.session.chooseEventCombatAction(leave.key);
      return;
    }
    run.advance(1_000, false);
  }
  throw new Error("combat victory leave exceeded 20 decisions");
}

function resolveIncidentalEvent(
  run: StudyRun,
  emergencyHealThreshold = 25,
  stunEnemyThreshold = 70,
): void {
  for (let step = 0; step < 80; step += 1) {
    const event = studySnapshot(run, "event");
    if (!event) return;
    if (event.combat?.phase === "fighting") {
      fight(run, undefined, emergencyHealThreshold, stunEnemyThreshold);
      continue;
    }
    if (event.combat?.phase === "exploding") {
      run.advance(3_000, false);
      continue;
    }
    if (event.combat?.phase === "won") {
      const combatAction =
        event.combat.actions.find(
          (candidate) => candidate.kind === "take" && !candidate.disabled,
        ) ??
        event.combat.actions.find(
          (candidate) => candidate.kind === "leave" && !candidate.disabled,
        );
      if (combatAction) {
        run.session.chooseEventCombatAction(combatAction.key);
        continue;
      }
    }
    takeEverything(run);
    const preferred = [
      "leave",
      "run",
      "go home",
      "go back inside",
      "ignore them",
      "ignore it",
      "turn him away",
      "tell him to leave",
      "say goodbye",
      "mourn",
    ];
    const button =
      preferred
        .map((text) =>
          event.buttons.find(
            (candidate) => candidate.text === text && !candidate.disabled,
          ),
        )
        .find(Boolean) ??
      event.buttons.find(
        (candidate) =>
          !candidate.disabled && Object.keys(candidate.cost).length === 0,
      ) ??
      event.buttons.find((candidate) => !candidate.disabled);
    if (!button) throw new Error(`event ${event.eventKey} has no safe choice`);
    run.session.chooseEventButton(button.key);
  }
  throw new Error("incidental event exceeded 80 decisions");
}
