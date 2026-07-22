import type { DeliveryDashboard } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard, TableShell, Timeline } from "@/components/design-system";

type TrackingStudioProps = {
  dashboard: DeliveryDashboard;
};

export function TrackingStudio({ dashboard }: TrackingStudioProps) {
  const activeRoute = dashboard.routes[0] ?? null;
  const liveEvent = dashboard.trackingEvents[0] ?? null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Eventos" value={String(dashboard.trackingEvents.length)} detail="Timeline operacional preparada" />
        <MetricCard label="Rotas" value={String(dashboard.routes.length)} detail="Providers desacoplados" />
        <MetricCard label="Zonas monitoradas" value={String(dashboard.zones.length)} />
        <MetricCard label="Entrega em andamento" value={String(dashboard.dispatches.filter((dispatch) => dispatch.status === "OUT_FOR_DELIVERY").length)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/70 bg-card/90 shadow-[var(--shadow-soft)]">
          <CardHeader>
            <CardTitle>Mapa preparado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative overflow-hidden rounded-[1.75rem] border border-border/70 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_45%),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.35))] p-6">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:36px_36px] opacity-60" />
              <div className="relative space-y-4">
                <Badge variant="secondary">{dashboard.settings.mapProvider}</Badge>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl bg-card/90 p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Rota ativa</p>
                    <p className="mt-2 font-semibold">{activeRoute ? `${activeRoute.distanceKm} km` : "Sem rota"}</p>
                  </div>
                  <div className="rounded-2xl bg-card/90 p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">ETA</p>
                    <p className="mt-2 font-semibold">{activeRoute?.etaAt ? activeRoute.etaAt.toLocaleTimeString("pt-AO") : "N/D"}</p>
                  </div>
                  <div className="rounded-2xl bg-card/90 p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Localização</p>
                    <p className="mt-2 font-semibold">{liveEvent?.latitude?.toFixed(4) ?? "-"}, {liveEvent?.longitude?.toFixed(4) ?? "-"}</p>
                  </div>
                </div>
                <div className="relative h-72 overflow-hidden rounded-[1.5rem] border border-border/70 bg-background/80">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_30%,rgba(59,130,246,0.18),transparent_0),radial-gradient(circle_at_75%_70%,rgba(16,185,129,0.18),transparent_0)]" />
                  <div className="absolute left-8 top-12 h-4 w-4 rounded-full bg-sky-500 shadow-[0_0_0_14px_rgba(14,165,233,0.14)]" />
                  <div className="absolute right-10 top-20 h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_0_10px_rgba(16,185,129,0.14)]" />
                  <div className="absolute bottom-10 left-1/2 h-5 w-5 rounded-full bg-amber-500 shadow-[0_0_0_14px_rgba(245,158,11,0.16)]" />
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  Arquitetura pronta para Google Maps, Mapbox e OpenStreetMap com providers desacoplados e dados simulados nesta fase.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <TableShell title="Tracking" description="Eventos e situação atual do rastreamento.">
          <Timeline
            items={dashboard.timeline.slice(0, 8).map((item) => ({
              title: item.title,
              description: item.description,
              meta: item.meta,
            }))}
          />
        </TableShell>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <TableShell title="Zonas" description="Cobertura atual da operação de delivery.">
          <div className="space-y-3">
            {dashboard.zones.map((zone) => (
              <div key={zone.id} className="rounded-2xl border border-border/70 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{zone.name}</p>
                  <Badge variant={zone.active ? "secondary" : "outline"}>{zone.type}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {zone.description ?? "Zona pronta para integração futura com mapas em tempo real."}
                </p>
              </div>
            ))}
          </div>
        </TableShell>

        <TableShell title="Eventos recentes" description="Histórico operacional preparado para realtime.">
          <div className="space-y-3">
            {dashboard.trackingEvents.slice(0, 6).map((event) => (
              <div key={event.id} className="rounded-2xl border border-border/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{event.title}</p>
                  <Badge variant="outline">{event.type}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{event.description}</p>
                <p className="mt-2 text-xs text-muted-foreground">{event.createdAt.toLocaleString("pt-AO")}</p>
              </div>
            ))}
          </div>
        </TableShell>
      </div>
    </div>
  );
}
