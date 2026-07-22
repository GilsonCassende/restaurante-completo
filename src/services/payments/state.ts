import { randomUUID } from "node:crypto";
import type { Customer, FinancialMovement, GatewayLog, Installment, Invoice, Payment, PaymentMethod, Refund, Transaction, Wallet, WebhookEvent } from "@/types";

export type FinanceState = {
  revision: number;
  paymentMethods: PaymentMethod[];
  payments: Payment[];
  transactions: Transaction[];
  refunds: Refund[];
  invoices: Invoice[];
  installments: Installment[];
  financialMovements: FinancialMovement[];
  wallets: Wallet[];
  gatewayLogs: GatewayLog[];
  webhookEvents: WebhookEvent[];
  customersSnapshot: Customer[];
};

const financeStores = new Map<string, FinanceState>();

function makeId(prefix: string) {
  return `${prefix}_${randomUUID().replace(/-/g, "")}`;
}

function now() {
  return new Date();
}

function makeDefaultPaymentMethods(restaurantId: string): PaymentMethod[] {
  const base = now();
  return [
    { id: makeId("pm"), restaurantId, code: "cash", name: "Dinheiro", type: "CASH", gatewayProvider: null, supportsInstallments: false, supportsPartial: true, active: true, metadata: null, createdAt: base, updatedAt: base },
    { id: makeId("pm"), restaurantId, code: "credit_card", name: "Cartão Crédito", type: "CREDIT_CARD", gatewayProvider: "STRIPE", supportsInstallments: true, supportsPartial: true, active: true, metadata: null, createdAt: base, updatedAt: base },
    { id: makeId("pm"), restaurantId, code: "debit_card", name: "Cartão Débito", type: "DEBIT_CARD", gatewayProvider: "STRIPE", supportsInstallments: false, supportsPartial: true, active: true, metadata: null, createdAt: base, updatedAt: base },
    { id: makeId("pm"), restaurantId, code: "pix", name: "PIX", type: "PIX", gatewayProvider: "MERCADO_PAGO", supportsInstallments: false, supportsPartial: true, active: true, metadata: null, createdAt: base, updatedAt: base },
    { id: makeId("pm"), restaurantId, code: "transfer", name: "Transferência", type: "TRANSFER", gatewayProvider: "PAYPAL", supportsInstallments: false, supportsPartial: true, active: true, metadata: null, createdAt: base, updatedAt: base },
    { id: makeId("pm"), restaurantId, code: "wallet", name: "Carteira Digital", type: "DIGITAL_WALLET", gatewayProvider: "PAYPAL", supportsInstallments: false, supportsPartial: true, active: true, metadata: null, createdAt: base, updatedAt: base },
    { id: makeId("pm"), restaurantId, code: "local", name: "Pagamento no Local", type: "IN_PERSON", gatewayProvider: null, supportsInstallments: false, supportsPartial: true, active: true, metadata: null, createdAt: base, updatedAt: base },
    { id: makeId("pm"), restaurantId, code: "qr_code", name: "QR Code", type: "QR_CODE", gatewayProvider: "MERCADO_PAGO", supportsInstallments: false, supportsPartial: true, active: true, metadata: null, createdAt: base, updatedAt: base },
    { id: makeId("pm"), restaurantId, code: "partial", name: "Pagamento Parcial", type: "PARTIAL", gatewayProvider: null, supportsInstallments: false, supportsPartial: true, active: true, metadata: null, createdAt: base, updatedAt: base },
    { id: makeId("pm"), restaurantId, code: "split", name: "Pagamento Dividido", type: "SPLIT", gatewayProvider: null, supportsInstallments: true, supportsPartial: true, active: true, metadata: null, createdAt: base, updatedAt: base },
  ];
}

function makeDefaultWallet(restaurantId: string): Wallet[] {
  const base = now();
  return [
    {
      id: makeId("wal"),
      restaurantId,
      name: "Caixa principal",
      currency: "AOA",
      balance: 0,
      reservedBalance: 0,
      provider: null,
      active: true,
      createdAt: base,
      updatedAt: base,
    },
  ];
}

export function getFinanceState(restaurantId: string): FinanceState {
  const current = financeStores.get(restaurantId);
  if (current) return current;

  const state: FinanceState = {
    revision: 1,
    paymentMethods: makeDefaultPaymentMethods(restaurantId),
    payments: [],
    transactions: [],
    refunds: [],
    invoices: [],
    installments: [],
    financialMovements: [],
    wallets: makeDefaultWallet(restaurantId),
    gatewayLogs: [],
    webhookEvents: [],
    customersSnapshot: [],
  };

  financeStores.set(restaurantId, state);
  return state;
}

export function touchFinanceState(restaurantId: string) {
  const state = getFinanceState(restaurantId);
  state.revision += 1;
  return state;
}

export function makeFinanceId(prefix: string) {
  return makeId(prefix);
}

export function financeRevision(restaurantId: string) {
  return getFinanceState(restaurantId).revision;
}
