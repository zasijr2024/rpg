import { isRecord } from "./validation";

export const DEV_SAVE_KEY = "adr-remake-dev-save";
export const DEV_SAVE_STAGING_KEY = `${DEV_SAVE_KEY}:staging`;
export const DEV_SAVE_BACKUP_KEY = `${DEV_SAVE_KEY}:backup`;
export const DEV_SAVE_QUARANTINE_KEY = `${DEV_SAVE_KEY}:quarantine`;
export const DEV_SAVE_SCHEMA_VERSION = 1;

const SAVE_DOCUMENT_KIND = "adr-remake-save";

export type DevSaveData = unknown;

export interface DevSaveAdapter {
  load(): DevSaveData | null;
  recover(reason: string): DevSaveData | null;
  save(data: DevSaveData): void;
  clear(): void;
  quarantine(reason: string): void;
}

export interface DevSaveDocument {
  kind: typeof SAVE_DOCUMENT_KIND;
  schemaVersion: typeof DEV_SAVE_SCHEMA_VERSION;
  payload: DevSaveData;
  checksum: string;
}

interface QuarantinedDevSave {
  reason: string;
  raw: string;
}

interface DecodedSave {
  data: DevSaveData;
  migratedRaw: string | null;
}

type DecodeResult =
  { ok: true; value: DecodedSave } | { ok: false; reason: string };

export class LocalStorageDevSaveAdapter implements DevSaveAdapter {
  load(): DevSaveData | null {
    if (typeof window === "undefined") return null;
    const storage = window.localStorage;
    const raw = storage.getItem(DEV_SAVE_KEY);

    if (raw === null) {
      storage.removeItem(DEV_SAVE_STAGING_KEY);
      return this.restoreBackup();
    }

    const decoded = decodeSave(raw);
    if (!decoded.ok) {
      this.quarantineRaw(decoded.reason, raw);
      storage.removeItem(DEV_SAVE_KEY);
      storage.removeItem(DEV_SAVE_STAGING_KEY);
      return this.restoreBackup();
    }

    storage.removeItem(DEV_SAVE_STAGING_KEY);
    if (decoded.value.migratedRaw !== null) {
      this.commitMigration(raw, decoded.value.migratedRaw);
    }
    return decoded.value.data;
  }

  recover(reason: string): DevSaveData | null {
    if (typeof window === "undefined") return null;
    this.quarantine(reason);
    return this.restoreBackup();
  }

  save(data: DevSaveData): void {
    if (typeof window === "undefined") return;
    const storage = window.localStorage;
    const raw = encodeSave(data);
    const previous = storage.getItem(DEV_SAVE_KEY);

    // The staging record is never promoted during recovery: only a completed
    // primary commit or the previous committed generation may be loaded.
    storage.setItem(DEV_SAVE_STAGING_KEY, raw);
    if (previous !== null && decodeSave(previous).ok) {
      storage.setItem(DEV_SAVE_BACKUP_KEY, previous);
    }
    storage.setItem(DEV_SAVE_KEY, raw);
    storage.removeItem(DEV_SAVE_STAGING_KEY);
  }

  clear(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(DEV_SAVE_KEY);
    window.localStorage.removeItem(DEV_SAVE_STAGING_KEY);
    window.localStorage.removeItem(DEV_SAVE_BACKUP_KEY);
  }

  quarantine(reason: string): void {
    if (typeof window === "undefined") return;
    const storage = window.localStorage;
    const raw = storage.getItem(DEV_SAVE_KEY);
    if (raw !== null) this.quarantineRaw(reason, raw);
    storage.removeItem(DEV_SAVE_KEY);
    storage.removeItem(DEV_SAVE_STAGING_KEY);
  }

  private commitMigration(previous: string, migrated: string): void {
    const storage = window.localStorage;
    try {
      storage.setItem(DEV_SAVE_STAGING_KEY, migrated);
      if (storage.getItem(DEV_SAVE_BACKUP_KEY) === null) {
        storage.setItem(DEV_SAVE_BACKUP_KEY, previous);
      }
      storage.setItem(DEV_SAVE_KEY, migrated);
    } catch {
      // The supported legacy value remains loadable if storage rejects the
      // migration write. A later successful save can finish the upgrade.
    } finally {
      storage.removeItem(DEV_SAVE_STAGING_KEY);
    }
  }

  private restoreBackup(): DevSaveData | null {
    const storage = window.localStorage;
    const backup = storage.getItem(DEV_SAVE_BACKUP_KEY);
    if (backup === null) return null;

    const decoded = decodeSave(backup);
    if (!decoded.ok) {
      storage.removeItem(DEV_SAVE_BACKUP_KEY);
      return null;
    }

    const committed = decoded.value.migratedRaw ?? backup;
    try {
      storage.setItem(DEV_SAVE_KEY, committed);
      storage.removeItem(DEV_SAVE_BACKUP_KEY);
    } catch {
      // Recovery still returns the validated backup for this session. The
      // caller can continue playing even when persistence is unavailable.
    }
    return decoded.value.data;
  }

  private quarantineRaw(reason: string, raw: string): void {
    const quarantined: QuarantinedDevSave = { reason, raw };
    try {
      window.localStorage.setItem(
        DEV_SAVE_QUARANTINE_KEY,
        JSON.stringify(quarantined),
      );
    } catch {
      // Resetting the active slot is safer than retrying a bad save forever.
    }
  }
}

export class MemoryDevSaveAdapter implements DevSaveAdapter {
  private raw: string | null = null;
  private backup: string | null = null;
  private quarantined: QuarantinedDevSave | null = null;

  load(): DevSaveData | null {
    if (this.raw === null) return this.restoreBackup();
    const decoded = decodeSave(this.raw);
    if (!decoded.ok) {
      this.quarantine(decoded.reason);
      return this.restoreBackup();
    }
    if (decoded.value.migratedRaw !== null) {
      this.backup ??= this.raw;
      this.raw = decoded.value.migratedRaw;
    }
    return decoded.value.data;
  }

  recover(reason: string): DevSaveData | null {
    this.quarantine(reason);
    return this.restoreBackup();
  }

  save(data: DevSaveData): void {
    const next = encodeSave(data);
    if (this.raw !== null && decodeSave(this.raw).ok) this.backup = this.raw;
    this.raw = next;
  }

  clear(): void {
    this.raw = null;
    this.backup = null;
  }

  quarantine(reason: string): void {
    if (this.raw === null) return;
    this.quarantined = { reason, raw: this.raw };
    this.raw = null;
  }

  setRawForTest(raw: string): void {
    this.raw = raw;
  }

  rawForTest(): string | null {
    return this.raw;
  }

  backupForTest(): string | null {
    return this.backup;
  }

  quarantinedForTest(): QuarantinedDevSave | null {
    return this.quarantined ? { ...this.quarantined } : null;
  }

  private restoreBackup(): DevSaveData | null {
    if (this.backup === null) return null;
    const decoded = decodeSave(this.backup);
    if (!decoded.ok) {
      this.backup = null;
      return null;
    }
    this.raw = decoded.value.migratedRaw ?? this.backup;
    this.backup = null;
    return decoded.value.data;
  }
}

export function createDevSaveDocument(data: DevSaveData): DevSaveDocument {
  const payloadRaw = stringifyPayload(data);
  return {
    kind: SAVE_DOCUMENT_KIND,
    schemaVersion: DEV_SAVE_SCHEMA_VERSION,
    payload: data,
    checksum: checksum(payloadRaw),
  };
}

function encodeSave(data: DevSaveData): string {
  const raw = JSON.stringify(createDevSaveDocument(data));
  if (raw === undefined) {
    throw new Error("Dev save data is not JSON serializable");
  }
  return raw;
}

function decodeSave(raw: string): DecodeResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return { ok: false, reason: "invalid-json" };
  }

  if (isRecord(parsed) && parsed.kind === SAVE_DOCUMENT_KIND) {
    if (parsed.schemaVersion !== DEV_SAVE_SCHEMA_VERSION) {
      return { ok: false, reason: "incompatible-schema" };
    }
    if (!("payload" in parsed) || typeof parsed.checksum !== "string") {
      return { ok: false, reason: "invalid-save-document" };
    }
    let payloadRaw: string;
    try {
      payloadRaw = stringifyPayload(parsed.payload);
    } catch {
      return { ok: false, reason: "invalid-save-document" };
    }
    if (checksum(payloadRaw) !== parsed.checksum) {
      return { ok: false, reason: "checksum-mismatch" };
    }
    return {
      ok: true,
      value: { data: parsed.payload, migratedRaw: null },
    };
  }

  if (!isSupportedLegacySave(parsed)) {
    return { ok: false, reason: "incompatible-schema" };
  }

  return {
    ok: true,
    value: { data: parsed, migratedRaw: encodeSave(parsed) },
  };
}

function stringifyPayload(data: DevSaveData): string {
  const raw = JSON.stringify(data);
  if (raw === undefined) {
    throw new Error("Dev save data is not JSON serializable");
  }
  return raw;
}

function checksum(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function isSupportedLegacySave(data: unknown): boolean {
  if (!isRecord(data)) return false;
  if (
    (data.kind === "session" || data.kind === "engine") &&
    data.version === 2
  ) {
    return true;
  }
  return (
    typeof data.version === "number" &&
    [
      "features",
      "stores",
      "character",
      "income",
      "timers",
      "game",
      "playStats",
      "previous",
      "outfit",
      "config",
      "wait",
      "cooldown",
    ].every((key) => isRecord(data[key]))
  );
}
