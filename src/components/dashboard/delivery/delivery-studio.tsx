import type { DeliveryDashboard } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard, TableShell, Timeline } from "@/components/design-system";

type DeliveryStudioProps = {
  dashboard: DeliveryDashboard;
};

function percentWidth(value: number, max: number) {
  if (max <= 0) return "0%";
  return `${Math.max(Math.min((value / max) * 100, 100), 4)}%`;
}

function Bars({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; value: number }>;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <Card className="border-border/70 bg-card/90 shadow-[var(--shadow-soft)]">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div key={item.label} className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium">{item.label}</span>
              <span className="text-muted-foreground">{item.value}</span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500" style={{ width: percentWidth(item.value, max) }} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function DeliveryStudio({ dashboard }: DeliveryStudioProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{dashboard.settings.defaultDispatchMode}</Badge>
        <Badge variant="outline">{dashboard.settings.mapProvider}</Badge>
        <Badge variant="outline">{dashboard.settings.preparedForRealtimeTracking ? "Realtime ready" : "Realtime off"}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Pedidos em entrega" value={String(dashboard.kpis.ordersInDelivery)} detail="Filas ativas no momento" />
        <MetricCard label="Tempo médio" value={`${dashboard.kpis.averageDeliveryTimeMinutes} min`} detail="Média dos concluídos" />
        <MetricCard label="Entregas concluídas" value={String(dashboard.kpis.completedDeliveries)} detail="Finalizações confirmadas" />
        <MetricCard label="Atrasos" value={String(dashboard.kpis.lateDeliveries)} detail="ETA acima do previsto" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Cancelamentos" value={String(dashboard.kpis.cancellations)} />
        <MetricCard label="Top entregador" value={dashboard.kpis.topDriverName ?? "N/D"} detail="Maior volume operacional" />
        <MetricCard label="Taxa média" value={`${dashboard.kpis.averageDeliveryFee} AOA`} detail="Estimativa por frete" />
        <MetricCard label="Receita Delivery" value={`${dashboard.kpis.revenueDelivery} AOA`} detail="Base simulada" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Bars title="Entregas por dia" items={dashboard.charts.deliveriesByDay} />
        <Bars title="Tempo médio" items={dashboard.charts.averageTime} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Bars title="Entregadores" items={dashboard.charts.drivers} />
        <Bars title="Zonas" items={dashboard.charts.zones} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <TableShell title="Despachos" description="Fila e status de entrega simulada.">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="pb-3 pr-4 font-medium">Pedido</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Modo</th>
                  <th className="pb-3 pr-4 font-medium">Fila</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.dispatches.map((dispatch) => (
                  <tr key={dispatch.id} className="border-t border-border/70">
                    <td className="py-3 pr-4 font-medium">{dispatch.orderId.slice(0, 8)}</td>
                    <td className="py-3 pr-4"><Badge variant={dispatch.status === "DELIVERED" ? "secondary" : "outline"}>{dispatch.status}</Badge></td>
                    <td className="py-3 pr-4">{dispatch.mode}</td>
                    <td className="py-3 pr-4">{dispatch.queuePosition}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TableShell>

        <TableShell title="Linha do tempo" description="Eventos recentes do fluxo delivery.">
          <Timeline
            items={dashboard.timeline.slice(0, 6).map((item) => ({
              title: item.title,
              description: item.description,
              meta: item.meta,
            }))}
          />
        </TableShell>
      </div>
    </div>
  );
}
