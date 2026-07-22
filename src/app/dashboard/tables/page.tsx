import type { Metadata } from "next";
import { ROLES } from "@/permissions";
import { requireRole } from "@/lib/session";
import { listTablesByRestaurant } from "@/prisma";
import { TableManager } from "@/components/dashboard/table-manager";

export const metadata: Metadata = {
  title: "Mesas",
  description: "Gestão de mesas com QR Code.",
};

export default async function TablesPage() {
  const user = await requireRole([ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER]);
  const tables = await listTablesByRestaurant(user.restaurantId);

  return <TableManager tables={tables} />;
}
