import { isRecord } from "./validation";

export const DEV_SAVE_KEY = "adr-remake-save";
export const DEV_SAVE_STAGING_KEY = `${DEV_SAVE_KEY}:staging`;
export const DEV_SAVE_BACKUP_KEY = `${DEV_SAVE_KEY}:backup`;
export const DEV_SAVE_QUARANTINE_KEY = `${DEV_SAVE_KEY}:quarantine`;
export const LEGACY_DEV_SAVE_KEY = "adr-remake-dev-save";
export const LEGACY_DEV_SAVE_STAGING_KEY = `${LEGACY_DEV_SAVE_KEY}:staging`;
export const LEGACY_DEV_SAVE_BACKUP_KEY = `${LEGACY_DEV_SAVE_KEY}:backup`;
export const LEGACY_DEV_SAVE_QUARANTINE_KEY = `${LEGACY_DEV_SAVE_KEY}:quarantine`;
export const DEV_SAVE_SCHEMA_VERSION = 1;

const SAVE_DOCUMENT_KIND = "adr-remake-save";

export type DevSaveData = unknown;

export type DevSaveLoadResult =
  | { status: "empty" }
  | { status: "loaded"; data: DevSaveData }
  | { status: "migrated"; data: DevSaveData }
  | {
      status: "recovered";
      data: DevSaveData;
      reason: string;
      quarantine?: QuarantinedDevSave;
    }
  | {
      status: "quarantined";
      reason: string;
      quarantine?: QuarantinedDevSave;
    };

export type DevSaveValidator = (data: DevSaveData) => boolean;

export type DevSaveDecodeResult =
  { ok: true; data: DevSaveData } | { ok: false; reason: string };

export interface DevSaveAdapter {
  load(): DevSaveLoadResult;
  recover(reason: string): DevSaveLoadResult;
  save(data: DevSaveData, validate: DevSaveValidator): void;
  acknowledgeRecovery(): void;
  clear(): void;
  quarantine(reason: string): void;
}

export interface DevSaveDocument {
  kind: typeof SAVE_DOCUMENT_KIND;
  schemaVersion: typeof DEV_SAVE_SCHEMA_VERSION;
  payload: DevSaveData;
  checksum: string;
}

export interface QuarantinedDevSave {
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
  load(): DevSaveLoadResult {
    if (typeof window === "undefined") return { status: "empty" };
    const storage = window.localStorage;
    const migratedNamespace = this.migrateLegacyStorage(storage);
    const persistedQuarantine = this.readQuarantine(storage);
    const raw = storage.getItem(DEV_SAVE_KEY);

    if (raw === null) {
      storage.removeItem(DEV_SAVE_STAGING_KEY);
      return this.restoreBackup(
        persistedQuarantine?.reason ?? "missing-primary",
        persistedQuarantine ?? undefined,
      );
    }

    const decoded = decodeSave(raw);
    if (!decoded.ok) {
      const quarantine = this.quarantineRaw(decoded.reason, raw);
      storage.removeItem(DEV_SAVE_KEY);
      storage.removeItem(DEV_SAVE_STAGING_KEY);
      return this.restoreBackup(decoded.reason, quarantine);
    }

    storage.removeItem(DEV_SAVE_STAGING_KEY);
    if (decoded.value.migratedRaw !== null) {
      this.commitMigration(raw, decoded.value.migratedRaw);
    }
    if (persistedQuarantine !== null) {
      return {
        status: "recovered",
        data: decoded.value.data,
        reason: persistedQuarantine.reason,
        quarantine: persistedQuarantine,
      };
    }
    return {
      status:
        migratedNamespace || decoded.value.migratedRaw !== null
          ? "migrated"
          : "loaded",
      data: decoded.value.data,
    };
  }

  recover(reason: string): DevSaveLoadResult {
    if (typeof window === "undefined") return { status: "quarantined", reason };
    const quarantine = this.quarantineCurrent(reason);
    return this.restoreBackup(reason, quarantine);
  }

  save(data: DevSaveData, validate: DevSaveValidator): void {
    if (typeof window === "undefined") return;
    const storage = window.localStorage;
    const raw = encodeSave(data);
    assertSemanticallyValid(raw, validate);
    const previous = storage.getItem(DEV_SAVE_KEY);

    // The staging record is never promoted during recovery: only a completed
    // primary commit or the previous committed generation may be loaded.
    storage.setItem(DEV_SAVE_STAGING_KEY, raw);
    if (previous !== null) {
      const decodedPrevious = decodeSave(previous);
      if (
        decodedPrevious.ok &&
        safelyValidate(validate, decodedPrevious.value.data)
      ) {
        storage.setItem(DEV_SAVE_BACKUP_KEY, previous);
      }
    }
    storage.setItem(DEV_SAVE_KEY, raw);
    storage.removeItem(DEV_SAVE_STAGING_KEY);
  }

  acknowledgeRecovery(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(DEV_SAVE_QUARANTINE_KEY);
  }

  clear(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(DEV_SAVE_KEY);
    window.localStorage.removeItem(DEV_SAVE_STAGING_KEY);
    window.localStorage.removeItem(DEV_SAVE_BACKUP_KEY);
    window.localStorage.removeItem(DEV_SAVE_QUARANTINE_KEY);
    window.localStorage.removeItem(LEGACY_DEV_SAVE_KEY);
    window.localStorage.removeItem(LEGACY_DEV_SAVE_STAGING_KEY);
    window.localStorage.removeItem(LEGACY_DEV_SAVE_BACKUP_KEY);
    window.localStorage.removeItem(LEGACY_DEV_SAVE_QUARANTINE_KEY);
  }

  quarantine(reason: string): void {
    if (typeof window === "undefined") return;
    this.quarantineCurrent(reason);
  }

  private quarantineCurrent(reason: string): QuarantinedDevSave | undefined {
    const storage = window.localStorage;
    const raw = storage.getItem(DEV_SAVE_KEY);
    const quarantine =
      raw === null ? undefined : this.quarantineRaw(reason, raw);
    storage.removeItem(DEV_SAVE_KEY);
    storage.removeItem(DEV_SAVE_STAGING_KEY);
    return quarantine;
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

  private restoreBackup(
    reason: string,
    quarantine?: QuarantinedDevSave,
  ): DevSaveLoadResult {
    const storage = window.localStorage;
    const backup = storage.getItem(DEV_SAVE_BACKUP_KEY);
    if (backup === null) {
      return reason === "missing-primary"
        ? { status: "empty" }
        : { status: "quarantined", reason, quarantine };
    }

    const decoded = decodeSave(backup);
    if (!decoded.ok) {
      storage.removeItem(DEV_SAVE_BACKUP_KEY);
      const backupQuarantine = this.quarantineRaw(
        `invalid-backup:${decoded.reason}`,
        backup,
      );
      return {
        status: "quarantined",
        reason,
        quarantine: quarantine ?? backupQuarantine,
      };
    }

    const committed = decoded.value.migratedRaw ?? backup;
    try {
      storage.setItem(DEV_SAVE_KEY, committed);
      storage.removeItem(DEV_SAVE_BACKUP_KEY);
    } catch {
      // Recovery still returns the validated backup for this session. The
      // caller can continue playing even when persistence is unavailable.
    }
    return {
      status: "recovered",
      data: decoded.value.data,
      reason,
      quarantine,
    };
  }

  private quarantineRaw(reason: string, raw: string): QuarantinedDevSave {
    const quarantined: QuarantinedDevSave = { reason, raw };
    try {
      window.localStorage.setItem(
        DEV_SAVE_QUARANTINE_KEY,
        JSON.stringify(quarantined),
      );
    } catch {
      // Resetting the active slot is safer than retrying a bad save forever.
    }
    return quarantined;
  }

  private readQuarantine(storage: Storage): QuarantinedDevSave | null {
    const raw = storage.getItem(DEV_SAVE_QUARANTINE_KEY);
    if (raw === null) return null;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (
        isRecord(parsed) &&
        typeof parsed.reason === "string" &&
        typeof parsed.raw === "string"
      ) {
        return { reason: parsed.reason, raw: parsed.raw };
      }
    } catch {
      // Preserve the marker itself as diagnostic evidence below.
    }
    return { reason: "invalid-quarantine-marker", raw };
  }

  private migrateLegacyStorage(storage: Storage): boolean {
    const legacyPrimary = storage.getItem(LEGACY_DEV_SAVE_KEY);
    const legacyBackup = storage.getItem(LEGACY_DEV_SAVE_BACKUP_KEY);
    const legacyQuarantine = storage.getItem(LEGACY_DEV_SAVE_QUARANTINE_KEY);
    const hasLegacyGeneration = legacyPrimary !== null || legacyBackup !== null;

    if (
      storage.getItem(DEV_SAVE_KEY) === null &&
      storage.getItem(DEV_SAVE_BACKUP_KEY) === null
    ) {
      if (legacyPrimary !== null) {
        storage.setItem(DEV_SAVE_STAGING_KEY, legacyPrimary);
      }
      if (legacyBackup !== null) {
        storage.setItem(DEV_SAVE_BACKUP_KEY, legacyBackup);
      }
      if (legacyPrimary !== null) {
        storage.setItem(DEV_SAVE_KEY, legacyPrimary);
        storage.removeItem(DEV_SAVE_STAGING_KEY);
      }
      if (
        legacyQuarantine !== null &&
        storage.getItem(DEV_SAVE_QUARANTINE_KEY) === null
      ) {
        storage.setItem(DEV_SAVE_QUARANTINE_KEY, legacyQuarantine);
      }
    }

    storage.removeItem(LEGACY_DEV_SAVE_KEY);
    storage.removeItem(LEGACY_DEV_SAVE_STAGING_KEY);
    storage.removeItem(LEGACY_DEV_SAVE_BACKUP_KEY);
    storage.removeItem(LEGACY_DEV_SAVE_QUARANTINE_KEY);
    return hasLegacyGeneration;
  }
}

export class MemoryDevSaveAdapter implements DevSaveAdapter {
  private raw: string | null = null;
  private backup: string | null = null;
  private quarantined: QuarantinedDevSave | null = null;

  load(): DevSaveLoadResult {
    if (this.raw === null) {
      return this.restoreBackup(
        this.quarantined?.reason ?? "missing-primary",
        this.quarantined ?? undefined,
      );
    }
    const decoded = decodeSave(this.raw);
    if (!decoded.ok) {
      const quarantine = this.quarantineCurrent(decoded.reason);
      return this.restoreBackup(decoded.reason, quarantine);
    }
    if (decoded.value.migratedRaw !== null) {
      this.backup ??= this.raw;
      this.raw = decoded.value.migratedRaw;
    }
    if (this.quarantined !== null) {
      return {
        status: "recovered",
        data: decoded.value.data,
        reason: this.quarantined.reason,
        quarantine: { ...this.quarantined },
      };
    }
    return {
      status: decoded.value.migratedRaw === null ? "loaded" : "migrated",
      data: decoded.value.data,
    };
  }

  recover(reason: string): DevSaveLoadResult {
    const quarantine = this.quarantineCurrent(reason);
    return this.restoreBackup(reason, quarantine);
  }

  save(data: DevSaveData, validate: DevSaveValidator): void {
    const next = encodeSave(data);
    assertSemanticallyValid(next, validate);
    if (this.raw !== null) {
      const decodedCurrent = decodeSave(this.raw);
      if (
        decodedCurrent.ok &&
        safelyValidate(validate, decodedCurrent.value.data)
      ) {
        this.backup = this.raw;
      }
    }
    this.raw = next;
  }

  acknowledgeRecovery(): void {
    this.quarantined = null;
  }

  clear(): void {
    this.raw = null;
    this.backup = null;
    this.quarantined = null;
  }

  quarantine(reason: string): void {
    this.quarantineCurrent(reason);
  }

  private quarantineCurrent(reason: string): QuarantinedDevSave | undefined {
    if (this.raw === null) return;
    this.quarantined = { reason, raw: this.raw };
    this.raw = null;
    return { ...this.quarantined };
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

  private restoreBackup(
    reason: string,
    quarantine?: QuarantinedDevSave,
  ): DevSaveLoadResult {
    if (this.backup === null) {
      return reason === "missing-primary"
        ? { status: "empty" }
        : { status: "quarantined", reason, quarantine };
    }
    const decoded = decodeSave(this.backup);
    if (!decoded.ok) {
      const backupQuarantine = {
        reason: `invalid-backup:${decoded.reason}`,
        raw: this.backup,
      };
      this.quarantined = backupQuarantine;
      this.backup = null;
      return {
        status: "quarantined",
        reason,
        quarantine: quarantine ?? backupQuarantine,
      };
    }
    this.raw = decoded.value.migratedRaw ?? this.backup;
    this.backup = null;
    return {
      status: "recovered",
      data: decoded.value.data,
      reason,
      quarantine,
    };
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

export function decodeDevSave(raw: string): DevSaveDecodeResult {
  const result = decodeSave(raw);
  return result.ok
    ? { ok: true, data: result.value.data }
    : { ok: false, reason: result.reason };
}

function assertSemanticallyValid(
  raw: string,
  validate: DevSaveValidator,
): void {
  const decoded = decodeSave(raw);
  if (!decoded.ok || !safelyValidate(validate, decoded.value.data)) {
    throw new Error("Refusing to persist a semantically invalid dev save");
  }
}

function safelyValidate(
  validate: DevSaveValidator,
  data: DevSaveData,
): boolean {
  try {
    return validate(data);
  } catch {
    return false;
  }
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
