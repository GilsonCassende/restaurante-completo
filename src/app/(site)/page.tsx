import type { Metadata } from "next";
import { PremiumLandingPage } from "@/components/landing";
import { ThemeLoader } from "@/context/theme";
import { getRuntimeConfig } from "@/lib/enterprise";
import { buildNextMetadata } from "@/lib/enterprise/seo";
import { normalizeSupportedLocale } from "@/lib/enterprise/i18n";
import { getRestaurantLanding } from "@/services/landing";
import { getThemeForRestaurant } from "@/services/theme";

export async function generateMetadata(): Promise<Metadata> {
  const landing = await getRestaurantLanding();
  const { seo } = landing;
  const runtime = getRuntimeConfig();
  const locale = normalizeSupportedLocale(landing.restaurant.language, "pt-BR");

  return buildNextMetadata({
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    canonicalPath: "/",
    locale,
    siteUrl: runtime.metadataBaseUrl,
    type: "website",
    robots: {
      index: true,
      follow: true,
      archive: true,
      snippet: true,
    },
    images: seo.image
      ? [
          {
            url: seo.image,
            width: 1200,
            height: 630,
            alt: landing.restaurant.name,
          },
        ]
      : undefined,
  });
}

export default async function HomePage() {
  const landing = await getRestaurantLanding();
  const theme = await getThemeForRestaurant(landing.restaurant);

  return (
    <ThemeLoader theme={theme}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(landing.seo.jsonLd) }} />
      <PremiumLandingPage landing={landing} />
    </ThemeLoader>
  );
}
