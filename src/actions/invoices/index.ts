"use server";

import { revalidatePath } from "next/cache";
import { ROLES } from "@/permissions";
import { requireRole } from "@/lib/session";
import { createInvoice, exportInvoicesData, listInvoices, sendInvoiceEmail } from "@/services/invoices";
import { invoiceSchema, invoiceFilterSchema, type InvoiceFilterInput, type InvoiceInput } from "@/schemas";

type InvoiceActionResult<T> = { ok: true; data: T } | { ok: false; message: string };

const VIEW_ROLES = [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.STAFF] as const;
const EDIT_ROLES = [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER] as const;

async function getViewContext() {
  return requireRole(VIEW_ROLES);
}

async function getEditContext() {
  return requireRole(EDIT_ROLES);
}

export async function listInvoicesAction(filters: Partial<InvoiceFilterInput> = {}) {
  const user = await getViewContext();
  return listInvoices(user.restaurantId, filters);
}

export async function createInvoiceAction(input: InvoiceInput): Promise<InvoiceActionResult<Awaited<ReturnType<typeof createInvoice>>>> {
  const parsed = invoiceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invoice inválida." };
  }

  const user = await getViewContext();
  const invoice = await createInvoice(user.restaurantId, parsed.data);
  revalidatePath("/dashboard/payments");
  revalidatePath("/dashboard/finance");
  return { ok: true, data: invoice };
}

export async function sendInvoiceEmailAction(invoiceId: string, email: string): Promise<InvoiceActionResult<Awaited<ReturnType<typeof sendInvoiceEmail>>>> {
  const user = await getEditContext();
  try {
    const payload = await sendInvoiceEmail(user.restaurantId, invoiceId, email);
    revalidatePath("/dashboard/payments");
    revalidatePath("/dashboard/finance");
    return { ok: true, data: payload };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Não foi possível enviar o email da invoice." };
  }
}

export async function exportInvoicesAction(filters: Partial<InvoiceFilterInput> & { format: "csv" | "xlsx" | "pdf" }) {
  const parsed = invoiceFilterSchema.safeParse(filters);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Filtros inválidos." } as const;
  }

  const user = await getEditContext();
  const payload = await exportInvoicesData(user.restaurantId, parsed.data, filters.format);
  return { ok: true, data: payload } as const;
}
