export type BackupStatus = "pending" | "completed" | "failed" | "expired" | "restored";

export type BackupCompression = "none" | "gzip";

export type BackupRetentionPolicy = {
  keepLast: number;
  keepForDays: number;
  compress: BackupCompression;
  versioning: boolean;
};

export type BackupSnapshot = {
  id: string;
  tenantId: string;
  namespace: string;
  version: string;
  status: BackupStatus;
  checksum: string;
  size: number;
  compressed: boolean;
  payload: Buffer;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date | null;
};

export type BackupExportFormat = "json" | "buffer";

export type BackupExportResult = {
  snapshot: BackupSnapshot;
  data: string | Buffer;
  format: BackupExportFormat;
};

export type BackupImportInput = {
  tenantId: string;
  namespace: string;
  version: string;
  data: string | Buffer;
  compressed?: boolean;
  metadata?: Record<string, unknown> | null;
};

export type BackupValidationResult = {
  allowed: boolean;
  reason?: string;
};

export type BackupAdapter = {
  name: string;
  createSnapshot(input: Omit<BackupSnapshot, "id" | "createdAt" | "updatedAt" | "status" | "checksum" | "size" | "compressed"> & {
    payload: Buffer;
    metadata?: Record<string, unknown> | null;
    compressed?: boolean;
    expiresAt?: Date | null;
  }): Promise<BackupSnapshot>;
  listSnapshots(tenantId?: string, namespace?: string): Promise<BackupSnapshot[]>;
  getSnapshot(id: string): Promise<BackupSnapshot | null>;
  deleteSnapshot(id: string): Promise<boolean>;
};
