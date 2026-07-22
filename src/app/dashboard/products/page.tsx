import type { Metadata } from "next";
import { ROLES } from "@/permissions";
import { requireRole } from "@/lib/session";
import { listCategoriesByRestaurant, listProductsByRestaurant } from "@/prisma";
import { ProductManager } from "@/components/dashboard/product-manager";

export const metadata: Metadata = {
  title: "Produtos",
  description: "Gestão dos itens do menu.",
};

export default async function ProductsPage() {
  const user = await requireRole([ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER]);
  const [categories, products] = await Promise.all([
    listCategoriesByRestaurant(user.restaurantId),
    listProductsByRestaurant(user.restaurantId),
  ]);

  return <ProductManager categories={categories} products={products} />;
}
