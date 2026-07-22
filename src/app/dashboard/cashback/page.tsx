import type { Metadata } from "next";
import { ROLES } from "@/permissions";
import { requireRole } from "@/lib/session";
import { getCashbackDashboard, listCashbackAccounts } from "@/services/cashback";
import { CashbackStudio } from "@/components/dashboard/cashback";
import type { CashbackFilterInput } from "@/schemas";

export const metadata: Metadata = {
  title: "Cashback",
  description: "Saldo, extrato e resgates de cashback.",
};

function parseNumber(value: string | string[] | undefined, fallback: number) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export default async function CashbackPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const resolvedSearchParams = await searchParams;
  const user = await requireRole([ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER]);
  const filters: Partial<CashbackFilterInput> = {
    search: typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : "",
    page: parseNumber(resolvedSearchParams.page, 1),
    perPage: parseNumber(resolvedSearchParams.perPage, 10),
  };
  const dashboard = await getCashbackDashboard(user.restaurantId);
  const result = await listCashbackAccounts(user.restaurantId, filters);

  return <CashbackStudio dashboard={dashboard} filters={filters} page={result.page} totalPages={result.totalPages} total={result.total} />;
}
