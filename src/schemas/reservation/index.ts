import { z } from "zod";
import { idSchema, paginationSchema } from "../common";

export const reservationStatusValues = [
  "PENDING",
  "CONFIRMED",
  "CHECKED_IN",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
] as const;

export const reservationSourceValues = ["WEBSITE", "WHATSAPP", "PHONE", "ADMIN", "WALK_IN"] as const;

export const reservationStatusSchema = z.enum(reservationStatusValues);
export const reservationSourceSchema = z.enum(reservationSourceValues);

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.");
const timeSchema = z.string().regex(/^\d{2}:\d{2}$/, "Informe um horário válido.");

const optionalString = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}, z.string().optional().nullable());

const optionalEmail = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}, z.string().email().optional().nullable());

export const reservationBaseSchema = z.object({
  tableId: idSchema,
  customerName: z.string().min(2, "Informe um nome com pelo menos 2 caracteres.").max(120),
  customerPhone: z.string().min(6, "Informe um telefone válido.").max(30),
  customerEmail: optionalEmail,
  guests: z.coerce.number().int().min(1, "Informe ao menos 1 pessoa.").max(50, "Quantidade de pessoas acima do limite."),
  reservationDate: dateSchema,
  reservationTime: timeSchema,
  duration: z.coerce.number().int().min(15, "A reserva precisa ter ao menos 15 minutos.").max(480, "Duração acima do limite."),
  notes: optionalString,
  source: reservationSourceSchema.default("WEBSITE"),
});

export const createReservationSchema = reservationBaseSchema;

export const updateReservationSchema = reservationBaseSchema.extend({
  id: idSchema,
  status: reservationStatusSchema.optional(),
});

export const confirmReservationSchema = z.object({
  id: idSchema,
});

export const cancelReservationSchema = z.object({
  id: idSchema,
  reason: optionalString,
});

export const checkInReservationSchema = z.object({
  id: idSchema,
});

export const completeReservationSchema = z.object({
  id: idSchema,
});

export const reservationFiltersSchema = paginationSchema.extend({
  search: z.string().optional().default(""),
  status: reservationStatusSchema.optional().or(z.literal("all")).default("all"),
  period: z.enum(["today", "tomorrow", "week", "month", "custom"]).default("today"),
  date: dateSchema.optional(),
  view: z.enum(["day", "week", "month"]).default("day"),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type UpdateReservationInput = z.infer<typeof updateReservationSchema>;
export type ConfirmReservationInput = z.infer<typeof confirmReservationSchema>;
export type CancelReservationInput = z.infer<typeof cancelReservationSchema>;
export type CheckInReservationInput = z.infer<typeof checkInReservationSchema>;
export type CompleteReservationInput = z.infer<typeof completeReservationSchema>;
export type ReservationFiltersInput = z.infer<typeof reservationFiltersSchema>;
