import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import type { InvoiceStatus } from "@/types";
import type { InvoiceFilterInput, InvoiceInput, PaymentExportFormat } from "@/schemas";
import { createInvoice as createInvoiceRecord, listInvoices as listInvoiceRecords } from "@/services/payments";
import { getFinanceState } from "@/services/payments/state";

function formatCurrency(value: number, currency = "AOA") {
  return new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function workbookFromRows(sheetName: string, rows: Record<string, string | number | null>[]) {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ vazio: "Sem dados" }]);
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName.slice(0, 31));
  return workbook;
}

function toBase64(workbook: XLSX.WorkBook) {
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
  return buffer.toString("base64");
}

function pdfBase64(title: string, subtitle: string, rows: Array<Record<string, string | number | null>>) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(title, 40, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(subtitle, 40, 60);
  let cursorY = 84;
  rows.forEach((row) => {
    const text = Object.entries(row)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join(" | ");
    const lines = doc.splitTextToSize(text, 515);
    lines.forEach((line: string) => {
      if (cursorY > 770) {
        doc.addPage();
        cursorY = 40;
      }
      doc.text(line, 40, cursorY);
      cursorY += 12;
    });
    cursorY += 4;
  });
  return Buffer.from(doc.output("arraybuffer")).toString("base64");
}

export async function listInvoices(restaurantId: string, filters: Partial<InvoiceFilterInput> = {}) {
  return listInvoiceRecords(restaurantId, filters);
}

export async function createInvoice(restaurantId: string, input: InvoiceInput) {
  return createInvoiceRecord(restaurantId, input);
}

export async function updateInvoiceStatus(restaurantId: string, invoiceId: string, status: InvoiceStatus) {
  const state = getFinanceState(restaurantId);
  const current = state.invoices.find((invoice) => invoice.id === invoiceId) ?? null;
  if (!current) {
    return null;
  }

  current.status = status;
  current.updatedAt = new Date();
  return current;
}

export async function sendInvoiceEmail(restaurantId: string, invoiceId: string, email: string) {
  const state = getFinanceState(restaurantId);
  const current = state.invoices.find((invoice) => invoice.id === invoiceId) ?? null;
  if (!current) {
    throw new Error("Invoice não encontrada.");
  }

  current.emailedAt = new Date();
  current.updatedAt = new Date();

  return {
    invoiceId,
    email,
    subject: `Invoice ${current.number}`,
    html: `<p>Invoice ${current.number} enviada para ${email}.</p>`,
  };
}

export async function exportInvoicesData(restaurantId: string, filters: Partial<InvoiceFilterInput>, format: PaymentExportFormat) {
  const invoices = (await listInvoiceRecords(restaurantId, filters)).items;
  const rows = invoices.map((invoice) => ({
    invoice: invoice.number,
    status: invoice.status,
    total: formatCurrency(invoice.total),
    subtotal: formatCurrency(invoice.subtotal),
    desconto: formatCurrency(invoice.discount),
    criado_em: invoice.createdAt.toISOString().slice(0, 10),
  }));

  if (format === "csv") {
    const csv = [Object.keys(rows[0] ?? { invoice: "", status: "", total: "", subtotal: "", desconto: "", criado_em: "" }).join(",")]
      .concat(rows.map((row) => Object.values(row).map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")))
      .join("\n");
    return { filename: "invoices.csv", mimeType: "text/csv", base64: Buffer.from(csv).toString("base64") };
  }

  if (format === "xlsx") {
    return { filename: "invoices.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", base64: toBase64(workbookFromRows("Invoices", rows)) };
  }

  return { filename: "invoices.pdf", mimeType: "application/pdf", base64: pdfBase64("Relatório de Invoices", "Exportação de faturas", rows) };
}
