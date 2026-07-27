"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, CheckCircle2, Clock3, Filter, Loader2, Search, Table2, UserRound, XCircle } from "lucide-react";
import {
  cancelReservationAction,
  checkInReservationAction,
  completeReservationAction,
  confirmReservationAction,
} from "@/actions/reservation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatisticCard, TableShell, PageHeader, FilterBar } from "@/components/design-system";
import { SearchBar } from "@/components/design-system/inputs";
import type { ReservationFiltersInput } from "@/schemas";
import type { ReservationWithDetails, ReservationAvailabilityStatus, Table } from "@/types";

type ReservationListResult = {
  items: ReservationWithDetails[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

type ReservationsStudioProps = {
  restaurantName: string;
  tables: Table[];
  reservations: ReservationWithDetails[];
  result: ReservationListResult;
  filters: ReservationFiltersInput;
};

const FILTER_PERIODS: Array<{ value: ReservationFiltersInput["period"]; label: string }> = [
  { value: "today", label: "Hoje" },
  { value: "tomorrow", label: "Amanhã" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
];

const STATUS_FILTERS = [
  { value: "all", label: "Todas" },
  { value: "PENDING", label: "Pendentes" },
  { value: "CONFIRMED", label: "Confirmadas" },
  { value: "CANCELLED", label: "Canceladas" },
  { value: "COMPLETED", label: "Concluídas" },
  { value: "NO_SHOW", label: "No Show" },
] as const;

const ACTIVE_STATUSES: ReservationWithDetails["status"][] = ["PENDING", "CONFIRMED", "CHECKED_IN"];

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function buildQuery(current: URLSearchParams, updates: Record<string, string | number | null | undefined>) {
  const next = new URLSearchParams(current.toString());
  Object.entries(updates).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") {
      next.delete(key);
      return;
    }
    next.set(key, String(value));
  });
  return next.toString();
}

function getDateRangeLabel(period: ReservationFiltersInput["period"]) {
  switch (period) {
    case "today":
      return "Hoje";
    case "tomorrow":
      return "Amanhã";
    case "week":
      return "Semana";
    case "month":
      return "Mês";
    default:
      return "Personalizado";
  }
}

function getTableAvailability(table: Table, reservations: ReservationWithDetails[], selectedDate: string): ReservationAvailabilityStatus {
  if (!table.active) {
    return "UNAVAILABLE";
  }

  const dayReservations = reservations.filter((reservation) => reservation.reservationDate === selectedDate);
  const currentReservation = dayReservations.find((reservation) => {
    if (reservation.tableId !== table.id || !ACTIVE_STATUSES.includes(reservation.status)) return false;
    return true;
  });

  if (currentReservation?.status === "CHECKED_IN") {
    return "OCCUPIED";
  }

  if (currentReservation) {
    return "RESERVED";
  }

  const latestEnded = dayReservations
    .filter((reservation) => reservation.tableId === table.id && reservation.status === "COMPLETED")
    .sort((a, b) => toMinutes(b.reservationTime) + b.duration - (toMinutes(a.reservationTime) + a.duration))[0];

  if (latestEnded) {
    return "CLEANING";
  }

  return "FREE";
}

function getStatusColor(status: ReservationAvailabilityStatus) {
  switch (status) {
    case "FREE":
      return "secondary";
    case "RESERVED":
      return "outline";
    case "OCCUPIED":
      return "default";
    case "UNAVAILABLE":
      return "outline";
    case "CLEANING":
      return "secondary";
    default:
      return "secondary";
  }
}

function getStatusLabel(status: ReservationAvailabilityStatus) {
  switch (status) {
    case "FREE":
      return "Livre";
    case "RESERVED":
      return "Reservada";
    case "OCCUPIED":
      return "Ocupada";
    case "UNAVAILABLE":
      return "Indisponível";
    case "CLEANING":
      return "Limpeza";
    default:
      return status;
  }
}

function getReservationBadge(status: ReservationWithDetails["status"]) {
  switch (status) {
    case "PENDING":
      return "outline";
    case "CONFIRMED":
      return "secondary";
    case "CHECKED_IN":
      return "default";
    case "COMPLETED":
      return "secondary";
    case "CANCELLED":
      return "outline";
    case "NO_SHOW":
      return "outline";
    default:
      return "outline";
  }
}

export function ReservationsStudio({ restaurantName, tables, reservations, result, filters }: ReservationsStudioProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [selectedReservationId, setSelectedReservationId] = useState(result.items[0]?.id ?? reservations[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [searchValue, setSearchValue] = useState(filters.search ?? "");

  const selectedDate = filters.date ?? new Date().toISOString().slice(0, 10);
  const tableStatuses = useMemo(
    () =>
      tables.map((table) => ({
        table,
        status: getTableAvailability(table, reservations, selectedDate),
      })),
    [reservations, selectedDate, tables]
  );

  const metrics = useMemo(() => {
    const todayReservations = reservations.filter((reservation) => reservation.reservationDate === selectedDate);
    const pending = todayReservations.filter((reservation) => reservation.status === "PENDING").length;
    const confirmed = todayReservations.filter((reservation) => reservation.status === "CONFIRMED").length;
    const cancelled = todayReservations.filter((reservation) => reservation.status === "CANCELLED").length;
    const completed = todayReservations.filter((reservation) => reservation.status === "COMPLETED").length;

    return { pending, confirmed, cancelled, completed, total: todayReservations.length };
  }, [reservations, selectedDate]);

  const runStatusAction = async (
    id: string,
    action: () => Promise<{ ok: boolean; message?: string }>
  ) => {
    setPendingId(id);
    setMessage("");
    try {
      const response = await action();
      if (!response.ok) {
        setMessage(response.message ?? "Não foi possível executar a ação.");
        return;
      }
      router.refresh();
    } finally {
      setPendingId(null);
    }
  };

  const tableRows = result.items;
  const currentQuery = new URLSearchParams(searchParams.toString());
  const selectedReservation =
    reservations.find((reservation) => reservation.id === selectedReservationId) ?? result.items[0] ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reservas"
        description={`Gestão profissional de reservas, calendário e timeline do ${restaurantName}.`}
        actions={<Badge variant="secondary">{result.total} reserva(s)</Badge>}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatisticCard label="Hoje" value={String(metrics.total)} icon={<CalendarDays className="h-4 w-4" />} />
        <StatisticCard label="Pendentes" value={String(metrics.pending)} icon={<Clock3 className="h-4 w-4" />} />
        <StatisticCard label="Confirmadas" value={String(metrics.confirmed)} icon={<CheckCircle2 className="h-4 w-4" />} />
        <StatisticCard label="Canceladas" value={String(metrics.cancelled)} icon={<XCircle className="h-4 w-4" />} />
      </div>

      <FilterBar label="Filtros" actions={<Badge variant="outline">{getDateRangeLabel(filters.period)}</Badge>}>
        <form className="flex flex-wrap items-center gap-2" method="get" action={pathname}>
          <SearchBar
            name="search"
            defaultValue={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Buscar reserva, mesa, telefone ou código"
            wrapperClassName="min-w-[280px]"
          />
          <input type="hidden" name="page" value="1" />
          <input type="hidden" name="perPage" value={String(filters.perPage)} />
          <input type="hidden" name="status" value={filters.status ?? "all"} />
          <input type="hidden" name="period" value={filters.period} />
          <input type="hidden" name="view" value={filters.view} />
          <Button type="submit" variant="secondary">
            <Search className="h-4 w-4" />
            Buscar
          </Button>
        </form>
        <div className="flex flex-wrap items-center gap-2">
          {FILTER_PERIODS.map((item) => (
            <Button
              key={item.value}
              asChild
              variant={filters.period === item.value ? "default" : "outline"}
              size="sm"
            >
              <Link href={`?${buildQuery(currentQuery, { period: item.value, page: 1 })}`}>{item.label}</Link>
            </Button>
          ))}
          {STATUS_FILTERS.map((item) => (
            <Button
              key={item.value}
              asChild
              variant={filters.status === item.value ? "default" : "outline"}
              size="sm"
            >
              <Link href={`?${buildQuery(currentQuery, { status: item.value, page: 1 })}`}>{item.label}</Link>
            </Button>
          ))}
        </div>
      </FilterBar>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <TableShell
          title="Agenda"
          description="Lista paginada com ações rápidas e histórico de status."
          actions={
            <div className="flex flex-wrap gap-2">
              {["day", "week", "month"].map((view) => (
                <Button key={view} asChild variant={filters.view === view ? "default" : "outline"} size="sm">
                  <Link href={`?${buildQuery(currentQuery, { view, page: 1 })}`}>{view === "day" ? "Dia" : view === "week" ? "Semana" : "Mês"}</Link>
                </Button>
              ))}
            </div>
          }
        >
          <div className="space-y-4">
            {tableRows.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                Nenhuma reserva encontrada para os filtros atuais.
              </div>
            ) : (
              tableRows.map((reservation) => (
                <div
                  key={reservation.id}
                  className="grid gap-4 rounded-2xl border border-border/70 p-4 lg:grid-cols-[minmax(0,1fr)_auto]"
                  onClick={() => setSelectedReservationId(reservation.id)}
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold">{reservation.customerName}</h3>
                      <Badge variant={getReservationBadge(reservation.status)}>{reservation.status}</Badge>
                      <Badge variant="outline">Código {reservation.confirmationCode}</Badge>
                    </div>
                    <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2 lg:grid-cols-4">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        <span>{reservation.reservationDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4" />
                        <span>
                          {reservation.reservationTime} - {reservation.duration} min
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Table2 className="h-4 w-4" />
                        <span>Mesa {reservation.table.number}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserRound className="h-4 w-4" />
                        <span>{reservation.guests} pessoa(s)</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {reservation.customerPhone}
                      {reservation.customerEmail ? ` • ${reservation.customerEmail}` : ""}
                      {reservation.notes ? ` • ${reservation.notes}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end">
                    <Button size="sm" variant={selectedReservationId === reservation.id ? "default" : "outline"} onClick={() => setSelectedReservationId(reservation.id)}>
                      Timeline
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void runStatusAction(reservation.id, () => confirmReservationAction({ id: reservation.id }))}
                      disabled={pendingId === reservation.id}
                    >
                      {pendingId === reservation.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Confirmar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void runStatusAction(reservation.id, () => checkInReservationAction({ id: reservation.id }))}
                      disabled={pendingId === reservation.id}
                    >
                      Check-in
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void runStatusAction(reservation.id, () => completeReservationAction({ id: reservation.id }))}
                      disabled={pendingId === reservation.id}
                    >
                      Concluir
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void runStatusAction(reservation.id, () => cancelReservationAction({ id: reservation.id }))}
                      disabled={pendingId === reservation.id}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ))
            )}

            <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-4 text-sm">
              <p className="text-muted-foreground">
                Página {result.page} de {result.totalPages}
              </p>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm" disabled={result.page <= 1}>
                  <Link href={`?${buildQuery(currentQuery, { page: Math.max(result.page - 1, 1) })}`}>Anterior</Link>
                </Button>
                <Button asChild variant="outline" size="sm" disabled={result.page >= result.totalPages}>
                  <Link href={`?${buildQuery(currentQuery, { page: Math.min(result.page + 1, result.totalPages) })}`}>Próxima</Link>
                </Button>
              </div>
            </div>
            {message ? <p className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">{message}</p> : null}
          </div>
        </TableShell>

        <div className="space-y-4">
          <Card className="border-border/70 bg-gradient-to-br from-card via-card to-muted/20 shadow-[var(--shadow-soft)] backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Calendário
              </CardTitle>
              <CardDescription>Visões diária, semanal e mensal preparadas para integração futura.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {["day", "week", "month"].map((view) => (
                  <Button key={view} asChild variant={filters.view === view ? "default" : "outline"} size="sm">
                    <Link href={`?${buildQuery(currentQuery, { view, page: 1 })}`}>{view}</Link>
                  </Button>
                ))}
              </div>
              <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                {filters.view === "day" ? "Agenda diária carregada com os horários da data selecionada." : filters.view === "week" ? "Visão semanal pronta para expansão." : "Visão mensal reservada para FullCalendar."}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-gradient-to-br from-card via-card to-muted/20 shadow-[var(--shadow-soft)] backdrop-blur">
            <CardHeader>
              <CardTitle>Status das mesas</CardTitle>
              <CardDescription>Estado atual das mesas com base nas reservas do dia selecionado.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {tableStatuses.map(({ table, status }) => (
                <div key={table.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 p-3">
                  <div>
                    <p className="text-sm font-medium">Mesa {table.number}</p>
                    <p className="text-xs text-muted-foreground">Capacidade {table.capacity}</p>
                  </div>
                  <Badge variant={getStatusColor(status)}>{getStatusLabel(status)}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-gradient-to-br from-card via-card to-muted/20 shadow-[var(--shadow-soft)] backdrop-blur">
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
              <CardDescription>Histórico completo da reserva selecionada.</CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedReservation ? (
                <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                  Selecione uma reserva para ver o histórico.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-border/70 p-4">
                    <p className="text-sm font-medium">{selectedReservation.customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedReservation.confirmationCode} • Mesa {selectedReservation.table.number}
                    </p>
                  </div>
                  <div className="space-y-3">
                    {selectedReservation.history.length === 0 ? (
                      <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                        Nenhum evento registrado.
                      </div>
                    ) : (
                      selectedReservation.history.map((entry) => (
                        <div key={entry.id} className="rounded-2xl border border-border/70 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <Badge variant="secondary">{entry.action}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(entry.createdAt).toLocaleString("pt-BR")}
                            </span>
                          </div>
                          {entry.notes ? <p className="mt-2 text-sm text-muted-foreground">{entry.notes}</p> : null}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
