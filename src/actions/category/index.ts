"use server";

import { revalidatePath } from "next/cache";
import { ROLES } from "@/permissions";
import { requireRole } from "@/lib/session";
import { createUniqueSlug } from "@/lib/slug";
import {
  createCategory as insertCategory,
  deleteCategory as removeCategory,
  listCategoriesByRestaurant,
  updateCategory as saveCategory,
} from "@/prisma";
import { createCategorySchema, updateCategorySchema, type CreateCategoryInput, type UpdateCategoryInput } from "@/schemas";
import type { Category } from "@/types";

const DASHBOARD_PATH = "/dashboard/categories";

export type CategoryActionResult<T = Category> =
  | { ok: true; data: T }
  | { ok: false; message: string };

async function getCatalogContext() {
  const user = await requireRole([ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER]);
  return {
    restaurantId: user.restaurantId,
  };
}

async function buildSlug(name: string, restaurantId: string, currentId?: string) {
  const categories = await listCategoriesByRestaurant(restaurantId);
  const existingSlugs = categories.filter((category) => category.id !== currentId).map((category) => category.slug);
  return createUniqueSlug(name, existingSlugs);
}

export async function createCategoryAction(input: CreateCategoryInput): Promise<CategoryActionResult> {
  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Categoria inválida." };
  }

  const { restaurantId } = await getCatalogContext();
  const slug = await buildSlug(parsed.data.name, restaurantId);

  const category = await insertCategory({
    restaurantId,
    name: parsed.data.name,
    slug,
    description: parsed.data.description ?? null,
    image: parsed.data.image ?? null,
    active: parsed.data.active,
    sortOrder: parsed.data.sortOrder,
  });

  revalidatePath(DASHBOARD_PATH);
  return { ok: true, data: category };
}

export async function updateCategoryAction(input: UpdateCategoryInput): Promise<CategoryActionResult> {
  const parsed = updateCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Categoria inválida." };
  }

  const { restaurantId } = await getCatalogContext();
  const slug = await buildSlug(parsed.data.name, restaurantId, parsed.data.id);

  const category = await saveCategory(parsed.data.id, restaurantId, {
    name: parsed.data.name,
    slug,
    description: parsed.data.description ?? null,
    image: parsed.data.image ?? null,
    active: parsed.data.active,
    sortOrder: parsed.data.sortOrder,
  });

  if (!category) {
    return { ok: false, message: "Categoria não encontrada." };
  }

  revalidatePath(DASHBOARD_PATH);
  return { ok: true, data: category };
}

export async function deleteCategoryAction(input: { id: string }): Promise<CategoryActionResult<null>> {
  const { restaurantId } = await getCatalogContext();
  const deleted = await removeCategory(input.id, restaurantId);

  if (!deleted) {
    return { ok: false, message: "Categoria não encontrada." };
  }

  revalidatePath(DASHBOARD_PATH);
  return { ok: true, data: null };
}
