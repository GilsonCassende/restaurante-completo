"use server";

import { revalidatePath } from "next/cache";
import { ROLES } from "@/permissions";
import { requireRole } from "@/lib/session";
import { createUniqueSlug } from "@/lib/slug";
import {
  createProduct as insertProduct,
  deleteProduct as removeProduct,
  findCategoryById,
  listProductsByRestaurant,
  updateProduct as saveProduct,
} from "@/prisma";
import { createProductSchema, updateProductSchema, type CreateProductInput, type UpdateProductInput } from "@/schemas";
import type { Product } from "@/types";

const DASHBOARD_PATH = "/dashboard/products";

export type ProductActionResult<T = Product> =
  | { ok: true; data: T }
  | { ok: false; message: string };

async function getCatalogContext() {
  const user = await requireRole([ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER]);
  return {
    restaurantId: user.restaurantId,
  };
}

async function buildSlug(name: string, restaurantId: string, currentId?: string) {
  const products = await listProductsByRestaurant(restaurantId);
  const existingSlugs = products.filter((product) => product.id !== currentId).map((product) => product.slug);
  return createUniqueSlug(name, existingSlugs);
}

export async function createProductAction(input: CreateProductInput): Promise<ProductActionResult> {
  const parsed = createProductSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Produto inválido." };
  }

  const { restaurantId } = await getCatalogContext();
  const category = await findCategoryById(parsed.data.categoryId, restaurantId);
  if (!category) {
    return { ok: false, message: "Categoria informada não pertence ao restaurante atual." };
  }

  const slug = await buildSlug(parsed.data.name, restaurantId);
  const product = await insertProduct({
    restaurantId,
    categoryId: parsed.data.categoryId,
    name: parsed.data.name,
    slug,
    description: parsed.data.description ?? null,
    image: parsed.data.image ?? null,
    price: parsed.data.price,
    promotionalPrice: parsed.data.promotionalPrice ?? null,
    active: parsed.data.active,
    featured: parsed.data.featured,
    preparationTime: parsed.data.preparationTime ?? null,
  });

  revalidatePath(DASHBOARD_PATH);
  return { ok: true, data: product };
}

export async function updateProductAction(input: UpdateProductInput): Promise<ProductActionResult> {
  const parsed = updateProductSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Produto inválido." };
  }

  const { restaurantId } = await getCatalogContext();
  const category = await findCategoryById(parsed.data.categoryId, restaurantId);
  if (!category) {
    return { ok: false, message: "Categoria informada não pertence ao restaurante atual." };
  }

  const slug = await buildSlug(parsed.data.name, restaurantId, parsed.data.id);
  const product = await saveProduct(parsed.data.id, restaurantId, {
    categoryId: parsed.data.categoryId,
    name: parsed.data.name,
    slug,
    description: parsed.data.description ?? null,
    image: parsed.data.image ?? null,
    price: parsed.data.price,
    promotionalPrice: parsed.data.promotionalPrice ?? null,
    active: parsed.data.active,
    featured: parsed.data.featured,
    preparationTime: parsed.data.preparationTime ?? null,
  });

  if (!product) {
    return { ok: false, message: "Produto não encontrado." };
  }

  revalidatePath(DASHBOARD_PATH);
  return { ok: true, data: product };
}

export async function deleteProductAction(input: { id: string }): Promise<ProductActionResult<null>> {
  const { restaurantId } = await getCatalogContext();
  const deleted = await removeProduct(input.id, restaurantId);

  if (!deleted) {
    return { ok: false, message: "Produto não encontrado." };
  }

  revalidatePath(DASHBOARD_PATH);
  return { ok: true, data: null };
}
