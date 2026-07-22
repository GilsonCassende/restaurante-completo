"use server";

import { revalidatePath } from "next/cache";
import { ROLES } from "@/permissions";
import { requireRole } from "@/lib/session";
import { trackingEventSchema, type TrackingEventInput } from "@/schemas";
import { getDeliveryDashboardCached, listTrackingEvents, recordTrackingEvent } from "@/services/delivery";

export type TrackingActionResult<T> = { ok: true; data: T } | { ok: false; message: string };

const TRACKING_ROLES = [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.STAFF, ROLES.DRIVER] as const;
const TRACKING_PATHS = ["/dashboard/tracking", "/dashboard/delivery"] as const;

async function getContext() {
  const user = await requireRole(TRACKING_ROLES);
  return { user, restaurantId: user.restaurantId };
}

export async function listTrackingEventsAction() {
  const { restaurantId } = await getContext();
  return listTrackingEvents(restaurantId);
}

export async function getTrackingDashboardAction() {
  const { restaurantId } = await getContext();
  return await getDeliveryDashboardCached(restaurantId);
}

export async function recordTrackingEventAction(input: TrackingEventInput): Promise<TrackingActionResult<ReturnType<typeof recordTrackingEvent>>> {
  const parsed = trackingEventSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Evento inválido." };
  }

  await requireRole(TRACKING_ROLES);
  const { restaurantId } = await getContext();
  const event = recordTrackingEvent(restaurantId, parsed.data);
  TRACKING_PATHS.forEach((pathname) => revalidatePath(pathname));
  return { ok: true, data: event };
}
