"use server";

import { revalidatePath } from "next/cache";
import { ROLES } from "@/permissions";
import { requireRole } from "@/lib/session";
import { restaurantSettingsSchema, type RestaurantSettingsInput } from "@/schemas";
import { saveRestaurantSettings } from "@/services/settings";

const SETTINGS_PATHS = [
  "/",
  "/menu",
  "/cart",
  "/checkout",
  "/app",
  "/dashboard",
  "/dashboard/settings",
  "/dashboard/branding",
] as const;

export type SettingsActionState =
  | { ok: false; message: string }
  | { ok: true; message: string };

const INITIAL_STATE: SettingsActionState = {
  ok: false,
  message: "",
};

function readText(formData: FormData, name: string) {
  const value = formData.get(name);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function readNumber(formData: FormData, name: string) {
  const value = readText(formData, name);
  if (value === undefined) return undefined;
  const normalized = value.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function readBoolean(formData: FormData, name: string) {
  return formData.get(name) === "true";
}

function readJson<T>(formData: FormData, name: string, fallback: T): T {
  const value = readText(formData, name);
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function buildSettingsInput(formData: FormData): RestaurantSettingsInput {
  return {
    name: readText(formData, "name") ?? "",
    slogan: readText(formData, "slogan") ?? null,
    history: readText(formData, "history") ?? null,
    mission: readText(formData, "mission") ?? null,
    description: readText(formData, "description") ?? null,
    phone: readText(formData, "phone") ?? null,
    supportPhone: readText(formData, "supportPhone") ?? null,
    whatsapp: readText(formData, "whatsapp") ?? null,
    email: readText(formData, "email") ?? null,
    website: readText(formData, "website") ?? null,
    instagram: readText(formData, "instagram") ?? null,
    facebook: readText(formData, "facebook") ?? null,
    tiktok: readText(formData, "tiktok") ?? null,
    youtube: readText(formData, "youtube") ?? null,
    linkedin: readText(formData, "linkedin") ?? null,
    country: readText(formData, "country") ?? null,
    state: readText(formData, "state") ?? null,
    city: readText(formData, "city") ?? null,
    neighborhood: readText(formData, "neighborhood") ?? null,
    street: readText(formData, "street") ?? null,
    number: readText(formData, "number") ?? null,
    postalCode: readText(formData, "postalCode") ?? null,
    latitude: readNumber(formData, "latitude") ?? null,
    longitude: readNumber(formData, "longitude") ?? null,
    openingHours: readText(formData, "openingHours") ?? null,
    timezone: readText(formData, "timezone") ?? null,
    currency: readText(formData, "currency") ?? null,
    language: readText(formData, "language") ?? null,
    seoTitle: readText(formData, "seoTitle") ?? null,
    seoDescription: readText(formData, "seoDescription") ?? null,
    seoKeywords: readText(formData, "seoKeywords") ?? null,
    ogImage: readText(formData, "ogImage") ?? null,
    twitterTitle: readText(formData, "twitterTitle") ?? null,
    twitterDescription: readText(formData, "twitterDescription") ?? null,
    twitterImage: readText(formData, "twitterImage") ?? null,
    isOpen: readBoolean(formData, "isOpen"),
    minimumOrderAmount: readNumber(formData, "minimumOrderAmount") ?? null,
    deliveryFee: readNumber(formData, "deliveryFee") ?? null,
    deliveryRadiusKm: readNumber(formData, "deliveryRadiusKm") ?? null,
    averagePreparationTime: readNumber(formData, "averagePreparationTime") ?? null,
    weeklyHours: readJson(formData, "weeklyHours", []),
    holidays: readJson(formData, "holidays", []),
    integrations: readJson(formData, "integrations", {
      cloudinary: { enabled: false, cloudName: "", uploadPreset: "" },
      googleMaps: { enabled: false, apiKey: "", placeId: "" },
      googleAnalytics: { enabled: false, measurementId: "" },
      metaPixel: { enabled: false, pixelId: "" },
      whatsapp: { enabled: false, phone: "" },
    }),
  };
}

export async function saveRestaurantSettingsAction(
  _previousState: SettingsActionState = INITIAL_STATE,
  formData: FormData
): Promise<SettingsActionState> {
  void _previousState;
  const user = await requireRole([ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER]);

  const parsed = restaurantSettingsSchema.safeParse(buildSettingsInput(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Configurações inválidas.",
    };
  }

  const restaurant = await saveRestaurantSettings(user.restaurantId, parsed.data);
  if (!restaurant) {
    return {
      ok: false,
      message: "Restaurante não encontrado.",
    };
  }

  SETTINGS_PATHS.forEach((pathname) => revalidatePath(pathname));

  return {
    ok: true,
    message: "Configurações salvas com sucesso.",
  };
}
