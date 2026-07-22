"use server";

import { ROLES } from "@/permissions";
import { requireRole } from "@/lib/session";
import { analyticsExportSchema, analyticsFilterSchema, type AnalyticsExportInput, type AnalyticsFilterInput } from "@/schemas";
import { buildAnalyticsExportPayload, getAnalyticsDashboard, normalizeAnalyticsRange } from "@/services/analytics";
import type { Role } from "@/types";

export type AnalyticsActionResult<T> = { ok: true; data: T } | { ok: false; message: string };

const VIEW_ROLES = [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.STAFF] as const;
const EXPORT_ROLES = [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER] as const;

async function getContext(allowedRoles: readonly Role[] = VIEW_ROLES) {
  return requireRole(allowedRoles);
}

export async function getAnalyticsDashboardAction(input: Partial<AnalyticsFilterInput> = {}) {
  const user = await getContext();
  const parsed = analyticsFilterSchema.safeParse(input);
  const filters = parsed.success ? parsed.data : analyticsFilterSchema.parse({});
  return getAnalyticsDashboard(user.restaurantId, JSON.stringify(filters));
}

export async function exportAnalyticsAction(input: AnalyticsExportInput): Promise<AnalyticsActionResult<{ filename: string; mimeType: string; base64: string }>> {
  const parsed = analyticsExportSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Exportação inválida." };
  }

  const user = await getContext(EXPORT_ROLES);
  const data = await buildAnalyticsExportPayload(user.restaurantId, JSON.stringify({ ...parsed.data, page: parsed.data.page ?? 1, perPage: parsed.data.perPage ?? 20 }), parsed.data.format);
  return { ok: true, data };
}

export async function getAnalyticsPeriodAction(input: Partial<AnalyticsFilterInput> = {}) {
  const user = await getContext();
  return normalizeAnalyticsRange(input, user.restaurant.timezone);
}
