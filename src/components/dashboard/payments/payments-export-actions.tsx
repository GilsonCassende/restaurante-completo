"use client";

import { useState, useTransition } from "react";
import { exportPaymentsAction } from "@/actions/payments";
import { Button } from "@/components/ui/button";
import type { PaymentFilterInput } from "@/schemas";

type PaymentsExportActionsProps = {
  filters: Partial<PaymentFilterInput>;
  disabled?: boolean;
};

function downloadPayload(payload: { filename: string; mimeType: string; base64: string }) {
  const binary = window.atob(payload.base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  const url = window.URL.createObjectURL(new Blob([bytes], { type: payload.mimeType }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = payload.filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

export function PaymentsExportActions({ filters, disabled }: PaymentsExportActionsProps) {
  const [pendingFormat, setPendingFormat] = useState<"csv" | "xlsx" | "pdf" | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleExport = (format: "csv" | "xlsx" | "pdf") => {
    startTransition(async () => {
      setPendingFormat(format);
      const result = await exportPaymentsAction({ ...filters, page: filters.page ?? 1, perPage: filters.perPage ?? 20, period: filters.period ?? "last_30_days", format });
      if (result.ok) {
        downloadPayload(result.data);
      }
      setPendingFormat(null);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" onClick={() => handleExport("csv")} disabled={disabled || isPending}>
        {pendingFormat === "csv" ? "Exportando..." : "CSV"}
      </Button>
      <Button type="button" variant="outline" onClick={() => handleExport("xlsx")} disabled={disabled || isPending}>
        {pendingFormat === "xlsx" ? "Exportando..." : "Excel"}
      </Button>
      <Button type="button" onClick={() => handleExport("pdf")} disabled={disabled || isPending}>
        {pendingFormat === "pdf" ? "Exportando..." : "PDF"}
      </Button>
    </div>
  );
}
