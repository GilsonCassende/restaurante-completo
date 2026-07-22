"use server";

import { revalidatePath } from "next/cache";
import { ROLES } from "@/permissions";
import { requireRole } from "@/lib/session";
import {
  getCashbackDashboard,
  listCashbackAccounts,
  recordCashbackTransaction,
  redeemCashback,
  saveCashbackPolicy,
  upsertCashbackAccount,
} from "@/services/cashback";
import {
  cashbackAccountSchema,
  cashbackTransactionSchema,
  type CashbackAccountInput,
  type CashbackFilterInput,
  type CashbackTransactionInput,
} from "@/schemas";

export type CashbackActionResult<T> = { ok: true; data: T } | { ok: false; message: string };

const DASHBOARD_PATH = "/dashboard/cashback";
const DASHBOARD_ROLES = [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER] as const;

async function getContext() {
  return requireRole(DASHBOARD_ROLES);
}

export async function getCashbackDashboardAction() {
  const user = await getContext();
  return getCashbackDashboard(user.restaurantId);
}

export async function listCashbackAccountsAction(filters: Partial<CashbackFilterInput> = {}) {
  const user = await getContext();
  return listCashbackAccounts(user.restaurantId, filters);
}

export async function saveCashbackPolicyAction(input: { percentage: number; minimumOrderAmount: number; expirationDays: number; active?: boolean }) {
  const user = await getContext();
  const data = await saveCashbackPolicy(user.restaurantId, input);
  revalidatePath(DASHBOARD_PATH);
  return { ok: true, data } as const;
}

export async function upsertCashbackAccountAction(input: CashbackAccountInput): Promise<CashbackActionResult<unknown>> {
  const parsed = cashbackAccountSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Conta inválida." };
  }

  const user = await getContext();
  const data = await upsertCashbackAccount(user.restaurantId, parsed.data);
  revalidatePath(DASHBOARD_PATH);
  return { ok: true, data };
}

export async function recordCashbackTransactionAction(input: CashbackTransactionInput): Promise<CashbackActionResult<unknown>> {
  const parsed = cashbackTransactionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Transação inválida." };
  }

  const user = await getContext();
  try {
    const data = await recordCashbackTransaction(user.restaurantId, parsed.data);
    revalidatePath(DASHBOARD_PATH);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Não foi possível registrar a transação." };
  }
}

export async function redeemCashbackAction(input: { customerId: string; amount: number; notes?: string }): Promise<CashbackActionResult<unknown>> {
  const user = await getContext();
  try {
    const data = await redeemCashback(user.restaurantId, input.customerId, input.amount, input.notes);
    revalidatePath(DASHBOARD_PATH);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Não foi possível resgatar o cashback." };
  }
}
