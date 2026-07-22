import { z } from "zod";
import { idSchema } from "../common";

export const orderStatusValues = ["PENDING", "PREPARING", "READY", "DELIVERED", "CANCELED"] as const;

export const orderStatusSchema = z.enum(orderStatusValues);

export const orderItemSchema = z.object({
  productId: idSchema,
  quantity: z.coerce.number().int().positive("Informe uma quantidade válida."),
});

export const createOrderSchema = z.object({
  customerName: z.string().min(2, "Informe um nome com pelo menos 2 caracteres.").max(120),
  customerPhone: z.string().min(6, "Informe um telefone válido.").max(30),
  tableId: idSchema,
  notes: z.preprocess((value) => (value === "" ? undefined : value), z.string().max(500).optional()),
  items: z.array(orderItemSchema).min(1, "Adicione ao menos um item ao pedido."),
});

export const updateOrderStatusSchema = z.object({
  id: idSchema,
  status: orderStatusSchema,
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
