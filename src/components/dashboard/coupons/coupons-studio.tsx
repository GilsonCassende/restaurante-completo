import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader, StatisticCard, TableShell, FilterBar } from "@/components/design-system";
import type { CouponDashboard } from "@/services/coupons";
import type { CouponFilterInput } from "@/schemas";

type CouponsStudioProps = {
  dashboard: CouponDashboard;
  filters: Partial<CouponFilterInput>;
  page: number;
  totalPages: number;
  total: number;
};

function buildQuery(current: Partial<CouponFilterInput>, updates: Record<string, string | number | undefined | null>) {
  const searchParams = new URLSearchParams();
  if (current.search) searchParams.set("search", current.search);
  if (current.type && current.type !== "all") searchParams.set("type", current.type);
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

const TYPES = [
  { value: "all", label: "Todos" },
  { value: "PERCENTAGE", label: "Percentual" },
  { value: "FIXED", label: "Valor fixo" },
  { value: "FREE_SHIPPING", label: "Frete grátis" },
  { value: "FIRST_PURCHASE", label: "Primeira compra" },
  { value: "BIRTHDAY", label: "Aniversário" },
  { value: "SEGMENT", label: "Segmento" },
  { value: "PERIOD", label: "Período" },
] as const;

export function CouponsStudio({ dashboard, filters, page, totalPages, total }: CouponsStudioProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Cupons"
        description="Geração, validação e rastreamento de cupons por tipo e período."
        actions={<Badge variant="secondary">{total} cupom(ns)</Badge>}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatisticCard label="Cupons" value={String(dashboard.kpis.coupons)} />
        <StatisticCard label="Ativos" value={String(dashboard.kpis.activeCoupons)} />
        <StatisticCard label="Usados" value={String(dashboard.kpis.usedCoupons)} />
        <StatisticCard label="Desconto total" value={new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA", maximumFractionDigits: 0 }).format(dashboard.kpis.totalDiscount)} />
      </div>

      <FilterBar label="Filtros" actions={<Badge variant="outline">Página {page} de {totalPages}</Badge>}>
        <div className="grid gap-3 lg:grid-cols-3">
          <form className="lg:col-span-2 flex gap-2" method="get">
            <Input name="search" defaultValue={filters.search ?? ""} placeholder="Pesquisar por código ou nome" className="rounded-full" />
            <input type="hidden" name="type" value={filters.type ?? "all"} />
            <Button type="submit">Pesquisar</Button>
          </form>
          <div className="flex flex-wrap gap-2">
            {TYPES.slice(1).map((type) => (
              <Button key={type.value} asChild variant={filters.type === type.value ? "default" : "outline"}>
                <Link href={`?${buildQuery(filters, { type: type.value, page: 1 })}`}>{type.label}</Link>
              </Button>
            ))}
          </div>
        </div>
      </FilterBar>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.95fr]">
        <TableShell title="Cupons" description="Regras, validade e limites de uso.">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="pb-3 pr-4 font-medium">Cupom</th>
                  <th className="pb-3 pr-4 font-medium">Tipo</th>
                  <th className="pb-3 pr-4 font-medium">Valor</th>
                  <th className="pb-3 pr-4 font-medium">Usos</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.coupons.map((coupon) => (
                  <tr key={coupon.id} className="border-t border-border/70">
                    <td className="py-4 pr-4">
                      <div className="space-y-1">
                        <p className="font-medium">{coupon.code}</p>
                        <p className="text-xs text-muted-foreground">{coupon.name}</p>
                      </div>
                    </td>
                    <td className="py-4 pr-4"><Badge variant="secondary">{coupon.type}</Badge></td>
                    <td className="py-4 pr-4">{coupon.value}</td>
                    <td className="py-4 pr-4">{coupon.usedCount}</td>
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
              <h3 className="text-base font-semibold">Validações</h3>
              <p className="text-sm text-muted-foreground">Limites e regras preparados para checkout.</p>
            </div>
            <div className="space-y-3 text-sm">
              <p>• Data de início e fim.</p>
              <p>• Uso máximo por cupom e por cliente.</p>
              <p>• Valor mínimo de pedido.</p>
              <p>• Expiração e cupom duplicado.</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Últimos usos</p>
              {dashboard.usages.slice(0, 5).map((usage) => (
                <div key={usage.id} className="rounded-2xl border border-border/70 p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span>{usage.discountAmount}</span>
                    <Badge variant="outline">{usage.usedAt.toLocaleDateString("pt-BR")}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{usage.couponId}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
