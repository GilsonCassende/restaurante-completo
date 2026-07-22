import { z } from "zod";
import { idSchema } from "../common";

export const tableBaseSchema = z.object({
  number: z.coerce.number().int().positive("Informe um número de mesa válido."),
  active: z.coerce.boolean().default(true),
});

export const createTableSchema = tableBaseSchema;

export const updateTableSchema = tableBaseSchema.extend({
  id: idSchema,
});

export type CreateTableInput = z.infer<typeof createTableSchema>;
export type UpdateTableInput = z.infer<typeof updateTableSchema>;
