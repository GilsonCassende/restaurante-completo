import type { Category, Product, Restaurant } from "@/types";

export type LandingAction = {
  label: string;
  href: string;
  external?: boolean;
};

export type LandingStat = {
  label: string;
  value: number;
  suffix?: string;
  helper?: string;
};

export type LandingHero = {
  title: string;
  slogan: string;
  description: string;
  logo: string | null;
  banner: string | null;
  primaryAction: LandingAction;
  secondaryAction: LandingAction;
  facts: Array<{
    label: string;
    value: string;
  }>;
};

export type LandingCategory = Category & {
  productCount: number;
  badge: string;
};

export type LandingProduct = Product & {
  categoryName: string;
  categorySlug: string;
  badge: string;
  isPromotion: boolean;
  displayPrice: string;
  displayOriginalPrice: string | null;
  image: string | null;
};

export type LandingGalleryItem = {
  id: string;
  title: string;
  alt: string;
  src: string | null;
  placeholder: boolean;
};

export type LandingContact = {
  phone: string | null;
  whatsappUrl: string | null;
  address: string | null;
  email: string | null;
  hours: string;
  mapUrl: string | null;
  footerNote: string;
};

export type LandingSeo = {
  title: string;
  description: string;
  image: string | null;
  keywords: string[];
  jsonLd: Record<string, unknown>;
};

export type RestaurantLanding = {
  restaurant: Restaurant;
  hero: LandingHero;
  featuredCategories: LandingCategory[];
  featuredProducts: LandingProduct[];
  promotionalProducts: LandingProduct[];
  stats: LandingStat[];
  gallery: LandingGalleryItem[];
  contact: LandingContact;
  seo: LandingSeo;
  about: {
    title: string;
    description: string;
    highlights: Array<{
      title: string;
      description: string;
    }>;
  };
};
