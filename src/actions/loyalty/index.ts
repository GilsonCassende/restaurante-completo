"use server";

import { revalidatePath } from "next/cache";
import { ROLES } from "@/permissions";
import { requireRole } from "@/lib/session";
import {
  addLoyaltyTransaction,
  getLoyaltyDashboard,
  listLoyaltyAccounts,
  saveLoyaltyRules,
  upsertLoyaltyAccount,
} from "@/services/loyalty";
import {
  loyaltyAccountSchema,
  loyaltyRulesSchema,
  loyaltyTransactionSchema,
  type LoyaltyAccountInput,
  type LoyaltyFilterInput,
  type LoyaltyRulesInput,
  type LoyaltyTransactionInput,
} from "@/schemas";

export type LoyaltyActionResult<T> = { ok: true; data: T } | { ok: false; message: string };

const DASHBOARD_PATH = "/dashboard/loyalty";
const DASHBOARD_ROLES = [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER] as const;

async function getContext() {
  return requireRole(DASHBOARD_ROLES);
}

export async function getLoyaltyDashboardAction() {
  const user = await getContext();
  return getLoyaltyDashboard(user.restaurantId);
}

export async function listLoyaltyAccountsAction(filters: Partial<LoyaltyFilterInput> = {}) {
  const user = await getContext();
  return listLoyaltyAccounts(user.restaurantId, filters);
}

export async function saveLoyaltyRulesAction(input: LoyaltyRulesInput): Promise<LoyaltyActionResult<unknown>> {
  const parsed = loyaltyRulesSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Regras inválidas." };
  }

  const user = await getContext();
  const data = await saveLoyaltyRules(user.restaurantId, parsed.data);
  revalidatePath(DASHBOARD_PATH);
  return { ok: true, data };
}

export async function upsertLoyaltyAccountAction(input: LoyaltyAccountInput): Promise<LoyaltyActionResult<unknown>> {
  const parsed = loyaltyAccountSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Conta inválida." };
  }

  const user = await getContext();
  const data = await upsertLoyaltyAccount(user.restaurantId, parsed.data);
  revalidatePath(DASHBOARD_PATH);
  return { ok: true, data };
}

export async function addLoyaltyTransactionAction(input: LoyaltyTransactionInput): Promise<LoyaltyActionResult<unknown>> {
  const parsed = loyaltyTransactionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Transação inválida." };
  }

  const user = await getContext();
  const data = await addLoyaltyTransaction(user.restaurantId, parsed.data);
  revalidatePath(DASHBOARD_PATH);
  return { ok: true, data };
}
