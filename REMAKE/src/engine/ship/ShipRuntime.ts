import {
  SHIP_ALLOY_PER_HULL,
  SHIP_ALLOY_PER_THRUSTER,
  SHIP_BASE_HULL,
  SHIP_BASE_THRUSTERS,
} from "../../content/original/lateGame/lateGameData";
import type { GameEngine } from "../GameEngine";
import type { GameNotification } from "../notifications/NotificationCenter";

export const SHIP_TITLE = "An Old Starship";
export const SHIP_ARRIVAL_NOTIFICATION =
  "somewhere above the debris cloud, the wanderer fleet hovers. been on this rock too long.";
export const SHIP_LIFTOFF_COOLDOWN_KEY = "ship.liftOff";

export interface ShipStateSnapshot {
  unlocked: boolean;
  title: typeof SHIP_TITLE;
  hull: number;
  thrusters: number;
  alienAlloy: number;
  reinforceCost: number;
  engineCost: number;
  canReinforce: boolean;
  canUpgradeEngine: boolean;
  canLiftOff: boolean;
  awaitingLiftOffConfirmation: boolean;
  liftOffCooldownMs: number;
  notifications: GameNotification[];
}

/** Owns the original Ship upgrade state and one-time departure warning. */
export class ShipRuntime {
  constructor(private readonly engine: GameEngine) {}

  navigationSnapshot(): Pick<ShipStateSnapshot, "unlocked" | "title"> {
    return {
      unlocked: this.isUnlocked(),
      title: SHIP_TITLE,
    };
  }

  snapshot(): ShipStateSnapshot {
    const unlocked = this.isUnlocked();
    const hull = unlocked ? this.hull() : SHIP_BASE_HULL;
    const thrusters = unlocked ? this.thrusters() : SHIP_BASE_THRUSTERS;
    const alienAlloy = this.alienAlloy();
    const liftOffCooldown = this.engine.cooldowns.snapshot(
      SHIP_LIFTOFF_COOLDOWN_KEY,
    );
    return {
      unlocked,
      title: SHIP_TITLE,
      hull,
      thrusters,
      alienAlloy,
      reinforceCost: SHIP_ALLOY_PER_HULL,
      engineCost: SHIP_ALLOY_PER_THRUSTER,
      canReinforce: unlocked && alienAlloy >= SHIP_ALLOY_PER_HULL,
      canUpgradeEngine: unlocked && alienAlloy >= SHIP_ALLOY_PER_THRUSTER,
      canLiftOff: unlocked && hull > 0 && !liftOffCooldown.active,
      awaitingLiftOffConfirmation:
        unlocked &&
        this.engine.state.get("game.spaceShip.awaitingLiftOffConfirmation") ===
          true,
      liftOffCooldownMs: liftOffCooldown.remainingMs,
      notifications: this.engine.notifications.list("ship"),
    };
  }

  onArrival(): void {
    if (!this.isUnlocked()) return;
    this.ensureBaseState();
    if (this.engine.state.get("game.spaceShip.seenShip") === true) return;
    this.engine.notifications.notify("ship", SHIP_ARRIVAL_NOTIFICATION);
    this.engine.state.set("game.spaceShip.seenShip", true);
  }

  reinforceHull(): boolean {
    if (!this.isUnlocked()) return false;
    this.ensureBaseState();
    if (!this.spendAlloy(SHIP_ALLOY_PER_HULL)) return false;
    this.engine.state.add("game.spaceShip.hull", 1);
    return true;
  }

  upgradeEngine(): boolean {
    if (!this.isUnlocked()) return false;
    this.ensureBaseState();
    if (!this.spendAlloy(SHIP_ALLOY_PER_THRUSTER)) return false;
    this.engine.state.add("game.spaceShip.thrusters", 1);
    return true;
  }

  requestLiftOff(): "confirm" | "ready" | false {
    if (!this.snapshot().canLiftOff) return false;
    if (this.engine.state.get("game.spaceShip.seenWarning") === true) {
      return "ready";
    }
    this.engine.state.set("game.spaceShip.awaitingLiftOffConfirmation", true);
    return "confirm";
  }

  confirmLiftOff(): boolean {
    if (!this.snapshot().canLiftOff) return false;
    if (
      this.engine.state.get("game.spaceShip.awaitingLiftOffConfirmation") !==
      true
    ) {
      return false;
    }
    this.engine.state.set("game.spaceShip.seenWarning", true);
    this.engine.state.set("game.spaceShip.awaitingLiftOffConfirmation", false);
    return true;
  }

  linger(): void {
    this.engine.state.set("game.spaceShip.awaitingLiftOffConfirmation", false);
  }

  private ensureBaseState(): void {
    if (typeof this.engine.state.get("game.spaceShip.hull") !== "number") {
      this.engine.state.set("game.spaceShip.hull", SHIP_BASE_HULL);
    }
    if (typeof this.engine.state.get("game.spaceShip.thrusters") !== "number") {
      this.engine.state.set("game.spaceShip.thrusters", SHIP_BASE_THRUSTERS);
    }
  }

  private spendAlloy(amount: number): boolean {
    const available = this.alienAlloy();
    if (available < amount) {
      this.engine.notifications.notify("ship", "not enough alien alloy");
      return false;
    }
    this.engine.state.set('stores["alien alloy"]', available - amount);
    return true;
  }

  private isUnlocked(): boolean {
    return this.engine.state.get("features.location.spaceShip") === true;
  }

  private hull(): number {
    const value = this.engine.state.get("game.spaceShip.hull");
    return typeof value === "number" ? value : SHIP_BASE_HULL;
  }

  private thrusters(): number {
    const value = this.engine.state.get("game.spaceShip.thrusters");
    return typeof value === "number" ? value : SHIP_BASE_THRUSTERS;
  }

  private alienAlloy(): number {
    const value = this.engine.state.get('stores["alien alloy"]');
    return typeof value === "number" ? value : 0;
  }
}
