import type { OrderItem, Reservation, Table } from "@/types";

export type WhatsAppOrderPayload = {
  customerName: string;
  customerPhone: string;
  table: Pick<Table, "number">;
  items: Array<Pick<OrderItem, "quantity" | "price"> & { name: string }>;
  total: number;
  notes?: string | null;
};

export type WhatsAppReservationPayload = {
  customerName: string;
  customerPhone: string;
  reservation: Pick<Reservation, "reservationDate" | "reservationTime" | "duration" | "guests" | "confirmationCode">;
  table: Pick<Table, "number">;
};

const moneyFormatter = new Intl.NumberFormat("pt-AO", {
  style: "currency",
  currency: "AOA",
  maximumFractionDigits: 0,
});

function formatMoney(value: number) {
  return moneyFormatter.format(value);
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

export function buildWhatsAppOrderMessage(payload: WhatsAppOrderPayload) {
  const lines = [
    `Nome: ${payload.customerName}`,
    `Mesa: ${payload.table.number}`,
    "Pedido:",
    ...payload.items.map((item) => `- ${item.quantity}x ${item.name} (${formatMoney(item.price * item.quantity)})`),
    `Quantidade: ${payload.items.reduce((sum, item) => sum + item.quantity, 0)}`,
    `Total: ${formatMoney(payload.total)}`,
    `Observações: ${payload.notes?.trim() ? payload.notes.trim() : "Sem observações"}`,
  ];

  return lines.join("\n");
}

export function buildWhatsAppOrderUrl(phone: string | null | undefined, message: string) {
  const normalizedPhone = phone ? normalizePhone(phone) : "";
  if (!normalizedPhone) {
    return null;
  }

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

export function buildReservationWhatsAppMessage(payload: WhatsAppReservationPayload) {
  return [
    `Olá ${payload.customerName}!`,
    "",
    "Sua reserva foi confirmada.",
    `Data: ${payload.reservation.reservationDate}`,
    `Horário: ${payload.reservation.reservationTime}`,
    `Mesa: ${payload.table.number}`,
    `Pessoas: ${payload.reservation.guests}`,
    `Duração: ${payload.reservation.duration} minutos`,
    `Código: ${payload.reservation.confirmationCode}`,
  ].join("\n");
}

export function buildReservationWhatsAppUrl(phone: string | null | undefined, message: string) {
  return buildWhatsAppOrderUrl(phone, message);
}
