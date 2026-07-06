import type { GameEngine } from "../GameEngine";
import type { GameNotification } from "../notifications/NotificationCenter";
import {
  originalRoomFireStates,
  originalRoomTemperatures,
  ROOM_LIGHT_FIRE_WOOD_COST,
  ROOM_STOKE_FIRE_WOOD_COST
} from "../../content/original/room/roomData";

export interface RoomStateSnapshot {
  title: "A Dark Room" | "A Firelit Room";
  fire: string;
  fireValue: number;
  temperature: string;
  temperatureValue: number;
  builderLevel: number;
  wood: number | undefined;
  activeButton: "light fire" | "stoke fire";
  notifications: GameNotification[];
}

const FIRE = {
  Dead: originalRoomFireStates[0],
  Smoldering: originalRoomFireStates[1],
  Flickering: originalRoomFireStates[2],
  Burning: originalRoomFireStates[3],
  Roaring: originalRoomFireStates[4]
} as const;

const TEMP = {
  Freezing: originalRoomTemperatures[0],
  Warm: originalRoomTemperatures[3]
} as const;

export class RoomRuntime {
  constructor(private readonly engine: GameEngine) {}

  initialize(): void {
    if (this.engine.state.get("features.location.room") === undefined) {
      this.engine.state.set("features.location.room", true, true);
    }
    if (this.engine.state.get("game.builder.level") === undefined) {
      this.engine.state.set("game.builder.level", -1, true);
    }
    if (this.engine.state.get("game.temperature.value") === undefined) {
      this.engine.state.set("game.temperature", TEMP.Freezing, true);
    }
    if (this.engine.state.get("game.fire.value") === undefined) {
      this.engine.state.set("game.fire", FIRE.Dead, true);
    }
  }

  snapshot(): RoomStateSnapshot {
    this.initialize();
    const fireValue = this.numberAt("game.fire.value");
    const temperatureValue = this.numberAt("game.temperature.value");
    const wood = this.engine.state.get("stores.wood");

    return {
      title: fireValue < FIRE.Flickering.value ? "A Dark Room" : "A Firelit Room",
      fire: this.fireText(fireValue),
      fireValue,
      temperature: this.temperatureText(temperatureValue),
      temperatureValue,
      builderLevel: this.numberAt("game.builder.level"),
      wood: typeof wood === "number" ? wood : undefined,
      activeButton: fireValue === FIRE.Dead.value ? "light fire" : "stoke fire",
      notifications: this.engine.notifications.list()
    };
  }

  lightFire(): boolean {
    this.initialize();
    const wood = this.engine.state.get("stores.wood");
    if (typeof wood === "number" && wood < ROOM_LIGHT_FIRE_WOOD_COST) {
      this.notify("not enough wood to get the fire going");
      return false;
    }
    if (typeof wood === "number") {
      this.engine.state.set("stores.wood", wood - ROOM_LIGHT_FIRE_WOOD_COST);
    }
    this.engine.state.set("game.fire", FIRE.Burning);
    this.onFireChange();
    return true;
  }

  stokeFire(): boolean {
    this.initialize();
    const wood = this.engine.state.get("stores.wood");
    if (wood === 0) {
      this.notify("the wood has run out");
      return false;
    }
    if (typeof wood === "number") {
      this.engine.state.set("stores.wood", wood - ROOM_STOKE_FIRE_WOOD_COST);
    }

    const fireValue = this.numberAt("game.fire.value");
    if (fireValue < FIRE.Roaring.value) {
      this.engine.state.set("game.fire", originalRoomFireStates[fireValue + 1]);
    }
    this.onFireChange();
    return true;
  }

  adjustTemperature(): void {
    this.initialize();
    const oldTemperature = this.numberAt("game.temperature.value");
    const fireValue = this.numberAt("game.fire.value");
    let nextTemperature = oldTemperature;

    if (oldTemperature > 0 && oldTemperature > fireValue) {
      nextTemperature -= 1;
    } else if (oldTemperature < TEMP.Warm.value + 1 && oldTemperature < fireValue) {
      nextTemperature += 1;
    }

    if (nextTemperature !== oldTemperature) {
      this.engine.state.set("game.temperature", originalRoomTemperatures[nextTemperature]);
      this.notify(`the room is ${this.temperatureText(nextTemperature)}`);
    }
  }

  advanceBuilder(): void {
    this.initialize();
    const builderLevel = this.numberAt("game.builder.level");
    const temperatureValue = this.numberAt("game.temperature.value");

    if (builderLevel === 0) {
      this.engine.state.set("game.builder.level", 1);
      this.notify("a ragged stranger stumbles through the door and collapses in the corner");
      return;
    }

    if (builderLevel < 3 && temperatureValue >= TEMP.Warm.value) {
      if (builderLevel === 1) {
        this.notify("the stranger shivers, and mumbles quietly. her words are unintelligible.");
        this.engine.state.set("game.builder.level", 2);
      } else if (builderLevel === 2) {
        this.notify("the stranger in the corner stops shivering. her breathing calms.");
        this.engine.state.set("game.builder.level", 3);
      }
    }
  }

  private onFireChange(): void {
    const fireValue = this.numberAt("game.fire.value");
    this.notify(`the fire is ${this.fireText(fireValue)}`);

    if (fireValue > FIRE.Smoldering.value && this.numberAt("game.builder.level") < 0) {
      this.engine.state.set("game.builder.level", 0);
      this.notify("the light from the fire spills from the windows, out into the dark");
    }
  }

  private notify(message: string): void {
    this.engine.notifications.notify("room", message);
  }

  private numberAt(path: string): number {
    const value = this.engine.state.get(path, true);
    return typeof value === "number" ? value : 0;
  }

  private fireText(value: number): string {
    return originalRoomFireStates[value]?.text ?? FIRE.Dead.text;
  }

  private temperatureText(value: number): string {
    return originalRoomTemperatures[value]?.text ?? TEMP.Freezing.text;
  }
}
