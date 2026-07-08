import {
  originalBaitUsedForTraps,
  originalGatherWoodAmount,
  originalMaxPopulation,
  originalOutsideWorkerIncome,
  originalOutsideWorkerUnlocks,
  originalPopulationDelayMinutes,
  originalPopulationIncrease,
  originalPopulationMessageForArrivals,
  originalTrapDropCount,
  originalTrapDrops,
  originalVillageTitleForHuts,
  OUTSIDE_GATHER_DELAY,
  OUTSIDE_HUT_ROOM,
  OUTSIDE_TRAPS_DELAY,
} from "../../content/original/outside/outsideData";
import type { TimerId } from "../clock";
import type { CooldownSnapshot } from "../cooldowns/CooldownManager";
import type { GameEngine } from "../GameEngine";
import type { GameNotification } from "../notifications/NotificationCenter";

export interface OutsideStateSnapshot {
  unlocked: boolean;
  title: string;
  gatherCooldown: CooldownSnapshot;
  gatherAmount: number;
  trapCooldown: CooldownSnapshot;
  hasTraps: boolean;
  population: number;
  maxPopulation: number;
  villageRows: OutsideVillageRowSnapshot[];
  workerRows: OutsideWorkerRowSnapshot[];
  notifications: GameNotification[];
}

export interface OutsideVillageRowSnapshot {
  key: string;
  value: number;
}

export interface OutsideWorkerRowSnapshot {
  key: string;
  name: string;
  value: number;
  controlled: boolean;
  canIncrease: boolean;
  canDecrease: boolean;
  income: OutsideWorkerIncomeSnapshot[];
}

export interface OutsideWorkerIncomeSnapshot {
  store: string;
  amount: number;
  delay: number;
  text: string;
}

export interface OutsideRuntimeLifecycleSnapshot {
  populationTimerDueAt: number | null;
  incomeTimerDueAt: number | null;
}

export class OutsideRuntime {
  private populationTimer: TimerId | null = null;
  private incomeTimer: TimerId | null = null;

  constructor(private readonly engine: GameEngine) {}

  initialize(): void {
    if (!this.isUnlocked()) return;
    if (this.engine.state.get("game.buildings") === undefined) {
      this.engine.state.set("game.buildings", {}, true);
    }
    if (this.engine.state.get("game.population") === undefined) {
      this.engine.state.set("game.population", 0, true);
    }
    if (this.engine.state.get("game.workers") === undefined) {
      this.engine.state.set("game.workers", {}, true);
    }
    this.syncUnlockedWorkers();
    this.syncVillageIncome();
    this.schedulePopulationIfNeeded();
    this.scheduleWorkerIncome();
  }

  update(): void {
    this.initialize();
  }

  lifecycleSnapshot(): OutsideRuntimeLifecycleSnapshot {
    return {
      populationTimerDueAt: this.timerDueAt(this.populationTimer),
      incomeTimerDueAt: this.timerDueAt(this.incomeTimer),
    };
  }

  restoreLifecycle(snapshot: OutsideRuntimeLifecycleSnapshot | null): void {
    this.populationTimer = null;
    this.incomeTimer = null;

    if (!this.isUnlocked()) return;
    this.ensureBaseState();
    this.syncUnlockedWorkers();
    this.syncVillageIncome();

    if (
      snapshot?.populationTimerDueAt !== null &&
      snapshot?.populationTimerDueAt !== undefined
    ) {
      this.restorePopulationTimer(snapshot.populationTimerDueAt);
    } else {
      this.schedulePopulationIfNeeded();
    }

    if (
      snapshot?.incomeTimerDueAt !== null &&
      snapshot?.incomeTimerDueAt !== undefined
    ) {
      this.restoreWorkerIncome(snapshot.incomeTimerDueAt);
    } else {
      this.scheduleWorkerIncome();
    }
  }

  snapshot(): OutsideStateSnapshot {
    return {
      unlocked: this.isUnlocked(),
      title: originalVillageTitleForHuts(
        this.numberAt('game.buildings["hut"]'),
      ),
      gatherCooldown: this.engine.cooldowns.snapshot("gather wood"),
      gatherAmount: this.gatherAmount(),
      trapCooldown: this.engine.cooldowns.snapshot("check traps"),
      hasTraps: this.numberAt('game.buildings["trap"]') > 0,
      population: this.numberAt("game.population"),
      maxPopulation: this.maxPopulation(),
      villageRows: this.villageRows(),
      workerRows: this.workerRows(),
      notifications: this.engine.notifications
        .list()
        .filter((notification) => notification.source === "outside"),
    };
  }

  onArrival(): void {
    this.initialize();
    if (!this.isUnlocked()) return;
    if (this.engine.state.get("game.outside.seenForest") === true) return;
    this.notify("the sky is grey and the wind blows relentlessly");
    this.engine.state.set("game.outside.seenForest", true);
  }

  gatherWood(): boolean {
    this.initialize();
    if (!this.isUnlocked()) return false;
    if (this.engine.cooldowns.isActive("gather wood")) return false;

    this.notify("dry brush and dead branches litter the forest floor");
    this.engine.state.add("stores.wood", this.gatherAmount());
    this.engine.cooldowns.start("gather wood", OUTSIDE_GATHER_DELAY * 1000);
    return true;
  }

  checkTraps(): boolean {
    this.initialize();
    if (!this.isUnlocked()) return false;
    if (this.numberAt('game.buildings["trap"]') <= 0) return false;
    if (this.engine.cooldowns.isActive("check traps")) return false;

    const traps = this.numberAt('game.buildings["trap"]');
    const bait = this.numberAt("stores.bait");
    const drops: Record<string, number> = {};
    const messages: string[] = [];

    for (let i = 0; i < originalTrapDropCount(traps, bait); i += 1) {
      const roll = this.engine.rng.next();
      const drop = originalTrapDrops.find((entry) => roll < entry.rollUnder);
      if (!drop) continue;
      if (drops[drop.name] === undefined) {
        drops[drop.name] = 0;
        messages.push(drop.message);
      }
      drops[drop.name] += 1;
    }

    drops.bait = -originalBaitUsedForTraps(traps, bait);
    this.notify(`the traps contain ${this.joinTrapMessages(messages)}`);
    this.engine.state.addM("stores", drops);
    this.engine.cooldowns.start("check traps", OUTSIDE_TRAPS_DELAY * 1000);
    return true;
  }

  increaseWorker(worker: string, amount: number): boolean {
    this.initialize();
    if (!this.canControlWorker(worker)) return false;
    const increaseAmount = Math.min(
      this.getNumGatherers(),
      Math.max(0, amount),
    );
    if (increaseAmount <= 0) return false;
    this.engine.state.add(`game.workers["${worker}"]`, increaseAmount);
    this.syncVillageIncome();
    return true;
  }

  decreaseWorker(worker: string, amount: number): boolean {
    this.initialize();
    if (!this.canControlWorker(worker)) return false;
    const current = this.numberAt(`game.workers["${worker}"]`);
    const decreaseAmount = Math.min(current, Math.max(0, amount));
    if (decreaseAmount <= 0) return false;
    this.engine.state.add(`game.workers["${worker}"]`, -decreaseAmount);
    this.syncVillageIncome();
    return true;
  }

  increasePopulation(): void {
    this.initialize();
    const space = this.maxPopulation() - this.numberAt("game.population");
    const arrivals = originalPopulationIncrease(space, this.engine.rng.next());
    if (arrivals > 0) {
      this.notify(originalPopulationMessageForArrivals(arrivals));
      this.engine.state.add("game.population", arrivals);
      this.syncVillageIncome();
    }
    this.populationTimer = null;
    this.schedulePopulationIfNeeded();
  }

  killVillagers(count: number): void {
    this.initialize();
    this.engine.state.add("game.population", count * -1);
    if (this.numberAt("game.population") < 0) {
      this.engine.state.set("game.population", 0);
    }

    const remainingGatherers = this.getNumGatherers();
    if (remainingGatherers < 0) {
      let gap = -remainingGatherers;
      const workers = this.engine.state.get("game.workers", true);
      if (workers && typeof workers === "object") {
        for (const key of Object.keys(workers as Record<string, unknown>)) {
          const workersInJob = this.numberAt(`game.workers["${key}"]`);
          if (workersInJob < gap) {
            gap -= workersInJob;
            this.engine.state.set(`game.workers["${key}"]`, 0);
          } else {
            this.engine.state.add(`game.workers["${key}"]`, gap * -1);
            break;
          }
        }
      }
    }
    this.syncVillageIncome();
  }

  destroyHuts(count: number, allowEmpty = false): number {
    this.initialize();
    let dead = 0;

    for (let i = 0; i < count; i += 1) {
      const population = this.numberAt("game.population");
      const rate = population / OUTSIDE_HUT_ROOM;
      const fullHuts = Math.floor(rate);
      const huts = allowEmpty
        ? this.numberAt('game.buildings["hut"]')
        : Math.ceil(rate);
      if (!huts) break;

      const target = Math.floor(this.engine.rng.next() * huts) + 1;
      let inhabitants = 0;
      if (target <= fullHuts) {
        inhabitants = OUTSIDE_HUT_ROOM;
      } else if (target === fullHuts + 1) {
        inhabitants = population % OUTSIDE_HUT_ROOM;
      }

      this.engine.state.set(
        'game.buildings["hut"]',
        this.numberAt('game.buildings["hut"]') - 1,
      );
      if (inhabitants) {
        this.killVillagers(inhabitants);
        dead += inhabitants;
      }
    }

    return dead;
  }

  private syncUnlockedWorkers(): void {
    for (const [building, workers] of Object.entries(
      originalOutsideWorkerUnlocks,
    )) {
      if (this.numberAt(`game.buildings["${building}"]`) <= 0) continue;
      for (const worker of workers) {
        if (
          typeof this.engine.state.get(`game.workers["${worker}"]`) !== "number"
        ) {
          this.engine.state.set(`game.workers["${worker}"]`, 0, true);
        }
      }
    }
  }

  private ensureBaseState(): void {
    if (this.engine.state.get("game.buildings") === undefined) {
      this.engine.state.set("game.buildings", {}, true);
    }
    if (this.engine.state.get("game.population") === undefined) {
      this.engine.state.set("game.population", 0, true);
    }
    if (this.engine.state.get("game.workers") === undefined) {
      this.engine.state.set("game.workers", {}, true);
    }
  }

  private syncVillageIncome(): void {
    for (const worker of originalOutsideWorkerIncome) {
      const count =
        worker.key === "gatherer"
          ? this.getNumGatherers()
          : this.numberAt(`game.workers["${worker.key}"]`);
      if (
        worker.key !== "gatherer" &&
        typeof this.engine.state.get(`game.workers["${worker.key}"]`) !==
          "number"
      ) {
        continue;
      }
      this.engine.state.set(
        `income["${worker.key}"]`,
        {
          delay: worker.delay,
          stores: this.scaledStores(worker.stores, Math.max(0, count)),
        },
        true,
      );
    }
  }

  private schedulePopulationIfNeeded(): void {
    if (this.populationTimer !== null) return;
    if (this.numberAt('game.buildings["hut"]') <= 0) return;
    const delayMinutes = originalPopulationDelayMinutes(this.engine.rng.next());
    this.populationTimer = this.engine.clock.setTimeout(
      () => this.increasePopulation(),
      delayMinutes * 60 * 1000,
    );
  }

  private restorePopulationTimer(dueAt: number): void {
    this.populationTimer = this.engine.clock.setTimeout(
      () => this.increasePopulation(),
      this.remainingMs(dueAt),
    );
  }

  private scheduleWorkerIncome(delayMs = 1000): void {
    if (this.incomeTimer !== null) return;
    this.incomeTimer = this.engine.clock.setTimeout(() => {
      this.incomeTimer = null;
      this.collectWorkerIncome();
      this.scheduleWorkerIncome();
    }, delayMs);
  }

  private restoreWorkerIncome(dueAt: number): void {
    this.scheduleWorkerIncome(this.remainingMs(dueAt));
  }

  private collectWorkerIncome(): void {
    this.syncVillageIncome();
    for (const worker of originalOutsideWorkerIncome) {
      const income = this.engine.state.get(`income["${worker.key}"]`);
      if (income === null || typeof income !== "object") continue;
      const definition = income as {
        delay?: unknown;
        stores?: unknown;
        timeLeft?: unknown;
      };
      if (typeof definition.delay !== "number") continue;
      if (definition.stores === null || typeof definition.stores !== "object")
        continue;

      const timeLeft =
        typeof definition.timeLeft === "number" ? definition.timeLeft - 1 : -1;
      if (timeLeft > 0) {
        this.engine.state.set(
          `income["${worker.key}"].timeLeft`,
          timeLeft,
          true,
        );
        continue;
      }

      const stores = this.effectiveIncomeStores(
        definition.stores as Record<string, unknown>,
      );
      if (this.canApplyIncome(stores)) {
        this.engine.state.addM("stores", stores, true);
      }
      this.engine.state.set(
        `income["${worker.key}"].timeLeft`,
        definition.delay,
        true,
      );
    }
  }

  private effectiveIncomeStores(
    stores: Record<string, unknown>,
  ): Record<string, number> {
    const effective: Record<string, number> = {};
    for (const [store, amount] of Object.entries(stores)) {
      if (typeof amount !== "number" || amount === 0) continue;
      effective[store] = amount * this.incomeMultiplier();
    }
    return effective;
  }

  private canApplyIncome(stores: Record<string, number>): boolean {
    return Object.entries(stores).every(
      ([store, amount]) => this.numberAt(`stores["${store}"]`) + amount >= 0,
    );
  }

  private scaledStores(
    stores: Record<string, number>,
    workers: number,
  ): Record<string, number> {
    const scaled: Record<string, number> = {};
    for (const [store, amount] of Object.entries(stores)) {
      scaled[store] = amount * workers;
    }
    return scaled;
  }

  private gatherAmount(): number {
    return originalGatherWoodAmount(
      this.numberAt('game.buildings["cart"]') > 0,
    );
  }

  private villageRows(): OutsideVillageRowSnapshot[] {
    const buildings = this.engine.state.get("game.buildings", true);
    if (buildings === null || typeof buildings !== "object") return [];
    const rows: OutsideVillageRowSnapshot[] = [];
    for (const [key, value] of Object.entries(
      buildings as Record<string, unknown>,
    )) {
      if (typeof value !== "number" || value <= 0) continue;
      if (key === "trap") {
        const bait = this.numberAt("stores.bait");
        const unbaited = Math.max(0, value - bait);
        const baited = Math.min(value, bait);
        if (unbaited > 0) rows.push({ key: "trap", value: unbaited });
        if (baited > 0) rows.push({ key: "baited trap", value: baited });
      } else {
        rows.push({ key, value });
      }
    }
    return rows.sort((left, right) =>
      left.key < right.key ? -1 : left.key > right.key ? 1 : 0,
    );
  }

  private workerRows(): OutsideWorkerRowSnapshot[] {
    if (this.numberAt("game.population") <= 0) return [];

    const rows: OutsideWorkerRowSnapshot[] = [];
    rows.push(
      this.workerRow("gatherer", Math.max(0, this.getNumGatherers()), false),
    );

    const workers = this.engine.state.get("game.workers", true);
    if (workers && typeof workers === "object") {
      for (const key of Object.keys(
        workers as Record<string, unknown>,
      ).sort()) {
        rows.push(
          this.workerRow(key, this.numberAt(`game.workers["${key}"]`), true),
        );
      }
    }
    return rows;
  }

  private workerRow(
    key: string,
    value: number,
    controlled: boolean,
  ): OutsideWorkerRowSnapshot {
    const definition = originalOutsideWorkerIncome.find(
      (entry) => entry.key === key,
    );
    const stores = definition?.stores ?? {};
    const delay = definition?.delay ?? 10;
    return {
      key,
      name: definition?.name ?? key,
      value,
      controlled,
      canIncrease: controlled && this.getNumGatherers() > 0,
      canDecrease: controlled && value > 0,
      income: Object.entries(stores).map(([store, amount]) => {
        const effectiveAmount = amount * value * this.incomeMultiplier();
        return {
          store,
          amount: effectiveAmount,
          delay,
          text: `${effectiveAmount > 0 ? "+" : ""}${effectiveAmount} per ${delay}s`,
        };
      }),
    };
  }

  private joinTrapMessages(messages: string[]): string {
    if (messages.length <= 1) return messages[0] ?? "";
    if (messages.length === 2) return `${messages[0]} and ${messages[1]}`;
    return `${messages.slice(0, -1).join(", ")} and ${messages.at(-1)}`;
  }

  private getNumGatherers(): number {
    let gatherers = this.numberAt("game.population");
    const workers = this.engine.state.get("game.workers", true);
    if (workers && typeof workers === "object") {
      for (const value of Object.values(workers as Record<string, unknown>)) {
        if (typeof value === "number") gatherers -= value;
      }
    }
    return gatherers;
  }

  private canControlWorker(worker: string): boolean {
    return (
      worker !== "gatherer" &&
      originalOutsideWorkerIncome.some((entry) => entry.key === worker) &&
      typeof this.engine.state.get(`game.workers["${worker}"]`) === "number"
    );
  }

  private maxPopulation(): number {
    return originalMaxPopulation(this.numberAt('game.buildings["hut"]'));
  }

  private isUnlocked(): boolean {
    return this.engine.state.get("features.location.outside") === true;
  }

  private notify(message: string): void {
    this.engine.notifications.notify("outside", message);
  }

  private numberAt(path: string): number {
    const value = this.engine.state.get(path, true);
    return typeof value === "number" ? value : 0;
  }

  private incomeMultiplier(): 1 | 10 {
    return this.engine.state.get("config.debug.incomeMultiplier", true) === 10
      ? 10
      : 1;
  }

  private timerDueAt(id: TimerId | null): number | null {
    return this.engine.clock.timerSnapshot(id)?.dueAt ?? null;
  }

  private remainingMs(dueAt: number): number {
    return Math.max(0, dueAt - this.engine.clock.now());
  }
}
