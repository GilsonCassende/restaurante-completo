import { z } from "zod";
import { idSchema } from "../common";

const imageSchema = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().url("Informe uma URL de imagem válida.").optional()
);

const moneySchema = z.coerce.number().min(0, "Informe um valor válido.");
const optionalMoneySchema = z.preprocess((value) => (value === "" ? undefined : value), z.coerce.number().min(0).optional());

export const productBaseSchema = z.object({
  categoryId: idSchema,
  name: z.string().min(2, "Informe um nome com pelo menos 2 caracteres.").max(120),
  description: z.preprocess((value) => (value === "" ? undefined : value), z.string().max(1000).optional()),
  image: imageSchema,
  price: moneySchema,
  promotionalPrice: optionalMoneySchema,
  active: z.coerce.boolean().default(true),
  featured: z.coerce.boolean().default(false),
  preparationTime: z.preprocess((value) => (value === "" ? undefined : value), z.coerce.number().int().min(1).optional()),
});

export const createProductSchema = productBaseSchema;

export const updateProductSchema = productBaseSchema.extend({
  id: idSchema,
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
