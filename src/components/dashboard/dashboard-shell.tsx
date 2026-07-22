import type { ReactNode } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type DashboardShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

const navItems = [
  { href: "/dashboard/payments", label: "Payments" },
  { href: "/dashboard/finance", label: "Finance" },
  { href: "/dashboard/analytics", label: "Analytics" },
  { href: "/dashboard/reports", label: "Reports" },
  { href: "/dashboard/categories", label: "Categorias" },
  { href: "/dashboard/products", label: "Produtos" },
  { href: "/dashboard/tables", label: "Mesas" },
  { href: "/dashboard/reservations", label: "Reservas" },
  { href: "/dashboard/crm", label: "CRM" },
  { href: "/dashboard/loyalty", label: "Fidelidade" },
  { href: "/dashboard/coupons", label: "Cupons" },
  { href: "/dashboard/cashback", label: "Cashback" },
  { href: "/dashboard/orders", label: "Pedidos" },
  { href: "/dashboard/delivery", label: "Entregas" },
  { href: "/dashboard/drivers", label: "Entregadores" },
  { href: "/dashboard/tracking", label: "Rastreamento" },
  { href: "/dashboard/branding", label: "Branding" },
  { href: "/dashboard/admin", label: "Admin" },
  { href: "/dashboard/subscriptions", label: "Assinaturas" },
  { href: "/dashboard/plans", label: "Planos" },
  { href: "/dashboard/settings", label: "Settings" },
];

export function DashboardShell({ title, description, children }: DashboardShellProps) {
  return (
    <AppShell className="py-8">
      <div className="space-y-8">
        <div className="rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">
                RestaurantPro Dashboard
              </p>
              <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
              <p className="text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {navItems.map((item) => (
                <Button key={item.href} asChild variant="outline">
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              ))}
            </div>
          </div>
        </div>
        <Separator />
        {children}
      </div>
    </AppShell>
  );
}
