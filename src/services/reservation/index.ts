import "server-only";

import { randomBytes } from "node:crypto";
import {
  addReservationHistory,
  createReservation as insertReservation,
  findReservationById,
  findRestaurantById,
  findTableById,
  listReservationsByDate as listReservationsByDateRepository,
  listReservationsByRestaurant as listReservationsByRestaurantRepository,
  updateReservation as saveReservation,
  updateReservationStatus as saveReservationStatus,
} from "@/prisma";
import {
  reservationFiltersSchema,
  type CancelReservationInput,
  type CheckInReservationInput,
  type CompleteReservationInput,
  type ConfirmReservationInput,
  type CreateReservationInput,
  type ReservationFiltersInput,
  type UpdateReservationInput,
} from "@/schemas";
import type { Restaurant, Reservation, ReservationStatus, ReservationWithDetails, Table } from "@/types";
import { buildReservationWhatsAppMessage } from "@/lib/whatsapp";
import { safeRevalidateTag, tenantCacheTag, withTenantCache } from "@/lib/production/cache";

type ReservationListResult = {
  items: ReservationWithDetails[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

const ACTIVE_STATUSES: ReservationStatus[] = ["PENDING", "CONFIRMED", "CHECKED_IN"];
const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
const DASHBOARD_DATE_RANGE = 30;

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function formatDateKey(date: Date, timeZone?: string | null) {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timeZone ?? undefined,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

function formatTimeKey(date: Date, timeZone?: string | null) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: timeZone ?? undefined,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  } catch {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}

function getNowKeyParts(timeZone?: string | null) {
  const now = new Date();
  return {
    date: formatDateKey(now, timeZone),
    time: formatTimeKey(now, timeZone),
  };
}

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map((part) => Number(part));
  return hours * 60 + minutes;
}

function getWeekdayKey(date: string, timeZone?: string | null) {
  const parsed = new Date(`${date}T12:00:00.000Z`);
  try {
    const weekday = new Intl.DateTimeFormat("en-US", {
      timeZone: timeZone ?? undefined,
      weekday: "long",
    }).format(parsed).toLowerCase();
    return weekday as (typeof DAY_NAMES)[number];
  } catch {
    return DAY_NAMES[parsed.getUTCDay()];
  }
}

function isActiveReservation(reservation: Reservation) {
  return ACTIVE_STATUSES.includes(reservation.status);
}

function getDaySchedule(restaurant: Restaurant, date: string) {
  const isRestaurantClosed = restaurant.isOpen === false;
  if (isRestaurantClosed) {
    return { closed: true, reason: "RESTAURANT_CLOSED" as const };
  }

  const holiday = restaurant.holidays?.find((item) => item.date === date && item.closed);
  if (holiday) {
    return { closed: true, reason: "SCHEDULE_CLOSED" as const };
  }

  const weeklyHours = restaurant.weeklyHours ?? [];
  const dayKey = getWeekdayKey(date, restaurant.timezone);
  const daySchedule = weeklyHours.find((item) => item.day === dayKey) ?? null;

  if (!daySchedule || daySchedule.closed) {
    return { closed: true, reason: "SCHEDULE_CLOSED" as const };
  }

  return {
    closed: false,
    open: daySchedule.open || "00:00",
    close: daySchedule.close || "23:59",
  };
}

function createConfirmationCode(existingCodes: Set<string>) {
  let code = "";
  do {
    code = randomBytes(3).toString("hex").toUpperCase();
  } while (existingCodes.has(code));
  return code;
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

function getReservationWindow(reservation: Pick<Reservation, "reservationTime" | "duration">) {
  const start = toMinutes(reservation.reservationTime);
  return {
    start,
    end: start + reservation.duration,
  };
}

function buildDateRange(startDate: string, days: number) {
  const dates: string[] = [];
  const date = new Date(`${startDate}T00:00:00.000Z`);

  for (let index = 0; index < days; index += 1) {
    dates.push(date.toISOString().slice(0, 10));
    date.setUTCDate(date.getUTCDate() + 1);
  }

  return dates;
}

function applyReservationFilters(items: ReservationWithDetails[], filters: ReservationFiltersInput, timeZone?: string | null) {
  const search = filters.search.trim().toLowerCase();
  const today = getNowKeyParts(timeZone).date;
  const range =
    filters.period === "today"
      ? [today]
      : filters.period === "tomorrow"
        ? buildDateRange(new Date(Date.parse(`${today}T00:00:00.000Z`) + 86400000).toISOString().slice(0, 10), 1)
        : filters.period === "week"
          ? buildDateRange(today, 7)
          : filters.period === "month"
            ? buildDateRange(today, DASHBOARD_DATE_RANGE)
            : filters.date
              ? [filters.date]
              : null;

  let filtered = items;
  if (range) {
    const allowed = new Set(range);
    filtered = filtered.filter((item) => allowed.has(item.reservationDate));
  }

  if (filters.status && filters.status !== "all") {
    filtered = filtered.filter((item) => item.status === filters.status);
  }

  if (search) {
    filtered = filtered.filter((item) => {
      const values = [
        item.customerName,
        item.customerPhone,
        item.customerEmail ?? "",
        item.confirmationCode,
        String(item.table.number),
      ]
        .join(" ")
        .toLowerCase();
      return values.includes(search);
    });
  }

  return filtered.sort(
    (a, b) =>
      a.reservationDate.localeCompare(b.reservationDate) || a.reservationTime.localeCompare(b.reservationTime)
  );
}

async function assertReservationAvailability(
  restaurant: Restaurant,
  table: Table,
  input: CreateReservationInput | UpdateReservationInput,
  currentReservationId?: string
) {
  const today = getNowKeyParts(restaurant.timezone);
  const reservationDate = input.reservationDate;
  const reservationTime = input.reservationTime;

  if (reservationDate < today.date || (reservationDate === today.date && reservationTime <= today.time)) {
    throw new Error("Datas passadas não são permitidas.");
  }

  const schedule = getDaySchedule(restaurant, reservationDate);
  if (schedule.closed) {
    throw new Error(schedule.reason === "RESTAURANT_CLOSED" ? "Restaurante fechado." : "Horário fechado.");
  }

  const open = schedule.open ?? "00:00";
  const close = schedule.close ?? "23:59";

  if (toMinutes(reservationTime) < toMinutes(open) || toMinutes(reservationTime) >= toMinutes(close)) {
    throw new Error("Horário fechado.");
  }

  if (input.duration > toMinutes(close) - toMinutes(reservationTime)) {
    throw new Error("Horário fechado.");
  }

  if (!table.active) {
    throw new Error("Mesa indisponível.");
  }

  if (input.guests > table.capacity) {
    throw new Error("Mesa acima da capacidade.");
  }

  const reservations = await listReservationsByDateRepository(restaurant.id, reservationDate);
  const currentWindow = {
    start: toMinutes(reservationTime),
    end: toMinutes(reservationTime) + input.duration,
  };

  const hasDuplicate = reservations.some((reservation) => {
    if (reservation.id === currentReservationId) return false;
    return (
      reservation.tableId === table.id &&
      reservation.customerPhone.replace(/\D/g, "") === normalizePhone(input.customerPhone) &&
      reservation.reservationTime === reservationTime &&
      reservation.reservationDate === reservationDate
    );
  });

  if (hasDuplicate) {
    throw new Error("Reserva duplicada.");
  }

  const hasConflict = reservations.some((reservation) => {
    if (reservation.id === currentReservationId) return false;
    if (reservation.tableId !== table.id || !isActiveReservation(reservation)) return false;

    const window = getReservationWindow(reservation);
    return overlaps(currentWindow.start, currentWindow.end, window.start, window.end);
  });

  if (hasConflict) {
    throw new Error("Mesa ocupada.");
  }
}

async function prepareReservationContext(restaurantId: string) {
  const restaurant = await findRestaurantById(restaurantId);
  if (!restaurant) {
    throw new Error("Restaurante não encontrado.");
  }

  return restaurant;
}

async function buildReservationList(restaurantId: string, filters: ReservationFiltersInput): Promise<ReservationListResult> {
  const restaurant = await prepareReservationContext(restaurantId);
  const allReservations = await listReservationsByRestaurantRepository(restaurantId);
  const filtered = applyReservationFilters(allReservations, filters, restaurant.timezone);
  const total = filtered.length;
  const perPage = filters.perPage;
  const page = Math.min(Math.max(filters.page, 1), Math.max(Math.ceil(total / perPage), 1));
  const startIndex = (page - 1) * perPage;
  const items = filtered.slice(startIndex, startIndex + perPage);

  return {
    items,
    total,
    page,
    perPage,
    totalPages: Math.max(Math.ceil(total / perPage), 1),
  };
}

export const getReservationRestaurant = withTenantCache("reservations", async (restaurantId: string) => {
  return prepareReservationContext(restaurantId);
}, {
  tenantIndex: 0,
  keyPrefix: "reservation-restaurant",
  revalidate: 300,
});

export async function listReservationsForRestaurant(restaurantId: string, filters: Partial<ReservationFiltersInput> = {}) {
  const parsed = reservationFiltersSchema.safeParse(filters);
  if (!parsed.success) {
    throw new Error("Filtros de reserva inválidos.");
  }

  return buildReservationList(restaurantId, parsed.data);
}

export async function listReservationsByDateForRestaurant(restaurantId: string, date: string) {
  return listReservationsByDateRepository(restaurantId, date);
}

export async function listTodayReservationsForRestaurant(restaurantId: string) {
  const restaurant = await prepareReservationContext(restaurantId);
  const today = getNowKeyParts(restaurant.timezone).date;
  return listReservationsByDateRepository(restaurantId, today);
}

export async function listUpcomingReservationsForRestaurant(restaurantId: string, days = 7) {
  const restaurant = await prepareReservationContext(restaurantId);
  const today = getNowKeyParts(restaurant.timezone).date;
  const dates = buildDateRange(today, days + 1).slice(1);
  const reservations = await Promise.all(dates.map((date) => listReservationsByDateRepository(restaurantId, date)));
  return reservations.flat();
}

export async function createReservationForRestaurant(
  restaurantId: string,
  input: CreateReservationInput,
  createdByUserId?: string | null
) {
  const restaurant = await prepareReservationContext(restaurantId);
  const table = await findTableById(input.tableId, restaurantId);
  if (!table) {
    throw new Error("Mesa não encontrada.");
  }

  await assertReservationAvailability(restaurant, table, input);

  const existingCodes = new Set((await listReservationsByRestaurantRepository(restaurantId)).map((item) => item.confirmationCode));
  const confirmationCode = createConfirmationCode(existingCodes);
  const reservation = await insertReservation({
    restaurantId,
    tableId: table.id,
    createdByUserId: createdByUserId ?? null,
    customerId: null,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail ?? null,
    guests: input.guests,
    reservationDate: input.reservationDate,
    reservationTime: input.reservationTime,
    duration: input.duration,
    status: "PENDING",
    notes: input.notes ?? null,
    confirmationCode,
    source: input.source ?? "WEBSITE",
    history: [
      {
        action: "CREATED",
        actorUserId: createdByUserId ?? null,
        notes: input.notes ?? null,
        metadata: {
          source: input.source ?? "WEBSITE",
        },
      },
    ],
  });
  safeRevalidateTag(
    tenantCacheTag("reservations", restaurantId),
    tenantCacheTag("analytics", restaurantId),
    tenantCacheTag("reports", restaurantId)
  );

  const whatsappMessage = buildReservationWhatsAppMessage({
    customerName: reservation.customerName,
    customerPhone: reservation.customerPhone,
    reservation: reservation,
    table: reservation.table,
  });

  return {
    reservation,
    whatsappMessage,
    emailPreview: {
      subject: `Reserva confirmada - ${reservation.confirmationCode}`,
      body: [
        `Olá ${reservation.customerName}!`,
        "",
        `Sua reserva foi registrada para ${reservation.reservationDate} às ${reservation.reservationTime}.`,
        `Mesa ${reservation.table.number} - ${reservation.guests} pessoa(s).`,
        `Código: ${reservation.confirmationCode}.`,
      ].join("\n"),
    },
  };
}

async function mutateReservationStatus(
  reservationId: string,
  restaurantId: string,
  status: ReservationStatus,
  historyAction: "CONFIRMED" | "CANCELLED" | "CHECKED_IN" | "COMPLETED",
  actorUserId?: string | null,
  notes?: string | null
) {
  const reservation = await saveReservationStatus(reservationId, restaurantId, status);
  if (!reservation) {
    throw new Error("Reserva não encontrada.");
  }

  await addReservationHistory(reservationId, restaurantId, {
    action: historyAction,
    actorUserId: actorUserId ?? null,
    notes: notes ?? null,
    metadata: {
      status,
    },
  });

  safeRevalidateTag(
    tenantCacheTag("reservations", restaurantId),
    tenantCacheTag("analytics", restaurantId),
    tenantCacheTag("reports", restaurantId)
  );

  return reservation;
}

export async function updateReservationForRestaurant(
  restaurantId: string,
  input: UpdateReservationInput,
  actorUserId?: string | null
) {
  const restaurant = await prepareReservationContext(restaurantId);
  const current = await findReservationById(input.id, restaurantId);
  if (!current) {
    throw new Error("Reserva não encontrada.");
  }

  const table = await findTableById(input.tableId ?? current.tableId, restaurantId);
  if (!table) {
    throw new Error("Mesa não encontrada.");
  }

  await assertReservationAvailability(restaurant, table, input, current.id);

  const reservation = await saveReservation(current.id, restaurantId, {
    tableId: table.id,
    customerName: input.customerName ?? current.customerName,
    customerPhone: input.customerPhone ?? current.customerPhone,
    customerEmail: input.customerEmail ?? current.customerEmail,
    guests: input.guests ?? current.guests,
    reservationDate: input.reservationDate ?? current.reservationDate,
    reservationTime: input.reservationTime ?? current.reservationTime,
    duration: input.duration ?? current.duration,
    notes: input.notes ?? current.notes,
    source: input.source ?? current.source,
    status: input.status ?? current.status,
    history: [
      {
        action: "UPDATED",
        actorUserId: actorUserId ?? null,
        notes: input.notes ?? null,
        metadata: {
          before: {
            reservationDate: current.reservationDate,
            reservationTime: current.reservationTime,
            tableId: current.tableId,
            guests: current.guests,
          },
        },
      },
    ],
  });

  if (!reservation) {
    throw new Error("Reserva não encontrada.");
  }

  safeRevalidateTag(
    tenantCacheTag("reservations", restaurantId),
    tenantCacheTag("analytics", restaurantId),
    tenantCacheTag("reports", restaurantId)
  );

  return reservation;
}

export async function confirmReservationForRestaurant(restaurantId: string, input: ConfirmReservationInput, actorUserId?: string | null) {
  return mutateReservationStatus(input.id, restaurantId, "CONFIRMED", "CONFIRMED", actorUserId);
}

export async function cancelReservationForRestaurant(
  restaurantId: string,
  input: CancelReservationInput,
  actorUserId?: string | null
) {
  return mutateReservationStatus(input.id, restaurantId, "CANCELLED", "CANCELLED", actorUserId, input.reason ?? null);
}

export async function checkInReservationForRestaurant(
  restaurantId: string,
  input: CheckInReservationInput,
  actorUserId?: string | null
) {
  return mutateReservationStatus(input.id, restaurantId, "CHECKED_IN", "CHECKED_IN", actorUserId);
}

export async function completeReservationForRestaurant(
  restaurantId: string,
  input: CompleteReservationInput,
  actorUserId?: string | null
) {
  return mutateReservationStatus(input.id, restaurantId, "COMPLETED", "COMPLETED", actorUserId);
}

export function buildReservationTableStatus(table: Table, reservations: ReservationWithDetails[], now = new Date()) {
  if (!table.active) {
    return { status: "UNAVAILABLE" as const, label: "Indisponível" };
  }

  const currentMinute = now.getHours() * 60 + now.getMinutes();
  const activeReservation = reservations.find((reservation) => {
    if (reservation.tableId !== table.id || !isActiveReservation(reservation)) return false;
    const window = getReservationWindow(reservation);
    return currentMinute >= window.start && currentMinute < window.end;
  });

  if (activeReservation?.status === "CHECKED_IN") {
    return { status: "OCCUPIED" as const, label: "Ocupada" };
  }

  if (activeReservation) {
    return { status: "RESERVED" as const, label: "Reservada" };
  }

  const latestEnded = reservations
    .filter((reservation) => reservation.tableId === table.id && reservation.status === "COMPLETED")
    .sort((a, b) => {
      const aEnd = toMinutes(a.reservationTime) + a.duration;
      const bEnd = toMinutes(b.reservationTime) + b.duration;
      return bEnd - aEnd;
    })[0];

  if (latestEnded) {
    const endedAt = toMinutes(latestEnded.reservationTime) + latestEnded.duration;
    if (currentMinute >= endedAt && currentMinute < endedAt + 45) {
      return { status: "CLEANING" as const, label: "Limpeza" };
    }
  }

  return { status: "FREE" as const, label: "Livre" };
}
