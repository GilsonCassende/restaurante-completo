"use server";

import { revalidatePath } from "next/cache";
import { ROLES } from "@/permissions";
import { requireRole } from "@/lib/session";
import {
  buildCheckoutSummary,
  createPayment,
  createRefund,
  exportFinanceData,
  exportPaymentsData,
  getFinanceDashboard,
  getPaymentsDashboard,
  listGatewayLogs,
  listInvoices,
  listPaymentMethods,
  listPayments,
  listRefunds,
  listTransactions,
  listWallets,
  listWebhookEvents,
  recordFinancialMovement,
  recordWebhookEvent,
  upsertPaymentMethod,
  upsertWallet,
} from "@/services/payments";
import {
  financialMovementSchema,
  financeFilterSchema,
  paymentCheckoutSchema,
  paymentFilterSchema,
  paymentMethodSchema,
  paymentSchema,
  refundSchema,
  walletSchema,
  webhookEventSchema,
  type FinanceFilterInput,
  type FinancialMovementInput,
  type PaymentCheckoutInput,
  type PaymentFilterInput,
  type InvoiceFilterInput,
  type PaymentMethodInput,
  type PaymentInput,
  type RefundInput,
  type WalletInput,
  type WebhookEventInput,
} from "@/schemas";

type PaymentActionResult<T> = { ok: true; data: T } | { ok: false; message: string };

const VIEW_ROLES = [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.STAFF] as const;
const EDIT_ROLES = [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER] as const;
const CHECKOUT_ROLES = VIEW_ROLES;

function getSignature(input: Partial<PaymentFilterInput>) {
  return JSON.stringify(input);
}

async function getViewContext() {
  return requireRole(VIEW_ROLES);
}

async function getEditContext() {
  return requireRole(EDIT_ROLES);
}

export async function getPaymentsDashboardAction(filters: Partial<PaymentFilterInput> = {}) {
  const user = await getViewContext();
  return getPaymentsDashboard(user.restaurantId, getSignature(filters));
}

export async function getFinanceDashboardAction(filters: Partial<PaymentFilterInput> = {}) {
  const user = await getViewContext();
  return getFinanceDashboard(user.restaurantId, getSignature(filters));
}

export async function listPaymentsAction(filters: Partial<PaymentFilterInput> = {}) {
  const user = await getViewContext();
  return listPayments(user.restaurantId, filters);
}

export async function listInvoicesAction(filters: Partial<InvoiceFilterInput> = {}) {
  const user = await getViewContext();
  return listInvoices(user.restaurantId, filters);
}

export async function listRefundsAction(filters: Partial<FinanceFilterInput> = {}) {
  const user = await getViewContext();
  return listRefunds(user.restaurantId, filters);
}

export async function listTransactionsAction(filters: Partial<FinanceFilterInput> = {}) {
  const user = await getViewContext();
  return listTransactions(user.restaurantId, filters);
}

export async function listWalletsAction() {
  const user = await getViewContext();
  return listWallets(user.restaurantId);
}

export async function listPaymentMethodsAction() {
  const user = await getViewContext();
  return listPaymentMethods(user.restaurantId);
}

export async function listGatewayLogsAction(filters: Partial<FinanceFilterInput> = {}) {
  const user = await getViewContext();
  return listGatewayLogs(user.restaurantId, filters);
}

export async function listWebhookEventsAction(filters: Partial<FinanceFilterInput> = {}) {
  const user = await getViewContext();
  return listWebhookEvents(user.restaurantId, filters);
}

export async function upsertPaymentMethodAction(input: PaymentMethodInput): Promise<PaymentActionResult<Awaited<ReturnType<typeof upsertPaymentMethod>>>> {
  const parsed = paymentMethodSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Método de pagamento inválido." };
  }

  const user = await getEditContext();
  const paymentMethod = await upsertPaymentMethod(user.restaurantId, parsed.data);
  revalidatePath("/dashboard/payments");
  revalidatePath("/dashboard/finance");
  return { ok: true, data: paymentMethod };
}

export async function createPaymentAction(input: PaymentInput): Promise<PaymentActionResult<Awaited<ReturnType<typeof createPayment>>>> {
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Pagamento inválido." };
  }

  const user = await requireRole(CHECKOUT_ROLES);
  const payment = await createPayment(user.restaurantId, parsed.data);
  revalidatePath("/dashboard/payments");
  revalidatePath("/dashboard/finance");
  return { ok: true, data: payment };
}

export async function createRefundAction(input: RefundInput): Promise<PaymentActionResult<Awaited<ReturnType<typeof createRefund>>>> {
  const parsed = refundSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Reembolso inválido." };
  }

  const user = await getEditContext();
  try {
    const refund = await createRefund(user.restaurantId, parsed.data);
    revalidatePath("/dashboard/payments");
    revalidatePath("/dashboard/finance");
    return { ok: true, data: refund };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Não foi possível criar o reembolso." };
  }
}

export async function recordWebhookEventAction(input: WebhookEventInput): Promise<PaymentActionResult<Awaited<ReturnType<typeof recordWebhookEvent>>>> {
  const parsed = webhookEventSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Webhook inválido." };
  }

  const user = await getEditContext();
  const event = await recordWebhookEvent(user.restaurantId, parsed.data);
  revalidatePath("/dashboard/payments");
  revalidatePath("/dashboard/finance");
  return { ok: true, data: event };
}

export async function recordFinancialMovementAction(input: FinancialMovementInput): Promise<PaymentActionResult<Awaited<ReturnType<typeof recordFinancialMovement>>>> {
  const parsed = financialMovementSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Movimentação inválida." };
  }

  const user = await getEditContext();
  const movement = await recordFinancialMovement(user.restaurantId, parsed.data);
  revalidatePath("/dashboard/payments");
  revalidatePath("/dashboard/finance");
  return { ok: true, data: movement };
}

export async function upsertWalletAction(input: WalletInput): Promise<PaymentActionResult<Awaited<ReturnType<typeof upsertWallet>>>> {
  const parsed = walletSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Carteira inválida." };
  }

  const user = await getEditContext();
  const wallet = await upsertWallet(user.restaurantId, parsed.data);
  revalidatePath("/dashboard/payments");
  revalidatePath("/dashboard/finance");
  return { ok: true, data: wallet };
}

export async function exportPaymentsAction(filters: Partial<PaymentFilterInput> & { format: "csv" | "xlsx" | "pdf" }) {
  const parsed = paymentFilterSchema.safeParse(filters);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Filtros inválidos." } as const;
  }

  const user = await getEditContext();
  const payload = await exportPaymentsData(user.restaurantId, getSignature(parsed.data), filters.format);
  return { ok: true, data: payload } as const;
}

export async function exportFinanceAction(filters: Partial<FinanceFilterInput> & { format: "csv" | "xlsx" | "pdf" }) {
  const parsed = financeFilterSchema.safeParse(filters);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Filtros inválidos." } as const;
  }

  const user = await getEditContext();
  const payload = await exportFinanceData(user.restaurantId, getSignature(parsed.data), filters.format);
  return { ok: true, data: payload } as const;
}

export async function buildCheckoutSummaryAction(input: PaymentCheckoutInput) {
  const parsed = paymentCheckoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Resumo inválido." } as const;
  }

  await getViewContext();
  return { ok: true, data: buildCheckoutSummary(parsed.data) } as const;
}
