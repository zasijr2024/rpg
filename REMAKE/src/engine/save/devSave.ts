import type { GameState } from "../state/types";

export const DEV_SAVE_KEY = "adr-remake-dev-save";

export interface DevSaveAdapter {
  load(): GameState | null;
  save(state: GameState): void;
  clear(): void;
}

export class LocalStorageDevSaveAdapter implements DevSaveAdapter {
  load(): GameState | null {
    const raw = window.localStorage.getItem(DEV_SAVE_KEY);
    return raw ? (JSON.parse(raw) as GameState) : null;
  }

  save(state: GameState): void {
    window.localStorage.setItem(DEV_SAVE_KEY, JSON.stringify(state));
  }

  clear(): void {
    window.localStorage.removeItem(DEV_SAVE_KEY);
  }
}

