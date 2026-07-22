import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FilterBar, PageHeader, StatisticCard, TableShell, Timeline } from "@/components/design-system";
import type { FinanceDashboard } from "@/services/finance";
import type { FinanceFilterInput } from "@/schemas";
import { formatPaymentsCurrency } from "@/services/payments";
import { FinanceCharts } from "./finance-charts";
import { FinanceExportActions } from "./finance-export-actions";

type FinanceStudioProps = {
  dashboard: FinanceDashboard;
  filters: Partial<FinanceFilterInput>;
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

const MOVEMENT_TYPES = ["all", "REVENUE", "EXPENSE", "REFUND", "FEE", "TAX", "ADJUSTMENT", "TRANSFER_IN", "TRANSFER_OUT"] as const;

function buildQuery(current: Partial<FinanceFilterInput>, updates: Record<string, string | number | undefined | null>) {
  const searchParams = new URLSearchParams();
  if (current.period) searchParams.set("period", current.period);
  if (current.startDate) searchParams.set("startDate", current.startDate);
  if (current.endDate) searchParams.set("endDate", current.endDate);
  if (current.movementType) searchParams.set("movementType", current.movementType);
  if (current.costCenter) searchParams.set("costCenter", current.costCenter);
  Object.entries(updates).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") {
      searchParams.delete(key);
      return;
    }
    searchParams.set(key, String(value));
  });
  return searchParams.toString();
}

function money(value: number, currency?: string | null) {
  return formatPaymentsCurrency(value, currency ?? undefined);
}

export function FinanceStudio({ dashboard, filters, canExport }: FinanceStudioProps) {
  const currency = dashboard.restaurant?.currency ?? undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance"
        description="Visão executiva do fluxo de caixa, lucro, saldo e movimentações financeiras."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{dashboard.period.label}</Badge>
            <FinanceExportActions filters={filters} disabled={!canExport} />
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

      <div className="flex flex-wrap gap-2">
        {MOVEMENT_TYPES.map((movementType) => (
          <Button key={movementType} asChild variant={(filters.movementType ?? "all") === movementType ? "default" : "outline"} size="sm">
            <Link href={`?${buildQuery(filters, { movementType })}`}>{movementType === "all" ? "Todas as movimentações" : movementType}</Link>
          </Button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatisticCard label="Fluxo de caixa" value={money(dashboard.kpis.cashFlow, currency)} />
        <StatisticCard label="Lucro" value={money(dashboard.kpis.profit, currency)} />
        <StatisticCard label="Saldo" value={money(dashboard.kpis.balance, currency)} />
        <StatisticCard label="Margem" value={`${Math.round(dashboard.kpis.margin * 100)}%`} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatisticCard label="Receita mês" value={money(dashboard.kpis.revenueMonth, currency)} />
        <StatisticCard label="Despesas" value={money(dashboard.kpis.expenses, currency)} />
        <StatisticCard label="Pendentes" value={String(dashboard.kpis.pendingPayments)} />
        <StatisticCard label="Reembolsos" value={String(dashboard.kpis.refunds)} />
      </div>

      <FinanceCharts trends={dashboard.trends} currency={currency} />

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <TableShell title="Movimentações financeiras" description="Histórico consolidado de entradas e saídas.">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="pb-3 pr-4 font-medium">Categoria</th>
                  <th className="pb-3 pr-4 font-medium">Tipo</th>
                  <th className="pb-3 pr-4 font-medium">Valor</th>
                  <th className="pb-3 pr-4 font-medium">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.financialMovements.slice(0, 10).map((movement) => (
                  <tr key={movement.id} className="border-t border-border/70">
                    <td className="py-4 pr-4">
                      <p className="font-medium">{movement.category}</p>
                      <p className="text-xs text-muted-foreground">{movement.costCenter ?? "Sem centro de custo"}</p>
                    </td>
                    <td className="py-4 pr-4"><Badge variant="secondary">{movement.type}</Badge></td>
                    <td className="py-4 pr-4">{money(movement.amount, currency)}</td>
                    <td className="py-4 pr-4">{money(movement.balanceAfter, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TableShell>

        <TableShell title="Carteiras" description="Saldo operacional e reserva por carteira.">
          <div className="space-y-3">
            {dashboard.wallets.map((wallet) => (
              <div key={wallet.id} className="rounded-2xl border border-border/70 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{wallet.name}</p>
                  <Badge variant={wallet.active ? "secondary" : "outline"}>{wallet.provider ?? "manual"}</Badge>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-2xl bg-muted/40 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Saldo</p>
                    <p className="mt-2 text-lg font-semibold">{money(wallet.balance, currency)}</p>
                  </div>
                  <div className="rounded-2xl bg-muted/40 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Reserva</p>
                    <p className="mt-2 text-lg font-semibold">{money(wallet.reservedBalance, currency)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TableShell>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <TableShell title="Centros de custo" description="Agrupamento dos movimentos por área financeira.">
          <div className="space-y-2">
            {dashboard.costCenters.map((item) => (
              <div key={item.label} className="rounded-2xl border border-border/70 p-3">
                <p className="font-medium">{item.label}</p>
                <p className="text-sm text-muted-foreground">{money(item.value, currency)}</p>
              </div>
            ))}
          </div>
        </TableShell>

        <TableShell title="Linha do tempo" description="Eventos financeiros mais recentes do período.">
          <Timeline
            items={dashboard.timeline.map((item) => ({
              title: item.label,
              description: item.description,
              meta: item.meta,
            }))}
          />
        </TableShell>
      </div>
    </div>
  );
}
