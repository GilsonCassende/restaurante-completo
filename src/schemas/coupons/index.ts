import { z } from "zod";
import { idSchema, paginationSchema } from "../common";

export const couponTypeValues = ["PERCENTAGE", "FIXED", "FREE_SHIPPING", "FIRST_PURCHASE", "BIRTHDAY", "SEGMENT", "PERIOD"] as const;
export const couponTypeSchema = z.enum(couponTypeValues);

export const couponSchema = z.object({
  code: z.string().min(2).max(40),
  name: z.string().min(2).max(120),
  type: couponTypeSchema,
  value: z.coerce.number().min(0),
  minimumOrderAmount: z.coerce.number().min(0).optional().nullable(),
  maxUses: z.coerce.number().int().positive().optional().nullable(),
  maxUsesPerCustomer: z.coerce.number().int().positive().optional().nullable(),
  startsAt: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
  stackable: z.boolean().default(false),
  active: z.boolean().default(true),
  segmentId: idSchema.optional().nullable(),
});

export const couponUsageSchema = z.object({
  couponId: idSchema,
  customerId: idSchema.optional(),
  orderId: idSchema.optional(),
  reservationId: idSchema.optional(),
  discountAmount: z.coerce.number().min(0),
});

export const couponFilterSchema = paginationSchema.extend({
  search: z.string().optional().default(""),
  type: couponTypeSchema.optional().or(z.literal("all")).default("all"),
});

export type CouponInput = z.infer<typeof couponSchema>;
export type CouponUsageInput = z.infer<typeof couponUsageSchema>;
export type CouponFilterInput = z.infer<typeof couponFilterSchema>;
