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
import {
  EconomyDomainFacade,
  type EconomyIncomeReadModel,
} from "./EconomyDomain";

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
  private readonly economy: EconomyDomainFacade;

  constructor(
    private readonly engine: GameEngine,
    private readonly incomePaused: () => boolean = () => false,
  ) {
    this.economy = new EconomyDomainFacade(engine);
  }

  initialize(): void {
    if (!this.isUnlocked()) return;
    this.economy.dispatch({ type: "economy.initialize", payload: {} });
    this.syncUnlockedWorkers();
    this.syncVillageIncome();
    this.startThievesIfNeeded();
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
      title: originalVillageTitleForHuts(this.building("hut")),
      gatherCooldown: this.engine.cooldowns.snapshot("gather wood"),
      gatherAmount: this.gatherAmount(),
      trapCooldown: this.engine.cooldowns.snapshot("check traps"),
      hasTraps: this.building("trap") > 0,
      population: this.economy.read().population,
      maxPopulation: this.maxPopulation(),
      villageRows: this.villageRows(),
      workerRows: this.workerRows(),
      notifications: this.engine.notifications
        .list()
        .filter((notification) => notification.source === "outside"),
    };
  }

  navigationSnapshot(): Pick<OutsideStateSnapshot, "unlocked" | "title"> {
    return {
      unlocked: this.isUnlocked(),
      title: originalVillageTitleForHuts(this.building("hut")),
    };
  }

  onArrival(): void {
    this.initialize();
    if (!this.isUnlocked()) return;
    if (this.economy.read().seenForest) return;
    this.notify("the sky is grey and the wind blows relentlessly");
    this.economy.dispatch({ type: "economy.markForestSeen", payload: {} });
  }

  gatherWood(): boolean {
    this.initialize();
    if (!this.isUnlocked()) return false;
    if (this.engine.cooldowns.isActive("gather wood")) return false;

    this.notify("dry brush and dead branches litter the forest floor");
    this.economy.dispatch({
      type: "economy.changeStores",
      payload: { changes: { wood: this.gatherAmount() } },
    });
    this.engine.cooldowns.start("gather wood", OUTSIDE_GATHER_DELAY * 1000);
    return true;
  }

  checkTraps(): boolean {
    this.initialize();
    if (!this.isUnlocked()) return false;
    if (this.building("trap") <= 0) return false;
    if (this.engine.cooldowns.isActive("check traps")) return false;

    const traps = this.building("trap");
    const bait = this.store("bait");
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
    this.economy.dispatch({
      type: "economy.changeStores",
      payload: { changes: drops },
    });
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
    this.economy.dispatch({
      type: "economy.changeWorker",
      payload: { key: worker, amount: increaseAmount },
    });
    this.syncVillageIncome();
    return true;
  }

  decreaseWorker(worker: string, amount: number): boolean {
    this.initialize();
    if (!this.canControlWorker(worker)) return false;
    const current = this.worker(worker);
    const decreaseAmount = Math.min(current, Math.max(0, amount));
    if (decreaseAmount <= 0) return false;
    this.economy.dispatch({
      type: "economy.changeWorker",
      payload: { key: worker, amount: -decreaseAmount },
    });
    this.syncVillageIncome();
    return true;
  }

  increasePopulation(): void {
    this.initialize();
    const space = this.maxPopulation() - this.economy.read().population;
    const arrivals = originalPopulationIncrease(space, this.engine.rng.next());
    if (arrivals > 0) {
      this.notify(originalPopulationMessageForArrivals(arrivals));
      this.economy.dispatch({
        type: "economy.changePopulation",
        payload: { amount: arrivals },
      });
      this.syncVillageIncome();
    }
    this.populationTimer = null;
    this.schedulePopulationIfNeeded();
  }

  killVillagers(count: number): void {
    this.initialize();
    this.economy.dispatch({
      type: "economy.changePopulation",
      payload: { amount: count * -1 },
    });
    if (this.economy.read().population < 0) {
      this.economy.dispatch({
        type: "economy.setPopulation",
        payload: { value: 0 },
      });
    }

    const remainingGatherers = this.getNumGatherers();
    if (remainingGatherers < 0) {
      let gap = -remainingGatherers;
      const workers = this.economy.read().workers;
      if (workers) {
        for (const key of Object.keys(workers)) {
          const workersInJob = this.worker(key);
          if (workersInJob < gap) {
            gap -= workersInJob;
            this.economy.dispatch({
              type: "economy.setWorker",
              payload: { key, value: 0 },
            });
          } else {
            this.economy.dispatch({
              type: "economy.changeWorker",
              payload: { key, amount: gap * -1 },
            });
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
      const population = this.economy.read().population;
      const rate = population / OUTSIDE_HUT_ROOM;
      const fullHuts = Math.floor(rate);
      const huts = allowEmpty ? this.building("hut") : Math.ceil(rate);
      if (!huts) break;

      const target = Math.floor(this.engine.rng.next() * huts) + 1;
      let inhabitants = 0;
      if (target <= fullHuts) {
        inhabitants = OUTSIDE_HUT_ROOM;
      } else if (target === fullHuts + 1) {
        inhabitants = population % OUTSIDE_HUT_ROOM;
      }

      this.economy.dispatch({
        type: "economy.setBuilding",
        payload: { key: "hut", value: this.building("hut") - 1 },
      });
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
      if (this.building(building) <= 0) continue;
      for (const worker of workers) {
        if (!(worker in this.economy.read().workers)) {
          this.economy.dispatch({
            type: "economy.setWorker",
            payload: { key: worker, value: 0, silent: true },
          });
        }
      }
    }
  }

  private ensureBaseState(): void {
    this.economy.dispatch({ type: "economy.initialize", payload: {} });
  }

  private syncVillageIncome(): void {
    for (const worker of originalOutsideWorkerIncome) {
      const count =
        worker.key === "gatherer"
          ? this.getNumGatherers()
          : this.worker(worker.key);
      if (
        worker.key !== "gatherer" &&
        !(worker.key in this.economy.read().workers)
      ) {
        continue;
      }
      const existingIncome = this.economy.read().income[worker.key];
      this.economy.dispatch({
        type: "economy.setIncome",
        payload: {
          key: worker.key,
          value: {
            delay: worker.delay,
            stores: this.scaledStores(worker.stores, Math.max(0, count)),
            timeLeft: existingIncome?.timeLeft ?? worker.delay,
          },
          silent: true,
        },
      });
    }
  }

  private schedulePopulationIfNeeded(): void {
    if (this.populationTimer !== null) return;
    if (this.building("hut") <= 0) return;
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
    if (this.incomePaused()) return;
    // Worker and population commands keep the income definitions in sync.
    // Reading and rewriting every definition again on each one-second income
    // tick made long, otherwise ordinary catch-up windows quadratic in the
    // number of active jobs. Take one coherent read for this tick instead.
    const economy = this.economy.read();
    const availableStores = { ...economy.stores };
    const incomeMultiplier = economy.incomeMultiplier;
    for (const worker of originalOutsideWorkerIncome) {
      const definition = economy.income[worker.key];
      if (!definition) continue;

      const timeLeft = definition.timeLeft - 1;
      if (timeLeft > 0) {
        this.economy.dispatch({
          type: "economy.setIncomeTimeLeft",
          payload: { key: worker.key, value: timeLeft, silent: true },
        });
        continue;
      }

      const stores = this.effectiveIncomeStores(
        definition.stores,
        incomeMultiplier,
      );
      if (this.canApplyIncome(stores, availableStores)) {
        this.economy.dispatch({
          type: "economy.changeStores",
          payload: { changes: stores, silent: true },
        });
        for (const [store, amount] of Object.entries(stores)) {
          availableStores[store] = (availableStores[store] ?? 0) + amount;
        }
      }
      this.economy.dispatch({
        type: "economy.setIncomeTimeLeft",
        payload: { key: worker.key, value: definition.delay, silent: true },
      });
    }
    this.collectThiefIncome(economy.income.thieves, availableStores);
  }

  private startThievesIfNeeded(): void {
    const economy = this.economy.read();
    if (economy.thieves !== null || !economy.worldUnlocked) return;
    if (!Object.values(economy.stores).some((amount) => amount > 5_000)) return;
    this.economy.dispatch({ type: "economy.startThieves", payload: {} });
  }

  private collectThiefIncome(
    definition: EconomyIncomeReadModel | undefined,
    availableStores: Record<string, number>,
  ): void {
    if (!definition) return;
    const timeLeft = definition.timeLeft - 1;
    if (timeLeft > 0) {
      this.economy.dispatch({
        type: "economy.setIncomeTimeLeft",
        payload: { key: "thieves", value: timeLeft, silent: true },
      });
      return;
    }
    const changes: Record<string, number> = {};
    for (const [store, requested] of Object.entries(definition.stores)) {
      if (requested >= 0) continue;
      changes[store] = -Math.min(availableStores[store] ?? 0, -requested);
    }
    this.economy.dispatch({
      type: "economy.collectThieves",
      payload: {},
    });
    for (const [store, amount] of Object.entries(changes)) {
      availableStores[store] = (availableStores[store] ?? 0) + amount;
    }
    this.economy.dispatch({
      type: "economy.setIncomeTimeLeft",
      payload: { key: "thieves", value: definition.delay, silent: true },
    });
  }

  private effectiveIncomeStores(
    stores: Record<string, unknown>,
    incomeMultiplier = this.incomeMultiplier(),
  ): Record<string, number> {
    const effective: Record<string, number> = {};
    for (const [store, amount] of Object.entries(stores)) {
      if (typeof amount !== "number" || amount === 0) continue;
      effective[store] = amount * incomeMultiplier;
    }
    return effective;
  }

  private canApplyIncome(
    stores: Record<string, number>,
    availableStores?: Readonly<Record<string, number>>,
  ): boolean {
    return Object.entries(stores).every(
      ([store, amount]) =>
        (availableStores?.[store] ?? this.store(store)) + amount >= 0,
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
    return originalGatherWoodAmount(this.building("cart") > 0);
  }

  private villageRows(): OutsideVillageRowSnapshot[] {
    const buildings = this.economy.read().buildings;
    const rows: OutsideVillageRowSnapshot[] = [];
    for (const [key, value] of Object.entries(buildings)) {
      if (typeof value !== "number" || value <= 0) continue;
      if (key === "trap") {
        const bait = this.store("bait");
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
    if (this.economy.read().population <= 0) return [];

    const rows: OutsideWorkerRowSnapshot[] = [];
    rows.push(
      this.workerRow("gatherer", Math.max(0, this.getNumGatherers()), false),
    );

    const workers = this.economy.read().workers;
    if (workers) {
      for (const key of Object.keys(workers).sort()) {
        rows.push(this.workerRow(key, this.worker(key), true));
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
    let gatherers = this.economy.read().population;
    const workers = this.economy.read().workers;
    for (const value of Object.values(workers)) {
      gatherers -= value;
    }
    return gatherers;
  }

  private canControlWorker(worker: string): boolean {
    return (
      worker !== "gatherer" &&
      originalOutsideWorkerIncome.some((entry) => entry.key === worker) &&
      worker in this.economy.read().workers
    );
  }

  private maxPopulation(): number {
    return originalMaxPopulation(this.building("hut"));
  }

  private isUnlocked(): boolean {
    return this.economy.read().unlocked;
  }

  private notify(message: string): void {
    this.engine.notifications.notify("outside", message);
  }

  private building(key: string): number {
    return this.economy.read().buildings[key] ?? 0;
  }

  private worker(key: string): number {
    return this.economy.read().workers[key] ?? 0;
  }

  private store(key: string): number {
    return this.economy.read().stores[key] ?? 0;
  }

  private incomeMultiplier(): 1 | 10 {
    return this.economy.read().incomeMultiplier;
  }

  private timerDueAt(id: TimerId | null): number | null {
    return this.engine.clock.timerSnapshot(id)?.dueAt ?? null;
  }

  private remainingMs(dueAt: number): number {
    return Math.max(0, dueAt - this.engine.clock.now());
  }
}
