import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import { findRestaurantById, listCustomersByRestaurant, listOrdersByRestaurant } from "@/prisma";
import type { Customer, FinancialMovement, GatewayLog, Invoice, Payment, PaymentGatewayProvider, PaymentMethod, Refund, Restaurant, Transaction, Wallet, WebhookEvent } from "@/types";
import type {
  FinanceFilterInput,
  FinancialMovementInput,
  GatewayLogInput,
  InvoiceFilterInput,
  InvoiceInput,
  PaymentCheckoutInput,
  PaymentExportFormat,
  PaymentFilterInput,
  PaymentInput,
  PaymentMethodInput,
  RefundInput,
  TransactionInput,
  WalletInput,
  WebhookEventInput,
} from "@/schemas";
import { getPaymentGatewayAdapter, listPaymentGatewayAdapters } from "./adapters";
import { financeRevision, getFinanceState, makeFinanceId, touchFinanceState } from "./state";
import { withTenantCache } from "@/lib/production";

const DEFAULT_CURRENCY = "AOA";

type DateWindow = {
  start: string;
  end: string;
};

type Range = DateWindow & {
  label: string;
};

type TrendPoint = {
  label: string;
  amount: number;
  count: number;
  averageTicket: number;
};

type SlicePoint = {
  name: string;
  value: number;
  color: string;
};

type RankingPoint = {
  label: string;
  value: number;
  meta?: string;
};

type TimelinePoint = {
  label: string;
  description: string;
  meta: string;
};

type InsightPoint = {
  title: string;
  description: string;
  severity: "info" | "success" | "warning";
};

type AlertPoint = {
  title: string;
  description: string;
  severity: "info" | "warning" | "danger";
  status: "active" | "prepared";
};

export type CheckoutSummary = {
  subtotal: number;
  tax: number;
  discount: number;
  couponCode: string | null;
  couponDiscount: number;
  cashbackDiscount: number;
  deliveryFee: number;
  serviceFee: number;
  tip: number;
  total: number;
  paidAmount: number;
  changeAmount: number;
  currency: string;
};

export type PaymentsDashboard = {
  restaurant: Pick<Restaurant, "id" | "name" | "timezone" | "currency"> | null;
  period: Range;
  paymentMethods: PaymentMethod[];
  wallets: Wallet[];
  payments: Payment[];
  invoices: Invoice[];
  refunds: Refund[];
  transactions: Transaction[];
  financialMovements: FinancialMovement[];
  gatewayLogs: GatewayLog[];
  webhookEvents: WebhookEvent[];
  checkout: CheckoutSummary;
  kpis: {
    revenueToday: number;
    revenueWeek: number;
    revenueMonth: number;
    revenueYear: number;
    pendingPayments: number;
    approvedPayments: number;
    declinedPayments: number;
    chargebacks: number;
    refunds: number;
    averageTicket: number;
  };
  trends: {
    revenue: TrendPoint[];
    cashFlow: TrendPoint[];
    methods: SlicePoint[];
    paymentsByDay: TrendPoint[];
    profitMonthly: TrendPoint[];
    radar: Array<{ metric: string; value: number }>;
    heatmap: Array<{ day: string; hour: string; value: number }>;
  };
  rankings: {
    topMethods: RankingPoint[];
    topGateways: RankingPoint[];
    topCustomers: RankingPoint[];
  };
  insights: InsightPoint[];
  alerts: AlertPoint[];
  timeline: TimelinePoint[];
};

export type FinanceDashboard = PaymentsDashboard & {
  kpis: PaymentsDashboard["kpis"] & {
    cashFlow: number;
    profit: number;
    margin: number;
    balance: number;
    expenses: number;
  };
  costCenters: RankingPoint[];
};

function now() {
  return new Date();
}

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatHourKey(date: Date) {
  return `${String(date.getUTCHours()).padStart(2, "0")}:00`;
}

function formatCurrency(value: number, currency = DEFAULT_CURRENCY) {
  return new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function toPositive(value: number) {
  return Number.isFinite(value) ? Math.max(value, 0) : 0;
}

function parseDateInput(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function cloneDate(date: Date) {
  return new Date(date.getTime());
}

function startOfDay(date: Date) {
  const next = cloneDate(date);
  next.setUTCHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = cloneDate(date);
  next.setUTCHours(23, 59, 59, 999);
  return next;
}

function addDays(date: Date, days: number) {
  const next = cloneDate(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function buildRange(period: PaymentFilterInput["period"], startDate?: string | null, endDate?: string | null): Range {
  const today = startOfDay(now());
  const yesterday = addDays(today, -1);
  const currentMonthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const lastMonthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
  const lastMonthEnd = endOfDay(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 0)));
  const yearStart = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));

  switch (period) {
    case "today":
      return { label: "Hoje", start: formatDateKey(today), end: formatDateKey(today) };
    case "yesterday":
      return { label: "Ontem", start: formatDateKey(yesterday), end: formatDateKey(yesterday) };
    case "last_7_days":
      return { label: "Últimos 7 dias", start: formatDateKey(addDays(today, -6)), end: formatDateKey(today) };
    case "last_30_days":
      return { label: "Últimos 30 dias", start: formatDateKey(addDays(today, -29)), end: formatDateKey(today) };
    case "this_month":
      return { label: "Este mês", start: formatDateKey(currentMonthStart), end: formatDateKey(today) };
    case "last_month":
      return { label: "Último mês", start: formatDateKey(startOfDay(lastMonthStart)), end: formatDateKey(lastMonthEnd) };
    case "this_year":
      return { label: "Este ano", start: formatDateKey(yearStart), end: formatDateKey(today) };
    case "custom": {
      const start = parseDateInput(startDate) ?? today;
      const end = parseDateInput(endDate) ?? today;
      const normalizedStart = start <= end ? start : end;
      const normalizedEnd = end >= start ? end : start;
      return { label: "Período personalizado", start: formatDateKey(normalizedStart), end: formatDateKey(normalizedEnd) };
    }
    default:
      return { label: "Últimos 30 dias", start: formatDateKey(addDays(today, -29)), end: formatDateKey(today) };
  }
}

function withinRange(date: Date, range: Range) {
  const key = formatDateKey(date);
  return key >= range.start && key <= range.end;
}

function filterPayments(payments: Payment[], filters: Partial<PaymentFilterInput>) {
  let items = payments.slice();
  const search = (filters.search ?? "").trim().toLowerCase();

  if (filters.status && filters.status !== "all") {
    items = items.filter((payment) => payment.status === filters.status);
  }

  if (filters.gatewayProvider && filters.gatewayProvider !== "all") {
    items = items.filter((payment) => payment.gatewayProvider === filters.gatewayProvider);
  }

  if (filters.methodType && filters.methodType !== "all") {
    items = items.filter((payment) => {
      const method = getFinanceState(payment.restaurantId).paymentMethods.find((item) => item.id === payment.paymentMethodId);
      return method?.type === filters.methodType;
    });
  }

  if (search) {
    items = items.filter((payment) => {
      return [payment.reference, payment.gatewayReference, payment.couponCode ?? "", payment.currency].join(" ").toLowerCase().includes(search);
    });
  }

  return items;
}

function filterInvoices(invoices: Invoice[], filters: Partial<InvoiceFilterInput>) {
  let items = invoices.slice();
  const search = (filters.search ?? "").trim().toLowerCase();

  if (filters.status && filters.status !== "all") {
    items = items.filter((invoice) => invoice.status === filters.status);
  }

  if (search) {
    items = items.filter((invoice) => [invoice.number, invoice.pdfUrl ?? ""].join(" ").toLowerCase().includes(search));
  }

  return items;
}

function filterMovements(movements: FinancialMovement[], filters: Partial<FinanceFilterInput>) {
  let items = movements.slice();
  const search = (filters.search ?? "").trim().toLowerCase();

  if (filters.movementType && filters.movementType !== "all") {
    items = items.filter((movement) => movement.type === filters.movementType);
  }

  if (filters.costCenter) {
    const costCenter = filters.costCenter.toLowerCase();
    items = items.filter((movement) => (movement.costCenter ?? "").toLowerCase().includes(costCenter));
  }

  if (search) {
    items = items.filter((movement) => [movement.category, movement.notes ?? "", movement.costCenter ?? ""].join(" ").toLowerCase().includes(search));
  }

  return items;
}

function paginate<T>(items: T[], page = 1, perPage = 20) {
  const total = items.length;
  const safePerPage = Math.max(perPage, 1);
  const safePage = Math.min(Math.max(page, 1), Math.max(Math.ceil(total / safePerPage), 1));
  return {
    items: items.slice((safePage - 1) * safePerPage, (safePage - 1) * safePerPage + safePerPage),
    total,
    page: safePage,
    perPage: safePerPage,
    totalPages: Math.max(Math.ceil(total / safePerPage), 1),
  };
}

function normalizeCheckoutInput(input: Partial<PaymentCheckoutInput> = {}): CheckoutSummary {
  const subtotal = toPositive(Number(input.subtotal ?? 0));
  const tax = toPositive(Number(input.tax ?? 0));
  const discount = toPositive(Number(input.discount ?? 0));
  const couponDiscount = toPositive(Number(input.couponDiscount ?? 0));
  const cashbackDiscount = toPositive(Number(input.cashbackDiscount ?? 0));
  const deliveryFee = toPositive(Number(input.deliveryFee ?? 0));
  const serviceFee = toPositive(Number(input.serviceFee ?? 0));
  const tip = toPositive(Number(input.tip ?? 0));
  const total = Math.max(subtotal + tax + deliveryFee + serviceFee + tip - discount - couponDiscount - cashbackDiscount, 0);
  const paidAmount = toPositive(Number(input.paidAmount ?? total));
  const changeAmount = toPositive(Number(input.changeAmount ?? Math.max(paidAmount - total, 0)));

  return {
    subtotal,
    tax,
    discount,
    couponCode: input.couponCode ?? null,
    couponDiscount,
    cashbackDiscount,
    deliveryFee,
    serviceFee,
    tip,
    total,
    paidAmount,
    changeAmount,
    currency: input.currency ?? DEFAULT_CURRENCY,
  };
}

function buildCheckoutFromPayment(payment: Payment): CheckoutSummary {
  return {
    subtotal: payment.subtotal,
    tax: payment.tax,
    discount: payment.discount,
    couponCode: payment.couponCode,
    couponDiscount: payment.couponDiscount,
    cashbackDiscount: payment.cashbackDiscount,
    deliveryFee: payment.deliveryFee,
    serviceFee: payment.serviceFee,
    tip: payment.tip,
    total: payment.total,
    paidAmount: payment.paidAmount,
    changeAmount: payment.changeAmount,
    currency: payment.currency,
  };
}

function createCustomerIndex(customers: Customer[]) {
  return new Map(customers.map((customer) => [customer.id, customer]));
}

function createGatewayLog(restaurantId: string, input: GatewayLogInput & { payload?: unknown; response?: unknown }) {
  const state = getFinanceState(restaurantId);
  const log: GatewayLog = {
    id: makeFinanceId("glog"),
    restaurantId,
    gatewayProvider: input.gatewayProvider,
    action: input.action,
    status: input.status,
    payload: input.payload ?? null,
    response: input.response ?? null,
    durationMs: input.durationMs,
    error: input.error ?? null,
    retryCount: input.retryCount,
    createdAt: now(),
  };
  state.gatewayLogs.unshift(log);
  return log;
}

function createTransactionRecord(restaurantId: string, input: TransactionInput, external: { externalId: string; payload: unknown; response: unknown; responseTimeMs: number }) {
  const state = getFinanceState(restaurantId);
  const transaction: Transaction = {
    id: makeFinanceId("txn"),
    restaurantId,
    paymentId: input.paymentId,
    gatewayProvider: input.gatewayProvider,
    type: input.type,
    status: input.status,
    amount: input.amount,
    fee: input.fee,
    netAmount: input.netAmount,
    currency: input.currency,
    externalId: external.externalId,
    reference: input.reference ?? null,
    responseTimeMs: external.responseTimeMs,
    retryCount: input.retryCount,
    payload: external.payload,
    response: external.response,
    errorCode: input.errorCode ?? null,
    errorMessage: input.errorMessage ?? null,
    createdAt: now(),
  };
  state.transactions.unshift(transaction);
  return transaction;
}

function createMovementRecord(restaurantId: string, walletId: string | null, input: FinancialMovementInput, balanceAfter: number) {
  const state = getFinanceState(restaurantId);
  const movement: FinancialMovement = {
    id: makeFinanceId("mov"),
    restaurantId,
    walletId,
    paymentId: input.paymentId ?? null,
    invoiceId: input.invoiceId ?? null,
    refundId: input.refundId ?? null,
    type: input.type,
    category: input.category,
    amount: input.amount,
    balanceAfter,
    costCenter: input.costCenter ?? null,
    notes: input.notes ?? null,
    metadata: input.metadata ?? null,
    createdAt: now(),
  };
  state.financialMovements.unshift(movement);
  return movement;
}

function getMainWallet(restaurantId: string) {
  const state = getFinanceState(restaurantId);
  return state.wallets[0] ?? null;
}

function upsertWalletBalance(restaurantId: string, walletId: string | null, delta: number) {
  const state = getFinanceState(restaurantId);
  const wallet = walletId ? state.wallets.find((item) => item.id === walletId) ?? null : getMainWallet(restaurantId);
  if (!wallet) return null;
  wallet.balance = Number((wallet.balance + delta).toFixed(2));
  wallet.updatedAt = now();
  return wallet;
}

function summarizePayments(payments: Payment[], range: Range) {
  const inRange = payments.filter((payment) => withinRange(payment.createdAt, range));
  const revenueStatuses = new Set<Payment["status"]>(["PAID", "AUTHORIZED", "REFUNDED", "PARTIALLY_REFUNDED"]);
  const isRevenuePayment = (payment: Payment) => revenueStatuses.has(payment.status);
  const revenue = inRange.filter(isRevenuePayment).reduce((sum, payment) => sum + payment.total, 0);
  const revenueToday = payments.filter((payment) => formatDateKey(payment.createdAt) === formatDateKey(new Date()) && isRevenuePayment(payment)).reduce((sum, payment) => sum + payment.total, 0);
  const revenueWeek = payments.filter((payment) => withinRange(payment.createdAt, { ...range, start: formatDateKey(addDays(startOfDay(new Date()), -6)), end: formatDateKey(new Date()) }) && isRevenuePayment(payment)).reduce((sum, payment) => sum + payment.total, 0);
  const revenueMonth = payments.filter((payment) => withinRange(payment.createdAt, { ...range, start: formatDateKey(new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1))), end: formatDateKey(new Date()) }) && isRevenuePayment(payment)).reduce((sum, payment) => sum + payment.total, 0);
  const revenueYear = payments.filter((payment) => withinRange(payment.createdAt, { ...range, start: formatDateKey(new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1))), end: formatDateKey(new Date()) }) && isRevenuePayment(payment)).reduce((sum, payment) => sum + payment.total, 0);
  const pendingPayments = payments.filter((payment) => payment.status === "PENDING").length;
  const approvedPayments = payments.filter((payment) => revenueStatuses.has(payment.status)).length;
  const declinedPayments = payments.filter((payment) => payment.status === "FAILED" || payment.status === "CANCELED").length;
  const chargebacks = payments.filter((payment) => payment.status === "CHARGEBACK").length;
  const refunds = payments.filter((payment) => payment.status === "REFUNDED" || payment.status === "PARTIALLY_REFUNDED").length;
  const averageTicket = approvedPayments > 0 ? revenue / approvedPayments : 0;

  return {
    revenueToday,
    revenueWeek,
    revenueMonth,
    revenueYear,
    pendingPayments,
    approvedPayments,
    declinedPayments,
    chargebacks,
    refunds,
    averageTicket,
  };
}

function buildTrendSeries(payments: Payment[], range: Range): TrendPoint[] {
  const buckets = new Map<string, { amount: number; count: number }>();
  payments.filter((payment) => withinRange(payment.createdAt, range)).forEach((payment) => {
    const key = formatDateKey(payment.createdAt);
    const current = buckets.get(key) ?? { amount: 0, count: 0 };
    current.amount += payment.total;
    current.count += 1;
    buckets.set(key, current);
  });

  const series: TrendPoint[] = [];
  const start = parseDateInput(range.start) ?? new Date(`${formatDateKey(new Date())}T00:00:00.000Z`);
  const end = parseDateInput(range.end) ?? start;
  const days = Math.max(Math.round((end.getTime() - start.getTime()) / 86400000), 0);

  for (let offset = 0; offset <= days; offset += 1) {
    const current = addDays(start, offset);
    const key = formatDateKey(current);
    const bucket = buckets.get(key) ?? { amount: 0, count: 0 };
    series.push({
      label: key.slice(5),
      amount: bucket.amount,
      count: bucket.count,
      averageTicket: bucket.count > 0 ? bucket.amount / bucket.count : 0,
    });
  }

  return series;
}

function buildMethodsSeries(payments: Payment[], methods: PaymentMethod[]): SlicePoint[] {
  const counts = new Map<string, number>();
  for (const payment of payments) {
    counts.set(payment.paymentMethodId, (counts.get(payment.paymentMethodId) ?? 0) + 1);
  }

  return methods
    .map((method, index) => ({
      name: method.name,
      value: counts.get(method.id) ?? 0,
      color: ["#0ea5e9", "#10b981", "#f59e0b", "#6366f1", "#ec4899", "#14b8a6", "#f97316", "#22c55e", "#ef4444", "#8b5cf6"][index % 10],
    }))
    .sort((a, b) => b.value - a.value);
}

function buildHeatmap(payments: Payment[]) {
  const buckets = new Map<string, number>();
  for (const payment of payments) {
    const day = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"][payment.createdAt.getUTCDay()];
    const hour = formatHourKey(payment.createdAt);
    const key = `${day}::${hour}`;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return Array.from({ length: 7 }, (_, dayIndex) => {
    const day = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"][dayIndex];
    return Array.from({ length: 24 }, (_, hourIndex) => {
      const hour = `${String(hourIndex).padStart(2, "0")}:00`;
      return {
        day,
        hour,
        value: buckets.get(`${day}::${hour}`) ?? 0,
      };
    });
  }).flat();
}

function buildTimeline(payments: Payment[], invoices: Invoice[], refunds: Refund[], movements: FinancialMovement[]): TimelinePoint[] {
  const points: TimelinePoint[] = [];
  payments.slice(0, 6).forEach((payment) => {
    points.push({
      label: payment.status === "PAID" || payment.status === "AUTHORIZED" ? "Pagamento aprovado" : "Pagamento registrado",
      description: `${formatCurrency(payment.total, payment.currency)} via ${payment.gatewayProvider}`,
      meta: formatDateKey(payment.createdAt),
    });
  });
  invoices.slice(0, 3).forEach((invoice) => {
    points.push({
      label: `Invoice ${invoice.number}`,
      description: `Status ${invoice.status}`,
      meta: formatDateKey(invoice.createdAt),
    });
  });
  refunds.slice(0, 3).forEach((refund) => {
    points.push({
      label: `Reembolso ${refund.type}`,
      description: formatCurrency(refund.amount),
      meta: formatDateKey(refund.createdAt),
    });
  });
  movements.slice(0, 3).forEach((movement) => {
    points.push({
      label: movement.category,
      description: movement.notes ?? movement.type,
      meta: formatDateKey(movement.createdAt),
    });
  });
  return points;
}

function buildInsights(kpis: PaymentsDashboard["kpis"], payments: Payment[], methods: PaymentMethod[]): InsightPoint[] {
  const insights: InsightPoint[] = [];
  if (kpis.revenueMonth > kpis.revenueWeek * 2) {
    insights.push({ title: "Crescimento de receita", description: "O faturamento mensal superou com folga o ritmo semanal.", severity: "success" });
  }

  const topMethod = methods[0];
  if (topMethod) {
    const usage = payments.filter((payment) => payment.paymentMethodId === topMethod.id).length;
    const total = Math.max(payments.length, 1);
    insights.push({
      title: "Método líder",
      description: `${topMethod.name} representa ${Math.round((usage / total) * 100)}% das transações no período.`,
      severity: "info",
    });
  }

  if (kpis.pendingPayments > 0) {
    insights.push({ title: "Fila de aprovações", description: `${kpis.pendingPayments} pagamentos ainda aguardam conclusão.`, severity: "warning" });
  }

  return insights;
}

function buildAlerts(kpis: PaymentsDashboard["kpis"], refunds: Refund[]): AlertPoint[] {
  const alerts: AlertPoint[] = [];
  if (kpis.declinedPayments > 0) {
    alerts.push({ title: "Pagamentos recusados", description: "Há recusas no período que merecem revisão.", severity: "danger", status: "active" });
  }
  if (kpis.chargebacks > 0) {
    alerts.push({ title: "Chargebacks", description: "O volume de chargebacks precisa de acompanhamento.", severity: "warning", status: "active" });
  }
  if (refunds.length > 0) {
    alerts.push({ title: "Reembolsos", description: "Existem reembolsos recentes para auditoria.", severity: "info", status: "prepared" });
  }
  return alerts;
}

function buildRankings(payments: Payment[], methods: PaymentMethod[], customers: Customer[]) {
  const methodTotals = new Map<string, number>();
  const gatewayTotals = new Map<PaymentGatewayProvider, number>();
  const customerTotals = new Map<string, number>();

  for (const payment of payments) {
    methodTotals.set(payment.paymentMethodId, (methodTotals.get(payment.paymentMethodId) ?? 0) + payment.total);
    gatewayTotals.set(payment.gatewayProvider, (gatewayTotals.get(payment.gatewayProvider) ?? 0) + payment.total);
    if (payment.customerId) {
      customerTotals.set(payment.customerId, (customerTotals.get(payment.customerId) ?? 0) + payment.total);
    }
  }

  const methodMap = new Map(methods.map((method) => [method.id, method.name]));
  const customerMap = createCustomerIndex(customers);

  return {
    topMethods: Array.from(methodTotals.entries())
      .map(([id, value]) => ({ label: methodMap.get(id) ?? id, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5),
    topGateways: Array.from(gatewayTotals.entries())
      .map(([gateway, value]) => ({ label: gateway, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5),
    topCustomers: Array.from(customerTotals.entries())
      .map(([customerId, value]) => ({ label: customerMap.get(customerId)?.name ?? customerId, value, meta: customerMap.get(customerId)?.phone }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5),
  };
}

async function buildPaymentsDashboardSnapshot(restaurantId: string, signature: string, revision: number): Promise<PaymentsDashboard> {
  const filters = JSON.parse(signature) as PaymentFilterInput;
  const range = buildRange(filters.period, filters.startDate, filters.endDate);
  const [restaurant, customers, orders] = await Promise.all([
    findRestaurantById(restaurantId),
    listCustomersByRestaurant(restaurantId),
    listOrdersByRestaurant(restaurantId),
  ]);
  const state = getFinanceState(restaurantId);
  void revision;
  void orders;

  const paymentMethods = state.paymentMethods.filter((method) => method.active);
  const payments = filterPayments(state.payments, filters);
  const invoices = filterInvoices(state.invoices, filters as Partial<InvoiceFilterInput>);
  const refunds = state.refunds.filter((refund) => withinRange(refund.createdAt, range));
  const transactions = state.transactions.filter((transaction) => withinRange(transaction.createdAt, range));
  const movements = filterMovements(state.financialMovements, filters as Partial<FinanceFilterInput>);
  const wallets = state.wallets.slice().sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  const gatewayLogs = state.gatewayLogs.filter((log) => withinRange(log.createdAt, range));
  const webhookEvents = state.webhookEvents.filter((event) => withinRange(event.createdAt, range));
  const kpis = summarizePayments(payments, range);
  const checkoutSource = payments[0] ?? null;
  const checkout = checkoutSource ? buildCheckoutFromPayment(checkoutSource) : normalizeCheckoutInput({});

  return {
    restaurant: restaurant ? { id: restaurant.id, name: restaurant.name, timezone: restaurant.timezone, currency: restaurant.currency } : null,
    period: range,
    paymentMethods,
    wallets,
    payments,
    invoices,
    refunds,
    transactions,
    financialMovements: movements,
    gatewayLogs,
    webhookEvents,
    checkout,
    kpis,
    trends: {
      revenue: buildTrendSeries(payments, range),
      cashFlow: buildTrendSeries(payments, range),
      methods: buildMethodsSeries(payments, paymentMethods),
      paymentsByDay: buildTrendSeries(payments, range),
      profitMonthly: buildTrendSeries(payments, range),
      radar: [
        { metric: "Receita", value: kpis.revenueMonth > 0 ? 100 : 0 },
        { metric: "Aprovação", value: kpis.approvedPayments > 0 ? 100 : 0 },
        { metric: "Chargebacks", value: kpis.chargebacks > 0 ? 20 : 100 },
        { metric: "Reembolsos", value: kpis.refunds > 0 ? 30 : 100 },
        { metric: "Ticket médio", value: Math.min(Math.round(kpis.averageTicket / 100), 100) },
      ],
      heatmap: buildHeatmap(payments),
    },
    rankings: buildRankings(payments, paymentMethods, customers),
    insights: buildInsights(kpis, payments, paymentMethods),
    alerts: buildAlerts(kpis, refunds),
    timeline: buildTimeline(payments, invoices, refunds, movements),
  };
}

const getPaymentsDashboardCached = withTenantCache("payments", async (restaurantId: string, signature: string, revision: number) => buildPaymentsDashboardSnapshot(restaurantId, signature, revision), {
  tenantIndex: 0,
  keyPrefix: "payments-dashboard",
  revalidate: 60,
});

async function buildFinanceDashboardSnapshot(restaurantId: string, signature: string, revision: number): Promise<FinanceDashboard> {
  const filters = JSON.parse(signature) as FinanceFilterInput;
  const paymentsSignature = JSON.stringify({
    period: filters.period,
    startDate: filters.startDate,
    endDate: filters.endDate,
  });
  const paymentsDashboard = await buildPaymentsDashboardSnapshot(restaurantId, paymentsSignature, revision);
  const movements = filterMovements(paymentsDashboard.financialMovements, filters);
  const wallets = paymentsDashboard.wallets;
  const balance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
  const cashFlow = movements.reduce((sum, movement) => {
    if (movement.type === "EXPENSE" || movement.type === "FEE" || movement.type === "TAX" || movement.type === "REFUND" || movement.type === "TRANSFER_OUT") {
      return sum - movement.amount;
    }
    return sum + movement.amount;
  }, 0);
  const expenses = movements.filter((movement) => movement.type === "EXPENSE" || movement.type === "FEE" || movement.type === "TAX" || movement.type === "TRANSFER_OUT").reduce((sum, movement) => sum + movement.amount, 0);
  const profit = paymentsDashboard.kpis.revenueMonth - expenses;
  const margin = paymentsDashboard.kpis.revenueMonth > 0 ? profit / paymentsDashboard.kpis.revenueMonth : 0;
  const costCenters = Array.from(
    movements.reduce((acc, movement) => {
      const key = movement.costCenter ?? "Sem centro de custo";
      const current = acc.get(key) ?? 0;
      acc.set(key, current + movement.amount);
      return acc;
    }, new Map<string, number>())
  )
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return {
    ...paymentsDashboard,
    kpis: {
      ...paymentsDashboard.kpis,
      cashFlow,
      profit,
      margin,
      balance,
      expenses,
    },
    costCenters,
  };
}

const getFinanceDashboardCached = withTenantCache("finance", async (restaurantId: string, signature: string, revision: number) => buildFinanceDashboardSnapshot(restaurantId, signature, revision), {
  tenantIndex: 0,
  keyPrefix: "finance-dashboard",
  revalidate: 60,
});

function assertMethodExists(restaurantId: string, paymentMethodId: string) {
  const state = getFinanceState(restaurantId);
  const method = state.paymentMethods.find((item) => item.id === paymentMethodId && item.active);
  if (!method) {
    throw new Error("Método de pagamento inválido.");
  }
  return method;
}

export async function listPaymentMethods(restaurantId: string) {
  return getFinanceState(restaurantId).paymentMethods.slice().sort((a, b) => a.name.localeCompare(b.name));
}

export async function upsertPaymentMethod(restaurantId: string, input: PaymentMethodInput) {
  const state = getFinanceState(restaurantId);
  const current = state.paymentMethods.find((item) => item.code === input.code);
  const next: PaymentMethod = {
    id: current?.id ?? makeFinanceId("pm"),
    restaurantId,
    code: input.code,
    name: input.name,
    type: input.type,
    gatewayProvider: input.gatewayProvider ?? null,
    supportsInstallments: input.supportsInstallments,
    supportsPartial: input.supportsPartial,
    active: input.active,
    metadata: input.metadata ?? null,
    createdAt: current?.createdAt ?? now(),
    updatedAt: now(),
  };
  if (current) {
    state.paymentMethods[state.paymentMethods.indexOf(current)] = next;
  } else {
    state.paymentMethods.unshift(next);
  }
  touchFinanceState(restaurantId);
  return next;
}

export async function listPayments(restaurantId: string, filters: Partial<PaymentFilterInput> = {}) {
  const state = getFinanceState(restaurantId);
  const range = buildRange(filters.period ?? "last_30_days", filters.startDate, filters.endDate);
  const items = filterPayments(state.payments.filter((payment) => withinRange(payment.createdAt, range)), filters).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return paginate(items, filters.page, filters.perPage);
}

export async function listRefunds(restaurantId: string, filters: Partial<InvoiceFilterInput> = {}) {
  const state = getFinanceState(restaurantId);
  const range = buildRange(filters.period ?? "last_30_days", filters.startDate, filters.endDate);
  const items = state.refunds.filter((refund) => withinRange(refund.createdAt, range)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return paginate(items, filters.page, filters.perPage);
}

export async function listInvoices(restaurantId: string, filters: Partial<InvoiceFilterInput> = {}) {
  const state = getFinanceState(restaurantId);
  const range = buildRange(filters.period ?? "last_30_days", filters.startDate, filters.endDate);
  const items = filterInvoices(state.invoices.filter((invoice) => withinRange(invoice.createdAt, range)), filters).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return paginate(items, filters.page, filters.perPage);
}

export async function listTransactions(restaurantId: string, filters: Partial<FinanceFilterInput> = {}) {
  const state = getFinanceState(restaurantId);
  const range = buildRange(filters.period ?? "last_30_days", filters.startDate, filters.endDate);
  const items = filterMovements(state.financialMovements.filter((movement) => withinRange(movement.createdAt, range)), filters).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return paginate(items, filters.page, filters.perPage);
}

export async function listFinancialMovements(restaurantId: string, filters: Partial<FinanceFilterInput> = {}) {
  return listTransactions(restaurantId, filters);
}

export async function listWallets(restaurantId: string) {
  return getFinanceState(restaurantId).wallets.slice().sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export async function upsertWallet(restaurantId: string, input: WalletInput) {
  const state = getFinanceState(restaurantId);
  const current = state.wallets.find((item) => item.name === input.name);
  const next: Wallet = {
    id: current?.id ?? makeFinanceId("wal"),
    restaurantId,
    name: input.name,
    currency: input.currency,
    balance: input.balance,
    reservedBalance: input.reservedBalance,
    provider: input.provider ?? null,
    active: input.active,
    createdAt: current?.createdAt ?? now(),
    updatedAt: now(),
  };
  if (current) {
    state.wallets[state.wallets.indexOf(current)] = next;
  } else {
    state.wallets.unshift(next);
  }
  touchFinanceState(restaurantId);
  return next;
}

export async function recordFinancialMovement(restaurantId: string, input: FinancialMovementInput) {
  const wallet = upsertWalletBalance(restaurantId, input.walletId ?? null, input.type === "EXPENSE" || input.type === "REFUND" || input.type === "FEE" || input.type === "TAX" || input.type === "TRANSFER_OUT" ? -input.amount : input.amount);
  const movement = createMovementRecord(restaurantId, wallet?.id ?? null, input, wallet?.balance ?? 0);
  touchFinanceState(restaurantId);
  return movement;
}

export async function createInvoice(restaurantId: string, input: InvoiceInput) {
  const state = getFinanceState(restaurantId);
  const currentCount = state.invoices.length + 1;
  const number = input.number || `INV-${new Date().getUTCFullYear()}-${String(currentCount).padStart(5, "0")}`;
  const invoice: Invoice = {
    id: makeFinanceId("inv"),
    restaurantId,
    orderId: input.orderId ?? null,
    paymentId: input.paymentId ?? null,
    customerId: input.customerId ?? null,
    number,
    status: input.status ?? "PENDING",
    subtotal: input.subtotal,
    tax: input.tax,
    discount: input.discount,
    total: input.total,
    pdfUrl: input.pdfUrl ?? null,
    emailedAt: input.emailedAt ? new Date(String(input.emailedAt)) : null,
    metadata: input.metadata ?? null,
    createdAt: now(),
    updatedAt: now(),
  };
  state.invoices.unshift(invoice);
  if (invoice.paymentId) {
    const payment = state.payments.find((item) => item.id === invoice.paymentId);
    if (payment) payment.invoiceId = invoice.id;
  }
  touchFinanceState(restaurantId);
  return invoice;
}

export async function createPayment(restaurantId: string, input: PaymentInput) {
  const state = getFinanceState(restaurantId);
  const method = assertMethodExists(restaurantId, input.paymentMethodId);
  const adapter = getPaymentGatewayAdapter(input.gatewayProvider);
  const summary = normalizeCheckoutInput(input);
  const gatewayResult = await adapter.createPaymentIntent({
    amount: summary.total,
    currency: summary.currency,
    paymentMethod: method,
    requestedStatus: input.status,
    reference: input.reference ?? null,
    metadata: input.metadata ?? null,
  });

  const payment: Payment = {
    id: makeFinanceId("pay"),
    restaurantId,
    orderId: input.orderId ?? null,
    customerId: input.customerId ?? null,
    invoiceId: input.invoiceId ?? null,
    paymentMethodId: input.paymentMethodId,
    gatewayProvider: input.gatewayProvider,
    status: gatewayResult.status,
    subtotal: summary.subtotal,
    tax: summary.tax,
    discount: summary.discount,
    couponCode: summary.couponCode,
    couponDiscount: summary.couponDiscount,
    cashbackDiscount: summary.cashbackDiscount,
    deliveryFee: summary.deliveryFee,
    serviceFee: summary.serviceFee,
    tip: summary.tip,
    total: summary.total,
    paidAmount: summary.paidAmount,
    changeAmount: summary.changeAmount,
    currency: summary.currency,
    reference: input.reference ?? null,
    gatewayReference: gatewayResult.externalId,
    paidAt: gatewayResult.status === "PAID" ? now() : null,
    metadata: input.metadata ?? null,
    createdAt: now(),
    updatedAt: now(),
  };

  state.payments.unshift(payment);

  const transaction = createTransactionRecord(
    restaurantId,
    {
      paymentId: payment.id,
      gatewayProvider: input.gatewayProvider,
      type: gatewayResult.status === "AUTHORIZED" ? "AUTHORIZE" : "CAPTURE",
      status: gatewayResult.status === "FAILED" ? "FAILED" : "SUCCESS",
      amount: summary.total,
      fee: gatewayResult.fee,
      netAmount: gatewayResult.netAmount,
      currency: summary.currency,
      externalId: gatewayResult.externalId,
      reference: payment.reference,
      responseTimeMs: gatewayResult.responseTimeMs,
      retryCount: 0,
      payload: gatewayResult.payload,
      response: gatewayResult.response,
      errorCode: gatewayResult.status === "FAILED" ? "GATEWAY_FAILED" : null,
      errorMessage: gatewayResult.status === "FAILED" ? "Gateway recusou o pagamento." : null,
    },
    {
      externalId: gatewayResult.externalId,
      payload: gatewayResult.payload,
      response: gatewayResult.response,
      responseTimeMs: gatewayResult.responseTimeMs,
    }
  );

  createGatewayLog(restaurantId, {
    gatewayProvider: input.gatewayProvider,
    action: "create_payment_intent",
    status: gatewayResult.status === "FAILED" ? "FAILED" : "SUCCESS",
    payload: gatewayResult.payload,
    response: gatewayResult.response,
    durationMs: gatewayResult.responseTimeMs,
    error: gatewayResult.status === "FAILED" ? "Gateway recusou o pagamento." : null,
    retryCount: 0,
  });

  if (payment.status === "PAID" || payment.status === "AUTHORIZED") {
    const wallet = upsertWalletBalance(restaurantId, null, payment.total - gatewayResult.fee);
    createMovementRecord(restaurantId, wallet?.id ?? null, {
      walletId: wallet?.id ?? null,
      paymentId: payment.id,
      type: "REVENUE",
      category: "Receita de pagamento",
      amount: payment.total,
      balanceAfter: wallet?.balance ?? payment.total,
      notes: payment.reference,
      metadata: { gatewayProvider: payment.gatewayProvider, transactionId: transaction.id },
    }, wallet?.balance ?? payment.total);
  }

  touchFinanceState(restaurantId);
  return { payment, transaction, checkout: summary };
}

export async function createRefund(restaurantId: string, input: RefundInput) {
  const state = getFinanceState(restaurantId);
  const payment = state.payments.find((item) => item.id === input.paymentId);
  if (!payment) {
    throw new Error("Pagamento não encontrado.");
  }

  const adapter = getPaymentGatewayAdapter(input.gatewayProvider);
  const refundAmount = Math.min(input.amount, payment.total);
  const gatewayResult = await adapter.refundPayment({
    amount: refundAmount,
    currency: payment.currency,
    paymentReference: payment.gatewayReference ?? payment.reference ?? payment.id,
    reason: input.reason ?? null,
    metadata: input.metadata ?? null,
  });

  const refund: Refund = {
    id: makeFinanceId("ref"),
    restaurantId,
    paymentId: payment.id,
    transactionId: input.transactionId ?? null,
    gatewayProvider: input.gatewayProvider,
    type: input.type,
    status: input.status ?? "SUCCEEDED",
    amount: refundAmount,
    reason: input.reason ?? null,
    metadata: input.metadata ?? null,
    createdAt: now(),
    updatedAt: now(),
  };

  state.refunds.unshift(refund);
  payment.status = refundAmount >= payment.total ? "REFUNDED" : "PARTIALLY_REFUNDED";
  payment.updatedAt = now();

  const transaction = createTransactionRecord(
    restaurantId,
    {
      paymentId: payment.id,
      gatewayProvider: input.gatewayProvider,
      type: "REFUND",
      status: "SUCCESS",
      amount: refundAmount,
      fee: 0,
      netAmount: refundAmount * -1,
      currency: payment.currency,
      externalId: gatewayResult.externalId,
      reference: payment.reference,
      responseTimeMs: gatewayResult.responseTimeMs,
      retryCount: 0,
      payload: gatewayResult.payload,
      response: gatewayResult.response,
      errorCode: null,
      errorMessage: null,
    },
    {
      externalId: gatewayResult.externalId,
      payload: gatewayResult.payload,
      response: gatewayResult.response,
      responseTimeMs: gatewayResult.responseTimeMs,
    }
  );

  createGatewayLog(restaurantId, {
    gatewayProvider: input.gatewayProvider,
    action: "refund_payment",
    status: "SUCCESS",
    payload: gatewayResult.payload,
    response: gatewayResult.response,
    durationMs: gatewayResult.responseTimeMs,
    error: null,
    retryCount: 0,
  });

  const wallet = upsertWalletBalance(restaurantId, null, -refundAmount);
  createMovementRecord(restaurantId, wallet?.id ?? null, {
    walletId: wallet?.id ?? null,
    paymentId: payment.id,
    refundId: refund.id,
    type: "REFUND",
    category: "Reembolso",
    amount: refundAmount,
    balanceAfter: wallet?.balance ?? 0,
    notes: input.reason ?? "Reembolso processado",
    metadata: { gatewayProvider: input.gatewayProvider, transactionId: transaction.id },
  }, wallet?.balance ?? 0);

  touchFinanceState(restaurantId);
  return { refund, transaction };
}

export async function recordWebhookEvent(restaurantId: string, input: WebhookEventInput) {
  const state = getFinanceState(restaurantId);
  const event: WebhookEvent = {
    id: makeFinanceId("wh"),
    restaurantId,
    gatewayProvider: input.gatewayProvider,
    eventType: input.eventType,
    externalId: input.externalId ?? null,
    status: input.status ?? "RECEIVED",
    payload: input.payload ?? null,
    processedAt: input.processedAt ? new Date(String(input.processedAt)) : null,
    error: input.error ?? null,
    attempts: input.attempts,
    retryAt: input.retryAt ? new Date(String(input.retryAt)) : null,
    createdAt: now(),
    updatedAt: now(),
  };
  state.webhookEvents.unshift(event);
  createGatewayLog(restaurantId, {
    gatewayProvider: input.gatewayProvider,
    action: `webhook:${input.eventType}`,
    status: event.status === "FAILED" ? "FAILED" : event.status === "RETRYING" ? "RETRYING" : "SUCCESS",
    payload: input.payload ?? null,
    response: { eventType: input.eventType, status: event.status },
    durationMs: 35,
    error: input.error ?? null,
    retryCount: input.attempts,
  });
  touchFinanceState(restaurantId);
  return event;
}

export async function listGatewayLogs(restaurantId: string, filters: Partial<FinanceFilterInput> = {}) {
  const state = getFinanceState(restaurantId);
  const range = buildRange(filters.period ?? "last_30_days", filters.startDate, filters.endDate);
  return paginate(state.gatewayLogs.filter((log) => withinRange(log.createdAt, range)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()), filters.page, filters.perPage);
}

export async function listWebhookEvents(restaurantId: string, filters: Partial<FinanceFilterInput> = {}) {
  const state = getFinanceState(restaurantId);
  const range = buildRange(filters.period ?? "last_30_days", filters.startDate, filters.endDate);
  return paginate(state.webhookEvents.filter((event) => withinRange(event.createdAt, range)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()), filters.page, filters.perPage);
}

export function buildCheckoutSummary(input: Partial<PaymentCheckoutInput> = {}) {
  return normalizeCheckoutInput(input);
}

export async function getPaymentsDashboard(restaurantId: string, signature: string): Promise<PaymentsDashboard> {
  return getPaymentsDashboardCached(restaurantId, signature, financeRevision(restaurantId));
}

export async function getFinanceDashboard(restaurantId: string, signature: string): Promise<FinanceDashboard> {
  return getFinanceDashboardCached(restaurantId, signature, financeRevision(restaurantId));
}

function workbookFromRows(sheetName: string, rows: Record<string, string | number | null>[]) {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ vazio: "Sem dados" }]);
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName.slice(0, 31));
  return workbook;
}

function toBase64FromWorkbook(workbook: XLSX.WorkBook) {
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer;
  return buffer.toString("base64");
}

function pdfBase64(title: string, subtitle: string, rows: Array<Record<string, string | number | null>>) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(title, 40, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(subtitle, 40, 60);
  let cursorY = 84;
  rows.slice(0, 50).forEach((row) => {
    const text = Object.entries(row)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join(" | ");
    const lines = doc.splitTextToSize(text, 515);
    lines.forEach((line: string) => {
      if (cursorY > 770) {
        doc.addPage();
        cursorY = 40;
      }
      doc.text(line, 40, cursorY);
      cursorY += 12;
    });
    cursorY += 4;
  });
  return Buffer.from(doc.output("arraybuffer")).toString("base64");
}

export async function exportPaymentsData(restaurantId: string, signature: string, format: PaymentExportFormat) {
  const dashboard = await getPaymentsDashboard(restaurantId, signature);
  const rows = dashboard.payments.map((payment) => ({
    pagamento: payment.id,
    status: payment.status,
    total: formatCurrency(payment.total, payment.currency),
    gateway: payment.gatewayProvider,
    metodo: dashboard.paymentMethods.find((method) => method.id === payment.paymentMethodId)?.name ?? payment.paymentMethodId,
    criado_em: formatDateKey(payment.createdAt),
  }));

  if (format === "csv") {
    const csv = [Object.keys(rows[0] ?? { pagamento: "", status: "", total: "", gateway: "", metodo: "", criado_em: "" }).join(",")]
      .concat(rows.map((row) => Object.values(row).map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")))
      .join("\n");
    return { filename: "payments.csv", mimeType: "text/csv", base64: Buffer.from(csv).toString("base64") };
  }

  if (format === "xlsx") {
    return { filename: "payments.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", base64: toBase64FromWorkbook(workbookFromRows("Payments", rows)) };
  }

  return { filename: "payments.pdf", mimeType: "application/pdf", base64: pdfBase64("Relatório de Pagamentos", dashboard.period.label, rows) };
}

export async function exportFinanceData(restaurantId: string, signature: string, format: PaymentExportFormat) {
  const dashboard = await getFinanceDashboard(restaurantId, signature);
  const rows = dashboard.financialMovements.map((movement) => ({
    movimentacao: movement.id,
    categoria: movement.category,
    tipo: movement.type,
    valor: formatCurrency(movement.amount),
    saldo: formatCurrency(movement.balanceAfter),
    centro_custo: movement.costCenter ?? "-",
  }));

  if (format === "csv") {
    const csv = [Object.keys(rows[0] ?? { movimentacao: "", categoria: "", tipo: "", valor: "", saldo: "", centro_custo: "" }).join(",")]
      .concat(rows.map((row) => Object.values(row).map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")))
      .join("\n");
    return { filename: "finance.csv", mimeType: "text/csv", base64: Buffer.from(csv).toString("base64") };
  }

  if (format === "xlsx") {
    return { filename: "finance.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", base64: toBase64FromWorkbook(workbookFromRows("Finance", rows)) };
  }

  return { filename: "finance.pdf", mimeType: "application/pdf", base64: pdfBase64("Relatório Financeiro", dashboard.period.label, rows) };
}

export async function listPaymentGatewayAdaptersAction() {
  return listPaymentGatewayAdapters();
}

export { formatCurrency as formatPaymentsCurrency, formatDateKey as formatPaymentsDateKey };
