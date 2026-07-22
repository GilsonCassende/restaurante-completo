import { z } from "zod";
import { idSchema } from "../common";

const imageSchema = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().url("Informe uma URL de imagem válida.").optional()
);

export const categoryBaseSchema = z.object({
  name: z.string().min(2, "Informe um nome com pelo menos 2 caracteres.").max(120),
  description: z.preprocess((value) => (value === "" ? undefined : value), z.string().max(500).optional()),
  image: imageSchema,
  active: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const createCategorySchema = categoryBaseSchema;

export const updateCategorySchema = categoryBaseSchema.extend({
  id: idSchema,
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
