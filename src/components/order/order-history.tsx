"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock3, CookingPot, MessageSquareText, X } from "lucide-react";
import { updateOrderStatusAction } from "@/actions/order";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { OrderStatus, OrderWithDetails } from "@/types";

type OrderHistoryProps = {
  restaurantName: string;
  orders: OrderWithDetails[];
};

const moneyFormatter = new Intl.NumberFormat("pt-AO", {
  style: "currency",
  currency: "AOA",
  maximumFractionDigits: 0,
});

const statusMeta: Record<OrderStatus, { label: string; icon: typeof Clock3; variant: "default" | "secondary" | "outline" }> = {
  PENDING: { label: "Pendente", icon: Clock3, variant: "secondary" },
  PREPARING: { label: "Em preparo", icon: CookingPot, variant: "default" },
  READY: { label: "Pronto", icon: Check, variant: "outline" },
  DELIVERED: { label: "Entregue", icon: Check, variant: "outline" },
  CANCELED: { label: "Cancelado", icon: X, variant: "outline" },
};

const statusOptions: OrderStatus[] = ["PENDING", "PREPARING", "READY", "DELIVERED", "CANCELED"];

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("pt-AO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function OrderHistory({ restaurantName, orders }: OrderHistoryProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [statusDrafts, setStatusDrafts] = useState<Record<string, OrderStatus>>(
    Object.fromEntries(orders.map((order) => [order.id, order.status])) as Record<string, OrderStatus>
  );

  const handleSave = (id: string) => {
    const nextStatus = statusDrafts[id];
    if (!nextStatus) return;

    setMessage("");
    setUpdatingId(id);
    void (async () => {
      const result = await updateOrderStatusAction({ id, status: nextStatus });
      if (!result.ok) {
        setMessage(result.message);
        setUpdatingId("");
        return;
      }

      setMessage("Status atualizado com sucesso.");
      setUpdatingId("");
      router.refresh();
    })();
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/70 bg-card/90 shadow-sm backdrop-blur">
        <CardHeader>
          <CardTitle>Histórico de pedidos</CardTitle>
          <CardDescription>{restaurantName}</CardDescription>
        </CardHeader>
        <CardContent>
          {message ? <p className="rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">{message}</p> : null}
        </CardContent>
      </Card>

      {orders.length === 0 ? (
        <Card className="border-border/70 bg-card/90 shadow-sm backdrop-blur">
          <CardContent className="p-6 text-sm text-muted-foreground">
            Ainda não existem pedidos para este restaurante.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => {
            const status = statusMeta[statusDrafts[order.id] ?? order.status];
            const Icon = status.icon;

            return (
              <Card key={order.id} className="border-border/70 bg-card/90 shadow-sm backdrop-blur">
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-lg">Mesa {order.table.number}</CardTitle>
                        <Badge variant={status.variant} className="gap-1">
                          <Icon className="h-3.5 w-3.5" />
                          {status.label}
                        </Badge>
                      </div>
                      <CardDescription>
                        {order.customerName} · {order.customerPhone} · {formatDate(order.createdAt)}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">{moneyFormatter.format(order.total)}</p>
                      <p className="text-xs text-muted-foreground">Pedido #{order.id.slice(-6)}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_280px]">
                    <div className="space-y-3">
                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="rounded-2xl border border-border/70 p-3">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium">{item.product.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {item.quantity} x {moneyFormatter.format(item.price)}
                                </p>
                              </div>
                              <span className="text-sm font-semibold">{moneyFormatter.format(item.subtotal)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-2xl border border-dashed p-3 text-sm text-muted-foreground">
                        <MessageSquareText className="mr-2 inline-block h-4 w-4" />
                        {order.notes || "Sem observações"}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-2xl border border-border/70 p-4">
                      <label htmlFor={`status-${order.id}`} className="text-sm font-medium">
                        Atualizar status
                      </label>
                      <select
                        id={`status-${order.id}`}
                        className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                        value={statusDrafts[order.id] ?? order.status}
                        onChange={(event) =>
                          setStatusDrafts((current) => ({
                            ...current,
                            [order.id]: event.target.value as OrderStatus,
                          }))
                        }
                      >
                        {statusOptions.map((option) => (
                          <option key={option} value={option}>
                            {statusMeta[option].label}
                          </option>
                        ))}
                      </select>
                      <Button type="button" className="w-full" onClick={() => handleSave(order.id)} disabled={updatingId === order.id}>
                        Salvar status
                      </Button>
                      <div className="rounded-2xl bg-muted/30 p-3 text-xs text-muted-foreground">
                        Mesa: {order.table.number}
                        <br />
                        Última atualização: {formatDate(order.updatedAt)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
