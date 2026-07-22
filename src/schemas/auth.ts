import { z } from "zod";
import { ROLES } from "@/permissions";

export const loginSchema = z.object({
  email: z.string().email("Informe um e-mail válido."),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
});

export const userBaseSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(255),
  image: z.string().url().optional().nullable(),
  role: z.enum([ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.STAFF]),
  active: z.boolean().default(true),
});

export const createUserSchema = userBaseSchema.extend({
  restaurantId: z.string().min(1),
});

export const createRestaurantSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug inválido"),
  logo: z.string().url().optional().nullable(),
  favicon: z.string().url().optional().nullable(),
  banner: z.string().url().optional().nullable(),
  coverImage: z.string().url().optional().nullable(),
  primaryColor: z.string().optional().nullable(),
  secondaryColor: z.string().optional().nullable(),
  accentColor: z.string().optional().nullable(),
  backgroundColor: z.string().optional().nullable(),
  surfaceColor: z.string().optional().nullable(),
  textColor: z.string().optional().nullable(),
  successColor: z.string().optional().nullable(),
  warningColor: z.string().optional().nullable(),
  errorColor: z.string().optional().nullable(),
  fontFamily: z.string().optional().nullable(),
  borderRadius: z.string().optional().nullable(),
  buttonStyle: z.string().optional().nullable(),
  cardStyle: z.string().optional().nullable(),
  heroStyle: z.string().optional().nullable(),
  footerStyle: z.string().optional().nullable(),
  instagram: z.string().url().optional().nullable(),
  facebook: z.string().url().optional().nullable(),
  tiktok: z.string().url().optional().nullable(),
  youtube: z.string().url().optional().nullable(),
  linkedin: z.string().url().optional().nullable(),
  website: z.string().url().optional().nullable(),
  phone: z.string().optional().nullable(),
  supportPhone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
  slogan: z.string().optional().nullable(),
  history: z.string().optional().nullable(),
  mission: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  neighborhood: z.string().optional().nullable(),
  street: z.string().optional().nullable(),
  number: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  openingHours: z.string().optional().nullable(),
  timezone: z.string().optional().nullable(),
  currency: z.string().optional().nullable(),
  language: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  weeklyHours: z.array(z.any()).optional().nullable(),
  holidays: z.array(z.any()).optional().nullable(),
  isOpen: z.boolean().optional().nullable(),
  minimumOrderAmount: z.coerce.number().optional().nullable(),
  deliveryFee: z.coerce.number().optional().nullable(),
  deliveryRadiusKm: z.coerce.number().int().optional().nullable(),
  averagePreparationTime: z.coerce.number().int().optional().nullable(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  seoKeywords: z.string().optional().nullable(),
  ogImage: z.string().url().optional().nullable(),
  twitterTitle: z.string().optional().nullable(),
  twitterDescription: z.string().optional().nullable(),
  twitterImage: z.string().url().optional().nullable(),
  integrations: z.any().optional().nullable(),
  subscriptionPlan: z.string().min(1),
  active: z.boolean().default(true),
});
