"use server";

import { ROLES } from "@/permissions";
import { requireRole } from "@/lib/session";
import { reportExportSchema, reportFilterSchema, type ReportExportInput, type ReportFilterInput } from "@/schemas";
import { buildReportsExportPayload, getReportsDashboard } from "@/services/reports";
import type { Role } from "@/types";

export type ReportsActionResult<T> = { ok: true; data: T } | { ok: false; message: string };

const VIEW_ROLES = [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.STAFF] as const;
const EXPORT_ROLES = [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER] as const;

async function getContext(allowedRoles: readonly Role[] = VIEW_ROLES) {
  return requireRole(allowedRoles);
}

export async function getReportsDashboardAction(input: Partial<ReportFilterInput> = {}) {
  const user = await getContext();
  const parsed = reportFilterSchema.safeParse(input);
  const filters = parsed.success ? parsed.data : reportFilterSchema.parse({});
  return getReportsDashboard(user.restaurantId, JSON.stringify(filters));
}

export async function exportReportsAction(input: ReportExportInput): Promise<ReportsActionResult<{ filename: string; mimeType: string; base64: string }>> {
  const parsed = reportExportSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Exportação inválida." };
  }

  const user = await getContext(EXPORT_ROLES);
  const data = await buildReportsExportPayload(user.restaurantId, JSON.stringify({ ...parsed.data, page: parsed.data.page ?? 1, perPage: parsed.data.perPage ?? 20 }), parsed.data.format);
  return { ok: true, data };
}
