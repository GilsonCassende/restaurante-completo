import type { Metadata } from "next";
import { ROLES } from "@/permissions";
import { requireRole } from "@/lib/session";
import { listCategoriesByRestaurant, listProductsByRestaurant } from "@/prisma";
import { AppShell } from "@/components/layout/app-shell";
import { MenuView } from "@/components/order";

export const metadata: Metadata = {
  title: "Menu",
  description: "Menu digital com carrinho global e checkout para pedidos.",
};

export default async function MenuPage() {
  const user = await requireRole([ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.STAFF]);
  const [categories, products] = await Promise.all([
    listCategoriesByRestaurant(user.restaurantId),
    listProductsByRestaurant(user.restaurantId),
  ]);

  const visibleCategories = categories.filter((category) => category.active);
  const visibleProducts = products.filter((product) => product.active);

  return (
    <AppShell className="py-8">
      <MenuView
        restaurantId={user.restaurantId}
        restaurantName={user.restaurant.name}
        categories={visibleCategories}
        products={visibleProducts}
      />
    </AppShell>
  );
}
