import "server-only";

import { cache } from "react";
import { getCurrentRestaurant } from "@/lib/session";
import { findRestaurantById, findRestaurantBySlug, updateRestaurantSettings } from "@/prisma";
import { safeRevalidateTag, tenantCacheTag, withTenantCache } from "@/lib/production/cache";
import type { Restaurant, RestaurantHoliday, RestaurantIntegrations, RestaurantWeeklyHour } from "@/types";
import type { RestaurantSettingsInput } from "@/schemas";

const DEFAULT_WEEKLY_HOURS: RestaurantWeeklyHour[] = [
  { day: "monday", open: "12:00", close: "23:00", closed: false },
  { day: "tuesday", open: "12:00", close: "23:00", closed: false },
  { day: "wednesday", open: "12:00", close: "23:00", closed: false },
  { day: "thursday", open: "12:00", close: "23:00", closed: false },
  { day: "friday", open: "12:00", close: "23:30", closed: false },
  { day: "saturday", open: "12:00", close: "23:30", closed: false },
  { day: "sunday", open: "", close: "", closed: true },
];

const DEFAULT_HOLIDAYS: RestaurantHoliday[] = [];

function normalizeWeeklyHours(weeklyHours: Restaurant["weeklyHours"]): RestaurantWeeklyHour[] {
  if (!weeklyHours?.length) return DEFAULT_WEEKLY_HOURS;
  const byDay = new Map(weeklyHours.map((item) => [item.day, item]));
  return DEFAULT_WEEKLY_HOURS.map((item) => {
    const source = byDay.get(item.day);
    const open = source?.open?.trim() || item.open;
    const close = source?.close?.trim() || item.close;
    const normalized: RestaurantWeeklyHour = {
      day: item.day,
      open,
      close,
      closed: Boolean(source?.closed),
    };
    return normalized;
  });
}

function normalizeIntegrations(integrations: Restaurant["integrations"]): RestaurantIntegrations {
  const cloudName = integrations?.cloudinary?.cloudName?.trim() || "";
  const uploadPreset = integrations?.cloudinary?.uploadPreset?.trim() || "";
  const apiKey = integrations?.googleMaps?.apiKey?.trim() || "";
  const placeId = integrations?.googleMaps?.placeId?.trim() || "";
  const measurementId = integrations?.googleAnalytics?.measurementId?.trim() || "";
  const pixelId = integrations?.metaPixel?.pixelId?.trim() || "";
  const phone = integrations?.whatsapp?.phone?.trim() || "";

  const normalized: RestaurantIntegrations = {
    cloudinary: {
      enabled: Boolean(integrations?.cloudinary?.enabled),
      cloudName,
      uploadPreset,
    },
    googleMaps: {
      enabled: Boolean(integrations?.googleMaps?.enabled),
      apiKey,
      placeId,
    },
    googleAnalytics: {
      enabled: Boolean(integrations?.googleAnalytics?.enabled),
      measurementId,
    },
    metaPixel: {
      enabled: Boolean(integrations?.metaPixel?.enabled),
      pixelId,
    },
    whatsapp: {
      enabled: Boolean(integrations?.whatsapp?.enabled),
      phone,
    },
  };

  return normalized;
}

export function sanitizeRestaurantSettings(restaurant: Restaurant): Restaurant {
  return {
    ...restaurant,
    weeklyHours: normalizeWeeklyHours(restaurant.weeklyHours) as Restaurant["weeklyHours"],
    holidays: restaurant.holidays?.length ? restaurant.holidays : DEFAULT_HOLIDAYS,
    integrations: normalizeIntegrations(restaurant.integrations) as Restaurant["integrations"],
  };
}

export const getRestaurantSettingsById = withTenantCache("settings", async (restaurantId: string): Promise<Restaurant | null> => {
  const restaurant = await findRestaurantById(restaurantId);
  return restaurant ? sanitizeRestaurantSettings(restaurant) : null;
}, {
  tenantIndex: 0,
  keyPrefix: "restaurant-settings-id",
  revalidate: 300,
});

export const getRestaurantSettingsBySlug = withTenantCache("settings", async (slug: string): Promise<Restaurant | null> => {
  const restaurant = await findRestaurantBySlug(slug);
  return restaurant ? sanitizeRestaurantSettings(restaurant) : null;
}, {
  tenantIndex: 0,
  keyPrefix: "restaurant-settings-slug",
  revalidate: 300,
});

export const getCurrentRestaurantSettings = cache(async (): Promise<Restaurant | null> => {
  const restaurant = await getCurrentRestaurant();
  return restaurant ? sanitizeRestaurantSettings(restaurant) : null;
});

export async function saveRestaurantSettings(restaurantId: string, input: RestaurantSettingsInput): Promise<Restaurant | null> {
  const weeklyHours = input.weeklyHours.map((item) => ({
    day: item.day,
    open: item.open?.trim() || "00:00",
    close: item.close?.trim() || "00:00",
    closed: item.closed,
  }));

  const integrations: RestaurantIntegrations = {
    cloudinary: {
      enabled: input.integrations.cloudinary.enabled,
      cloudName: input.integrations.cloudinary.cloudName?.trim() || "",
      uploadPreset: input.integrations.cloudinary.uploadPreset?.trim() || "",
    },
    googleMaps: {
      enabled: input.integrations.googleMaps.enabled,
      apiKey: input.integrations.googleMaps.apiKey?.trim() || "",
      placeId: input.integrations.googleMaps.placeId?.trim() || "",
    },
    googleAnalytics: {
      enabled: input.integrations.googleAnalytics.enabled,
      measurementId: input.integrations.googleAnalytics.measurementId?.trim() || "",
    },
    metaPixel: {
      enabled: input.integrations.metaPixel.enabled,
      pixelId: input.integrations.metaPixel.pixelId?.trim() || "",
    },
    whatsapp: {
      enabled: input.integrations.whatsapp.enabled,
      phone: input.integrations.whatsapp.phone?.trim() || "",
    },
  };

  const address = [
    input.street,
    input.number,
    input.neighborhood,
    input.city,
    input.state,
    input.country,
    input.postalCode ? `CEP ${input.postalCode}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  const restaurant = await updateRestaurantSettings(restaurantId, {
    name: input.name,
    slogan: input.slogan ?? null,
    history: input.history ?? null,
    mission: input.mission ?? null,
    description: input.description ?? null,
    phone: input.phone ?? null,
    supportPhone: input.supportPhone ?? null,
    whatsapp: input.whatsapp ?? null,
    email: input.email ?? null,
    website: input.website ?? null,
    instagram: input.instagram ?? null,
    facebook: input.facebook ?? null,
    tiktok: input.tiktok ?? null,
    youtube: input.youtube ?? null,
    linkedin: input.linkedin ?? null,
    country: input.country ?? null,
    state: input.state ?? null,
    city: input.city ?? null,
    neighborhood: input.neighborhood ?? null,
    street: input.street ?? null,
    number: input.number ?? null,
    postalCode: input.postalCode ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    address: address || null,
    openingHours: input.openingHours ?? null,
    timezone: input.timezone ?? null,
    currency: input.currency ?? null,
    language: input.language ?? null,
    seoTitle: input.seoTitle ?? null,
    seoDescription: input.seoDescription ?? null,
    seoKeywords: input.seoKeywords ?? null,
    ogImage: input.ogImage ?? null,
    twitterTitle: input.twitterTitle ?? null,
    twitterDescription: input.twitterDescription ?? null,
    twitterImage: input.twitterImage ?? null,
    isOpen: input.isOpen,
    minimumOrderAmount: input.minimumOrderAmount ?? null,
    deliveryFee: input.deliveryFee ?? null,
    deliveryRadiusKm: input.deliveryRadiusKm ?? null,
    averagePreparationTime: input.averagePreparationTime ?? null,
    weeklyHours,
    holidays: input.holidays,
    integrations,
  });

  if (restaurant) {
    safeRevalidateTag(
      tenantCacheTag("settings", restaurantId),
      tenantCacheTag("theme", restaurantId),
      tenantCacheTag("landing", restaurant.slug),
      tenantCacheTag("analytics", restaurantId),
      tenantCacheTag("dashboard", restaurantId)
    );
  }

  return restaurant ? sanitizeRestaurantSettings(restaurant) : null;
}

export async function getSettingsRestaurantForPreview(restaurantId?: string): Promise<Restaurant | null> {
  if (restaurantId) {
    const restaurant = await getRestaurantSettingsById(restaurantId);
    if (restaurant) return restaurant;
  }
  return getCurrentRestaurantSettings();
}
