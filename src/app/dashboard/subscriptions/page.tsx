import { ROLES } from "@/permissions";
import { requireRole } from "@/lib/session";
import { getSubscriptionDashboardAction } from "@/actions/subscriptions";
import { SubscriptionsStudio } from "@/components/dashboard/subscriptions";

export default async function SubscriptionsDashboardPage() {
  await requireRole([ROLES.SUPER_ADMIN]);
  const dashboard = await getSubscriptionDashboardAction();
  return <SubscriptionsStudio dashboard={dashboard} />;
}

