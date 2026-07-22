import { z } from "zod";
import { idSchema, paginationSchema } from "../common";

export const loyaltyRewardTypeValues = ["DISCOUNT", "PRODUCT_FREE", "SHIPPING_FREE", "CASHBACK", "GIFT"] as const;
export const loyaltyTransactionTypeValues = ["EARN", "REDEEM", "EXPIRE", "ADJUST"] as const;

export const loyaltyRewardTypeSchema = z.enum(loyaltyRewardTypeValues);
export const loyaltyTransactionTypeSchema = z.enum(loyaltyTransactionTypeValues);

export const loyaltyRulesSchema = z.object({
  pointsPerCurrency: z.coerce.number().positive().default(1),
  currencyPerPoint: z.coerce.number().positive().default(100),
  pointsExpirationDays: z.coerce.number().int().positive().default(365),
});

export const loyaltyAccountSchema = z.object({
  customerId: idSchema,
  pointsBalance: z.coerce.number().int().default(0),
  pointsExpiryDays: z.coerce.number().int().positive().optional(),
  rewardTier: z.string().optional().nullable(),
  active: z.boolean().default(true),
});

export const loyaltyTransactionSchema = z.object({
  accountId: idSchema,
  customerId: idSchema,
  type: loyaltyTransactionTypeSchema,
  points: z.coerce.number().int(),
  orderId: idSchema.optional(),
  reservationId: idSchema.optional(),
  notes: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
});

export const loyaltyFilterSchema = paginationSchema.extend({
  search: z.string().optional().default(""),
});

export type LoyaltyRulesInput = z.infer<typeof loyaltyRulesSchema>;
export type LoyaltyAccountInput = z.infer<typeof loyaltyAccountSchema>;
export type LoyaltyTransactionInput = z.infer<typeof loyaltyTransactionSchema>;
export type LoyaltyFilterInput = z.infer<typeof loyaltyFilterSchema>;
