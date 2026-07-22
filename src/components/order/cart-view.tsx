"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/hooks/cart";

type CartViewProps = {
  restaurantId: string;
  restaurantName: string;
};

const moneyFormatter = new Intl.NumberFormat("pt-AO", {
  style: "currency",
  currency: "AOA",
  maximumFractionDigits: 0,
});

export function CartView({ restaurantId, restaurantName }: CartViewProps) {
  const cart = useCart(restaurantId);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="border-border/70 bg-card/90 shadow-sm backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Carrinho
          </CardTitle>
          <CardDescription>{restaurantName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {cart.items.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
              O carrinho está vazio. Volte ao menu para adicionar produtos.
            </div>
          ) : (
            cart.items.map((item) => (
              <div key={item.productId} className="rounded-2xl border border-border/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-xs text-muted-foreground">{moneyFormatter.format(item.price)} por unidade</p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => cart.removeItem(item.productId)}>
                    Remover
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 rounded-xl border border-input px-2 py-1">
                    <Button type="button" variant="ghost" size="icon" onClick={() => cart.setQuantity(item.productId, item.quantity - 1)}>
                      -
                    </Button>
                    <span className="min-w-6 text-center text-sm font-semibold">{item.quantity}</span>
                    <Button type="button" variant="ghost" size="icon" onClick={() => cart.setQuantity(item.productId, item.quantity + 1)}>
                      +
                    </Button>
                  </div>
                  <span className="text-sm font-semibold">{moneyFormatter.format(item.price * item.quantity)}</span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/90 shadow-sm backdrop-blur">
        <CardHeader>
          <CardTitle>Resumo</CardTitle>
          <CardDescription>Subtotal, total e navegação para o checkout.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
            <div className="flex items-center justify-between text-sm">
              <span>Itens</span>
              <span className="font-semibold">{cart.quantity}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm">
              <span>Subtotal</span>
              <span className="font-semibold">{moneyFormatter.format(cart.subtotal)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm">
              <span>Total</span>
              <span className="font-semibold">{moneyFormatter.format(cart.total)}</span>
            </div>
          </div>

          <div className="grid gap-2">
            <Button asChild disabled={cart.quantity === 0}>
              <Link href="/checkout">Finalizar pedido</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/menu">Continuar no menu</Link>
            </Button>
            <Button type="button" variant="ghost" onClick={cart.clearCart} disabled={cart.quantity === 0}>
              Limpar carrinho
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
