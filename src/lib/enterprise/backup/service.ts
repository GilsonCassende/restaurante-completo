import { createJobQueueManager } from "../jobs";
import {
  applyRetentionPolicy,
  createLocalBackupAdapter,
  createMemoryBackupAdapter,
  exportBackupSnapshot,
  importBackupSnapshot,
  restoreBackupSnapshot,
  validateBackupPayload,
} from "./registry";
import type {
  BackupAdapter,
  BackupExportResult,
  BackupImportInput,
  BackupRetentionPolicy,
  BackupSnapshot,
} from "./types";

export type BackupServiceOptions = {
  queueName?: string;
  retentionPolicy?: BackupRetentionPolicy;
  adapter?: BackupAdapter;
};

export function createBackupService(options?: BackupServiceOptions) {
  const adapter = options?.adapter ?? createMemoryBackupAdapter();
  const queueManager = createJobQueueManager(options?.queueName ?? "backups");
  const retentionPolicy = options?.retentionPolicy ?? {
    keepLast: 10,
    keepForDays: 7,
    compress: "gzip" as const,
    versioning: true,
  };

  async function createSnapshot(input: Omit<BackupSnapshot, "id" | "createdAt" | "updatedAt" | "status" | "checksum" | "size" | "compressed"> & {
    payload: Buffer;
    metadata?: Record<string, unknown> | null;
    compressed?: boolean;
    expiresAt?: Date | null;
  }) {
    const validation = validateBackupPayload({
      tenantId: input.tenantId,
      namespace: input.namespace,
      version: input.version,
      data: input.payload,
    });
    if (!validation.allowed) {
      throw new Error(validation.reason ?? "Backup inválido.");
    }

    const snapshot = await adapter.createSnapshot({
      ...input,
      compressed: input.compressed ?? (retentionPolicy.compress === "gzip"),
    });

    return applyRetentionPolicy(snapshot, retentionPolicy);
  }

  async function createScheduledSnapshot(input: Omit<BackupSnapshot, "id" | "createdAt" | "updatedAt" | "status" | "checksum" | "size" | "compressed"> & {
    payload: Buffer;
    metadata?: Record<string, unknown> | null;
    compressed?: boolean;
    expiresAt?: Date | null;
  }) {
    return queueManager.enqueue({
      tenantId: input.tenantId,
      queue: options?.queueName ?? "backups",
      type: "backup.create",
      payload: input,
      metadata: input.metadata ?? null,
    });
  }

  queueManager.registerHandler("backup.create", async ({ job }) => {
    const payload = job.payload as Parameters<typeof createSnapshot>[0];
    return createSnapshot(payload);
  });

  return {
    adapter,
    queueManager,
    retentionPolicy,
    async listSnapshots(tenantId?: string, namespace?: string) {
      return adapter.listSnapshots(tenantId, namespace);
    },
    async getSnapshot(id: string) {
      return adapter.getSnapshot(id);
    },
    async deleteSnapshot(id: string) {
      return adapter.deleteSnapshot(id);
    },
    async exportSnapshot(id: string, format: "json" | "buffer" = "json"): Promise<BackupExportResult | null> {
      const snapshot = await adapter.getSnapshot(id);
      if (!snapshot) return null;
      return exportBackupSnapshot(snapshot, format);
    },
    async restoreSnapshot(id: string) {
      const snapshot = await adapter.getSnapshot(id);
      if (!snapshot) return null;
      return restoreBackupSnapshot(snapshot);
    },
    importSnapshot(input: BackupImportInput) {
      return importBackupSnapshot(input);
    },
    async createSnapshotFromPayload(input: Parameters<typeof createSnapshot>[0]) {
      return createSnapshot(input);
    },
    async scheduleSnapshot(input: Parameters<typeof createSnapshot>[0]) {
      return createScheduledSnapshot(input);
    },
  };
}

export function createLocalBackupService() {
  return createBackupService({ adapter: createLocalBackupAdapter() });
}
