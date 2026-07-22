import { z } from "zod";
import { idSchema, paginationSchema } from "../common";

const optionalString = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}, z.string().optional().nullable());

export const customerStatusValues = ["ACTIVE", "VIP", "INACTIVE", "BLOCKED"] as const;
export const customerStatusSchema = z.enum(customerStatusValues);

export const customerFilterSchema = paginationSchema.extend({
  search: z.string().optional().default(""),
  status: customerStatusSchema.optional().or(z.literal("all")).default("all"),
  segment: z.string().optional().default("all"),
});

export const updateCustomerSchema = z.object({
  id: idSchema,
  name: z.string().min(2).max(120),
  email: optionalString,
  phone: z.string().min(6).max(30),
  birthday: optionalString,
  city: optionalString,
  country: optionalString,
  status: customerStatusSchema.default("ACTIVE"),
  notes: optionalString,
  tags: z.array(z.string().min(1)).default([]),
});

export const customerProfileSchema = z.object({
  customerId: idSchema,
  notes: optionalString,
  occupation: optionalString,
  preferredLanguage: optionalString,
  marketingConsent: z.boolean().default(false),
});

export const customerAddressSchema = z.object({
  customerId: idSchema,
  label: z.string().min(1).max(80),
  street: optionalString,
  number: optionalString,
  neighborhood: optionalString,
  city: optionalString,
  state: optionalString,
  country: optionalString,
  postalCode: optionalString,
  complement: optionalString,
  isDefault: z.boolean().default(false),
  active: z.boolean().default(true),
});

export const customerPreferencesSchema = z.object({
  customerId: idSchema,
  favoriteCategories: z.array(z.string()).default([]),
  favoriteProducts: z.array(z.string()).default([]),
  dietaryRestrictions: z.array(z.string()).default([]),
  channels: z.array(z.enum(["WHATSAPP", "EMAIL", "SMS", "PUSH"])).default([]),
  whatsappOptIn: z.boolean().default(false),
  emailOptIn: z.boolean().default(false),
  smsOptIn: z.boolean().default(false),
  pushOptIn: z.boolean().default(false),
  birthdayOptIn: z.boolean().default(false),
  marketingOptIn: z.boolean().default(false),
});

export type CustomerFilterInput = z.infer<typeof customerFilterSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CustomerProfileInput = z.infer<typeof customerProfileSchema>;
export type CustomerAddressInput = z.infer<typeof customerAddressSchema>;
export type CustomerPreferencesInput = z.infer<typeof customerPreferencesSchema>;
