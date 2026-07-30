import type { GameEngine } from "../GameEngine";
import type { Command } from "../commands/CommandBus";

export interface EconomyIncomeReadModel {
  readonly delay: number;
  readonly stores: Readonly<Record<string, number>>;
  readonly timeLeft: number;
}

export interface EconomyReadModel {
  readonly initialized: {
    readonly buildings: boolean;
    readonly population: boolean;
    readonly workers: boolean;
  };
  readonly unlocked: boolean;
  readonly seenForest: boolean;
  readonly population: number;
  readonly buildings: Readonly<Record<string, number>>;
  readonly workers: Readonly<Record<string, number>>;
  readonly stores: Readonly<Record<string, number>>;
  readonly income: Readonly<Record<string, EconomyIncomeReadModel>>;
  readonly worldUnlocked: boolean;
  readonly thieves: number | null;
  readonly stolen: Readonly<Record<string, number>>;
  readonly incomeMultiplier: 1 | 10;
}

export type EconomyCommand =
  | Command<"economy.initialize", Record<string, never>>
  | Command<"economy.markForestSeen", Record<string, never>>
  | Command<
      "economy.changeStores",
      { changes: Readonly<Record<string, number>>; silent?: boolean }
    >
  | Command<
      "economy.setBuilding",
      { key: string; value: number; silent?: boolean }
    >
  | Command<
      "economy.setWorker",
      { key: string; value: number; silent?: boolean }
    >
  | Command<
      "economy.changeWorker",
      { key: string; amount: number; silent?: boolean }
    >
  | Command<"economy.setPopulation", { value: number; silent?: boolean }>
  | Command<"economy.changePopulation", { amount: number; silent?: boolean }>
  | Command<
      "economy.setIncome",
      { key: string; value: EconomyIncomeReadModel; silent?: boolean }
    >
  | Command<
      "economy.setIncomeTimeLeft",
      { key: string; value: number; silent?: boolean }
    >
  | Command<"economy.startThieves", Record<string, never>>
  | Command<"economy.collectThieves", Record<string, never>>;

/** Owns every mutable StateStore path used by the Outside economy. */
export class EconomyDomainFacade {
  constructor(private readonly engine: Pick<GameEngine, "state">) {}

  read(): EconomyReadModel {
    const buildingsValue = this.engine.state
      .forRuntime("economy")
      .get("game.buildings");
    const populationValue = this.engine.state
      .forRuntime("economy")
      .get("game.population");
    const workersValue = this.engine.state
      .forRuntime("economy")
      .get("game.workers");

    return Object.freeze({
      initialized: Object.freeze({
        buildings: buildingsValue !== undefined,
        population: populationValue !== undefined,
        workers: workersValue !== undefined,
      }),
      unlocked:
        this.engine.state
          .forRuntime("economy")
          .get("features.location.outside") === true,
      seenForest:
        this.engine.state
          .forRuntime("economy")
          .get("game.outside.seenForest") === true,
      population: numberValue(populationValue),
      buildings: numericRecord(buildingsValue),
      workers: numericRecord(workersValue),
      stores: numericRecord(
        this.engine.state.forRuntime("economy").get("stores", true),
      ),
      income: incomeRecord(
        this.engine.state.forRuntime("economy").get("income", true),
      ),
      worldUnlocked:
        this.engine.state
          .forRuntime("economy")
          .get("features.location.world") === true,
      thieves: nullableNumber(
        this.engine.state.forRuntime("economy").get("game.thieves"),
      ),
      stolen: numericRecord(
        this.engine.state.forRuntime("economy").get("game.stolen", true),
      ),
      incomeMultiplier:
        this.engine.state
          .forRuntime("economy")
          .get("config.debug.incomeMultiplier", true) === 10
          ? 10
          : 1,
    });
  }

  dispatch(command: EconomyCommand): void {
    const state = this.engine.state.forRuntime("economy");
    switch (command.type) {
      case "economy.initialize":
        if (state.get("game.buildings") === undefined) {
          state.set("game.buildings", {}, true);
        }
        if (state.get("game.population") === undefined) {
          state.set("game.population", 0, true);
        }
        if (state.get("game.workers") === undefined) {
          state.set("game.workers", {}, true);
        }
        return;
      case "economy.markForestSeen":
        state.set("game.outside.seenForest", true);
        return;
      case "economy.changeStores":
        state.addM(
          "stores",
          { ...command.payload.changes },
          command.payload.silent,
        );
        return;
      case "economy.setBuilding":
        state.set(
          keyedPath("game.buildings", command.payload.key),
          command.payload.value,
          command.payload.silent,
        );
        return;
      case "economy.setWorker":
        state.set(
          keyedPath("game.workers", command.payload.key),
          command.payload.value,
          command.payload.silent,
        );
        return;
      case "economy.changeWorker":
        state.add(
          keyedPath("game.workers", command.payload.key),
          command.payload.amount,
          command.payload.silent,
        );
        return;
      case "economy.setPopulation":
        state.set(
          "game.population",
          command.payload.value,
          command.payload.silent,
        );
        return;
      case "economy.changePopulation":
        state.add(
          "game.population",
          command.payload.amount,
          command.payload.silent,
        );
        return;
      case "economy.setIncome":
        state.set(
          keyedPath("income", command.payload.key),
          {
            delay: command.payload.value.delay,
            stores: { ...command.payload.value.stores },
            timeLeft: command.payload.value.timeLeft,
          },
          command.payload.silent,
        );
        return;
      case "economy.setIncomeTimeLeft":
        state.set(
          `${keyedPath("income", command.payload.key)}.timeLeft`,
          command.payload.value,
          command.payload.silent,
        );
        return;
      case "economy.startThieves":
        if (state.get("game.thieves") !== undefined) return;
        state.set("game.thieves", 1, true);
        state.set("game.stolen", {}, true);
        state.set(
          'income["thieves"]',
          {
            delay: 10,
            stores: { wood: -10, fur: -5, meat: -5 },
            timeLeft: 10,
          },
          true,
        );
        return;
      case "economy.collectThieves": {
        const income = incomeRecord(state.get("income", true)).thieves;
        if (!income) return;
        const changes: Record<string, number> = {};
        const stolen: Record<string, number> = {};
        for (const [store, requested] of Object.entries(income.stores)) {
          if (requested >= 0) continue;
          const available = numberValue(state.get(`stores["${store}"]`, true));
          const amount = Math.min(available, -requested);
          changes[store] = -amount;
          stolen[store] = amount;
        }
        state.addM("stores", changes, true);
        state.addM("game.stolen", stolen, true);
        return;
      }
    }
  }
}

function numericRecord(value: unknown): Readonly<Record<string, number>> {
  if (!value || typeof value !== "object") return Object.freeze({});
  return Object.freeze(
    Object.fromEntries(
      Object.entries(value as Record<string, unknown>).filter(
        (entry): entry is [string, number] => typeof entry[1] === "number",
      ),
    ),
  );
}

function incomeRecord(
  value: unknown,
): Readonly<Record<string, EconomyIncomeReadModel>> {
  if (!value || typeof value !== "object") return Object.freeze({});
  const entries: [string, EconomyIncomeReadModel][] = [];
  for (const [key, candidate] of Object.entries(
    value as Record<string, unknown>,
  )) {
    if (!candidate || typeof candidate !== "object") continue;
    const record = candidate as Record<string, unknown>;
    if (
      typeof record.delay !== "number" ||
      typeof record.timeLeft !== "number"
    ) {
      continue;
    }
    entries.push([
      key,
      Object.freeze({
        delay: record.delay,
        stores: numericRecord(record.stores),
        timeLeft: record.timeLeft,
      }),
    ]);
  }
  return Object.freeze(Object.fromEntries(entries));
}

function numberValue(value: unknown): number {
  return typeof value === "number" ? value : 0;
}

function nullableNumber(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}

function keyedPath<const TParent extends string>(
  parent: TParent,
  key: string,
): `${TParent}["${string}"]` {
  if (key.includes('"')) throw new Error("State keys cannot contain quotes");
  return `${parent}["${key}"]`;
}
