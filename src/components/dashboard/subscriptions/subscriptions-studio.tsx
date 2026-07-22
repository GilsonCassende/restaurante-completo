import type { SubscriptionDashboard } from "@/types";
import { Badge } from "@/components/ui/badge";
import { MetricCard, TableShell, Timeline } from "@/components/design-system";

type SubscriptionsStudioProps = {
  dashboard: SubscriptionDashboard;
};

function money(value: number) {
  return new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: "AOA",
    maximumFractionDigits: 0,
  }).format(value);
}

export function SubscriptionsStudio({ dashboard }: SubscriptionsStudioProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Ativas" value={String(dashboard.kpis.active)} />
        <MetricCard label="Trialing" value={String(dashboard.kpis.trialing)} />
        <MetricCard label="Vencidas" value={String(dashboard.kpis.pastDue)} />
        <MetricCard label="Canceladas" value={String(dashboard.kpis.canceled)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Renovações" value={String(dashboard.kpis.renewals)} />
        <MetricCard label="Trial ends soon" value={String(dashboard.kpis.trialEndsSoon)} />
        <MetricCard label="Planos" value={String(dashboard.plans.length)} />
        <MetricCard label="Billing entries" value={String(dashboard.billingHistory.length)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <TableShell title="Assinaturas" description="Estado atual por organização.">
          <div className="space-y-3">
            {dashboard.subscriptions.map((subscription) => {
              const plan = dashboard.plans.find((item) => item.id === subscription.planId);
              return (
                <div key={subscription.id} className="rounded-2xl border border-border/70 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{plan?.name ?? subscription.planId}</p>
                    <Badge variant={subscription.status === "ACTIVE" ? "secondary" : "outline"}>{subscription.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Ciclo {subscription.billingInterval} • Seats {subscription.seats}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {subscription.currentPeriodStart.toLocaleDateString("pt-BR")} → {subscription.currentPeriodEnd.toLocaleDateString("pt-BR")}
                  </p>
                </div>
              );
            })}
          </div>
        </TableShell>

        <TableShell title="Billing" description="Histórico financeiro do SaaS.">
          <Timeline
            items={dashboard.billingHistory.slice(0, 8).map((entry) => ({
              title: `${entry.invoiceNumber} • ${money(entry.amount)}`,
              description: entry.description ?? entry.status,
              meta: entry.periodEnd.toLocaleDateString("pt-BR"),
            }))}
          />
        </TableShell>
      </div>

      <TableShell title="Uso" description="Consumo agregado dos recursos do SaaS.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboard.usage.map((item) => (
            <div key={item.id} className="rounded-2xl border border-border/70 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{item.metric}</p>
                <Badge variant="outline">{item.period}</Badge>
              </div>
              <p className="mt-2 text-2xl font-semibold">{item.used}</p>
              <p className="text-sm text-muted-foreground">Limite: {item.limit ?? "∞"}</p>
            </div>
          ))}
        </div>
      </TableShell>
    </div>
  );
}

