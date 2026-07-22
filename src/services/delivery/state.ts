import { randomUUID } from "node:crypto";
import type {
  DeliveryAddress,
  DeliveryFee,
  DeliveryOrderStatus,
  DeliverySettings,
  DeliveryZone,
  Dispatch,
  Driver,
  DriverShift,
  Route,
  TrackingEvent,
} from "@/types";

export type DeliveryState = {
  revision: number;
  addresses: DeliveryAddress[];
  drivers: Driver[];
  shifts: DriverShift[];
  zones: DeliveryZone[];
  fees: DeliveryFee[];
  routes: Route[];
  trackingEvents: TrackingEvent[];
  dispatches: Dispatch[];
  settings: DeliverySettings;
};

const stores = new Map<string, DeliveryState>();

function now() {
  return new Date();
}

function makeId(prefix: string) {
  return `${prefix}_${randomUUID().replace(/-/g, "")}`;
}

function makeTimestamp(minutesAgo: number) {
  return new Date(Date.now() - minutesAgo * 60_000);
}

function createDriver(restaurantId: string, status: Driver["status"], name: string, totalDeliveries: number): Driver {
  const createdAt = makeTimestamp(60 * 24);
  return {
    id: makeId("drv"),
    restaurantId,
    userId: null,
    name,
    phone: "+244 900 000 000",
    email: null,
    vehicleType: "Scooter",
    vehiclePlate: null,
    licenseNumber: null,
    status,
    currentZoneId: null,
    currentLatitude: -8.8383,
    currentLongitude: 13.2344,
    rating: 4.8,
    totalDeliveries,
    totalDistanceKm: totalDeliveries * 4.6,
    active: true,
    onlineSince: status === "OFFLINE" ? null : makeTimestamp(120),
    lastSeenAt: makeTimestamp(4),
    createdAt,
    updatedAt: createdAt,
  };
}

function createZone(restaurantId: string, name: string, type: DeliveryZone["type"], priority: number): DeliveryZone {
  const createdAt = makeTimestamp(90);
  return {
    id: makeId("zone"),
    restaurantId,
    name,
    type,
    description: `${name} preparada para entrega simulada.`,
    neighborhood: type === "NEIGHBORHOOD" ? name : null,
    postalCodes: type === "POSTAL_CODE" ? ["0000-000", "0001-000"] : null,
    polygon:
      type === "POLYGON"
        ? [
            { latitude: -8.83, longitude: 13.22 },
            { latitude: -8.82, longitude: 13.26 },
            { latitude: -8.85, longitude: 13.27 },
          ]
        : null,
    radiusKm: type === "RADIUS" ? 6 : null,
    centerLatitude: -8.8383,
    centerLongitude: 13.2344,
    priority,
    minOrderAmount: priority === 1 ? 0 : 12000,
    active: true,
    createdAt,
    updatedAt: createdAt,
  };
}

function createFee(restaurantId: string, zoneId: string | null, type: DeliveryFee["type"], amount: number): DeliveryFee {
  const createdAt = makeTimestamp(70);
  return {
    id: makeId("fee"),
    restaurantId,
    zoneId,
    name: `${type} fee`,
    type,
    fixedAmount: type === "DISTANCE" ? null : amount,
    perKmAmount: type === "DISTANCE" ? 150 : null,
    minimumOrderAmount: type === "MINIMUM_ORDER" ? 10000 : null,
    freeShippingThreshold: type === "FREE_SHIPPING" ? 20000 : null,
    promotionLabel: type === "PROMOTION" ? "Promo entrega grátis" : null,
    active: true,
    createdAt,
    updatedAt: createdAt,
  };
}

function createShift(restaurantId: string, driverId: string, status: DriverShift["status"], startOffset: number, durationHours: number): DriverShift {
  const startAt = new Date(Date.now() + startOffset * 60_000);
  const endAt = new Date(startAt.getTime() + durationHours * 60 * 60_000);
  const createdAt = makeTimestamp(300);
  return {
    id: makeId("shift"),
    restaurantId,
    driverId,
    startAt,
    endAt,
    status,
    notes: status === "ACTIVE" ? "Escala operacional do turno" : null,
    createdAt,
    updatedAt: createdAt,
  };
}

function createDispatch(
  restaurantId: string,
  orderId: string,
  driverId: string | null,
  status: DeliveryOrderStatus,
  priority: number,
  queuePosition: number
): Dispatch {
  const createdAt = makeTimestamp(priority * 10);
  return {
    id: makeId("dsp"),
    restaurantId,
    orderId,
    driverId,
    mode: driverId ? "AUTOMATIC" : "MANUAL",
    status,
    priority,
    queuePosition,
    notes: status === "OUT_FOR_DELIVERY" ? "Saída simulada para entrega." : null,
    assignedAt: driverId ? makeTimestamp(25) : null,
    startedAt: status === "OUT_FOR_DELIVERY" || status === "DELIVERED" ? makeTimestamp(18) : null,
    completedAt: status === "DELIVERED" ? makeTimestamp(2) : null,
    canceledAt: status === "CANCELED" ? makeTimestamp(3) : null,
    createdAt,
    updatedAt: createdAt,
  };
}

function createRoute(restaurantId: string, orderId: string, dispatchId: string, driverId: string | null, provider: Route["provider"], status: Route["status"]): Route {
  const createdAt = makeTimestamp(22);
  return {
    id: makeId("route"),
    restaurantId,
    orderId,
    dispatchId,
    driverId,
    provider,
    distanceKm: 4.6,
    durationMinutes: 17,
    etaAt: makeTimestamp(-6),
    polyline: JSON.stringify({ provider, orderId, dispatchId }),
    status,
    metadata: { simulated: true },
    createdAt,
    updatedAt: createdAt,
  };
}

function createTrackingEvent(
  restaurantId: string,
  orderId: string,
  dispatchId: string,
  driverId: string | null,
  routeId: string | null,
  type: TrackingEvent["type"],
  minutesAgo: number,
  etaMinutes: number | null
): TrackingEvent {
  const createdAt = makeTimestamp(minutesAgo);
  return {
    id: makeId("trk"),
    restaurantId,
    orderId,
    dispatchId,
    driverId,
    routeId,
    type,
    title: type.replaceAll("_", " "),
    description: "Evento simulado para a timeline de tracking.",
    latitude: -8.8383 + minutesAgo / 1000,
    longitude: 13.2344 + minutesAgo / 1000,
    etaMinutes,
    actualAt: createdAt,
    metadata: { simulated: true, minutesAgo },
    createdAt,
    updatedAt: createdAt,
  };
}

function buildSeed(restaurantId: string): DeliveryState {
  const drivers = [
    createDriver(restaurantId, "AVAILABLE", "Ana Quilala", 128),
    createDriver(restaurantId, "BUSY", "Carlos Kiala", 86),
    createDriver(restaurantId, "IN_DELIVERY", "Marta Pedro", 141),
  ];
  const zones = [
    createZone(restaurantId, "Centro", "NEIGHBORHOOD", 1),
    createZone(restaurantId, "Talatona", "POSTAL_CODE", 2),
    createZone(restaurantId, "Raio Sul", "RADIUS", 3),
    createZone(restaurantId, "Polígono Premium", "POLYGON", 4),
  ];
  const fees = [
    createFee(restaurantId, zones[0].id, "FIXED", 2500),
    createFee(restaurantId, zones[2].id, "DISTANCE", 0),
    createFee(restaurantId, null, "FREE_SHIPPING", 0),
    createFee(restaurantId, zones[1].id, "MINIMUM_ORDER", 2000),
    createFee(restaurantId, zones[3].id, "PROMOTION", 0),
  ];
  const dispatches = [
    createDispatch(restaurantId, makeId("order"), drivers[0].id, "RECEIVED", 1, 1),
    createDispatch(restaurantId, makeId("order"), drivers[1].id, "OUT_FOR_DELIVERY", 2, 2),
    createDispatch(restaurantId, makeId("order"), drivers[2].id, "DELIVERED", 3, 3),
    createDispatch(restaurantId, makeId("order"), null, "CANCELED", 4, 4),
  ];
  const routes = [
    createRoute(restaurantId, dispatches[0].orderId, dispatches[0].id, dispatches[0].driverId, "GOOGLE_MAPS", "PLANNED"),
    createRoute(restaurantId, dispatches[2].orderId, dispatches[2].id, dispatches[2].driverId, "MAPBOX", "IN_PROGRESS"),
  ];
  const trackingEvents = [
    createTrackingEvent(restaurantId, dispatches[0].orderId, dispatches[0].id, dispatches[0].driverId, routes[0].id, "ORDER_RECEIVED", 60, 32),
    createTrackingEvent(restaurantId, dispatches[0].orderId, dispatches[0].id, dispatches[0].driverId, routes[0].id, "DRIVER_ASSIGNED", 45, 28),
    createTrackingEvent(restaurantId, dispatches[2].orderId, dispatches[2].id, dispatches[2].driverId, routes[1].id, "OUT_FOR_DELIVERY", 12, 15),
    createTrackingEvent(restaurantId, dispatches[2].orderId, dispatches[2].id, dispatches[2].driverId, routes[1].id, "DELIVERED", 2, null),
  ];
  const shifts = [
    createShift(restaurantId, drivers[0].id, "ACTIVE", -60, 8),
    createShift(restaurantId, drivers[1].id, "SCHEDULED", 180, 8),
    createShift(restaurantId, drivers[2].id, "ACTIVE", -120, 8),
  ];
  const addresses: DeliveryAddress[] = [
    {
      id: makeId("addr"),
      restaurantId,
      customerId: null,
      label: "Cliente VIP - Centro",
      street: "Rua da Missão",
      number: "18",
      neighborhood: "Centro",
      city: "Luanda",
      state: "Luanda",
      country: "Angola",
      postalCode: "0000-001",
      latitude: -8.8381,
      longitude: 13.2349,
      complement: "Apartamento 4B",
      notes: "Entrada lateral",
      isDefault: true,
      active: true,
      createdAt: now(),
      updatedAt: now(),
    },
  ];

  const createdAt = now();
  return {
    revision: 1,
    addresses,
    drivers,
    shifts,
    zones,
    fees,
    routes,
    trackingEvents,
    dispatches,
    settings: {
      id: makeId("delset"),
      restaurantId,
      defaultDispatchMode: "AUTOMATIC",
      autoAssignDrivers: true,
      allowScheduledDelivery: true,
      defaultEstimatedMinutes: 35,
      mapProvider: "GOOGLE_MAPS",
      notificationChannels: {
        push: true,
        whatsapp: true,
        sms: false,
        email: true,
      },
      preparedForRealtimeTracking: true,
      active: true,
      createdAt,
      updatedAt: createdAt,
    },
  };
}

export function getDeliveryState(restaurantId: string) {
  const current = stores.get(restaurantId);
  if (current) {
    return current;
  }

  const state = buildSeed(restaurantId);
  stores.set(restaurantId, state);
  return state;
}

export function touchDeliveryState(restaurantId: string) {
  const state = getDeliveryState(restaurantId);
  state.revision += 1;
  state.settings.updatedAt = now();
  return state;
}

export function createDeliveryId(prefix: string) {
  return makeId(prefix);
}

