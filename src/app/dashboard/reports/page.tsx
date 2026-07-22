import type { Metadata } from "next";
import { ROLES } from "@/permissions";
import { requireRole } from "@/lib/session";
import { getReportsDashboard } from "@/services/reports";
import { ReportsStudio } from "@/components/dashboard/reports";
import { reportFilterSchema, type ReportFilterInput } from "@/schemas";

export const metadata: Metadata = {
  title: "Reports",
  description: "Relatórios executivos e exportação consolidada.",
};

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const resolvedSearchParams = await searchParams;
  const user = await requireRole([ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.STAFF]);
  const parsed = reportFilterSchema.safeParse({
    period: resolvedSearchParams.period,
    report: resolvedSearchParams.report,
    startDate: typeof resolvedSearchParams.startDate === "string" ? resolvedSearchParams.startDate : undefined,
    endDate: typeof resolvedSearchParams.endDate === "string" ? resolvedSearchParams.endDate : undefined,
  });
  const filters: Partial<ReportFilterInput> = parsed.success ? parsed.data : reportFilterSchema.parse({});
  const dashboard = await getReportsDashboard(user.restaurantId, JSON.stringify(filters));

  return <ReportsStudio dashboard={dashboard} filters={filters} canExport={user.role !== ROLES.STAFF} />;
}
