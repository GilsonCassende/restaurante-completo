import type { ReactNode } from "react";
import { ROLES } from "@/permissions";
import { requireRole } from "@/lib/session";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireRole([ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.STAFF, ROLES.DRIVER]);

  return (
    <DashboardShell
      title={`Operação do restaurante - ${user.restaurant.name}`}
      description="Gerencie menu, mesas, pedidos, delivery e logística com isolamento multi-tenant e permissões por role."
      userRole={user.role}
    >
      {children}
    </DashboardShell>
  );
}
