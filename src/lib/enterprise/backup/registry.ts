import { createHash, randomUUID } from "node:crypto";
import { gzipSync, gunzipSync } from "node:zlib";
import type {
  BackupAdapter,
  BackupExportResult,
  BackupImportInput,
  BackupRetentionPolicy,
  BackupSnapshot,
  BackupValidationResult,
} from "./types";

type BackupStore = {
  snapshots: Map<string, BackupSnapshot>;
};

const stores = new Map<string, BackupStore>();

function getStore(name: string) {
  const current = stores.get(name);
  if (current) return current;
  const store: BackupStore = {
    snapshots: new Map(),
  };
  stores.set(name, store);
  return store;
}

function now() {
  return new Date();
}

export function buildBackupChecksum(content: Buffer | string) {
  const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
  return createHash("sha256").update(buffer).digest("hex");
}

export function validateBackupPayload(input: { tenantId: string; namespace: string; version: string; data: Buffer | string }): BackupValidationResult {
  if (!input.tenantId.trim()) {
    return { allowed: false, reason: "Tenant inválido." };
  }
  if (!input.namespace.trim()) {
    return { allowed: false, reason: "Namespace inválido." };
  }
  if (!input.version.trim()) {
    return { allowed: false, reason: "Versão inválida." };
  }
  if (Buffer.isBuffer(input.data) ? input.data.byteLength === 0 : !input.data.trim()) {
    return { allowed: false, reason: "Backup sem conteúdo." };
  }
  return { allowed: true };
}

function encodePayload(input: Buffer | string, compressed: boolean) {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return compressed ? gzipSync(buffer) : buffer;
}

function decodePayload(input: Buffer, compressed: boolean) {
  return compressed ? gunzipSync(input) : input;
}

function buildSnapshot(
  input: Omit<BackupSnapshot, "id" | "createdAt" | "updatedAt" | "status" | "checksum" | "size" | "compressed" | "expiresAt"> & {
    payload: Buffer;
    metadata?: Record<string, unknown> | null;
    compressed?: boolean;
    expiresAt?: Date | null;
  }
): BackupSnapshot {
  const compressed = input.compressed ?? false;
  const payload = encodePayload(input.payload, compressed);
  const checksum = buildBackupChecksum(payload);
  const current = now();
  return {
    id: randomUUID(),
    tenantId: input.tenantId,
    namespace: input.namespace,
    version: input.version,
    status: "completed",
    checksum,
    size: payload.byteLength,
    compressed,
    payload,
    metadata: input.metadata ?? null,
    createdAt: current,
    updatedAt: current,
    expiresAt: input.expiresAt ?? null,
  };
}

function createAdapter(name: string): BackupAdapter {
  const store = getStore(name);

  return {
    name,
    async createSnapshot(input) {
      const snapshot = buildSnapshot(input);
      store.snapshots.set(snapshot.id, snapshot);
      return snapshot;
    },
    async listSnapshots(tenantId, namespace) {
      return Array.from(store.snapshots.values()).filter((snapshot) => {
        if (tenantId && snapshot.tenantId !== tenantId) return false;
        if (namespace && snapshot.namespace !== namespace) return false;
        return true;
      });
    },
    async getSnapshot(id) {
      return store.snapshots.get(id) ?? null;
    },
    async deleteSnapshot(id) {
      return store.snapshots.delete(id);
    },
  };
}

export function createLocalBackupAdapter() {
  return createAdapter("local");
}

export function createMemoryBackupAdapter() {
  return createAdapter("memory");
}

export function restoreBackupSnapshot(snapshot: BackupSnapshot) {
  const payload = decodePayload(snapshot.payload, snapshot.compressed);
  return {
    ...snapshot,
    status: "restored" as const,
    payload,
    updatedAt: now(),
  };
}

export function exportBackupSnapshot(snapshot: BackupSnapshot, format: "json" | "buffer" = "json"): BackupExportResult {
  return {
    snapshot,
    format,
    data:
      format === "buffer"
        ? snapshot.payload
        : JSON.stringify({
            ...snapshot,
            payload: snapshot.payload.toString("base64"),
          }),
  };
}

export function importBackupSnapshot(input: BackupImportInput) {
  const payload = Buffer.isBuffer(input.data) ? input.data : Buffer.from(input.data, "base64");
  const compressed = input.compressed ?? false;
  const decoded = decodePayload(payload, compressed);
  return buildSnapshot({
    tenantId: input.tenantId,
    namespace: input.namespace,
    version: input.version,
    payload: decoded,
    metadata: input.metadata ?? null,
    compressed,
    expiresAt: null,
  });
}

export function applyRetentionPolicy(snapshot: BackupSnapshot, policy: BackupRetentionPolicy) {
  const ageMs = Date.now() - snapshot.createdAt.getTime();
  const keepForMs = policy.keepForDays * 24 * 60 * 60 * 1000;
  const expiredByAge = ageMs > keepForMs;
  return {
    ...snapshot,
    expiresAt: expiredByAge ? new Date(snapshot.createdAt.getTime() + keepForMs) : snapshot.expiresAt,
    status: expiredByAge ? "expired" as const : snapshot.status,
  };
}
