"use server";

import { revalidatePath } from "next/cache";
import { ROLES } from "@/permissions";
import { requireRole } from "@/lib/session";
import { buildWhatsAppOrderMessage, buildWhatsAppOrderUrl } from "@/lib/whatsapp";
import {
  createOrder as insertOrder,
  findRestaurantById,
  findTableById,
  listProductsByRestaurant,
  listOrdersByRestaurant,
  updateOrderStatus as saveOrderStatus,
} from "@/prisma";
import { createOrderSchema, updateOrderStatusSchema, type CreateOrderInput, type UpdateOrderStatusInput } from "@/schemas";
import type { OrderStatus, OrderWithDetails } from "@/types";

const ORDER_PATHS = ["/menu", "/cart", "/checkout", "/dashboard/orders"] as const;

export type OrderActionResult<T = OrderWithDetails> =
  | { ok: true; data: T }
  | { ok: false; message: string };

export type CreateOrderActionData = {
  order: OrderWithDetails;
  whatsappMessage: string;
  whatsappUrl: string | null;
};

const ORDER_ROLES = [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.STAFF] as const;
const DASHBOARD_ROLES = [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.STAFF] as const;

async function getOrderContext() {
  const user = await requireRole(ORDER_ROLES);
  return {
    user,
    restaurantId: user.restaurantId,
  };
}

async function buildOrderItems(input: CreateOrderInput, restaurantId: string) {
  const products = await listProductsByRestaurant(restaurantId);
  const productMap = new Map(products.map((product) => [product.id, product]));

  return input.items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product || !product.active) {
      throw new Error("Produto inválido ou indisponível.");
    }

    const price = product.promotionalPrice ?? product.price;
    return {
      product,
      price,
      quantity: item.quantity,
      subtotal: price * item.quantity,
    };
  });
}

export async function createOrderAction(input: CreateOrderInput): Promise<OrderActionResult<CreateOrderActionData>> {
  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Pedido inválido." };
  }

  const { restaurantId } = await getOrderContext();
  const table = await findTableById(parsed.data.tableId, restaurantId);
  if (!table) {
    return { ok: false, message: "Mesa não encontrada." };
  }

  let orderItems;
  try {
    orderItems = await buildOrderItems(parsed.data, restaurantId);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Não foi possível montar o pedido.",
    };
  }

  const total = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  const order = await insertOrder({
    restaurantId,
    customerName: parsed.data.customerName,
    customerPhone: parsed.data.customerPhone,
    tableId: parsed.data.tableId,
    status: "PENDING",
    total,
    notes: parsed.data.notes ?? null,
    items: orderItems.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
    })),
  });

  const whatsappMessage = buildWhatsAppOrderMessage({
    customerName: parsed.data.customerName,
    customerPhone: parsed.data.customerPhone,
    table: { number: table.number },
    items: orderItems.map((item) => ({
      name: item.product.name,
      quantity: item.quantity,
      price: item.price,
    })),
    total,
    notes: parsed.data.notes,
  });
  const restaurant = await findRestaurantById(restaurantId);
  const whatsappUrl = buildWhatsAppOrderUrl(restaurant?.phone, whatsappMessage);

  ORDER_PATHS.forEach((pathname) => revalidatePath(pathname));

  return {
    ok: true,
    data: {
      order,
      whatsappMessage,
      whatsappUrl,
    },
  };
}

export async function updateOrderStatusAction(input: UpdateOrderStatusInput): Promise<OrderActionResult<OrderWithDetails>> {
  const parsed = updateOrderStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Status inválido." };
  }

  await requireRole(DASHBOARD_ROLES);

  const order = await saveOrderStatus(parsed.data.id, (await getOrderContext()).restaurantId, parsed.data.status as OrderStatus);
  if (!order) {
    return { ok: false, message: "Pedido não encontrado." };
  }

  revalidatePath("/dashboard/orders");
  return { ok: true, data: order };
}

export async function listOrdersForCurrentRestaurant() {
  const { restaurantId } = await getOrderContext();
  return listOrdersByRestaurant(restaurantId);
}

export async function getOrderRestaurant() {
  const { restaurantId } = await getOrderContext();
  return findRestaurantById(restaurantId);
}
