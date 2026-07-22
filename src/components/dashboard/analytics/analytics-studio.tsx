import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FilterBar, PageHeader, StatisticCard, TableShell, Timeline } from "@/components/design-system";
import { AnalyticsCharts } from "./analytics-charts";
import { AnalyticsExportActions } from "./analytics-export-actions";
import type { AnalyticsDashboard } from "@/services/analytics";
import type { AnalyticsFilterInput } from "@/schemas";
import { formatAnalyticsCurrency, formatAnalyticsPercent } from "@/services/analytics";

type AnalyticsStudioProps = {
  dashboard: AnalyticsDashboard;
  filters: Partial<AnalyticsFilterInput>;
  canExport?: boolean;
};

const PERIODS = [
  { value: "today", label: "Hoje" },
  { value: "yesterday", label: "Ontem" },
  { value: "last_7_days", label: "7 dias" },
  { value: "last_30_days", label: "30 dias" },
  { value: "this_month", label: "Este mês" },
  { value: "last_month", label: "Último mês" },
  { value: "this_year", label: "Este ano" },
  { value: "custom", label: "Personalizado" },
] as const;

function buildQuery(current: Partial<AnalyticsFilterInput>, updates: Record<string, string | number | undefined | null>) {
  const searchParams = new URLSearchParams();
  if (current.period) searchParams.set("period", current.period);
  if (current.startDate) searchParams.set("startDate", current.startDate);
  if (current.endDate) searchParams.set("endDate", current.endDate);
  Object.entries(updates).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") {
      searchParams.delete(key);
      return;
    }
    searchParams.set(key, String(value));
  });
  return searchParams.toString();
}

export function AnalyticsStudio({ dashboard, filters, canExport }: AnalyticsStudioProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="BI estratégico com KPIs, comparativos, insights automáticos e estrutura preparada para escala."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{dashboard.period.label}</Badge>
            <AnalyticsExportActions filters={filters} disabled={!canExport} />
          </div>
        }
      />

      <FilterBar
        label="Período"
        actions={<Badge variant="outline">{dashboard.period.start} → {dashboard.period.end}</Badge>}
      >
        {PERIODS.map((period) => (
          <Button key={period.value} asChild variant={filters.period === period.value ? "default" : "outline"}>
            <Link href={`?${buildQuery(filters, { period: period.value, startDate: undefined, endDate: undefined })}`}>{period.label}</Link>
          </Button>
        ))}
        <form className="flex flex-wrap items-center gap-2" method="get">
          <input type="hidden" name="period" value="custom" />
          <input
            type="date"
            name="startDate"
            defaultValue={filters.startDate ?? ""}
            className="h-10 rounded-full border border-border bg-background px-3 text-sm"
          />
          <input
            type="date"
            name="endDate"
            defaultValue={filters.endDate ?? ""}
            className="h-10 rounded-full border border-border bg-background px-3 text-sm"
          />
          <Button type="submit" variant="outline">Aplicar</Button>
        </form>
      </FilterBar>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatisticCard label="Faturamento hoje" value={formatAnalyticsCurrency(dashboard.kpis.revenueToday, dashboard.restaurant?.currency ?? undefined)} />
        <StatisticCard label="Faturamento semana" value={formatAnalyticsCurrency(dashboard.kpis.revenueWeek, dashboard.restaurant?.currency ?? undefined)} />
        <StatisticCard label="Faturamento mês" value={formatAnalyticsCurrency(dashboard.kpis.revenueMonth, dashboard.restaurant?.currency ?? undefined)} />
        <StatisticCard label="Faturamento ano" value={formatAnalyticsCurrency(dashboard.kpis.revenueYear, dashboard.restaurant?.currency ?? undefined)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatisticCard label="Pedidos" value={String(dashboard.kpis.orders)} />
        <StatisticCard label="Ticket médio" value={formatAnalyticsCurrency(dashboard.kpis.averageTicket, dashboard.restaurant?.currency ?? undefined)} />
        <StatisticCard label="Clientes novos" value={String(dashboard.kpis.newCustomers)} />
        <StatisticCard label="Clientes recorrentes" value={String(dashboard.kpis.recurringCustomers)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatisticCard label="Lucro estimado" value={formatAnalyticsCurrency(dashboard.kpis.estimatedProfit, dashboard.restaurant?.currency ?? undefined)} />
        <StatisticCard label="Produtos vendidos" value={String(dashboard.kpis.productsSold)} />
        <StatisticCard label="Mesas ocupadas" value={`${dashboard.kpis.tablesOccupied}/${dashboard.tables.total}`} />
        <StatisticCard label="Taxa de conversão" value={formatAnalyticsPercent(dashboard.kpis.conversionRate)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatisticCard label="Cancelamentos" value={String(dashboard.kpis.cancellations)} />
        <StatisticCard label="No show" value={String(dashboard.kpis.noShow)} />
        <StatisticCard label="Cashback emitido" value={formatAnalyticsCurrency(dashboard.kpis.cashbackIssued, dashboard.restaurant?.currency ?? undefined)} />
        <StatisticCard label="Cashback resgatado" value={formatAnalyticsCurrency(dashboard.kpis.cashbackRedeemed, dashboard.restaurant?.currency ?? undefined)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatisticCard label="Pontos emitidos" value={String(dashboard.kpis.pointsIssued)} />
        <StatisticCard label="Pontos resgatados" value={String(dashboard.kpis.pointsRedeemed)} />
        <StatisticCard label="Cupons utilizados" value={String(dashboard.kpis.couponsUsed)} />
        <StatisticCard label="Mesas livres" value={String(dashboard.tables.free)} />
      </div>

      <AnalyticsCharts trends={dashboard.trends} />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <TableShell title="Comparativos" description="Período atual versus período anterior.">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="pb-3 pr-4 font-medium">Indicador</th>
                  <th className="pb-3 pr-4 font-medium">Atual</th>
                  <th className="pb-3 pr-4 font-medium">Anterior</th>
                  <th className="pb-3 pr-4 font-medium">Variação</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.comparisons.map((comparison) => (
                  <tr key={comparison.label} className="border-t border-border/70">
                    <td className="py-4 pr-4 font-medium">{comparison.label}</td>
                    <td className="py-4 pr-4">{comparison.current.toFixed(2)}</td>
                    <td className="py-4 pr-4">{comparison.previous.toFixed(2)}</td>
                    <td className="py-4 pr-4">{formatAnalyticsPercent(comparison.deltaPercent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TableShell>

        <Card className="border-border/70 bg-card/90 shadow-[var(--shadow-soft)]">
          <CardContent className="space-y-4 p-5">
            <div>
              <h3 className="text-base font-semibold">Insights automáticos</h3>
              <p className="text-sm text-muted-foreground">Leitura estratégica baseada no intervalo selecionado.</p>
            </div>
            <div className="space-y-3">
              {dashboard.insights.map((insight) => (
                <div key={insight.title} className="rounded-2xl border border-border/70 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{insight.title}</p>
                    <Badge variant={insight.severity === "success" ? "secondary" : insight.severity === "warning" ? "outline" : "default"}>{insight.severity}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{insight.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-border/70 bg-card/90 shadow-[var(--shadow-soft)]">
          <CardContent className="space-y-4 p-5">
            <div>
              <h3 className="text-base font-semibold">Alertas</h3>
              <p className="text-sm text-muted-foreground">Regras automáticas para operação e retenção.</p>
            </div>
            <div className="space-y-3">
              {dashboard.alerts.map((alert) => (
                <div key={alert.title} className="rounded-2xl border border-border/70 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{alert.title}</p>
                    <Badge variant={alert.severity === "danger" ? "default" : alert.severity === "warning" ? "outline" : "secondary"}>{alert.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{alert.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <TableShell title="Timeline" description="Movimentações mais recentes do período.">
          <Timeline
            items={dashboard.timeline.map((item) => ({
              title: item.label,
              description: item.description,
              meta: item.meta,
            }))}
          />
        </TableShell>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <TableShell title="Ranking de produtos" description="Top vendidos e menor desempenho.">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Mais vendidos</p>
              {dashboard.rankings.topProducts.map((item) => (
                <div key={item.label} className="rounded-2xl border border-border/70 p-3">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.value} unidades</p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Menos vendidos</p>
              {dashboard.rankings.bottomProducts.map((item) => (
                <div key={item.label} className="rounded-2xl border border-border/70 p-3">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.value} unidades</p>
                </div>
              ))}
            </div>
          </div>
        </TableShell>

        <Card className="border-border/70 bg-card/90 shadow-[var(--shadow-soft)]">
          <CardContent className="space-y-4 p-5">
            <div>
              <h3 className="text-base font-semibold">Capacidade operacional</h3>
              <p className="text-sm text-muted-foreground">Mesas, ocupação e disponibilidade do restaurante.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-muted/40 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Mesas totais</p>
                <p className="mt-2 text-2xl font-semibold">{dashboard.tables.total}</p>
              </div>
              <div className="rounded-2xl bg-muted/40 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Mesas ocupadas</p>
                <p className="mt-2 text-2xl font-semibold">{dashboard.tables.occupied}</p>
              </div>
              <div className="rounded-2xl bg-muted/40 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Mesas reservadas</p>
                <p className="mt-2 text-2xl font-semibold">{dashboard.tables.reserved}</p>
              </div>
              <div className="rounded-2xl bg-muted/40 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Taxa de ocupação</p>
                <p className="mt-2 text-2xl font-semibold">{formatAnalyticsPercent(dashboard.tables.occupiedRate)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
