"use server";

import { revalidatePath } from "next/cache";
import { ROLES } from "@/permissions";
import { requireRole } from "@/lib/session";
import { driverSchema, driverShiftSchema, type DriverInput, type DriverShiftInput } from "@/schemas";
import { listDriverShifts, listDrivers, updateDriverStatus, upsertDriver, upsertDriverShift } from "@/services/delivery";

export type DriversActionResult<T> = { ok: true; data: T } | { ok: false; message: string };

const DRIVER_ROLES = [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.DRIVER] as const;
const MANAGEMENT_ROLES = [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER] as const;

const DRIVER_PATHS = ["/dashboard/drivers", "/dashboard/delivery", "/dashboard/tracking"] as const;

async function getContext() {
  const user = await requireRole(DRIVER_ROLES);
  return { user, restaurantId: user.restaurantId };
}

export async function listDriversAction() {
  const { restaurantId } = await getContext();
  return listDrivers(restaurantId);
}

export async function listDriverShiftsAction() {
  const { restaurantId } = await getContext();
  return listDriverShifts(restaurantId);
}

export async function saveDriverAction(input: DriverInput): Promise<DriversActionResult<ReturnType<typeof upsertDriver>>> {
  const parsed = driverSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Entregador inválido." };
  }

  await requireRole(MANAGEMENT_ROLES);
  const { restaurantId } = await getContext();
  const driver = upsertDriver(restaurantId, parsed.data);
  DRIVER_PATHS.forEach((pathname) => revalidatePath(pathname));
  return { ok: true, data: driver };
}

export async function saveDriverShiftAction(input: DriverShiftInput): Promise<DriversActionResult<ReturnType<typeof upsertDriverShift>>> {
  const parsed = driverShiftSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Escala inválida." };
  }

  await requireRole(MANAGEMENT_ROLES);
  const { restaurantId } = await getContext();
  const shift = upsertDriverShift(restaurantId, parsed.data);
  DRIVER_PATHS.forEach((pathname) => revalidatePath(pathname));
  return { ok: true, data: shift };
}

export async function setDriverStatusAction(driverId: string, status: DriverInput["status"]): Promise<DriversActionResult<ReturnType<typeof updateDriverStatus>>> {
  await requireRole(DRIVER_ROLES);
  const { restaurantId } = await getContext();
  const driver = updateDriverStatus(restaurantId, driverId, status);
  if (!driver) {
    return { ok: false, message: "Entregador não encontrado." };
  }
  DRIVER_PATHS.forEach((pathname) => revalidatePath(pathname));
  return { ok: true, data: driver };
}

