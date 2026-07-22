"use client";

import type { ReactNode } from "react";
import type { ThemeTokens } from "@/lib/theme";
import { ThemeProvider } from "./theme-provider";

type RestaurantThemeProviderProps = {
  theme: ThemeTokens;
  children: ReactNode;
  className?: string;
};

export function RestaurantThemeProvider({ theme, children, className = "min-h-screen bg-background text-foreground" }: RestaurantThemeProviderProps) {
  return (
    <ThemeProvider theme={theme}>
      <div data-restaurant-theme={theme.restaurantId} className={className}>
        {children}
      </div>
    </ThemeProvider>
  );
}
