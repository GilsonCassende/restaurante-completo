import { z } from "zod";

const normalizeOptional = (value: unknown) => {
  if (value === "") return undefined;
  return value;
};

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.preprocess(normalizeOptional, z.string().optional()),
  MONGODB_DB_NAME: z.string().default("restaurantpro"),
  AUTH_SECRET: z.preprocess(normalizeOptional, z.string().optional()),
  AUTH_URL: z.preprocess(normalizeOptional, z.string().url().optional()),
  NEXT_PUBLIC_APP_URL: z.preprocess(normalizeOptional, z.string().url().optional()),
  NEXT_PUBLIC_APP_NAME: z.string().default("RestaurantPro"),
  NEXT_PUBLIC_RESTAURANT_SLUG: z.preprocess(normalizeOptional, z.string().trim().optional()),
});

const parsed = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
  AUTH_SECRET: process.env.AUTH_SECRET,
  AUTH_URL: process.env.AUTH_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_RESTAURANT_SLUG: process.env.NEXT_PUBLIC_RESTAURANT_SLUG,
});

export const env = {
  ...parsed,
  AUTH_SECRET:
    parsed.AUTH_SECRET ??
    (parsed.NODE_ENV === "production" ? undefined : "restaurantpro-dev-secret"),
} as const;

const isProductionBuild = process.env.NEXT_PHASE === "phase-production-build";

if (parsed.NODE_ENV === "production" && !env.AUTH_SECRET && !isProductionBuild) {
  throw new Error("AUTH_SECRET is required in production.");
}
