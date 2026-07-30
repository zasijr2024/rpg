import { originalPathReturnOutfitToStores } from "../path/pathOutfit";
import type { Command } from "../commands/CommandBus";
import type { GameEngine } from "../GameEngine";

export type CombatPerk =
  | "barbarian"
  | "boxer"
  | "evasive"
  | "gastronome"
  | "martial artist"
  | "precise"
  | "unarmed master";

export interface CombatReadModel {
  readonly health: number | null;
  readonly punches: number;
  readonly stores: Readonly<Record<string, number>>;
  readonly outfit: Readonly<Record<string, number>>;
  readonly perks: Readonly<Record<CombatPerk, boolean>>;
}

export type CombatCommand =
  | Command<"combat.setHealth", { value: number; maximum: number }>
  | Command<"combat.changeOutfit", { key: string; amount: number }>
  | Command<"combat.recordPunch", Record<string, never>>
  | Command<"combat.returnOutfit", Record<string, never>>
  | Command<"combat.setVictoryReturn", Record<string, never>>;

const COMBAT_PERKS: readonly CombatPerk[] = [
  "barbarian",
  "boxer",
  "evasive",
  "gastronome",
  "martial artist",
  "precise",
  "unarmed master",
];

/** Typed mutation and read boundary for persistent combat state. */
export class CombatDomainFacade {
  constructor(private readonly engine: GameEngine) {}

  read(): CombatReadModel {
    const health = this.engine.state
      .forRuntime("combat")
      .get("character.health");
    return Object.freeze({
      health: typeof health === "number" ? health : null,
      punches: numberValue(
        this.engine.state.forRuntime("combat").get("character.punches", true),
      ),
      stores: numericRecord(
        this.engine.state.forRuntime("combat").get("stores", true),
      ),
      outfit: numericRecord(
        this.engine.state.forRuntime("combat").get("outfit", true),
      ),
      perks: Object.freeze(
        Object.fromEntries(
          COMBAT_PERKS.map((perk) => [
            perk,
            this.engine.state
              .forRuntime("combat")
              .get(keyedPath("character.perks", perk), true) === true,
          ]),
        ) as Record<CombatPerk, boolean>,
      ),
    });
  }

  dispatch(command: CombatCommand): void {
    switch (command.type) {
      case "combat.setHealth":
        this.engine.state
          .forRuntime("combat")
          .set(
            "character.health",
            Math.max(
              0,
              Math.min(command.payload.maximum, command.payload.value),
            ),
          );
        return;
      case "combat.changeOutfit":
        this.engine.state
          .forRuntime("combat")
          .add(
            keyedPath("outfit", command.payload.key),
            command.payload.amount,
          );
        return;
      case "combat.recordPunch": {
        this.engine.state.forRuntime("combat").add("character.punches", 1);
        const punches = numberValue(
          this.engine.state.forRuntime("combat").get("character.punches", true),
        );
        const perk =
          punches === 50
            ? "boxer"
            : punches === 150
              ? "martial artist"
              : punches === 300
                ? "unarmed master"
                : null;
        if (perk)
          this.engine.state
            .forRuntime("combat")
            .set(keyedPath("character.perks", perk), true);
        return;
      }
      case "combat.returnOutfit":
        originalPathReturnOutfitToStores(this.engine);
        return;
      case "combat.setVictoryReturn":
        this.engine.state
          .forRuntime("combat")
          .set("game.world.returnLocation", "path");
        return;
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

function numberValue(value: unknown): number {
  if (value === true) return 1;
  return typeof value === "number" ? value : 0;
}

function keyedPath<const TParent extends string>(
  parent: TParent,
  key: string,
): `${TParent}["${string}"]` {
  if (key.includes('"')) throw new Error("State keys cannot contain quotes");
  return `${parent}["${key}"]`;
}
