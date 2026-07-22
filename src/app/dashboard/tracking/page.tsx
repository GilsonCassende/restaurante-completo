import { getCurrentRestaurant } from "@/lib/session";
import { getDeliveryDashboardCached } from "@/services/delivery";
import { TrackingStudio } from "@/components/dashboard/tracking";

export default async function TrackingDashboardPage() {
  const restaurant = await getCurrentRestaurant();
  const dashboard = await getDeliveryDashboardCached(restaurant?.id ?? "");

  return <TrackingStudio dashboard={dashboard} />;
}
