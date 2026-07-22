import type { Metadata } from "next";
import { ROLES } from "@/permissions";
import { requireRole } from "@/lib/session";
import { getAnalyticsDashboard } from "@/services/analytics";
import { AnalyticsStudio } from "@/components/dashboard/analytics";
import { analyticsFilterSchema, type AnalyticsFilterInput } from "@/schemas";

export const metadata: Metadata = {
  title: "Analytics",
  description: "BI estratégico, métricas e insights automáticos.",
};

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const resolvedSearchParams = await searchParams;
  const user = await requireRole([ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.STAFF]);
  const parsed = analyticsFilterSchema.safeParse({
    period: resolvedSearchParams.period,
    startDate: typeof resolvedSearchParams.startDate === "string" ? resolvedSearchParams.startDate : undefined,
    endDate: typeof resolvedSearchParams.endDate === "string" ? resolvedSearchParams.endDate : undefined,
  });
  const filters: Partial<AnalyticsFilterInput> = parsed.success ? parsed.data : analyticsFilterSchema.parse({});
  const dashboard = await getAnalyticsDashboard(user.restaurantId, JSON.stringify(filters));

  return <AnalyticsStudio dashboard={dashboard} filters={filters} canExport={user.role !== ROLES.STAFF} />;
}
