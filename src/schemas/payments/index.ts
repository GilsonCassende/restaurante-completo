import { z } from "zod";
import { idSchema, paginationSchema } from "../common";

const periodValues = ["today", "yesterday", "last_7_days", "last_30_days", "this_month", "last_month", "this_year", "custom"] as const;
const exportFormatValues = ["csv", "xlsx", "pdf"] as const;

export const paymentGatewayProviderValues = ["STRIPE", "MERCADO_PAGO", "PAYPAL", "PAGAR_ME", "ASAAS", "YOOKASSA", "M_PESA", "UNITEL_MONEY"] as const;
export const paymentMethodTypeValues = ["CASH", "CREDIT_CARD", "DEBIT_CARD", "PIX", "TRANSFER", "DIGITAL_WALLET", "IN_PERSON", "QR_CODE", "PARTIAL", "SPLIT"] as const;
export const paymentStatusValues = ["PENDING", "AUTHORIZED", "PAID", "FAILED", "CANCELED", "REFUNDED", "PARTIALLY_REFUNDED", "CHARGEBACK"] as const;
export const refundStatusValues = ["REQUESTED", "PROCESSING", "SUCCEEDED", "FAILED", "CANCELED"] as const;
export const invoiceStatusValues = ["PENDING", "PAID", "CANCELED", "REFUNDED", "OVERDUE"] as const;
export const installmentStatusValues = ["PENDING", "PAID", "CANCELED", "OVERDUE"] as const;
export const transactionStatusValues = ["PENDING", "SUCCESS", "FAILED", "RETRYING", "CANCELED"] as const;
export const paymentTransactionTypeValues = ["AUTHORIZE", "CAPTURE", "SETTLEMENT", "VOID", "REFUND", "CHARGEBACK", "ADJUSTMENT"] as const;
export const financialMovementTypeValues = ["REVENUE", "EXPENSE", "REFUND", "FEE", "TAX", "ADJUSTMENT", "TRANSFER_IN", "TRANSFER_OUT"] as const;
export const gatewayLogStatusValues = ["SUCCESS", "FAILED", "RETRYING", "PENDING"] as const;
export const webhookEventStatusValues = ["RECEIVED", "PROCESSED", "FAILED", "RETRYING"] as const;
export const webhookEventTypeValues = ["PAYMENT_APPROVED", "PAYMENT_REJECTED", "PAYMENT_PENDING", "CHARGEBACK", "REFUND", "CANCELLATION"] as const;

export const paymentGatewayProviderSchema = z.enum(paymentGatewayProviderValues);
export const paymentMethodTypeSchema = z.enum(paymentMethodTypeValues);
export const paymentStatusSchema = z.enum(paymentStatusValues);
export const refundStatusSchema = z.enum(refundStatusValues);
export const invoiceStatusSchema = z.enum(invoiceStatusValues);
export const installmentStatusSchema = z.enum(installmentStatusValues);
export const transactionStatusSchema = z.enum(transactionStatusValues);
export const paymentTransactionTypeSchema = z.enum(paymentTransactionTypeValues);
export const financialMovementTypeSchema = z.enum(financialMovementTypeValues);
export const gatewayLogStatusSchema = z.enum(gatewayLogStatusValues);
export const webhookEventStatusSchema = z.enum(webhookEventStatusValues);
export const webhookEventTypeSchema = z.enum(webhookEventTypeValues);
export const paymentExportFormatSchema = z.enum(exportFormatValues);
export const paymentPeriodSchema = z.enum(periodValues);

const dateInputSchema = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}, z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Informe uma data válida.").optional().nullable());

const moneySchema = z.coerce.number().min(0).default(0);

export const paymentMethodSchema = z.object({
  code: z.string().min(2).max(60),
  name: z.string().min(2).max(120),
  type: paymentMethodTypeSchema,
  gatewayProvider: paymentGatewayProviderSchema.optional().nullable(),
  supportsInstallments: z.boolean().default(false),
  supportsPartial: z.boolean().default(false),
  active: z.boolean().default(true),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
});

export const paymentCheckoutSchema = z.object({
  orderId: idSchema.optional().nullable(),
  customerId: idSchema.optional().nullable(),
  paymentMethodId: idSchema,
  gatewayProvider: paymentGatewayProviderSchema,
  subtotal: moneySchema,
  tax: moneySchema,
  discount: moneySchema,
  couponCode: z.string().min(1).max(40).optional().nullable(),
  couponDiscount: moneySchema,
  cashbackDiscount: moneySchema,
  deliveryFee: moneySchema,
  serviceFee: moneySchema,
  tip: moneySchema,
  paidAmount: moneySchema.optional(),
  changeAmount: moneySchema.optional(),
  currency: z.string().min(2).max(8).default("AOA"),
  status: paymentStatusSchema.default("PAID"),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
});

export const paymentSchema = paymentCheckoutSchema.extend({
  invoiceId: idSchema.optional().nullable(),
  reference: z.string().min(2).max(120).optional().nullable(),
  gatewayReference: z.string().min(2).max(120).optional().nullable(),
  paidAt: dateInputSchema,
});

export const transactionSchema = z.object({
  paymentId: idSchema,
  gatewayProvider: paymentGatewayProviderSchema,
  type: paymentTransactionTypeSchema,
  status: transactionStatusSchema.default("SUCCESS"),
  amount: moneySchema,
  fee: moneySchema.default(0),
  netAmount: moneySchema,
  currency: z.string().min(2).max(8).default("AOA"),
  externalId: z.string().min(2).max(120).optional().nullable(),
  reference: z.string().min(2).max(120).optional().nullable(),
  responseTimeMs: z.coerce.number().int().min(0).default(0),
  retryCount: z.coerce.number().int().min(0).default(0),
  payload: z.record(z.string(), z.any()).optional().nullable(),
  response: z.record(z.string(), z.any()).optional().nullable(),
  errorCode: z.string().max(80).optional().nullable(),
  errorMessage: z.string().max(500).optional().nullable(),
});

export const refundSchema = z.object({
  paymentId: idSchema,
  transactionId: idSchema.optional().nullable(),
  gatewayProvider: paymentGatewayProviderSchema,
  type: z.enum(["TOTAL", "PARTIAL", "AUTOMATIC", "MANUAL"]),
  status: refundStatusSchema.default("REQUESTED"),
  amount: moneySchema,
  reason: z.string().min(2).max(240).optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
});

export const invoiceSchema = z.object({
  orderId: idSchema.optional().nullable(),
  paymentId: idSchema.optional().nullable(),
  customerId: idSchema.optional().nullable(),
  number: z.string().min(3).max(40).optional().nullable(),
  status: invoiceStatusSchema.default("PENDING"),
  subtotal: moneySchema,
  tax: moneySchema,
  discount: moneySchema,
  total: moneySchema,
  pdfUrl: z.string().url().optional().nullable(),
  emailedAt: dateInputSchema,
  metadata: z.record(z.string(), z.any()).optional().nullable(),
});

export const installmentSchema = z.object({
  paymentId: idSchema,
  number: z.coerce.number().int().positive(),
  total: z.coerce.number().int().positive(),
  amount: moneySchema,
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida."),
  paidAt: dateInputSchema,
  status: installmentStatusSchema.default("PENDING"),
  gatewayReference: z.string().min(2).max(120).optional().nullable(),
});

export const walletSchema = z.object({
  name: z.string().min(2).max(120),
  currency: z.string().min(2).max(8).default("AOA"),
  balance: z.coerce.number().default(0),
  reservedBalance: z.coerce.number().default(0),
  provider: paymentGatewayProviderSchema.optional().nullable(),
  active: z.boolean().default(true),
});

export const financialMovementSchema = z.object({
  walletId: idSchema.optional().nullable(),
  paymentId: idSchema.optional().nullable(),
  invoiceId: idSchema.optional().nullable(),
  refundId: idSchema.optional().nullable(),
  type: financialMovementTypeSchema,
  category: z.string().min(2).max(120),
  amount: moneySchema,
  balanceAfter: moneySchema,
  costCenter: z.string().min(2).max(120).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
});

export const gatewayLogSchema = z.object({
  gatewayProvider: paymentGatewayProviderSchema,
  action: z.string().min(2).max(120),
  status: gatewayLogStatusSchema.default("SUCCESS"),
  payload: z.record(z.string(), z.any()).optional().nullable(),
  response: z.record(z.string(), z.any()).optional().nullable(),
  durationMs: z.coerce.number().int().min(0).default(0),
  error: z.string().max(500).optional().nullable(),
  retryCount: z.coerce.number().int().min(0).default(0),
});

export const webhookEventSchema = z.object({
  gatewayProvider: paymentGatewayProviderSchema,
  eventType: webhookEventTypeSchema,
  externalId: z.string().min(2).max(120).optional().nullable(),
  status: webhookEventStatusSchema.default("RECEIVED"),
  payload: z.record(z.string(), z.any()).optional().nullable(),
  processedAt: dateInputSchema,
  error: z.string().max(500).optional().nullable(),
  attempts: z.coerce.number().int().min(0).default(0),
  retryAt: dateInputSchema,
});

export const paymentFilterSchema = paginationSchema.extend({
  period: paymentPeriodSchema.default("last_30_days"),
  startDate: dateInputSchema,
  endDate: dateInputSchema,
  status: paymentStatusSchema.optional().or(z.literal("all")).default("all"),
  gatewayProvider: paymentGatewayProviderSchema.optional().or(z.literal("all")).default("all"),
  methodType: paymentMethodTypeSchema.optional().or(z.literal("all")).default("all"),
  search: z.string().optional().default(""),
});

export const invoiceFilterSchema = paginationSchema.extend({
  period: paymentPeriodSchema.default("last_30_days"),
  startDate: dateInputSchema,
  endDate: dateInputSchema,
  status: invoiceStatusSchema.optional().or(z.literal("all")).default("all"),
  search: z.string().optional().default(""),
});

export const financeFilterSchema = paginationSchema.extend({
  period: paymentPeriodSchema.default("last_30_days"),
  startDate: dateInputSchema,
  endDate: dateInputSchema,
  movementType: financialMovementTypeSchema.optional().or(z.literal("all")).default("all"),
  costCenter: z.string().optional().default(""),
  search: z.string().optional().default(""),
});

export type PaymentMethodInput = z.infer<typeof paymentMethodSchema>;
export type PaymentCheckoutInput = z.infer<typeof paymentCheckoutSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type RefundInput = z.infer<typeof refundSchema>;
export type InvoiceInput = z.infer<typeof invoiceSchema>;
export type InstallmentInput = z.infer<typeof installmentSchema>;
export type WalletInput = z.infer<typeof walletSchema>;
export type FinancialMovementInput = z.infer<typeof financialMovementSchema>;
export type GatewayLogInput = z.infer<typeof gatewayLogSchema>;
export type WebhookEventInput = z.infer<typeof webhookEventSchema>;
export type PaymentFilterInput = z.infer<typeof paymentFilterSchema>;
export type InvoiceFilterInput = z.infer<typeof invoiceFilterSchema>;
export type FinanceFilterInput = z.infer<typeof financeFilterSchema>;
export type PaymentExportFormat = z.infer<typeof paymentExportFormatSchema>;
