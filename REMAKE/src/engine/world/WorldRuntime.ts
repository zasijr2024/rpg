import {
  WORLD_DIRECTIONS,
  WORLD_FIGHT_CHANCE,
  WORLD_FIGHT_DELAY,
  WORLD_MEAT_HEAL,
  WORLD_MOVES_PER_FOOD,
  WORLD_MOVES_PER_WATER,
  WORLD_RADIUS,
  WORLD_TILE,
  WORLD_VILLAGE_POS,
  originalWorldDisplayLabel,
  originalWorldDrawRoad,
  originalWorldGenerateMap,
  originalWorldLandmarks,
  originalWorldLightMap,
  originalWorldMarkVisited,
  originalWorldMapSearch,
  originalWorldNewMask,
  originalWorldUncoverMap,
  type WorldMapGrid,
  type WorldMaskGrid,
} from "../../content/original/world/worldData";
import type { GameEngine } from "../GameEngine";
import type { GameNotification } from "../notifications/NotificationCenter";
import {
  originalPathMaxHealth,
  originalPathMaxWater,
} from "../path/pathOutfit";
import {
  EXPEDITION_DEATH_NOTIFICATION,
  ExpeditionTransaction,
} from "./ExpeditionTransaction";
import { WorldDomainFacade } from "./WorldDomain";

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
  recordLandmarkResolutionForEffect(path: string): void;
  canApplyMap(): boolean;
  applyMap(): void;
}

export type WorldMoveDirection = "north" | "south" | "west" | "east";

export interface WorldMoveOutcome {
  moved: boolean;
  encounter: WorldEncounterContext | null;
  returnedHome: boolean;
  setpieceScene: string | null;
}

export interface WorldMapCellSnapshot {
  x: number;
  y: number;
  glyph: string;
  visible: boolean;
  current: boolean;
  label?: string;
}

export interface WorldLandmarkSnapshot {
  scene: string;
  label: string;
  tile: string;
}

export interface WorldVisibleLandmarkSnapshot {
  label: string;
  distance: number;
  direction: WorldCompassDirection | "here";
}

export interface WorldAccessibleSnapshot {
  terrain: string;
  villageDistance: number;
  villageDirection: WorldCompassDirection | "here";
  moves: WorldMoveDirection[];
  landmarks: WorldVisibleLandmarkSnapshot[];
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
  danger: boolean;
  starvation: boolean;
  thirst: boolean;
  rows: WorldMapCellSnapshot[][];
  accessible: WorldAccessibleSnapshot;
  landmark: WorldLandmarkSnapshot | null;
  canReturn: boolean;
  notifications: GameNotification[];
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
  house: ["setpiece.house"],
  cave: ["setpiece.cave"],
  town: ["setpiece.town"],
  city: ["setpiece.city"],
  ship: ["setpiece.ship"],
  borehole: ["setpiece.borehole"],
  battlefield: ["setpiece.battlefield"],
  swamp: ["setpiece.swamp"],
  cache: ["setpiece.cache"],
};

const TERRAIN_MOVE_NOTIFICATIONS: Record<string, string> = {
  [`${WORLD_TILE.FOREST}:${WORLD_TILE.FIELD}`]:
    "the trees yield to dry grass. the yellowed brush rustles in the wind.",
  [`${WORLD_TILE.FOREST}:${WORLD_TILE.BARRENS}`]:
    "the trees are gone. parched earth and blowing dust are poor replacements.",
  [`${WORLD_TILE.FIELD}:${WORLD_TILE.FOREST}`]:
    "trees loom on the horizon. grasses gradually yield to a forest floor of dry branches and fallen leaves.",
  [`${WORLD_TILE.FIELD}:${WORLD_TILE.BARRENS}`]:
    "the grasses thin. soon, only dust remains.",
  [`${WORLD_TILE.BARRENS}:${WORLD_TILE.FIELD}`]:
    "the barrens break at a sea of dying grass, swaying in the arid breeze.",
  [`${WORLD_TILE.BARRENS}:${WORLD_TILE.FOREST}`]:
    "a wall of gnarled trees rises from the dust. their branches twist into a skeletal canopy overhead.",
};

const WORLD_CENTER = {
  x: WORLD_VILLAGE_POS[0],
  y: WORLD_VILLAGE_POS[1],
};

type WorldCompassDirection =
  | "north"
  | "northeast"
  | "east"
  | "southeast"
  | "south"
  | "southwest"
  | "west"
  | "northwest";

const LANDMARKS_BY_TILE = new Map(
  originalWorldLandmarks.map((landmark) => [landmark.tile, landmark]),
);

const MINE_CLEAR_FLAGS: Partial<Record<string, string>> = {
  [WORLD_TILE.IRON_MINE]: "game.world.ironmine",
  [WORLD_TILE.COAL_MINE]: "game.world.coalmine",
  [WORLD_TILE.SULPHUR_MINE]: "game.world.sulphurmine",
};

const DUNGEON_CLEAR_FLAGS: Partial<Record<string, readonly string[]>> = {
  [WORLD_TILE.CAVE]: [
    "game.world.caveDepthsCleared",
    "game.world.caveCampCacheCleared",
    "game.world.caveWandererNestCleared",
    "game.world.caveOldCaseCleared",
  ],
  [WORLD_TILE.TOWN]: [
    "game.world.townCleared",
    "game.world.townThugCleared",
    "game.world.townSchoolhouseCleared",
    "game.world.townParkVigilanteCleared",
    "game.world.townCaravanVigilanteCleared",
    "game.world.townClinicCleared",
    "game.world.townClinicMadmanCleared",
  ],
  [WORLD_TILE.CITY]: [
    "game.world.cityCleared",
    "game.world.citySniperCleared",
    "game.world.cityHospitalCleared",
    "game.world.citySoldierPatrolCleared",
    "game.world.cityCommandoSettlementCleared",
    "game.world.cityCommandoSuppliesCleared",
    "game.world.citySubwayCleared",
    "game.world.citySubwayScavengedCleared",
    "game.world.citySubwayBeastRubbleCleared",
    "game.world.cityMilitaryCampCleared",
    "game.world.cityMilitaryCampSuppliesCleared",
    "game.world.cityShantyMarketCleared",
    "game.world.cityShantyCrowdCleared",
    "game.world.cityShantyCrowdSackCleared",
    "game.world.cityShantyCrowdYouthCleared",
    "game.world.cityDryingHutCleared",
    "game.world.cityDryingHutSackCleared",
    "game.world.cityDryingMeatYouthCleared",
    "game.world.cityHospitalWardCleared",
    "game.world.cityHospitalSquattersCleared",
    "game.world.cityHospitalDeformedCleared",
    "game.world.cityHospitalTentaclesCleared",
    "game.world.cityHospitalCacheCleared",
    "game.world.cityHospitalOldManTheatresCleared",
    "game.world.cityHospitalOldManSquattersCleared",
    "game.world.cityHospitalMedicineCleared",
    "game.world.cityOldTowerCleared",
    "game.world.cityOldTowerScavengedCleared",
    "game.world.cityOldTowerThugRubbleCleared",
    "game.world.cityOldTowerRubbleCleared",
  ],
  [WORLD_TILE.EXECUTIONER]: ["game.world.executionerCleared"],
};

const LANDMARK_VISIT_FLAGS: Partial<Record<string, readonly string[]>> = {
  [WORLD_TILE.HOUSE]: ["game.world.oldHouseVisited"],
  [WORLD_TILE.SWAMP]: ["game.world.swampVisited"],
  [WORLD_TILE.BOREHOLE]: ["game.world.boreholeVisited"],
  [WORLD_TILE.BATTLEFIELD]: ["game.world.battlefieldVisited"],
  [WORLD_TILE.SHIP]: ["game.world.crashedShipVisited"],
  [WORLD_TILE.CACHE]: ["game.world.destroyedVillageVisited"],
};

const MINE_RETURN_BUILDINGS: readonly {
  readonly flag: string;
  readonly building: string;
}[] = [
  { flag: "game.world.ironmine", building: "iron mine" },
  { flag: "game.world.coalmine", building: "coal mine" },
  { flag: "game.world.sulphurmine", building: "sulphur mine" },
];

const BLUEPRINT_REDEEMED_NOTIFICATION =
  "blueprints feed into the fabricator data port. possibilities grow.";

export class WorldRuntime implements WorldEventResolver {
  private readonly validatedMaps = new WeakMap<object, WorldMapGrid | null>();
  private readonly validatedMasks = new WeakMap<object, WorldMaskGrid | null>();
  private rowsCache:
    | {
        map: WorldMapGrid | null;
        mask: WorldMaskGrid | null;
        x: number;
        y: number;
        revision: number;
        rows: WorldMapCellSnapshot[][];
      }
    | undefined;
  private accessibleCache:
    | {
        map: WorldMapGrid | null;
        mask: WorldMaskGrid | null;
        x: number;
        y: number;
        revision: number;
        accessible: WorldAccessibleSnapshot;
      }
    | undefined;
  private worldGridRevision = 0;
  private readonly worldDomain: WorldDomainFacade;

  constructor(
    private readonly engine: GameEngine,
    private readonly expedition = new ExpeditionTransaction(engine),
  ) {
    this.worldDomain = new WorldDomainFacade(engine);
  }

  snapshot(): WorldStateSnapshot {
    const active = this.active();
    const [x, y] = this.position();
    return {
      unlocked: this.worldDomain.read().unlocked,
      active,
      title: "A Dusty Path",
      x,
      y,
      distance: this.distance(x, y),
      hp: this.expedition.health(this.maxHealth()),
      maxHp: this.maxHealth(),
      water: this.expedition.water(this.maxWater()),
      maxWater: this.maxWater(),
      food: this.expedition.inventoryQuantity("cured meat"),
      danger: this.worldDomain.read().danger,
      starvation: this.worldDomain.read().starvation,
      thirst: this.worldDomain.read().thirst,
      rows: this.cachedMapRows(x, y),
      accessible: this.cachedAccessibleModel(x, y),
      landmark: this.landmarkAt(x, y),
      canReturn: x === WORLD_CENTER.x && y === WORLD_CENTER.y,
      notifications: this.engine.notifications.list("world"),
    };
  }

  isActive(): boolean {
    return this.active();
  }

  embark(): void {
    this.ensureMap();
    this.expedition.begin({
      position: WORLD_CENTER,
      health: this.maxHealth(),
      water: this.maxWater(),
    });
    this.worldDomain.dispatch({ type: "world.begin", payload: {} });
    this.markVisible(WORLD_CENTER.x, WORLD_CENTER.y);
  }

  ensureMap(): void {
    const existingMap = this.map();
    if (existingMap) {
      if (!this.mask()) {
        this.setMask(originalWorldNewMask(this.hasScoutPerk()));
      }
      this.storeShipDirection(existingMap);
      return;
    }

    const map = originalWorldGenerateMap(this.engine.rng, {
      includeCache: this.hasPreviousStores(),
    });
    this.setMap(map);
    this.setMask(originalWorldNewMask(this.hasScoutPerk()));
    this.storeShipDirection(map);
  }

  move(direction: WorldMoveDirection): WorldMoveOutcome {
    if (!this.active())
      return {
        moved: false,
        encounter: null,
        returnedHome: false,
        setpieceScene: null,
      };
    const delta =
      WORLD_DIRECTIONS[
        direction.toUpperCase() as keyof typeof WORLD_DIRECTIONS
      ];
    const [x, y] = this.position();
    const nextX = Math.max(0, Math.min(WORLD_RADIUS * 2, x + delta[0]));
    const nextY = Math.max(0, Math.min(WORLD_RADIUS * 2, y + delta[1]));
    if (nextX === x && nextY === y)
      return {
        moved: false,
        encounter: null,
        returnedHome: false,
        setpieceScene: null,
      };
    const oldTile = this.tileAt(x, y);
    const newTile = this.tileAt(nextX, nextY);

    this.expedition.setPosition({ x: nextX, y: nextY });
    this.narrateMove(oldTile, newTile);
    this.markVisible(nextX, nextY);
    if (newTile === WORLD_TILE.VILLAGE) {
      return {
        moved: true,
        encounter: null,
        returnedHome: this.returnHome(),
        setpieceScene: null,
      };
    }
    this.checkDanger(nextX, nextY);
    const landmarkScene = this.landmarkAt(nextX, nextY)?.scene ?? null;
    if (landmarkScene) {
      return {
        moved: true,
        encounter: null,
        returnedHome: false,
        setpieceScene: landmarkScene,
      };
    }
    if (!this.consumesTravel(newTile))
      return {
        moved: true,
        encounter: null,
        returnedHome: false,
        setpieceScene: null,
      };
    if (!this.useSupplies())
      return {
        moved: true,
        encounter: null,
        returnedHome: false,
        setpieceScene: null,
      };

    const encounter = this.checkFight(nextX, nextY);
    if (!encounter)
      return {
        moved: true,
        encounter: null,
        returnedHome: false,
        setpieceScene: null,
      };

    return {
      moved: true,
      encounter,
      returnedHome: false,
      setpieceScene: null,
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
    this.testMap();
    this.applyHomeReturnConsequences();
    if (this.expedition.redeemBlueprints()) {
      this.engine.notifications.notify(
        "world",
        BLUEPRINT_REDEEMED_NOTIFICATION,
      );
    }
    this.returnOutfitToStores();
    this.closeExpedition();
    this.engine.notifications.notify(
      "world",
      "the village is close enough to touch",
    );
    return true;
  }

  applyOutpostUseConsequences(): boolean {
    if (!this.active()) return false;
    if (!this.worldDomain.read().outpostUsed) {
      return false;
    }
    const [x, y] = this.position();
    if (this.tileAt(x, y) !== WORLD_TILE.OUTPOST) return false;

    this.expedition.setWater(this.maxWater(), this.maxWater());
    this.worldDomain.dispatch({
      type: "world.consumeOutpost",
      payload: { x, y },
    });
    this.invalidateWorldGrid();
    return true;
  }

  applyWaterReplenishmentConsequences(): boolean {
    if (!this.active()) return false;
    if (!this.worldDomain.read().waterReplenished) {
      return false;
    }
    this.expedition.setWater(this.maxWater(), this.maxWater());
    this.worldDomain.dispatch({
      type: "world.consumeWaterReplenishment",
      payload: {},
    });
    return true;
  }

  recordLandmarkResolutionForEffect(path: string): void {
    if (!this.active()) return;
    const [x, y] = this.position();
    const tile = this.tileAt(x, y);
    if (!this.isLandmarkResolutionEffect(tile, path)) return;
    this.worldDomain.dispatch({
      type: "world.resolveLandmark",
      payload: { x, y },
    });
  }

  applyClearedLandmarkConsequences(): boolean {
    if (!this.active()) return false;
    const map = this.map();
    if (!map) return false;
    const [x, y] = this.position();
    const tile = map[x]?.[y];

    if (!this.landmarkResolved(x, y)) return false;

    if (MINE_CLEAR_FLAGS[tile]) {
      originalWorldDrawRoad(map, { x, y });
      originalWorldMarkVisited(map, { x, y });
      this.setMap(map);
      return true;
    }

    if (DUNGEON_CLEAR_FLAGS[tile]) {
      map[x][y] = WORLD_TILE.OUTPOST;
      originalWorldDrawRoad(map, { x, y });
      this.setMap(map);
      return true;
    }

    if (LANDMARK_VISIT_FLAGS[tile]) {
      if (tile === WORLD_TILE.SHIP) {
        originalWorldDrawRoad(map, { x, y });
      }
      originalWorldMarkVisited(map, { x, y });
      this.setMap(map);
      return true;
    }

    return false;
  }

  canApplyMap(): boolean {
    if (!this.worldDomain.read().unlocked) {
      return false;
    }
    if (this.worldDomain.read().seenAll) return false;
    const mask = this.mask();
    if (!mask) return false;
    return this.hasHiddenMaskTile(mask);
  }

  applyMap(): void {
    const mask = this.mask();
    if (!mask) return;
    if (!this.worldDomain.read().seenAll) {
      const target = this.randomHiddenMaskTile(mask);
      if (target) {
        originalWorldUncoverMap(target.x, target.y, 5, mask);
        this.setMask(mask);
      }
    }
    this.testMap();
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
      return this.worldDomain.read().executionerCleared
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
    return this.expedition.active();
  }

  private position(): readonly [number, number] {
    const { x, y } = this.expedition.position(WORLD_CENTER);
    return [x, y] as const;
  }

  private map(): WorldMapGrid | null {
    const value = this.worldDomain.read().map;
    if (typeof value !== "object" || value === null) {
      return null;
    }
    const cached = this.validatedMaps.get(value);
    if (cached !== undefined || this.validatedMaps.has(value))
      return cached ?? null;
    const valid =
      Array.isArray(value) &&
      value.length === WORLD_RADIUS * 2 + 1 &&
      value.every(
        (column) =>
          Array.isArray(column) &&
          column.length === WORLD_RADIUS * 2 + 1 &&
          column.every((tile) => typeof tile === "string"),
      );
    const map = valid ? (value as WorldMapGrid) : null;
    this.validatedMaps.set(value, map);
    return map;
  }

  private mask(): WorldMaskGrid | null {
    const value = this.worldDomain.read().mask;
    if (typeof value !== "object" || value === null) {
      return null;
    }
    const cached = this.validatedMasks.get(value);
    if (cached !== undefined || this.validatedMasks.has(value))
      return cached ?? null;
    const valid =
      Array.isArray(value) &&
      value.length === WORLD_RADIUS * 2 + 1 &&
      value.every(
        (column) =>
          Array.isArray(column) &&
          column.length === WORLD_RADIUS * 2 + 1 &&
          column.every((visible) => typeof visible === "boolean"),
      );
    const mask = valid ? (value as WorldMaskGrid) : null;
    this.validatedMasks.set(value, mask);
    return mask;
  }

  private hasHiddenMaskTile(mask: WorldMaskGrid): boolean {
    return mask.some((column) => column.some((visible) => !visible));
  }

  private randomHiddenMaskTile(
    mask: WorldMaskGrid,
  ): { x: number; y: number } | null {
    const size = WORLD_RADIUS * 2 + 1;
    const maxAttempts = size * size;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const x = Math.floor(this.engine.rng.next() * size);
      const y = Math.floor(this.engine.rng.next() * size);
      if (!mask[x]?.[y]) return { x, y };
    }

    for (let x = 0; x < size; x += 1) {
      for (let y = 0; y < size; y += 1) {
        if (!mask[x]?.[y]) return { x, y };
      }
    }
    return null;
  }

  private testMap(): void {
    const mask = this.mask();
    if (!mask) return;
    if (!this.hasHiddenMaskTile(mask)) {
      this.worldDomain.dispatch({
        type: "world.setSeenAll",
        payload: { value: true },
      });
    }
  }

  private cachedMapRows(x: number, y: number): WorldMapCellSnapshot[][] {
    const map = this.map();
    const mask = this.mask();
    const cached = this.rowsCache;
    if (
      cached?.map === map &&
      cached.mask === mask &&
      cached.x === x &&
      cached.y === y &&
      cached.revision === this.worldGridRevision
    ) {
      return cached.rows;
    }
    const rows = this.mapRows(map, mask, x, y);
    this.rowsCache = {
      map,
      mask,
      x,
      y,
      revision: this.worldGridRevision,
      rows,
    };
    return rows;
  }

  private cachedAccessibleModel(x: number, y: number): WorldAccessibleSnapshot {
    const map = this.map();
    const mask = this.mask();
    const cached = this.accessibleCache;
    if (
      cached?.map === map &&
      cached.mask === mask &&
      cached.x === x &&
      cached.y === y &&
      cached.revision === this.worldGridRevision
    ) {
      return cached.accessible;
    }

    const accessible = this.accessibleModel(map, mask, x, y);
    this.accessibleCache = {
      map,
      mask,
      x,
      y,
      revision: this.worldGridRevision,
      accessible,
    };
    return accessible;
  }

  private accessibleModel(
    map: WorldMapGrid | null,
    mask: WorldMaskGrid | null,
    x: number,
    y: number,
  ): WorldAccessibleSnapshot {
    const landmarks: WorldVisibleLandmarkSnapshot[] = [];
    for (let landmarkY = 0; landmarkY <= WORLD_RADIUS * 2; landmarkY += 1) {
      for (let landmarkX = 0; landmarkX <= WORLD_RADIUS * 2; landmarkX += 1) {
        if (mask?.[landmarkX]?.[landmarkY] !== true) continue;
        const label = this.mapCellLabel(map, landmarkX, landmarkY, false, true);
        if (!label || label === "The Village") continue;
        landmarks.push({
          label,
          distance: this.distanceBetween(x, y, landmarkX, landmarkY),
          direction: this.directionTo(x, y, landmarkX, landmarkY),
        });
      }
    }

    landmarks.sort(
      (left, right) =>
        left.distance - right.distance || left.label.localeCompare(right.label),
    );

    return {
      terrain: this.terrainLabel(this.tileAt(x, y)),
      villageDistance: this.distance(x, y),
      villageDirection: this.directionTo(x, y, WORLD_CENTER.x, WORLD_CENTER.y),
      moves: this.availableMoves(x, y),
      landmarks: landmarks.slice(0, 3),
    };
  }

  private mapRows(
    map: WorldMapGrid | null,
    mask: WorldMaskGrid | null,
    x: number,
    y: number,
  ): WorldMapCellSnapshot[][] {
    const rows: WorldMapCellSnapshot[][] = [];
    for (let rowY = 0; rowY <= WORLD_RADIUS * 2; rowY += 1) {
      const row: WorldMapCellSnapshot[] = [];
      for (let colX = 0; colX <= WORLD_RADIUS * 2; colX += 1) {
        const current = colX === x && rowY === y;
        const visible = mask?.[colX]?.[rowY] === true;
        row.push({
          x: colX,
          y: rowY,
          glyph: current
            ? "@"
            : visible
              ? this.tileGlyph(map?.[colX]?.[rowY] ?? WORLD_TILE.BARRENS)
              : " ",
          visible,
          current,
          label: this.mapCellLabel(map, colX, rowY, current, visible),
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

  private narrateMove(oldTile: string, newTile: string): void {
    const message = TERRAIN_MOVE_NOTIFICATIONS[`${oldTile}:${newTile}`];
    if (!message) return;
    this.engine.notifications.notify("world", message);
  }

  private consumesTravel(tile: string): boolean {
    return tile !== WORLD_TILE.VILLAGE && !LANDMARKS_BY_TILE.has(tile);
  }

  private terrainName(tile: string): "forest" | "field" | "barrens" {
    if (tile === WORLD_TILE.FOREST) return "forest";
    if (tile === WORLD_TILE.FIELD) return "field";
    return "barrens";
  }

  private tileGlyph(tile: string): string {
    return tile.charAt(0) || " ";
  }

  private mapCellLabel(
    map: WorldMapGrid | null,
    x: number,
    y: number,
    current: boolean,
    visible: boolean,
  ): string | undefined {
    if (current) return "Wanderer";
    if (!visible) return undefined;
    const tile = map?.[x]?.[y] ?? WORLD_TILE.BARRENS;
    if (tile === WORLD_TILE.VILLAGE) return "The Village";
    if (tile === WORLD_TILE.OUTPOST && this.outpostUsed(x, y)) {
      return undefined;
    }
    const landmark = LANDMARKS_BY_TILE.get(tile);
    return landmark ? originalWorldDisplayLabel(landmark.label) : undefined;
  }

  private landmarkAt(x: number, y: number): WorldLandmarkSnapshot | null {
    const tile = this.tileAt(x, y);
    if (tile === WORLD_TILE.OUTPOST && this.outpostUsed(x, y)) return null;
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
    this.setMask(originalWorldLightMap(x, y, mask, this.hasScoutPerk()));
  }

  private setMap(map: WorldMapGrid): void {
    this.worldDomain.dispatch({
      type: "world.setMap",
      payload: { value: map },
    });
    this.invalidateWorldGrid();
  }

  private setMask(mask: WorldMaskGrid): void {
    this.worldDomain.dispatch({
      type: "world.setMask",
      payload: { value: mask },
    });
    this.invalidateWorldGrid();
  }

  private invalidateWorldGrid(): void {
    this.worldGridRevision += 1;
    this.rowsCache = undefined;
    this.accessibleCache = undefined;
  }

  private visible(x: number, y: number): boolean {
    return this.mask()?.[x]?.[y] === true;
  }

  private distance(x: number, y: number): number {
    return this.distanceBetween(x, y, WORLD_CENTER.x, WORLD_CENTER.y);
  }

  private distanceBetween(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
  ): number {
    return Math.abs(fromX - toX) + Math.abs(fromY - toY);
  }

  private directionTo(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
  ): WorldCompassDirection | "here" {
    const horizontal = toX === fromX ? "" : toX > fromX ? "east" : "west";
    const vertical = toY === fromY ? "" : toY > fromY ? "south" : "north";
    if (!horizontal && !vertical) return "here";
    return `${vertical}${horizontal}` as WorldCompassDirection;
  }

  private availableMoves(x: number, y: number): WorldMoveDirection[] {
    const moves: WorldMoveDirection[] = [];
    if (y > 0) moves.push("north");
    if (x > 0) moves.push("west");
    if (x < WORLD_RADIUS * 2) moves.push("east");
    if (y < WORLD_RADIUS * 2) moves.push("south");
    return moves;
  }

  private terrainLabel(tile: string): string {
    switch (tile) {
      case WORLD_TILE.FOREST:
        return "forest";
      case WORLD_TILE.FIELD:
        return "field";
      case WORLD_TILE.BARRENS:
        return "barrens";
      case WORLD_TILE.ROAD:
        return "road";
      case WORLD_TILE.VILLAGE:
        return "the village";
      default: {
        const landmark = LANDMARKS_BY_TILE.get(tile);
        return landmark
          ? originalWorldDisplayLabel(landmark.label)
          : "unknown terrain";
      }
    }
  }

  private checkDanger(x: number, y: number): void {
    const distance = this.distance(x, y);
    const state = this.worldDomain.read();
    const danger = state.danger;
    const hasIronArmour = (state.stores["i armour"] ?? 0) > 0;
    const hasSteelArmour = (state.stores["s armour"] ?? 0) > 0;

    if (!danger) {
      if (
        (!hasIronArmour && distance >= 8) ||
        (!hasSteelArmour && distance >= 18)
      ) {
        this.worldDomain.dispatch({
          type: "world.setDanger",
          payload: { value: true },
        });
        this.engine.notifications.notify(
          "world",
          "dangerous to be this far from the village without proper protection",
        );
      }
      return;
    }

    if (distance < 8 || (distance < 18 && hasIronArmour)) {
      this.worldDomain.dispatch({
        type: "world.setDanger",
        payload: { value: false },
      });
      this.engine.notifications.notify("world", "safer here");
    }
  }

  private checkFight(x: number, y: number): WorldEncounterContext | null {
    if (
      this.randomEncountersDisabled() ||
      this.tileAt(x, y) === WORLD_TILE.VILLAGE ||
      this.landmarkAt(x, y)
    ) {
      return null;
    }

    const fightMove = this.expedition.cadence("fight") + 1;
    this.expedition.setCadence("fight", fightMove);
    if (fightMove <= WORLD_FIGHT_DELAY) return null;

    const chance = WORLD_FIGHT_CHANCE * (this.hasPerk("stealthy") ? 0.5 : 1);
    if (this.engine.rng.next() >= chance) return null;

    this.expedition.setCadence("fight", 0);
    return {
      distance: this.distance(x, y),
      terrain: this.terrainName(this.tileAt(x, y)),
    };
  }

  private useSupplies(): boolean {
    const foodMove = this.expedition.cadence("food") + 1;
    const waterMove = this.expedition.cadence("water") + 1;
    const movesPerFood =
      WORLD_MOVES_PER_FOOD * (this.hasPerk("slow metabolism") ? 2 : 1);
    const movesPerWater =
      WORLD_MOVES_PER_WATER * (this.hasPerk("desert rat") ? 2 : 1);

    if (foodMove >= movesPerFood) {
      this.expedition.setCadence("food", 0);
      const food = this.expedition.inventoryQuantity("cured meat");
      if (food > 0) {
        this.expedition.addInventory("cured meat", -1);
        if (food === 1) {
          this.engine.notifications.notify("world", "the meat has run out");
        } else {
          this.worldDomain.dispatch({
            type: "world.setStarvation",
            payload: { value: false },
          });
          this.setWorldHp(this.worldHp() + this.meatHeal());
        }
      } else if (!this.worldDomain.read().starvation) {
        this.worldDomain.dispatch({
          type: "world.setStarvation",
          payload: { value: true },
        });
        this.engine.notifications.notify("world", "starvation sets in");
      } else {
        this.worldDomain.dispatch({
          type: "world.recordExposure",
          payload: { kind: "starved" },
        });
        if (
          this.worldDomain.read().starved >= 10 &&
          !this.hasPerk("slow metabolism")
        ) {
          this.worldDomain.dispatch({
            type: "world.unlockPerk",
            payload: { perk: "slow metabolism" },
          });
        }
        this.die();
        return false;
      }
    } else {
      this.expedition.setCadence("food", foodMove);
    }

    if (waterMove >= movesPerWater) {
      this.expedition.setCadence("water", 0);
      const water = this.expedition.water();
      if (water > 0) {
        this.expedition.addWater(-1);
        if (water === 1) {
          this.engine.notifications.notify("world", "there is no more water");
        } else {
          this.worldDomain.dispatch({
            type: "world.setThirst",
            payload: { value: false },
          });
        }
      } else if (!this.worldDomain.read().thirst) {
        this.worldDomain.dispatch({
          type: "world.setThirst",
          payload: { value: true },
        });
        this.engine.notifications.notify(
          "world",
          "the thirst becomes unbearable",
        );
      } else {
        this.worldDomain.dispatch({
          type: "world.recordExposure",
          payload: { kind: "dehydrated" },
        });
        if (
          this.worldDomain.read().dehydrated >= 10 &&
          !this.hasPerk("desert rat")
        ) {
          this.worldDomain.dispatch({
            type: "world.unlockPerk",
            payload: { perk: "desert rat" },
          });
        }
        this.die();
        return false;
      }
    } else {
      this.expedition.setCadence("water", waterMove);
    }

    return true;
  }

  private maxHealth(): number {
    return originalPathMaxHealth(this.worldDomain.read().stores);
  }

  private maxWater(): number {
    return originalPathMaxWater(this.worldDomain.read().stores);
  }

  private worldHp(): number {
    return this.expedition.health(this.maxHealth());
  }

  private setWorldHp(value: number): void {
    this.expedition.setHealth(value, this.maxHealth());
  }

  private meatHeal(): number {
    return WORLD_MEAT_HEAL * (this.hasPerk("gastronome") ? 2 : 1);
  }

  private returnOutfitToStores(): void {
    this.expedition.returnInventoryToStores();
  }

  private applyHomeReturnConsequences(): void {
    for (const { flag, building } of MINE_RETURN_BUILDINGS) {
      const flagKey = flag.replace(/^game\.world\./, "");
      if (!this.worldDomain.read().flags[flagKey]) continue;
      if ((this.worldDomain.read().buildings[building] ?? 0) > 0) {
        continue;
      }
      this.worldDomain.dispatch({
        type: "world.unlockBuilding",
        payload: { key: building },
      });
    }
    if (
      this.worldDomain.read().shipCleared &&
      !this.worldDomain.read().shipUnlocked
    ) {
      this.worldDomain.dispatch({ type: "world.unlockShip", payload: {} });
    }
    if (
      this.worldDomain.read().executionerCleared &&
      !this.worldDomain.read().fabricatorUnlocked
    ) {
      this.worldDomain.dispatch({
        type: "world.unlockFabricator",
        payload: {},
      });
      this.engine.notifications.notify(
        "world",
        "builder knows the strange device when she sees it. takes it for herself real quick. doesn't ask where it came from.",
      );
    }
  }

  private closeExpedition(): void {
    this.expedition.commit();
    this.worldDomain.dispatch({ type: "world.closePathReturn", payload: {} });
  }

  private randomEncountersDisabled(): boolean {
    return this.worldDomain.read().randomEncountersDisabled;
  }

  private hasScoutPerk(): boolean {
    return this.hasPerk("scout");
  }

  private hasPerk(key: string): boolean {
    return this.worldDomain.read().perks[key] === true;
  }

  private isLandmarkResolutionEffect(tile: string, path: string): boolean {
    return (
      MINE_CLEAR_FLAGS[tile] === path ||
      DUNGEON_CLEAR_FLAGS[tile]?.includes(path) === true ||
      LANDMARK_VISIT_FLAGS[tile]?.includes(path) === true
    );
  }

  private landmarkResolved(x: number, y: number): boolean {
    return this.worldDomain.read().resolvedLandmarks[`${x},${y}`] === true;
  }

  private hasPreviousStores(): boolean {
    return Object.keys(this.worldDomain.read().previousStores).length > 0;
  }

  private outpostUsed(x: number, y: number): boolean {
    return this.worldDomain.read().usedOutposts[`${x},${y}`] === true;
  }

  private die(): void {
    if (!this.expedition.abortOnDeath()) return;
    this.engine.notifications.notify("world", EXPEDITION_DEATH_NOTIFICATION);
  }

  private storeShipDirection(map: WorldMapGrid): void {
    if (this.worldDomain.read().shipPosition) return;

    const ship = originalWorldMapSearch(WORLD_TILE.SHIP, map, 1)?.[0];
    if (!ship) return;
    this.worldDomain.dispatch({
      type: "world.setShipPosition",
      payload: { x: ship.x, y: ship.y },
    });
  }
}
