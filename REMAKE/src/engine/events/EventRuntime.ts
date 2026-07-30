import {
  EVENT_TIME_RANGE_MINUTES,
  originalEventDefinitions,
  type OriginalDelayedActionDefinition,
  type OriginalEventDefinition,
  type OriginalEventEffectContext,
  type OriginalEventSceneDefinition,
  type OriginalLootTable,
} from "../../content/original/events/eventData";
import {
  originalPathCapacity,
  originalPathWeightFor,
} from "../../content/original/path/pathWeights";
import {
  CombatRuntime,
  type CombatActionSnapshot,
  type CombatLifecycleSnapshot,
  type CombatPhase,
  type CombatSnapshot,
} from "../combat/CombatRuntime";
import type { TimerId } from "../clock";
import type { GameLocationKey } from "../GameSession";
import type { GameEngine } from "../GameEngine";
import type {
  WorldEncounterContext,
  WorldEventResolver,
} from "../world/WorldRuntime";
import {
  EXPEDITION_DEATH_NOTIFICATION,
  ExpeditionTransaction,
} from "../world/ExpeditionTransaction";

export interface EventButtonSnapshot {
  key: string;
  text: string;
  cost: Record<string, number>;
  link: string | null;
  disabled: boolean;
}

export interface EventLootActionSnapshot {
  key: string;
  text: string;
  disabled: boolean;
  kind: "take" | "drop";
}

export interface EventLootSnapshot {
  loot: Record<string, number>;
  actions: EventLootActionSnapshot[];
}

export type EventCombatPhase = CombatPhase;

export type EventCombatActionSnapshot = CombatActionSnapshot;

export type EventCombatSnapshot = CombatSnapshot;

export interface EventPanelSnapshot {
  active: boolean;
  title: string;
  eventKey: string;
  sceneKey: string;
  text: string[];
  combat: EventCombatSnapshot | null;
  loot: EventLootSnapshot | null;
  buttons: EventButtonSnapshot[];
}

export interface EventRuntimeLifecycleSnapshot {
  eventTimerDueAt: number | null;
  activeEventKey: string | null;
  activeSceneKey: string | null;
  loadedSceneRewards: string[];
  loadedSceneEffects: string[];
  sceneLoot: Record<string, number> | null;
  pendingDelayedActions: PendingDelayedActionSnapshot[];
  combat: CombatLifecycleSnapshot | null;
}

export interface PendingDelayedActionSnapshot {
  id: string;
  dueAt: number;
  reward: Record<string, number>;
  notification: string;
  source: string;
}

export interface EventRuntimeEffectHandlers {
  canApplyMap?: () => boolean;
  applyMap?: () => void;
  killVillagers?: (count: number) => void;
  destroyHuts?: (count: number) => number;
}

export class EventRuntime {
  private eventTimer: TimerId | null = null;
  private activeEvent: OriginalEventDefinition | null = null;
  private activeScene: OriginalEventSceneDefinition | null = null;
  private loadedSceneRewards = new Set<string>();
  private loadedSceneEffects = new Set<string>();
  private sceneLoot: Record<string, number> | null = null;
  private readonly combat: CombatRuntime;
  private pendingDelayedActions = new Map<
    string,
    PendingDelayedActionSnapshot & { timer: TimerId }
  >();

  constructor(
    private readonly engine: GameEngine,
    private readonly activeLocation: () => GameLocationKey,
    private readonly effectHandlers: EventRuntimeEffectHandlers = {},
    private readonly worldEvents?: WorldEventResolver,
    private readonly expedition = new ExpeditionTransaction(engine),
  ) {
    this.combat = new CombatRuntime(
      engine,
      {
        onLeave: () => this.resolveCombatLeave(),
        onPlayerDeath: () => this.endEvent(),
        shouldReturnOnLeave: () => this.combatLeaveReturnsHome(),
      },
      expedition,
    );
  }

  update(): void {
    if (this.randomEventsDisabled()) {
      if (this.eventTimer !== null) {
        this.engine.clock.clearTimer(this.eventTimer);
        this.eventTimer = null;
      }
      return;
    }
    if (this.activeEvent !== null || this.eventTimer !== null) return;
    this.scheduleNextEvent();
  }

  active(): boolean {
    return this.activeEvent !== null;
  }

  snapshot(): EventPanelSnapshot | null {
    if (!this.activeEvent || !this.activeScene) return null;
    return {
      active: true,
      title: this.activeEvent.title,
      eventKey: this.activeEvent.key,
      sceneKey: this.activeScene.key,
      text: this.activeScene.text,
      combat: this.activeScene.combat ? this.combat.snapshot() : null,
      loot: this.activeScene.loot
        ? {
            loot: this.sceneLoot ?? {},
            actions: this.sceneLootActions(),
          }
        : null,
      buttons: this.availableButtons().map((button) => ({
        key: button.key,
        text: button.text,
        cost: button.cost ?? {},
        link: button.link ?? null,
        disabled: !this.canAfford(button.cost ?? {}),
      })),
    };
  }

  triggerAvailable(): boolean {
    if (this.activeEvent !== null) return false;
    if (this.eventTimer !== null) {
      this.engine.clock.clearTimer(this.eventTimer);
      this.eventTimer = null;
    }

    const possibleEvents = this.availableEvents();
    if (possibleEvents.length === 0) {
      this.scheduleNextEvent(0.5);
      return false;
    }

    const event =
      possibleEvents[this.engine.rng.nextInt(possibleEvents.length)];
    this.startEvent(event);
    this.scheduleNextEvent();
    return true;
  }

  triggerByKeyForTest(key: string): boolean {
    if (this.activeEvent !== null) return false;
    this.clearScheduledEvent();
    const event = originalEventDefinitions.find((entry) => entry.key === key);
    if (!event) return false;
    this.startEvent(event);
    this.scheduleNextEvent();
    return true;
  }

  triggerWorldEncounter(context: WorldEncounterContext): boolean {
    if (this.activeEvent !== null) return false;
    const key = this.worldEvents?.encounterEventKey(context);
    if (!key) return false;
    this.clearScheduledEvent();
    return this.startEventByKey(key);
  }

  triggerWorldSetpiece(scene: string): boolean {
    if (this.activeEvent !== null) return false;
    const key = this.worldEvents?.setpieceEventKey(scene);
    if (!key) return false;
    this.clearScheduledEvent();
    return this.startEventByKey(key);
  }

  choose(buttonKey: string): boolean {
    if (!this.activeEvent || !this.activeScene) return false;
    const button = this.availableButtons().find(
      (entry) => entry.key === buttonKey,
    );
    if (!button) return false;
    if (!this.canAfford(button.cost ?? {})) return false;

    const usesExpeditionResources = this.usesExpeditionResources();
    this.applyCost(button.cost ?? {});
    if (usesExpeditionResources && this.expedition.health() <= 0) {
      if (this.expedition.abortOnDeath()) {
        this.notify(EXPEDITION_DEATH_NOTIFICATION);
      }
      this.endEvent();
      return true;
    }
    if (button.reward)
      this.engine.state.forRuntime("events").addM("stores", button.reward);
    if (button.notification) this.notify(button.notification);
    button.onChoose?.(this.effectContext());

    if (button.nextEvent) {
      const nextEvent =
        typeof button.nextEvent === "string"
          ? button.nextEvent
          : this.resolveChanceScene(button.nextEvent);
      return this.startEventByKey(nextEvent);
    }

    if (!button.nextScene) return true;

    if (button.nextScene === "end") {
      this.endEvent();
      return true;
    }

    const nextScene =
      typeof button.nextScene === "string"
        ? button.nextScene
        : this.resolveChanceScene(button.nextScene);
    this.loadScene(nextScene, true);
    return true;
  }

  chooseCombatAction(actionKey: string): boolean {
    if (!this.activeScene?.combat) return false;
    return this.combat.chooseAction(actionKey);
  }

  chooseLootAction(actionKey: string): boolean {
    if (!this.activeScene?.loot || !this.sceneLoot) return false;
    if (actionKey === "takeEverything") return this.takeSceneLoot();
    if (actionKey.startsWith("take:")) {
      return this.takeSceneLootItem(actionKey.slice("take:".length));
    }
    if (actionKey.startsWith("dropFor:")) {
      const [, lootKey, outfitKey] = actionKey.split(":");
      if (!lootKey || !outfitKey) return false;
      return this.dropForSceneLoot(lootKey, outfitKey);
    }
    return false;
  }

  lifecycleSnapshot(): EventRuntimeLifecycleSnapshot {
    return {
      eventTimerDueAt: this.timerDueAt(this.eventTimer),
      activeEventKey: this.activeEvent?.key ?? null,
      activeSceneKey: this.activeScene?.key ?? null,
      loadedSceneRewards: [...this.loadedSceneRewards],
      loadedSceneEffects: [...this.loadedSceneEffects],
      sceneLoot: this.sceneLoot ? { ...this.sceneLoot } : null,
      pendingDelayedActions: [...this.pendingDelayedActions.values()].map(
        (action) => ({
          id: action.id,
          dueAt: action.dueAt,
          reward: { ...action.reward },
          notification: action.notification,
          source: action.source,
        }),
      ),
      combat: this.combat.lifecycleSnapshot(),
    };
  }

  restoreLifecycle(snapshot: EventRuntimeLifecycleSnapshot | null): void {
    if (this.eventTimer !== null) {
      this.engine.clock.clearTimer(this.eventTimer);
    }
    this.clearPendingDelayedActions();
    this.eventTimer = null;
    this.activeEvent = null;
    this.activeScene = null;
    this.sceneLoot = null;
    this.loadedSceneRewards = new Set(snapshot?.loadedSceneRewards ?? []);
    this.loadedSceneEffects = new Set(snapshot?.loadedSceneEffects ?? []);
    this.combat.clear();

    if (!snapshot) {
      this.scheduleNextEvent();
      return;
    }

    if (snapshot.eventTimerDueAt !== null) {
      this.restoreNextEvent(snapshot.eventTimerDueAt);
    }

    if (snapshot.activeEventKey && snapshot.activeSceneKey) {
      const event = originalEventDefinitions.find(
        (entry) => entry.key === snapshot.activeEventKey,
      );
      const scene = event?.scenes[snapshot.activeSceneKey];
      if (event && scene) {
        this.activeEvent = event;
        this.activeScene = scene;
        this.sceneLoot = snapshot.sceneLoot ? { ...snapshot.sceneLoot } : null;
        if (snapshot.combat && scene.combat) {
          this.combat.restore(scene.combat, snapshot.combat);
        }
      }
    }

    for (const action of snapshot.pendingDelayedActions) {
      this.restoreDelayedAction(action);
    }
  }

  private scheduleNextEvent(scale = 1): void {
    if (this.randomEventsDisabled()) return;
    if (this.eventTimer !== null) return;
    const [min, max] = EVENT_TIME_RANGE_MINUTES;
    const minutes = Math.floor(this.engine.rng.next() * (max - min)) + min;
    this.eventTimer = this.engine.clock.setTimeout(
      () => {
        this.eventTimer = null;
        this.triggerAvailable();
      },
      minutes * scale * 60 * 1000,
    );
  }

  private clearScheduledEvent(): void {
    if (this.eventTimer === null) return;
    this.engine.clock.clearTimer(this.eventTimer);
    this.eventTimer = null;
  }

  private availableEvents(): OriginalEventDefinition[] {
    const location = this.activeLocation();
    if (location !== "room" && location !== "outside") return [];
    return originalEventDefinitions.filter(
      (event) =>
        (event.pool === location ||
          event.pool === "global" ||
          event.pool === "marketing") &&
        event.isAvailable((path) => this.numberAt(path)),
    );
  }

  private startEvent(event: OriginalEventDefinition): void {
    this.activeEvent = event;
    this.loadedSceneRewards.clear();
    this.loadedSceneEffects.clear();
    this.loadScene("start", true);
  }

  private startEventByKey(key: string): boolean {
    const event = originalEventDefinitions.find((entry) => entry.key === key);
    if (!event) {
      this.endEvent();
      return false;
    }
    this.startEvent(event);
    return true;
  }

  private loadScene(sceneKey: string, applyEffects: boolean): void {
    if (!this.activeEvent) return;
    const scene = this.activeEvent.scenes[sceneKey];
    if (!scene) {
      this.endEvent();
      return;
    }
    this.activeScene = scene;
    this.sceneLoot =
      scene.loot && applyEffects ? this.rollLoot(scene.loot) : null;
    if (applyEffects && scene.notification) this.notify(scene.notification);
    if (
      applyEffects &&
      scene.reward &&
      !this.loadedSceneRewards.has(sceneKey)
    ) {
      this.engine.state.forRuntime("events").addM("stores", scene.reward);
      this.loadedSceneRewards.add(sceneKey);
    }
    if (applyEffects && scene.combat) {
      this.combat.start(scene.combat);
    } else if (!scene.combat) {
      this.combat.clear();
    }
    if (applyEffects && !this.loadedSceneEffects.has(sceneKey)) {
      scene.onLoad?.(this.effectContext());
      if (scene.delayedAction)
        this.maybeScheduleDelayedAction(scene.delayedAction);
      this.loadedSceneEffects.add(sceneKey);
    }
  }

  private endEvent(): void {
    this.combat.clear();
    this.activeEvent = null;
    this.activeScene = null;
    this.sceneLoot = null;
    this.loadedSceneRewards.clear();
    this.loadedSceneEffects.clear();
  }

  private resolveCombatLeave(): void {
    const leaveButton = this.activeScene?.buttons.find(
      (button) => button.key === "leave",
    );
    if (!leaveButton?.nextScene) {
      this.endEvent();
      return;
    }
    if (leaveButton.nextScene === "end") {
      this.endEvent();
      return;
    }
    const nextScene =
      typeof leaveButton.nextScene === "string"
        ? leaveButton.nextScene
        : this.resolveChanceScene(leaveButton.nextScene);
    this.loadScene(nextScene, true);
  }

  private combatLeaveReturnsHome(): boolean {
    if (this.expedition.active() && this.activeEvent?.pool === "encounter") {
      return false;
    }
    const leaveButton = this.activeScene?.buttons.find(
      (button) => button.key === "leave",
    );
    return !leaveButton?.nextScene || leaveButton.nextScene === "end";
  }

  private resolveChanceScene(nextScene: Record<number, string>): string {
    const roll = this.engine.rng.next();
    let selectedThreshold: number | null = null;
    for (const threshold of Object.keys(nextScene).map(Number)) {
      if (
        roll < threshold &&
        (selectedThreshold === null || threshold < selectedThreshold)
      ) {
        selectedThreshold = threshold;
      }
    }
    if (selectedThreshold === null) {
      const fallback = Math.max(...Object.keys(nextScene).map(Number));
      return nextScene[fallback] as string;
    }
    return nextScene[selectedThreshold] as string;
  }

  private availableButtons() {
    if (!this.activeScene) return [];
    return this.activeScene.buttons.filter(
      (button) => button.available?.(this.effectContext()) ?? true,
    );
  }

  private canAfford(cost: Record<string, number>): boolean {
    return Object.entries(cost).every(
      ([store, amount]) => this.costQuantity(store) >= amount,
    );
  }

  private applyCost(cost: Record<string, number>): void {
    if (this.usesExpeditionResources()) {
      for (const [resource, amount] of Object.entries(cost)) {
        if (resource === "hp") {
          this.expedition.addHealth(-amount);
        } else if (resource === "water") {
          this.expedition.addWater(-amount);
        } else {
          this.expedition.addInventory(resource, -amount);
        }
      }
      return;
    }

    const mod: Record<string, number> = {};
    for (const [store, amount] of Object.entries(cost)) {
      if (store === "hp") {
        this.engine.state.forRuntime("events").add("character.health", -amount);
        continue;
      }
      mod[store] = -amount;
    }
    if (Object.keys(mod).length > 0)
      this.engine.state.forRuntime("events").addM("stores", mod);
  }

  private costQuantity(key: string): number {
    if (this.usesExpeditionResources()) {
      if (key === "hp") return this.expedition.health();
      if (key === "water") return this.expedition.water();
      return this.expedition.inventoryQuantity(key);
    }

    if (key === "hp") return this.numberAt("character.health");
    return this.numberAt(`stores["${key}"]`);
  }

  private usesExpeditionResources(): boolean {
    if (!this.expedition.active()) return false;
    return (
      this.activeEvent?.pool === "encounter" ||
      this.activeEvent?.pool === "setpiece" ||
      this.activeEvent?.pool === "executioner"
    );
  }

  private restoreNextEvent(dueAt: number): void {
    this.eventTimer = this.engine.clock.setTimeout(() => {
      this.eventTimer = null;
      this.triggerAvailable();
    }, this.remainingMs(dueAt));
  }

  private maybeScheduleDelayedAction(
    action: OriginalDelayedActionDefinition,
  ): void {
    if (this.engine.rng.next() >= action.chance) return;
    const id = `${action.key}:${this.engine.clock.now()}`;
    const pending: PendingDelayedActionSnapshot = {
      id,
      dueAt: this.engine.clock.now() + action.delaySeconds * 1000,
      reward: { ...action.reward },
      notification: action.notification,
      source: action.source,
    };
    this.restoreDelayedAction(pending);
  }

  private restoreDelayedAction(action: PendingDelayedActionSnapshot): void {
    const timer = this.engine.clock.setTimeout(() => {
      this.pendingDelayedActions.delete(action.id);
      this.engine.state.forRuntime("events").addM("stores", action.reward);
      this.engine.notifications.notify(action.source, action.notification);
    }, this.remainingMs(action.dueAt));
    this.pendingDelayedActions.set(action.id, { ...action, timer });
  }

  private clearPendingDelayedActions(): void {
    for (const action of this.pendingDelayedActions.values()) {
      this.engine.clock.clearTimer(action.timer);
    }
    this.pendingDelayedActions.clear();
  }

  private effectContext(): OriginalEventEffectContext {
    return {
      readNumber: (path: string) => this.numberAt(path),
      readRecord: (path: string) => {
        const value = this.engine.state
          .forRuntime("events")
          .getDynamic(path, true);
        return value && typeof value === "object"
          ? { ...(value as Record<string, number>) }
          : {};
      },
      setState: (path: string, value: unknown) =>
        this.setEffectState(path, value),
      addStores: (stores: Record<string, number>) =>
        this.engine.state.forRuntime("events").addM("stores", stores),
      removeIncome: (key: string) =>
        this.engine.state.forRuntime("events").remove(`income["${key}"]`),
      addPerk: (key: string) =>
        this.engine.state
          .forRuntime("events")
          .set(`character.perks["${key}"]`, true),
      canApplyMap: () =>
        this.effectHandlers.canApplyMap?.() ??
        this.worldEvents?.canApplyMap() ??
        false,
      applyMap: () => {
        if (this.effectHandlers.applyMap) {
          this.effectHandlers.applyMap();
          return;
        }
        this.worldEvents?.applyMap();
      },
      killVillagers: (count: number) =>
        this.effectHandlers.killVillagers?.(count),
      destroyHuts: (count: number) =>
        this.effectHandlers.destroyHuts?.(count) ?? 0,
      notify: (message: string) => this.notify(message),
      rng: () => this.engine.rng.next(),
    };
  }

  private setEffectState(path: string, value: unknown): void {
    if (
      this.usesExpeditionResources() &&
      path === "character.health" &&
      typeof value === "number"
    ) {
      this.expedition.setHealth(value, value);
      return;
    }
    this.engine.state.forRuntime("events").setDynamic(path, value);
    if (value === true) {
      this.worldEvents?.recordLandmarkResolutionForEffect(path);
    }
  }

  private sceneLootActions(): EventLootActionSnapshot[] {
    if (!this.sceneLoot) return [];
    return [
      ...Object.entries(this.sceneLoot).map(([key]) => ({
        key: `take:${key}`,
        text: "take",
        disabled: originalPathWeightFor(key) > this.outfitFreeSpace() + 1e-9,
        kind: "take" as const,
      })),
      {
        key: "takeEverything",
        text: this.canTakeEverything() ? "take everything" : "take all you can",
        disabled: !this.canTakeSceneLoot(),
        kind: "take",
      },
      ...this.sceneLootDropActions(),
    ];
  }

  private takeSceneLoot(): boolean {
    if (!this.sceneLoot) return false;
    if (!this.canTakeSceneLoot()) return false;
    let freeSpace = this.outfitFreeSpace();
    let tookSomething = false;

    for (const [key, amount] of Object.entries(this.sceneLoot)) {
      const weight = originalPathWeightFor(key);
      const takeable =
        weight <= 0
          ? amount
          : Math.min(amount, Math.floor((freeSpace + 1e-9) / weight));
      if (takeable <= 0) continue;
      this.addOutfit(key, takeable);
      tookSomething = true;
      freeSpace -= takeable * weight;
      const remaining = amount - takeable;
      if (remaining > 0) {
        this.sceneLoot[key] = remaining;
      } else {
        delete this.sceneLoot[key];
      }
      if (freeSpace <= 0) break;
    }

    return tookSomething;
  }

  private takeSceneLootItem(key: string): boolean {
    if (!this.sceneLoot) return false;
    const amount = this.sceneLoot[key] ?? 0;
    if (amount <= 0) return false;
    if (originalPathWeightFor(key) > this.outfitFreeSpace() + 1e-9) {
      return false;
    }
    this.addOutfit(key, 1);
    if (amount === 1) {
      delete this.sceneLoot[key];
    } else {
      this.sceneLoot[key] = amount - 1;
    }
    return true;
  }

  private dropForSceneLoot(lootKey: string, outfitKey: string): boolean {
    if (!this.sceneLoot) return false;
    if ((this.sceneLoot[lootKey] ?? 0) <= 0) return false;
    const dropCount = this.dropCountFor(lootKey, outfitKey);
    if (dropCount <= 0) return false;
    this.addOutfit(outfitKey, -dropCount);
    this.sceneLoot[outfitKey] = (this.sceneLoot[outfitKey] ?? 0) + dropCount;
    return this.takeSceneLootItem(lootKey);
  }

  private sceneLootDropActions(): EventLootActionSnapshot[] {
    if (!this.sceneLoot) return [];
    const actions: EventLootActionSnapshot[] = [];
    for (const [lootKey, amount] of Object.entries(this.sceneLoot)) {
      if (amount <= 0) continue;
      if (originalPathWeightFor(lootKey) <= this.outfitFreeSpace() + 1e-9) {
        continue;
      }
      for (const [outfitKey, outfitAmount] of Object.entries(
        this.numericRecordAt("outfit"),
      )) {
        if (outfitAmount <= 0 || originalPathWeightFor(outfitKey) <= 0) {
          continue;
        }
        const dropCount = this.dropCountFor(lootKey, outfitKey);
        if (dropCount <= 0) continue;
        actions.push({
          key: `dropFor:${lootKey}:${outfitKey}`,
          text: `drop ${outfitKey} x${dropCount} for ${lootKey}`,
          disabled: false,
          kind: "drop",
        });
      }
    }
    return actions;
  }

  private dropCountFor(lootKey: string, outfitKey: string): number {
    if (lootKey === outfitKey) return 0;
    const outfitAmount = this.numberAt(`outfit["${outfitKey}"]`);
    if (outfitAmount <= 0) return 0;
    const needed = originalPathWeightFor(lootKey) - this.outfitFreeSpace();
    if (needed <= 0) return 0;
    return Math.min(
      outfitAmount,
      Math.ceil(needed / originalPathWeightFor(outfitKey)),
    );
  }

  private canTakeSceneLoot(): boolean {
    if (!this.sceneLoot) return false;
    return Object.entries(this.sceneLoot).some(
      ([key, amount]) =>
        amount > 0 &&
        originalPathWeightFor(key) <= this.outfitFreeSpace() + 1e-9,
    );
  }

  private canTakeEverything(): boolean {
    if (!this.sceneLoot) return false;
    return this.lootWeight(this.sceneLoot) <= this.outfitFreeSpace() + 1e-9;
  }

  private addOutfit(key: string, amount: number): void {
    this.engine.state.forRuntime("events").addM("outfit", { [key]: amount });
  }

  private outfitFreeSpace(): number {
    return (
      originalPathCapacity(this.numericRecordAt("stores")) -
      this.lootWeight(this.numericRecordAt("outfit"))
    );
  }

  private lootWeight(items: Record<string, number>): number {
    return Object.entries(items).reduce(
      (total, [key, amount]) => total + originalPathWeightFor(key) * amount,
      0,
    );
  }

  private numericRecordAt(path: string): Record<string, number> {
    const value = this.engine.state.forRuntime("events").getDynamic(path, true);
    if (!value || typeof value !== "object") return {};
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).filter(
        (entry): entry is [string, number] => typeof entry[1] === "number",
      ),
    );
  }

  private rollLoot(loot: OriginalLootTable): Record<string, number> {
    const rolled: Record<string, number> = {};
    for (const [key, entry] of Object.entries(loot)) {
      if (this.engine.rng.next() >= entry.chance) continue;
      rolled[key] =
        Math.floor(this.engine.rng.next() * (entry.max - entry.min)) +
        entry.min;
    }
    return rolled;
  }

  private notify(message: string): void {
    this.engine.notifications.notify("event", message);
  }

  private numberAt(path: string): number {
    const value = this.engine.state.forRuntime("events").getDynamic(path, true);
    if (value === true) return 1;
    return typeof value === "number" ? value : 0;
  }

  private timerDueAt(id: TimerId | null): number | null {
    return this.engine.clock.timerSnapshot(id)?.dueAt ?? null;
  }

  private remainingMs(dueAt: number): number {
    return Math.max(0, dueAt - this.engine.clock.now());
  }

  private randomEventsDisabled(): boolean {
    return (
      this.engine.state
        .forRuntime("events")
        .get("config.events.randomDisabled", true) === true
    );
  }
}
