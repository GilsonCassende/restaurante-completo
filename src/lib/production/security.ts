import type { NextRequest } from "next/server";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

export type UploadValidationResult = {
  allowed: boolean;
  reason?: string;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitBucket>();

const DEFAULT_ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
  "text/plain",
  "application/json",
]);

export function buildSecurityHeaders() {
  const isDevelopment = process.env.NODE_ENV === "development";
  return {
    "Content-Security-Policy": [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "object-src 'none'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      isDevelopment ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self' 'unsafe-inline'",
      "connect-src 'self' https: wss:",
      "media-src 'self' blob: data:",
      "worker-src 'self' blob:",
      "upgrade-insecure-requests",
    ].join("; "),
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-site",
    "Cross-Origin-Embedder-Policy": "require-corp",
    "X-DNS-Prefetch-Control": "off",
    "X-Permitted-Cross-Domain-Policies": "none",
  } as const;
}

export function getRequestFingerprint(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const realIp = request.headers.get("x-real-ip") ?? "";
  const ip = forwarded.split(",")[0]?.trim() || realIp || "unknown";
  return `${request.method}:${request.nextUrl.pathname}:${ip}`;
}

export function isUnsafeMethod(method: string) {
  return !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
}

export function isSameOriginRequest(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  return origin === request.nextUrl.origin;
}

export function validateRequestOrigin(request: NextRequest) {
  if (!isUnsafeMethod(request.method)) {
    return true;
  }

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  if (origin && origin === request.nextUrl.origin) return true;
  if (referer) {
    try {
      return new URL(referer).origin === request.nextUrl.origin;
    } catch {
      return false;
    }
  }
  return false;
}

export function createRateLimitKey(scope: string, identifier: string) {
  return `${scope}:${identifier}`;
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now()
): RateLimitResult {
  const bucket = rateLimitStore.get(key);
  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: Math.max(limit - 1, 0), resetAt };
  }

  bucket.count += 1;
  const allowed = bucket.count <= limit;
  if (!allowed) {
    rateLimitStore.set(key, bucket);
  }

  return {
    allowed,
    remaining: Math.max(limit - bucket.count, 0),
    resetAt: bucket.resetAt,
  };
}

export function pruneRateLimitBuckets(now = Date.now()) {
  for (const [key, bucket] of rateLimitStore) {
    if (bucket.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

export function sanitizeHtml(value: string) {
  return value
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\s*script[\s\S]*?>[\s\S]*?<\s*\/\s*script\s*>/gi, "")
    .replace(/<\s*(iframe|object|embed|link|meta)[\s\S]*?>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "")
    .replace(/javascript:/gi, "");
}

export function sanitizeMarkdown(value: string) {
  return sanitizeHtml(value)
    .replace(/^\s*#{1,6}\s+/gm, (match) => match)
    .replace(/\[(.*?)\]\((javascript:[^)]+)\)/gi, "[$1](#)")
    .replace(/<\s*\/?\s*(script|iframe|object|embed|style)[^>]*>/gi, "");
}

export function validateUploadFile(input: {
  filename: string;
  mimeType: string;
  size: number;
  allowedMimeTypes?: Set<string>;
  maxSizeBytes?: number;
}): UploadValidationResult {
  const allowedMimeTypes = input.allowedMimeTypes ?? DEFAULT_ALLOWED_MIME_TYPES;
  const maxSizeBytes = input.maxSizeBytes ?? 10 * 1024 * 1024;
  const normalizedFilename = input.filename.trim();

  if (!normalizedFilename || normalizedFilename.includes("..") || normalizedFilename.includes("/")) {
    return { allowed: false, reason: "Nome de arquivo inválido." };
  }

  if (!allowedMimeTypes.has(input.mimeType)) {
    return { allowed: false, reason: "Tipo de arquivo não permitido." };
  }

  if (!Number.isFinite(input.size) || input.size <= 0 || input.size > maxSizeBytes) {
    return { allowed: false, reason: "Arquivo excede o tamanho permitido." };
  }

  return { allowed: true };
}

export function isSafeRemoteUrl(value: string) {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) {
      return false;
    }

    const hostname = url.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname.endsWith(".local") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
