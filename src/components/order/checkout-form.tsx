"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MessageSquareText, Send } from "lucide-react";
import { createOrderAction } from "@/actions/order";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/hooks/cart";
import { createOrderSchema } from "@/schemas";
import type { Table } from "@/types";

type CheckoutFormProps = {
  restaurantId: string;
  restaurantName: string;
  restaurantPhone: string | null;
  tables: Table[];
};

const checkoutSchema = createOrderSchema.omit({ items: true });
type CheckoutValues = {
  customerName: string;
  customerPhone: string;
  tableId: string;
  notes?: string;
};

const moneyFormatter = new Intl.NumberFormat("pt-AO", {
  style: "currency",
  currency: "AOA",
  maximumFractionDigits: 0,
});

export function CheckoutForm({ restaurantId, restaurantName, restaurantPhone, tables }: CheckoutFormProps) {
  const cart = useCart(restaurantId);
  const [message, setMessage] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultTableId = useMemo(() => tables.find((table) => table.active)?.id ?? tables[0]?.id ?? "", [tables]);

  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      tableId: defaultTableId,
      notes: "",
    },
  });

  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    setWhatsappUrl(null);

    if (cart.items.length === 0) {
      setMessage("Adicione itens ao carrinho antes de concluir o pedido.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createOrderAction({
        ...values,
        items: cart.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      cart.clearCart();
      setMessage("Pedido criado com sucesso.");
      setWhatsappUrl(result.data.whatsappUrl);
      form.reset({
        customerName: "",
        customerPhone: "",
        tableId: defaultTableId,
        notes: "",
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="border-border/70 bg-card/90 shadow-sm backdrop-blur">
        <CardHeader>
          <CardTitle>Checkout</CardTitle>
          <CardDescription>
            Confirme os dados do pedido, selecione a mesa e gere a mensagem automática para WhatsApp.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={submit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="checkout-name" className="text-sm font-medium">
                  Nome
                </label>
                <Input id="checkout-name" {...form.register("customerName")} placeholder="Nome do cliente" />
                {form.formState.errors.customerName ? (
                  <p className="text-xs text-destructive">{form.formState.errors.customerName.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label htmlFor="checkout-phone" className="text-sm font-medium">
                  Telefone
                </label>
                <Input id="checkout-phone" {...form.register("customerPhone")} placeholder="+244..." />
                {form.formState.errors.customerPhone ? (
                  <p className="text-xs text-destructive">{form.formState.errors.customerPhone.message}</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="checkout-table" className="text-sm font-medium">
                Mesa
              </label>
              <select
                id="checkout-table"
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                {...form.register("tableId")}
              >
                <option value="">Selecione a mesa</option>
                {tables.map((table) => (
                  <option key={table.id} value={table.id}>
                    Mesa {table.number}{table.active ? "" : " (inativa)"}
                  </option>
                ))}
              </select>
              {form.formState.errors.tableId ? (
                <p className="text-xs text-destructive">{form.formState.errors.tableId.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label htmlFor="checkout-notes" className="text-sm font-medium">
                Observações
              </label>
              <Textarea id="checkout-notes" {...form.register("notes")} placeholder="Sem cebola, extra molho..." />
            </div>

            {message ? <p className="rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">{message}</p> : null}

            <div className="flex flex-wrap gap-3">
              <Button type="submit" className="flex-1" disabled={isSubmitting || cart.quantity === 0}>
                <Send className="h-4 w-4" />
                Criar pedido
              </Button>
              <Button asChild variant="outline">
                <Link href="/cart">Voltar ao carrinho</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/90 shadow-sm backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquareText className="h-5 w-5" />
            WhatsApp
          </CardTitle>
          <CardDescription>Mensagem automática pronta para envio.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span>Restaurante</span>
              <span className="font-medium">{restaurantName}</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span>WhatsApp</span>
              <span className="font-medium">{restaurantPhone || "Não informado"}</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span>Total atual</span>
              <span className="font-medium">{moneyFormatter.format(cart.total)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span>Itens</span>
              <span className="font-medium">{cart.quantity}</span>
            </div>
          </div>

          {whatsappUrl ? (
            <div className="space-y-3">
              <Badge variant="secondary">Pedido pronto</Badge>
              <Button asChild className="w-full">
                <a href={whatsappUrl} target="_blank" rel="noreferrer">
                  Abrir WhatsApp
                </a>
              </Button>
            </div>
          ) : null}

          <div className="rounded-2xl border border-dashed p-4 text-xs leading-6 text-muted-foreground">
            O texto final inclui Nome, Mesa, Pedido, Quantidade, Total e Observações. O link usa o telefone do restaurante
            quando disponível.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
