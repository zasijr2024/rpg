import type {
  OriginalCombatDefinition,
  OriginalCombatStatus,
} from "../../content/original/events/eventData";
import {
  originalPathCapacity,
  originalPathWeightFor,
} from "../../content/original/path/pathWeights";
import {
  originalWorldWeapons,
  WORLD_BASE_HEALTH,
  WORLD_BASE_HIT_CHANCE,
  WORLD_HYPO_HEAL,
  WORLD_MEAT_HEAL,
  WORLD_MEDS_HEAL,
  type WorldWeaponDefinition,
} from "../../content/original/world/worldData";
import type { TimerId } from "../clock";
import type { GameEngine } from "../GameEngine";
import {
  EXPEDITION_DEATH_NOTIFICATION,
  ExpeditionTransaction,
} from "../world/ExpeditionTransaction";
import { CombatDomainFacade } from "./CombatDomain";

export type CombatPhase = "fighting" | "exploding" | "won";

export interface CombatActionSnapshot {
  key: string;
  text: string;
  cost: Record<string, number>;
  disabled: boolean;
  cooldownRemainingMs: number;
  kind: "attack" | "heal" | "defend" | "boost" | "take" | "drop" | "leave";
}

export interface CombatSnapshot extends Omit<OriginalCombatDefinition, "loot"> {
  active: true;
  phase: CombatPhase;
  playerHp: number;
  playerMaxHp: number;
  enemyHp: number;
  enemyMaxHp: number;
  enemyStatus: OriginalCombatStatus | null;
  status: string;
  loot: Record<string, number>;
  actions: CombatActionSnapshot[];
}

export interface CombatLifecycleSnapshot {
  phase: CombatPhase;
  enemyHp: number;
  enemyMaxHp: number;
  loot: Record<string, number>;
  lootTaken: boolean;
  enemyStunnedUntil: number | null;
  enemyAttackDueAt: number | null;
  enemyExplosionDueAt: number | null;
  enemyStatus: OriginalCombatStatus | null;
  enemyStatusExpiresAt: number | null;
  enemySpecialDueAts: Record<number, number>;
  enemyMeditateDamage: number;
  lastSpecialStatus: OriginalCombatStatus | null;
  playerDotDamage: number;
  playerDotDueAt: number | null;
  playerShielded: boolean;
  playerBoosted: boolean;
  playerBoostExpiresAt: number | null;
}

export interface CombatDeathOutcome {
  reason: "combat";
  returnLocation: "room";
  notification: string;
}

export type CombatLeaveOutcome =
  | {
      reason: "victory";
      returnLocation: "path";
    }
  | {
      reason: "continue";
      returnLocation: null;
    };

export interface CombatRuntimeCallbacks {
  onLeave?: (outcome: CombatLeaveOutcome) => void;
  onPlayerDeath?: (outcome: CombatDeathOutcome) => void;
  shouldReturnOnLeave?: () => boolean;
}

const COMBAT_STUN_MS = 4000;
const EAT_COOLDOWN_MS = 5000;
const MEDS_COOLDOWN_MS = 7000;
const HYPO_COOLDOWN_MS = 7000;
const SHIELD_COOLDOWN_MS = 10000;
const STIM_COOLDOWN_MS = 10000;
const STIM_BOOST_MS = 3000;
const STIM_HP_COST = 10;
const COMBAT_LEAVE_COOLDOWN_MS = 1000;
const COMBAT_DOT_TICK_MS = 1000;
const COMBAT_ENRAGE_MS = 4000;
const COMBAT_MEDITATE_MS = 5000;
const COMBAT_ENRAGED_ATTACK_MS = 500;
const COMBAT_ENERGISE_MULTIPLIER = 4;
const COMBAT_EXPLOSION_MS = 3000;
export class CombatRuntime {
  private combatDefinition: OriginalCombatDefinition | null = null;
  private combatState: CombatLifecycleSnapshot | null = null;
  private enemyAttackTimer: TimerId | null = null;
  private enemyExplosionTimer: TimerId | null = null;
  private playerDotTimer: TimerId | null = null;
  private playerBoostTimer: TimerId | null = null;
  private enemyStatusTimer: TimerId | null = null;
  private readonly enemySpecialTimers = new Map<number, TimerId>();
  private readonly combat: CombatDomainFacade;

  constructor(
    private readonly engine: GameEngine,
    private readonly callbacks: CombatRuntimeCallbacks = {},
    private readonly expedition = new ExpeditionTransaction(engine),
  ) {
    this.combat = new CombatDomainFacade(engine);
  }

  start(combat: OriginalCombatDefinition): void {
    this.clear();
    this.combatDefinition = combat;
    const maxHp = this.playerMaxHp();
    if (!this.expedition.active() && (this.combat.read().health ?? 0) <= 0) {
      this.setPlayerHp(maxHp);
    }
    this.combatState = {
      phase: "fighting",
      enemyHp: combat.health,
      enemyMaxHp: combat.health,
      loot: {},
      lootTaken: false,
      enemyStunnedUntil: null,
      enemyAttackDueAt: null,
      enemyExplosionDueAt: null,
      enemyStatus: null,
      enemyStatusExpiresAt: null,
      enemySpecialDueAts: {},
      enemyMeditateDamage: 0,
      lastSpecialStatus: null,
      playerDotDamage: 0,
      playerDotDueAt: null,
      playerShielded: false,
      playerBoosted: false,
      playerBoostExpiresAt: null,
    };
    this.scheduleEnemyAttack(combat.attackDelay * 1000);
    this.restoreEnemySpecials({});
  }

  clear(): void {
    if (this.enemyAttackTimer !== null) {
      this.engine.clock.clearTimer(this.enemyAttackTimer);
    }
    if (this.enemyExplosionTimer !== null) {
      this.engine.clock.clearTimer(this.enemyExplosionTimer);
    }
    if (this.playerDotTimer !== null) {
      this.engine.clock.clearTimer(this.playerDotTimer);
    }
    if (this.playerBoostTimer !== null) {
      this.engine.clock.clearTimer(this.playerBoostTimer);
    }
    if (this.enemyStatusTimer !== null) {
      this.engine.clock.clearTimer(this.enemyStatusTimer);
    }
    for (const timer of this.enemySpecialTimers.values()) {
      this.engine.clock.clearTimer(timer);
    }
    this.enemyAttackTimer = null;
    this.enemyExplosionTimer = null;
    this.playerDotTimer = null;
    this.playerBoostTimer = null;
    this.enemyStatusTimer = null;
    this.enemySpecialTimers.clear();
    this.combatDefinition = null;
    this.combatState = null;
  }

  snapshot(): CombatSnapshot | null {
    if (!this.combatDefinition || !this.combatState) return null;
    return {
      ...this.combatDefinition,
      active: true,
      phase: this.combatState.phase,
      playerHp: this.playerHp(),
      playerMaxHp: this.playerMaxHp(),
      enemyHp: this.combatState.enemyHp,
      enemyMaxHp: this.combatState.enemyMaxHp,
      enemyStatus: this.combatState.enemyStatus,
      status: this.combatStatusText(),
      loot: this.combatState.loot,
      actions: this.combatActions(),
    };
  }

  chooseAction(actionKey: string): boolean {
    if (!this.combatDefinition || !this.combatState) return false;
    if (actionKey === "takeEverything") return this.takeCombatLoot();
    if (actionKey.startsWith("take:")) {
      return this.takeLootItem(actionKey.slice("take:".length));
    }
    if (actionKey.startsWith("dropFor:")) {
      const [, lootKey, outfitKey] = actionKey.split(":");
      if (!lootKey || !outfitKey) return false;
      return this.dropForLoot(lootKey, outfitKey);
    }
    if (actionKey === "leave") {
      if (this.combatState.phase !== "won") return false;
      if (this.engine.cooldowns.isActive("event.combat.leave")) return false;
      const outcome =
        this.callbacks.shouldReturnOnLeave?.() === false
          ? this.resolveSceneContinue()
          : this.resolveSafeReturn();
      this.callbacks.onLeave?.(outcome);
      return true;
    }
    if (actionKey.startsWith("attack:")) {
      return this.attack(actionKey.slice("attack:".length));
    }
    if (actionKey.startsWith("heal:")) {
      return this.heal(actionKey.slice("heal:".length));
    }
    if (actionKey === "shield") return this.shield();
    if (actionKey === "stim") return this.stim();
    return false;
  }

  lifecycleSnapshot(): CombatLifecycleSnapshot | null {
    if (!this.combatState) return null;
    return {
      ...this.combatState,
      loot: { ...this.combatState.loot },
      enemyAttackDueAt: this.timerDueAt(this.enemyAttackTimer),
      enemyExplosionDueAt: this.timerDueAt(this.enemyExplosionTimer),
      enemyStatusExpiresAt: this.timerDueAt(this.enemyStatusTimer),
      enemySpecialDueAts: this.enemySpecialDueAts(),
      playerDotDueAt: this.timerDueAt(this.playerDotTimer),
      playerBoostExpiresAt: this.timerDueAt(this.playerBoostTimer),
    };
  }

  restore(
    combat: OriginalCombatDefinition,
    snapshot: CombatLifecycleSnapshot,
  ): void {
    this.clear();
    this.combatDefinition = combat;
    this.combatState = {
      ...snapshot,
      loot: { ...snapshot.loot },
      enemyAttackDueAt: null,
      enemyExplosionDueAt: null,
      enemyStatus: snapshot.enemyStatus ?? null,
      enemyStatusExpiresAt: null,
      enemySpecialDueAts: {},
      enemyMeditateDamage: snapshot.enemyMeditateDamage ?? 0,
      lastSpecialStatus: snapshot.lastSpecialStatus ?? null,
      playerDotDamage: snapshot.playerDotDamage ?? 0,
      playerDotDueAt: null,
      playerShielded: snapshot.playerShielded ?? false,
      playerBoosted: snapshot.playerBoosted ?? false,
      playerBoostExpiresAt: null,
    };
    this.restoreEnemyAttack(snapshot.enemyAttackDueAt);
    this.restoreEnemyExplosion(snapshot.enemyExplosionDueAt);
    this.restoreEnemyStatusExpiration(snapshot.enemyStatusExpiresAt);
    this.restoreEnemySpecials(snapshot.enemySpecialDueAts);
    this.restorePlayerDot(snapshot.playerDotDueAt, snapshot.playerDotDamage);
    this.restorePlayerBoost(snapshot.playerBoostExpiresAt);
  }

  private combatActions(): CombatActionSnapshot[] {
    if (!this.combatDefinition || !this.combatState) return [];
    if (this.combatState.phase === "exploding") return [];
    if (this.combatState.phase === "won") {
      const canTakeEverything = this.canTakeEverything();
      const takeCooldown = this.engine.cooldowns.snapshot(
        "event.combat.takeEverything",
      );
      const leaveCooldown =
        this.engine.cooldowns.snapshot("event.combat.leave");
      return [
        ...this.lootTakeActions(),
        {
          key: "takeEverything",
          text: canTakeEverything ? "take everything" : "take all you can",
          cost: {},
          disabled: takeCooldown.active || !this.canTakeCombatLoot(),
          cooldownRemainingMs: takeCooldown.remainingMs,
          kind: "take",
        },
        ...this.lootDropActions(),
        {
          key: "leave",
          text: "leave",
          cost: {},
          disabled: leaveCooldown.active,
          cooldownRemainingMs: leaveCooldown.remainingMs,
          kind: "leave",
        },
      ];
    }

    return [
      ...this.availableCombatWeapons().map((weapon) =>
        this.combatActionForWeapon(weapon),
      ),
      ...this.availableHealActions(),
      ...this.availableDefensiveActions(),
    ];
  }

  private combatActionForWeapon(
    weapon: WorldWeaponDefinition,
  ): CombatActionSnapshot {
    const cooldown = this.engine.cooldowns.snapshot(
      this.weaponCooldownKey(weapon.key),
    );
    const cost = weapon.cost ?? {};
    return {
      key: `attack:${weapon.key}`,
      text: weapon.verb,
      cost,
      disabled:
        cooldown.active ||
        !this.canAffordOutfit(cost) ||
        this.combatState?.phase !== "fighting",
      cooldownRemainingMs: cooldown.remainingMs,
      kind: "attack",
    };
  }

  private availableCombatWeapons(): WorldWeaponDefinition[] {
    const carriedWeapons = originalWorldWeapons.filter((weapon) => {
      if (weapon.key === "fists") return false;
      if (typeof weapon.damage === "number" && weapon.damage <= 0) {
        return false;
      }
      if (this.outfitItem(weapon.key) <= 0) return false;
      return this.canAffordOutfit(weapon.cost ?? {});
    });
    const hasDamageWeapon = carriedWeapons.some(
      (weapon) => typeof weapon.damage === "number" && weapon.damage > 0,
    );
    const fists = originalWorldWeapons.filter(
      (weapon) => weapon.key === "fists",
    );
    return hasDamageWeapon ? carriedWeapons : [...fists, ...carriedWeapons];
  }

  private availableHealActions(): CombatActionSnapshot[] {
    const healers = [
      { key: "cured meat", text: "eat meat", amount: this.meatHeal() },
      { key: "medicine", text: "use meds", amount: WORLD_MEDS_HEAL },
      { key: "hypo", text: "use hypo", amount: WORLD_HYPO_HEAL },
    ];
    return healers
      .filter((healer) => {
        void healer.amount;
        return this.outfitItem(healer.key) > 0;
      })
      .map((healer) => ({
        key: `heal:${healer.key}`,
        text: healer.text,
        cost: { [healer.key]: 1 },
        disabled:
          this.playerHp() >= this.playerMaxHp() ||
          this.engine.cooldowns.isActive(this.healCooldownKey(healer.key)),
        cooldownRemainingMs: this.engine.cooldowns.snapshot(
          this.healCooldownKey(healer.key),
        ).remainingMs,
        kind: "heal" as const,
      }));
  }

  private availableDefensiveActions(): CombatActionSnapshot[] {
    const actions: CombatActionSnapshot[] = [];
    if (this.store("kinetic armour") > 0) {
      const cooldown = this.engine.cooldowns.snapshot("event.combat.shield");
      actions.push({
        key: "shield",
        text: "shield",
        cost: {},
        disabled: cooldown.active || this.combatState?.phase !== "fighting",
        cooldownRemainingMs: cooldown.remainingMs,
        kind: "defend",
      });
    }
    if (this.outfitItem("stim") > 0) {
      const cooldown = this.engine.cooldowns.snapshot("event.combat.stim");
      actions.push({
        key: "stim",
        text: "boost",
        cost: {},
        disabled:
          cooldown.active ||
          this.combatState?.phase !== "fighting" ||
          this.playerHp() <= STIM_HP_COST,
        cooldownRemainingMs: cooldown.remainingMs,
        kind: "boost",
      });
    }
    return actions;
  }

  private attack(weaponKey: string): boolean {
    if (!this.combatDefinition || !this.combatState) return false;
    if (this.combatState.phase !== "fighting") return false;
    const weapon = this.availableCombatWeapons().find(
      (entry) => entry.key === weaponKey,
    );
    if (!weapon) return false;
    if (this.engine.cooldowns.isActive(this.weaponCooldownKey(weapon.key))) {
      return false;
    }
    if (!this.canAffordOutfit(weapon.cost ?? {})) return false;

    this.applyOutfitCost(weapon.cost ?? {});
    this.engine.cooldowns.start(
      this.weaponCooldownKey(weapon.key),
      this.weaponCooldownSeconds(weapon) * 1000,
    );

    if (weapon.type === "unarmed") this.recordPunch();
    if (this.engine.rng.next() <= this.playerHitChance()) {
      if (weapon.damage === "stun") {
        this.combatState.enemyStunnedUntil =
          this.engine.clock.now() + COMBAT_STUN_MS;
      } else {
        const damage = this.weaponDamage(weapon);
        const previousHp = this.combatState.enemyHp;
        if (this.combatState.enemyStatus === "shield") {
          this.combatState.enemyHp = Math.min(
            this.combatState.enemyMaxHp,
            this.combatState.enemyHp + damage,
          );
          this.clearEnemyStatus("shield");
        } else if (this.combatState.enemyStatus === "meditation") {
          this.combatState.enemyMeditateDamage += damage;
        } else {
          this.combatState.enemyHp = Math.max(
            0,
            this.combatState.enemyHp - damage,
          );
          this.applyAtHealthEffects(previousHp, damage);
        }
      }
    }

    if (this.combatState.enemyHp <= 0) this.resolveEnemyDefeat();
    return true;
  }

  private heal(itemKey: string): boolean {
    if (!this.combatState || this.combatState.phase !== "fighting") {
      return false;
    }
    if (this.playerHp() >= this.playerMaxHp()) return false;
    if (this.outfitItem(itemKey) <= 0) return false;
    if (this.engine.cooldowns.isActive(this.healCooldownKey(itemKey))) {
      return false;
    }
    const healAmount =
      itemKey === "cured meat"
        ? this.meatHeal()
        : itemKey === "medicine"
          ? WORLD_MEDS_HEAL
          : itemKey === "hypo"
            ? WORLD_HYPO_HEAL
            : 0;
    if (healAmount <= 0) return false;
    this.addOutfit(itemKey, -1);
    this.setPlayerHp(this.playerHp() + healAmount);
    this.engine.cooldowns.start(
      this.healCooldownKey(itemKey),
      this.healCooldownMs(itemKey),
    );
    return true;
  }

  private enemyAttack(): void {
    if (!this.combatDefinition || !this.combatState) return;
    if (this.combatState.phase !== "fighting") return;
    const stunned =
      this.combatState.enemyStunnedUntil !== null &&
      this.combatState.enemyStunnedUntil > this.engine.clock.now();
    const enemyStatus = this.combatState.enemyStatus;
    const meditating = enemyStatus === "meditation";
    const reflectedDamage = this.combatState.enemyMeditateDamage;
    const hit =
      !stunned &&
      !meditating &&
      (reflectedDamage > 0 ||
        this.engine.rng.next() <= this.enemyHitChance(this.combatDefinition));
    if (hit) {
      const incomingDamage =
        reflectedDamage > 0
          ? reflectedDamage
          : this.enemyDamageForStatus(enemyStatus);
      this.combatState.enemyMeditateDamage = 0;
      const wasShielded = this.combatState.playerShielded;
      if (wasShielded) {
        this.setPlayerHp(this.playerHp() + incomingDamage);
        this.combatState.playerShielded = false;
      } else {
        this.setPlayerHp(this.playerHp() - incomingDamage);
      }
      if (enemyStatus === "venomous" && !wasShielded) {
        this.schedulePlayerDot(Math.floor(incomingDamage / 2));
      }
    }
    if (enemyStatus === "venomous" || enemyStatus === "energised") {
      this.combatState.enemyStatus = null;
    }
    if (this.playerHp() <= 0) {
      this.resolvePlayerDeath();
      return;
    }
    this.scheduleEnemyAttack(this.enemyAttackDelayMs());
  }

  private resolvePlayerDeath(): void {
    if (!this.combatDefinition || !this.combatState) return;
    const outcome: CombatDeathOutcome = {
      reason: "combat",
      returnLocation: "room",
      notification: EXPEDITION_DEATH_NOTIFICATION,
    };

    this.expedition.abortOnDeath();
    this.engine.notifications.notify("event", outcome.notification);
    this.clear();
    this.callbacks.onPlayerDeath?.(outcome);
  }

  private resolveSafeReturn(): CombatLeaveOutcome {
    this.returnOutfit();
    this.combat.dispatch({ type: "combat.setVictoryReturn", payload: {} });
    return {
      reason: "victory",
      returnLocation: "path",
    };
  }

  private resolveSceneContinue(): CombatLeaveOutcome {
    return {
      reason: "continue",
      returnLocation: null,
    };
  }

  private winCombat(): void {
    if (!this.combatDefinition || !this.combatState) return;
    this.combatState.phase = "won";
    this.combatState.loot = this.rollLoot(this.combatDefinition.loot);
    this.engine.cooldowns.start(
      "event.combat.takeEverything",
      COMBAT_LEAVE_COOLDOWN_MS,
    );
    this.engine.cooldowns.start("event.combat.leave", COMBAT_LEAVE_COOLDOWN_MS);
    if (this.enemyAttackTimer !== null) {
      this.engine.clock.clearTimer(this.enemyAttackTimer);
    }
    if (this.enemyExplosionTimer !== null) {
      this.engine.clock.clearTimer(this.enemyExplosionTimer);
    }
    this.enemyAttackTimer = null;
    this.enemyExplosionTimer = null;
    this.clearPlayerDot();
    this.clearPlayerBoost();
    this.clearEnemySpecials();
    this.clearEnemyStatus();
  }

  private resolveEnemyDefeat(): void {
    if (!this.combatDefinition || !this.combatState) return;
    if ((this.combatDefinition.explosion ?? 0) > 0) {
      this.startEnemyExplosion();
      return;
    }
    this.winCombat();
  }

  private startEnemyExplosion(): void {
    if (!this.combatDefinition || !this.combatState) return;
    this.combatState.phase = "exploding";
    this.clearCombatTimersForExplosion();
    this.enemyExplosionTimer = this.engine.clock.setTimeout(() => {
      this.enemyExplosionTimer = null;
      this.applyEnemyExplosion();
    }, COMBAT_EXPLOSION_MS);
  }

  private applyEnemyExplosion(): void {
    if (!this.combatDefinition || !this.combatState) return;
    if (this.combatState.phase !== "exploding") return;
    const damage = this.combatDefinition.explosion ?? 0;
    if (this.combatState.playerShielded) {
      this.setPlayerHp(this.playerHp() + damage);
      this.combatState.playerShielded = false;
    } else {
      this.setPlayerHp(this.playerHp() - damage);
    }
    if (this.playerHp() <= 0) {
      this.resolvePlayerDeath();
      return;
    }
    this.winCombat();
  }

  private clearCombatTimersForExplosion(): void {
    if (this.enemyAttackTimer !== null) {
      this.engine.clock.clearTimer(this.enemyAttackTimer);
      this.enemyAttackTimer = null;
    }
    this.clearPlayerDot();
    this.clearPlayerBoost();
    this.clearEnemySpecials();
    this.clearEnemyStatus();
  }

  private shield(): boolean {
    if (!this.combatState || this.combatState.phase !== "fighting") {
      return false;
    }
    if (this.store("kinetic armour") <= 0) return false;
    if (this.engine.cooldowns.isActive("event.combat.shield")) return false;
    this.combatState.playerShielded = true;
    this.engine.cooldowns.start("event.combat.shield", SHIELD_COOLDOWN_MS);
    return true;
  }

  private stim(): boolean {
    if (!this.combatState || this.combatState.phase !== "fighting") {
      return false;
    }
    if (this.outfitItem("stim") <= 0) return false;
    if (this.playerHp() <= STIM_HP_COST) return false;
    if (this.engine.cooldowns.isActive("event.combat.stim")) return false;
    this.setPlayerHp(this.playerHp() - STIM_HP_COST);
    this.schedulePlayerBoostExpiry();
    this.engine.cooldowns.start("event.combat.stim", STIM_COOLDOWN_MS);
    if (this.playerHp() <= 0) {
      this.resolvePlayerDeath();
    }
    return true;
  }

  private takeCombatLoot(): boolean {
    if (!this.combatState || this.combatState.phase !== "won") return false;
    if (this.engine.cooldowns.isActive("event.combat.takeEverything")) {
      return false;
    }
    if (!this.canTakeCombatLoot()) return false;
    let freeSpace = this.outfitFreeSpace();
    let tookSomething = false;

    for (const [key, amount] of Object.entries(this.combatState.loot)) {
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
        this.combatState.loot[key] = remaining;
      } else {
        delete this.combatState.loot[key];
      }
      if (freeSpace <= 0) break;
    }

    this.combatState.lootTaken =
      Object.keys(this.combatState.loot).length === 0;
    return tookSomething;
  }

  private takeLootItem(key: string): boolean {
    if (!this.combatState || this.combatState.phase !== "won") return false;
    const amount = this.combatState.loot[key] ?? 0;
    if (amount <= 0) return false;
    if (originalPathWeightFor(key) > this.outfitFreeSpace() + 1e-9) {
      return false;
    }
    this.addOutfit(key, 1);
    if (amount === 1) {
      delete this.combatState.loot[key];
    } else {
      this.combatState.loot[key] = amount - 1;
    }
    this.combatState.lootTaken =
      Object.keys(this.combatState.loot).length === 0;
    return true;
  }

  private dropForLoot(lootKey: string, outfitKey: string): boolean {
    if (!this.combatState || this.combatState.phase !== "won") return false;
    if ((this.combatState.loot[lootKey] ?? 0) <= 0) return false;
    const dropCount = this.dropCountFor(lootKey, outfitKey);
    if (dropCount <= 0) return false;
    this.addOutfit(outfitKey, -dropCount);
    this.combatState.loot[outfitKey] =
      (this.combatState.loot[outfitKey] ?? 0) + dropCount;
    return this.takeLootItem(lootKey);
  }

  private lootTakeActions(): CombatActionSnapshot[] {
    if (!this.combatState) return [];
    return Object.entries(this.combatState.loot).map(([key, amount]) => ({
      key: `take:${key}`,
      text: `${key} [${amount}]`,
      cost: {},
      disabled:
        amount <= 0 ||
        originalPathWeightFor(key) > this.outfitFreeSpace() + 1e-9,
      cooldownRemainingMs: 0,
      kind: "take" as const,
    }));
  }

  private lootDropActions(): CombatActionSnapshot[] {
    if (!this.combatState) return [];
    const actions: CombatActionSnapshot[] = [];
    for (const [lootKey, amount] of Object.entries(this.combatState.loot)) {
      if (amount <= 0) continue;
      if (originalPathWeightFor(lootKey) <= this.outfitFreeSpace() + 1e-9) {
        continue;
      }
      for (const [outfitKey, outfitAmount] of Object.entries(
        this.combat.read().outfit,
      )) {
        const dropCount = this.dropCountFor(lootKey, outfitKey);
        if (dropCount <= 0 || dropCount > outfitAmount) continue;
        actions.push({
          key: `dropFor:${lootKey}:${outfitKey}`,
          text: `drop ${outfitKey} x${dropCount} for ${lootKey}`,
          cost: {},
          disabled: false,
          cooldownRemainingMs: 0,
          kind: "drop",
        });
      }
    }
    return actions;
  }

  private dropCountFor(lootKey: string, outfitKey: string): number {
    if (lootKey === outfitKey) return 0;
    const outfitAmount = this.outfitItem(outfitKey);
    if (outfitAmount <= 0) return 0;
    const outfitWeight = originalPathWeightFor(outfitKey);
    if (outfitWeight <= 0) return 0;
    const needed = originalPathWeightFor(lootKey) - this.outfitFreeSpace();
    if (needed <= 0) return 0;
    return Math.min(outfitAmount, Math.ceil((needed - 1e-9) / outfitWeight));
  }

  private canTakeCombatLoot(): boolean {
    if (!this.combatState || this.combatState.phase !== "won") return false;
    for (const [key, amount] of Object.entries(this.combatState.loot)) {
      if (amount <= 0) continue;
      if (originalPathWeightFor(key) <= this.outfitFreeSpace() + 1e-9) {
        return true;
      }
    }
    return false;
  }

  private canTakeEverything(): boolean {
    if (!this.combatState || this.combatState.phase !== "won") return false;
    return (
      this.lootWeight(this.combatState.loot) <= this.outfitFreeSpace() + 1e-9
    );
  }

  private outfitFreeSpace(): number {
    return Math.max(0, this.outfitCapacity() - this.outfitWeight());
  }

  private outfitCapacity(): number {
    return originalPathCapacity(this.combat.read().stores);
  }

  private outfitWeight(): number {
    return this.lootWeight(this.combat.read().outfit);
  }

  private lootWeight(items: Record<string, number>): number {
    return Object.entries(items).reduce(
      (total, [key, amount]) => total + amount * originalPathWeightFor(key),
      0,
    );
  }

  private rollLoot(
    loot: OriginalCombatDefinition["loot"],
  ): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [key, entry] of Object.entries(loot)) {
      if (this.engine.rng.next() < entry.chance) {
        result[key] =
          Math.floor(this.engine.rng.next() * (entry.max - entry.min)) +
          entry.min;
      }
    }
    return result;
  }

  private applyAtHealthEffects(previousHp: number, damage: number): void {
    if (!this.combatDefinition || !this.combatState) return;
    if (damage <= 0) return;
    const atHealth = this.combatDefinition.atHealth ?? {};
    for (const [thresholdText, status] of Object.entries(atHealth)) {
      const threshold = Number(thresholdText);
      if (!status || Number.isNaN(threshold)) continue;
      if (this.combatState.enemyHp <= threshold && previousHp > threshold) {
        this.setEnemyStatus(status);
      }
    }
  }

  private setEnemyStatus(status: OriginalCombatStatus): void {
    if (!this.combatDefinition || !this.combatState) return;
    this.clearEnemyStatus();
    this.combatState.enemyStatus = status;
    this.combatState.lastSpecialStatus = status;
    if (status === "enraged") {
      this.scheduleEnemyAttack(COMBAT_ENRAGED_ATTACK_MS);
      this.scheduleEnemyStatusClear(COMBAT_ENRAGE_MS);
    } else if (status === "meditation") {
      this.scheduleEnemyStatusClear(COMBAT_MEDITATE_MS);
    }
  }

  private clearEnemyStatus(expected?: OriginalCombatStatus): void {
    if (!this.combatState) return;
    if (expected && this.combatState.enemyStatus !== expected) return;
    if (this.enemyStatusTimer !== null) {
      this.engine.clock.clearTimer(this.enemyStatusTimer);
    }
    const wasEnraged = this.combatState.enemyStatus === "enraged";
    this.enemyStatusTimer = null;
    this.combatState.enemyStatus = null;
    this.combatState.enemyStatusExpiresAt = null;
    if (
      wasEnraged &&
      this.combatDefinition &&
      this.combatState.phase === "fighting"
    ) {
      this.scheduleEnemyAttack(this.combatDefinition.attackDelay * 1000);
    }
  }

  private scheduleEnemyStatusClear(delayMs: number): void {
    if (!this.combatState || this.combatState.phase !== "fighting") return;
    if (this.enemyStatusTimer !== null) {
      this.engine.clock.clearTimer(this.enemyStatusTimer);
    }
    this.enemyStatusTimer = this.engine.clock.setTimeout(() => {
      this.enemyStatusTimer = null;
      this.clearEnemyStatus();
    }, delayMs);
  }

  private restoreEnemyStatusExpiration(dueAt: number | null): void {
    if (!this.combatState || this.combatState.phase !== "fighting") return;
    if (dueAt === null || this.combatState.enemyStatus === null) return;
    this.scheduleEnemyStatusClear(this.remainingMs(dueAt));
  }

  private restoreEnemySpecials(dueAts: Record<number, number>): void {
    if (!this.combatDefinition || !this.combatState) return;
    if (this.combatState.phase !== "fighting") return;
    this.clearEnemySpecials();
    for (const [
      indexText,
      special,
    ] of this.combatDefinition.specials?.entries() ?? []) {
      const index = Number(indexText);
      this.scheduleEnemySpecial(
        index,
        dueAts[index] === undefined
          ? special.delaySeconds * 1000
          : this.remainingMs(dueAts[index]),
      );
    }
  }

  private scheduleEnemySpecial(index: number, delayMs: number): void {
    if (!this.combatDefinition || !this.combatState) return;
    const special = this.combatDefinition.specials?.[index];
    if (!special) return;
    const existing = this.enemySpecialTimers.get(index);
    if (existing !== undefined) this.engine.clock.clearTimer(existing);
    const timer = this.engine.clock.setTimeout(() => {
      this.enemySpecialTimers.delete(index);
      this.triggerEnemySpecial(index);
      this.scheduleEnemySpecial(index, special.delaySeconds * 1000);
    }, delayMs);
    this.enemySpecialTimers.set(index, timer);
  }

  private triggerEnemySpecial(index: number): void {
    if (!this.combatDefinition || !this.combatState) return;
    if (this.combatState.phase !== "fighting") return;
    const special = this.combatDefinition.specials?.[index];
    if (!special) return;
    const statuses = Array.isArray(special.status)
      ? special.status
      : [special.status];
    const choices =
      special.avoidRepeat && statuses.length > 1
        ? statuses.filter(
            (status) => status !== this.combatState?.lastSpecialStatus,
          )
        : statuses;
    const selected =
      choices[Math.floor(this.engine.rng.next() * choices.length)] ??
      statuses[0];
    if (selected) this.setEnemyStatus(selected);
  }

  private clearEnemySpecials(): void {
    for (const timer of this.enemySpecialTimers.values()) {
      this.engine.clock.clearTimer(timer);
    }
    this.enemySpecialTimers.clear();
    if (this.combatState) this.combatState.enemySpecialDueAts = {};
  }

  private enemySpecialDueAts(): Record<number, number> {
    return Object.fromEntries(
      [...this.enemySpecialTimers.entries()].flatMap(([index, timer]) => {
        const dueAt = this.timerDueAt(timer);
        return dueAt === null ? [] : [[index, dueAt]];
      }),
    );
  }

  private scheduleEnemyAttack(delayMs: number): void {
    if (this.enemyAttackTimer !== null) {
      this.engine.clock.clearTimer(this.enemyAttackTimer);
    }
    this.enemyAttackTimer = this.engine.clock.setTimeout(() => {
      this.enemyAttackTimer = null;
      this.enemyAttack();
    }, delayMs);
  }

  private restoreEnemyAttack(dueAt: number | null): void {
    if (!this.combatDefinition || !this.combatState) return;
    if (this.combatState.phase !== "fighting") return;
    this.scheduleEnemyAttack(
      dueAt === null
        ? this.combatDefinition.attackDelay * 1000
        : this.remainingMs(dueAt),
    );
  }

  private restoreEnemyExplosion(dueAt: number | null): void {
    if (!this.combatDefinition || !this.combatState) return;
    if (this.combatState.phase !== "exploding") return;
    if (dueAt === null) {
      this.startEnemyExplosion();
      return;
    }
    this.enemyExplosionTimer = this.engine.clock.setTimeout(() => {
      this.enemyExplosionTimer = null;
      this.applyEnemyExplosion();
    }, this.remainingMs(dueAt));
  }

  private schedulePlayerDot(
    damage: number,
    delayMs = COMBAT_DOT_TICK_MS,
  ): void {
    if (!this.combatState || this.combatState.phase !== "fighting") return;
    if (damage <= 0) return;
    this.clearPlayerDot();
    this.combatState.playerDotDamage = damage;
    this.playerDotTimer = this.engine.clock.setTimeout(() => {
      this.playerDotTimer = null;
      this.applyPlayerDot();
    }, delayMs);
  }

  private restorePlayerDot(dueAt: number | null, damage: number): void {
    if (!this.combatState || this.combatState.phase !== "fighting") return;
    if (dueAt === null || damage <= 0) return;
    this.schedulePlayerDot(damage, this.remainingMs(dueAt));
  }

  private applyPlayerDot(): void {
    if (!this.combatState || this.combatState.phase !== "fighting") return;
    const damage = this.combatState.playerDotDamage;
    if (damage <= 0) return;
    this.setPlayerHp(this.playerHp() - damage);
    if (this.playerHp() <= 0) {
      this.resolvePlayerDeath();
      return;
    }
    this.schedulePlayerDot(damage);
  }

  private clearPlayerDot(): void {
    if (this.playerDotTimer !== null) {
      this.engine.clock.clearTimer(this.playerDotTimer);
    }
    this.playerDotTimer = null;
    if (this.combatState) {
      this.combatState.playerDotDamage = 0;
      this.combatState.playerDotDueAt = null;
    }
  }

  private schedulePlayerBoostExpiry(delayMs = STIM_BOOST_MS): void {
    if (!this.combatState || this.combatState.phase !== "fighting") return;
    this.clearPlayerBoost();
    this.combatState.playerBoosted = true;
    this.combatState.playerBoostExpiresAt = this.engine.clock.now() + delayMs;
    this.playerBoostTimer = this.engine.clock.setTimeout(() => {
      this.playerBoostTimer = null;
      this.clearPlayerBoost();
    }, delayMs);
  }

  private restorePlayerBoost(dueAt: number | null | undefined): void {
    if (!this.combatState || this.combatState.phase !== "fighting") return;
    if (
      !this.combatState.playerBoosted ||
      dueAt === null ||
      dueAt === undefined
    ) {
      this.clearPlayerBoost();
      return;
    }
    if (dueAt <= this.engine.clock.now()) {
      this.clearPlayerBoost();
      return;
    }
    this.schedulePlayerBoostExpiry(this.remainingMs(dueAt));
  }

  private clearPlayerBoost(): void {
    if (this.playerBoostTimer !== null) {
      this.engine.clock.clearTimer(this.playerBoostTimer);
    }
    this.playerBoostTimer = null;
    if (this.combatState) {
      this.combatState.playerBoosted = false;
      this.combatState.playerBoostExpiresAt = null;
    }
  }

  private combatStatusText(): string {
    if (!this.combatDefinition || !this.combatState) return "";
    if (this.combatState.phase === "won") {
      return this.combatDefinition.deathMessage;
    }
    return this.combatDefinition.enemyName;
  }

  private playerMaxHp(): number {
    if (this.store("kinetic armour") > 0) {
      return WORLD_BASE_HEALTH + 75;
    }
    if (this.store("s armour") > 0) {
      return WORLD_BASE_HEALTH + 35;
    }
    if (this.store("i armour") > 0) {
      return WORLD_BASE_HEALTH + 15;
    }
    if (this.store("l armour") > 0) {
      return WORLD_BASE_HEALTH + 5;
    }
    return WORLD_BASE_HEALTH;
  }

  private playerHp(): number {
    if (this.expedition.active()) {
      return Math.max(
        0,
        Math.min(
          this.expedition.health(this.playerMaxHp()),
          this.playerMaxHp(),
        ),
      );
    }
    const current = this.combat.read().health;
    if (current !== null) {
      return Math.max(0, Math.min(current, this.playerMaxHp()));
    }
    return this.playerMaxHp();
  }

  private setPlayerHp(value: number): void {
    if (this.expedition.active()) {
      this.expedition.setHealth(value, this.playerMaxHp());
      return;
    }
    this.combat.dispatch({
      type: "combat.setHealth",
      payload: { value, maximum: this.playerMaxHp() },
    });
  }

  private playerHitChance(): number {
    return WORLD_BASE_HIT_CHANCE + (this.combat.read().perks.precise ? 0.1 : 0);
  }

  private enemyHitChance(combat: OriginalCombatDefinition): number {
    return combat.hit * (this.combat.read().perks.evasive ? 0.8 : 1);
  }

  private enemyDamageForStatus(status: OriginalCombatStatus | null): number {
    if (!this.combatDefinition) return 0;
    const multiplier = status === "energised" ? COMBAT_ENERGISE_MULTIPLIER : 1;
    return this.combatDefinition.damage * multiplier;
  }

  private enemyAttackDelayMs(): number {
    if (!this.combatDefinition) return 0;
    return this.combatState?.enemyStatus === "enraged"
      ? COMBAT_ENRAGED_ATTACK_MS
      : this.combatDefinition.attackDelay * 1000;
  }

  private weaponDamage(weapon: WorldWeaponDefinition): number {
    if (typeof weapon.damage !== "number") return 0;
    let damage = weapon.damage;
    if (weapon.type === "unarmed" && this.combat.read().perks.boxer) {
      damage *= 2;
    }
    if (
      weapon.type === "unarmed" &&
      this.combat.read().perks["martial artist"]
    ) {
      damage *= 3;
    }
    if (
      weapon.type === "unarmed" &&
      this.combat.read().perks["unarmed master"]
    ) {
      damage *= 2;
    }
    if (weapon.type === "melee" && this.combat.read().perks.barbarian) {
      damage = Math.floor(damage * 1.5);
    }
    return damage;
  }

  private weaponCooldownSeconds(weapon: WorldWeaponDefinition): number {
    const boostMultiplier = this.combatState?.playerBoosted ? 0.5 : 1;
    if (
      weapon.type === "unarmed" &&
      this.combat.read().perks["unarmed master"]
    ) {
      return (weapon.cooldown / 2) * boostMultiplier;
    }
    return weapon.cooldown * boostMultiplier;
  }

  private recordPunch(): void {
    this.combat.dispatch({ type: "combat.recordPunch", payload: {} });
  }

  private meatHeal(): number {
    return WORLD_MEAT_HEAL * (this.combat.read().perks.gastronome ? 2 : 1);
  }

  private canAffordOutfit(cost: Record<string, number>): boolean {
    return Object.entries(cost).every(
      ([store, amount]) => this.outfitItem(store) >= amount,
    );
  }

  private applyOutfitCost(cost: Record<string, number>): void {
    for (const [store, amount] of Object.entries(cost)) {
      this.addOutfit(store, -amount);
    }
  }

  private addOutfit(key: string, amount: number): void {
    this.combat.dispatch({
      type: "combat.changeOutfit",
      payload: { key, amount },
    });
  }

  private weaponCooldownKey(weaponKey: string): string {
    return `event.combat.weapon.${weaponKey}`;
  }

  private healCooldownKey(itemKey: string): string {
    return `event.combat.heal.${itemKey}`;
  }

  private healCooldownMs(itemKey: string): number {
    if (itemKey === "cured meat") return EAT_COOLDOWN_MS;
    if (itemKey === "medicine") return MEDS_COOLDOWN_MS;
    if (itemKey === "hypo") return HYPO_COOLDOWN_MS;
    return 0;
  }

  private store(key: string): number {
    return this.combat.read().stores[key] ?? 0;
  }

  private outfitItem(key: string): number {
    return this.combat.read().outfit[key] ?? 0;
  }

  private returnOutfit(): void {
    this.combat.dispatch({ type: "combat.returnOutfit", payload: {} });
  }

  private timerDueAt(id: TimerId | null): number | null {
    return this.engine.clock.timerSnapshot(id)?.dueAt ?? null;
  }

  private remainingMs(dueAt: number): number {
    return Math.max(0, dueAt - this.engine.clock.now());
  }
}
