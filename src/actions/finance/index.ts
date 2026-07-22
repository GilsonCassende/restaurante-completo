"use server";

import { revalidatePath } from "next/cache";
import { ROLES } from "@/permissions";
import { requireRole } from "@/lib/session";
import {
  getFinanceDashboard,
  exportFinance,
  listFinancialMovements,
  listGatewayLogs,
  listTransactions,
  listWallets,
  listWebhookEvents,
  recordFinancialMovement,
  upsertWallet,
} from "@/services/finance";
import { financeFilterSchema, financialMovementSchema, walletSchema, type FinanceFilterInput, type FinancialMovementInput, type WalletInput } from "@/schemas";

type FinanceActionResult<T> = { ok: true; data: T } | { ok: false; message: string };

const VIEW_ROLES = [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.STAFF] as const;
const EDIT_ROLES = [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER] as const;

async function getViewContext() {
  return requireRole(VIEW_ROLES);
}

async function getEditContext() {
  return requireRole(EDIT_ROLES);
}

function getSignature(input: Partial<FinanceFilterInput>) {
  return JSON.stringify(input);
}

export async function getFinanceDashboardAction(filters: Partial<FinanceFilterInput> = {}) {
  const user = await getViewContext();
  return getFinanceDashboard(user.restaurantId, getSignature(filters));
}

export async function listFinancialMovementsAction(filters: Partial<FinanceFilterInput> = {}) {
  const user = await getViewContext();
  return listFinancialMovements(user.restaurantId, filters);
}

export async function listTransactionsAction(filters: Partial<FinanceFilterInput> = {}) {
  const user = await getViewContext();
  return listTransactions(user.restaurantId, filters);
}

export async function listWalletsAction() {
  const user = await getViewContext();
  return listWallets(user.restaurantId);
}

export async function listGatewayLogsAction(filters: Partial<FinanceFilterInput> = {}) {
  const user = await getViewContext();
  return listGatewayLogs(user.restaurantId, filters);
}

export async function listWebhookEventsAction(filters: Partial<FinanceFilterInput> = {}) {
  const user = await getViewContext();
  return listWebhookEvents(user.restaurantId, filters);
}

export async function upsertWalletAction(input: WalletInput): Promise<FinanceActionResult<Awaited<ReturnType<typeof upsertWallet>>>> {
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

export async function recordFinancialMovementAction(input: FinancialMovementInput): Promise<FinanceActionResult<Awaited<ReturnType<typeof recordFinancialMovement>>>> {
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

export async function exportFinanceAction(filters: Partial<FinanceFilterInput> & { format: "csv" | "xlsx" | "pdf" }) {
  const parsed = financeFilterSchema.safeParse(filters);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Filtros inválidos." } as const;
  }

  const user = await getEditContext();
  const payload = await exportFinance(user.restaurantId, getSignature(parsed.data), filters.format);
  return { ok: true, data: payload } as const;
}
