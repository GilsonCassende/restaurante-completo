import type { PaymentGatewayProvider, PaymentMethod, PaymentStatus, WebhookEventType } from "@/types";
import { makeFinanceId } from "./state";

export type GatewayTransactionInput = {
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  requestedStatus: PaymentStatus;
  reference?: string | null;
  metadata?: unknown | null;
};

export type GatewayRefundInput = {
  amount: number;
  currency: string;
  paymentReference: string;
  reason?: string | null;
  metadata?: unknown | null;
};

export type GatewayWebhookInput = {
  eventType: WebhookEventType;
  externalId?: string | null;
  payload?: unknown | null;
};

export type GatewayResult = {
  externalId: string;
  status: PaymentStatus;
  fee: number;
  netAmount: number;
  responseTimeMs: number;
  payload: Record<string, unknown>;
  response: Record<string, unknown>;
};

export type RefundGatewayResult = {
  externalId: string;
  payload: Record<string, unknown>;
  response: Record<string, unknown>;
  responseTimeMs: number;
};

export interface PaymentGatewayAdapter {
  provider: PaymentGatewayProvider;
  name: string;
  createPaymentIntent(input: GatewayTransactionInput): Promise<GatewayResult>;
  capturePayment?(input: GatewayTransactionInput): Promise<GatewayResult>;
  refundPayment(input: GatewayRefundInput): Promise<RefundGatewayResult>;
  parseWebhook?(input: GatewayWebhookInput): Promise<{ externalId: string; payload: Record<string, unknown> }>;
}

function getFeeRate(provider: PaymentGatewayProvider) {
  switch (provider) {
    case "STRIPE":
      return 0.029;
    case "MERCADO_PAGO":
      return 0.0349;
    case "PAYPAL":
      return 0.039;
    case "ASAAS":
      return 0.031;
    case "PAGAR_ME":
      return 0.035;
    case "YOOKASSA":
      return 0.0275;
    case "M_PESA":
      return 0.02;
    case "UNITEL_MONEY":
      return 0.02;
    default:
      return 0.03;
  }
}

function resolveStatus(provider: PaymentGatewayProvider, requestedStatus: PaymentStatus): PaymentStatus {
  if (requestedStatus !== "PAID") {
    return requestedStatus;
  }

  return provider === "PAYPAL" ? "AUTHORIZED" : "PAID";
}

function makeResult(provider: PaymentGatewayProvider, input: GatewayTransactionInput, action: string): GatewayResult {
  const fee = Number((input.amount * getFeeRate(provider)).toFixed(2));
  const status = resolveStatus(provider, input.requestedStatus);
  const reference = input.reference ?? makeFinanceId("gw");

  return {
    externalId: `${provider.toLowerCase()}_${reference}`,
    status,
    fee,
    netAmount: Math.max(input.amount - fee, 0),
    responseTimeMs: 120,
    payload: {
      action,
      amount: input.amount,
      currency: input.currency,
      paymentMethod: input.paymentMethod.code,
      reference,
      metadata: input.metadata ?? null,
    },
    response: {
      provider,
      approved: status === "PAID" || status === "AUTHORIZED",
      fee,
      netAmount: Math.max(input.amount - fee, 0),
      reference,
    },
  };
}

function makeRefundResult(provider: PaymentGatewayProvider, input: GatewayRefundInput): RefundGatewayResult {
  const reference = makeFinanceId("refund");
  return {
    externalId: `${provider.toLowerCase()}_${reference}`,
    payload: {
      provider,
      amount: input.amount,
      currency: input.currency,
      paymentReference: input.paymentReference,
      reason: input.reason ?? null,
      metadata: input.metadata ?? null,
    },
    response: {
      provider,
      accepted: true,
      reference,
    },
    responseTimeMs: 95,
  };
}

function createAdapter(provider: PaymentGatewayProvider, name: string): PaymentGatewayAdapter {
  return {
    provider,
    name,
    async createPaymentIntent(input) {
      return makeResult(provider, input, "create_payment_intent");
    },
    async capturePayment(input) {
      return makeResult(provider, { ...input, requestedStatus: "PAID" }, "capture_payment");
    },
    async refundPayment(input) {
      return makeRefundResult(provider, input);
    },
    async parseWebhook(input) {
      return {
        externalId: input.externalId ?? makeFinanceId("webhook"),
        payload: {
          provider,
          eventType: input.eventType,
          payload: input.payload ?? null,
        },
      };
    },
  };
}

const adapters: Record<PaymentGatewayProvider, PaymentGatewayAdapter> = {
  STRIPE: createAdapter("STRIPE", "Stripe"),
  MERCADO_PAGO: createAdapter("MERCADO_PAGO", "Mercado Pago"),
  PAYPAL: createAdapter("PAYPAL", "PayPal"),
  PAGAR_ME: createAdapter("PAGAR_ME", "Pagar.me"),
  ASAAS: createAdapter("ASAAS", "Asaas"),
  YOOKASSA: createAdapter("YOOKASSA", "Yookassa"),
  M_PESA: createAdapter("M_PESA", "M-Pesa"),
  UNITEL_MONEY: createAdapter("UNITEL_MONEY", "Unitel Money"),
};

export function getPaymentGatewayAdapter(provider: PaymentGatewayProvider): PaymentGatewayAdapter {
  return adapters[provider] ?? createAdapter(provider, provider);
}

export function listPaymentGatewayAdapters() {
  return Object.values(adapters);
}
