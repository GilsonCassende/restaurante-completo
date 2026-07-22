import { z } from "zod";
import { paginationSchema } from "../common";

const periodValues = ["today", "yesterday", "last_7_days", "last_30_days", "this_month", "last_month", "this_year", "custom"] as const;
const exportFormatValues = ["csv", "xlsx", "pdf"] as const;

const dateInputSchema = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.").optional().nullable());

export const analyticsPeriodValues = periodValues;
export const analyticsPeriodSchema = z.enum(periodValues);
export const analyticsExportFormatValues = exportFormatValues;
export const analyticsExportFormatSchema = z.enum(exportFormatValues);

export const analyticsFilterSchema = paginationSchema.extend({
  period: analyticsPeriodSchema.default("last_30_days"),
  startDate: dateInputSchema,
  endDate: dateInputSchema,
});

export const analyticsExportSchema = analyticsFilterSchema.extend({
  format: analyticsExportFormatSchema.default("csv"),
});

export type AnalyticsPeriod = z.infer<typeof analyticsPeriodSchema>;
export type AnalyticsFilterInput = z.infer<typeof analyticsFilterSchema>;
export type AnalyticsExportInput = z.infer<typeof analyticsExportSchema>;
