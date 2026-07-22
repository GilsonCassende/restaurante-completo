import type { ReactNode } from "react";
import type { ThemeMode } from "@/types";

export type ThemePresetKey = "inter" | "plus-jakarta" | "dm-sans" | "space-grotesk" | "sora" | "fraunces";
export type ThemeRadiusKey = "sm" | "md" | "lg" | "xl" | "2xl" | "pill";
export type ThemeStyleKey = "solid" | "gradient" | "outline" | "glass" | "minimal" | "editorial" | "simple" | "rich";

export type ThemeRegistryItem = {
  label: string;
  description: string;
  className: string;
};

export type ThemeRegistryCollection<T extends string> = Record<T, ThemeRegistryItem>;

export type ThemeRegistry = {
  fonts: Record<ThemePresetKey, { label: string; stack: string }>;
  radius: Record<ThemeRadiusKey, { label: string; value: string }>;
  buttonStyles: ThemeRegistryCollection<"solid" | "gradient" | "outline">;
  cardStyles: ThemeRegistryCollection<"flat" | "glass" | "soft">;
  heroStyles: ThemeRegistryCollection<"split" | "editorial" | "immersive">;
  footerStyles: ThemeRegistryCollection<"simple" | "rich" | "minimal">;
};

export type ThemeColorTokens = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  success: string;
  warning: string;
  error: string;
  border: string;
  ring: string;
};

export type ThemeModeTokens = {
  colors: ThemeColorTokens;
  gradients: {
    brand: string;
    brandSoft: string;
    hero: string;
    surface: string;
  };
  shadows: {
    soft: string;
    card: string;
    glow: string;
    float: string;
  };
};

export type ThemeTokens = {
  restaurantId: string;
  restaurantName: string;
  themeMode: ThemeMode;
  fontFamily: ThemePresetKey;
  radius: ThemeRadiusKey;
  buttonStyle: keyof ThemeRegistry["buttonStyles"];
  cardStyle: keyof ThemeRegistry["cardStyles"];
  heroStyle: keyof ThemeRegistry["heroStyles"];
  footerStyle: keyof ThemeRegistry["footerStyles"];
  registry: ThemeRegistry;
  light: ThemeModeTokens;
  dark: ThemeModeTokens;
  cssText: string;
  cssVariables: Record<string, string>;
  contrast: {
    primaryOnBackground: number;
    textOnBackground: number;
    accentOnSurface: number;
  };
  warnings: string[];
  preview: {
    title: string;
    description: string;
    accentLabel: string;
  };
};

export type ThemeProviderValue = ThemeTokens & {
  children?: ReactNode;
};

