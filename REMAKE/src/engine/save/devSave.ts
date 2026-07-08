export const DEV_SAVE_KEY = "adr-remake-dev-save";

export type DevSaveData = unknown;

export interface DevSaveAdapter {
  load(): DevSaveData | null;
  save(data: DevSaveData): void;
  clear(): void;
}

export class LocalStorageDevSaveAdapter implements DevSaveAdapter {
  load(): DevSaveData | null {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(DEV_SAVE_KEY);
    return raw ? (JSON.parse(raw) as DevSaveData) : null;
  }

  save(data: DevSaveData): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(DEV_SAVE_KEY, JSON.stringify(data));
  }

  clear(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(DEV_SAVE_KEY);
  }
}

export class MemoryDevSaveAdapter implements DevSaveAdapter {
  private raw: string | null = null;

  load(): DevSaveData | null {
    return this.raw ? (JSON.parse(this.raw) as DevSaveData) : null;
  }

  save(data: DevSaveData): void {
    this.raw = JSON.stringify(data);
  }

  clear(): void {
    this.raw = null;
  }
}
