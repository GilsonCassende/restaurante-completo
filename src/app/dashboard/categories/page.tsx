import type { Metadata } from "next";
import { ROLES } from "@/permissions";
import { requireRole } from "@/lib/session";
import { listCategoriesByRestaurant } from "@/prisma";
import { CategoryManager } from "@/components/dashboard/category-manager";

export const metadata: Metadata = {
  title: "Categorias",
  description: "Gestão de categorias do menu.",
};

export default async function CategoriesPage() {
  const user = await requireRole([ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER]);
  const categories = await listCategoriesByRestaurant(user.restaurantId);

  return <CategoryManager categories={categories} />;
}
