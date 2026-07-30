import { originalFabricatorCraftables } from "../../content/original/lateGame/lateGameData";
import type {
  FabricatorCraftableDefinition,
  FabricatorCraftableType,
} from "../../content/original/lateGame/lateGameData";
import type { GameEngine } from "../GameEngine";
import type { GameNotification } from "../notifications/NotificationCenter";
import { readBoolean, readNumber } from "../state/selectors";

export const FABRICATOR_TITLE = "A Whirring Fabricator";
export const FABRICATOR_ARRIVAL_NOTIFICATION =
  "the familiar hum of wanderer machinery coming to life. finally, real tools.";

export interface FabricatorCraftableSnapshot {
  key: string;
  name: string;
  type: FabricatorCraftableType;
  cost: Record<string, number>;
  quantity: number;
  count: number;
  maximum?: number;
  blueprintRequired: boolean;
  disabled: boolean;
}

export interface FabricatorStoreSnapshot {
  key: string;
  value: number;
}

export interface FabricatorStateSnapshot {
  unlocked: boolean;
  title: typeof FABRICATOR_TITLE;
  blueprints: string[];
  craftables: FabricatorCraftableSnapshot[];
  stores: FabricatorStoreSnapshot[];
  notifications: GameNotification[];
}

/** Owns the original Fabricator recipes and player-facing fabrication flow. */
export class FabricatorRuntime {
  constructor(private readonly engine: GameEngine) {}

  navigationSnapshot(): Pick<FabricatorStateSnapshot, "unlocked" | "title"> {
    return {
      unlocked: this.isUnlocked(),
      title: FABRICATOR_TITLE,
    };
  }

  snapshot(): FabricatorStateSnapshot {
    const unlocked = this.isUnlocked();
    const availableDefinitions = unlocked
      ? originalFabricatorCraftables.filter((definition) =>
          this.hasRequiredBlueprint(definition),
        )
      : [];
    return {
      unlocked,
      title: FABRICATOR_TITLE,
      blueprints: unlocked
        ? originalFabricatorCraftables
            .filter(
              (definition) =>
                definition.blueprintRequired === true &&
                this.hasRequiredBlueprint(definition),
            )
            .map(({ name }) => name)
        : [],
      craftables: availableDefinitions.map((definition) =>
        this.craftableSnapshot(definition),
      ),
      stores: unlocked ? this.visibleStores() : [],
      notifications: this.engine.notifications.list("fabricator"),
    };
  }

  onArrival(): void {
    if (!this.isUnlocked()) return;
    if (
      readBoolean(
        this.engine.state.forRuntime("fabricator"),
        "game.fabricator.seen",
      )
    )
      return;
    this.engine.notifications.notify(
      "fabricator",
      FABRICATOR_ARRIVAL_NOTIFICATION,
    );
    this.engine.state
      .forRuntime("fabricator")
      .set("game.fabricator.seen", true);
  }

  fabricate(key: string): boolean {
    if (!this.isUnlocked()) return false;
    const definition = originalFabricatorCraftables.find(
      (candidate) => candidate.key === key,
    );
    if (!definition || !this.hasRequiredBlueprint(definition)) return false;

    const count = this.storeCount(definition.key);
    if (definition.maximum !== undefined && count >= definition.maximum) {
      return false;
    }

    for (const [resource, amount] of Object.entries(definition.cost)) {
      if (this.storeCount(resource) < amount) {
        this.engine.notifications.notify(
          "fabricator",
          `not enough ${resource}`,
        );
        return false;
      }
    }

    const remainingStores = Object.fromEntries(
      Object.entries(definition.cost).map(([resource, amount]) => [
        resource,
        this.storeCount(resource) - amount,
      ]),
    );
    this.engine.state.forRuntime("fabricator").setM("stores", remainingStores);
    this.engine.state
      .forRuntime("fabricator")
      .add(`stores["${definition.key}"]`, definition.quantity ?? 1);
    this.engine.notifications.notify("fabricator", definition.buildMsg);
    return true;
  }

  private craftableSnapshot(
    definition: FabricatorCraftableDefinition,
  ): FabricatorCraftableSnapshot {
    const count = this.storeCount(definition.key);
    const atMaximum =
      definition.maximum !== undefined && count >= definition.maximum;
    const affordable = Object.entries(definition.cost).every(
      ([resource, amount]) => this.storeCount(resource) >= amount,
    );
    return {
      key: definition.key,
      name: definition.name,
      type: definition.type,
      cost: { ...definition.cost },
      quantity: definition.quantity ?? 1,
      count,
      maximum: definition.maximum,
      blueprintRequired: definition.blueprintRequired === true,
      disabled: atMaximum || !affordable,
    };
  }

  private visibleStores(): FabricatorStoreSnapshot[] {
    const keys = [
      "alien alloy",
      ...originalFabricatorCraftables
        .filter(({ type }) => type !== "upgrade")
        .map(({ key }) => key),
    ];
    return keys
      .map((key) => ({ key, value: this.storeCount(key) }))
      .filter(({ value }) => value > 0);
  }

  private hasRequiredBlueprint(
    definition: FabricatorCraftableDefinition,
  ): boolean {
    return (
      definition.blueprintRequired !== true ||
      readBoolean(
        this.engine.state.forRuntime("fabricator"),
        `character.blueprints["${definition.key}"]`,
      )
    );
  }

  private isUnlocked(): boolean {
    return readBoolean(
      this.engine.state.forRuntime("fabricator"),
      "features.location.fabricator",
    );
  }

  private storeCount(key: string): number {
    return readNumber(
      this.engine.state.forRuntime("fabricator"),
      `stores["${key}"]`,
    );
  }
}
