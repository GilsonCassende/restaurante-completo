import { PaymentsCharts } from "@/components/dashboard/payments/payments-charts";
import type { FinanceDashboard } from "@/services/finance";

type FinanceChartsProps = {
  trends: FinanceDashboard["trends"];
  currency?: string | null;
};

export function FinanceCharts({ trends, currency }: FinanceChartsProps) {
  return <PaymentsCharts trends={trends} currency={currency} />;
}
