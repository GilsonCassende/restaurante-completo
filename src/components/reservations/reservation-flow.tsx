"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, Loader2, MapPin, MessageSquareText, PartyPopper, PhoneCall, Sparkles, Table2, Users } from "lucide-react";
import { createReservationAction } from "@/actions/reservation";
import { useReservationWizard } from "@/hooks/reservations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ReservationWithDetails, Restaurant, Table } from "@/types";
import { cn } from "@/lib/utils";

type ReservationFlowProps = {
  restaurant: Restaurant;
  tables: Table[];
  reservations: ReservationWithDetails[];
};

const TIME_STEP_MINUTES = 30;

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function fromMinutes(value: number) {
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

function buildWeekdayKey(date: string, timeZone?: string | null) {
  const parsed = new Date(`${date}T12:00:00.000Z`);
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: timeZone ?? undefined, weekday: "long" }).format(parsed).toLowerCase();
  } catch {
    return ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][parsed.getUTCDay()];
  }
}

function getSchedule(restaurant: Restaurant, date: string) {
  if (restaurant.isOpen === false) return null;

  const holiday = restaurant.holidays?.find((item) => item.date === date && item.closed);
  if (holiday) return null;

  const weekday = buildWeekdayKey(date, restaurant.timezone);
  const schedule = restaurant.weeklyHours?.find((item) => item.day === weekday);
  if (!schedule || schedule.closed) return null;

  return {
    open: schedule.open || "00:00",
    close: schedule.close || "23:59",
  };
}

function isActiveReservation(reservation: ReservationWithDetails) {
  return ["PENDING", "CONFIRMED", "CHECKED_IN"].includes(reservation.status);
}

function getReservationWindow(reservation: ReservationWithDetails) {
  const start = toMinutes(reservation.reservationTime);
  return {
    start,
    end: start + reservation.duration,
  };
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

function buildSlots(open: string, close: string) {
  const slots: string[] = [];
  for (let minute = toMinutes(open); minute < toMinutes(close); minute += TIME_STEP_MINUTES) {
    slots.push(fromMinutes(minute));
  }
  return slots;
}

function tableStatusLabel(table: Table, reservations: ReservationWithDetails[], selectedDate: string, selectedTime: string) {
  if (!table.active) return "Indisponível";

  const selectedMinute = selectedTime ? toMinutes(selectedTime) : null;
  const activeReservation = reservations.find((reservation) => {
    if (reservation.tableId !== table.id || reservation.reservationDate !== selectedDate || !isActiveReservation(reservation)) {
      return false;
    }

    if (selectedMinute === null) return true;
    const window = getReservationWindow(reservation);
    return overlaps(selectedMinute, selectedMinute + TIME_STEP_MINUTES, window.start, window.end);
  });

  if (activeReservation?.status === "CHECKED_IN") return "Ocupada";
  if (activeReservation) return "Reservada";

  return "Livre";
}

export function ReservationFlow({ restaurant, tables, reservations }: ReservationFlowProps) {
  const wizard = useReservationWizard({
    reservationDate: new Date().toISOString().slice(0, 10),
    reservationTime: "12:00",
  });
  const [resultMessage, setResultMessage] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const [emailPreview, setEmailPreview] = useState<{ subject: string; body: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const schedule = useMemo(() => getSchedule(restaurant, wizard.state.reservationDate), [restaurant, wizard.state.reservationDate]);
  const dayReservations = useMemo(
    () => reservations.filter((reservation) => reservation.reservationDate === wizard.state.reservationDate),
    [reservations, wizard.state.reservationDate]
  );

  const slots = useMemo(() => {
    if (!schedule) return [];

    const reservedMinutes = dayReservations.filter(isActiveReservation).flatMap((reservation) => {
      const window = getReservationWindow(reservation);
      return Array.from({ length: Math.ceil(window.end - window.start) }, (_, index) => window.start + index);
    });

    return buildSlots(schedule.open, schedule.close).filter((slot) => {
      const slotMinute = toMinutes(slot);
      return !reservedMinutes.includes(slotMinute);
    });
  }, [dayReservations, schedule]);

  const availableTables = useMemo(() => {
    return tables.filter((table) => {
      if (!table.active) return false;
      if (table.capacity < wizard.state.guests) return false;
      const status = tableStatusLabel(table, dayReservations, wizard.state.reservationDate, wizard.state.reservationTime);
      return status === "Livre";
    });
  }, [dayReservations, tables, wizard.state.guests, wizard.state.reservationDate, wizard.state.reservationTime]);

  const canReview =
    wizard.state.reservationDate &&
    wizard.state.reservationTime &&
    wizard.state.guests > 0 &&
    wizard.state.tableId &&
    wizard.state.customerName.trim() &&
    wizard.state.customerPhone.trim();

  const submit = async () => {
    setSubmitting(true);
    setResultMessage("");
    setWhatsappUrl(null);
    setEmailPreview(null);

    try {
      const response = await createReservationAction({
        restaurantId: restaurant.id,
        tableId: wizard.state.tableId,
        customerName: wizard.state.customerName,
        customerPhone: wizard.state.customerPhone,
        customerEmail: wizard.state.customerEmail || undefined,
        guests: wizard.state.guests,
        reservationDate: wizard.state.reservationDate,
        reservationTime: wizard.state.reservationTime,
        duration: 90,
        notes: wizard.state.notes || undefined,
        source: "WEBSITE",
      });

      if (!response.ok) {
        setResultMessage(response.message);
        return;
      }

      setResultMessage("Reserva criada com sucesso.");
      setWhatsappUrl(response.data.whatsappUrl);
      setEmailPreview(response.data.emailPreview);
      wizard.goToStep("complete");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card className="border-border/70 bg-card/90 shadow-sm backdrop-blur">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
              <CardTitle className="text-2xl">Reservar mesa</CardTitle>
              <CardDescription>
                Escolha o horário, informe a quantidade de pessoas e finalize a reserva com mensagem automática.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="rounded-full px-4 py-1">
              Fluxo completo
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 md:grid-cols-5">
            {[
              { id: "intro", label: "Início" },
              { id: "schedule", label: "Horário" },
              { id: "seats", label: "Pessoas" },
              { id: "review", label: "Mesa" },
              { id: "complete", label: "Confirmação" },
            ].map((item, index) => (
              <Button
                key={item.id}
                type="button"
                variant={wizard.state.step === item.id ? "default" : "outline"}
                size="sm"
                onClick={() => wizard.goToStep(item.id as typeof wizard.state.step)}
                className={cn("justify-start", index > 0 && "md:justify-center")}
              >
                {item.label}
              </Button>
            ))}
          </div>

          {wizard.state.step === "intro" ? (
            <div className="grid gap-4 rounded-[1.6rem] border border-border/70 bg-[image:var(--gradient-surface)] p-6">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">Reservas premium</p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  { icon: Clock3, title: "Horário", description: "Respeito ao funcionamento do restaurante e à duração escolhida." },
                  { icon: Users, title: "Capacidade", description: "A mesa precisa comportar a quantidade de pessoas informada." },
                  { icon: CheckCircle2, title: "Confirmação", description: "Mensagem automática pronta para WhatsApp e e-mail." },
                ].map((feature) => (
                  <div key={feature.title} className="rounded-2xl border border-border/70 bg-background/80 p-4">
                    <feature.icon className="h-5 w-5 text-primary" />
                    <h3 className="mt-3 font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={wizard.nextStep}>
                  <PartyPopper className="h-4 w-4" />
                  Começar reserva
                </Button>
                <Button asChild variant="outline">
                  <Link href="/">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar à landing
                  </Link>
                </Button>
              </div>
            </div>
          ) : null}

          {wizard.state.step === "schedule" ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="reservation-date" className="text-sm font-medium">
                    Data
                  </label>
                  <Input
                    id="reservation-date"
                    type="date"
                    value={wizard.state.reservationDate}
                    onChange={(event) => wizard.setReservationDate(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="reservation-time" className="text-sm font-medium">
                    Horário
                  </label>
                  <Input
                    id="reservation-time"
                    type="time"
                    value={wizard.state.reservationTime}
                    onChange={(event) => wizard.setReservationTime(event.target.value)}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Clock3 className="h-4 w-4 text-primary" />
                  Horários sugeridos
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {slots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Selecione uma data válida para ver os horários disponíveis.</p>
                  ) : (
                    slots.map((slot) => (
                      <Button
                        key={slot}
                        type="button"
                        variant={wizard.state.reservationTime === slot ? "default" : "outline"}
                        size="sm"
                        onClick={() => wizard.setReservationTime(slot)}
                      >
                        {slot}
                      </Button>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={wizard.prevStep}>
                  Voltar
                </Button>
                <Button type="button" onClick={wizard.nextStep} disabled={!wizard.state.reservationDate || !wizard.state.reservationTime}>
                  Próximo
                </Button>
              </div>
            </div>
          ) : null}

          {wizard.state.step === "seats" ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="reservation-guests" className="text-sm font-medium">
                    Pessoas
                  </label>
                  <Input
                    id="reservation-guests"
                    type="number"
                    min={1}
                    max={20}
                    value={wizard.state.guests}
                    onChange={(event) => wizard.setGuests(Number(event.target.value || 1))}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="reservation-table" className="text-sm font-medium">
                    Mesa
                  </label>
                  <select
                    id="reservation-table"
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                    value={wizard.state.tableId}
                    onChange={(event) => wizard.setTableId(event.target.value)}
                  >
                    <option value="">Selecione a mesa</option>
                    {availableTables.map((table) => (
                      <option key={table.id} value={table.id}>
                        Mesa {table.number} - até {table.capacity} pessoas
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {tables.slice(0, 6).map((table) => {
                  const status = tableStatusLabel(table, dayReservations, wizard.state.reservationDate, wizard.state.reservationTime);
                  return (
                    <div key={table.id} className="rounded-2xl border border-border/70 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Table2 className="h-4 w-4 text-primary" />
                          <p className="font-medium">Mesa {table.number}</p>
                        </div>
                        <Badge variant={status === "Livre" ? "secondary" : "outline"}>{status}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">Capacidade para {table.capacity} pessoas.</p>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={wizard.prevStep}>
                  Voltar
                </Button>
                <Button type="button" onClick={wizard.nextStep} disabled={!wizard.state.tableId}>
                  Próximo
                </Button>
              </div>
            </div>
          ) : null}

          {wizard.state.step === "review" ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome</label>
                  <Input value={wizard.state.customerName} onChange={(event) => wizard.setCustomerName(event.target.value)} placeholder="Nome completo" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Telefone</label>
                  <Input value={wizard.state.customerPhone} onChange={(event) => wizard.setCustomerPhone(event.target.value)} placeholder="+244..." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">E-mail</label>
                  <Input value={wizard.state.customerEmail} onChange={(event) => wizard.setCustomerEmail(event.target.value)} type="email" placeholder="cliente@exemplo.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Observações</label>
                  <Textarea value={wizard.state.notes} onChange={(event) => wizard.setNotes(event.target.value)} placeholder="Aniversário, acessibilidade, cadeiras extras..." />
                </div>
              </div>

              <div className="grid gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm md:grid-cols-2">
                <div className="flex items-center justify-between gap-4">
                  <span>Data</span>
                  <strong>{wizard.state.reservationDate || "Selecione"}</strong>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Horário</span>
                  <strong>{wizard.state.reservationTime || "Selecione"}</strong>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Pessoas</span>
                  <strong>{wizard.state.guests}</strong>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Mesa</span>
                  <strong>{tables.find((table) => table.id === wizard.state.tableId)?.number ?? "Selecione"}</strong>
                </div>
              </div>

              {resultMessage ? <p className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">{resultMessage}</p> : null}

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={wizard.prevStep}>
                  Voltar
                </Button>
                <Button type="button" onClick={() => void submit()} disabled={!canReview || submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Confirmar reserva
                </Button>
              </div>
            </div>
          ) : null}

          {wizard.state.step === "complete" ? (
            <div className="space-y-4 rounded-[1.6rem] border border-border/70 bg-[image:var(--gradient-surface)] p-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <h3 className="text-lg font-semibold">Reserva criada</h3>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                A confirmação automática foi preparada com WhatsApp e e-mail para a próxima etapa de comunicação.
              </p>
              {whatsappUrl ? (
                <Button asChild className="w-fit">
                  <a href={whatsappUrl} target="_blank" rel="noreferrer">
                    <MessageSquareText className="h-4 w-4" />
                    Abrir WhatsApp
                  </a>
                </Button>
              ) : null}
              {emailPreview ? (
                <div className="rounded-2xl border border-border/70 bg-background/80 p-4 text-sm">
                  <p className="font-medium">{emailPreview.subject}</p>
                  <p className="mt-3 whitespace-pre-line leading-6 text-muted-foreground">{emailPreview.body}</p>
                </div>
              ) : null}
              <Button variant="outline" onClick={wizard.reset} className="w-fit">
                Criar nova reserva
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <aside className="space-y-4 lg:sticky lg:top-24">
        <Card className="border-border/70 bg-card/90 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle>Resumo do restaurante</CardTitle>
            <CardDescription>Informações rápidas para a reserva.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{restaurant.address || "Endereço não informado"}</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <PhoneCall className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{restaurant.phone || "Telefone não informado"}</span>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="rounded-2xl border border-border/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Mesa selecionada</p>
                <p className="mt-2 text-base font-semibold">{tables.find((table) => table.id === wizard.state.tableId)?.number ?? "Nenhuma"}</p>
              </div>
              <div className="rounded-2xl border border-border/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Capacidade</p>
                <p className="mt-2 text-base font-semibold">
                  {tables.find((table) => table.id === wizard.state.tableId)?.capacity ?? "Selecione uma mesa"}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Status do horário</p>
                <p className={cn("mt-2 text-base font-semibold", schedule ? "text-foreground" : "text-destructive")}>
                  {schedule ? "Disponível" : "Horário fechado"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Calendário preparado
            </CardTitle>
            <CardDescription>Estrutura pronta para FullCalendar em uma próxima fase.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border border-dashed p-4 text-sm leading-6 text-muted-foreground">
              Visualização diária, semanal e mensal já estão previstas no fluxo atual. A renderização dedicada será plugada sem
              alterar esta base.
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
