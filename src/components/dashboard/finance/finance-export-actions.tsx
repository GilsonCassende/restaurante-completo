"use client";

import { useState, useTransition } from "react";
import { exportFinanceAction } from "@/actions/finance";
import { Button } from "@/components/ui/button";
import type { FinanceFilterInput } from "@/schemas";

type FinanceExportActionsProps = {
  filters: Partial<FinanceFilterInput>;
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

export function FinanceExportActions({ filters, disabled }: FinanceExportActionsProps) {
  const [pendingFormat, setPendingFormat] = useState<"csv" | "xlsx" | "pdf" | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleExport = (format: "csv" | "xlsx" | "pdf") => {
    startTransition(async () => {
      setPendingFormat(format);
      const result = await exportFinanceAction({ ...filters, page: filters.page ?? 1, perPage: filters.perPage ?? 20, period: filters.period ?? "last_30_days", format });
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
