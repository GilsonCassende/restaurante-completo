import { createHash, randomUUID } from "node:crypto";
import type { StorageValidationResult } from "./types";

const DEFAULT_ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
  "application/json",
  "text/plain",
]);

export function normalizeTenantPath(tenantId: string, folder: string | undefined, filename: string) {
  const safeFolder = (folder ?? "").replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
  const safeFilename = filename.replace(/\\/g, "/").split("/").pop() ?? `${randomUUID()}.bin`;
  return ["tenants", tenantId, safeFolder, safeFilename].filter(Boolean).join("/");
}

export function sanitizeStorageFilename(filename: string, targetFormat?: "original" | "webp" | "avif") {
  const baseName = filename.replace(/\\/g, "/").split("/").pop() ?? `${randomUUID()}.bin`;
  const cleaned = baseName.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
  if (targetFormat === "webp") {
    return cleaned.replace(/\.[^.]+$/, "") + ".webp";
  }
  if (targetFormat === "avif") {
    return cleaned.replace(/\.[^.]+$/, "") + ".avif";
  }
  return cleaned;
}

export function buildFileHash(content: Buffer) {
  return createHash("sha256").update(content).digest("hex");
}

export function validateUploadFile(input: {
  filename: string;
  mimeType: string;
  size: number;
  allowedMimeTypes?: Set<string>;
  maxSizeBytes?: number;
}): StorageValidationResult {
  const allowedMimeTypes = input.allowedMimeTypes ?? DEFAULT_ALLOWED_MIME_TYPES;
  const maxSizeBytes = input.maxSizeBytes ?? 25 * 1024 * 1024;

  if (!input.filename.trim() || input.filename.includes("..")) {
    return { allowed: false, reason: "Nome de arquivo inválido." };
  }

  if (!allowedMimeTypes.has(input.mimeType)) {
    return { allowed: false, reason: "Tipo MIME não permitido." };
  }

  if (!Number.isFinite(input.size) || input.size <= 0 || input.size > maxSizeBytes) {
    return { allowed: false, reason: "Arquivo excede o limite permitido." };
  }

  return { allowed: true };
}

export function shouldCompressFile(mimeType: string) {
  return mimeType.startsWith("image/") || mimeType === "application/json" || mimeType === "text/plain";
}

export function buildContentDisposition(filename: string) {
  return `attachment; filename="${filename.replace(/"/g, "")}"`;
}
