"use server";

import { revalidatePath } from "next/cache";
import { ROLES } from "@/permissions";
import { requireRole } from "@/lib/session";
import {
  createCoupon,
  getCouponDashboard,
  listCoupons,
  recordCouponUsage,
  updateCoupon,
} from "@/services/coupons";
import {
  couponSchema,
  couponUsageSchema,
  type CouponFilterInput,
  type CouponInput,
  type CouponUsageInput,
} from "@/schemas";

export type CouponActionResult<T> = { ok: true; data: T } | { ok: false; message: string };

const DASHBOARD_PATH = "/dashboard/coupons";
const DASHBOARD_ROLES = [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER] as const;

async function getContext() {
  return requireRole(DASHBOARD_ROLES);
}

export async function getCouponDashboardAction() {
  const user = await getContext();
  return getCouponDashboard(user.restaurantId);
}

export async function listCouponsAction(filters: Partial<CouponFilterInput> = {}) {
  const user = await getContext();
  return listCoupons(user.restaurantId, filters);
}

export async function createCouponAction(input: CouponInput): Promise<CouponActionResult<unknown>> {
  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Cupom inválido." };
  }

  const user = await getContext();
  try {
    const data = await createCoupon(user.restaurantId, parsed.data);
    revalidatePath(DASHBOARD_PATH);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Não foi possível criar o cupom." };
  }
}

export async function updateCouponAction(input: CouponInput & { id: string }): Promise<CouponActionResult<unknown>> {
  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Cupom inválido." };
  }

  const user = await getContext();
  const data = await updateCoupon(user.restaurantId, input.id, parsed.data);
  if (!data) {
    return { ok: false, message: "Cupom não encontrado." };
  }
  revalidatePath(DASHBOARD_PATH);
  return { ok: true, data };
}

export async function recordCouponUsageAction(input: CouponUsageInput): Promise<CouponActionResult<unknown>> {
  const parsed = couponUsageSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Uso inválido." };
  }

  const user = await getContext();
  try {
    const data = await recordCouponUsage(user.restaurantId, parsed.data);
    revalidatePath(DASHBOARD_PATH);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Não foi possível registrar o uso do cupom." };
  }
}
