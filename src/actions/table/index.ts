"use server";

import { revalidatePath } from "next/cache";
import { ROLES } from "@/permissions";
import { requireRole } from "@/lib/session";
import { buildQrCodeDataUrl } from "@/lib/qr";
import {
  createTable as insertTable,
  deleteTable as removeTable,
  listTablesByRestaurant,
  updateTable as saveTable,
} from "@/prisma";
import { createTableSchema, updateTableSchema, type CreateTableInput, type UpdateTableInput } from "@/schemas";
import type { Table } from "@/types";

const DASHBOARD_PATH = "/dashboard/tables";

export type TableActionResult<T = Table> =
  | { ok: true; data: T }
  | { ok: false; message: string };

async function getCatalogContext() {
  const user = await requireRole([ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER]);
  return {
    restaurantId: user.restaurantId,
  };
}

async function assertTableAvailable(restaurantId: string, number: number, currentId?: string) {
  const tables = await listTablesByRestaurant(restaurantId);
  return !tables.some((table) => table.id !== currentId && table.number === number);
}

export async function createTableAction(input: CreateTableInput): Promise<TableActionResult> {
  const parsed = createTableSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Mesa inválida." };
  }

  const { restaurantId } = await getCatalogContext();
  const isAvailable = await assertTableAvailable(restaurantId, parsed.data.number);
  if (!isAvailable) {
    return { ok: false, message: "Já existe uma mesa com esse número." };
  }

  const qrCode = buildQrCodeDataUrl(`${restaurantId}:${parsed.data.number}`);
  const table = await insertTable({
    restaurantId,
    number: parsed.data.number,
    qrCode,
    active: parsed.data.active,
  });

  revalidatePath(DASHBOARD_PATH);
  return { ok: true, data: table };
}

export async function updateTableAction(input: UpdateTableInput): Promise<TableActionResult> {
  const parsed = updateTableSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Mesa inválida." };
  }

  const { restaurantId } = await getCatalogContext();
  const isAvailable = await assertTableAvailable(restaurantId, parsed.data.number, parsed.data.id);
  if (!isAvailable) {
    return { ok: false, message: "Já existe uma mesa com esse número." };
  }

  const qrCode = buildQrCodeDataUrl(`${restaurantId}:${parsed.data.number}`);
  const table = await saveTable(parsed.data.id, restaurantId, {
    number: parsed.data.number,
    qrCode,
    active: parsed.data.active,
  });

  if (!table) {
    return { ok: false, message: "Mesa não encontrada." };
  }

  revalidatePath(DASHBOARD_PATH);
  return { ok: true, data: table };
}

export async function deleteTableAction(input: { id: string }): Promise<TableActionResult<null>> {
  const { restaurantId } = await getCatalogContext();
  const deleted = await removeTable(input.id, restaurantId);

  if (!deleted) {
    return { ok: false, message: "Mesa não encontrada." };
  }

  revalidatePath(DASHBOARD_PATH);
  return { ok: true, data: null };
}
