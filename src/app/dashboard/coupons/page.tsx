import type { Metadata } from "next";
import { ROLES } from "@/permissions";
import { requireRole } from "@/lib/session";
import { getCouponDashboard, listCoupons } from "@/services/coupons";
import { CouponsStudio } from "@/components/dashboard/coupons";
import type { CouponFilterInput } from "@/schemas";

export const metadata: Metadata = {
  title: "Cupons",
  description: "Campanhas promocionais e regras de desconto.",
};

const COUPON_TYPE_VALUES = ["PERCENTAGE", "FIXED", "FREE_SHIPPING", "FIRST_PURCHASE", "BIRTHDAY", "SEGMENT", "PERIOD", "all"] as const;

function parseNumber(value: string | string[] | undefined, fallback: number) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export default async function CouponsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const resolvedSearchParams = await searchParams;
  const user = await requireRole([ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER]);
  const filters: Partial<CouponFilterInput> = {
    search: typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : "",
    type:
      typeof resolvedSearchParams.type === "string" && COUPON_TYPE_VALUES.includes(resolvedSearchParams.type as (typeof COUPON_TYPE_VALUES)[number])
        ? (resolvedSearchParams.type as CouponFilterInput["type"])
        : "all",
    page: parseNumber(resolvedSearchParams.page, 1),
    perPage: parseNumber(resolvedSearchParams.perPage, 10),
  };
  const dashboard = await getCouponDashboard(user.restaurantId);
  const result = await listCoupons(user.restaurantId, filters);

  return <CouponsStudio dashboard={dashboard} filters={filters} page={result.page} totalPages={result.totalPages} total={result.total} />;
}
