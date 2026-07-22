"use server";

import { revalidatePath } from "next/cache";
import { ROLES } from "@/permissions";
import { requireRole } from "@/lib/session";
import { restaurantThemeSchema, type RestaurantThemeInput } from "@/schemas";
import { saveRestaurantTheme } from "@/services/theme";
import type { ThemeTokens } from "@/lib/theme";

const BRANDING_PATHS = [
  "/",
  "/menu",
  "/cart",
  "/checkout",
  "/app",
  "/dashboard",
  "/dashboard/categories",
  "/dashboard/products",
  "/dashboard/tables",
  "/dashboard/orders",
  "/dashboard/branding",
] as const;

export type BrandingActionState =
  | { ok: false; message: string; theme: null }
  | { ok: true; message: string; theme: ThemeTokens };

const INITIAL_STATE: BrandingActionState = {
  ok: false,
  message: "",
  theme: null,
};

function readField(formData: FormData, name: string) {
  const value = formData.get(name);
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function buildThemeInput(formData: FormData): RestaurantThemeInput {
  return {
    logo: readField(formData, "logo") ?? null,
    favicon: readField(formData, "favicon") ?? null,
    banner: readField(formData, "banner") ?? null,
    coverImage: readField(formData, "coverImage") ?? null,
    primaryColor: readField(formData, "primaryColor") ?? null,
    secondaryColor: readField(formData, "secondaryColor") ?? null,
    accentColor: readField(formData, "accentColor") ?? null,
    backgroundColor: readField(formData, "backgroundColor") ?? null,
    surfaceColor: readField(formData, "surfaceColor") ?? null,
    textColor: readField(formData, "textColor") ?? null,
    successColor: readField(formData, "successColor") ?? null,
    warningColor: readField(formData, "warningColor") ?? null,
    errorColor: readField(formData, "errorColor") ?? null,
    fontFamily: readField(formData, "fontFamily") ?? null,
    borderRadius: readField(formData, "borderRadius") ?? null,
    buttonStyle: readField(formData, "buttonStyle") ?? null,
    cardStyle: readField(formData, "cardStyle") ?? null,
    heroStyle: readField(formData, "heroStyle") ?? null,
    footerStyle: readField(formData, "footerStyle") ?? null,
    instagram: readField(formData, "instagram") ?? null,
    facebook: readField(formData, "facebook") ?? null,
    tiktok: readField(formData, "tiktok") ?? null,
    youtube: readField(formData, "youtube") ?? null,
    linkedin: readField(formData, "linkedin") ?? null,
    website: readField(formData, "website") ?? null,
    supportPhone: readField(formData, "supportPhone") ?? null,
    whatsapp: readField(formData, "whatsapp") ?? null,
    openingHours: readField(formData, "openingHours") ?? null,
    timezone: readField(formData, "timezone") ?? null,
    currency: readField(formData, "currency") ?? null,
    language: readField(formData, "language") ?? null,
    country: readField(formData, "country") ?? null,
    city: readField(formData, "city") ?? null,
  };
}

export async function saveRestaurantBrandingAction(
  _previousState: BrandingActionState = INITIAL_STATE,
  formData: FormData
): Promise<BrandingActionState> {
  void _previousState;
  const user = await requireRole([ROLES.SUPER_ADMIN, ROLES.OWNER]);

  const parsed = restaurantThemeSchema.safeParse(buildThemeInput(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Branding inválido.",
      theme: null,
    };
  }

  const theme = await saveRestaurantTheme(user.restaurantId, parsed.data);
  if (!theme) {
    return {
      ok: false,
      message: "Restaurante não encontrado.",
      theme: null,
    };
  }

  BRANDING_PATHS.forEach((pathname) => revalidatePath(pathname));

  return {
    ok: true,
    message: "Branding atualizado com sucesso.",
    theme,
  };
}
