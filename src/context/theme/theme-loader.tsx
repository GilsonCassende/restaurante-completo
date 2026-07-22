import type { ReactNode } from "react";
import type { Restaurant } from "@/types";
import type { ThemeTokens } from "@/lib/theme";
import { getCurrentRestaurantTheme, getPublicRestaurantTheme, getRestaurantThemeById, getRestaurantThemeBySlug } from "@/services/theme";
import { RestaurantThemeProvider } from "./restaurant-theme-provider";

type ThemeLoaderProps = {
  children: ReactNode;
  restaurant?: Restaurant | null;
  restaurantId?: string;
  restaurantSlug?: string;
  theme?: ThemeTokens | null;
  usePublicFallback?: boolean;
};

export async function ThemeLoader({
  children,
  restaurant,
  restaurantId,
  restaurantSlug,
  theme: providedTheme,
  usePublicFallback = true,
}: ThemeLoaderProps) {
  let theme = providedTheme;

  if (!theme && restaurant) {
    theme = await getRestaurantThemeById(restaurant.id);
  }

  if (!theme && restaurantId) {
    theme = await getRestaurantThemeById(restaurantId);
  }

  if (!theme && restaurantSlug) {
    theme = await getRestaurantThemeBySlug(restaurantSlug);
  }

  if (!theme && usePublicFallback) {
    theme = (await getCurrentRestaurantTheme()) ?? (await getPublicRestaurantTheme());
  }

  if (!theme) {
    return <>{children}</>;
  }

  return (
    <>
      <style id={`theme-${theme.restaurantId}`} dangerouslySetInnerHTML={{ __html: theme.cssText }} />
      <RestaurantThemeProvider theme={theme}>{children}</RestaurantThemeProvider>
    </>
  );
}
