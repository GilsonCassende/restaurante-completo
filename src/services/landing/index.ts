import "server-only";

import { cache } from "react";
import { env } from "@/lib/env";
import { findRestaurantBySlug, listCategoriesByRestaurant, listProductsByRestaurant } from "@/prisma";
import { withTenantCache } from "@/lib/production";
import type { Category, Product, Restaurant } from "@/types";
import type {
  LandingContact,
  LandingGalleryItem,
  LandingHero,
  LandingProduct,
  LandingSeo,
  LandingStat,
  RestaurantLanding,
} from "./types";

export type {
  LandingAction,
  LandingCategory,
  LandingContact,
  LandingGalleryItem,
  LandingHero,
  LandingProduct,
  LandingSeo,
  LandingStat,
  RestaurantLanding,
} from "./types";

const DEFAULT_RESTAURANT_SLUG = env.NEXT_PUBLIC_RESTAURANT_SLUG ?? "demo-restaurant";
const FALLBACK_RESTAURANT_SLUGS = [DEFAULT_RESTAURANT_SLUG, "platform", "demo-restaurant"];
const FALLBACK_OPENING_HOURS = "12h às 23h";
const FALLBACK_OPENING_RANGE = {
  opens: "12:00",
  closes: "23:00",
};
const MONEY_FORMATTER = new Intl.NumberFormat("pt-AO", {
  style: "currency",
  currency: "AOA",
  maximumFractionDigits: 0,
});
const NUMBER_FORMATTER = new Intl.NumberFormat("pt-AO");
const DEFAULT_CUISINE_LABELS = ["Brasileira", "Contemporânea", "Internacional"];
const DEFAULT_PLACEHOLDER_IMAGE =
  "/landing/hero-dining.svg";

function normalizeString(value: string) {
  return value.trim().toLowerCase();
}

function normalizePhone(value: string | null | undefined) {
  return value ? value.replace(/\D/g, "") : "";
}

function toAbsoluteUrl(value: string | null | undefined) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value) || value.startsWith("data:")) {
    return value;
  }

  const baseUrl = env.NEXT_PUBLIC_APP_URL ?? "https://restaurantpro.local";
  return new URL(value, baseUrl).toString();
}

function formatCurrency(value: number) {
  return MONEY_FORMATTER.format(value);
}

function getSearchableDescription(restaurant: Restaurant, categories: Category[], products: Product[]) {
  if (restaurant.description?.trim()) return restaurant.description.trim();

  const categoryDescription = categories.find((category) => category.description?.trim())?.description?.trim();
  if (categoryDescription) return categoryDescription;

  const productDescription = products.find((product) => product.description?.trim())?.description?.trim();
  if (productDescription) return productDescription;

  return `${restaurant.name} entrega uma experiência gastronômica premium com cardápio atualizado e foco em hospitalidade.`;
}

function getRestaurantSlogan(restaurant: Restaurant, categories: Category[], products: Product[]) {
  if (restaurant.slogan?.trim()) return restaurant.slogan.trim();

  const product = products.find((item) => item.featured && item.description?.trim());
  if (product?.description) return product.description.trim();

  const category = categories.find((item) => item.description?.trim());
  if (category?.description) {
    return category.description.trim();
  }

  return `Sabores e serviço assinados por ${restaurant.name}.`;
}

function getRestaurantHours(restaurant: Restaurant) {
  if (restaurant.isOpen === false) return "Fechado no momento";

  return restaurant.openingHours?.trim() || (restaurant.active ? FALLBACK_OPENING_HOURS : "Consulte o horário");
}

function getWhatsappUrl(phone: string | null | undefined, message: string) {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) return null;

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

function getMapUrl(address: string | null | undefined) {
  if (!address?.trim()) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`;
}

function buildAddress(restaurant: Restaurant) {
  return (
    restaurant.address?.trim() ||
    [restaurant.street, restaurant.number, restaurant.neighborhood, restaurant.city, restaurant.state, restaurant.country]
      .filter(Boolean)
      .join(", ") ||
    null
  );
}

function selectRestaurantImages(categories: Category[], products: Product[]) {
  const seen = new Set<string>();
  const items: LandingGalleryItem[] = [];

  const pushItem = (src: string | null | undefined, alt: string, title: string) => {
    if (!src) return;
    const normalized = normalizeString(src);
    if (seen.has(normalized)) return;
    seen.add(normalized);
    items.push({
      id: `gallery-${items.length + 1}`,
      src,
      alt,
      title,
      placeholder: false,
    });
  };

  for (const product of products) {
    pushItem(product.image, product.name, product.description?.trim() || product.name);
  }

  for (const category of categories) {
    pushItem(category.image, category.name, category.description?.trim() || category.name);
  }

  while (items.length < 4) {
    items.push({
      id: `gallery-placeholder-${items.length + 1}`,
      src: null,
      alt: "Placeholder premium da galeria",
      title: `Espaço premium ${items.length + 1}`,
      placeholder: true,
    });
  }

  return items.slice(0, 4);
}

function buildLandingCategories(categories: Category[], products: Product[]) {
  const productCountByCategory = new Map<string, number>();

  for (const product of products) {
    productCountByCategory.set(product.categoryId, (productCountByCategory.get(product.categoryId) ?? 0) + 1);
  }

  return categories
    .filter((category) => category.active)
    .map((category) => ({
      ...category,
      productCount: productCountByCategory.get(category.id) ?? 0,
      badge: `${NUMBER_FORMATTER.format(productCountByCategory.get(category.id) ?? 0)} itens`,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

function buildLandingProducts(products: Product[], categories: Category[]) {
  const categoriesById = new Map(categories.map((category) => [category.id, category]));

  return products
    .filter((product) => product.active)
    .map((product) => {
      const category = categoriesById.get(product.categoryId);
      const displayPrice = formatCurrency(product.promotionalPrice ?? product.price);
      const displayOriginalPrice = product.promotionalPrice ? formatCurrency(product.price) : null;
      const isPromotion = product.promotionalPrice !== null;

      return {
        ...product,
        categoryName: category?.name ?? "Categoria",
        categorySlug: category?.slug ?? "categoria",
        badge: product.featured ? "Destaque" : isPromotion ? "Promoção" : "Menu",
        isPromotion,
        displayPrice,
        displayOriginalPrice,
        image: product.image ?? null,
      };
    })
    .sort((a, b) => Number(b.featured) - Number(a.featured) || Number(b.isPromotion) - Number(a.isPromotion) || a.name.localeCompare(b.name));
}

function buildLandingStats(categories: Category[], products: Product[]) {
  const featuredCount = products.filter((product) => product.active && product.featured).length;
  const promotionCount = products.filter((product) => product.active && product.promotionalPrice !== null).length;

  return [
    { label: "Categorias ativas", value: categories.filter((category) => category.active).length, suffix: "+" },
    { label: "Produtos ativos", value: products.filter((product) => product.active).length, suffix: "+" },
    { label: "Destaques", value: featuredCount, suffix: "+" },
    { label: "Promoções", value: promotionCount, suffix: "+" },
  ] satisfies LandingStat[];
}

function buildHero(restaurant: Restaurant, categories: Category[], products: Product[], contact: LandingContact, featuredProducts: LandingProduct[]): LandingHero {
  const headline = restaurant.name;
  const slogan = getRestaurantSlogan(restaurant, categories, products);
  const description = getSearchableDescription(restaurant, categories, products);
  const heroBanner = featuredProducts.find((product) => product.image)?.image ?? categories.find((category) => category.image)?.image ?? null;
  const firstFact = categories.find((category) => category.active);

  return {
    title: headline,
    slogan,
    description,
    logo: restaurant.logo,
    banner: heroBanner ?? DEFAULT_PLACEHOLDER_IMAGE,
    primaryAction: {
      label: contact.whatsappUrl ? "Pedir no WhatsApp" : "Ver cardápio",
      href: contact.whatsappUrl ?? "#cardapio",
      external: Boolean(contact.whatsappUrl),
    },
    secondaryAction: {
      label: "Reservar mesa",
      href: contact.phone ? `tel:${normalizePhone(contact.phone)}` : "#localizacao",
      external: Boolean(contact.phone),
    },
    facts: [
      {
        label: "Menu ativo",
        value: `${NUMBER_FORMATTER.format(products.filter((product) => product.active).length)} pratos`,
      },
      {
        label: "Horário",
        value: getRestaurantHours(restaurant),
      },
      {
        label: "Localização",
        value: restaurant.address?.trim() || "Consulte o endereço",
      },
      {
        label: "Categoria em destaque",
        value: firstFact?.name ?? "Cardápio premium",
      },
    ],
  };
}

function buildContact(restaurant: Restaurant): LandingContact {
  const whatsappMessage = `Olá, gostaria de saber mais sobre ${restaurant.name}.`;
  const address = buildAddress(restaurant);

  return {
    phone: restaurant.phone,
    whatsappUrl: getWhatsappUrl(restaurant.phone, whatsappMessage),
    address,
    email: restaurant.email,
    hours: getRestaurantHours(restaurant),
    mapUrl: getMapUrl(address),
    footerNote: `${restaurant.name} atende com foco em hospitalidade premium e experiência consistente.`,
  };
}

function buildSeo(restaurant: Restaurant, categories: Category[], products: Product[], heroImage: string | null): LandingSeo {
  const description = restaurant.seoDescription?.trim() || getSearchableDescription(restaurant, categories, products);
  const image = toAbsoluteUrl(heroImage ?? DEFAULT_PLACEHOLDER_IMAGE);
  const productPrices = products.filter((product) => product.active).map((product) => product.promotionalPrice ?? product.price);
  const avgPrice = productPrices.length
    ? productPrices.reduce((sum, price) => sum + price, 0) / productPrices.length
    : 0;
  const priceRange =
    avgPrice >= 30000 ? "$$$" : avgPrice >= 15000 ? "$$" : avgPrice > 0 ? "$" : "$$";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: restaurant.name,
    image: image ? [image] : undefined,
    servesCuisine: categories.filter((category) => category.active).map((category) => category.name).slice(0, 6).concat(DEFAULT_CUISINE_LABELS.slice(0, 3)),
    priceRange,
    telephone: restaurant.phone ?? undefined,
    address: restaurant.address
      ? {
          "@type": "PostalAddress",
          streetAddress: restaurant.address,
          addressCountry: "AO",
        }
      : undefined,
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: FALLBACK_OPENING_RANGE.opens,
        closes: FALLBACK_OPENING_RANGE.closes,
      },
    ],
  };

  return {
    title: restaurant.seoTitle?.trim() || `${restaurant.name} | RestaurantPro`,
    description,
    image,
    keywords: restaurant.seoKeywords
      ? restaurant.seoKeywords
          .split(",")
          .map((keyword) => keyword.trim())
          .filter(Boolean)
      : [
          restaurant.name,
          restaurant.slug,
          "restaurante",
          "cardápio digital",
          "landing premium",
          ...categories.filter((category) => category.active).map((category) => category.name),
        ],
    jsonLd,
  };
}

async function loadLanding(restaurantSlug?: string): Promise<RestaurantLanding> {
  const slugCandidates = [
    restaurantSlug?.trim(),
    DEFAULT_RESTAURANT_SLUG,
    ...FALLBACK_RESTAURANT_SLUGS,
  ].filter((value, index, array): value is string => Boolean(value) && array.indexOf(value) === index);

  let restaurant: Restaurant | null = null;
  for (const slug of slugCandidates) {
    restaurant = await findRestaurantBySlug(slug);
    if (restaurant) break;
  }

  if (!restaurant) {
    throw new Error("Restaurante não encontrado para a landing.");
  }

  const [categories, products] = await Promise.all([
    listCategoriesByRestaurant(restaurant.id),
    listProductsByRestaurant(restaurant.id),
  ]);

  const activeCategories = categories.filter((category) => category.active);
  const activeProducts = products.filter((product) => product.active);
  const featuredCategories = buildLandingCategories(activeCategories, activeProducts);
  const landingProducts = buildLandingProducts(activeProducts, activeCategories);
  const featuredProducts = landingProducts.filter((product) => product.featured).slice(0, 6);
  const promotionalProducts = landingProducts.filter((product) => product.isPromotion).slice(0, 6);
  const stats = buildLandingStats(activeCategories, activeProducts);
  const contact = buildContact(restaurant);
  const gallery = selectRestaurantImages(activeCategories, activeProducts);
  const hero = buildHero(restaurant, activeCategories, activeProducts, contact, featuredProducts);
  const seo = buildSeo(restaurant, activeCategories, activeProducts, hero.banner);

  return {
    restaurant,
    hero,
    featuredCategories,
    featuredProducts,
    promotionalProducts,
    stats,
    gallery,
    contact,
    seo,
    about: {
      title: `Sobre ${restaurant.name}`,
      description: getSearchableDescription(restaurant, activeCategories, activeProducts),
      highlights: [
        {
          title: "Menu ativo",
          description: `${NUMBER_FORMATTER.format(activeProducts.length)} pratos publicados para o cliente escolher com rapidez.`,
        },
        {
          title: "Categorias organizadas",
          description: `${NUMBER_FORMATTER.format(activeCategories.length)} categorias para navegar sem fricção e com clareza visual.`,
        },
        {
          title: "Ofertas automáticas",
          description: `${NUMBER_FORMATTER.format(promotionalProducts.length)} produtos com preço promocional são destacados automaticamente.`,
        },
      ],
    },
  };
}

const cachedLoadLanding = withTenantCache("landing", loadLanding, {
  tenantIndex: 0,
  keyPrefix: "restaurant-landing",
  revalidate: 300,
});

export const getRestaurantLanding = cache(async (restaurantSlug?: string) => cachedLoadLanding(restaurantSlug ?? DEFAULT_RESTAURANT_SLUG));

export async function getFeaturedProducts(restaurantSlug?: string) {
  const landing = await getRestaurantLanding(restaurantSlug);
  return landing.featuredProducts;
}

export async function getFeaturedCategories(restaurantSlug?: string) {
  const landing = await getRestaurantLanding(restaurantSlug);
  return landing.featuredCategories;
}

export async function getRestaurantStats(restaurantSlug?: string) {
  const landing = await getRestaurantLanding(restaurantSlug);
  return landing.stats;
}

export async function getRestaurantGallery(restaurantSlug?: string) {
  const landing = await getRestaurantLanding(restaurantSlug);
  return landing.gallery;
}

export async function getRestaurantContact(restaurantSlug?: string) {
  const landing = await getRestaurantLanding(restaurantSlug);
  return landing.contact;
}

export function getLandingSeo(landing: RestaurantLanding) {
  return landing.seo;
}
