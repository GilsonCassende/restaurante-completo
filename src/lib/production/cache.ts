import { revalidatePath, revalidateTag, unstable_cache, unstable_cacheTag } from "next/cache";

export type TenantCacheScope =
  | "landing"
  | "dashboard"
  | "analytics"
  | "finance"
  | "crm"
  | "reservations"
  | "delivery"
  | "reports"
  | "settings"
  | "theme"
  | "payments"
  | "loyalty"
  | "coupons"
  | "cashback"
  | "admin";

const DEFAULT_REVALIDATE_SECONDS = 60;
const USE_CACHE_ENABLED = process.env.__NEXT_USE_CACHE === "1";

export function tenantCacheTag(scope: TenantCacheScope, tenantId: string) {
  return `${scope}:${tenantId}`;
}

export function cacheScopeTag(scope: TenantCacheScope) {
  return scope;
}

export function cacheRevisionTag(scope: TenantCacheScope, tenantId: string, revision: string | number) {
  return `${tenantCacheTag(scope, tenantId)}:rev:${revision}`;
}

export function tagTenantCache(scope: TenantCacheScope, tenantId: string, ...additionalTags: string[]) {
  if (USE_CACHE_ENABLED && typeof unstable_cacheTag === "function") {
    unstable_cacheTag(tenantCacheTag(scope, tenantId), cacheScopeTag(scope), ...additionalTags);
  }
}

export function createTenantCacheKey(scope: TenantCacheScope, tenantId: string, ...parts: Array<string | number | boolean | null | undefined>) {
  return [scope, tenantId, ...parts.map((part) => String(part ?? ""))];
}

export function safeRevalidateTag(...tags: string[]) {
  if (typeof revalidateTag !== "function") {
    return;
  }

  for (const tag of tags) {
    revalidateTag(tag);
  }
}

export function safeRevalidatePath(...paths: string[]) {
  if (typeof revalidatePath !== "function") {
    return;
  }

  for (const pathname of paths) {
    revalidatePath(pathname);
  }
}

export async function invalidateTenantCache(
  tenantId: string,
  scopes: TenantCacheScope[] = [],
  paths: string[] = []
) {
  const uniqueScopes = new Set(scopes);
  if (uniqueScopes.size === 0 && paths.length === 0) {
    return;
  }

  for (const scope of uniqueScopes) {
    safeRevalidateTag(tenantCacheTag(scope, tenantId), cacheScopeTag(scope));
  }

  safeRevalidatePath(...paths);
}

export async function invalidateTenantPathScope(pathname: string | string[]) {
  const paths = Array.isArray(pathname) ? pathname : [pathname];
  safeRevalidatePath(...paths);
}

export function withTenantCache<TArgs extends readonly unknown[], TResult>(
  scope: TenantCacheScope,
  fn: (...args: TArgs) => Promise<TResult>,
  options?: {
    tenantIndex?: number;
    keyPrefix?: string;
    revalidate?: number;
  }
) {
  const tenantIndex = options?.tenantIndex ?? 0;
  const keyPrefix = options?.keyPrefix ?? scope;
  const revalidate = options?.revalidate ?? DEFAULT_REVALIDATE_SECONDS;

  if (!USE_CACHE_ENABLED || typeof unstable_cache !== "function") {
    return (async (...fnArgs: TArgs) => fn(...fnArgs)) as (...args: TArgs) => Promise<TResult>;
  }

  return unstable_cache(
    async (...fnArgs: TArgs) => {
      const tenantId = String(fnArgs[tenantIndex] ?? "global");
      tagTenantCache(scope, tenantId);
      return fn(...fnArgs);
    },
    [keyPrefix],
    {
      revalidate,
    }
  ) as (...args: TArgs) => Promise<TResult>;
}
