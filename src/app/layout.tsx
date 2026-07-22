import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppProviders } from "@/context/app-providers";
import { ThemeLoader } from "@/context/theme";
import { APP_CONFIG } from "@/constants";
import { getRuntimeConfig, resolveCurrentLocale } from "@/lib/enterprise";
import { getCurrentRestaurant } from "@/lib/session";
import { getCurrentRestaurantTheme } from "@/services/theme";

const runtime = getRuntimeConfig();

export const metadata: Metadata = {
  title: {
    default: APP_CONFIG.name,
    template: `%s | ${APP_CONFIG.name}`,
  },
  description: APP_CONFIG.description,
  metadataBase: new URL(runtime.metadataBaseUrl),
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const [theme, restaurant] = await Promise.all([getCurrentRestaurantTheme(), getCurrentRestaurant()]);
  const locale = resolveCurrentLocale({
    tenantId: restaurant?.id ?? null,
    restaurantLocale: restaurant?.language ?? null,
  });

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="bg-background font-sans text-foreground antialiased">
        <ThemeLoader theme={theme}>
          <AppProviders>{children}</AppProviders>
        </ThemeLoader>
      </body>
    </html>
  );
}
