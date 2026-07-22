import { z } from "zod";
import { paginationSchema } from "../common";
import { analyticsPeriodSchema, analyticsExportFormatSchema } from "../analytics";

const reportScopeValues = ["all", "orders", "customers", "products", "categories", "reservations", "crm", "coupons", "cashback", "loyalty"] as const;

const dateInputSchema = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.").optional().nullable());

export const reportScopeSchema = z.enum(reportScopeValues);
export const reportScopeValuesList = reportScopeValues;

export const reportFilterSchema = paginationSchema.extend({
  period: analyticsPeriodSchema.default("last_30_days"),
  report: reportScopeSchema.default("all"),
  startDate: dateInputSchema,
  endDate: dateInputSchema,
});

export const reportExportSchema = reportFilterSchema.extend({
  format: analyticsExportFormatSchema.default("csv"),
});

export type ReportScope = z.infer<typeof reportScopeSchema>;
export type ReportFilterInput = z.infer<typeof reportFilterSchema>;
export type ReportExportInput = z.infer<typeof reportExportSchema>;
