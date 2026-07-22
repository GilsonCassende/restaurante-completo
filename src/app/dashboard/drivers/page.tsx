import { getCurrentRestaurant } from "@/lib/session";
import { getDeliveryDashboardCached } from "@/services/delivery";
import { DriversStudio } from "@/components/dashboard/drivers";

export default async function DriversDashboardPage() {
  const restaurant = await getCurrentRestaurant();
  const dashboard = await getDeliveryDashboardCached(restaurant?.id ?? "");

  return <DriversStudio dashboard={dashboard} />;
}
