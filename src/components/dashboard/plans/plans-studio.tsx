import type { PlansDashboard } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard, TableShell } from "@/components/design-system";

type PlansStudioProps = {
  dashboard: PlansDashboard;
};

function money(value: number) {
  return new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: "AOA",
    maximumFractionDigits: 0,
  }).format(value);
}

export function PlansStudio({ dashboard }: PlansStudioProps) {
  const planOrder = ["starter", "basic", "pro", "premium", "enterprise"] as const;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Planos ativos" value={String(dashboard.kpis.activePlans)} />
        <MetricCard label="Starter" value={String(dashboard.kpis.starter)} />
        <MetricCard label="Pro" value={String(dashboard.kpis.pro)} />
        <MetricCard label="Enterprise" value={String(dashboard.kpis.enterprise)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {planOrder.map((code) => {
          const plan = dashboard.plans.find((item) => item.code === code);
          if (!plan) return null;
          return (
            <Card key={plan.id} className="border-border/70 bg-card/90 shadow-[var(--shadow-soft)]">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2 text-lg">
                  <span>{plan.name}</span>
                  <Badge variant={plan.active ? "secondary" : "outline"}>{plan.code}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{plan.description ?? "Plano SaaS enterprise."}</p>
                <p className="text-2xl font-semibold">{money(plan.monthlyPrice)}</p>
                <p className="text-sm text-muted-foreground">{money(plan.yearlyPrice)} / ano</p>
                <div className="rounded-2xl bg-muted/40 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Trial</p>
                  <p className="mt-2 font-medium">{plan.trialDays} dias</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <TableShell title="Limites" description="Capacidade por plano e por recurso.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboard.limits.map((limit) => {
            const plan = dashboard.plans.find((item) => item.id === limit.planId);
            return (
              <div key={limit.id} className="rounded-2xl border border-border/70 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{plan?.name ?? limit.planId}</p>
                  <Badge variant="outline">{limit.metric}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Limite: {limit.limit} {limit.hardLimit ? "hard" : "soft"}
                </p>
              </div>
            );
          })}
        </div>
      </TableShell>
    </div>
  );
}

