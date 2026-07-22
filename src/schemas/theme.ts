import { z } from "zod";

const assetField = z
  .string()
  .refine((value) => {
    if (!value) return true;
    return value.startsWith("data:") || /^https?:\/\//i.test(value);
  }, "Asset inválido")
  .optional()
  .nullable();
const colorField = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Cor inválida")
  .optional()
  .nullable();

export const restaurantThemeSchema = z.object({
  logo: assetField,
  favicon: assetField,
  banner: assetField,
  coverImage: assetField,
  primaryColor: colorField,
  secondaryColor: colorField,
  accentColor: colorField,
  backgroundColor: colorField,
  surfaceColor: colorField,
  textColor: colorField,
  successColor: colorField,
  warningColor: colorField,
  errorColor: colorField,
  fontFamily: z.string().min(1).optional().nullable(),
  borderRadius: z.string().min(1).optional().nullable(),
  buttonStyle: z.string().min(1).optional().nullable(),
  cardStyle: z.string().min(1).optional().nullable(),
  heroStyle: z.string().min(1).optional().nullable(),
  footerStyle: z.string().min(1).optional().nullable(),
  instagram: assetField,
  facebook: assetField,
  tiktok: assetField,
  youtube: assetField,
  linkedin: assetField,
  website: assetField,
  supportPhone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  openingHours: z.string().optional().nullable(),
  timezone: z.string().optional().nullable(),
  currency: z.string().min(3).max(3).optional().nullable(),
  language: z.string().min(2).max(8).optional().nullable(),
  country: z.string().min(2).max(2).optional().nullable(),
  city: z.string().optional().nullable(),
});

export type RestaurantThemeInput = z.infer<typeof restaurantThemeSchema>;
