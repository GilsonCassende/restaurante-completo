"use server";

import { revalidatePath } from "next/cache";
import { ROLES } from "@/permissions";
import { getCurrentUser, requireRole } from "@/lib/session";
import { buildReservationWhatsAppUrl } from "@/lib/whatsapp";
import { findRestaurantById } from "@/prisma";
import {
  cancelReservationForRestaurant,
  checkInReservationForRestaurant,
  completeReservationForRestaurant,
  confirmReservationForRestaurant,
  createReservationForRestaurant,
  listReservationsByDateForRestaurant,
  listReservationsForRestaurant,
  listTodayReservationsForRestaurant,
  listUpcomingReservationsForRestaurant,
  updateReservationForRestaurant,
} from "@/services/reservation";
import {
  cancelReservationSchema,
  checkInReservationSchema,
  completeReservationSchema,
  confirmReservationSchema,
  createReservationSchema,
  reservationFiltersSchema,
  type CancelReservationInput,
  type CheckInReservationInput,
  type CompleteReservationInput,
  type ConfirmReservationInput,
  type CreateReservationInput,
  type ReservationFiltersInput,
  type UpdateReservationInput,
  updateReservationSchema,
} from "@/schemas";
import type { ReservationWithDetails } from "@/types";

export type ReservationActionResult<T = ReservationWithDetails> =
  | { ok: true; data: T }
  | { ok: false; message: string };

export type CreateReservationActionData = {
  reservation: ReservationWithDetails;
  whatsappMessage: string;
  whatsappUrl: string | null;
  emailPreview: {
    subject: string;
    body: string;
  };
};

const DASHBOARD_ROLES = [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.STAFF] as const;
const DASHBOARD_PATH = "/dashboard/reservations";
const PUBLIC_PATH = "/reservas";

async function resolveRestaurantId(restaurantId?: string) {
  const user = await getCurrentUser();
  if (user) {
    return { user, restaurantId: user.restaurantId };
  }

  if (!restaurantId) {
    return null;
  }

  return { user: null, restaurantId };
}

async function revalidateReservationViews() {
  revalidatePath(DASHBOARD_PATH);
  revalidatePath(PUBLIC_PATH);
}

export async function createReservationAction(
  input: CreateReservationInput & { restaurantId?: string }
): Promise<ReservationActionResult<CreateReservationActionData>> {
  const parsed = createReservationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Reserva inválida." };
  }

  const context = await resolveRestaurantId(input.restaurantId);
  if (!context) {
    return { ok: false, message: "Restaurante não encontrado." };
  }

  try {
    const result = await createReservationForRestaurant(context.restaurantId, parsed.data, context.user?.id ?? null);
    const restaurant = await findRestaurantById(context.restaurantId);
    const whatsappUrl = restaurant ? buildReservationWhatsAppUrl(restaurant.whatsapp ?? restaurant.phone, result.whatsappMessage) : null;
    await revalidateReservationViews();

    return {
      ok: true,
      data: {
        reservation: result.reservation,
        whatsappMessage: result.whatsappMessage,
        whatsappUrl,
        emailPreview: result.emailPreview,
      },
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Não foi possível criar a reserva.",
    };
  }
}

async function getDashboardContext() {
  const user = await requireRole(DASHBOARD_ROLES);
  return user;
}

export async function updateReservationAction(
  input: UpdateReservationInput
): Promise<ReservationActionResult> {
  const parsed = updateReservationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Reserva inválida." };
  }

  const user = await getDashboardContext();

  try {
    const reservation = await updateReservationForRestaurant(user.restaurantId, parsed.data, user.id);
    await revalidateReservationViews();
    return { ok: true, data: reservation };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Não foi possível atualizar a reserva.",
    };
  }
}

export async function cancelReservationAction(input: CancelReservationInput): Promise<ReservationActionResult> {
  const parsed = cancelReservationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Reserva inválida." };
  }

  const user = await getDashboardContext();

  try {
    const reservation = await cancelReservationForRestaurant(user.restaurantId, parsed.data, user.id);
    await revalidateReservationViews();
    return { ok: true, data: reservation };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Não foi possível cancelar a reserva.",
    };
  }
}

export async function confirmReservationAction(input: ConfirmReservationInput): Promise<ReservationActionResult> {
  const parsed = confirmReservationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Reserva inválida." };
  }

  const user = await getDashboardContext();

  try {
    const reservation = await confirmReservationForRestaurant(user.restaurantId, parsed.data, user.id);
    await revalidateReservationViews();
    return { ok: true, data: reservation };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Não foi possível confirmar a reserva.",
    };
  }
}

export async function checkInReservationAction(input: CheckInReservationInput): Promise<ReservationActionResult> {
  const parsed = checkInReservationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Reserva inválida." };
  }

  const user = await getDashboardContext();

  try {
    const reservation = await checkInReservationForRestaurant(user.restaurantId, parsed.data, user.id);
    await revalidateReservationViews();
    return { ok: true, data: reservation };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Não foi possível registrar o check-in.",
    };
  }
}

export async function completeReservationAction(input: CompleteReservationInput): Promise<ReservationActionResult> {
  const parsed = completeReservationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Reserva inválida." };
  }

  const user = await getDashboardContext();

  try {
    const reservation = await completeReservationForRestaurant(user.restaurantId, parsed.data, user.id);
    await revalidateReservationViews();
    return { ok: true, data: reservation };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Não foi possível concluir a reserva.",
    };
  }
}

export async function listReservationsAction(filters: Partial<ReservationFiltersInput> = {}) {
  const user = await getDashboardContext();
  const parsed = reservationFiltersSchema.safeParse(filters);
  if (!parsed.success) {
    throw new Error("Filtros de reserva inválidos.");
  }

  return listReservationsForRestaurant(user.restaurantId, parsed.data);
}

export async function listTodayReservationsAction() {
  const user = await getDashboardContext();
  return listTodayReservationsForRestaurant(user.restaurantId);
}

export async function listUpcomingReservationsAction() {
  const user = await getDashboardContext();
  return listUpcomingReservationsForRestaurant(user.restaurantId);
}

export async function listReservationsByDateAction(date: string) {
  const user = await getDashboardContext();
  return listReservationsByDateForRestaurant(user.restaurantId, date);
}
