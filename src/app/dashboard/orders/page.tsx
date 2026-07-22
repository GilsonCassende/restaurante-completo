import type { Metadata } from "next";
import { ROLES } from "@/permissions";
import { requireRole } from "@/lib/session";
import { listOrdersByRestaurant } from "@/prisma";
import { OrderHistory } from "@/components/dashboard/order-history";

export const metadata: Metadata = {
  title: "Pedidos",
  description: "Histórico e gestão dos pedidos do restaurante.",
};

export default async function OrdersPage() {
  const user = await requireRole([ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.STAFF]);
  const orders = await listOrdersByRestaurant(user.restaurantId);

  return <OrderHistory restaurantName={user.restaurant.name} orders={orders} />;
}
