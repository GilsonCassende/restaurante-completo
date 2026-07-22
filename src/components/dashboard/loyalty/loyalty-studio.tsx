import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader, StatisticCard, TableShell, FilterBar } from "@/components/design-system";
import type { LoyaltyDashboard } from "@/services/loyalty";
import type { LoyaltyFilterInput } from "@/schemas";

type LoyaltyStudioProps = {
  dashboard: LoyaltyDashboard;
  filters: Partial<LoyaltyFilterInput>;
  page: number;
  totalPages: number;
  total: number;
};

function buildQuery(current: Partial<LoyaltyFilterInput>, updates: Record<string, string | number | undefined | null>) {
  const searchParams = new URLSearchParams();
  if (current.search) searchParams.set("search", current.search);
  if (current.page) searchParams.set("page", String(current.page));
  if (current.perPage) searchParams.set("perPage", String(current.perPage));
  Object.entries(updates).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") {
      searchParams.delete(key);
      return;
    }
    searchParams.set(key, String(value));
  });
  return searchParams.toString();
}

export function LoyaltyStudio({ dashboard, filters, page, totalPages, total }: LoyaltyStudioProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Fidelidade"
        description="Programa de pontos com regras, carteira de clientes e histórico de transações."
        actions={<Badge variant="secondary">{total} conta(s)</Badge>}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatisticCard label="Clientes" value={String(dashboard.kpis.customers)} />
        <StatisticCard label="Ativos" value={String(dashboard.kpis.activeCustomers)} />
        <StatisticCard label="Pontos emitidos" value={String(dashboard.kpis.pointsIssued)} />
        <StatisticCard label="Pontos resgatados" value={String(dashboard.kpis.pointsRedeemed)} />
      </div>

      <FilterBar label="Filtros" actions={<Badge variant="outline">Página {page} de {totalPages}</Badge>}>
        <form className="flex gap-2" method="get">
          <Input name="search" defaultValue={filters.search ?? ""} placeholder="Pesquisar cliente" className="rounded-full" />
          <Button type="submit">Pesquisar</Button>
        </form>
      </FilterBar>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <TableShell title="Contas de Fidelidade" description="Saldo, acúmulo e resgate de pontos.">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="pb-3 pr-4 font-medium">Cliente</th>
                  <th className="pb-3 pr-4 font-medium">Saldo</th>
                  <th className="pb-3 pr-4 font-medium">Acumulado</th>
                  <th className="pb-3 pr-4 font-medium">Resgatado</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.accounts.map((account) => (
                  <tr key={account.id} className="border-t border-border/70">
                    <td className="py-4 pr-4">
                      <div className="space-y-1">
                        <p className="font-medium">{account.customer.name}</p>
                        <p className="text-xs text-muted-foreground">{account.customer.phone}</p>
                      </div>
                    </td>
                    <td className="py-4 pr-4"><Badge variant="secondary">{account.pointsBalance} pts</Badge></td>
                    <td className="py-4 pr-4">{account.totalPointsEarned} pts</td>
                    <td className="py-4 pr-4">{account.totalPointsRedeemed} pts</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>Página {page} de {totalPages}</span>
            <div className="flex gap-2">
              <Button asChild variant="outline" disabled={page <= 1}>
                <Link href={`?${buildQuery(filters, { page: Math.max(page - 1, 1) })}`}>Anterior</Link>
              </Button>
              <Button asChild variant="outline" disabled={page >= totalPages}>
                <Link href={`?${buildQuery(filters, { page: Math.min(page + 1, totalPages) })}`}>Próxima</Link>
              </Button>
            </div>
          </div>
        </TableShell>

        <Card className="border-border/70 bg-card/90 shadow-[var(--shadow-soft)]">
          <CardContent className="space-y-4 p-5">
            <div>
              <h3 className="text-base font-semibold">Regras</h3>
              <p className="text-sm text-muted-foreground">Configuração atual do programa.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-muted/40 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Por moeda</p>
                <p className="mt-2 text-xl font-semibold">{dashboard.rules.pointsPerCurrency}</p>
              </div>
              <div className="rounded-2xl bg-muted/40 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Moeda por ponto</p>
                <p className="mt-2 text-xl font-semibold">{dashboard.rules.currencyPerPoint}</p>
              </div>
              <div className="rounded-2xl bg-muted/40 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Validade</p>
                <p className="mt-2 text-xl font-semibold">{dashboard.rules.pointsExpirationDays} dias</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Últimas transações</p>
              {dashboard.transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="rounded-2xl border border-border/70 p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span>{transaction.type}</span>
                    <Badge variant="outline">{transaction.points} pts</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{transaction.customerId}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
