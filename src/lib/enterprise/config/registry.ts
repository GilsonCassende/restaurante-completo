import { randomUUID } from "node:crypto";
import { enterpriseEnvironment } from "./environment";
import type { EnterpriseFeatureFlags, RuntimeConfig, SecretEntry, TenantRuntimeConfig } from "./types";

type ConfigStore = {
  tenants: Map<string, TenantRuntimeConfig>;
  users: Map<string, TenantRuntimeConfig>;
  secrets: Map<string, SecretEntry>;
  flags: EnterpriseFeatureFlags;
};

const store: ConfigStore = {
  tenants: new Map(),
  users: new Map(),
  secrets: new Map(),
  flags: parseFeatureFlags(enterpriseEnvironment.featureFlagsJson),
};

function now() {
  return new Date();
}

function parseFeatureFlags(source?: string) {
  if (!source) return {};
  try {
    const parsed = JSON.parse(source);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).map(([key, value]) => [key, Boolean(value)])
    );
  } catch {
    return {};
  }
}

export function getRuntimeConfig(): RuntimeConfig {
  const appUrl = enterpriseEnvironment.appUrl ?? "https://restaurantpro.local";
  return {
    appName: enterpriseEnvironment.appName,
    appUrl,
    metadataBaseUrl: appUrl,
    defaultLocale: enterpriseEnvironment.defaultLocale,
    defaultTimezone: enterpriseEnvironment.defaultTimezone,
    defaultCurrency: enterpriseEnvironment.defaultCurrency,
    redisUrl: enterpriseEnvironment.redisUrl ?? null,
    cdnUrl: enterpriseEnvironment.cdnUrl ?? null,
    edgeEnabled: process.env.NEXT_RUNTIME === "edge" || process.env.VERCEL_EDGE_FUNCTIONS === "1",
    statelessEnabled: true,
    stickySessionEnabled: true,
    workerEnabled: true,
  };
}

export function getFeatureFlags() {
  return { ...store.flags };
}

export function setFeatureFlags(flags: EnterpriseFeatureFlags) {
  store.flags = { ...flags };
  return getFeatureFlags();
}

export function isFeatureEnabled(flag: string, fallback = false) {
  return store.flags[flag] ?? fallback;
}

export function setTenantRuntimeConfig(config: TenantRuntimeConfig) {
  store.tenants.set(config.tenantId, config);
  return config;
}

export function getTenantRuntimeConfig(tenantId: string) {
  return store.tenants.get(tenantId) ?? null;
}

export function listTenantRuntimeConfigs() {
  return Array.from(store.tenants.values());
}

export function setUserRuntimeConfig(userId: string, config: TenantRuntimeConfig) {
  store.users.set(userId, config);
  return config;
}

export function getUserRuntimeConfig(userId: string) {
  return store.users.get(userId) ?? null;
}

export function resolveRuntimeConfig(tenantId?: string, userId?: string): RuntimeConfig & {
  tenant?: TenantRuntimeConfig | null;
  user?: TenantRuntimeConfig | null;
} {
  return {
    ...getRuntimeConfig(),
    tenant: tenantId ? getTenantRuntimeConfig(tenantId) : null,
    user: userId ? getUserRuntimeConfig(userId) : null,
  };
}

function maskSecret(value: string) {
  if (value.length <= 8) {
    return `${value.slice(0, 2)}***`;
  }
  return `${value.slice(0, 4)}***${value.slice(-4)}`;
}

export function registerSecret(
  input: Omit<SecretEntry, "id" | "maskedValue" | "createdAt" | "updatedAt"> & { id?: string; createdAt?: Date; updatedAt?: Date }
) {
  const secret: SecretEntry = {
    ...input,
    id: input.id ?? randomUUID(),
    maskedValue: maskSecret(input.value),
    createdAt: input.createdAt ?? now(),
    updatedAt: input.updatedAt ?? now(),
  };
  store.secrets.set([secret.tenantId ?? "global", secret.name].join(":"), secret);
  return secret;
}

export function getSecret(tenantId: string | null, name: string) {
  return store.secrets.get([tenantId ?? "global", name].join(":")) ?? null;
}

export function listSecrets(tenantId?: string | null) {
  return Array.from(store.secrets.values()).filter((secret) => !tenantId || secret.tenantId === tenantId);
}

export function getGlobalConfig() {
  const runtime = getRuntimeConfig();
  return {
    runtime,
    flags: getFeatureFlags(),
    environment: enterpriseEnvironment,
    secretsCount: store.secrets.size,
    tenantsCount: store.tenants.size,
  };
}
