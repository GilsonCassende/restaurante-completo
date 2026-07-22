import type { Metadata } from "next";
import { ROLES } from "@/permissions";
import { requireRole } from "@/lib/session";
import { getPaymentsDashboard } from "@/services/payments";
import { PaymentsStudio } from "@/components/dashboard/payments";
import { paymentFilterSchema, type PaymentFilterInput } from "@/schemas";

export const metadata: Metadata = {
  title: "Payments",
  description: "Pagamentos, gateways, invoices e checkout inteligente.",
};

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const resolvedSearchParams = await searchParams;
  const user = await requireRole([ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.STAFF]);
  const parsed = paymentFilterSchema.safeParse({
    period: resolvedSearchParams.period,
    startDate: typeof resolvedSearchParams.startDate === "string" ? resolvedSearchParams.startDate : undefined,
    endDate: typeof resolvedSearchParams.endDate === "string" ? resolvedSearchParams.endDate : undefined,
    status: resolvedSearchParams.status,
    gatewayProvider: resolvedSearchParams.gatewayProvider,
    methodType: resolvedSearchParams.methodType,
    search: typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : undefined,
  });
  const filters: Partial<PaymentFilterInput> = parsed.success ? parsed.data : paymentFilterSchema.parse({});
  const dashboard = await getPaymentsDashboard(user.restaurantId, JSON.stringify(filters));

  return <PaymentsStudio dashboard={dashboard} filters={filters} canExport={user.role !== ROLES.STAFF} />;
}
