"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LayoutDashboard, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  description: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Insights",
    items: [
      { href: "/dashboard/analytics", label: "Analytics", description: "KPIs, tendências e comparativos" },
      { href: "/dashboard/finance", label: "Financeiro", description: "Caixa, carteiras e custos" },
      { href: "/dashboard/payments", label: "Pagamentos", description: "Gateways, invoices e reembolsos" },
      { href: "/dashboard/reports", label: "Relatórios", description: "Exportação e consolidação" },
    ],
  },
  {
    label: "Commerce",
    items: [
      { href: "/dashboard/categories", label: "Categorias", description: "Estrutura do menu" },
      { href: "/dashboard/products", label: "Produtos", description: "Cadastro e catálogo" },
      { href: "/dashboard/tables", label: "Mesas", description: "QR e disponibilidade" },
      { href: "/dashboard/reservations", label: "Reservas", description: "Agenda e confirmações" },
      { href: "/dashboard/orders", label: "Pedidos", description: "Fluxo operacional" },
    ],
  },
  {
    label: "Growth",
    items: [
      { href: "/dashboard/crm", label: "CRM", description: "Base de clientes e campanhas" },
      { href: "/dashboard/loyalty", label: "Fidelidade", description: "Pontos e recompensas" },
      { href: "/dashboard/coupons", label: "Cupons", description: "Promoções e regras" },
      { href: "/dashboard/cashback", label: "Cashback", description: "Saldo e resgates" },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/dashboard/delivery", label: "Delivery", description: "Fila e despacho" },
      { href: "/dashboard/drivers", label: "Drivers", description: "Escalas e produtividade" },
      { href: "/dashboard/tracking", label: "Tracking", description: "Rastreio em tempo real" },
      { href: "/dashboard/subscriptions", label: "Assinaturas", description: "Billing e status" },
      { href: "/dashboard/plans", label: "Planos", description: "Capacidade e limites" },
    ],
  },
  {
    label: "Platform",
    items: [
      { href: "/dashboard/branding", label: "Branding", description: "White label e identidade" },
      { href: "/dashboard/settings", label: "Settings", description: "CMS e integrações" },
      { href: "/dashboard/admin", label: "Admin", description: "Multi-tenant e auditoria" },
    ],
  },
];

const QUICK_ACTIONS = [
  { href: "/", label: "Site público" },
  { href: "/menu", label: "Menu digital" },
  { href: "/reservas", label: "Reservas" },
];

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (pathname === href) return true;
  if (href === "/dashboard" && pathname.startsWith("/dashboard")) return true;
  return pathname.startsWith(`${href}/`);
}

export function DashboardNavigation() {
  const pathname = usePathname();
  const current = NAV_GROUPS.flatMap((group) => group.items).find((item) => isActive(pathname, item.href));

  return (
    <>
      <div className="xl:hidden">
        <details className="group rounded-[2rem] border border-border/70 bg-gradient-to-br from-card via-card to-muted/20 shadow-[var(--shadow-soft)] backdrop-blur">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <LayoutDashboard className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Navegação</p>
                <p className="truncate text-sm font-semibold">{current?.label ?? "Dashboard"}</p>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <div className="border-t border-border/70 p-4">
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((item) => (
                <Button key={item.href} asChild variant="outline" size="sm" className="rounded-full">
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              ))}
            </div>
            <div className="mt-4 grid gap-4">
              {NAV_GROUPS.map((group) => (
                <div key={group.label} className="space-y-2">
                  <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">{group.label}</p>
                  <div className="grid gap-2">
                    {group.items.map((item) => {
                      const active = isActive(pathname, item.href);
                      return (
                        <Button
                          key={item.href}
                          asChild
                          variant={active ? "secondary" : "ghost"}
                          className={cn(
                            "h-auto justify-start rounded-[1.25rem] px-4 py-3 text-left transition-all duration-200",
                            active ? "border border-border/70 bg-primary/10 shadow-[var(--shadow-soft)]" : "text-muted-foreground"
                          )}
                        >
                          <Link href={item.href} aria-current={active ? "page" : undefined}>
                            <span className="flex min-w-0 flex-col items-start">
                              <span className="flex items-center gap-2">
                                {active ? <span className="h-2 w-2 rounded-full bg-primary" /> : null}
                                <span className="text-sm font-semibold">{item.label}</span>
                              </span>
                              <span className="text-xs font-normal leading-5 text-muted-foreground">{item.description}</span>
                            </span>
                          </Link>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </details>
      </div>

      <aside className="hidden xl:block">
        <div className="sticky top-24 space-y-4 rounded-[2rem] border border-border/70 bg-gradient-to-br from-card via-card to-muted/20 p-4 shadow-[var(--shadow-soft)] backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Dashboard</p>
              <h2 className="text-lg font-semibold tracking-tight">Navegação premium</h2>
            </div>
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em]">
              {current ? "Ativo" : "Todos"}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((item) => (
              <Button key={item.href} asChild variant="outline" size="sm" className="rounded-full">
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
          </div>

          <div className="grid gap-4">
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <Sparkles className="h-3.5 w-3.5 text-primary/80" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">{group.label}</p>
                </div>
                <div className="grid gap-2">
                  {group.items.map((item) => {
                    const active = isActive(pathname, item.href);
                    return (
                      <Button
                        key={item.href}
                        asChild
                        variant={active ? "secondary" : "ghost"}
                        className={cn(
                          "h-auto justify-start rounded-[1.25rem] px-4 py-3 text-left transition-all duration-200",
                          active ? "border border-border/70 bg-primary/10 shadow-[var(--shadow-soft)]" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Link href={item.href} aria-current={active ? "page" : undefined}>
                          <span className="flex min-w-0 flex-col items-start">
                            <span className="flex items-center gap-2">
                              {active ? <span className="h-2 w-2 rounded-full bg-primary" /> : null}
                              <span className="text-sm font-semibold">{item.label}</span>
                            </span>
                            <span className="text-xs font-normal leading-5 text-muted-foreground">{item.description}</span>
                          </span>
                        </Link>
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
