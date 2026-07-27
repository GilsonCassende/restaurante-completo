"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PencilLine, Plus, Trash2 } from "lucide-react";
import { createTableAction, deleteTableAction, updateTableAction } from "@/actions/table";
import { ConfirmationDialog } from "@/components/design-system/dialogs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { createTableSchema, type CreateTableInput } from "@/schemas";
import type { Table } from "@/types";
import { useRouter } from "next/navigation";

type TableManagerProps = {
  tables: Table[];
};

const emptyValues: CreateTableInput = {
  number: 1,
  active: true,
};

function formatTableNumber(number: number) {
  return number.toString().padStart(2, "0");
}

export function TableManager({ tables }: TableManagerProps) {
  const router = useRouter();
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Table | null>(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateTableInput>({
    resolver: zodResolver(createTableSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (editingTable) {
      form.reset({
        number: editingTable.number,
        active: editingTable.active,
      });
      return;
    }

    form.reset(emptyValues);
  }, [editingTable, form]);

  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    setIsSubmitting(true);
    try {
      const result = editingTable
        ? await updateTableAction({ ...values, id: editingTable.id })
        : await createTableAction(values);

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      setEditingTable(null);
      setMessage(editingTable ? "Mesa atualizada com sucesso." : "Mesa criada com sucesso.");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  });

  const handleDelete = (table: Table) => {
    setDeleteTarget(table);
  };

  const confirmDelete = () => {
    if (!deleteTarget) {
      return;
    }

    setMessage("");
    setIsSubmitting(true);
    void (async () => {
      const result = await deleteTableAction({ id: deleteTarget.id });
      if (!result.ok) {
        setMessage(result.message);
        setIsSubmitting(false);
        return;
      }

      if (editingTable?.id === deleteTarget.id) {
        setEditingTable(null);
      }

      setMessage("Mesa removida com sucesso.");
      setDeleteTarget(null);
      router.refresh();
      setIsSubmitting(false);
    })();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
      <Card className="border-border/70 bg-gradient-to-br from-card via-card to-muted/20 shadow-[var(--shadow-soft)] backdrop-blur">
        <CardHeader>
          <CardTitle>{editingTable ? "Editar mesa" : "Nova mesa"}</CardTitle>
          <CardDescription>
            Gere automaticamente o QR Code da mesa a partir do número e do restaurante.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-2">
              <label htmlFor="table-number" className="text-sm font-medium">
                Número
              </label>
              <Input id="table-number" type="number" min={1} disabled={isSubmitting} {...form.register("number", { valueAsNumber: true })} />
            </div>
            <label className="flex items-center gap-3 rounded-xl border border-input px-3 py-2 text-sm">
              <input type="checkbox" className="h-4 w-4 rounded border-input" {...form.register("active")} />
              Mesa ativa
            </label>
            {message ? <p role="status" className="rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">{message}</p> : null}
            <div className="flex gap-3">
              <Button type="submit" className="flex-1" loading={isSubmitting}>
                <Plus className="h-4 w-4" />
                {editingTable ? "Salvar alterações" : "Criar mesa"}
              </Button>
              {editingTable ? (
                <Button type="button" variant="outline" onClick={() => setEditingTable(null)} disabled={isSubmitting}>
                  Limpar
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-gradient-to-br from-card via-card to-muted/20 shadow-[var(--shadow-soft)] backdrop-blur">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Mesas</CardTitle>
              <CardDescription>{tables.length} mesa(s) cadastradas</CardDescription>
            </div>
            <Badge variant="secondary">QR automático</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          {tables.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
              Nenhuma mesa encontrada neste restaurante.
            </div>
          ) : (
            tables.map((table) => (
              <div key={table.id} className="grid gap-4 rounded-2xl border border-border/70 p-4 md:grid-cols-[128px_minmax(0,1fr)]">
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-muted/40 p-3">
                  <Image
                    src={table.qrCode}
                    alt={`QR Code da mesa ${table.number}`}
                    width={112}
                    height={112}
                    unoptimized
                    className="h-28 w-28 rounded-xl border border-border bg-white p-2"
                  />
                  <span className="text-xs text-muted-foreground">Mesa {formatTableNumber(table.number)}</span>
                </div>
                <div className="flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold">Mesa {table.number}</h3>
                      <Badge variant={table.active ? "default" : "outline"}>
                        {table.active ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      QR Code gerado automaticamente para acesso rápido por mesa.
                    </p>
                    <p className="break-all text-xs text-muted-foreground">Código: {table.qrCode}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditingTable(table)} disabled={isSubmitting}>
                      <PencilLine className="h-4 w-4" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(table)} loading={isSubmitting}>
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        title="Excluir mesa"
        description={
          deleteTarget
            ? `A mesa ${deleteTarget.number} será removida. O QR Code associado deixará de funcionar para novos acessos.`
            : ""
        }
        confirmLabel="Excluir mesa"
        cancelLabel="Manter mesa"
        intent="destructive"
        loading={isSubmitting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
