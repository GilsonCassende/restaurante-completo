export type StorageProvider = "local" | "s3" | "r2" | "supabase" | "minio";

export type StorageValidationResult = {
  allowed: boolean;
  reason?: string;
};

export type StorageFile = {
  id: string;
  tenantId: string;
  provider: StorageProvider;
  path: string;
  filename: string;
  mimeType: string;
  size: number;
  hash: string;
  etag: string;
  url: string;
  signedUrl: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
};

export type StorageUploadInput = {
  tenantId: string;
  folder?: string;
  filename: string;
  mimeType: string;
  content: Buffer;
  compress?: boolean;
  targetFormat?: "original" | "webp" | "avif";
  resize?: {
    width?: number;
    height?: number;
    fit?: "cover" | "contain" | "inside" | "outside";
  } | null;
  metadata?: Record<string, unknown> | null;
};

export type StorageUploadResult = StorageFile & {
  content: Buffer;
};

export type StorageListInput = {
  tenantId: string;
  folder?: string;
};

export type SignedUrlInput = {
  tenantId: string;
  path: string;
  expiresInSeconds: number;
};

export type StorageAdapter = {
  name: string;
  provider: StorageProvider;
  supportsTransforms?: boolean;
  upload(input: StorageUploadInput): Promise<StorageUploadResult>;
  download(tenantId: string, path: string): Promise<StorageUploadResult | null>;
  delete(tenantId: string, path: string): Promise<boolean>;
  list(input: StorageListInput): Promise<StorageFile[]>;
  signUrl(input: SignedUrlInput): Promise<string>;
};

export type StorageManager = StorageAdapter & {
  createPath: (tenantId: string, folder: string | undefined, filename: string) => string;
};
