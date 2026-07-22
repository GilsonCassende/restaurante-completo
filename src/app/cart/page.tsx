import type { Metadata } from "next";
import { ROLES } from "@/permissions";
import { requireRole } from "@/lib/session";
import { AppShell } from "@/components/layout/app-shell";
import { CartView } from "@/components/order";

export const metadata: Metadata = {
  title: "Carrinho",
  description: "Resumo do carrinho global do restaurante.",
};

export default async function CartPage() {
  const user = await requireRole([ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.STAFF]);

  return (
    <AppShell className="py-8">
      <CartView restaurantId={user.restaurantId} restaurantName={user.restaurant.name} />
    </AppShell>
  );
}
