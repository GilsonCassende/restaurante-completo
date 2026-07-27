"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ShoppingCart, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/cart";
import type { Category, Product } from "@/types";

type MenuViewProps = {
  restaurantId: string;
  restaurantName: string;
  categories: Category[];
  products: Product[];
};

const moneyFormatter = new Intl.NumberFormat("pt-AO", {
  style: "currency",
  currency: "AOA",
  maximumFractionDigits: 0,
});

export function MenuView({ restaurantId, restaurantName, categories, products }: MenuViewProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<string>("all");
  const cart = useCart(restaurantId);

  const visibleProducts = useMemo(
    () =>
      products.filter((product) => {
        if (!product.active) return false;
        if (activeCategoryId === "all") return true;
        return product.categoryId === activeCategoryId;
      }),
    [activeCategoryId, products]
  );

  const categoriesById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <Card className="border-border/70 bg-gradient-to-br from-card via-card to-muted/20 shadow-[var(--shadow-soft)] backdrop-blur">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>{restaurantName}</CardTitle>
                <CardDescription>
                  Cardápio digital com carrinho global, cálculo automático e fluxo pronto para checkout.
                </CardDescription>
              </div>
              <Badge variant="secondary">{cart.quantity} item(ns)</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant={activeCategoryId === "all" ? "default" : "outline"} size="sm" onClick={() => setActiveCategoryId("all")}>
              Todas
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={activeCategoryId === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategoryId(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {visibleProducts.length === 0 ? (
            <Card className="border-border/70 bg-gradient-to-br from-card via-card to-muted/20 shadow-[var(--shadow-soft)] backdrop-blur md:col-span-2">
              <CardContent className="p-6 text-sm text-muted-foreground">
                Nenhum produto ativo encontrado para a categoria selecionada.
              </CardContent>
            </Card>
          ) : (
            visibleProducts.map((product) => {
              const category = categoriesById.get(product.categoryId);
              const unitPrice = product.promotionalPrice ?? product.price;

              return (
                <Card key={product.id} className="border-border/70 bg-gradient-to-br from-card via-card to-muted/20 shadow-[var(--shadow-soft)] backdrop-blur">
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        <CardDescription>{category?.name ?? "Categoria indisponível"}</CardDescription>
                      </div>
                      {product.featured ? <Badge>Destaque</Badge> : null}
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">{product.description || "Sem descrição."}</p>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">{moneyFormatter.format(unitPrice)}</p>
                      {product.promotionalPrice ? (
                        <p className="text-xs text-muted-foreground line-through">{moneyFormatter.format(product.price)}</p>
                      ) : null}
                    </div>
                    <Button type="button" size="sm" onClick={() => cart.addItem(product)}>
                      <Plus className="h-4 w-4" />
                      Adicionar
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      <aside className="lg:sticky lg:top-24">
        <Card className="border-border/70 bg-gradient-to-br from-card via-card to-muted/20 shadow-[var(--shadow-soft)] backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Resumo do carrinho
            </CardTitle>
            <CardDescription>
              {cart.quantity > 0 ? "Itens prontos para checkout." : "Seu carrinho ainda está vazio."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {cart.items.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                  Adicione itens do menu para montar o pedido.
                </div>
              ) : (
                cart.items.map((item) => (
                  <div key={item.productId} className="rounded-2xl border border-border/70 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{moneyFormatter.format(item.price)} cada</p>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => cart.removeItem(item.productId)}>
                        Remover
                      </Button>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
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
            </div>

            <div className={cn("rounded-2xl border border-border/70 bg-muted/30 p-4", cart.quantity === 0 && "opacity-60")}>
              <div className="flex items-center justify-between text-sm">
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
                <Link href="/checkout">Ir para checkout</Link>
              </Button>
              <Button asChild variant="outline" disabled={cart.quantity === 0}>
                <Link href="/cart">Ver carrinho</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
