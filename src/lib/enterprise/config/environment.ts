import { z } from "zod";
import type { EnvironmentConfig, SupportedCurrency, SupportedLocale } from "./types";

const normalizeOptional = (value: unknown) => {
  if (value === "") return undefined;
  return value;
};

const localeSchema = z.enum(["pt-BR", "en-US", "es-ES"]).default("pt-BR");
const currencySchema = z.enum(["AOA", "USD", "EUR", "BRL"]).default("AOA");

export const enterpriseEnvironmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.preprocess(normalizeOptional, z.string().optional()),
  MONGODB_DB_NAME: z.string().default("restaurantpro"),
  AUTH_SECRET: z.preprocess(normalizeOptional, z.string().optional()),
  AUTH_URL: z.preprocess(normalizeOptional, z.string().url().optional()),
  NEXT_PUBLIC_APP_URL: z.preprocess(normalizeOptional, z.string().url().optional()),
  NEXT_PUBLIC_APP_NAME: z.string().default("RestaurantPro"),
  NEXT_PUBLIC_RESTAURANT_SLUG: z.preprocess(normalizeOptional, z.string().trim().optional()),
  NEXT_PUBLIC_DEFAULT_LOCALE: localeSchema,
  NEXT_PUBLIC_DEFAULT_TIMEZONE: z.string().default("Africa/Luanda"),
  NEXT_PUBLIC_DEFAULT_CURRENCY: currencySchema,
  REDIS_URL: z.preprocess(normalizeOptional, z.string().url().optional()),
  NEXT_PUBLIC_CDN_URL: z.preprocess(normalizeOptional, z.string().url().optional()),
  FEATURE_FLAGS_JSON: z.preprocess(normalizeOptional, z.string().optional()),
  BACKUP_RETENTION_DAYS: z.coerce.number().int().positive().default(7),
});

export function loadEnterpriseEnvironment(source: Record<string, unknown> = process.env): EnvironmentConfig {
  const parsed = enterpriseEnvironmentSchema.parse(source);

  return {
    nodeEnv: parsed.NODE_ENV,
    databaseUrl: parsed.DATABASE_URL,
    mongodbDbName: parsed.MONGODB_DB_NAME,
    authSecret: parsed.AUTH_SECRET,
    authUrl: parsed.AUTH_URL,
    appUrl: parsed.NEXT_PUBLIC_APP_URL,
    appName: parsed.NEXT_PUBLIC_APP_NAME,
    restaurantSlug: parsed.NEXT_PUBLIC_RESTAURANT_SLUG,
    defaultLocale: parsed.NEXT_PUBLIC_DEFAULT_LOCALE as SupportedLocale,
    defaultTimezone: parsed.NEXT_PUBLIC_DEFAULT_TIMEZONE,
    defaultCurrency: parsed.NEXT_PUBLIC_DEFAULT_CURRENCY as SupportedCurrency,
    redisUrl: parsed.REDIS_URL,
    cdnUrl: parsed.NEXT_PUBLIC_CDN_URL,
    featureFlagsJson: parsed.FEATURE_FLAGS_JSON,
    backupRetentionDays: parsed.BACKUP_RETENTION_DAYS,
  };
}

export const enterpriseEnvironment = loadEnterpriseEnvironment();
