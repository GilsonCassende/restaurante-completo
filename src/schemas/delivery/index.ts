import { z } from "zod";
import { idSchema } from "../common";

const optionalText = z.preprocess((value) => (value === "" ? undefined : value), z.string().max(250).optional());
const optionalLongText = z.preprocess((value) => (value === "" ? undefined : value), z.string().max(1000).optional());
const optionalNumber = z.preprocess((value) => (value === "" ? undefined : value), z.coerce.number().optional());
const optionalDate = z.preprocess((value) => (value === "" ? undefined : value), z.coerce.date().optional());

export const driverStatusValues = ["AVAILABLE", "BUSY", "OFFLINE", "IN_DELIVERY"] as const;
export const deliveryOrderStatusValues = ["RECEIVED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELED"] as const;
export const driverShiftStatusValues = ["SCHEDULED", "ACTIVE", "COMPLETED", "MISSED", "CANCELED"] as const;
export const deliveryZoneTypeValues = ["NEIGHBORHOOD", "POSTAL_CODE", "RADIUS", "POLYGON"] as const;
export const deliveryFeeTypeValues = ["FIXED", "DISTANCE", "ZONE", "FREE_SHIPPING", "MINIMUM_ORDER", "PROMOTION"] as const;
export const dispatchModeValues = ["MANUAL", "AUTOMATIC"] as const;
export const mapProviderValues = ["GOOGLE_MAPS", "MAPBOX", "OPENSTREETMAP"] as const;
export const trackingEventTypeValues = [
  "ORDER_RECEIVED",
  "PREPARING",
  "READY",
  "DRIVER_ASSIGNED",
  "OUT_FOR_DELIVERY",
  "LOCATION_UPDATE",
  "DELIVERED",
  "CANCELED",
  "ETA_UPDATED",
  "DELAYED",
] as const;
export const routeStatusValues = ["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELED"] as const;

export const driverStatusSchema = z.enum(driverStatusValues);
export const deliveryOrderStatusSchema = z.enum(deliveryOrderStatusValues);
export const driverShiftStatusSchema = z.enum(driverShiftStatusValues);
export const deliveryZoneTypeSchema = z.enum(deliveryZoneTypeValues);
export const deliveryFeeTypeSchema = z.enum(deliveryFeeTypeValues);
export const dispatchModeSchema = z.enum(dispatchModeValues);
export const mapProviderSchema = z.enum(mapProviderValues);
export const trackingEventTypeSchema = z.enum(trackingEventTypeValues);
export const routeStatusSchema = z.enum(routeStatusValues);

export const deliveryAddressSchema = z.object({
  id: idSchema.optional(),
  label: z.string().min(2).max(120),
  customerId: idSchema.nullish(),
  street: optionalText.nullish(),
  number: optionalText.nullish(),
  neighborhood: optionalText.nullish(),
  city: optionalText.nullish(),
  state: optionalText.nullish(),
  country: optionalText.nullish(),
  postalCode: optionalText.nullish(),
  latitude: optionalNumber.nullish(),
  longitude: optionalNumber.nullish(),
  complement: optionalLongText.nullish(),
  notes: optionalLongText.nullish(),
  isDefault: z.coerce.boolean().default(false),
  active: z.coerce.boolean().default(true),
});

export const driverSchema = z.object({
  id: idSchema.optional(),
  name: z.string().min(2).max(120),
  phone: z.string().min(5).max(30),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  vehicleType: optionalText.nullish(),
  vehiclePlate: optionalText.nullish(),
  licenseNumber: optionalText.nullish(),
  status: driverStatusSchema.default("AVAILABLE"),
  currentZoneId: idSchema.nullish(),
  currentLatitude: optionalNumber.nullish(),
  currentLongitude: optionalNumber.nullish(),
  rating: z.coerce.number().min(0).max(5).default(5),
  totalDeliveries: z.coerce.number().int().min(0).default(0),
  totalDistanceKm: z.coerce.number().min(0).default(0),
  active: z.coerce.boolean().default(true),
  onlineSince: optionalDate.nullish(),
  lastSeenAt: optionalDate.nullish(),
});

export const driverShiftSchema = z.object({
  id: idSchema.optional(),
  driverId: idSchema,
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  status: driverShiftStatusSchema.default("SCHEDULED"),
  notes: optionalLongText.nullish(),
});

export const deliveryZoneSchema = z.object({
  id: idSchema.optional(),
  name: z.string().min(2).max(120),
  type: deliveryZoneTypeSchema,
  description: optionalLongText.nullish(),
  neighborhood: optionalText.nullish(),
  postalCodes: z.array(z.string()).optional().nullable(),
  polygon: z
    .array(
      z.object({
        latitude: z.coerce.number(),
        longitude: z.coerce.number(),
      })
    )
    .optional()
    .nullable(),
  radiusKm: z.coerce.number().min(0).optional().nullable(),
  centerLatitude: z.coerce.number().optional().nullable(),
  centerLongitude: z.coerce.number().optional().nullable(),
  priority: z.coerce.number().int().min(0).default(0),
  minOrderAmount: z.coerce.number().min(0).optional().nullable(),
  active: z.coerce.boolean().default(true),
});

export const deliveryFeeSchema = z.object({
  id: idSchema.optional(),
  zoneId: idSchema.nullish(),
  name: z.string().min(2).max(120),
  type: deliveryFeeTypeSchema,
  fixedAmount: z.coerce.number().min(0).optional().nullable(),
  perKmAmount: z.coerce.number().min(0).optional().nullable(),
  minimumOrderAmount: z.coerce.number().min(0).optional().nullable(),
  freeShippingThreshold: z.coerce.number().min(0).optional().nullable(),
  promotionLabel: optionalText.nullish(),
  active: z.coerce.boolean().default(true),
});

export const dispatchSchema = z.object({
  id: idSchema.optional(),
  orderId: idSchema,
  driverId: idSchema.nullish(),
  mode: dispatchModeSchema.default("MANUAL"),
  status: deliveryOrderStatusSchema.default("RECEIVED"),
  priority: z.coerce.number().int().min(0).default(0),
  queuePosition: z.coerce.number().int().min(0).default(0),
  notes: optionalLongText.nullish(),
});

export const trackingEventSchema = z.object({
  id: idSchema.optional(),
  orderId: idSchema,
  dispatchId: idSchema,
  driverId: idSchema.nullish(),
  routeId: idSchema.nullish(),
  type: trackingEventTypeSchema,
  title: z.string().min(2).max(120).optional(),
  description: optionalLongText.nullish(),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  etaMinutes: z.coerce.number().int().min(0).optional().nullable(),
  actualAt: optionalDate.nullish(),
  metadata: z.unknown().optional().nullable(),
});

export const routeSchema = z.object({
  id: idSchema.optional(),
  orderId: idSchema,
  dispatchId: idSchema.nullish(),
  driverId: idSchema.nullish(),
  provider: mapProviderSchema.default("GOOGLE_MAPS"),
  originLatitude: z.coerce.number().optional().nullable(),
  originLongitude: z.coerce.number().optional().nullable(),
  destinationLatitude: z.coerce.number().optional().nullable(),
  destinationLongitude: z.coerce.number().optional().nullable(),
  label: optionalText.nullish(),
  status: routeStatusSchema.default("PLANNED"),
});

export const deliverySettingsSchema = z.object({
  defaultDispatchMode: dispatchModeSchema.default("AUTOMATIC"),
  autoAssignDrivers: z.coerce.boolean().default(true),
  allowScheduledDelivery: z.coerce.boolean().default(true),
  defaultEstimatedMinutes: z.coerce.number().int().min(1).default(35),
  mapProvider: mapProviderSchema.default("GOOGLE_MAPS"),
  notificationChannels: z.object({
    push: z.coerce.boolean().default(true),
    whatsapp: z.coerce.boolean().default(true),
    sms: z.coerce.boolean().default(false),
    email: z.coerce.boolean().default(true),
  }),
  preparedForRealtimeTracking: z.coerce.boolean().default(true),
  active: z.coerce.boolean().default(true),
});

export const deliveryDashboardFilterSchema = z.object({
  period: z.enum(["today", "yesterday", "last_7_days", "last_30_days", "this_month", "last_month", "this_year", "custom"]).default("last_7_days"),
  status: deliveryOrderStatusSchema.optional(),
});

export type DriverInput = z.infer<typeof driverSchema>;
export type DriverShiftInput = z.infer<typeof driverShiftSchema>;
export type DeliveryZoneInput = z.infer<typeof deliveryZoneSchema>;
export type DeliveryFeeInput = z.infer<typeof deliveryFeeSchema>;
export type DispatchInput = z.infer<typeof dispatchSchema>;
export type TrackingEventInput = z.infer<typeof trackingEventSchema>;
export type RouteInput = z.infer<typeof routeSchema>;
export type DeliverySettingsInput = z.infer<typeof deliverySettingsSchema>;
export type DeliveryDashboardFilterInput = z.infer<typeof deliveryDashboardFilterSchema>;

