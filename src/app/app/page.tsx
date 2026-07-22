import type { Metadata } from "next";
import { ROLES } from "@/permissions";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = {
  title: "Área protegida",
  description: "Página mínima protegida para validar autenticação e permissões.",
};

export default async function ProtectedAppPage() {
  await requireRole([ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">
          RestaurantPro
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Área protegida</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Esta rota existe apenas para validar sessão, JWT, middleware e permissões por role.
        </p>
      </div>
    </main>
  );
}
