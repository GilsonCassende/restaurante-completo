import type { FinanceFilterInput } from "@/schemas";
import {
  exportFinanceData,
  getFinanceDashboard,
  listFinancialMovements,
  listGatewayLogs,
  listInvoices,
  listPayments,
  listTransactions,
  listWallets,
  listWebhookEvents,
  recordFinancialMovement,
  upsertWallet,
} from "@/services/payments";

export { buildCheckoutSummary } from "@/services/payments";
export type { FinanceDashboard, PaymentsDashboard } from "@/services/payments";

export async function getFinanceOverview(restaurantId: string, signature: string) {
  return getFinanceDashboard(restaurantId, signature);
}

export async function getFinanceDashboardActionData(restaurantId: string, signature: string) {
  return getFinanceDashboard(restaurantId, signature);
}

export { getFinanceDashboard };

export async function exportFinance(restaurantId: string, signature: string, format: "csv" | "xlsx" | "pdf") {
  return exportFinanceData(restaurantId, signature, format);
}

export async function listFinancePayments(restaurantId: string, filters: Partial<FinanceFilterInput> = {}) {
  return listPayments(restaurantId, filters);
}

export async function listFinanceInvoices(restaurantId: string, filters: Partial<FinanceFilterInput> = {}) {
  return listInvoices(restaurantId, filters);
}

export async function listFinanceTransactions(restaurantId: string, filters: Partial<FinanceFilterInput> = {}) {
  return listTransactions(restaurantId, filters);
}

export async function listFinanceMovements(restaurantId: string, filters: Partial<FinanceFilterInput> = {}) {
  return listFinancialMovements(restaurantId, filters);
}

export async function listFinanceWallets(restaurantId: string) {
  return listWallets(restaurantId);
}

export async function listFinanceGatewayLogs(restaurantId: string, filters: Partial<FinanceFilterInput> = {}) {
  return listGatewayLogs(restaurantId, filters);
}

export async function listFinanceWebhookEvents(restaurantId: string, filters: Partial<FinanceFilterInput> = {}) {
  return listWebhookEvents(restaurantId, filters);
}

export { listPayments, listInvoices, listTransactions, listFinancialMovements, listWallets, listGatewayLogs, listWebhookEvents, recordFinancialMovement, upsertWallet };
