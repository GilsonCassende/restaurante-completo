import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FilterBar, PageHeader, StatisticCard, TableShell, Timeline } from "@/components/design-system";
import type { PaymentsDashboard } from "@/services/payments";
import type { PaymentFilterInput } from "@/schemas";
import { formatPaymentsCurrency } from "@/services/payments";
import { PaymentsCharts } from "./payments-charts";
import { PaymentsExportActions } from "./payments-export-actions";

type PaymentsStudioProps = {
  dashboard: PaymentsDashboard;
  filters: Partial<PaymentFilterInput>;
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

const PAYMENT_STATUSES = ["all", "PENDING", "AUTHORIZED", "PAID", "FAILED", "CANCELED", "REFUNDED", "PARTIALLY_REFUNDED", "CHARGEBACK"] as const;
const GATEWAYS = ["all", "STRIPE", "MERCADO_PAGO", "PAYPAL"] as const;
const METHODS = ["all", "CASH", "CREDIT_CARD", "DEBIT_CARD", "PIX", "TRANSFER", "DIGITAL_WALLET", "IN_PERSON", "QR_CODE", "PARTIAL", "SPLIT"] as const;

function buildQuery(current: Partial<PaymentFilterInput>, updates: Record<string, string | number | undefined | null>) {
  const searchParams = new URLSearchParams();
  if (current.period) searchParams.set("period", current.period);
  if (current.startDate) searchParams.set("startDate", current.startDate);
  if (current.endDate) searchParams.set("endDate", current.endDate);
  if (current.status) searchParams.set("status", current.status);
  if (current.gatewayProvider) searchParams.set("gatewayProvider", current.gatewayProvider);
  if (current.methodType) searchParams.set("methodType", current.methodType);
  Object.entries(updates).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") {
      searchParams.delete(key);
      return;
    }
    searchParams.set(key, String(value));
  });
  return searchParams.toString();
}

function statValue(value: number, currency?: string | null) {
  return formatPaymentsCurrency(value, currency ?? undefined);
}

export function PaymentsStudio({ dashboard, filters, canExport }: PaymentsStudioProps) {
  const currency = dashboard.restaurant?.currency ?? undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Operação financeira completa, com checkout inteligente, gateways desacoplados e trilha de auditoria."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{dashboard.period.label}</Badge>
            <PaymentsExportActions filters={filters} disabled={!canExport} />
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
          <input type="hidden" name="status" value={filters.status ?? "all"} />
          <input type="hidden" name="gatewayProvider" value={filters.gatewayProvider ?? "all"} />
          <input type="hidden" name="methodType" value={filters.methodType ?? "all"} />
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
        {PAYMENT_STATUSES.map((status) => (
          <Button key={status} asChild variant={(filters.status ?? "all") === status ? "default" : "outline"} size="sm">
            <Link href={`?${buildQuery(filters, { status })}`}>{status === "all" ? "Todos os status" : status}</Link>
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {GATEWAYS.map((gatewayProvider) => (
          <Button key={gatewayProvider} asChild variant={(filters.gatewayProvider ?? "all") === gatewayProvider ? "default" : "outline"} size="sm">
            <Link href={`?${buildQuery(filters, { gatewayProvider })}`}>{gatewayProvider === "all" ? "Todos os gateways" : gatewayProvider}</Link>
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {METHODS.map((methodType) => (
          <Button key={methodType} asChild variant={(filters.methodType ?? "all") === methodType ? "default" : "outline"} size="sm">
            <Link href={`?${buildQuery(filters, { methodType })}`}>{methodType === "all" ? "Todos os métodos" : methodType}</Link>
          </Button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatisticCard label="Receita hoje" value={statValue(dashboard.kpis.revenueToday, currency)} />
        <StatisticCard label="Receita semana" value={statValue(dashboard.kpis.revenueWeek, currency)} />
        <StatisticCard label="Receita mês" value={statValue(dashboard.kpis.revenueMonth, currency)} />
        <StatisticCard label="Receita ano" value={statValue(dashboard.kpis.revenueYear, currency)} />
        <StatisticCard label="Ticket médio" value={statValue(dashboard.kpis.averageTicket, currency)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatisticCard label="Pendentes" value={String(dashboard.kpis.pendingPayments)} />
        <StatisticCard label="Aprovados" value={String(dashboard.kpis.approvedPayments)} />
        <StatisticCard label="Recusados" value={String(dashboard.kpis.declinedPayments)} />
        <StatisticCard label="Chargebacks" value={String(dashboard.kpis.chargebacks)} />
        <StatisticCard label="Reembolsos" value={String(dashboard.kpis.refunds)} />
      </div>

      <PaymentsCharts trends={dashboard.trends} currency={currency} />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/70 bg-card/90 shadow-[var(--shadow-soft)]">
          <CardContent className="space-y-4 p-5">
            <div>
              <h3 className="text-base font-semibold">Checkout inteligente</h3>
              <p className="text-sm text-muted-foreground">Resumo consolidado para validar cobrança, troco e taxas.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                ["Subtotal", dashboard.checkout.subtotal],
                ["Taxa", dashboard.checkout.tax],
                ["Desconto", dashboard.checkout.discount],
                ["Cupom", dashboard.checkout.couponDiscount],
                ["Cashback", dashboard.checkout.cashbackDiscount],
                ["Taxa de entrega", dashboard.checkout.deliveryFee],
                ["Taxa de serviço", dashboard.checkout.serviceFee],
                ["Gorjeta", dashboard.checkout.tip],
                ["Total", dashboard.checkout.total],
                ["Pago", dashboard.checkout.paidAmount],
                ["Troco", dashboard.checkout.changeAmount],
              ].map(([label, value]) => (
                <div key={label as string} className="rounded-2xl bg-muted/40 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
                  <p className="mt-2 text-2xl font-semibold">{statValue(Number(value), currency)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <TableShell title="Ranking operacional" description="Gateways e métodos que mais concentram receita.">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Gateways</p>
              {dashboard.rankings.topGateways.map((item) => (
                <div key={item.label} className="rounded-2xl border border-border/70 p-3">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{statValue(item.value, currency)}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Métodos</p>
              {dashboard.rankings.topMethods.map((item) => (
                <div key={item.label} className="rounded-2xl border border-border/70 p-3">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{statValue(item.value, currency)}</p>
                </div>
              ))}
            </div>
          </div>
        </TableShell>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <TableShell title="Pagamentos" description="Últimas transações com status, método e gateway.">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="pb-3 pr-4 font-medium">Pagamento</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Método</th>
                  <th className="pb-3 pr-4 font-medium">Gateway</th>
                  <th className="pb-3 pr-4 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.payments.slice(0, 10).map((payment) => (
                  <tr key={payment.id} className="border-t border-border/70">
                    <td className="py-4 pr-4">
                      <p className="font-medium">{payment.reference ?? payment.id.slice(-8)}</p>
                      <p className="text-xs text-muted-foreground">{payment.createdAt.toISOString().slice(0, 10)}</p>
                    </td>
                    <td className="py-4 pr-4"><Badge variant="secondary">{payment.status}</Badge></td>
                    <td className="py-4 pr-4">{dashboard.paymentMethods.find((method) => method.id === payment.paymentMethodId)?.name ?? payment.paymentMethodId}</td>
                    <td className="py-4 pr-4">{payment.gatewayProvider}</td>
                    <td className="py-4 pr-4">{statValue(payment.total, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TableShell>

        <TableShell title="Invoices" description="Faturas geradas e acompanhadas pelo módulo financeiro.">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="pb-3 pr-4 font-medium">Número</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Total</th>
                  <th className="pb-3 pr-4 font-medium">Criado em</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.invoices.slice(0, 10).map((invoice) => (
                  <tr key={invoice.id} className="border-t border-border/70">
                    <td className="py-4 pr-4 font-medium">{invoice.number}</td>
                    <td className="py-4 pr-4"><Badge variant="secondary">{invoice.status}</Badge></td>
                    <td className="py-4 pr-4">{statValue(invoice.total, currency)}</td>
                    <td className="py-4 pr-4">{invoice.createdAt.toISOString().slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TableShell>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <TableShell title="Reembolsos" description="Histórico de reembolsos aprovados e processados.">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="pb-3 pr-4 font-medium">Tipo</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Valor</th>
                  <th className="pb-3 pr-4 font-medium">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.refunds.slice(0, 10).map((refund) => (
                  <tr key={refund.id} className="border-t border-border/70">
                    <td className="py-4 pr-4">{refund.type}</td>
                    <td className="py-4 pr-4"><Badge variant="secondary">{refund.status}</Badge></td>
                    <td className="py-4 pr-4">{statValue(refund.amount, currency)}</td>
                    <td className="py-4 pr-4">{refund.reason ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TableShell>

        <TableShell title="Auditoria" description="Eventos de gateway, webhooks e linhas de tempo recentes.">
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
        <TableShell title="Gateway Logs" description="Payloads, respostas e tempos de processamento.">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="pb-3 pr-4 font-medium">Gateway</th>
                  <th className="pb-3 pr-4 font-medium">Ação</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Tempo</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.gatewayLogs.slice(0, 8).map((log) => (
                  <tr key={log.id} className="border-t border-border/70">
                    <td className="py-4 pr-4">{log.gatewayProvider}</td>
                    <td className="py-4 pr-4">{log.action}</td>
                    <td className="py-4 pr-4"><Badge variant={log.status === "FAILED" ? "default" : log.status === "RETRYING" ? "outline" : "secondary"}>{log.status}</Badge></td>
                    <td className="py-4 pr-4">{log.durationMs}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TableShell>

        <TableShell title="Webhooks" description="Eventos recebidos dos gateways com status de processamento.">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="pb-3 pr-4 font-medium">Evento</th>
                  <th className="pb-3 pr-4 font-medium">Gateway</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Processado</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.webhookEvents.slice(0, 8).map((event) => (
                  <tr key={event.id} className="border-t border-border/70">
                    <td className="py-4 pr-4">{event.eventType}</td>
                    <td className="py-4 pr-4">{event.gatewayProvider}</td>
                    <td className="py-4 pr-4"><Badge variant={event.status === "FAILED" ? "default" : event.status === "RETRYING" ? "outline" : "secondary"}>{event.status}</Badge></td>
                    <td className="py-4 pr-4">{event.processedAt ? event.processedAt.toISOString().slice(0, 10) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TableShell>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-border/70 bg-card/90 shadow-[var(--shadow-soft)]">
          <CardContent className="space-y-4 p-5">
            <div>
              <h3 className="text-base font-semibold">Insights automáticos</h3>
              <p className="text-sm text-muted-foreground">Leitura estratégica dos KPIs financeiros.</p>
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

        <Card className="border-border/70 bg-card/90 shadow-[var(--shadow-soft)]">
          <CardContent className="space-y-4 p-5">
            <div>
              <h3 className="text-base font-semibold">Alertas</h3>
              <p className="text-sm text-muted-foreground">Sinais operacionais e financeiros para acompanhamento.</p>
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
      </div>
    </div>
  );
}
