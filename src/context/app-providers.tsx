"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { STORAGE_KEYS } from "@/constants";
import { CartProvider } from "@/context/cart";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey={STORAGE_KEYS.theme}
    >
      <CartProvider>{children}</CartProvider>
    </ThemeProvider>
  );
}
