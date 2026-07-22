import type { Metadata } from "next";
import { ROLES } from "@/permissions";
import { requireRole } from "@/lib/session";
import { getFinanceDashboard } from "@/services/finance";
import { FinanceStudio } from "@/components/dashboard/finance";
import { financeFilterSchema, type FinanceFilterInput } from "@/schemas";

export const metadata: Metadata = {
  title: "Finance",
  description: "Fluxo de caixa, lucro, saldo e centro de custos.",
};

export default async function FinancePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const resolvedSearchParams = await searchParams;
  const user = await requireRole([ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.STAFF]);
  const parsed = financeFilterSchema.safeParse({
    period: resolvedSearchParams.period,
    startDate: typeof resolvedSearchParams.startDate === "string" ? resolvedSearchParams.startDate : undefined,
    endDate: typeof resolvedSearchParams.endDate === "string" ? resolvedSearchParams.endDate : undefined,
    movementType: resolvedSearchParams.movementType,
    costCenter: typeof resolvedSearchParams.costCenter === "string" ? resolvedSearchParams.costCenter : undefined,
    search: typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : undefined,
  });
  const filters: Partial<FinanceFilterInput> = parsed.success ? parsed.data : financeFilterSchema.parse({});
  const dashboard = await getFinanceDashboard(user.restaurantId, JSON.stringify(filters));

  return <FinanceStudio dashboard={dashboard} filters={filters} canExport={user.role !== ROLES.STAFF} />;
}
