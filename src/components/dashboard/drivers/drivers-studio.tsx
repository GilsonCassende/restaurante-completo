import type { DeliveryDashboard } from "@/types";
import { Badge } from "@/components/ui/badge";
import { MetricCard, TableShell } from "@/components/design-system";

type DriversStudioProps = {
  dashboard: DeliveryDashboard;
};

function percentWidth(value: number, max: number) {
  if (max <= 0) return "0%";
  return `${Math.max(Math.min((value / max) * 100, 100), 4)}%`;
}

export function DriversStudio({ dashboard }: DriversStudioProps) {
  const maxDeliveries = Math.max(...dashboard.drivers.map((driver) => driver.totalDeliveries), 1);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Entregadores" value={String(dashboard.drivers.length)} detail="Cadastro ativo por restaurante" />
        <MetricCard label="Disponíveis" value={String(dashboard.drivers.filter((driver) => driver.status === "AVAILABLE").length)} />
        <MetricCard label="Ocupados" value={String(dashboard.drivers.filter((driver) => driver.status === "BUSY" || driver.status === "IN_DELIVERY").length)} />
        <MetricCard label="Offline" value={String(dashboard.drivers.filter((driver) => driver.status === "OFFLINE").length)} />
      </div>

      <TableShell title="Entregadores" description="Estado operacional e produtividade por entregador.">
        <div className="space-y-4">
          {dashboard.drivers.map((driver) => (
            <div key={driver.id} className="rounded-2xl border border-border/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{driver.name}</p>
                  <p className="text-sm text-muted-foreground">{driver.phone}</p>
                </div>
                <Badge variant={driver.status === "AVAILABLE" ? "secondary" : driver.status === "OFFLINE" ? "outline" : "default"}>{driver.status}</Badge>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div className="rounded-2xl bg-muted/40 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Entregas</p>
                  <p className="mt-2 text-lg font-semibold">{driver.totalDeliveries}</p>
                </div>
                <div className="rounded-2xl bg-muted/40 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Distância</p>
                  <p className="mt-2 text-lg font-semibold">{Math.round(driver.totalDistanceKm)} km</p>
                </div>
                <div className="rounded-2xl bg-muted/40 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Nota</p>
                  <p className="mt-2 text-lg font-semibold">{driver.rating.toFixed(1)}</p>
                </div>
              </div>
              <div className="mt-3 h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-gradient-to-r from-amber-500 to-rose-500" style={{ width: percentWidth(driver.totalDeliveries, maxDeliveries) }} />
              </div>
            </div>
          ))}
        </div>
      </TableShell>

      <TableShell title="Escalas" description="Planejamento operacional dos turnos.">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="pb-3 pr-4 font-medium">Entregador</th>
                <th className="pb-3 pr-4 font-medium">Início</th>
                <th className="pb-3 pr-4 font-medium">Fim</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.shifts.map((shift) => {
                const driver = dashboard.drivers.find((item) => item.id === shift.driverId);
                return (
                  <tr key={shift.id} className="border-t border-border/70">
                    <td className="py-3 pr-4 font-medium">{driver?.name ?? shift.driverId.slice(0, 8)}</td>
                    <td className="py-3 pr-4">{shift.startAt.toLocaleString("pt-AO")}</td>
                    <td className="py-3 pr-4">{shift.endAt.toLocaleString("pt-AO")}</td>
                    <td className="py-3 pr-4"><Badge variant={shift.status === "ACTIVE" ? "secondary" : "outline"}>{shift.status}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </TableShell>
    </div>
  );
}

