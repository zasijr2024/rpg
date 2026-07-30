import { deletePath, getPath, parseStatePath, setPath } from "./path";
import {
  createInitialState,
  type GameState,
  type GameStatePath,
  MAX_STORE,
  type MutableGameStateRoot,
  RUNTIME_STATE_ROOTS,
  type RuntimeStateDomain,
  type RuntimeStateRootMap,
} from "./types";

declare const __ADR_DEV_SURFACES__: boolean;

export interface StateUpdate {
  category: string;
  stateName: string;
}

export type StateListener = (update: StateUpdate) => void;

export class StateStore {
  private state: GameState;
  private listeners = new Set<StateListener>();
  private scopedStores = new Map<
    RuntimeStateDomain,
    ScopedStateStore<MutableGameStateRoot>
  >();

  constructor(initialState: GameState = createInitialState()) {
    this.state = initialState;
  }

  snapshot(): GameState {
    return structuredClone(this.state);
  }

  category<TRoot extends MutableGameStateRoot>(
    root: TRoot,
  ): StateCategoryStore<TRoot> {
    return new StateCategoryStore(this, root);
  }

  forRuntime<TDomain extends RuntimeStateDomain>(
    domain: TDomain,
  ): ScopedStateStore<RuntimeStateRootMap[TDomain]> {
    const existing = this.scopedStores.get(domain);
    if (existing) {
      return existing as ScopedStateStore<RuntimeStateRootMap[TDomain]>;
    }
    const scoped = new ScopedStateStore<RuntimeStateRootMap[TDomain]>(
      this,
      domain,
    );
    this.scopedStores.set(
      domain,
      scoped as ScopedStateStore<MutableGameStateRoot>,
    );
    return scoped;
  }

  get(path: string, requestZero = false): unknown {
    const value = getPath(this.state, path);
    return value === undefined && requestZero ? 0 : value;
  }

  getForDevelopment(path: string, requestZero = false): unknown {
    this.assertDevelopmentAccess();
    return this.get(path, requestZero);
  }

  set(path: string, value: unknown, noEvent = false): void {
    const prepared = this.prepareValue(path, value);
    setPath(this.state, path, prepared);
    if (!noEvent) this.fire(path);
  }

  setForDevelopment(path: string, value: unknown, noEvent = false): void {
    this.assertDevelopmentAccess();
    this.set(path, value, noEvent);
  }

  add(path: string, amount: number, noEvent = false): void {
    assertFiniteNumber(amount, `State increment for ${path}`);
    const current = this.get(path, true);
    if (typeof current !== "number") {
      throw new Error(`Cannot add to non-number state path: ${path}`);
    }
    assertFiniteNumber(current, `Current state value for ${path}`);

    const next = current + amount;
    assertFiniteNumber(next, `State result for ${path}`);
    this.set(path, next, noEvent);
  }

  remove(path: string, noEvent = false): void {
    deletePath(this.state, path);
    if (!noEvent) this.fire(path);
  }

  setM(parent: string, values: Record<string, unknown>, noEvent = false): void {
    const prepared = Object.entries(values).map(([key, value]) => {
      const path = childPath(parent, key);
      return [path, this.prepareValue(path, value)] as const;
    });
    for (const [path, value] of prepared) {
      setPath(this.state, path, value);
    }
    if (!noEvent) this.fire(parent);
  }

  addM(parent: string, values: Record<string, number>, noEvent = false): void {
    const prepared = Object.entries(values).map(([key, amount]) => {
      const path = childPath(parent, key);
      assertFiniteNumber(amount, `State increment for ${path}`);
      const current = this.get(path, true);
      if (typeof current !== "number") {
        throw new Error(`Cannot add to non-number state path: ${path}`);
      }
      assertFiniteNumber(current, `Current state value for ${path}`);
      const next = current + amount;
      assertFiniteNumber(next, `State result for ${path}`);
      return [path, this.prepareValue(path, next)] as const;
    });
    for (const [path, value] of prepared) {
      setPath(this.state, path, value);
    }
    if (!noEvent) this.fire(parent);
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private fire(path: string): void {
    const [category] = parseStatePath(path);
    const update: StateUpdate = {
      category,
      stateName: path,
    };
    for (const listener of this.listeners) {
      listener(update);
    }
  }

  private clampValue(path: string, value: unknown): unknown {
    if (typeof value !== "number") return value;

    const [category] = parseStatePath(path);
    if (category !== "stores") return value;

    return Math.floor(Math.max(0, Math.min(MAX_STORE, value)));
  }

  private prepareValue(path: string, value: unknown): unknown {
    parseStatePath(path);
    assertFiniteNumbers(value, `State value for ${path}`);
    return this.clampValue(path, value);
  }

  private assertDevelopmentAccess(): void {
    if (!__ADR_DEV_SURFACES__) {
      throw new Error("Development state access is disabled");
    }
  }
}

export class ScopedStateStore<TRoot extends MutableGameStateRoot> {
  constructor(
    private readonly store: StateStore,
    readonly domain: RuntimeStateDomain,
  ) {}

  get(path: GameStatePath<TRoot>, requestZero = false): unknown {
    this.assertAllowed(path);
    return this.store.get(path, requestZero);
  }

  getDynamic(path: string, requestZero = false): unknown {
    this.assertAllowed(path);
    return this.store.get(path, requestZero);
  }

  set(path: GameStatePath<TRoot>, value: unknown, noEvent = false): void {
    this.assertAllowed(path);
    this.store.set(path, value, noEvent);
  }

  setDynamic(path: string, value: unknown, noEvent = false): void {
    this.assertAllowed(path);
    this.store.set(path, value, noEvent);
  }

  add(path: GameStatePath<TRoot>, amount: number, noEvent = false): void {
    this.assertAllowed(path);
    this.store.add(path, amount, noEvent);
  }

  addDynamic(path: string, amount: number, noEvent = false): void {
    this.assertAllowed(path);
    this.store.add(path, amount, noEvent);
  }

  remove(path: GameStatePath<TRoot>, noEvent = false): void {
    this.assertAllowed(path);
    this.store.remove(path, noEvent);
  }

  removeDynamic(path: string, noEvent = false): void {
    this.assertAllowed(path);
    this.store.remove(path, noEvent);
  }

  setM(
    parent: GameStatePath<TRoot>,
    values: Record<string, unknown>,
    noEvent = false,
  ): void {
    this.assertAllowed(parent);
    this.store.setM(parent, values, noEvent);
  }

  addM(
    parent: GameStatePath<TRoot>,
    values: Record<string, number>,
    noEvent = false,
  ): void {
    this.assertAllowed(parent);
    this.store.addM(parent, values, noEvent);
  }

  private assertAllowed(path: string): void {
    if (!__ADR_DEV_SURFACES__) return;
    const [root] = parseStatePath(path);
    const allowed = RUNTIME_STATE_ROOTS[this.domain] as readonly string[];
    if (!allowed.includes(root)) {
      throw new Error(
        `State root ${root} is outside the ${this.domain} runtime capability`,
      );
    }
  }
}

export class StateCategoryStore<TRoot extends MutableGameStateRoot> {
  constructor(
    private readonly store: StateStore,
    readonly root: TRoot,
  ) {}

  snapshot(): GameState[TRoot] {
    return structuredClone(this.store.get(this.root)) as GameState[TRoot];
  }

  get(path?: string, requestZero = false): unknown {
    return this.store.get(this.path(path), requestZero);
  }

  set(path: string, value: unknown, noEvent = false): void {
    this.store.set(this.path(path), value, noEvent);
  }

  add(path: string, amount: number, noEvent = false): void {
    this.store.add(this.path(path), amount, noEvent);
  }

  remove(path: string, noEvent = false): void {
    this.store.remove(this.path(path), noEvent);
  }

  setM(path: string, values: Record<string, unknown>, noEvent = false): void {
    this.store.setM(this.path(path), values, noEvent);
  }

  addM(path: string, values: Record<string, number>, noEvent = false): void {
    this.store.addM(this.path(path), values, noEvent);
  }

  private path(relative?: string): GameStatePath<TRoot> {
    if (!relative) return this.root;
    return `${this.root}${relative.startsWith("[") ? "" : "."}${relative}` as GameStatePath<TRoot>;
  }
}

function childPath(parent: string, key: string): string {
  return `${parent}[${JSON.stringify(key)}]`;
}

function assertFiniteNumbers(
  value: unknown,
  label: string,
  seen = new WeakSet<object>(),
): void {
  if (typeof value === "number") {
    assertFiniteNumber(value, label);
    return;
  }
  if (value === null || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  for (const nested of Object.values(value)) {
    assertFiniteNumbers(nested, label, seen);
  }
}

function assertFiniteNumber(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be finite`);
  }
}
