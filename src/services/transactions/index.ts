import type { FinanceFilterInput, FinancialMovementInput } from "@/schemas";
import { listFinancialMovements as listMovementRecords, recordFinancialMovement as recordMovementRecord } from "@/services/payments";

export async function listTransactions(restaurantId: string, filters: Partial<FinanceFilterInput> = {}) {
  return listMovementRecords(restaurantId, filters);
}

export async function listFinancialMovements(restaurantId: string, filters: Partial<FinanceFilterInput> = {}) {
  return listMovementRecords(restaurantId, filters);
}

export async function recordFinancialMovement(restaurantId: string, input: FinancialMovementInput) {
  return recordMovementRecord(restaurantId, input);
}
