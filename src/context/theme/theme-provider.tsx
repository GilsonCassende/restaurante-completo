"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { ThemeTokens } from "@/lib/theme";

const ThemeContext = createContext<ThemeTokens | null>(null);

type ThemeProviderProps = {
  theme: ThemeTokens;
  children: ReactNode;
};

export function ThemeProvider({ theme, children }: ThemeProviderProps) {
  const value = useMemo(() => theme, [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeTokens() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeTokens must be used within ThemeProvider.");
  }

  return context;
}

