import { ROLES } from "@/permissions";
import { requireRole } from "@/lib/session";
import { getPlansDashboardAction } from "@/actions/subscriptions";
import { PlansStudio } from "@/components/dashboard/plans";

export default async function PlansDashboardPage() {
  await requireRole([ROLES.SUPER_ADMIN]);
  const dashboard = await getPlansDashboardAction();
  return <PlansStudio dashboard={dashboard} />;
}

