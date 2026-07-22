import type { Metadata } from "next";
import { ROLES } from "@/permissions";
import { requireRole } from "@/lib/session";
import { listTablesByRestaurant } from "@/prisma";
import { AppShell } from "@/components/layout/app-shell";
import { CheckoutForm } from "@/components/order";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Confirmação do pedido e geração de mensagem automática para WhatsApp.",
};

export default async function CheckoutPage() {
  const user = await requireRole([ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.STAFF]);
  const tables = await listTablesByRestaurant(user.restaurantId);

  return (
    <AppShell className="py-8">
      <CheckoutForm
        restaurantId={user.restaurantId}
        restaurantName={user.restaurant.name}
        restaurantPhone={user.restaurant.phone}
        tables={tables}
      />
    </AppShell>
  );
}
