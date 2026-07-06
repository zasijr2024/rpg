import { getPath, parseStatePath, setPath } from "./path";
import { createInitialState, type GameState, MAX_STORE } from "./types";

export interface StateUpdate {
  category: string;
  stateName: string;
}

export type StateListener = (update: StateUpdate) => void;

export class StateStore {
  private state: GameState;
  private listeners = new Set<StateListener>();

  constructor(initialState: GameState = createInitialState()) {
    this.state = initialState;
  }

  snapshot(): GameState {
    return structuredClone(this.state);
  }

  get(path: string, requestZero = false): unknown {
    const value = getPath(this.state, path);
    return value === undefined && requestZero ? 0 : value;
  }

  set(path: string, value: unknown, noEvent = false): void {
    setPath(this.state, path, value);
    if (!noEvent) this.fire(path);
  }

  add(path: string, amount: number, noEvent = false): void {
    const current = this.get(path, true);
    if (typeof current !== "number") {
      throw new Error(`Cannot add to non-number state path: ${path}`);
    }

    let next = current + amount;
    if (path.startsWith("stores.")) {
      next = Math.max(0, Math.min(MAX_STORE, next));
    }
    this.set(path, next, noEvent);
  }

  setM(parent: string, values: Record<string, unknown>, noEvent = false): void {
    for (const [key, value] of Object.entries(values)) {
      this.set(`${parent}["${key}"]`, value, true);
    }
    if (!noEvent) this.fire(parent);
  }

  addM(parent: string, values: Record<string, number>, noEvent = false): void {
    for (const [key, value] of Object.entries(values)) {
      this.add(`${parent}["${key}"]`, value, true);
    }
    if (!noEvent) this.fire(parent);
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private fire(path: string): void {
    const [category, ...rest] = parseStatePath(path);
    const update: StateUpdate = {
      category,
      stateName: rest.join(".")
    };
    for (const listener of this.listeners) {
      listener(update);
    }
  }
}

