import { useContext, useMemo } from "react";
import { CartContext, calculateCartTotals, type CartItem } from "@/context/cart";
import type { Product } from "@/types";

export type CartSummary = {
  items: CartItem[];
  subtotal: number;
  total: number;
  quantity: number;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
};

export function useCart(restaurantId: string): CartSummary {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart deve ser usado dentro de CartProvider.");
  }

  const items = context.getItems(restaurantId);
  const totals = calculateCartTotals(items);

  return useMemo(
    () => ({
      items,
      subtotal: totals.subtotal,
      total: totals.total,
      quantity: totals.quantity,
      addItem: (product: Product, quantity = 1) => context.addItem(restaurantId, product, quantity),
      removeItem: (productId: string) => context.removeItem(restaurantId, productId),
      setQuantity: (productId: string, quantity: number) => context.setQuantity(restaurantId, productId, quantity),
      clearCart: () => context.clearCart(restaurantId),
    }),
    [context, items, restaurantId, totals.quantity, totals.subtotal, totals.total]
  );
}
