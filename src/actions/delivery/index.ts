"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ROLES } from "@/permissions";
import { requireRole } from "@/lib/session";
import { idSchema } from "@/schemas/common";
import {
  deliveryAddressSchema,
  deliveryFeeSchema,
  deliveryOrderStatusSchema,
  deliverySettingsSchema,
  deliveryZoneSchema,
  dispatchSchema,
  routeSchema,
  type DeliveryFeeInput,
  type DeliverySettingsInput,
  type DeliveryZoneInput,
  type DispatchInput,
  type RouteInput,
  type DeliveryDashboardFilterInput,
} from "@/schemas";
import {
  createDispatch,
  createRoute,
  getDeliveryDashboardCached,
  getDeliverySettings,
  listDeliveryAddresses,
  listDeliveryFees,
  listDeliveryZones,
  listDispatches,
  listRoutes,
  saveDeliverySettings,
  upsertDeliveryAddress,
  upsertDeliveryFee,
  upsertDeliveryZone,
  updateDispatchStatus,
} from "@/services/delivery";

export type DeliveryActionResult<T> = { ok: true; data: T } | { ok: false; message: string };

const DELIVERY_ROLES = [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.STAFF, ROLES.DRIVER] as const;
const MANAGEMENT_ROLES = [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER] as const;

const DELIVERY_PATHS = ["/dashboard/delivery", "/dashboard/tracking"] as const;

async function getContext() {
  const user = await requireRole(DELIVERY_ROLES);
  return { user, restaurantId: user.restaurantId };
}

export async function getDeliveryDashboardAction(filters: Partial<DeliveryDashboardFilterInput> = {}) {
  const { restaurantId } = await getContext();
  void filters;
  return await getDeliveryDashboardCached(restaurantId);
}

export async function listDeliveryZonesAction() {
  const { restaurantId } = await getContext();
  return listDeliveryZones(restaurantId);
}

export async function listDeliveryFeesAction() {
  const { restaurantId } = await getContext();
  return listDeliveryFees(restaurantId);
}

export async function listDeliveryAddressesAction() {
  const { restaurantId } = await getContext();
  return listDeliveryAddresses(restaurantId);
}

export async function listDispatchesAction() {
  const { restaurantId } = await getContext();
  return listDispatches(restaurantId);
}

export async function listRoutesAction() {
  const { restaurantId } = await getContext();
  return listRoutes(restaurantId);
}

export async function saveDeliveryZoneAction(input: DeliveryZoneInput): Promise<DeliveryActionResult<Awaited<ReturnType<typeof upsertDeliveryZone>>>> {
  const parsed = deliveryZoneSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Zona inválida." };
  }

  await requireRole(MANAGEMENT_ROLES);
  const { restaurantId } = await getContext();
  const zone = upsertDeliveryZone(restaurantId, parsed.data);
  DELIVERY_PATHS.forEach((pathname) => revalidatePath(pathname));
  return { ok: true, data: zone };
}

export async function saveDeliveryFeeAction(input: DeliveryFeeInput): Promise<DeliveryActionResult<Awaited<ReturnType<typeof upsertDeliveryFee>>>> {
  const parsed = deliveryFeeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Taxa inválida." };
  }

  await requireRole(MANAGEMENT_ROLES);
  const { restaurantId } = await getContext();
  const fee = upsertDeliveryFee(restaurantId, parsed.data);
  DELIVERY_PATHS.forEach((pathname) => revalidatePath(pathname));
  return { ok: true, data: fee };
}

export async function saveDeliverySettingsAction(input: DeliverySettingsInput): Promise<DeliveryActionResult<Awaited<ReturnType<typeof saveDeliverySettings>>>> {
  const parsed = deliverySettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Configuração inválida." };
  }

  await requireRole(MANAGEMENT_ROLES);
  const { restaurantId } = await getContext();
  const settings = saveDeliverySettings(restaurantId, parsed.data);
  DELIVERY_PATHS.forEach((pathname) => revalidatePath(pathname));
  return { ok: true, data: settings };
}

export async function getDeliverySettingsAction() {
  const { restaurantId } = await getContext();
  return getDeliverySettings(restaurantId);
}

export async function saveDeliveryAddressAction(input: z.infer<typeof deliveryAddressSchema>): Promise<DeliveryActionResult<Awaited<ReturnType<typeof upsertDeliveryAddress>>>> {
  const parsed = deliveryAddressSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Endereço inválido." };
  }

  await requireRole(MANAGEMENT_ROLES);
  const { restaurantId } = await getContext();
  const address = upsertDeliveryAddress(restaurantId, parsed.data);
  DELIVERY_PATHS.forEach((pathname) => revalidatePath(pathname));
  return { ok: true, data: address };
}

export async function createDispatchAction(input: DispatchInput): Promise<DeliveryActionResult<ReturnType<typeof createDispatch>>> {
  const parsed = dispatchSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Despacho inválido." };
  }

  await requireRole(MANAGEMENT_ROLES);
  const { restaurantId } = await getContext();
  const dispatch = createDispatch(restaurantId, parsed.data);
  DELIVERY_PATHS.forEach((pathname) => revalidatePath(pathname));
  return { ok: true, data: dispatch };
}

export async function updateDispatchStatusAction(input: DispatchInput & { id: string }): Promise<DeliveryActionResult<ReturnType<typeof updateDispatchStatus>>> {
  const parsed = dispatchSchema
    .extend({
      id: idSchema,
      status: deliveryOrderStatusSchema,
    })
    .safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Status inválido." };
  }

  await requireRole(DELIVERY_ROLES);
  const { restaurantId } = await getContext();
  const dispatch = updateDispatchStatus(restaurantId, input.id, input.status, input.driverId ?? null);
  if (!dispatch) {
    return { ok: false, message: "Despacho não encontrado." };
  }
  DELIVERY_PATHS.forEach((pathname) => revalidatePath(pathname));
  return { ok: true, data: dispatch };
}

export async function createRouteAction(input: RouteInput): Promise<DeliveryActionResult<ReturnType<typeof createRoute>>> {
  const parsed = routeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Rota inválida." };
  }

  await requireRole(MANAGEMENT_ROLES);
  const { restaurantId } = await getContext();
  const route = createRoute(restaurantId, {
    orderId: parsed.data.orderId,
    dispatchId: parsed.data.dispatchId ?? null,
    driverId: parsed.data.driverId ?? null,
    provider: parsed.data.provider,
    origin: parsed.data.originLatitude != null && parsed.data.originLongitude != null ? { latitude: parsed.data.originLatitude, longitude: parsed.data.originLongitude } : null,
    destination:
      parsed.data.destinationLatitude != null && parsed.data.destinationLongitude != null
        ? { latitude: parsed.data.destinationLatitude, longitude: parsed.data.destinationLongitude }
        : null,
    label: parsed.data.label ?? undefined,
  });
  DELIVERY_PATHS.forEach((pathname) => revalidatePath(pathname));
  return { ok: true, data: route };
}
