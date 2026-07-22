"use server";

import { revalidatePath } from "next/cache";
import { ROLES } from "@/permissions";
import { requireRole } from "@/lib/session";
import { planSchema, subscriptionSchema, type PlanInput, type SubscriptionInput } from "@/schemas";
import { getPlansDashboard, getSubscriptionDashboard, listPlans, listSubscriptions, upsertPlan, upsertSubscription } from "@/services/subscriptions";

export type SubscriptionActionResult<T> = { ok: true; data: T } | { ok: false; message: string };

const SUPER_ADMIN = [ROLES.SUPER_ADMIN] as const;
const SUBSCRIPTION_PATHS = ["/dashboard/admin", "/dashboard/subscriptions", "/dashboard/plans"] as const;

async function getContext() {
  return requireRole(SUPER_ADMIN);
}

export async function getSubscriptionDashboardAction() {
  await getContext();
  return getSubscriptionDashboard();
}

export async function getPlansDashboardAction() {
  await getContext();
  return getPlansDashboard();
}

export async function listPlansAction() {
  await getContext();
  return listPlans();
}

export async function listSubscriptionsAction() {
  await getContext();
  return listSubscriptions();
}

export async function savePlanAction(input: PlanInput): Promise<SubscriptionActionResult<Awaited<ReturnType<typeof upsertPlan>>>> {
  const parsed = planSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Plano inválido." };
  }

  await getContext();
  const plan = upsertPlan(parsed.data);
  SUBSCRIPTION_PATHS.forEach((pathname) => revalidatePath(pathname));
  return { ok: true, data: plan };
}

export async function saveSubscriptionAction(input: SubscriptionInput): Promise<SubscriptionActionResult<Awaited<ReturnType<typeof upsertSubscription>>>> {
  const parsed = subscriptionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Assinatura inválida." };
  }

  await getContext();
  const subscription = upsertSubscription(parsed.data);
  SUBSCRIPTION_PATHS.forEach((pathname) => revalidatePath(pathname));
  return { ok: true, data: subscription };
}

