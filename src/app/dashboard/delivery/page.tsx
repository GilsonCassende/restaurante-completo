import { getCurrentRestaurant } from "@/lib/session";
import { getDeliveryDashboardCached } from "@/services/delivery";
import { DeliveryStudio } from "@/components/dashboard/delivery";

export default async function DeliveryDashboardPage() {
  const restaurant = await getCurrentRestaurant();
  const dashboard = await getDeliveryDashboardCached(restaurant?.id ?? "");

  return <DeliveryStudio dashboard={dashboard} />;
}
