import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader, StatisticCard, TableShell, FilterBar } from "@/components/design-system";
import type { CrmDashboard } from "@/services/crm";
import type { CustomerFilterInput } from "@/schemas";

type CrmStudioProps = {
  dashboard: CrmDashboard;
  filters: Partial<CustomerFilterInput>;
  page: number;
  totalPages: number;
  total: number;
};

const SEGMENTS = [
  { value: "all", label: "Todos" },
  { value: "new", label: "Novo cliente" },
  { value: "recurring", label: "Recorrente" },
  { value: "vip", label: "VIP" },
  { value: "inactive", label: "Inativo" },
  { value: "birthday", label: "Aniversariante" },
  { value: "high-value", label: "Alto gasto" },
  { value: "low-value", label: "Baixo gasto" },
] as const;

function buildQuery(current: Partial<CustomerFilterInput>, updates: Record<string, string | number | undefined | null>) {
  const searchParams = new URLSearchParams();
  if (current.search) searchParams.set("search", current.search);
  if (current.status && current.status !== "all") searchParams.set("status", current.status);
  if (current.segment && current.segment !== "all") searchParams.set("segment", current.segment);
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

export function CrmStudio({ dashboard, filters, page, totalPages, total }: CrmStudioProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM"
        description={`Visão 360° de clientes, segmentos, campanha e relacionamento do ${dashboard.restaurant?.name ?? "restaurante"}.`}
        actions={<Badge variant="secondary">{total} cliente(s)</Badge>}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatisticCard label="Clientes" value={String(dashboard.kpis.customers)} />
        <StatisticCard label="Ativos" value={String(dashboard.kpis.activeCustomers)} />
        <StatisticCard label="VIP" value={String(dashboard.kpis.vipCustomers)} />
        <StatisticCard label="Ticket médio" value={new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA", maximumFractionDigits: 0 }).format(dashboard.kpis.averageTicket)} />
      </div>

      <FilterBar label="Filtros" actions={<Badge variant="outline">Página {page} de {totalPages}</Badge>}>
        <div className="grid gap-3 lg:grid-cols-3">
          <form className="lg:col-span-2 flex gap-2" method="get">
            <Input name="search" defaultValue={filters.search ?? ""} placeholder="Pesquisar cliente, telefone ou e-mail" className="rounded-full" />
            <input type="hidden" name="status" value={filters.status ?? "all"} />
            <input type="hidden" name="segment" value={filters.segment ?? "all"} />
            <Button type="submit">Pesquisar</Button>
          </form>
          <div className="flex flex-wrap gap-2">
            {SEGMENTS.map((segment) => (
              <Button key={segment.value} asChild variant={filters.segment === segment.value ? "default" : "outline"}>
                <Link href={`?${buildQuery(filters, { segment: segment.value, page: 1 })}`}>{segment.label}</Link>
              </Button>
            ))}
          </div>
        </div>
      </FilterBar>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <TableShell
          title="Clientes"
          description="Base de clientes com histórico e potencial de engajamento."
          actions={<Badge variant="outline">{dashboard.customers.length} carregados</Badge>}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="pb-3 pr-4 font-medium">Cliente</th>
                  <th className="pb-3 pr-4 font-medium">Contato</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Gasto</th>
                  <th className="pb-3 pr-4 font-medium">Última visita</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.customers.map((customer) => (
                  <tr key={customer.id} className="border-t border-border/70">
                    <td className="py-4 pr-4">
                      <div className="space-y-1">
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">{customer.tagsLabel}</p>
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-muted-foreground">
                      <div className="space-y-1">
                        <p>{customer.phone}</p>
                        <p>{customer.email ?? "Sem email"}</p>
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <Badge variant={customer.status === "VIP" ? "default" : customer.status === "INACTIVE" ? "outline" : "secondary"}>{customer.status}</Badge>
                    </td>
                    <td className="py-4 pr-4">{customer.spendLabel}</td>
                    <td className="py-4 pr-4 text-muted-foreground">{customer.lastVisitLabel}</td>
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

        <div className="space-y-6">
          <Card className="border-border/70 bg-card/90 shadow-[var(--shadow-soft)]">
            <CardContent className="space-y-4 p-5">
              <div>
                <h3 className="text-base font-semibold">Campanhas</h3>
                <p className="text-sm text-muted-foreground">Estrutura preparada para WhatsApp, email, SMS e push.</p>
              </div>
              <div className="space-y-3">
                {dashboard.campaigns.length ? dashboard.campaigns.map((campaign) => (
                  <div key={campaign.id} className="rounded-2xl border border-border/70 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{campaign.name}</p>
                      <Badge variant="outline">{campaign.status}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{campaign.channel}</p>
                    <p className="text-xs text-muted-foreground">Destinatários: {campaign.totalRecipients} | Entregues: {campaign.totalDelivered}</p>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground">Nenhuma campanha criada ainda.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/90 shadow-[var(--shadow-soft)]">
            <CardContent className="space-y-4 p-5">
              <div>
                <h3 className="text-base font-semibold">Timeline</h3>
                <p className="text-sm text-muted-foreground">Interações e entregas mais recentes.</p>
              </div>
              <div className="space-y-3">
                {dashboard.recipients.length ? dashboard.recipients.slice(0, 5).map((recipient) => (
                  <div key={recipient.id} className="rounded-2xl bg-muted/40 p-3 text-sm">
                    <p className="font-medium">{recipient.status}</p>
                    <p className="text-xs text-muted-foreground">{recipient.customerId}</p>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground">Sem eventos de campanha por enquanto.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
