export type SupportedLocale = "pt-BR" | "en-US" | "es-ES";

export type SupportedCurrency = "AOA" | "USD" | "EUR" | "BRL";

export type RuntimeConfig = {
  appName: string;
  appUrl: string;
  metadataBaseUrl: string;
  defaultLocale: SupportedLocale;
  defaultTimezone: string;
  defaultCurrency: SupportedCurrency;
  redisUrl: string | null;
  cdnUrl: string | null;
  edgeEnabled: boolean;
  statelessEnabled: boolean;
  stickySessionEnabled: boolean;
  workerEnabled: boolean;
};

export type EnterpriseFeatureFlags = Record<string, boolean>;

export type EnvironmentConfig = {
  nodeEnv: "development" | "test" | "production";
  databaseUrl?: string;
  mongodbDbName: string;
  authSecret?: string;
  authUrl?: string;
  appUrl?: string;
  appName: string;
  restaurantSlug?: string;
  defaultLocale: SupportedLocale;
  defaultTimezone: string;
  defaultCurrency: SupportedCurrency;
  redisUrl?: string;
  cdnUrl?: string;
  featureFlagsJson?: string;
  backupRetentionDays: number;
};

export type TenantRuntimeConfig = {
  tenantId: string;
  restaurantId?: string | null;
  locale?: SupportedLocale | null;
  timezone?: string | null;
  currency?: SupportedCurrency | null;
  featureFlags?: EnterpriseFeatureFlags;
  metadata?: Record<string, unknown> | null;
};

export type SecretEntry = {
  id: string;
  tenantId: string | null;
  name: string;
  value: string;
  maskedValue: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
};
