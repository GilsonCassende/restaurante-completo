import "server-only";

import { cache } from "react";
import { env } from "@/lib/env";
import { getCurrentRestaurant } from "@/lib/session";
import { findRestaurantById, findRestaurantBySlug, updateRestaurantBranding } from "@/prisma";
import { safeRevalidateTag, tenantCacheTag, withTenantCache } from "@/lib/production/cache";
import { resolveThemeTokens } from "@/lib/theme";
import type { Restaurant } from "@/types";
import type { RestaurantThemeInput } from "@/schemas";
import type { ThemeTokens } from "@/lib/theme";

const DEFAULT_PUBLIC_SLUG = env.NEXT_PUBLIC_RESTAURANT_SLUG ?? "demo-restaurant";

function sanitizeRestaurant(restaurant: Restaurant) {
  return restaurant;
}

export const getRestaurantThemeById = withTenantCache("theme", async (restaurantId: string): Promise<ThemeTokens | null> => {
  const restaurant = await findRestaurantById(restaurantId);
  if (!restaurant) return null;
  return resolveThemeTokens(sanitizeRestaurant(restaurant));
}, {
  tenantIndex: 0,
  keyPrefix: "restaurant-theme-id",
  revalidate: 300,
});

export const getRestaurantThemeBySlug = withTenantCache("theme", async (slug: string): Promise<ThemeTokens | null> => {
  const restaurant = await findRestaurantBySlug(slug);
  if (!restaurant) return null;
  return resolveThemeTokens(sanitizeRestaurant(restaurant));
}, {
  tenantIndex: 0,
  keyPrefix: "restaurant-theme-slug",
  revalidate: 300,
});

export const getCurrentRestaurantTheme = cache(async (): Promise<ThemeTokens | null> => {
  const restaurant = await getCurrentRestaurant();
  if (!restaurant) {
    return getPublicRestaurantTheme();
  }

  return resolveThemeTokens(sanitizeRestaurant(restaurant));
});

export const getPublicRestaurantTheme = cache(async (): Promise<ThemeTokens | null> => {
  return getRestaurantThemeBySlug(DEFAULT_PUBLIC_SLUG);
});

export async function getThemeForRestaurant(restaurant: Restaurant) {
  return resolveThemeTokens(restaurant);
}

export async function saveRestaurantTheme(restaurantId: string, input: RestaurantThemeInput) {
  const restaurant = await updateRestaurantBranding(restaurantId, input);
  if (!restaurant) return null;
  safeRevalidateTag(
    tenantCacheTag("theme", restaurantId),
    tenantCacheTag("theme", restaurant.slug),
    tenantCacheTag("landing", restaurant.slug),
    tenantCacheTag("analytics", restaurantId)
  );
  return resolveThemeTokens(restaurant);
}

export async function getThemeRestaurantForPreview(restaurantId?: string) {
  if (restaurantId) {
    const theme = await getRestaurantThemeById(restaurantId);
    if (theme) return theme;
  }

  return getCurrentRestaurantTheme();
}
