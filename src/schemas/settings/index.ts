import { z } from "zod";

const optionalString = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}, z.string().optional().nullable());

const optionalUrl = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}, z.string().url().optional().nullable());

const optionalEmail = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}, z.string().email().optional().nullable());

const optionalNumber = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  if (typeof value === "number" && Number.isNaN(value)) return undefined;
  if (typeof value === "string") {
    const normalized = value.trim().replace(",", ".");
    if (!normalized) return undefined;
    const numeric = Number(normalized);
    return Number.isNaN(numeric) ? value : numeric;
  }
  return value;
}, z.number().optional().nullable());

const daySchema = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

const weeklyHourSchema = z.object({
  day: daySchema,
  open: z.string().optional().nullable(),
  close: z.string().optional().nullable(),
  closed: z.boolean().default(false),
});

const holidaySchema = z.object({
  date: z.string().min(1),
  label: z.string().min(1),
  closed: z.boolean().default(true),
});

export const restaurantSettingsSchema = z.object({
  name: z.string().min(2).max(120),
  slogan: optionalString,
  history: optionalString,
  mission: optionalString,
  description: optionalString,
  phone: optionalString,
  supportPhone: optionalString,
  whatsapp: optionalString,
  email: optionalEmail,
  website: optionalUrl,
  instagram: optionalUrl,
  facebook: optionalUrl,
  tiktok: optionalUrl,
  youtube: optionalUrl,
  linkedin: optionalUrl,
  country: optionalString,
  state: optionalString,
  city: optionalString,
  neighborhood: optionalString,
  street: optionalString,
  number: optionalString,
  postalCode: optionalString,
  latitude: optionalNumber,
  longitude: optionalNumber,
  openingHours: optionalString,
  timezone: optionalString,
  currency: optionalString,
  language: optionalString,
  seoTitle: optionalString,
  seoDescription: optionalString,
  seoKeywords: optionalString,
  ogImage: optionalUrl,
  twitterTitle: optionalString,
  twitterDescription: optionalString,
  twitterImage: optionalUrl,
  isOpen: z.boolean().default(true),
  minimumOrderAmount: optionalNumber,
  deliveryFee: optionalNumber,
  deliveryRadiusKm: optionalNumber,
  averagePreparationTime: optionalNumber,
  weeklyHours: z.array(weeklyHourSchema).length(7),
  holidays: z.array(holidaySchema),
  integrations: z.object({
    cloudinary: z.object({
      enabled: z.boolean().default(false),
      cloudName: z.string().optional().nullable(),
      uploadPreset: z.string().optional().nullable(),
    }),
    googleMaps: z.object({
      enabled: z.boolean().default(false),
      apiKey: z.string().optional().nullable(),
      placeId: z.string().optional().nullable(),
    }),
    googleAnalytics: z.object({
      enabled: z.boolean().default(false),
      measurementId: z.string().optional().nullable(),
    }),
    metaPixel: z.object({
      enabled: z.boolean().default(false),
      pixelId: z.string().optional().nullable(),
    }),
    whatsapp: z.object({
      enabled: z.boolean().default(false),
      phone: z.string().optional().nullable(),
    }),
  }),
});

export type RestaurantSettingsInput = z.infer<typeof restaurantSettingsSchema>;
export type RestaurantHolidayInput = z.infer<typeof holidaySchema>;
export type RestaurantWeeklyHourInput = z.infer<typeof weeklyHourSchema>;
