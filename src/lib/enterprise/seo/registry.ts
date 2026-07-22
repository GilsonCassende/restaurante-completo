import { cache } from "react";
import type { Metadata } from "next";
import { resolveRuntimeConfig } from "../config";
import type { SeoMetadataInput, SeoMetadataResult, SeoSitemapEntry, SeoStructuredDataInput, SeoTenantConfig } from "./types";

type SeoStore = {
  tenants: Map<string, SeoTenantConfig>;
  metadataCache: Map<string, SeoMetadataResult>;
};

const store: SeoStore = {
  tenants: new Map(),
  metadataCache: new Map(),
};

function toAbsoluteUrl(siteUrl: string, path?: string | null) {
  const base = siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`;
  if (!path) return base.replace(/\/$/, "");
  if (/^https?:\/\//i.test(path)) return path;
  return new URL(path.replace(/^\/+/, ""), base).toString();
}

function wrapJsonLd(input: Record<string, unknown> | Array<Record<string, unknown>>) {
  if (Array.isArray(input)) {
    return input;
  }
  return [input];
}

export function registerSeoTenantConfig(config: SeoTenantConfig) {
  store.tenants.set(config.tenantId, config);
  store.metadataCache.clear();
  return config;
}

export function getSeoTenantConfig(tenantId: string) {
  return store.tenants.get(tenantId) ?? null;
}

export function listSeoTenantConfigs() {
  return Array.from(store.tenants.values());
}

export function buildCanonicalUrl(siteUrl: string, canonicalPath?: string | null) {
  return toAbsoluteUrl(siteUrl, canonicalPath ?? "/");
}

export function buildRobotsConfig(input?: SeoMetadataInput["robots"]) {
  return {
    index: input?.index ?? true,
    follow: input?.follow ?? true,
    noarchive: input?.archive === false ? true : false,
    nosnippet: input?.snippet === false ? true : false,
  };
}

export function buildOpenGraphMetadata(input: SeoMetadataInput) {
  return {
    title: input.title,
    description: input.description,
    type: input.type ?? "website",
    locale: input.locale.replace("-", "_"),
    url: buildCanonicalUrl(input.siteUrl, input.canonicalPath),
    images: input.images?.length
      ? input.images.map((image) => ({
          url: image.url,
          width: image.width,
          height: image.height,
          alt: image.alt,
        }))
      : undefined,
  };
}

export function buildTwitterMetadata(input: SeoMetadataInput) {
  const image = input.images?.[0]?.url;
  return {
    card: image ? "summary_large_image" : "summary",
    title: input.title,
    description: input.description,
    images: image ? [image] : undefined,
  };
}

export function buildStructuredData(input: SeoStructuredDataInput) {
  const restaurant = input.restaurant ?? null;

  switch (input.type) {
    case "organization":
      return {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: restaurant?.name ?? input.title ?? resolveRuntimeConfig().appName,
        url: input.url ?? restaurant?.website ?? resolveRuntimeConfig().appUrl,
        logo: restaurant?.logo ?? undefined,
        description: input.description ?? restaurant?.description ?? undefined,
        email: restaurant?.email ?? undefined,
        telephone: restaurant?.phone ?? undefined,
      };
    case "product":
      return {
        "@context": "https://schema.org",
        "@type": "Product",
        name: input.product?.name ?? input.title ?? "Produto",
        description: input.product?.description ?? input.description ?? undefined,
        image: input.product?.image ?? input.image ?? undefined,
        sku: input.product?.sku ?? undefined,
        offers: input.product?.price
          ? {
              "@type": "Offer",
              price: input.product.price,
              priceCurrency: input.product.currency ?? resolveRuntimeConfig().defaultCurrency,
              availability: "https://schema.org/InStock",
            }
          : undefined,
      };
    case "faq":
      return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: (input.faqs ?? []).map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      };
    case "breadcrumb":
      return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: (input.breadcrumbs ?? []).map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.label,
          item: item.href,
        })),
      };
    case "restaurant":
    default:
      return {
        "@context": "https://schema.org",
        "@type": "Restaurant",
        name: restaurant?.name ?? input.title ?? resolveRuntimeConfig().appName,
        url: input.url ?? restaurant?.website ?? resolveRuntimeConfig().appUrl,
        image: input.image ? [input.image] : restaurant?.logo ? [restaurant.logo] : undefined,
        description: input.description ?? restaurant?.description ?? undefined,
        address: restaurant?.address
          ? {
              "@type": "PostalAddress",
              streetAddress: restaurant.address,
              addressLocality: restaurant.city ?? undefined,
              addressCountry: restaurant.country ?? undefined,
            }
          : undefined,
        telephone: restaurant?.phone ?? undefined,
        email: restaurant?.email ?? undefined,
      };
  }
}

export function buildSeoMetadata(input: SeoMetadataInput): SeoMetadataResult {
  const canonicalUrl = buildCanonicalUrl(input.siteUrl, input.canonicalPath);
  const structuredData = input.structuredData ? wrapJsonLd(input.structuredData) : [];

  return {
    canonicalUrl,
    title: input.title,
    description: input.description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: buildRobotsConfig(input.robots),
    openGraph: buildOpenGraphMetadata(input),
    twitter: buildTwitterMetadata(input),
    keywords: input.keywords,
    metadataBase: new URL(input.siteUrl),
    other: {
      "canonical-url": canonicalUrl,
    },
    structuredData,
  };
}

export function buildNextMetadata(input: SeoMetadataInput): Metadata {
  const metadata = buildSeoMetadata(input);
  return {
    title: metadata.title,
    description: metadata.description,
    alternates: metadata.alternates,
    robots: metadata.robots,
    openGraph: metadata.openGraph,
    twitter: metadata.twitter,
    keywords: metadata.keywords,
    metadataBase: metadata.metadataBase,
    other: metadata.other,
  };
}

export const getCachedSeoMetadata = cache((input: SeoMetadataInput) => {
  const key = JSON.stringify(input);
  const cached = store.metadataCache.get(key);
  if (cached) return cached;
  const metadata = buildSeoMetadata(input);
  store.metadataCache.set(key, metadata);
  return metadata;
});

export function buildSitemapEntries(entries: SeoSitemapEntry[]) {
  return entries.map((entry) => ({
    url: entry.url,
    lastModified: entry.lastModified ?? new Date(),
    changeFrequency: entry.changeFrequency ?? "weekly",
    priority: entry.priority ?? 0.5,
  }));
}

export function createSeoHelpers(siteUrl = resolveRuntimeConfig().appUrl) {
  return {
    siteUrl,
    registerSeoTenantConfig,
    getSeoTenantConfig,
    listSeoTenantConfigs,
    buildCanonicalUrl: (path?: string | null) => buildCanonicalUrl(siteUrl, path),
    buildRobotsConfig,
    buildOpenGraphMetadata: (input: Omit<SeoMetadataInput, "siteUrl">) => buildOpenGraphMetadata({ ...input, siteUrl }),
    buildTwitterMetadata: (input: Omit<SeoMetadataInput, "siteUrl">) => buildTwitterMetadata({ ...input, siteUrl }),
    buildStructuredData,
    buildSeoMetadata: (input: Omit<SeoMetadataInput, "siteUrl">) => buildSeoMetadata({ ...input, siteUrl }),
    getCachedSeoMetadata: (input: Omit<SeoMetadataInput, "siteUrl">) => getCachedSeoMetadata({ ...input, siteUrl }),
    buildSitemapEntries,
  };
}
