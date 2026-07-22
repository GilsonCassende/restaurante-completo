"use client";

import { createContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "@/types";

export type CartItem = {
  restaurantId: string;
  productId: string;
  name: string;
  slug: string;
  image: string | null;
  price: number;
  quantity: number;
};

type CartState = Record<string, CartItem[]>;

type CartContextValue = {
  getItems: (restaurantId: string) => CartItem[];
  addItem: (restaurantId: string, product: Product, quantity?: number) => void;
  removeItem: (restaurantId: string, productId: string) => void;
  setQuantity: (restaurantId: string, productId: string, quantity: number) => void;
  clearCart: (restaurantId: string) => void;
};

type CartProviderProps = {
  children: ReactNode;
};

const STORAGE_KEY = "restaurantpro-cart";

const CartContext = createContext<CartContextValue | null>(null);

export function calculateCartTotals(items: CartItem[]) {
  return items.reduce(
    (accumulator, item) => {
      accumulator.subtotal += item.price * item.quantity;
      accumulator.total += item.price * item.quantity;
      accumulator.quantity += item.quantity;
      return accumulator;
    },
    { subtotal: 0, total: 0, quantity: 0 }
  );
}

export function addCartItem(items: CartItem[], restaurantId: string, product: Product, quantity = 1) {
  const unitPrice = product.promotionalPrice ?? product.price;
  const existing = items.find((item) => item.productId === product.id);
  if (!existing) {
    return [
      ...items,
      {
        restaurantId,
        productId: product.id,
        name: product.name,
        slug: product.slug,
        image: product.image,
        price: unitPrice,
        quantity,
      },
    ];
  }

  return items.map((item) =>
    item.productId === product.id
      ? {
          ...item,
          quantity: item.quantity + quantity,
          price: unitPrice,
        }
      : item
  );
}

export function removeCartItem(items: CartItem[], productId: string) {
  return items.filter((item) => item.productId !== productId);
}

export function setCartItemQuantity(items: CartItem[], productId: string, quantity: number) {
  return items
    .map((item) =>
      item.productId === productId
        ? {
            ...item,
            quantity,
          }
        : item
    )
    .filter((item) => item.quantity > 0);
}

function normalizeState(value: unknown): CartState {
  if (!value || typeof value !== "object") {
    return {};
  }

  const state: CartState = {};
  for (const [restaurantId, items] of Object.entries(value as Record<string, unknown>)) {
    if (!Array.isArray(items)) continue;

    state[restaurantId] = items
      .filter((item) => item && typeof item === "object")
      .map((item) => {
        const cartItem = item as Partial<CartItem>;
        return {
          restaurantId: typeof cartItem.restaurantId === "string" ? cartItem.restaurantId : restaurantId,
          productId: typeof cartItem.productId === "string" ? cartItem.productId : "",
          name: typeof cartItem.name === "string" ? cartItem.name : "",
          slug: typeof cartItem.slug === "string" ? cartItem.slug : "",
          image: typeof cartItem.image === "string" || cartItem.image === null ? cartItem.image : null,
          price: typeof cartItem.price === "number" ? cartItem.price : Number(cartItem.price ?? 0),
          quantity: typeof cartItem.quantity === "number" ? cartItem.quantity : Number(cartItem.quantity ?? 1),
        };
      })
      .filter((item) => item.productId.length > 0 && item.name.length > 0 && item.quantity > 0);
  }

  return state;
}

export function CartProvider({ children }: CartProviderProps) {
  const [state, setState] = useState<CartState>({});

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw?.trim()) return;
      setState(normalizeState(JSON.parse(raw)));
    } catch {
      setState({});
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const value = useMemo<CartContextValue>(() => {
    const update = (restaurantId: string, updater: (items: CartItem[]) => CartItem[]) => {
      setState((current) => {
        const nextItems = updater(current[restaurantId] ?? []);
        return {
          ...current,
          [restaurantId]: nextItems,
        };
      });
    };

    return {
      getItems: (restaurantId) => state[restaurantId] ?? [],
      addItem: (restaurantId, product, quantity = 1) => {
        update(restaurantId, (items) => addCartItem(items, restaurantId, product, quantity));
      },
      removeItem: (restaurantId, productId) => {
        update(restaurantId, (items) => removeCartItem(items, productId));
      },
      setQuantity: (restaurantId, productId, quantity) => {
        update(restaurantId, (items) => setCartItemQuantity(items, productId, quantity));
      },
      clearCart: (restaurantId) => {
        update(restaurantId, () => []);
      },
    };
  }, [state]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export { CartContext };
