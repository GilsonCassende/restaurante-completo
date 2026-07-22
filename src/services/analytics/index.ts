import {
  findRestaurantById,
  listCategoriesByRestaurant,
  listCustomersByRestaurant,
  listOrdersByRestaurant,
  listReservationsByRestaurant,
  listTablesByRestaurant,
} from "@/prisma";
import { jsPDF } from "jspdf";
import { getCashbackDashboard } from "@/services/cashback";
import { getCouponDashboard } from "@/services/coupons";
import { getLoyaltyDashboard } from "@/services/loyalty";
import { withTenantCache } from "@/lib/production";
import * as XLSX from "xlsx";
import type { AnalyticsFilterInput, AnalyticsPeriod } from "@/schemas";
import type { CashbackDashboard } from "@/services/cashback";
import type { CouponDashboard } from "@/services/coupons";
import type { LoyaltyDashboard } from "@/services/loyalty";
import type {
  Customer,
  OrderWithDetails,
  ReservationStatus,
  ReservationWithDetails,
  Restaurant,
  Table,
} from "@/types";

const CURRENCY = "AOA";
const ESTIMATED_MARGIN = 0.3;
const NEGATIVE_ALERT_THRESHOLD = -0.1;

type DateWindow = {
  start: string;
  end: string;
};

type Range = DateWindow & {
  label: string;
};

type AnalyticsTrendPoint = {
  label: string;
  revenue: number;
  orders: number;
  reservations: number;
  averageTicket: number;
};

type AnalyticsPieSlice = {
  name: string;
  value: number;
  color: string;
};

type AnalyticsRadarPoint = {
  metric: string;
  value: number;
};

type AnalyticsHeatmapCell = {
  day: string;
  hour: string;
  value: number;
};

type AnalyticsComparison = {
  label: string;
  current: number;
  previous: number;
  delta: number;
  deltaPercent: number;
};

type AnalyticsRankingItem = {
  label: string;
  value: number;
  meta?: string;
};

type AnalyticsInsight = {
  title: string;
  description: string;
  severity: "info" | "success" | "warning";
};

type AnalyticsAlert = {
  title: string;
  description: string;
  severity: "info" | "warning" | "danger";
  status: "active" | "prepared";
};

export type AnalyticsDashboard = {
  restaurant: Pick<Restaurant, "id" | "name" | "timezone" | "currency" | "averagePreparationTime"> | null;
  period: Range;
  kpis: {
    revenueToday: number;
    revenueWeek: number;
    revenueMonth: number;
    revenueYear: number;
    orders: number;
    averageTicket: number;
    newCustomers: number;
    recurringCustomers: number;
    estimatedProfit: number;
    productsSold: number;
    tablesOccupied: number;
    reservations: number;
    conversionRate: number;
    cancellations: number;
    noShow: number;
    cashbackIssued: number;
    cashbackRedeemed: number;
    pointsIssued: number;
    pointsRedeemed: number;
    couponsUsed: number;
  };
  comparisons: AnalyticsComparison[];
  trends: {
    revenue: AnalyticsTrendPoint[];
    orders: AnalyticsTrendPoint[];
    area: AnalyticsTrendPoint[];
    radar: AnalyticsRadarPoint[];
    heatmap: AnalyticsHeatmapCell[];
    categoryShare: AnalyticsPieSlice[];
  };
  rankings: {
    topProducts: AnalyticsRankingItem[];
    bottomProducts: AnalyticsRankingItem[];
    topCategories: AnalyticsRankingItem[];
    topCustomers: AnalyticsRankingItem[];
    peakHour: string;
    peakDay: string;
    averagePreparationTime: number;
    averageServiceTime: number;
    averageReservationTime: number;
    inactiveCustomers: number;
    vipCustomers: number;
  };
  insights: AnalyticsInsight[];
  alerts: AnalyticsAlert[];
  tables: {
    total: number;
    occupied: number;
    free: number;
    reserved: number;
    occupiedRate: number;
  };
  timeline: Array<{
    label: string;
    description: string;
    meta: string;
  }>;
  summary: {
    revenue: number;
    orders: number;
    customers: number;
    reservations: number;
  };
};

type AnalyticsSources = {
  restaurant: Pick<Restaurant, "id" | "name" | "timezone" | "currency" | "averagePreparationTime"> | null;
  customers: Customer[];
  orders: OrderWithDetails[];
  reservations: ReservationWithDetails[];
  tables: Table[];
  categories: Array<{ id: string; name: string }>;
  cashback: CashbackDashboard;
  coupons: CouponDashboard;
  loyalty: LoyaltyDashboard;
};

const analyticsSources = withTenantCache("analytics", async (restaurantId: string): Promise<AnalyticsSources> => {
  const [restaurant, categories, customers, orders, reservations, tables, cashback, coupons, loyalty] = await Promise.all([
    findRestaurantById(restaurantId),
    listCategoriesByRestaurant(restaurantId),
    listCustomersByRestaurant(restaurantId),
    listOrdersByRestaurant(restaurantId),
    listReservationsByRestaurant(restaurantId),
    listTablesByRestaurant(restaurantId),
    getCashbackDashboard(restaurantId),
    getCouponDashboard(restaurantId),
    getLoyaltyDashboard(restaurantId),
  ]);

  return {
    restaurant: restaurant
      ? {
          id: restaurant.id,
          name: restaurant.name,
          timezone: restaurant.timezone,
          currency: restaurant.currency,
          averagePreparationTime: restaurant.averagePreparationTime,
        }
    : null,
    customers,
    orders,
    reservations,
    tables,
    categories,
    cashback,
    coupons,
    loyalty,
  };
}, {
  tenantIndex: 0,
  keyPrefix: "analytics-sources",
  revalidate: 120,
});

function normalizeCurrency(value: number, currency = CURRENCY) {
  return new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function normalizePercent(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}

function normalizeDateKey(date: Date, timeZone?: string | null) {
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

function normalizeHourKey(date: Date, timeZone?: string | null) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: timeZone ?? undefined,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  } catch {
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }
}

function normalizeWeekdayKey(date: Date, timeZone?: string | null) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timeZone ?? undefined,
      weekday: "long",
    }).format(date).toLowerCase();
  } catch {
    return ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][date.getUTCDay()];
  }
}

function normalizeMonthLabel(dateKey: string) {
  const parsed = new Date(`${dateKey}T00:00:00.000Z`);
  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "2-digit",
  }).format(parsed);
}

function normalizeDayLabel(dateKey: string) {
  const parsed = new Date(`${dateKey}T00:00:00.000Z`);
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
  }).format(parsed);
}

function normalizeHourLabel(hourKey: string) {
  return hourKey.slice(0, 2);
}

function addDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function diffDays(start: string, end: string) {
  const startDate = new Date(`${start}T00:00:00.000Z`);
  const endDate = new Date(`${end}T00:00:00.000Z`);
  return Math.max(Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1, 1);
}

function buildPeriodRange(period: AnalyticsPeriod, timeZone?: string | null, startDate?: string | null, endDate?: string | null): Range {
  const today = normalizeDateKey(new Date(), timeZone);

  switch (period) {
    case "today":
      return { start: today, end: today, label: "Hoje" };
    case "yesterday":
      return { start: addDays(today, -1), end: addDays(today, -1), label: "Ontem" };
    case "last_7_days":
      return { start: addDays(today, -6), end: today, label: "Últimos 7 dias" };
    case "last_30_days":
      return { start: addDays(today, -29), end: today, label: "Últimos 30 dias" };
    case "this_month":
      return { start: today.slice(0, 8) + "01", end: today, label: "Este mês" };
    case "last_month": {
      const current = new Date(`${today}T00:00:00.000Z`);
      current.setUTCDate(1);
      current.setUTCMonth(current.getUTCMonth() - 1);
      const start = current.toISOString().slice(0, 10);
      const endDateValue = new Date(`${start}T00:00:00.000Z`);
      endDateValue.setUTCMonth(endDateValue.getUTCMonth() + 1);
      endDateValue.setUTCDate(0);
      return { start, end: endDateValue.toISOString().slice(0, 10), label: "Último mês" };
    }
    case "this_year":
      return { start: today.slice(0, 4) + "-01-01", end: today, label: "Este ano" };
    case "custom":
      return {
        start: startDate ?? addDays(today, -29),
        end: endDate ?? today,
        label: "Período personalizado",
      };
    default:
      return { start: addDays(today, -29), end: today, label: "Últimos 30 dias" };
  }
}

function buildPreviousRange(range: DateWindow) {
  const totalDays = diffDays(range.start, range.end);
  const previousEnd = addDays(range.start, -1);
  const previousStart = addDays(previousEnd, -(totalDays - 1));
  return { start: previousStart, end: previousEnd };
}

function isInRange(dateKey: string, range: DateWindow) {
  return dateKey >= range.start && dateKey <= range.end;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function avg(values: number[]) {
  return values.length ? sum(values) / values.length : 0;
}

function buildTimelineLabel(date: Date, timeZone?: string | null) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timeZone ?? undefined,
  }).format(date);
}

function makeColor(index: number) {
  const palette = ["#0ea5e9", "#f59e0b", "#10b981", "#6366f1", "#ef4444", "#8b5cf6", "#14b8a6"];
  return palette[index % palette.length];
}

function getOrderRevenue(order: OrderWithDetails) {
  return order.total;
}

function getOrderQuantity(order: OrderWithDetails) {
  return order.items.reduce((total, item) => total + item.quantity, 0);
}

function getReservationStatusSet() {
  return new Set<ReservationStatus>(["PENDING", "CONFIRMED", "CHECKED_IN"]);
}

function getOrderStatusSet() {
  return new Set(["PENDING", "PREPARING", "READY"]);
}

function buildGroupedTrend(
  orders: OrderWithDetails[],
  reservations: ReservationWithDetails[],
  restaurant: AnalyticsSources["restaurant"],
  range: DateWindow,
  bucket: "day" | "month"
): AnalyticsTrendPoint[] {
  const map = new Map<string, AnalyticsTrendPoint>();
  const timezone = restaurant?.timezone ?? null;

  const ensurePoint = (label: string) => {
    if (!map.has(label)) {
      map.set(label, { label, revenue: 0, orders: 0, reservations: 0, averageTicket: 0 });
    }
    return map.get(label)!;
  };

  for (const order of orders) {
    const dateKey = normalizeDateKey(order.createdAt, timezone);
    if (!isInRange(dateKey, range)) continue;
    const label = bucket === "month" ? normalizeMonthLabel(dateKey) : normalizeDayLabel(dateKey);
    const point = ensurePoint(label);
    point.revenue += getOrderRevenue(order);
    point.orders += 1;
  }

  for (const reservation of reservations) {
    const dateKey = reservation.reservationDate;
    if (!isInRange(dateKey, range)) continue;
    const label = bucket === "month" ? normalizeMonthLabel(dateKey) : normalizeDayLabel(dateKey);
    const point = ensurePoint(label);
    point.reservations += 1;
  }

  return Array.from(map.values()).map((point) => ({
    ...point,
    averageTicket: point.orders ? point.revenue / point.orders : 0,
  }));
}

function buildHeatmap(orders: OrderWithDetails[], restaurant: AnalyticsSources["restaurant"], range: Range): AnalyticsHeatmapCell[] {
  const timezone = restaurant?.timezone ?? null;
  const days = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  const hours = Array.from({ length: 24 }, (_, index) => `${String(index).padStart(2, "0")}:00`);
  const matrix = new Map<string, number>();

  for (const order of orders) {
    const dateKey = normalizeDateKey(order.createdAt, timezone);
    if (!isInRange(dateKey, range)) continue;
    const day = days[["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].indexOf(normalizeWeekdayKey(order.createdAt, timezone))];
    const hour = normalizeHourLabel(normalizeHourKey(order.createdAt, timezone));
    const key = `${day}__${hour}`;
    matrix.set(key, (matrix.get(key) ?? 0) + 1);
  }

  return days.flatMap((day) =>
    hours.map((hour) => ({
      day,
      hour,
      value: matrix.get(`${day}__${hour}`) ?? 0,
    }))
  );
}

function buildRanking(
  items: Map<string, { label: string; value: number; meta?: string }>,
  direction: "asc" | "desc" = "desc",
  limit = 5
) {
  return Array.from(items.values())
    .sort((a, b) => (direction === "desc" ? b.value - a.value : a.value - b.value))
    .slice(0, limit);
}

function getCustomerLabel(customer: Customer) {
  return customer.name;
}

function buildOrderTimeline(orders: OrderWithDetails[], reservations: ReservationWithDetails[], timezone?: string | null) {
  const entries = [
    ...orders.map((order) => ({
      label: `Pedido #${order.id.slice(-6)}`,
      description: `${order.customerName} · ${normalizeCurrency(order.total)}`,
      meta: buildTimelineLabel(order.createdAt, timezone),
      date: order.createdAt,
    })),
    ...reservations.map((reservation) => ({
      label: `Reserva ${reservation.confirmationCode}`,
      description: `${reservation.customerName} · Mesa ${reservation.table.number}`,
      meta: buildTimelineLabel(reservation.createdAt, timezone),
      date: reservation.createdAt,
    })),
  ];

  return entries
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 12)
    .map(({ label, description, meta }) => ({
      label,
      description,
      meta,
    }));
}

function calculateAverageServiceTime(orders: OrderWithDetails[]) {
  const deliveredOrders = orders.filter((order) => order.status === "DELIVERED");
  if (!deliveredOrders.length) return 0;
  const totalMinutes = deliveredOrders.reduce((total, order) => {
    const minutes = Math.max((order.updatedAt.getTime() - order.createdAt.getTime()) / 60000, 0);
    return total + minutes;
  }, 0);
  return totalMinutes / deliveredOrders.length;
}

function calculateAverageReservationTime(reservations: ReservationWithDetails[]) {
  if (!reservations.length) return 0;
  return avg(reservations.map((reservation) => reservation.duration));
}

function calculateAveragePreparationTime(orders: OrderWithDetails[], restaurant: AnalyticsSources["restaurant"]) {
  const durations = orders
    .flatMap((order) => order.items.map((item) => item.product.preparationTime ?? restaurant?.averagePreparationTime ?? 0))
    .filter((value) => value > 0);
  return avg(durations);
}

function calculateOrderComparisons(currentOrders: OrderWithDetails[], previousOrders: OrderWithDetails[], currentReservations: ReservationWithDetails[], previousReservations: ReservationWithDetails[], currentCustomers: Customer[], previousCustomers: Customer[]) {
  return [
    {
      label: "Faturamento",
      current: sum(currentOrders.map(getOrderRevenue)),
      previous: sum(previousOrders.map(getOrderRevenue)),
    },
    {
      label: "Pedidos",
      current: currentOrders.length,
      previous: previousOrders.length,
    },
    {
      label: "Ticket médio",
      current: currentOrders.length ? sum(currentOrders.map(getOrderRevenue)) / currentOrders.length : 0,
      previous: previousOrders.length ? sum(previousOrders.map(getOrderRevenue)) / previousOrders.length : 0,
    },
    {
      label: "Reservas",
      current: currentReservations.length,
      previous: previousReservations.length,
    },
    {
      label: "Clientes novos",
      current: currentCustomers.length,
      previous: previousCustomers.length,
    },
  ].map((entry) => ({
    label: entry.label,
    current: entry.current,
    previous: entry.previous,
    delta: entry.current - entry.previous,
    deltaPercent: entry.previous === 0 ? (entry.current > 0 ? 1 : 0) : (entry.current - entry.previous) / entry.previous,
  }));
}

function generateInsights(params: {
  currentRevenue: number;
  previousRevenue: number;
  fridayShare: number;
  topProductShare: number;
  vipShare: number;
  currentReservations: number;
  previousReservations: number;
}) {
  const insights: AnalyticsInsight[] = [];
  const revenueDelta = params.previousRevenue === 0 ? (params.currentRevenue > 0 ? 1 : 0) : (params.currentRevenue - params.previousRevenue) / params.previousRevenue;

  if (revenueDelta > 0) {
    insights.push({
      title: "Crescimento de receita",
      description: `O faturamento aumentou ${normalizePercent(revenueDelta)} em relação ao período anterior.`,
      severity: "success",
    });
  } else if (revenueDelta < 0) {
    insights.push({
      title: "Queda de receita",
      description: `O faturamento recuou ${normalizePercent(Math.abs(revenueDelta))} em relação ao período anterior.`,
      severity: "warning",
    });
  }

  if (params.fridayShare >= 0.35) {
    insights.push({
      title: "Pico semanal",
      description: `As sextas-feiras concentram ${normalizePercent(params.fridayShare)} das vendas.`,
      severity: "info",
    });
  }

  if (params.topProductShare >= 0.25) {
    insights.push({
      title: "Produto líder",
      description: `O produto mais vendido representa ${normalizePercent(params.topProductShare)} da receita ou demanda.`,
      severity: "info",
    });
  }

  if (params.vipShare >= 0.12) {
    insights.push({
      title: "Base VIP relevante",
      description: `Clientes VIP representam ${normalizePercent(params.vipShare)} da base total.`,
      severity: "success",
    });
  }

  if (params.currentReservations > params.previousReservations) {
    insights.push({
      title: "Reservas em alta",
      description: `As reservas aumentaram ${normalizePercent(
        params.previousReservations === 0 ? 1 : (params.currentReservations - params.previousReservations) / params.previousReservations
      )} no período selecionado.`,
      severity: "success",
    });
  }

  return insights.slice(0, 5);
}

function generateAlerts(params: {
  revenueDelta: number;
  cancellationRate: number;
  newCustomers: number;
}) {
  const alerts: AnalyticsAlert[] = [];

  if (params.revenueDelta <= NEGATIVE_ALERT_THRESHOLD) {
    alerts.push({
      title: "Queda nas vendas",
      description: `A receita caiu ${normalizePercent(Math.abs(params.revenueDelta))} no período monitorado.`,
      severity: "danger",
      status: "active",
    });
  }

  if (params.cancellationRate >= 0.2) {
    alerts.push({
      title: "Muitas reservas canceladas",
      description: `A taxa de cancelamento está em ${normalizePercent(params.cancellationRate)}.`,
      severity: "warning",
      status: "active",
    });
  }

  if (params.newCustomers <= 3) {
    alerts.push({
      title: "Poucos clientes novos",
      description: "A aquisição de novos clientes está abaixo do ideal para o intervalo atual.",
      severity: "warning",
      status: "active",
    });
  }

  alerts.push({
    title: "Estoque baixo",
    description: "Estrutura preparada para integrar alertas de estoque da cozinha e preparação.",
    severity: "info",
    status: "prepared",
  });

  return alerts;
}

function buildCategoryShare(orders: OrderWithDetails[], categories: AnalyticsSources["categories"]) {
  const categoryMap = new Map(categories.map((category) => [category.id, category.name]));
  const categoryTotals = new Map<string, number>();

  for (const order of orders) {
    for (const item of order.items) {
      const categoryId = item.product.categoryId ?? "sem-categoria";
      categoryTotals.set(categoryId, (categoryTotals.get(categoryId) ?? 0) + item.subtotal);
    }
  }

  return Array.from(categoryTotals.entries())
    .map(([categoryId, value], index) => ({
      name: categoryMap.get(categoryId) ?? "Sem categoria",
      value,
      color: makeColor(index),
    }))
    .sort((a, b) => b.value - a.value);
}

export const getAnalyticsDashboard = withTenantCache("dashboard", async (restaurantId: string, signature: string): Promise<AnalyticsDashboard> => {
  const filters = JSON.parse(signature) as AnalyticsFilterInput;
  const sources = await analyticsSources(restaurantId);
  const timezone = sources.restaurant?.timezone ?? null;
  const range = buildPeriodRange(filters.period, timezone, filters.startDate ?? null, filters.endDate ?? null);
  const previousRange = buildPreviousRange(range);

  const currentOrders = sources.orders.filter((order) => {
    const dateKey = normalizeDateKey(order.createdAt, timezone);
    return isInRange(dateKey, range);
  });
  const previousOrders = sources.orders.filter((order) => {
    const dateKey = normalizeDateKey(order.createdAt, timezone);
    return isInRange(dateKey, previousRange);
  });

  const currentReservations = sources.reservations.filter((reservation) => isInRange(reservation.reservationDate, range));
  const previousReservations = sources.reservations.filter((reservation) => isInRange(reservation.reservationDate, previousRange));

  const currentCustomers = sources.customers.filter((customer) => isInRange(normalizeDateKey(customer.createdAt, timezone), range));
  const previousCustomers = sources.customers.filter((customer) => isInRange(normalizeDateKey(customer.createdAt, timezone), previousRange));

  const currentRevenue = sum(currentOrders.map(getOrderRevenue));
  const previousRevenue = sum(previousOrders.map(getOrderRevenue));
  const currentOrdersCount = currentOrders.length;
  const averageTicket = currentOrdersCount ? currentRevenue / currentOrdersCount : 0;
  const newCustomers = currentCustomers.length;
  const recurringCustomers = sources.customers.filter((customer) => customer.frequency > 1).length;
  const estimatedProfit = currentRevenue * ESTIMATED_MARGIN;
  const productsSold = currentOrders.reduce((total, order) => total + getOrderQuantity(order), 0);
  const reservations = currentReservations.length;
  const cancellations = currentReservations.filter((reservation) => reservation.status === "CANCELLED").length;
  const noShow = currentReservations.filter((reservation) => reservation.status === "NO_SHOW").length;
  const attendedReservations = currentReservations.filter((reservation) => reservation.status === "CHECKED_IN" || reservation.status === "COMPLETED").length;
  const conversionRate = reservations ? attendedReservations / reservations : 0;
  const tablesOccupied = new Set([
    ...currentReservations.filter((reservation) => getReservationStatusSet().has(reservation.status)).map((reservation) => reservation.tableId),
    ...currentOrders.filter((order) => getOrderStatusSet().has(order.status)).map((order) => order.tableId),
  ]).size;
  const totalTables = sources.tables.length;
  const activeTables = sources.tables.filter((table) => table.active).length;
  const occupiedRate = activeTables ? tablesOccupied / activeTables : 0;

  const cashbackIssued = sources.cashback.transactions
    .filter((transaction) => transaction.type === "CREDIT" || transaction.type === "REFUND")
    .filter((transaction) => isInRange(normalizeDateKey(transaction.createdAt, timezone), range))
    .reduce((total, transaction) => total + transaction.amount, 0);
  const cashbackRedeemed = sources.cashback.transactions
    .filter((transaction) => transaction.type === "DEBIT" || transaction.type === "REDEEM")
    .filter((transaction) => isInRange(normalizeDateKey(transaction.createdAt, timezone), range))
    .reduce((total, transaction) => total + transaction.amount, 0);
  const pointsIssued = sources.loyalty.transactions
    .filter((transaction) => transaction.type === "EARN")
    .filter((transaction) => isInRange(normalizeDateKey(transaction.createdAt, timezone), range))
    .reduce((total, transaction) => total + Math.max(transaction.points, 0), 0);
  const pointsRedeemed = sources.loyalty.transactions
    .filter((transaction) => transaction.type === "REDEEM")
    .filter((transaction) => isInRange(normalizeDateKey(transaction.createdAt, timezone), range))
    .reduce((total, transaction) => total + Math.abs(transaction.points), 0);
  const couponsUsed = sources.coupons.usages.filter((usage) => isInRange(normalizeDateKey(usage.usedAt, timezone), range)).length;

  const currentFridayOrders = currentOrders.filter((order) => normalizeWeekdayKey(order.createdAt, timezone) === "friday").length;
  const fridayShare = currentOrders.length ? currentFridayOrders / currentOrders.length : 0;

  const productTotals = new Map<string, { label: string; value: number; meta?: string }>();
  const customerTotals = new Map<string, { label: string; value: number; meta?: string }>();
  const categoryTotals = new Map<string, { label: string; value: number; meta?: string }>();
  const categoryNameMap = new Map(sources.categories.map((category) => [category.id, category.name]));

  for (const order of currentOrders) {
    for (const item of order.items) {
      const product = item.product;
      const productKey = product.id;
      const productRecord = productTotals.get(productKey) ?? { label: product.name, value: 0, meta: product.categoryId };
      productRecord.value += item.quantity;
      productTotals.set(productKey, productRecord);

      const customer = sources.customers.find((entry) => entry.phone === order.customerPhone);
      if (customer) {
        const customerRecord = customerTotals.get(customer.id) ?? { label: getCustomerLabel(customer), value: 0, meta: customer.status };
        customerRecord.value += order.total;
        customerTotals.set(customer.id, customerRecord);
      }

      const categoryKey = product.categoryId;
      const categoryRecord = categoryTotals.get(categoryKey) ?? { label: categoryNameMap.get(categoryKey) ?? categoryKey, value: 0 };
      categoryRecord.value += item.subtotal;
      categoryTotals.set(categoryKey, categoryRecord);
    }
  }

  const topProduct = buildRanking(productTotals)[0];
  const topProductShare = topProduct ? topProduct.value / Math.max(productsSold, 1) : 0;
  const vipCustomers = sources.customers.filter((customer) => customer.status === "VIP").length;
  const vipShare = sources.customers.length ? vipCustomers / sources.customers.length : 0;
  const revenueToday = sum(sources.orders.filter((order) => normalizeDateKey(order.createdAt, timezone) === normalizeDateKey(new Date(), timezone)).map(getOrderRevenue));
  const revenueWeek = sum(sources.orders.filter((order) => isInRange(normalizeDateKey(order.createdAt, timezone), buildPeriodRange("last_7_days", timezone))).map(getOrderRevenue));
  const revenueMonth = sum(sources.orders.filter((order) => isInRange(normalizeDateKey(order.createdAt, timezone), buildPeriodRange("this_month", timezone))).map(getOrderRevenue));
  const revenueYear = sum(sources.orders.filter((order) => isInRange(normalizeDateKey(order.createdAt, timezone), buildPeriodRange("this_year", timezone))).map(getOrderRevenue));

  const bucket = diffDays(range.start, range.end) > 31 ? "month" : "day";
  const trends = {
    revenue: buildGroupedTrend(currentOrders, currentReservations, sources.restaurant, range, bucket),
    orders: buildGroupedTrend(currentOrders, currentReservations, sources.restaurant, range, bucket),
    area: buildGroupedTrend(currentOrders, currentReservations, sources.restaurant, range, bucket),
    radar: [
      { metric: "Receita", value: Math.min((currentRevenue / Math.max(previousRevenue || currentRevenue, 1)) * 100, 100) },
      { metric: "Pedidos", value: Math.min((currentOrdersCount / Math.max(previousOrders.length || currentOrdersCount, 1)) * 100, 100) },
      { metric: "Ticket", value: Math.min((averageTicket / Math.max(avg(previousOrders.map(getOrderRevenue)), 1)) * 100, 100) },
      { metric: "Reservas", value: Math.min((reservations / Math.max(previousReservations.length || reservations, 1)) * 100, 100) },
      { metric: "Conversão", value: Math.min(conversionRate * 100, 100) },
      { metric: "Clientes", value: Math.min((newCustomers / Math.max(previousCustomers.length || newCustomers, 1)) * 100, 100) },
    ],
    heatmap: buildHeatmap(currentOrders, sources.restaurant, range),
    categoryShare: buildCategoryShare(currentOrders, sources.categories),
  };

  const currentComparisonSet = calculateOrderComparisons(currentOrders, previousOrders, currentReservations, previousReservations, currentCustomers, previousCustomers).map((item) => ({
    ...item,
    label: item.label,
  }));

  const rankingTopCustomers = buildRanking(customerTotals);
  const topCategories = buildRanking(categoryTotals);
  const bottomProducts = buildRanking(productTotals, "asc");
  const averageServiceTime = calculateAverageServiceTime(currentOrders);
  const averageReservationTime = calculateAverageReservationTime(currentReservations);
  const averagePreparationTime = calculateAveragePreparationTime(currentOrders, sources.restaurant);
  const orderTimeline = buildOrderTimeline(currentOrders, currentReservations, timezone);
  const revenueDelta = previousRevenue === 0 ? (currentRevenue > 0 ? 1 : 0) : (currentRevenue - previousRevenue) / previousRevenue;
  const cancellationRate = reservations ? cancellations / reservations : 0;
  const insights = generateInsights({
    currentRevenue,
    previousRevenue,
    fridayShare,
    topProductShare,
    vipShare,
    currentReservations: reservations,
    previousReservations: previousReservations.length,
  });
  const alerts = generateAlerts({
    revenueDelta,
    cancellationRate,
    newCustomers,
  });

  return {
    restaurant: sources.restaurant,
    period: range,
    kpis: {
      revenueToday,
      revenueWeek,
      revenueMonth,
      revenueYear,
      orders: currentOrdersCount,
      averageTicket,
      newCustomers,
      recurringCustomers,
      estimatedProfit,
      productsSold,
      tablesOccupied,
      reservations,
      conversionRate,
      cancellations,
      noShow,
      cashbackIssued,
      cashbackRedeemed,
      pointsIssued,
      pointsRedeemed,
      couponsUsed,
    },
    comparisons: currentComparisonSet,
    trends,
    rankings: {
      topProducts: buildRanking(productTotals),
      bottomProducts,
      topCategories,
      topCustomers: rankingTopCustomers,
      peakHour: (() => {
        const hourMap = new Map<string, number>();
        for (const order of currentOrders) {
          const hour = normalizeHourLabel(normalizeHourKey(order.createdAt, timezone));
          hourMap.set(hour, (hourMap.get(hour) ?? 0) + 1);
        }
        return Array.from(hourMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "--";
      })(),
      peakDay: (() => {
        const dayMap = new Map<string, number>();
        for (const order of currentOrders) {
          const day = normalizeWeekdayKey(order.createdAt, timezone);
          dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
        }
        return Array.from(dayMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "--";
      })(),
      averagePreparationTime,
      averageServiceTime,
      averageReservationTime,
      inactiveCustomers: sources.customers.filter((customer) => !customer.active || customer.status === "INACTIVE" || customer.status === "BLOCKED").length,
      vipCustomers,
    },
    insights,
    alerts,
    tables: {
      total: totalTables,
      occupied: tablesOccupied,
      free: Math.max(totalTables - tablesOccupied, 0),
      reserved: currentReservations.filter((reservation) => reservation.status === "PENDING" || reservation.status === "CONFIRMED").length,
      occupiedRate,
    },
    timeline: orderTimeline,
    summary: {
      revenue: currentRevenue,
      orders: currentOrdersCount,
      customers: currentCustomers.length,
      reservations,
    },
  };
}, {
  tenantIndex: 0,
  keyPrefix: "analytics-dashboard",
  revalidate: 90,
});

export async function listAnalyticsOrders(restaurantId: string, filters: Partial<AnalyticsFilterInput> = {}) {
  const dashboard = await getAnalyticsDashboard(restaurantId, JSON.stringify(filters));
  return dashboard;
}

export function getAnalyticsPeriodLabel(period: AnalyticsPeriod) {
  return buildPeriodRange(period).label;
}

export function formatAnalyticsCurrency(value: number, currency = CURRENCY) {
  return normalizeCurrency(value, currency);
}

export function formatAnalyticsPercent(value: number) {
  return normalizePercent(value);
}

export function normalizeAnalyticsRange(filters: Partial<AnalyticsFilterInput>, timeZone?: string | null) {
  const period = filters.period ?? "last_30_days";
  return buildPeriodRange(period, timeZone, filters.startDate ?? null, filters.endDate ?? null);
}

function analyticsExportRows(dashboard: AnalyticsDashboard) {
  return [
    { kpi: "Faturamento hoje", valor: dashboard.kpis.revenueToday },
    { kpi: "Faturamento semana", valor: dashboard.kpis.revenueWeek },
    { kpi: "Faturamento mês", valor: dashboard.kpis.revenueMonth },
    { kpi: "Faturamento ano", valor: dashboard.kpis.revenueYear },
    { kpi: "Pedidos", valor: dashboard.kpis.orders },
    { kpi: "Ticket médio", valor: dashboard.kpis.averageTicket },
    { kpi: "Clientes novos", valor: dashboard.kpis.newCustomers },
    { kpi: "Clientes recorrentes", valor: dashboard.kpis.recurringCustomers },
    { kpi: "Lucro estimado", valor: dashboard.kpis.estimatedProfit },
    { kpi: "Produtos vendidos", valor: dashboard.kpis.productsSold },
    { kpi: "Mesas ocupadas", valor: dashboard.kpis.tablesOccupied },
    { kpi: "Reservas", valor: dashboard.kpis.reservations },
    { kpi: "Taxa de conversão", valor: dashboard.kpis.conversionRate },
    { kpi: "Cancelamentos", valor: dashboard.kpis.cancellations },
    { kpi: "No show", valor: dashboard.kpis.noShow },
    { kpi: "Cashback emitido", valor: dashboard.kpis.cashbackIssued },
    { kpi: "Cashback resgatado", valor: dashboard.kpis.cashbackRedeemed },
    { kpi: "Pontos emitidos", valor: dashboard.kpis.pointsIssued },
    { kpi: "Pontos resgatados", valor: dashboard.kpis.pointsRedeemed },
    { kpi: "Cupons utilizados", valor: dashboard.kpis.couponsUsed },
  ];
}

function buildAnalyticsPdf(dashboard: AnalyticsDashboard) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  let y = 40;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("RestaurantPro BI", 40, y);
  y += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Painel analítico • ${dashboard.period.label}`, 40, y);
  y += 24;

  const rows = analyticsExportRows(dashboard);
  for (const row of rows) {
    doc.text(`${row.kpi}: ${typeof row.valor === "number" ? row.valor.toFixed(2) : String(row.valor)}`, 40, y);
    y += 12;
    if (y > 760) {
      doc.addPage();
      y = 40;
    }
  }

  y += 8;
  doc.setFont("helvetica", "bold");
  doc.text("Insights", 40, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  for (const insight of dashboard.insights.slice(0, 6)) {
    const lines = doc.splitTextToSize(`- ${insight.title}: ${insight.description}`, 515);
    for (const line of lines) {
      doc.text(line, 40, y);
      y += 12;
      if (y > 760) {
        doc.addPage();
        y = 40;
      }
    }
  }

  return doc;
}

export async function buildAnalyticsExportPayload(restaurantId: string, signature: string, format: "csv" | "xlsx" | "pdf") {
  const dashboard = await getAnalyticsDashboard(restaurantId, signature);
  const baseName = `RestaurantPro-Analytics-${dashboard.period.start}-${dashboard.period.end}`;

  if (format === "csv") {
    const rows = analyticsExportRows(dashboard).map((row) => [row.kpi, row.valor]);
    const csv = [["KPI", "Valor"], ...rows].map((row) => row.join(",")).join("\n");
    return {
      filename: `${baseName}.csv`,
      mimeType: "text/csv;charset=utf-8",
      base64: Buffer.from(csv, "utf8").toString("base64"),
    };
  }

  if (format === "xlsx") {
    const workbook = XLSX.utils.book_new();
    const kpiSheet = XLSX.utils.json_to_sheet(analyticsExportRows(dashboard));
    const insightsSheet = XLSX.utils.json_to_sheet(dashboard.insights);
    const alertsSheet = XLSX.utils.json_to_sheet(dashboard.alerts);
    XLSX.utils.book_append_sheet(workbook, kpiSheet, "KPIs");
    XLSX.utils.book_append_sheet(workbook, insightsSheet, "Insights");
    XLSX.utils.book_append_sheet(workbook, alertsSheet, "Alertas");
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    return {
      filename: `${baseName}.xlsx`,
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      base64: Buffer.from(buffer as ArrayBuffer).toString("base64"),
    };
  }

  const pdf = buildAnalyticsPdf(dashboard);
  const buffer = pdf.output("arraybuffer");
  return {
    filename: `${baseName}.pdf`,
    mimeType: "application/pdf",
    base64: Buffer.from(buffer as ArrayBuffer).toString("base64"),
  };
}
