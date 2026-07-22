import type { Metadata } from "next";
import type { Restaurant } from "@/types";
import type { SupportedLocale } from "../config";

export type SeoTenantConfig = {
  tenantId: string;
  restaurantId: string;
  slug: string;
  locale: SupportedLocale;
  timezone: string;
  currency: string;
  siteUrl: string;
  canonicalPath?: string | null;
  robots?: {
    index?: boolean;
    follow?: boolean;
    archive?: boolean;
    snippet?: boolean;
  } | null;
  metadata?: Record<string, unknown> | null;
};

export type SeoOpenGraphImage = {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
};

export type SeoStructuredBreadcrumb = {
  label: string;
  href: string;
};

export type SeoStructuredDataInput = {
  restaurant?: Pick<Restaurant, "id" | "name" | "slug" | "website" | "phone" | "email" | "address" | "logo" | "description" | "seoTitle" | "seoDescription" | "country" | "city"> | null;
  type: "restaurant" | "organization" | "product" | "faq" | "breadcrumb";
  title?: string;
  description?: string;
  url?: string;
  image?: string | null;
  breadcrumbs?: SeoStructuredBreadcrumb[];
  product?: {
    name: string;
    description?: string | null;
    image?: string | null;
    sku?: string | null;
    price?: number | null;
    currency?: string | null;
  };
  faqs?: Array<{
    question: string;
    answer: string;
  }>;
};

export type SeoMetadataInput = {
  title: string;
  description: string;
  canonicalPath?: string | null;
  locale: SupportedLocale;
  siteUrl: string;
  images?: SeoOpenGraphImage[] | null;
  keywords?: string[] | null;
  type?: "website" | "article";
  robots?: {
    index?: boolean;
    follow?: boolean;
    archive?: boolean;
    snippet?: boolean;
  } | null;
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>> | null;
};

export type SeoMetadataResult = Metadata & {
  canonicalUrl: string;
  structuredData: Array<Record<string, unknown>>;
};

export type SeoSitemapEntry = {
  url: string;
  lastModified?: Date | string;
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly";
  priority?: number;
};
