import type { Metadata } from "next";
import { ROLES } from "@/permissions";
import { requireRole } from "@/lib/session";
import { getCrmDashboard, listCrmCustomers } from "@/services/crm";
import { CrmStudio } from "@/components/dashboard/crm";
import type { CustomerFilterInput } from "@/schemas";

export const metadata: Metadata = {
  title: "CRM",
  description: "Gestão de clientes, segmentos e campanhas.",
};

const CUSTOMER_STATUS_VALUES = ["ACTIVE", "VIP", "INACTIVE", "BLOCKED", "all"] as const;
const CUSTOMER_SEGMENT_VALUES = ["all", "new", "recurring", "vip", "inactive", "birthday", "high-value", "low-value"] as const;

function parseNumber(value: string | string[] | undefined, fallback: number) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export default async function CrmPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const resolvedSearchParams = await searchParams;
  const user = await requireRole([ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER]);
  const filters: Partial<CustomerFilterInput> = {
    search: typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : "",
    status:
      typeof resolvedSearchParams.status === "string" && CUSTOMER_STATUS_VALUES.includes(resolvedSearchParams.status as (typeof CUSTOMER_STATUS_VALUES)[number])
        ? (resolvedSearchParams.status as CustomerFilterInput["status"])
        : "all",
    segment:
      typeof resolvedSearchParams.segment === "string" && CUSTOMER_SEGMENT_VALUES.includes(resolvedSearchParams.segment as (typeof CUSTOMER_SEGMENT_VALUES)[number])
        ? resolvedSearchParams.segment
        : "all",
    page: parseNumber(resolvedSearchParams.page, 1),
    perPage: parseNumber(resolvedSearchParams.perPage, 10),
  };
  const dashboard = await getCrmDashboard(user.restaurantId);
  const result = await listCrmCustomers(user.restaurantId, filters);

  return <CrmStudio dashboard={dashboard} filters={filters} page={result.page} totalPages={result.totalPages} total={result.total} />;
}
