import { z } from "zod";
import { idSchema, slugSchema } from "../common";

const optionalText = z.preprocess((value) => (value === "" ? undefined : value), z.string().max(250).optional());
const optionalLongText = z.preprocess((value) => (value === "" ? undefined : value), z.string().max(2000).optional());
const optionalDate = z.preprocess((value) => (value === "" ? undefined : value), z.coerce.date().optional());

export const subscriptionStatusValues = ["TRIALING", "ACTIVE", "PAST_DUE", "CANCELED", "EXPIRED", "SUSPENDED"] as const;
export const licenseStatusValues = ["ACTIVE", "EXPIRED", "REVOKED", "SUSPENDED"] as const;
export const invitationStatusValues = ["PENDING", "ACCEPTED", "EXPIRED", "CANCELED"] as const;
export const billingHistoryStatusValues = ["PENDING", "PAID", "FAILED", "REFUNDED", "VOID"] as const;
export const billingIntervalValues = ["MONTHLY", "YEARLY"] as const;

export const subscriptionStatusSchema = z.enum(subscriptionStatusValues);
export const licenseStatusSchema = z.enum(licenseStatusValues);
export const invitationStatusSchema = z.enum(invitationStatusValues);
export const billingHistoryStatusSchema = z.enum(billingHistoryStatusValues);
export const billingIntervalSchema = z.enum(billingIntervalValues);

export const planSchema = z.object({
  id: idSchema.optional(),
  code: z.string().min(2).max(50),
  name: z.string().min(2).max(120),
  description: optionalLongText.nullish(),
  billingInterval: billingIntervalSchema.default("MONTHLY"),
  monthlyPrice: z.coerce.number().min(0),
  yearlyPrice: z.coerce.number().min(0),
  trialDays: z.coerce.number().int().min(0).max(30),
  features: z.unknown().optional().nullable(),
  limits: z.record(z.number().min(0)).optional().nullable(),
  active: z.coerce.boolean().default(true),
});

export const organizationSchema = z.object({
  id: idSchema.optional(),
  restaurantId: idSchema,
  name: z.string().min(2).max(120),
  slug: slugSchema,
  billingEmail: z.string().email().optional().nullable(),
  ownerName: optionalText.nullish(),
  trialEndsAt: optionalDate.nullish(),
  currentRestaurantId: idSchema.optional().nullable(),
  active: z.coerce.boolean().default(true),
});

export const subscriptionSchema = z.object({
  id: idSchema.optional(),
  organizationId: idSchema,
  restaurantId: idSchema,
  planId: idSchema,
  status: subscriptionStatusSchema.default("TRIALING"),
  billingInterval: billingIntervalSchema.default("MONTHLY"),
  trialEndsAt: optionalDate.nullish(),
  currentPeriodStart: z.coerce.date(),
  currentPeriodEnd: z.coerce.date(),
  cancelAtPeriodEnd: z.coerce.boolean().default(false),
  seats: z.coerce.number().int().min(1).default(1),
  metadata: z.unknown().optional().nullable(),
});

export const licenseSchema = z.object({
  id: idSchema.optional(),
  organizationId: idSchema,
  restaurantId: idSchema,
  key: z.string().min(8).max(120),
  status: licenseStatusSchema.default("ACTIVE"),
  seats: z.coerce.number().int().min(1).default(1),
  activatedAt: optionalDate.nullish(),
  expiresAt: optionalDate.nullish(),
  revokedAt: optionalDate.nullish(),
  metadata: z.unknown().optional().nullable(),
});

export const restaurantMemberSchema = z.object({
  id: idSchema.optional(),
  organizationId: idSchema,
  restaurantId: idSchema,
  userId: idSchema.optional().nullable(),
  name: z.string().min(2).max(120),
  email: z.string().email(),
  role: z.enum(["SUPER_ADMIN", "OWNER", "MANAGER", "STAFF", "DRIVER"]),
  status: z.enum(["PENDING", "ACTIVE", "SUSPENDED", "INVITED"]).default("PENDING"),
  invitedByUserId: idSchema.optional().nullable(),
  joinedAt: optionalDate.nullish(),
});

export const invitationSchema = z.object({
  id: idSchema.optional(),
  organizationId: idSchema,
  restaurantId: idSchema,
  email: z.string().email(),
  role: z.enum(["SUPER_ADMIN", "OWNER", "MANAGER", "STAFF", "DRIVER"]),
  token: z.string().min(8).max(120).optional(),
  status: invitationStatusSchema.default("PENDING"),
  expiresAt: z.coerce.date().optional(),
  acceptedAt: optionalDate.nullish(),
  invitedByUserId: idSchema.optional().nullable(),
});

export const apiKeySchema = z.object({
  id: idSchema.optional(),
  organizationId: idSchema,
  restaurantId: idSchema,
  name: z.string().min(2).max(120),
  prefix: z.string().min(2).max(20),
  keyHash: z.string().min(8).max(120).optional(),
  scopes: z.array(z.string()).optional().nullable(),
  lastUsedAt: optionalDate.nullish(),
  expiresAt: optionalDate.nullish(),
  active: z.coerce.boolean().default(true),
});

export const usageSchema = z.object({
  id: idSchema.optional(),
  organizationId: idSchema,
  restaurantId: idSchema,
  metric: z.string().min(2).max(60),
  period: z.string().min(2).max(30),
  used: z.coerce.number().min(0),
  limit: z.coerce.number().min(0).optional().nullable(),
  resetAt: optionalDate.nullish(),
  metadata: z.unknown().optional().nullable(),
});

export const usageLimitSchema = z.object({
  id: idSchema.optional(),
  planId: idSchema,
  metric: z.string().min(2).max(60),
  limit: z.coerce.number().min(0),
  hardLimit: z.coerce.boolean().default(false),
  warningThreshold: z.coerce.number().min(0).default(0),
  active: z.coerce.boolean().default(true),
});

export const billingHistorySchema = z.object({
  id: idSchema.optional(),
  organizationId: idSchema,
  restaurantId: idSchema,
  subscriptionId: idSchema.optional().nullable(),
  invoiceNumber: z.string().min(3).max(60),
  status: billingHistoryStatusSchema.default("PENDING"),
  amount: z.coerce.number().min(0),
  currency: z.string().min(3).max(10),
  description: optionalLongText.nullish(),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  metadata: z.unknown().optional().nullable(),
});

export const adminSwitcherSchema = z.object({
  organizationId: idSchema,
});

export const subscriptionFiltersSchema = z.object({
  status: subscriptionStatusSchema.optional(),
  organizationId: idSchema.optional(),
});

export const planFiltersSchema = z.object({
  active: z.coerce.boolean().optional(),
});

export type PlanInput = z.infer<typeof planSchema>;
export type OrganizationInput = z.infer<typeof organizationSchema>;
export type SubscriptionInput = z.infer<typeof subscriptionSchema>;
export type LicenseInput = z.infer<typeof licenseSchema>;
export type RestaurantMemberInput = z.infer<typeof restaurantMemberSchema>;
export type InvitationInput = z.infer<typeof invitationSchema>;
export type ApiKeyInput = z.infer<typeof apiKeySchema>;
export type UsageInput = z.infer<typeof usageSchema>;
export type UsageLimitInput = z.infer<typeof usageLimitSchema>;
export type BillingHistoryInput = z.infer<typeof billingHistorySchema>;
export type AdminSwitcherInput = z.infer<typeof adminSwitcherSchema>;
export type SubscriptionFiltersInput = z.infer<typeof subscriptionFiltersSchema>;
export type PlanFiltersInput = z.infer<typeof planFiltersSchema>;

