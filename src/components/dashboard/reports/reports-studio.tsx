import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FilterBar, PageHeader, StatisticCard, TableShell } from "@/components/design-system";
import type { ReportsDashboard } from "@/services/reports";
import type { ReportFilterInput } from "@/schemas";
import { formatAnalyticsCurrency } from "@/services/analytics";
import { ReportsExportActions } from "./reports-export-actions";

type ReportsStudioProps = {
  dashboard: ReportsDashboard;
  filters: Partial<ReportFilterInput>;
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

function buildQuery(current: Partial<ReportFilterInput>, updates: Record<string, string | number | undefined | null>) {
  const searchParams = new URLSearchParams();
  if (current.period) searchParams.set("period", current.period);
  if (current.report) searchParams.set("report", current.report);
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

export function ReportsStudio({ dashboard, filters, canExport }: ReportsStudioProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Relatórios executivos de pedidos, clientes, produtos, reservas, CRM e fidelidade."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{dashboard.period.label}</Badge>
            <ReportsExportActions filters={filters} disabled={!canExport} />
          </div>
        }
      />

      <FilterBar
        label="Período"
        actions={<Badge variant="outline">{dashboard.period.start} → {dashboard.period.end}</Badge>}
      >
        {PERIODS.map((period) => (
          <Button key={period.value} asChild variant={filters.period === period.value ? "default" : "outline"}>
            <Link href={`?${buildQuery(filters, { period: period.value })}`}>{period.label}</Link>
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
        <StatisticCard label="Receita" value={formatAnalyticsCurrency(dashboard.overview.revenueMonth, dashboard.restaurant?.currency ?? undefined)} />
        <StatisticCard label="Pedidos" value={String(dashboard.overview.orders)} />
        <StatisticCard label="Clientes novos" value={String(dashboard.overview.newCustomers)} />
        <StatisticCard label="Reservas" value={String(dashboard.overview.reservations)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {dashboard.sections.map((section) => (
          <TableShell
            key={section.key}
            title={section.title}
            description={section.description}
            actions={
              <div className="flex flex-wrap gap-2">
                {section.summary.map((item) => (
                  <Badge key={`${section.key}-${item.label}`} variant="secondary">
                    {item.label}: {item.value}
                  </Badge>
                ))}
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    {section.columns.map((column) => (
                      <th key={column} className="pb-3 pr-4 font-medium">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.rows.map((row, index) => (
                    <tr key={`${section.key}-${index}`} className="border-t border-border/70">
                      {Object.values(row).map((value, valueIndex) => (
                        <td key={`${section.key}-${index}-${valueIndex}`} className="py-4 pr-4">
                          {String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TableShell>
        ))}
      </div>

      <Card className="border-border/70 bg-card/90 shadow-[var(--shadow-soft)]">
        <CardContent className="space-y-4 p-5">
          <div>
            <h3 className="text-base font-semibold">Compatibilidade de exportação</h3>
            <p className="text-sm text-muted-foreground">CSV, Excel e PDF são gerados a partir da mesma fonte de dados, sem duplicação de consultas.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-muted/40 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Seções</p>
              <p className="mt-2 text-2xl font-semibold">{dashboard.sections.length}</p>
            </div>
            <div className="rounded-2xl bg-muted/40 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Período</p>
              <p className="mt-2 text-2xl font-semibold">{dashboard.period.label}</p>
            </div>
            <div className="rounded-2xl bg-muted/40 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Exportação</p>
              <p className="mt-2 text-2xl font-semibold">{canExport ? "Liberada" : "Restrita"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
