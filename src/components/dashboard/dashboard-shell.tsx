import type { ReactNode } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DashboardNavigation } from "./dashboard-navigation";

type DashboardShellProps = {
  title: string;
  description: string;
  userRole?: string;
  children: ReactNode;
};

export function DashboardShell({ title, description, userRole, children }: DashboardShellProps) {
  return (
    <AppShell className="py-8">
      <div className="space-y-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-gradient-to-br from-card via-card to-muted/20 shadow-[var(--shadow-soft)] backdrop-blur">
          <div className="absolute inset-x-0 top-0 h-px bg-[image:var(--gradient-brand)] opacity-80" />
          <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="max-w-3xl space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">RestaurantPro Dashboard</p>
                {userRole ? <Badge variant="secondary" className="rounded-full px-3 py-1">Role {userRole}</Badge> : null}
              </div>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-balance">{title}</h1>
              <p className="text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
            <div className="hidden lg:flex lg:flex-col lg:items-end lg:gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Atalhos rápidos</p>
              <div className="flex flex-wrap justify-end gap-2">
                <Button asChild variant="outline" size="sm" className="rounded-full">
                  <Link href="/dashboard/categories">Visão geral</Link>
                </Button>
                <Button asChild variant="secondary" size="sm" className="rounded-full">
                  <Link href="/dashboard/settings">Configurações</Link>
                </Button>
              </div>
            </div>
          </div>
          <div className="border-t border-border/70 bg-background/30 px-6 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
              <p>Contexto multi-tenant ativo e navegação otimizada para operações rápidas.</p>
              <p>Transições suaves, hierarquia consistente e foco visual refinado.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[320px_minmax(0,1fr)]">
          <DashboardNavigation />

          <div className="min-w-0 space-y-8">
            <Separator />
            {children}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
