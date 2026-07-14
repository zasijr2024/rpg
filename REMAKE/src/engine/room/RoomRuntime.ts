import type { GameEngine } from "../GameEngine";
import type { TimerId } from "../clock";
import type { GameNotification } from "../notifications/NotificationCenter";
import type { CooldownSnapshot } from "../cooldowns/CooldownManager";
import {
  type RoomCraftableDefinition,
  type RoomTradeGoodDefinition,
  originalRoomCraftables,
  originalRoomFireStates,
  originalRoomNeedsWorkshop,
  originalRoomTemperatures,
  originalRoomTradeGoods,
  originalRoomCost,
  ROOM_LIGHT_FIRE_WOOD_COST,
  ROOM_BUILDER_INCOME_DELAY,
  ROOM_BUILDER_STATE_DELAY,
  ROOM_BUILDER_WOOD_INCOME,
  ROOM_FIRE_COOL_DELAY,
  ROOM_NEED_WOOD_DELAY,
  ROOM_WARM_DELAY,
  ROOM_STOKE_COOLDOWN,
  ROOM_STOKE_FIRE_WOOD_COST,
} from "../../content/original/room/roomData";
import {
  type RoomActionKind,
  type RoomActionOptionSnapshot,
  type RoomStoreSnapshot,
  roomActionOption,
  roomItemCount,
  roomItemStatePath,
  roomStoreCategory,
  shouldShowRoomStore,
} from "./RoomSelectors";

export type { RoomActionKind, RoomActionOptionSnapshot, RoomStoreSnapshot };

export interface RoomStateSnapshot {
  title: "A Dark Room" | "A Firelit Room";
  fire: string;
  fireValue: number;
  temperature: string;
  temperatureValue: number;
  builderLevel: number;
  wood: number | undefined;
  activeButton: "light fire" | "stoke fire";
  activeCooldown: CooldownSnapshot;
  outsideUnlocked: boolean;
  stores: RoomStoreSnapshot[];
  income: RoomIncomeSnapshot[];
  buildOptions: RoomActionOptionSnapshot[];
  craftOptions: RoomActionOptionSnapshot[];
  buyOptions: RoomActionOptionSnapshot[];
  notifications: GameNotification[];
}

export interface RoomIncomeSnapshot {
  source: string;
  store: string;
  amount: number;
  delay: number;
  text: string;
}

export interface RoomRuntimeLifecycleSnapshot {
  initialized: boolean;
  fireTimerDueAt: number | null;
  tempTimerDueAt: number | null;
  builderTimerDueAt: number | null;
  needWoodTimerDueAt: number | null;
  incomeTimerDueAt: number | null;
}

const FIRE = {
  Dead: originalRoomFireStates[0],
  Smoldering: originalRoomFireStates[1],
  Flickering: originalRoomFireStates[2],
  Burning: originalRoomFireStates[3],
  Roaring: originalRoomFireStates[4],
} as const;

const TEMP = {
  Freezing: originalRoomTemperatures[0],
  Warm: originalRoomTemperatures[3],
} as const;

export class RoomRuntime {
  private initialized = false;
  private fireTimer: TimerId | null = null;
  private tempTimer: TimerId | null = null;
  private builderTimer: TimerId | null = null;
  private needWoodTimer: TimerId | null = null;
  private incomeTimer: TimerId | null = null;

  constructor(
    private readonly engine: GameEngine,
    private readonly incomePaused: () => boolean = () => false,
  ) {}

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

    if (this.initialized) return;
    this.initialized = true;
    this.scheduleFireCooling();
    this.scheduleTemperatureAdjustment();
    if (this.builderLevelInProgress()) {
      this.scheduleBuilderProgression();
    }
    this.scheduleBuilderIncome();
  }

  lifecycleSnapshot(): RoomRuntimeLifecycleSnapshot {
    return {
      initialized: this.initialized,
      fireTimerDueAt: this.timerDueAt(this.fireTimer),
      tempTimerDueAt: this.timerDueAt(this.tempTimer),
      builderTimerDueAt: this.timerDueAt(this.builderTimer),
      needWoodTimerDueAt: this.timerDueAt(this.needWoodTimer),
      incomeTimerDueAt: this.timerDueAt(this.incomeTimer),
    };
  }

  restoreLifecycle(snapshot: RoomRuntimeLifecycleSnapshot | null): void {
    this.fireTimer = null;
    this.tempTimer = null;
    this.builderTimer = null;
    this.needWoodTimer = null;
    this.incomeTimer = null;

    if (!snapshot?.initialized) {
      this.initialized = false;
      this.initialize();
      return;
    }

    this.initialized = true;
    this.restoreFireCooling(snapshot.fireTimerDueAt);
    this.restoreTemperatureAdjustment(snapshot.tempTimerDueAt);
    this.restoreBuilderProgression(snapshot.builderTimerDueAt);
    this.restoreNeedWoodUnlock(snapshot.needWoodTimerDueAt);
    this.restoreBuilderIncome(snapshot.incomeTimerDueAt);
  }

  snapshot(): RoomStateSnapshot {
    const fireValue = this.fireValue();
    const temperatureValue = this.temperatureValue();
    const wood = this.engine.state.get("stores.wood");
    const activeButton =
      fireValue === FIRE.Dead.value ? "light fire" : "stoke fire";

    return {
      title:
        fireValue < FIRE.Flickering.value ? "A Dark Room" : "A Firelit Room",
      fire: this.fireText(fireValue),
      fireValue,
      temperature: this.temperatureText(temperatureValue),
      temperatureValue,
      builderLevel: this.builderLevel(),
      wood: typeof wood === "number" ? wood : undefined,
      activeButton,
      activeCooldown: this.engine.cooldowns.snapshot(activeButton),
      outsideUnlocked:
        this.engine.state.get("features.location.outside") === true,
      stores: this.storeRows(),
      income: this.incomeRows(),
      buildOptions: this.buildOptions(),
      craftOptions: this.craftOptions(),
      buyOptions: this.buyOptions(),
      notifications: this.engine.notifications.list(),
    };
  }

  navigationTitle(): RoomStateSnapshot["title"] {
    return this.fireValue() < FIRE.Flickering.value
      ? "A Dark Room"
      : "A Firelit Room";
  }

  storesPanelSnapshot(): Pick<RoomStateSnapshot, "stores" | "income"> {
    return {
      stores: this.storeRows(),
      income: this.incomeRows(),
    };
  }

  refreshAvailability(): void {
    this.initialize();
    for (const craftable of originalRoomCraftables) {
      this.unlockCraftableIfEligible(craftable);
    }
    for (const good of originalRoomTradeGoods) {
      this.unlockTradeGoodIfEligible(good);
    }
  }

  lightFire(): boolean {
    this.initialize();
    if (this.engine.cooldowns.isActive("light fire")) return false;
    const wood = this.engine.state.get("stores.wood");
    if (typeof wood === "number" && wood < ROOM_LIGHT_FIRE_WOOD_COST) {
      this.notify("not enough wood to get the fire going");
      return false;
    }
    if (typeof wood === "number") {
      this.engine.state.set("stores.wood", wood - ROOM_LIGHT_FIRE_WOOD_COST);
    }
    this.engine.state.set("game.fire", FIRE.Burning);
    this.engine.cooldowns.start("stoke fire", ROOM_STOKE_COOLDOWN * 1000);
    this.onFireChange();
    return true;
  }

  stokeFire(): boolean {
    this.initialize();
    if (this.engine.cooldowns.isActive("stoke fire")) return false;
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
    this.engine.cooldowns.start("stoke fire", ROOM_STOKE_COOLDOWN * 1000);
    this.onFireChange();
    return true;
  }

  build(thing: string): boolean {
    this.initialize();
    if (
      this.numberAt("game.temperature.value") <=
      originalRoomTemperatures[1].value
    ) {
      this.notify("builder just shivers");
      return false;
    }

    const craftable = originalRoomCraftables.find(
      (entry) => entry.key === thing,
    );
    this.refreshAvailability();
    if (!craftable || !this.isCraftVisible(craftable)) {
      return false;
    }

    const count = this.itemCount(thing, craftable);
    if (craftable.maximum !== undefined && count >= craftable.maximum) {
      if (craftable.maxMsg) this.notify(craftable.maxMsg);
      return false;
    }

    const cost = originalRoomCost(craftable, {
      buildings: this.buildingsSnapshot(),
    });
    const storeMod: Record<string, number> = {};
    for (const [store, amount] of Object.entries(cost)) {
      const have = this.numberAt(`stores["${store}"]`);
      if (have < amount) {
        this.notify(`not enough ${store}`);
        return false;
      }
      storeMod[store] = have - amount;
    }

    this.engine.state.setM("stores", storeMod);
    this.notify(craftable.buildMsg);
    this.engine.state.add(this.itemStatePath(thing, craftable), 1);
    return true;
  }

  buy(thing: string): boolean {
    this.initialize();
    const good = originalRoomTradeGoods.find((entry) => entry.key === thing);
    this.refreshAvailability();
    if (!good || !this.isTradeGoodVisible(good)) return false;

    const count = this.itemCount(thing, good);
    if (good.maximum !== undefined && count >= good.maximum) return false;

    const cost = originalRoomCost(good);
    const storeMod: Record<string, number> = {};
    for (const [store, amount] of Object.entries(cost)) {
      const have = this.numberAt(`stores["${store}"]`);
      if (have < amount) {
        this.notify(`not enough ${store}`);
        return false;
      }
      storeMod[store] = have - amount;
    }

    this.engine.state.setM("stores", storeMod);
    this.engine.state.add(`stores["${thing}"]`, 1);
    return true;
  }

  adjustTemperature(): void {
    this.initialize();
    const oldTemperature = this.numberAt("game.temperature.value");
    const fireValue = this.numberAt("game.fire.value");
    let nextTemperature = oldTemperature;

    if (oldTemperature > 0 && oldTemperature > fireValue) {
      nextTemperature -= 1;
    } else if (
      oldTemperature < originalRoomTemperatures.length - 1 &&
      oldTemperature < fireValue
    ) {
      nextTemperature += 1;
    }

    if (nextTemperature !== oldTemperature) {
      this.engine.state.set(
        "game.temperature",
        originalRoomTemperatures[nextTemperature],
      );
      this.notify(`the room is ${this.temperatureText(nextTemperature)}`);
    }
  }

  coolFire(): void {
    this.initialize();
    const fireValue = this.numberAt("game.fire.value");
    const wood = this.engine.state.get("stores.wood");

    if (
      fireValue <= FIRE.Flickering.value &&
      this.numberAt("game.builder.level") > 3 &&
      typeof wood === "number" &&
      wood > 0
    ) {
      this.notify("builder stokes the fire");
      this.engine.state.set("stores.wood", wood - 1);
      this.engine.state.set("game.fire", originalRoomFireStates[fireValue + 1]);
    }

    const updatedFireValue = this.numberAt("game.fire.value");
    if (updatedFireValue > FIRE.Dead.value) {
      this.engine.state.set(
        "game.fire",
        originalRoomFireStates[updatedFireValue - 1],
      );
      this.onFireChange();
    }
  }

  advanceBuilder(): void {
    this.initialize();
    const builderLevel = this.builderLevel();
    const temperatureValue = this.temperatureValue();

    if (builderLevel === 0) {
      this.engine.state.set("game.builder.level", 1);
      this.notify(
        "a ragged stranger stumbles through the door and collapses in the corner",
      );
      this.scheduleNeedWoodUnlock();
      return;
    }

    if (builderLevel < 3 && temperatureValue >= TEMP.Warm.value) {
      if (builderLevel === 1) {
        this.notify(
          "the stranger shivers, and mumbles quietly. her words are unintelligible.",
        );
        this.engine.state.set("game.builder.level", 2);
      } else if (builderLevel === 2) {
        this.notify(
          "the stranger in the corner stops shivering. her breathing calms.",
        );
        this.engine.state.set("game.builder.level", 3);
      }
    }
  }

  onArrival(): void {
    this.initialize();
    if (this.numberAt("game.builder.level") === 3) {
      this.engine.state.set("game.builder.level", 4);
      this.engine.state.set("income.builder", {
        delay: ROOM_BUILDER_INCOME_DELAY,
        stores: { wood: ROOM_BUILDER_WOOD_INCOME },
      });
      this.notify(
        "the stranger is standing by the fire. she says she can help. says she builds things.",
      );
    }
  }

  unlockForest(): void {
    this.initialize();
    if (this.engine.state.get("features.location.outside") === true) return;
    this.engine.state.set("stores.wood", 4);
    this.engine.state.set("features.location.outside", true);
    this.notify("the wind howls outside");
    this.notify("the wood is running out");
  }

  private onFireChange(): void {
    const fireValue = this.numberAt("game.fire.value");
    this.notify(`the fire is ${this.fireText(fireValue)}`);

    if (
      fireValue > FIRE.Smoldering.value &&
      this.numberAt("game.builder.level") < 0
    ) {
      this.engine.state.set("game.builder.level", 0);
      this.notify(
        "the light from the fire spills from the windows, out into the dark",
      );
      this.scheduleBuilderProgression();
    }
    this.scheduleFireCooling();
  }

  private buildOptions(): RoomActionOptionSnapshot[] {
    return originalRoomCraftables
      .filter((craftable) => !originalRoomNeedsWorkshop(craftable.type))
      .filter((craftable) => this.isCraftVisible(craftable))
      .map((craftable) => this.actionOption("build", craftable));
  }

  private craftOptions(): RoomActionOptionSnapshot[] {
    return originalRoomCraftables
      .filter((craftable) => originalRoomNeedsWorkshop(craftable.type))
      .filter((craftable) => this.isCraftVisible(craftable))
      .map((craftable) => this.actionOption("craft", craftable));
  }

  private buyOptions(): RoomActionOptionSnapshot[] {
    return originalRoomTradeGoods
      .filter((good) => this.isTradeGoodVisible(good))
      .map((good) => this.actionOption("buy", good));
  }

  private actionOption(
    kind: RoomActionKind,
    definition: RoomCraftableDefinition | RoomTradeGoodDefinition,
  ): RoomActionOptionSnapshot {
    return roomActionOption(
      kind,
      definition,
      this.buildingsSnapshot(),
      (path) => this.numberAt(path),
    );
  }

  private unlockCraftableIfEligible(craftable: RoomCraftableDefinition): void {
    if (this.isCraftVisible(craftable)) return;
    if (!this.isCraftEligible(craftable)) return;

    this.engine.state.set(`game.room.buttons["${craftable.key}"]`, true);
    if (
      this.itemCount(craftable.key, craftable) === 0 &&
      craftable.availableMsg
    ) {
      this.notify(craftable.availableMsg);
    }
  }

  private isCraftVisible(craftable: RoomCraftableDefinition): boolean {
    if (
      this.engine.state.get(`game.room.buttons["${craftable.key}"]`) === true
    ) {
      return true;
    }
    if (this.builderLevel() < 4) return false;
    if (
      originalRoomNeedsWorkshop(craftable.type) &&
      this.numberAt('game.buildings["workshop"]') === 0
    ) {
      return false;
    }
    return (
      craftable.type === "building" &&
      this.itemCount(craftable.key, craftable) > 0
    );
  }

  private isCraftEligible(craftable: RoomCraftableDefinition): boolean {
    if (this.builderLevel() < 4) return false;
    if (
      originalRoomNeedsWorkshop(craftable.type) &&
      this.numberAt('game.buildings["workshop"]') === 0
    ) {
      return false;
    }

    const cost = originalRoomCost(craftable, {
      buildings: this.buildingsSnapshot(),
    });
    const woodCost = cost.wood ?? 0;
    if (this.numberAt("stores.wood") < woodCost * 0.5) return false;
    for (const [store, amount] of Object.entries(cost)) {
      if (amount > 0 && this.numberAt(`stores["${store}"]`) <= 0) return false;
    }

    return true;
  }

  private unlockTradeGoodIfEligible(good: RoomTradeGoodDefinition): void {
    if (this.isTradeGoodVisible(good)) return;
    if (!this.isTradeGoodEligible(good)) return;
    this.engine.state.set(`game.room.buttons["${good.key}"]`, true);
  }

  private isTradeGoodVisible(good: RoomTradeGoodDefinition): boolean {
    return this.engine.state.get(`game.room.buttons["${good.key}"]`) === true;
  }

  private isTradeGoodEligible(good: RoomTradeGoodDefinition): boolean {
    if (this.numberAt('game.buildings["trading post"]') <= 0) return false;
    return (
      good.key === "compass" ||
      this.engine.state.get(`stores["${good.key}"]`) !== undefined
    );
  }

  private storeRows(): RoomStoreSnapshot[] {
    const stores = this.engine.state.get("stores");
    if (stores === null || typeof stores !== "object") return [];
    return Object.entries(stores as Record<string, unknown>)
      .filter(([, value]) => typeof value === "number" && value > 0)
      .filter(([key]) => this.shouldShowStore(key))
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      .map(([key, value]) => ({
        key,
        value: value as number,
        category: roomStoreCategory(key),
      }));
  }

  private shouldShowStore(key: string): boolean {
    return shouldShowRoomStore(key);
  }

  private incomeRows(): RoomIncomeSnapshot[] {
    const income = this.engine.state.get("income");
    if (income === null || typeof income !== "object") return [];
    const rows: RoomIncomeSnapshot[] = [];
    for (const [source, value] of Object.entries(
      income as Record<string, unknown>,
    )) {
      if (value === null || typeof value !== "object") continue;
      const definition = value as { delay?: unknown; stores?: unknown };
      if (typeof definition.delay !== "number") continue;
      if (definition.stores === null || typeof definition.stores !== "object")
        continue;
      for (const [store, amount] of Object.entries(
        definition.stores as Record<string, unknown>,
      )) {
        if (typeof amount !== "number" || amount === 0) continue;
        const effectiveAmount = amount * this.incomeMultiplier();
        rows.push({
          source,
          store,
          amount: effectiveAmount,
          delay: definition.delay,
          text: `${effectiveAmount > 0 ? "+" : ""}${effectiveAmount} per ${definition.delay}s`,
        });
      }
    }
    return rows;
  }

  private itemCount(
    key: string,
    definition: RoomCraftableDefinition | RoomTradeGoodDefinition,
  ): number {
    return roomItemCount(key, definition, (path) => this.numberAt(path));
  }

  private itemStatePath(
    key: string,
    definition: RoomCraftableDefinition | RoomTradeGoodDefinition,
  ): string {
    return roomItemStatePath(key, definition);
  }

  private buildingsSnapshot(): Record<string, number> {
    const buildings = this.engine.state.get("game.buildings", true);
    return typeof buildings === "object" && buildings !== null
      ? (buildings as Record<string, number>)
      : {};
  }

  private scheduleFireCooling(): void {
    if (this.fireTimer !== null) this.engine.clock.clearTimer(this.fireTimer);
    this.fireTimer = this.engine.clock.setTimeout(() => {
      this.fireTimer = null;
      this.coolFire();
    }, ROOM_FIRE_COOL_DELAY);
  }

  private restoreFireCooling(dueAt: number | null): void {
    if (dueAt === null) return;
    this.fireTimer = this.engine.clock.setTimeout(() => {
      this.fireTimer = null;
      this.coolFire();
    }, this.remainingMs(dueAt));
  }

  private scheduleTemperatureAdjustment(): void {
    if (this.tempTimer !== null) this.engine.clock.clearTimer(this.tempTimer);
    this.tempTimer = this.engine.clock.setTimeout(() => {
      this.tempTimer = null;
      this.adjustTemperature();
      this.scheduleTemperatureAdjustment();
    }, ROOM_WARM_DELAY);
  }

  private restoreTemperatureAdjustment(dueAt: number | null): void {
    if (dueAt === null) return;
    this.tempTimer = this.engine.clock.setTimeout(() => {
      this.tempTimer = null;
      this.adjustTemperature();
      this.scheduleTemperatureAdjustment();
    }, this.remainingMs(dueAt));
  }

  private scheduleBuilderProgression(): void {
    if (this.builderTimer !== null)
      this.engine.clock.clearTimer(this.builderTimer);
    this.builderTimer = this.engine.clock.setTimeout(() => {
      this.builderTimer = null;
      this.advanceBuilder();
      if (this.builderLevelInProgress()) {
        this.scheduleBuilderProgression();
      }
    }, ROOM_BUILDER_STATE_DELAY);
  }

  private restoreBuilderProgression(dueAt: number | null): void {
    if (dueAt === null) return;
    this.builderTimer = this.engine.clock.setTimeout(() => {
      this.builderTimer = null;
      this.advanceBuilder();
      if (this.builderLevelInProgress()) {
        this.scheduleBuilderProgression();
      }
    }, this.remainingMs(dueAt));
  }

  private scheduleNeedWoodUnlock(): void {
    if (this.needWoodTimer !== null)
      this.engine.clock.clearTimer(this.needWoodTimer);
    this.needWoodTimer = this.engine.clock.setTimeout(() => {
      this.needWoodTimer = null;
      this.unlockForest();
    }, ROOM_NEED_WOOD_DELAY);
  }

  private restoreNeedWoodUnlock(dueAt: number | null): void {
    if (dueAt === null) return;
    this.needWoodTimer = this.engine.clock.setTimeout(() => {
      this.needWoodTimer = null;
      this.unlockForest();
    }, this.remainingMs(dueAt));
  }

  private scheduleBuilderIncome(
    delayMs = ROOM_BUILDER_INCOME_DELAY * 1000,
  ): void {
    if (this.incomeTimer !== null) return;
    this.incomeTimer = this.engine.clock.setTimeout(() => {
      this.incomeTimer = null;
      if (!this.incomePaused() && this.numberAt("game.builder.level") > 3) {
        this.engine.state.add(
          "stores.wood",
          ROOM_BUILDER_WOOD_INCOME * this.incomeMultiplier(),
          true,
        );
      }
      this.scheduleBuilderIncome();
    }, delayMs);
  }

  private restoreBuilderIncome(dueAt: number | null): void {
    if (dueAt === null) return;
    this.scheduleBuilderIncome(this.remainingMs(dueAt));
  }

  private timerDueAt(id: TimerId | null): number | null {
    return this.engine.clock.timerSnapshot(id)?.dueAt ?? null;
  }

  private remainingMs(dueAt: number): number {
    return Math.max(0, dueAt - this.engine.clock.now());
  }

  private incomeMultiplier(): 1 | 10 {
    return this.engine.state.get("config.debug.incomeMultiplier", true) === 10
      ? 10
      : 1;
  }

  private builderLevelInProgress(): boolean {
    const builderLevel = this.builderLevel();
    return builderLevel >= 0 && builderLevel < 3;
  }

  private notify(message: string): void {
    this.engine.notifications.notify("room", message);
  }

  private numberAt(path: string): number {
    const value = this.engine.state.get(path, true);
    return typeof value === "number" ? value : 0;
  }

  private builderLevel(): number {
    const value = this.engine.state.get("game.builder.level");
    return typeof value === "number" ? value : -1;
  }

  private fireValue(): number {
    const value = this.engine.state.get("game.fire.value");
    return typeof value === "number" ? value : FIRE.Dead.value;
  }

  private temperatureValue(): number {
    const value = this.engine.state.get("game.temperature.value");
    return typeof value === "number" ? value : TEMP.Freezing.value;
  }

  private fireText(value: number): string {
    return originalRoomFireStates[value]?.text ?? FIRE.Dead.text;
  }

  private temperatureText(value: number): string {
    return originalRoomTemperatures[value]?.text ?? TEMP.Freezing.text;
  }
}
