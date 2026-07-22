import "server-only";

import { gzipSync } from "node:zlib";
import { randomUUID, createHmac } from "node:crypto";
import type {
  SignedUrlInput,
  StorageListInput,
  StorageProvider,
  StorageManager,
  StorageUploadInput,
  StorageUploadResult,
} from "./types";
import { buildFileHash, normalizeTenantPath, sanitizeStorageFilename, shouldCompressFile, validateUploadFile } from "./validation";

type StorageStore = {
  files: Map<string, StorageUploadResult>;
};

const stores = new Map<string, StorageStore>();

function getStore(name: string) {
  const current = stores.get(name);
  if (current) return current;
  const store: StorageStore = { files: new Map() };
  stores.set(name, store);
  return store;
}

function makeUrl(provider: StorageProvider, path: string) {
  return `storage://${provider}/${path}`;
}

function normalizeFolderPrefix(tenantId: string, folder?: string) {
  const safeFolder = (folder ?? "").replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
  const base = ["tenants", tenantId, safeFolder].filter(Boolean).join("/");
  return `${base}/`;
}

function buildSignedUrl(path: string, expiresInSeconds: number) {
  const expiresAt = Date.now() + Math.max(expiresInSeconds, 60) * 1000;
  const signature = createHmac("sha256", "restaurantpro-storage-secret").update(`${path}:${expiresAt}`).digest("hex");
  return `${path}?expiresAt=${expiresAt}&signature=${signature}`;
}

function transformContent(input: StorageUploadInput) {
  if (!input.compress || !shouldCompressFile(input.mimeType)) {
    return input.content;
  }

  return gzipSync(input.content);
}

function buildStorageResult(provider: StorageProvider, input: StorageUploadInput, content: Buffer): StorageUploadResult {
  const filename = sanitizeStorageFilename(input.filename, input.targetFormat);
  const normalizedPath = normalizeTenantPath(input.tenantId, input.folder, filename);
  const hash = buildFileHash(content);
  const now = new Date();
  return {
    id: randomUUID(),
    tenantId: input.tenantId,
    provider,
    path: normalizedPath,
    filename,
    mimeType: input.targetFormat === "webp" ? "image/webp" : input.targetFormat === "avif" ? "image/avif" : input.mimeType,
    size: content.byteLength,
    hash,
    etag: hash.slice(0, 32),
    url: makeUrl(provider, normalizedPath),
    signedUrl: null,
    metadata: {
      ...(input.metadata ?? {}),
      compressed: Boolean(input.compress && shouldCompressFile(input.mimeType)),
      targetFormat: input.targetFormat ?? "original",
      resize: input.resize ?? null,
    },
    createdAt: now,
    updatedAt: now,
    content,
  };
}

function createAdapter(provider: StorageProvider): StorageManager {
  const store = getStore(provider);

  return {
    name: `${provider}-adapter`,
    provider,
    supportsTransforms: true,
    async upload(input) {
      const validation = validateUploadFile({
        filename: input.filename,
        mimeType: input.mimeType,
        size: input.content.byteLength,
      });
      if (!validation.allowed) {
        throw new Error(validation.reason ?? "Upload inválido.");
      }

      const content = transformContent(input);
      const result = buildStorageResult(provider, input, content);
      store.files.set(result.path, result);
      return {
        ...result,
        signedUrl: await this.signUrl({ tenantId: input.tenantId, path: result.path, expiresInSeconds: 3600 }),
      };
    },
    async download(tenantId, path) {
      const file = store.files.get(path) ?? null;
      if (!file || file.tenantId !== tenantId) return null;
      return file;
    },
    async delete(tenantId, path) {
      const file = store.files.get(path) ?? null;
      if (!file || file.tenantId !== tenantId) return false;
      return store.files.delete(path);
    },
    async list(input: StorageListInput) {
      const folderPrefix = input.folder ? normalizeFolderPrefix(input.tenantId, input.folder) : null;
      return Array.from(store.files.values()).filter(
        (file) => file.tenantId === input.tenantId && (!folderPrefix || file.path.startsWith(folderPrefix))
      );
    },
    async signUrl(input: SignedUrlInput) {
      return buildSignedUrl(makeUrl(provider, input.path), input.expiresInSeconds);
    },
    createPath(tenantId, folder, filename) {
      return normalizeTenantPath(tenantId, folder, sanitizeStorageFilename(filename));
    },
  };
}

export function createLocalStorageAdapter() {
  return createAdapter("local");
}

export function createS3StorageAdapter() {
  return createAdapter("s3");
}

export function createCloudflareR2StorageAdapter() {
  return createAdapter("r2");
}

export function createSupabaseStorageAdapter() {
  return createAdapter("supabase");
}

export function createMinioStorageAdapter() {
  return createAdapter("minio");
}
