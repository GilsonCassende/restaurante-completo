import type { Metadata } from "next";
import { ROLES } from "@/permissions";
import { requireRole } from "@/lib/session";
import { getLoyaltyDashboard, listLoyaltyAccounts } from "@/services/loyalty";
import { LoyaltyStudio } from "@/components/dashboard/loyalty";
import type { LoyaltyFilterInput } from "@/schemas";

export const metadata: Metadata = {
  title: "Fidelidade",
  description: "Programa de pontos e transações de fidelidade.",
};

function parseNumber(value: string | string[] | undefined, fallback: number) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export default async function LoyaltyPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const resolvedSearchParams = await searchParams;
  const user = await requireRole([ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER]);
  const filters: Partial<LoyaltyFilterInput> = {
    search: typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : "",
    page: parseNumber(resolvedSearchParams.page, 1),
    perPage: parseNumber(resolvedSearchParams.perPage, 10),
  };
  const dashboard = await getLoyaltyDashboard(user.restaurantId);
  const result = await listLoyaltyAccounts(user.restaurantId, filters);

  return <LoyaltyStudio dashboard={dashboard} filters={filters} page={result.page} totalPages={result.totalPages} total={result.total} />;
}
