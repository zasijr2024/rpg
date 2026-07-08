import {
  WORLD_DIRECTIONS,
  WORLD_FIGHT_CHANCE,
  WORLD_MOVES_PER_FOOD,
  WORLD_MOVES_PER_WATER,
  WORLD_RADIUS,
  WORLD_TILE,
  WORLD_VILLAGE_POS,
  originalWorldDisplayLabel,
  originalWorldGenerateMap,
  originalWorldLandmarks,
  originalWorldLightMap,
  originalWorldMapSearch,
  originalWorldNewMask,
  type WorldMapGrid,
  type WorldMaskGrid,
} from "../../content/original/world/worldData";
import type { GameEngine } from "../GameEngine";
import {
  readBoolean,
  readNumber,
  readNumericRecord,
  readStringUnion,
} from "../state/selectors";
import {
  originalPathMaxHealth,
  originalPathMaxWater,
  originalPathReturnOutfitToStores,
} from "../path/pathOutfit";

export type WorldEncounterTerrain =
  | "forest"
  | "field"
  | "barrens"
  | typeof WORLD_TILE.FOREST
  | typeof WORLD_TILE.FIELD
  | typeof WORLD_TILE.BARRENS;

export interface WorldEncounterContext {
  distance: number;
  terrain: WorldEncounterTerrain;
}

export interface WorldEventResolver {
  encounterEventKey(context: WorldEncounterContext): string | null;
  setpieceEventKey(scene: string): string | null;
}

export type WorldMoveDirection = "north" | "south" | "west" | "east";

export interface WorldMoveOutcome {
  moved: boolean;
  encounter: WorldEncounterContext | null;
}

export interface WorldMapCellSnapshot {
  x: number;
  y: number;
  glyph: string;
  visible: boolean;
  current: boolean;
}

export interface WorldLandmarkSnapshot {
  scene: string;
  label: string;
  tile: string;
}

export interface WorldStateSnapshot {
  unlocked: boolean;
  active: boolean;
  title: "A Dusty Path";
  x: number;
  y: number;
  distance: number;
  hp: number;
  maxHp: number;
  water: number;
  maxWater: number;
  food: number;
  rows: WorldMapCellSnapshot[][];
  landmark: WorldLandmarkSnapshot | null;
  canReturn: boolean;
}

const WORLD_ENCOUNTER_KEYS: Record<string, readonly string[]> = {
  "near:forest": ["encounter.snarling-beast"],
  "near:barrens": ["encounter.gaunt-man"],
  "near:field": ["encounter.strange-bird", "encounter.two-headed-creature"],
  "mid:forest": ["encounter.man-eater"],
  "mid:barrens": ["encounter.shivering-man", "encounter.scavenger"],
  "mid:field": ["encounter.huge-lizard"],
  "far:forest": ["encounter.feral-terror"],
  "far:barrens": ["encounter.soldier"],
  "far:field": ["encounter.sniper"],
};

const WORLD_SETPIECE_EVENT_KEYS: Record<string, readonly string[]> = {
  outpost: ["setpiece.outpost"],
  ironmine: ["setpiece.ironmine"],
  coalmine: ["setpiece.coalmine"],
  sulphurmine: ["setpiece.sulphurmine"],
  house: ["setpiece.old-house"],
  cave: [
    "setpiece.cave-depths",
    "setpiece.cave-camp-cache",
    "setpiece.cave-wanderer-nest",
    "setpiece.cave-old-case",
  ],
  town: [
    "setpiece.town-thug",
    "setpiece.town-schoolhouse",
    "setpiece.town-park-vigilante",
    "setpiece.town-caravan-vigilante",
    "setpiece.town-clinic",
    "setpiece.town-clinic-madman",
  ],
  city: [
    "setpiece.city-old-tower",
    "setpiece.city-old-tower-scavenged",
    "setpiece.city-old-tower-thug-rubble",
    "setpiece.city-old-tower-rubble",
    "setpiece.city-sniper",
    "setpiece.city-hospital",
    "setpiece.city-soldier-patrol",
    "setpiece.city-commando-settlement",
    "setpiece.city-commando-supplies",
    "setpiece.city-subway",
    "setpiece.city-subway-scavenged",
    "setpiece.city-subway-beast-rubble",
    "setpiece.city-military-camp",
    "setpiece.city-military-camp-supplies",
    "setpiece.city-shanty-market",
    "setpiece.city-shanty-crowd",
    "setpiece.city-shanty-crowd-sack",
    "setpiece.city-shanty-crowd-youth",
    "setpiece.city-drying-hut",
    "setpiece.city-drying-hut-sack",
    "setpiece.city-drying-meat-youth",
    "setpiece.city-hospital-ward",
    "setpiece.city-hospital-squatters",
    "setpiece.city-hospital-deformed",
    "setpiece.city-hospital-tentacles",
    "setpiece.city-hospital-cache",
    "setpiece.city-hospital-old-man-theatres",
    "setpiece.city-hospital-old-man-squatters",
    "setpiece.city-hospital-medicine",
  ],
  ship: ["setpiece.crashed-ship"],
  borehole: ["setpiece.borehole"],
  battlefield: ["setpiece.battlefield"],
  swamp: ["setpiece.swamp"],
  cache: ["setpiece.destroyed-village"],
};

const WORLD_CENTER = {
  x: WORLD_VILLAGE_POS[0],
  y: WORLD_VILLAGE_POS[1],
};

const LANDMARKS_BY_TILE = new Map(
  originalWorldLandmarks.map((landmark) => [landmark.tile, landmark]),
);

export class WorldRuntime implements WorldEventResolver {
  constructor(private readonly engine: GameEngine) {}

  snapshot(): WorldStateSnapshot {
    const active = this.active();
    const [x, y] = this.position();
    return {
      unlocked: readBoolean(this.engine.state, "features.location.world"),
      active,
      title: "A Dusty Path",
      x,
      y,
      distance: this.distance(x, y),
      hp: readNumber(this.engine.state, "game.world.health", this.maxHealth()),
      maxHp: this.maxHealth(),
      water: readNumber(this.engine.state, "game.world.water", this.maxWater()),
      maxWater: this.maxWater(),
      food: readNumber(this.engine.state, 'outfit["cured meat"]'),
      rows: this.mapRows(x, y),
      landmark: this.landmarkAt(x, y),
      canReturn: x === WORLD_CENTER.x && y === WORLD_CENTER.y,
    };
  }

  embark(): void {
    this.ensureMap();
    this.engine.state.set("features.location.world", true);
    this.engine.state.set("game.world.active", true);
    this.engine.state.set("game.world.x", WORLD_CENTER.x);
    this.engine.state.set("game.world.y", WORLD_CENTER.y);
    this.engine.state.set("game.world.health", this.maxHealth());
    this.engine.state.set("game.world.water", this.maxWater());
    this.engine.state.set("game.world.foodMove", 0);
    this.engine.state.set("game.world.waterMove", 0);
    this.engine.state.remove("game.world.dead");
    this.markVisible(WORLD_CENTER.x, WORLD_CENTER.y);
  }

  ensureMap(): void {
    const existingMap = this.map();
    if (existingMap) {
      if (!this.mask()) {
        this.engine.state.set(
          "game.world.mask",
          originalWorldNewMask(this.hasScoutPerk()),
          true,
        );
      }
      this.storeShipDirection(existingMap);
      return;
    }

    const map = originalWorldGenerateMap(this.engine.rng, {
      includeCache: this.hasPreviousStores(),
    });
    this.engine.state.set("game.world.map", map, true);
    this.engine.state.set(
      "game.world.mask",
      originalWorldNewMask(this.hasScoutPerk()),
      true,
    );
    this.storeShipDirection(map);
  }

  move(direction: WorldMoveDirection): WorldMoveOutcome {
    if (!this.active()) return { moved: false, encounter: null };
    const delta =
      WORLD_DIRECTIONS[
        direction.toUpperCase() as keyof typeof WORLD_DIRECTIONS
      ];
    const [x, y] = this.position();
    const nextX = Math.max(0, Math.min(WORLD_RADIUS * 2, x + delta[0]));
    const nextY = Math.max(0, Math.min(WORLD_RADIUS * 2, y + delta[1]));
    if (nextX === x && nextY === y) return { moved: false, encounter: null };

    this.engine.state.set("game.world.x", nextX);
    this.engine.state.set("game.world.y", nextY);
    this.markVisible(nextX, nextY);
    this.useSupplies();

    if (
      this.randomEncountersDisabled() ||
      this.landmarkAt(nextX, nextY) ||
      this.engine.rng.next() >= WORLD_FIGHT_CHANCE
    ) {
      return { moved: true, encounter: null };
    }

    return {
      moved: true,
      encounter: {
        distance: this.distance(nextX, nextY),
        terrain: this.terrainName(this.tileAt(nextX, nextY)),
      },
    };
  }

  enterLandmark(): string | null {
    const [x, y] = this.position();
    const landmark = this.landmarkAt(x, y);
    return landmark?.scene ?? null;
  }

  returnHome(): boolean {
    if (!this.active()) return false;
    const [x, y] = this.position();
    if (x !== WORLD_CENTER.x || y !== WORLD_CENTER.y) return false;
    this.returnOutfitToStores();
    this.closeExpedition();
    this.engine.notifications.notify(
      "world",
      "the village is close enough to touch",
    );
    return true;
  }

  finishEventReturnToPath(): void {
    this.closeExpedition();
  }

  encounterEventKey(context: WorldEncounterContext): string | null {
    const band = this.encounterDistanceBand(context.distance);
    if (!band) return null;
    const terrain = this.normalizedTerrain(context.terrain);
    if (!terrain) return null;
    return this.pick(WORLD_ENCOUNTER_KEYS[`${band}:${terrain}`] ?? []);
  }

  setpieceEventKey(scene: string): string | null {
    if (scene === "executioner") {
      return this.engine.state.get("game.world.executioner", true) === true
        ? "executioner.antechamber"
        : "executioner.intro-defences";
    }
    return this.pick(WORLD_SETPIECE_EVENT_KEYS[scene] ?? []);
  }

  private encounterDistanceBand(
    distance: number,
  ): "near" | "mid" | "far" | null {
    if (!Number.isFinite(distance) || distance < 0) return null;
    if (distance <= 10) return "near";
    if (distance <= 20) return "mid";
    return "far";
  }

  private normalizedTerrain(
    terrain: WorldEncounterTerrain,
  ): "forest" | "field" | "barrens" | null {
    if (terrain === "forest" || terrain === WORLD_TILE.FOREST) return "forest";
    if (terrain === "field" || terrain === WORLD_TILE.FIELD) return "field";
    if (terrain === "barrens" || terrain === WORLD_TILE.BARRENS) {
      return "barrens";
    }
    return null;
  }

  private pick(candidates: readonly string[]): string | null {
    if (candidates.length === 0) return null;
    return candidates[this.engine.rng.nextInt(candidates.length)] ?? null;
  }

  private active(): boolean {
    return readBoolean(this.engine.state, "game.world.active");
  }

  private position(): readonly [number, number] {
    const x = readNumber(this.engine.state, "game.world.x", WORLD_CENTER.x);
    const y = readNumber(this.engine.state, "game.world.y", WORLD_CENTER.y);
    return [x, y] as const;
  }

  private map(): WorldMapGrid | null {
    const value = this.engine.state.get("game.world.map", true);
    if (!Array.isArray(value) || value.length !== WORLD_RADIUS * 2 + 1) {
      return null;
    }
    if (
      !value.every(
        (column) =>
          Array.isArray(column) &&
          column.length === WORLD_RADIUS * 2 + 1 &&
          column.every((tile) => typeof tile === "string"),
      )
    ) {
      return null;
    }
    return value as WorldMapGrid;
  }

  private mask(): WorldMaskGrid | null {
    const value = this.engine.state.get("game.world.mask", true);
    if (!Array.isArray(value) || value.length !== WORLD_RADIUS * 2 + 1) {
      return null;
    }
    if (
      !value.every(
        (column) =>
          Array.isArray(column) &&
          column.length === WORLD_RADIUS * 2 + 1 &&
          column.every((visible) => typeof visible === "boolean"),
      )
    ) {
      return null;
    }
    return value as WorldMaskGrid;
  }

  private mapRows(x: number, y: number): WorldMapCellSnapshot[][] {
    const radius = 4;
    const rows: WorldMapCellSnapshot[][] = [];
    for (let rowY = y - radius; rowY <= y + radius; rowY += 1) {
      const row: WorldMapCellSnapshot[] = [];
      for (let colX = x - radius; colX <= x + radius; colX += 1) {
        const inBounds =
          colX >= 0 &&
          colX <= WORLD_RADIUS * 2 &&
          rowY >= 0 &&
          rowY <= WORLD_RADIUS * 2;
        const visible = inBounds && this.visible(colX, rowY);
        row.push({
          x: colX,
          y: rowY,
          glyph:
            colX === x && rowY === y
              ? "@"
              : visible
                ? this.tileAt(colX, rowY)
                : " ",
          visible,
          current: colX === x && rowY === y,
        });
      }
      rows.push(row);
    }
    return rows;
  }

  private tileAt(x: number, y: number): string {
    const map = this.map();
    return map?.[x]?.[y] ?? WORLD_TILE.BARRENS;
  }

  private terrainName(tile: string): "forest" | "field" | "barrens" {
    if (tile === WORLD_TILE.FOREST) return "forest";
    if (tile === WORLD_TILE.FIELD) return "field";
    return "barrens";
  }

  private landmarkAt(x: number, y: number): WorldLandmarkSnapshot | null {
    const tile = this.tileAt(x, y);
    const landmark = LANDMARKS_BY_TILE.get(tile);
    if (!landmark) return null;
    return {
      scene: landmark.scene,
      label: originalWorldDisplayLabel(landmark.label),
      tile,
    };
  }

  private markVisible(x: number, y: number): void {
    const mask = this.mask() ?? originalWorldNewMask(this.hasScoutPerk());
    this.engine.state.set(
      "game.world.mask",
      originalWorldLightMap(x, y, mask, this.hasScoutPerk()),
      true,
    );
  }

  private visible(x: number, y: number): boolean {
    return this.mask()?.[x]?.[y] === true;
  }

  private distance(x: number, y: number): number {
    return Math.max(Math.abs(x - WORLD_CENTER.x), Math.abs(y - WORLD_CENTER.y));
  }

  private useSupplies(): void {
    const foodMove = readNumber(this.engine.state, "game.world.foodMove") + 1;
    const waterMove = readNumber(this.engine.state, "game.world.waterMove") + 1;
    if (foodMove >= WORLD_MOVES_PER_FOOD) {
      this.engine.state.set("game.world.foodMove", 0);
      const food = readNumber(this.engine.state, 'outfit["cured meat"]');
      if (food > 0) {
        this.engine.state.add('outfit["cured meat"]', -1);
        if (food === 1)
          this.engine.notifications.notify("world", "the meat has run out");
      } else {
        this.engine.notifications.notify("world", "starvation sets in");
      }
    } else {
      this.engine.state.set("game.world.foodMove", foodMove);
    }

    if (waterMove >= WORLD_MOVES_PER_WATER) {
      this.engine.state.set("game.world.waterMove", 0);
      const water = readNumber(this.engine.state, "game.world.water");
      if (water > 0) {
        this.engine.state.add("game.world.water", -1);
        if (water === 1)
          this.engine.notifications.notify("world", "there is no more water");
      } else {
        this.engine.notifications.notify(
          "world",
          "the thirst becomes unbearable",
        );
      }
    } else {
      this.engine.state.set("game.world.waterMove", waterMove);
    }
  }

  private maxHealth(): number {
    return originalPathMaxHealth(
      readNumericRecord(this.engine.state, "stores"),
    );
  }

  private maxWater(): number {
    return originalPathMaxWater(readNumericRecord(this.engine.state, "stores"));
  }

  private returnOutfitToStores(): void {
    originalPathReturnOutfitToStores(this.engine);
  }

  private closeExpedition(): void {
    this.engine.state.set("game.world.active", false);
    this.engine.state.set("features.location.path", true);
    this.engine.state.remove("game.path.pendingReturn");
  }

  private randomEncountersDisabled(): boolean {
    return (
      readBoolean(this.engine.state, "config.events.randomDisabled") ||
      readStringUnion(this.engine.state, "game.world.encounters", [
        "disabled",
      ] as const) === "disabled"
    );
  }

  private hasScoutPerk(): boolean {
    return readBoolean(this.engine.state, 'character.perks["scout"]');
  }

  private hasPreviousStores(): boolean {
    return (
      Object.keys(readNumericRecord(this.engine.state, "previous.stores"))
        .length > 0
    );
  }

  private storeShipDirection(map: WorldMapGrid): void {
    const existingShipX = this.engine.state.get("game.world.ship.x");
    const existingShipY = this.engine.state.get("game.world.ship.y");
    if (typeof existingShipX === "number" && typeof existingShipY === "number")
      return;

    const ship = originalWorldMapSearch(WORLD_TILE.SHIP, map, 1)?.[0];
    if (!ship) return;
    this.engine.state.set("game.world.ship.x", ship.x, true);
    this.engine.state.set("game.world.ship.y", ship.y, true);
  }
}
