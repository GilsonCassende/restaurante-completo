import type { Metadata } from "next";
import { ROLES } from "@/permissions";
import { requireRole } from "@/lib/session";
import { FeedbackState } from "@/components/design-system";
import { SettingsStudio } from "@/components/dashboard/settings";
import { getRestaurantSettingsById } from "@/services/settings";

export const metadata: Metadata = {
  title: "Settings",
  description: "Centro de configuração e CMS do restaurante.",
};

export default async function DashboardSettingsPage() {
  const user = await requireRole([ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER]);
  const restaurant = await getRestaurantSettingsById(user.restaurantId);

  if (!restaurant) {
    return (
      <FeedbackState
        variant="error"
        title="Restaurante não encontrado"
        description="Não foi possível carregar as configurações do restaurante atual."
      />
    );
  }

  return <SettingsStudio restaurant={restaurant} />;
}

