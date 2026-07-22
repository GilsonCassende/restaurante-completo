import { cache } from "react";
import type {
  DeliveryAddress,
  DeliveryDashboard,
  DeliveryFee,
  DeliveryOrderStatus,
  DeliverySettings,
  DeliveryTimelineItem,
  DeliveryZone,
  Dispatch,
  Driver,
  DriverShift,
  MapProvider,
  Route,
  TrackingEvent,
  DriverStatus,
} from "@/types";
import { estimateRoute } from "@/services/maps";
import { calculateDeliveryFee } from "@/services/shipping";
import { createDeliveryId, getDeliveryState, touchDeliveryState } from "./state";

function now() {
  return new Date();
}

function sortByLatest<T extends { createdAt: Date }>(items: T[]) {
  return [...items].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

function buildTimeline(events: TrackingEvent[]): DeliveryTimelineItem[] {
  return sortByLatest(events).map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    meta: `${event.type} • ${event.createdAt.toLocaleString("pt-AO")}`,
    createdAt: event.createdAt,
  }));
}

export function listDrivers(restaurantId: string) {
  return sortByLatest(getDeliveryState(restaurantId).drivers).sort((a, b) => {
    const statusPriority: Record<DriverStatus, number> = {
      AVAILABLE: 1,
      BUSY: 2,
      IN_DELIVERY: 3,
      OFFLINE: 4,
    };
    return statusPriority[a.status] - statusPriority[b.status] || a.name.localeCompare(b.name);
  });
}

export function listDriverShifts(restaurantId: string) {
  return sortByLatest(getDeliveryState(restaurantId).shifts);
}

export function listDeliveryZones(restaurantId: string) {
  return sortByLatest(getDeliveryState(restaurantId).zones);
}

export function listDeliveryFees(restaurantId: string) {
  return sortByLatest(getDeliveryState(restaurantId).fees);
}

export function listDeliveryAddresses(restaurantId: string) {
  return sortByLatest(getDeliveryState(restaurantId).addresses);
}

export function listDispatches(restaurantId: string) {
  return sortByLatest(getDeliveryState(restaurantId).dispatches);
}

export function listRoutes(restaurantId: string) {
  return sortByLatest(getDeliveryState(restaurantId).routes);
}

export function listTrackingEvents(restaurantId: string) {
  return sortByLatest(getDeliveryState(restaurantId).trackingEvents);
}

export function getDeliverySettings(restaurantId: string): DeliverySettings {
  return getDeliveryState(restaurantId).settings;
}

export function saveDeliverySettings(
  restaurantId: string,
  input: Partial<Omit<DeliverySettings, "id" | "restaurantId" | "createdAt" | "updatedAt">>
) {
  const state = touchDeliveryState(restaurantId);
  state.settings = {
    ...state.settings,
    ...input,
    notificationChannels: input.notificationChannels ?? state.settings.notificationChannels,
    updatedAt: now(),
  };
  return state.settings;
}

export function upsertDriver(
  restaurantId: string,
  input: Partial<Omit<Driver, "id" | "restaurantId" | "createdAt" | "updatedAt">> & { id?: string; name: string; phone: string }
) {
  const state = touchDeliveryState(restaurantId);
  const existing = input.id ? state.drivers.find((driver) => driver.id === input.id) ?? null : null;
  const createdAt = existing?.createdAt ?? now();
  const driver: Driver = {
    id: existing?.id ?? input.id ?? createDeliveryId("drv"),
    restaurantId,
    userId: input.userId ?? existing?.userId ?? null,
    name: input.name,
    phone: input.phone,
    email: input.email ?? existing?.email ?? null,
    vehicleType: input.vehicleType ?? existing?.vehicleType ?? null,
    vehiclePlate: input.vehiclePlate ?? existing?.vehiclePlate ?? null,
    licenseNumber: input.licenseNumber ?? existing?.licenseNumber ?? null,
    status: input.status ?? existing?.status ?? "AVAILABLE",
    currentZoneId: input.currentZoneId ?? existing?.currentZoneId ?? null,
    currentLatitude: input.currentLatitude ?? existing?.currentLatitude ?? null,
    currentLongitude: input.currentLongitude ?? existing?.currentLongitude ?? null,
    rating: input.rating ?? existing?.rating ?? 5,
    totalDeliveries: input.totalDeliveries ?? existing?.totalDeliveries ?? 0,
    totalDistanceKm: input.totalDistanceKm ?? existing?.totalDistanceKm ?? 0,
    active: input.active ?? existing?.active ?? true,
    onlineSince: input.onlineSince ?? existing?.onlineSince ?? null,
    lastSeenAt: input.lastSeenAt ?? existing?.lastSeenAt ?? now(),
    createdAt,
    updatedAt: now(),
  };

  const index = state.drivers.findIndex((current) => current.id === driver.id);
  if (index >= 0) {
    state.drivers[index] = driver;
  } else {
    state.drivers.push(driver);
  }
  return driver;
}

export function updateDriverStatus(restaurantId: string, driverId: string, status: DriverStatus) {
  const state = touchDeliveryState(restaurantId);
  const driver = state.drivers.find((item) => item.id === driverId) ?? null;
  if (!driver) return null;
  driver.status = status;
  driver.onlineSince = status === "OFFLINE" ? null : driver.onlineSince ?? now();
  driver.lastSeenAt = now();
  driver.updatedAt = now();
  return driver;
}

export function upsertDriverShift(
  restaurantId: string,
  input: Partial<Omit<DriverShift, "id" | "restaurantId" | "createdAt" | "updatedAt">> & { id?: string; driverId: string; startAt: Date; endAt: Date }
) {
  const state = touchDeliveryState(restaurantId);
  const existing = input.id ? state.shifts.find((shift) => shift.id === input.id) ?? null : null;
  const shift: DriverShift = {
    id: existing?.id ?? input.id ?? createDeliveryId("shift"),
    restaurantId,
    driverId: input.driverId,
    startAt: input.startAt,
    endAt: input.endAt,
    status: input.status ?? existing?.status ?? "SCHEDULED",
    notes: input.notes ?? existing?.notes ?? null,
    createdAt: existing?.createdAt ?? now(),
    updatedAt: now(),
  };

  const index = state.shifts.findIndex((current) => current.id === shift.id);
  if (index >= 0) {
    state.shifts[index] = shift;
  } else {
    state.shifts.push(shift);
  }
  return shift;
}

export function upsertDeliveryZone(
  restaurantId: string,
  input: Partial<Omit<DeliveryZone, "id" | "restaurantId" | "createdAt" | "updatedAt">> & { id?: string; name: string; type: DeliveryZone["type"] }
) {
  const state = touchDeliveryState(restaurantId);
  const existing = input.id ? state.zones.find((zone) => zone.id === input.id) ?? null : null;
  const zone: DeliveryZone = {
    id: existing?.id ?? input.id ?? createDeliveryId("zone"),
    restaurantId,
    name: input.name,
    type: input.type,
    description: input.description ?? existing?.description ?? null,
    neighborhood: input.neighborhood ?? existing?.neighborhood ?? null,
    postalCodes: input.postalCodes ?? existing?.postalCodes ?? null,
    polygon: input.polygon ?? existing?.polygon ?? null,
    radiusKm: input.radiusKm ?? existing?.radiusKm ?? null,
    centerLatitude: input.centerLatitude ?? existing?.centerLatitude ?? null,
    centerLongitude: input.centerLongitude ?? existing?.centerLongitude ?? null,
    priority: input.priority ?? existing?.priority ?? 0,
    minOrderAmount: input.minOrderAmount ?? existing?.minOrderAmount ?? null,
    active: input.active ?? existing?.active ?? true,
    createdAt: existing?.createdAt ?? now(),
    updatedAt: now(),
  };
  const index = state.zones.findIndex((current) => current.id === zone.id);
  if (index >= 0) {
    state.zones[index] = zone;
  } else {
    state.zones.push(zone);
  }
  return zone;
}

export function upsertDeliveryFee(
  restaurantId: string,
  input: Partial<Omit<DeliveryFee, "id" | "restaurantId" | "createdAt" | "updatedAt">> & { id?: string; name: string; type: DeliveryFee["type"] }
) {
  const state = touchDeliveryState(restaurantId);
  const existing = input.id ? state.fees.find((fee) => fee.id === input.id) ?? null : null;
  const fee: DeliveryFee = {
    id: existing?.id ?? input.id ?? createDeliveryId("fee"),
    restaurantId,
    zoneId: input.zoneId ?? existing?.zoneId ?? null,
    name: input.name,
    type: input.type,
    fixedAmount: input.fixedAmount ?? existing?.fixedAmount ?? null,
    perKmAmount: input.perKmAmount ?? existing?.perKmAmount ?? null,
    minimumOrderAmount: input.minimumOrderAmount ?? existing?.minimumOrderAmount ?? null,
    freeShippingThreshold: input.freeShippingThreshold ?? existing?.freeShippingThreshold ?? null,
    promotionLabel: input.promotionLabel ?? existing?.promotionLabel ?? null,
    active: input.active ?? existing?.active ?? true,
    createdAt: existing?.createdAt ?? now(),
    updatedAt: now(),
  };
  const index = state.fees.findIndex((current) => current.id === fee.id);
  if (index >= 0) {
    state.fees[index] = fee;
  } else {
    state.fees.push(fee);
  }
  return fee;
}

export function upsertDeliveryAddress(
  restaurantId: string,
  input: Partial<Omit<DeliveryAddress, "id" | "restaurantId" | "createdAt" | "updatedAt">> & { id?: string; label: string }
) {
  const state = touchDeliveryState(restaurantId);
  const existing = input.id ? state.addresses.find((address) => address.id === input.id) ?? null : null;
  const address: DeliveryAddress = {
    id: existing?.id ?? input.id ?? createDeliveryId("addr"),
    restaurantId,
    customerId: input.customerId ?? existing?.customerId ?? null,
    label: input.label,
    street: input.street ?? existing?.street ?? null,
    number: input.number ?? existing?.number ?? null,
    neighborhood: input.neighborhood ?? existing?.neighborhood ?? null,
    city: input.city ?? existing?.city ?? null,
    state: input.state ?? existing?.state ?? null,
    country: input.country ?? existing?.country ?? null,
    postalCode: input.postalCode ?? existing?.postalCode ?? null,
    latitude: input.latitude ?? existing?.latitude ?? null,
    longitude: input.longitude ?? existing?.longitude ?? null,
    complement: input.complement ?? existing?.complement ?? null,
    notes: input.notes ?? existing?.notes ?? null,
    isDefault: input.isDefault ?? existing?.isDefault ?? false,
    active: input.active ?? existing?.active ?? true,
    createdAt: existing?.createdAt ?? now(),
    updatedAt: now(),
  };
  const index = state.addresses.findIndex((current) => current.id === address.id);
  if (index >= 0) {
    state.addresses[index] = address;
  } else {
    state.addresses.push(address);
  }
  return address;
}

export function createDispatch(
  restaurantId: string,
  input: {
    orderId: string;
    driverId?: string | null;
    mode?: Dispatch["mode"];
    status?: DeliveryOrderStatus;
    priority?: number;
    queuePosition?: number;
    notes?: string | null;
  }
) {
  const state = touchDeliveryState(restaurantId);
  const dispatch: Dispatch = {
    id: createDeliveryId("dsp"),
    restaurantId,
    orderId: input.orderId,
    driverId: input.driverId ?? null,
    mode: input.mode ?? (input.driverId ? "AUTOMATIC" : "MANUAL"),
    status: input.status ?? "RECEIVED",
    priority: input.priority ?? 0,
    queuePosition: input.queuePosition ?? state.dispatches.length + 1,
    notes: input.notes ?? null,
    assignedAt: input.driverId ? now() : null,
    startedAt: input.status === "OUT_FOR_DELIVERY" || input.status === "DELIVERED" ? now() : null,
    completedAt: input.status === "DELIVERED" ? now() : null,
    canceledAt: input.status === "CANCELED" ? now() : null,
    createdAt: now(),
    updatedAt: now(),
  };
  state.dispatches.push(dispatch);
  return dispatch;
}

export function updateDispatchStatus(
  restaurantId: string,
  dispatchId: string,
  status: DeliveryOrderStatus,
  driverId?: string | null
) {
  const state = touchDeliveryState(restaurantId);
  const dispatch = state.dispatches.find((item) => item.id === dispatchId) ?? null;
  if (!dispatch) return null;
  dispatch.status = status;
  dispatch.driverId = driverId ?? dispatch.driverId;
  dispatch.assignedAt = dispatch.assignedAt ?? (dispatch.driverId ? now() : null);
  dispatch.startedAt = status === "OUT_FOR_DELIVERY" || status === "DELIVERED" ? dispatch.startedAt ?? now() : dispatch.startedAt;
  dispatch.completedAt = status === "DELIVERED" ? now() : dispatch.completedAt;
  dispatch.canceledAt = status === "CANCELED" ? now() : dispatch.canceledAt;
  dispatch.updatedAt = now();

  if (status === "DELIVERED" && dispatch.driverId) {
    const driver = state.drivers.find((item) => item.id === dispatch.driverId) ?? null;
    if (driver) {
      driver.status = "AVAILABLE";
      driver.totalDeliveries += 1;
      driver.lastSeenAt = now();
      driver.updatedAt = now();
    }
  }

  return dispatch;
}

export function recordTrackingEvent(
  restaurantId: string,
  input: {
    orderId: string;
    dispatchId: string;
    driverId?: string | null;
    routeId?: string | null;
    type: TrackingEvent["type"];
    title?: string;
    description?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    etaMinutes?: number | null;
    actualAt?: Date | null;
    metadata?: unknown | null;
  }
) {
  const state = touchDeliveryState(restaurantId);
  const event: TrackingEvent = {
    id: createDeliveryId("trk"),
    restaurantId,
    orderId: input.orderId,
    dispatchId: input.dispatchId,
    driverId: input.driverId ?? null,
    routeId: input.routeId ?? null,
    type: input.type,
    title: input.title ?? input.type.replaceAll("_", " "),
    description: input.description ?? "Evento de tracking simulado.",
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    etaMinutes: input.etaMinutes ?? null,
    actualAt: input.actualAt ?? now(),
    metadata: input.metadata ?? { simulated: true },
    createdAt: now(),
    updatedAt: now(),
  };
  state.trackingEvents.push(event);
  return event;
}

export function createRoute(
  restaurantId: string,
  input: {
    orderId: string;
    dispatchId?: string | null;
    driverId?: string | null;
    provider?: MapProvider;
    origin?: { latitude: number; longitude: number } | null;
    destination?: { latitude: number; longitude: number } | null;
    label?: string;
  }
) {
  const state = touchDeliveryState(restaurantId);
  const provider = input.provider ?? state.settings.mapProvider;
  const estimate = estimateRoute(provider, {
    origin: input.origin,
    destination: input.destination,
    label: input.label,
  });
  const route: Route = {
    id: createDeliveryId("route"),
    restaurantId,
    orderId: input.orderId,
    dispatchId: input.dispatchId ?? null,
    driverId: input.driverId ?? null,
    provider,
    distanceKm: estimate.distanceKm,
    durationMinutes: estimate.durationMinutes,
    etaAt: estimate.etaAt,
    polyline: estimate.polyline,
    status: "PLANNED",
    metadata: {
      instructions: estimate.instructions,
    },
    createdAt: now(),
    updatedAt: now(),
  };
  state.routes.push(route);
  return route;
}

export function getDeliveryDashboard(restaurantId: string): DeliveryDashboard {
  const state = getDeliveryState(restaurantId);
  const completedDispatches = state.dispatches.filter((dispatch) => dispatch.status === "DELIVERED");
  const delayedDispatches = state.dispatches.filter((dispatch) => {
    const route = state.routes.find((item) => item.dispatchId === dispatch.id);
    if (!route || !dispatch.startedAt) return false;
    return (route.etaAt?.getTime() ?? Number.POSITIVE_INFINITY) < now().getTime() && !dispatch.completedAt;
  });
  const activeDispatches = state.dispatches.filter((dispatch) => ["RECEIVED", "PREPARING", "READY", "OUT_FOR_DELIVERY"].includes(dispatch.status));
  const averageDeliveryTimeMinutes = completedDispatches.length
    ? Math.round(
        completedDispatches.reduce((sum, dispatch) => {
          const minutes =
            dispatch.startedAt && dispatch.completedAt
              ? Math.max(Math.round((dispatch.completedAt.getTime() - dispatch.startedAt.getTime()) / 60000), 1)
              : 0;
          return sum + minutes;
        }, 0) / completedDispatches.length
      )
    : 0;
  const averageDeliveryFee = state.fees.length
    ? Math.round(state.fees.reduce((sum, fee) => sum + (fee.fixedAmount ?? 0), 0) / state.fees.length)
    : 0;
  const revenueDelivery = completedDispatches.length * averageDeliveryFee;
  const topDriver =
    state.drivers
      .slice()
      .sort((a, b) => b.totalDeliveries - a.totalDeliveries || a.name.localeCompare(b.name))[0] ?? null;

  return {
    restaurantId,
    drivers: sortByLatest(state.drivers),
    shifts: sortByLatest(state.shifts),
    zones: sortByLatest(state.zones),
    fees: sortByLatest(state.fees),
    routes: sortByLatest(state.routes),
    dispatches: sortByLatest(state.dispatches),
    trackingEvents: sortByLatest(state.trackingEvents),
    settings: state.settings,
    timeline: buildTimeline(state.trackingEvents),
    charts: {
      deliveriesByDay: Array.from({ length: 7 }, (_, index) => ({
        label: `D-${6 - index}`,
        value: Math.max(completedDispatches.length - index, 0),
      })),
      averageTime: Array.from({ length: 7 }, (_, index) => ({
        label: `D-${6 - index}`,
        value: Math.max(averageDeliveryTimeMinutes - index * 2, 4),
      })),
      drivers: state.drivers.map((driver) => ({ label: driver.name, value: driver.totalDeliveries })),
      zones: state.zones.map((zone) => ({ label: zone.name, value: zone.priority })),
    },
    kpis: {
      ordersInDelivery: activeDispatches.length,
      averageDeliveryTimeMinutes,
      completedDeliveries: completedDispatches.length,
      lateDeliveries: delayedDispatches.length,
      cancellations: state.dispatches.filter((dispatch) => dispatch.status === "CANCELED").length,
      topDriverName: topDriver?.name ?? null,
      averageDeliveryFee,
      revenueDelivery,
    },
  };
}

const getDeliveryDashboardForRevision = cache((restaurantId: string, revision: number) => {
  void revision;
  return getDeliveryDashboard(restaurantId);
});

export function getDeliveryDashboardCached(restaurantId: string) {
  const state = getDeliveryState(restaurantId);
  return getDeliveryDashboardForRevision(restaurantId, state.revision);
}

export function calculateSimulatedDeliveryFee(restaurantId: string, orderTotal: number, distanceKm: number, zoneId?: string | null) {
  const state = getDeliveryState(restaurantId);
  const zone = zoneId ? state.zones.find((item) => item.id === zoneId) ?? null : state.zones[0] ?? null;
  return calculateDeliveryFee({
    orderTotal,
    distanceKm,
    zone,
    fees: state.fees,
  });
}
