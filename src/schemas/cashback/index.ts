import { z } from "zod";
import { idSchema, paginationSchema } from "../common";

export const cashbackTransactionTypeValues = ["CREDIT", "DEBIT", "EXPIRE", "REDEEM", "REFUND"] as const;
export const cashbackTransactionTypeSchema = z.enum(cashbackTransactionTypeValues);

export const cashbackAccountSchema = z.object({
  customerId: idSchema,
  balance: z.coerce.number().min(0).default(0),
  expiresAt: z.string().optional().nullable(),
  active: z.boolean().default(true),
});

export const cashbackTransactionSchema = z.object({
  accountId: idSchema,
  customerId: idSchema,
  type: cashbackTransactionTypeSchema,
  amount: z.coerce.number().min(0),
  orderId: idSchema.optional(),
  reservationId: idSchema.optional(),
  notes: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
});

export const cashbackFilterSchema = paginationSchema.extend({
  search: z.string().optional().default(""),
});

export type CashbackAccountInput = z.infer<typeof cashbackAccountSchema>;
export type CashbackTransactionInput = z.infer<typeof cashbackTransactionSchema>;
export type CashbackFilterInput = z.infer<typeof cashbackFilterSchema>;
