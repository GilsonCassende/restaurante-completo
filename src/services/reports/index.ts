import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import { findRestaurantById, listCategoriesByRestaurant, listCustomersByRestaurant, listOrdersByRestaurant, listReservationsByRestaurant } from "@/prisma";
import { getAnalyticsDashboard, normalizeAnalyticsRange } from "@/services/analytics";
import { getCashbackDashboard } from "@/services/cashback";
import { getCouponDashboard } from "@/services/coupons";
import { getLoyaltyDashboard } from "@/services/loyalty";
import { withTenantCache } from "@/lib/production";
import type { ReportFilterInput } from "@/schemas";
import type { Customer, OrderWithDetails, ReservationWithDetails, Restaurant } from "@/types";
import { formatAnalyticsCurrency } from "@/services/analytics";

type ReportRow = Record<string, string | number>;

export type ReportSection = {
  key: "orders" | "customers" | "products" | "categories" | "reservations" | "crm" | "coupons" | "cashback" | "loyalty";
  title: string;
  description: string;
  columns: string[];
  rows: ReportRow[];
  summary: {
    label: string;
    value: string;
  }[];
};

export type ReportsDashboard = {
  restaurant: Pick<Restaurant, "id" | "name" | "timezone" | "currency"> | null;
  period: {
    label: string;
    start: string;
    end: string;
  };
  overview: Awaited<ReturnType<typeof getAnalyticsDashboard>>["kpis"];
  sections: ReportSection[];
};

type ReportSources = {
  restaurant: Pick<Restaurant, "id" | "name" | "timezone" | "currency"> | null;
  customers: Customer[];
  orders: OrderWithDetails[];
  reservations: ReservationWithDetails[];
};

const reportSources = withTenantCache("reports", async (restaurantId: string): Promise<ReportSources> => {
  const [restaurant, customers, orders, reservations] = await Promise.all([
    findRestaurantById(restaurantId),
    listCustomersByRestaurant(restaurantId),
    listOrdersByRestaurant(restaurantId),
    listReservationsByRestaurant(restaurantId),
  ]);

  return {
    restaurant: restaurant ? { id: restaurant.id, name: restaurant.name, timezone: restaurant.timezone, currency: restaurant.currency } : null,
    customers,
    orders,
    reservations,
  };
}, {
  tenantIndex: 0,
  keyPrefix: "report-sources",
  revalidate: 120,
});

function keyLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function buildSection(key: ReportSection["key"], title: string, description: string, columns: string[], rows: ReportRow[], summary: ReportSection["summary"]): ReportSection {
  return { key, title, description, columns, rows, summary };
}

function pickRows<T extends ReportRow>(rows: T[], limit = 12) {
  return rows.slice(0, limit);
}

function buildWorkbook(sections: ReportSection[]) {
  const workbook = XLSX.utils.book_new();
  for (const section of sections) {
    const sheet = XLSX.utils.json_to_sheet(section.rows.length ? section.rows : [{ vazio: "Sem dados" }]);
    XLSX.utils.book_append_sheet(workbook, sheet, section.title.slice(0, 31));
  }
  return workbook;
}

function buildPdf(sections: ReportSection[], title: string, subtitle: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  let cursorY = 40;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(title, 40, cursorY);
  cursorY += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(subtitle, 40, cursorY);
  cursorY += 24;

  for (const section of sections) {
    if (cursorY > 740) {
      doc.addPage();
      cursorY = 40;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(section.title, 40, cursorY);
    cursorY += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(section.description, 40, cursorY);
    cursorY += 14;

    for (const row of section.rows.slice(0, 8)) {
      const text = Object.entries(row)
        .map(([key, value]) => `${keyLabel(key)}: ${String(value)}`)
        .join(" | ");
      const lines = doc.splitTextToSize(text, 515);
      for (const line of lines) {
        if (cursorY > 770) {
          doc.addPage();
          cursorY = 40;
        }
        doc.text(line, 40, cursorY);
        cursorY += 12;
      }
      cursorY += 4;
    }

    cursorY += 10;
  }

  return doc;
}

export const getReportsDashboard = withTenantCache("reports", async (restaurantId: string, signature: string): Promise<ReportsDashboard> => {
  const filters = JSON.parse(signature) as ReportFilterInput;
  const sources = await reportSources(restaurantId);
  const analytics = await getAnalyticsDashboard(restaurantId, signature);
  const timeZone = sources.restaurant?.timezone ?? null;
  const range = normalizeAnalyticsRange(filters, timeZone);
  const categories = await listCategoriesByRestaurant(restaurantId);
  const cashback = await getCashbackDashboard(restaurantId);
  const coupons = await getCouponDashboard(restaurantId);
  const loyalty = await getLoyaltyDashboard(restaurantId);

  const inRangeOrders = sources.orders.filter((order) => order.createdAt.toISOString().slice(0, 10) >= range.start && order.createdAt.toISOString().slice(0, 10) <= range.end);
  const inRangeReservations = sources.reservations.filter((reservation) => reservation.reservationDate >= range.start && reservation.reservationDate <= range.end);
  const inRangeCustomers = sources.customers.filter((customer) => customer.createdAt.toISOString().slice(0, 10) >= range.start && customer.createdAt.toISOString().slice(0, 10) <= range.end);

  const ordersSection = buildSection(
    "orders",
    "Pedidos",
    "Pedidos, itens e valores no intervalo selecionado.",
    ["Pedido", "Cliente", "Mesa", "Status", "Itens", "Total"],
    pickRows(
      inRangeOrders.map((order) => ({
        pedido: `#${order.id.slice(-6)}`,
        cliente: order.customerName,
        mesa: order.table.number,
        status: order.status,
        itens: order.items.reduce((total, item) => total + item.quantity, 0),
        total: formatAnalyticsCurrency(order.total, sources.restaurant?.currency ?? undefined),
      }))
    ),
    [
      { label: "Pedidos", value: String(inRangeOrders.length) },
      { label: "Faturamento", value: formatAnalyticsCurrency(inRangeOrders.reduce((total, order) => total + order.total, 0), sources.restaurant?.currency ?? undefined) },
    ]
  );

  const customersSection = buildSection(
    "customers",
    "Clientes",
    "Base ativa, recorrência e valor médio por cliente.",
    ["Cliente", "Status", "Pedidos", "Ticket médio", "Última visita"],
    pickRows(
      inRangeCustomers.map((customer) => ({
        cliente: customer.name,
        status: customer.status,
        pedidos: customer.frequency,
        ticket_medio: formatAnalyticsCurrency(customer.averageTicket, sources.restaurant?.currency ?? undefined),
        ultima_visita: customer.lastVisitAt ? customer.lastVisitAt.toISOString().slice(0, 10) : "Sem visita",
      }))
    ),
    [
      { label: "Clientes", value: String(inRangeCustomers.length) },
      { label: "VIP", value: String(inRangeCustomers.filter((customer) => customer.status === "VIP").length) },
    ]
  );

  const productTotals = new Map<string, { name: string; categoryId: string; units: number; revenue: number }>();
  for (const order of inRangeOrders) {
    for (const item of order.items) {
      const current = productTotals.get(item.productId) ?? { name: item.product.name, categoryId: item.product.categoryId, units: 0, revenue: 0 };
      current.units += item.quantity;
      current.revenue += item.subtotal;
      productTotals.set(item.productId, current);
    }
  }

  const productsSection = buildSection(
    "products",
    "Produtos",
    "Desempenho por produto com volume e receita.",
    ["Produto", "Categoria", "Vendidos", "Receita"],
    pickRows(
      Array.from(productTotals.values()).map((entry) => ({
        produto: entry.name,
        categoria: entry.categoryId,
        vendidos: entry.units,
        receita: formatAnalyticsCurrency(entry.revenue, sources.restaurant?.currency ?? undefined),
      }))
    ),
    [
      { label: "Produtos", value: String(productTotals.size) },
      { label: "Vendidos", value: String(Array.from(productTotals.values()).reduce((total, entry) => total + entry.units, 0)) },
    ]
  );

  const categoryTotals = new Map<string, { name: string; units: number; revenue: number }>();
  for (const category of categories) {
    categoryTotals.set(category.id, { name: category.name, units: 0, revenue: 0 });
  }
  for (const order of inRangeOrders) {
    for (const item of order.items) {
      const current = categoryTotals.get(item.product.categoryId) ?? { name: item.product.categoryId, units: 0, revenue: 0 };
      current.units += item.quantity;
      current.revenue += item.subtotal;
      categoryTotals.set(item.product.categoryId, current);
    }
  }

  const categoriesSection = buildSection(
    "categories",
    "Categorias",
    "Mix do cardápio e participação de cada categoria.",
    ["Categoria", "Vendidos", "Receita"],
    pickRows(
      Array.from(categoryTotals.values()).map((entry) => ({
        categoria: entry.name,
        vendidos: entry.units,
        receita: formatAnalyticsCurrency(entry.revenue, sources.restaurant?.currency ?? undefined),
      }))
    ),
    [{ label: "Categorias", value: String(categoryTotals.size) }]
  );

  const reservationsSection = buildSection(
    "reservations",
    "Reservas",
    "Fluxo de reservas e status operacional.",
    ["Código", "Cliente", "Mesa", "Data", "Status"],
    pickRows(
      inRangeReservations.map((reservation) => ({
        codigo: reservation.confirmationCode,
        cliente: reservation.customerName,
        mesa: reservation.table.number,
        data: `${reservation.reservationDate} ${reservation.reservationTime}`,
        status: reservation.status,
      }))
    ),
    [
      { label: "Reservas", value: String(inRangeReservations.length) },
      { label: "Canceladas", value: String(inRangeReservations.filter((reservation) => reservation.status === "CANCELLED").length) },
    ]
  );

  const crmSection = buildSection(
    "crm",
    "CRM",
    "Segmentação e retenção da base de clientes.",
    ["Segmento", "Quantidade", "Descrição"],
    [
      { segmento: "VIP", quantidade: analytics.rankings.vipCustomers, descricao: "Clientes com status VIP." },
      { segmento: "Inativos", quantidade: analytics.rankings.inactiveCustomers, descricao: "Clientes sem atividade recente." },
      { segmento: "Novos", quantidade: analytics.kpis.newCustomers, descricao: "Clientes criados no intervalo." },
      { segmento: "Recorrentes", quantidade: analytics.kpis.recurringCustomers, descricao: "Clientes com múltiplas compras." },
    ],
    [{ label: "Base", value: String(sources.customers.length) }]
  );

  const couponsSection = buildSection(
    "coupons",
    "Cupons",
    "Uso de cupons, descontos e adesão por campanha.",
    ["Cupom", "Tipo", "Uso", "Desconto"],
    pickRows(
      coupons.coupons.map((coupon) => ({
        cupom: coupon.code,
        tipo: coupon.type,
        uso: coupon.usedCount,
        desconto: formatAnalyticsCurrency(coupons.usages.filter((usage) => usage.couponId === coupon.id).reduce((total, usage) => total + usage.discountAmount, 0), sources.restaurant?.currency ?? undefined),
      }))
    ),
    [{ label: "Usos", value: String(coupons.usages.length) }]
  );

  const cashbackSection = buildSection(
    "cashback",
    "Cashback",
    "Saldo, emissão e resgates por cliente.",
    ["Cliente", "Saldo", "Ganho", "Resgatado"],
    pickRows(
      cashback.accounts.map((account) => ({
        cliente: account.customer.name,
        saldo: formatAnalyticsCurrency(account.balance, sources.restaurant?.currency ?? undefined),
        ganho: formatAnalyticsCurrency(account.totalEarned, sources.restaurant?.currency ?? undefined),
        resgatado: formatAnalyticsCurrency(account.totalRedeemed, sources.restaurant?.currency ?? undefined),
      }))
    ),
    [{ label: "Saldo total", value: formatAnalyticsCurrency(cashback.kpis.balance, sources.restaurant?.currency ?? undefined) }]
  );

  const loyaltySection = buildSection(
    "loyalty",
    "Fidelidade",
    "Carteira de pontos e transações de fidelidade.",
    ["Cliente", "Saldo", "Emitidos", "Resgatados"],
    pickRows(
      loyalty.accounts.map((account) => ({
        cliente: account.customer.name,
        saldo: `${account.pointsBalance} pts`,
        emitidos: `${account.totalPointsEarned} pts`,
        resgatados: `${account.totalPointsRedeemed} pts`,
      }))
    ),
    [{ label: "Pontos emitidos", value: `${loyalty.kpis.pointsIssued} pts` }]
  );

  return {
    restaurant: sources.restaurant,
    period: {
      label: range.label,
      start: range.start,
      end: range.end,
    },
    overview: analytics.kpis,
    sections: [ordersSection, customersSection, productsSection, categoriesSection, reservationsSection, crmSection, couponsSection, cashbackSection, loyaltySection],
  };
}, {
  tenantIndex: 0,
  keyPrefix: "reports-dashboard",
  revalidate: 90,
});

function encodeBase64(buffer: ArrayBuffer) {
  return Buffer.from(buffer).toString("base64");
}

export async function buildReportsExportPayload(restaurantId: string, signature: string, format: "csv" | "xlsx" | "pdf") {
  const dashboard = await getReportsDashboard(restaurantId, signature);
  const sections = dashboard.sections;
  const filenameBase = `RestaurantPro-Reports-${dashboard.period.start}-${dashboard.period.end}`;

  if (format === "csv") {
    const rows = [
      ["Secao", "Campo", "Valor"],
      ...sections.flatMap((section) => [
        [section.title, "Resumo", section.summary.map((item) => `${item.label}: ${item.value}`).join(" | ")],
        ...section.rows.map((row) => [section.title, Object.keys(row).join(", "), Object.values(row).join(", ")]),
      ]),
    ];
    return {
      filename: `${filenameBase}.csv`,
      mimeType: "text/csv;charset=utf-8",
      base64: Buffer.from(rows.map((row) => row.join(",")).join("\n"), "utf8").toString("base64"),
    };
  }

  if (format === "xlsx") {
    const workbook = buildWorkbook(sections);
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    return {
      filename: `${filenameBase}.xlsx`,
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      base64: encodeBase64(buffer as ArrayBuffer),
    };
  }

  const pdf = buildPdf(sections, "RestaurantPro BI", `Relatório consolidado • ${dashboard.period.label}`);
  const buffer = pdf.output("arraybuffer");
  return {
    filename: `${filenameBase}.pdf`,
    mimeType: "application/pdf",
    base64: encodeBase64(buffer as ArrayBuffer),
  };
}
