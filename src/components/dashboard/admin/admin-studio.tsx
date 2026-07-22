import Link from "next/link";
import type { AdminDashboard } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard, TableShell, Timeline } from "@/components/design-system";

type AdminStudioProps = {
  dashboard: AdminDashboard;
};

function money(value: number) {
  return new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: "AOA",
    maximumFractionDigits: 0,
  }).format(value);
}

export function AdminStudio({ dashboard }: AdminStudioProps) {
  const selectedOrganization =
    dashboard.organizations.find((organization) => organization.id === dashboard.selectedOrganizationId) ?? dashboard.organizations[0] ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">Super Admin</Badge>
        <Badge variant="outline">{selectedOrganization?.name ?? "Sem organização"}</Badge>
        <Badge variant="outline">Restaurant Switcher</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="MRR" value={money(dashboard.kpis.mrr)} detail="Receita recorrente mensal" />
        <MetricCard label="ARR" value={money(dashboard.kpis.arr)} detail="Receita anualizada" />
        <MetricCard label="LTV" value={money(dashboard.kpis.ltv)} detail="Valor de vida estimado" />
        <MetricCard label="CAC" value={money(dashboard.kpis.cac)} detail="Custo de aquisição" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Churn" value={`${dashboard.kpis.churn}%`} />
        <MetricCard label="Receita" value={money(dashboard.kpis.revenue)} />
        <MetricCard label="Novos clientes" value={String(dashboard.kpis.newCustomers)} />
        <MetricCard label="Conversão Trial" value={`${dashboard.kpis.trialConversion}%`} />
      </div>

      <Card className="border-border/70 bg-card/90 shadow-[var(--shadow-soft)]">
        <CardHeader>
          <CardTitle className="text-lg">Restaurant Switcher</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {dashboard.organizations.map((organization) => (
            <Button key={organization.id} asChild variant={organization.id === dashboard.selectedOrganizationId ? "default" : "outline"}>
              <Link href={`?organizationId=${organization.id}`}>{organization.name}</Link>
            </Button>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <TableShell title="Organizações" description="Controle global multi-tenant do SaaS.">
          <div className="space-y-3">
            {dashboard.organizations.map((organization) => (
              <div key={organization.id} className="rounded-2xl border border-border/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{organization.name}</p>
                    <p className="text-sm text-muted-foreground">{organization.slug}</p>
                  </div>
                  <Badge variant={organization.active ? "secondary" : "outline"}>{organization.trialEndsAt ? "Trial" : "Ativa"}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Billing: {organization.billingEmail ?? "N/D"}</p>
              </div>
            ))}
          </div>
        </TableShell>

        <TableShell title="Auditoria" description="Logs globais e trilha de alterações.">
          <Timeline
            items={dashboard.auditLogs.slice(0, 8).map((item) => ({
              title: item.action,
              description: `${item.resource} ${item.resourceId ?? ""}`.trim(),
              meta: item.createdAt.toLocaleString("pt-AO"),
            }))}
          />
        </TableShell>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <TableShell title="Assinaturas" description="Visão executiva por organização.">
          <div className="space-y-3">
            {dashboard.subscriptions.map((subscription) => {
              const plan = dashboard.plans.find((item) => item.id === subscription.planId);
              return (
                <div key={subscription.id} className="rounded-2xl border border-border/70 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{plan?.name ?? subscription.planId}</p>
                    <Badge variant={subscription.status === "ACTIVE" ? "secondary" : "outline"}>{subscription.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">Seats: {subscription.seats} | Intervalo: {subscription.billingInterval}</p>
                </div>
              );
            })}
          </div>
        </TableShell>

        <TableShell title="Uso e Limites" description="Consumo atual versus limites do plano.">
          <div className="space-y-3">
            {dashboard.usages.slice(0, 6).map((usage) => (
              <div key={usage.id} className="rounded-2xl border border-border/70 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{usage.metric}</p>
                  <Badge variant="outline">{usage.period}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {usage.used} / {usage.limit ?? "∞"}
                </p>
              </div>
            ))}
          </div>
        </TableShell>
      </div>

      <TableShell title="Convites e Chaves" description="Controle de acesso e automação.">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            {dashboard.invitations.map((invitation) => (
              <div key={invitation.id} className="rounded-2xl border border-border/70 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{invitation.email}</p>
                  <Badge variant="outline">{invitation.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{invitation.role}</p>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {dashboard.apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="rounded-2xl border border-border/70 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{apiKey.name}</p>
                  <Badge variant={apiKey.active ? "secondary" : "outline"}>{apiKey.prefix}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Scopes: {(apiKey.scopes ?? []).join(", ") || "N/D"}</p>
              </div>
            ))}
          </div>
        </div>
      </TableShell>
    </div>
  );
}

