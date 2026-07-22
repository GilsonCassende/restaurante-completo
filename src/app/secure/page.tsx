import type { Metadata } from "next";
import { ROLES } from "@/permissions";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = {
  title: "Acesso restrito",
  description: "Página mínima para validar permissões por role.",
};

export default async function SecurePage() {
  await requireRole([ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">
          RestaurantPro
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Acesso restrito</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Esta rota confirma que permissões por role estão funcionando.
        </p>
      </div>
    </main>
  );
}
