import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import { buildQrCodeDataUrl } from "@/lib/qr";
import { ROLES } from "@/permissions";
import type { Category, Product, Restaurant, Role, Table, User } from "@/types";

export const DEV_LOGIN_PASSWORD = "Password123!";

function now() {
  return new Date();
}

function createId() {
  return randomUUID().replace(/-/g, "");
}

function createRestaurant(data: {
  id?: string;
  name: string;
  slug: string;
  logo?: string | null;
  favicon?: string | null;
  banner?: string | null;
  coverImage?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  backgroundColor?: string | null;
  surfaceColor?: string | null;
  textColor?: string | null;
  successColor?: string | null;
  warningColor?: string | null;
  errorColor?: string | null;
  fontFamily?: string | null;
  borderRadius?: string | null;
  buttonStyle?: string | null;
  cardStyle?: string | null;
  heroStyle?: string | null;
  footerStyle?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  youtube?: string | null;
  linkedin?: string | null;
  website?: string | null;
  phone?: string | null;
  supportPhone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  slogan?: string | null;
  history?: string | null;
  mission?: string | null;
  description?: string | null;
  state?: string | null;
  neighborhood?: string | null;
  street?: string | null;
  number?: string | null;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  openingHours?: string | null;
  timezone?: string | null;
  currency?: string | null;
  language?: string | null;
  country?: string | null;
  city?: string | null;
  weeklyHours?: Restaurant["weeklyHours"];
  holidays?: Restaurant["holidays"];
  isOpen?: boolean | null;
  minimumOrderAmount?: number | null;
  deliveryFee?: number | null;
  deliveryRadiusKm?: number | null;
  averagePreparationTime?: number | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  ogImage?: string | null;
  twitterTitle?: string | null;
  twitterDescription?: string | null;
  twitterImage?: string | null;
  integrations?: Restaurant["integrations"];
  subscriptionPlan: string;
  active?: boolean;
}): Restaurant {
  const createdAt = now();
  return {
    id: data.id ?? createId(),
    name: data.name,
    slug: data.slug,
    logo: data.logo ?? null,
    favicon: data.favicon ?? null,
    banner: data.banner ?? null,
    coverImage: data.coverImage ?? null,
    primaryColor: data.primaryColor ?? null,
    secondaryColor: data.secondaryColor ?? null,
    accentColor: data.accentColor ?? null,
    backgroundColor: data.backgroundColor ?? null,
    surfaceColor: data.surfaceColor ?? null,
    textColor: data.textColor ?? null,
    successColor: data.successColor ?? null,
    warningColor: data.warningColor ?? null,
    errorColor: data.errorColor ?? null,
    fontFamily: data.fontFamily ?? null,
    borderRadius: data.borderRadius ?? null,
    buttonStyle: data.buttonStyle ?? null,
    cardStyle: data.cardStyle ?? null,
    heroStyle: data.heroStyle ?? null,
    footerStyle: data.footerStyle ?? null,
    instagram: data.instagram ?? null,
    facebook: data.facebook ?? null,
    tiktok: data.tiktok ?? null,
    youtube: data.youtube ?? null,
    linkedin: data.linkedin ?? null,
    website: data.website ?? null,
    phone: data.phone ?? null,
    supportPhone: data.supportPhone ?? null,
    whatsapp: data.whatsapp ?? null,
    email: data.email ?? null,
    address: data.address ?? null,
    slogan: data.slogan ?? null,
    history: data.history ?? null,
    mission: data.mission ?? null,
    description: data.description ?? null,
    state: data.state ?? null,
    neighborhood: data.neighborhood ?? null,
    street: data.street ?? null,
    number: data.number ?? null,
    postalCode: data.postalCode ?? null,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    openingHours: data.openingHours ?? null,
    timezone: data.timezone ?? null,
    currency: data.currency ?? null,
    language: data.language ?? null,
    country: data.country ?? null,
    city: data.city ?? null,
    weeklyHours: data.weeklyHours ?? null,
    holidays: data.holidays ?? null,
    isOpen: data.isOpen ?? true,
    minimumOrderAmount: data.minimumOrderAmount ?? null,
    deliveryFee: data.deliveryFee ?? null,
    deliveryRadiusKm: data.deliveryRadiusKm ?? null,
    averagePreparationTime: data.averagePreparationTime ?? null,
    seoTitle: data.seoTitle ?? null,
    seoDescription: data.seoDescription ?? null,
    seoKeywords: data.seoKeywords ?? null,
    ogImage: data.ogImage ?? null,
    twitterTitle: data.twitterTitle ?? null,
    twitterDescription: data.twitterDescription ?? null,
    twitterImage: data.twitterImage ?? null,
    integrations: data.integrations ?? null,
    subscriptionPlan: data.subscriptionPlan,
    active: data.active ?? true,
    createdAt,
    updatedAt: createdAt,
  };
}

function createCategory(data: {
  id?: string;
  restaurantId: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  active?: boolean;
  sortOrder?: number;
}): Category {
  const createdAt = now();
  return {
    id: data.id ?? createId(),
    restaurantId: data.restaurantId,
    name: data.name,
    slug: data.slug,
    description: data.description ?? null,
    image: data.image ?? null,
    active: data.active ?? true,
    sortOrder: data.sortOrder ?? 0,
    createdAt,
    updatedAt: createdAt,
  };
}

function createProduct(data: {
  id?: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  price: number;
  promotionalPrice?: number | null;
  active?: boolean;
  featured?: boolean;
  preparationTime?: number | null;
}): Product {
  const createdAt = now();
  return {
    id: data.id ?? createId(),
    restaurantId: data.restaurantId,
    categoryId: data.categoryId,
    name: data.name,
    slug: data.slug,
    description: data.description ?? null,
    image: data.image ?? null,
    price: data.price,
    promotionalPrice: data.promotionalPrice ?? null,
    active: data.active ?? true,
    featured: data.featured ?? false,
    preparationTime: data.preparationTime ?? null,
    createdAt,
    updatedAt: createdAt,
  };
}

function createTable(data: {
  id?: string;
  restaurantId: string;
  number: number;
  capacity?: number;
  qrCode: string;
  active?: boolean;
}): Table {
  return {
    id: data.id ?? createId(),
    restaurantId: data.restaurantId,
    number: data.number,
    capacity: data.capacity ?? 4,
    qrCode: data.qrCode,
    active: data.active ?? true,
  };
}

function createUser(data: {
  id?: string;
  restaurantId: string;
  name: string;
  email: string;
  password: string;
  image?: string | null;
  role: Role;
  active?: boolean;
}): User {
  const createdAt = now();
  return {
    id: data.id ?? createId(),
    restaurantId: data.restaurantId,
    name: data.name,
    email: data.email.toLowerCase(),
    password: data.password,
    image: data.image ?? null,
    role: data.role,
    active: data.active ?? true,
    createdAt,
    updatedAt: createdAt,
  };
}

export function buildDevelopmentSeed() {
  const hashedPassword = bcrypt.hashSync(DEV_LOGIN_PASSWORD, 10);

  const platformRestaurant = createRestaurant({
    name: "RestaurantPro Platform",
    slug: "platform",
    subscriptionPlan: "ENTERPRISE",
    email: "platform@restaurantpro.local",
    primaryColor: "#111827",
    secondaryColor: "#334155",
    accentColor: "#f59e0b",
    backgroundColor: "#f8fafc",
    surfaceColor: "#ffffff",
    textColor: "#0f172a",
    fontFamily: "inter",
    borderRadius: "xl",
    buttonStyle: "solid",
    cardStyle: "glass",
    heroStyle: "split",
    footerStyle: "rich",
    slogan: "White label de luxo para restaurantes modernos.",
    history: "A plataforma RestaurantPro foi desenhada para escalar operações com identidade própria.",
    mission: "Permitir que cada restaurante administre sua marca, operação e crescimento sem código.",
    description: "Ambiente base da plataforma, usado para validar identidade visual e fluxos administrativos.",
    state: "Luanda",
    neighborhood: "Centro",
    street: "Avenida Principal",
    number: "100",
    postalCode: "0000-000",
    latitude: -8.8368,
    longitude: 13.2343,
    weeklyHours: [
      { day: "monday", open: "12:00", close: "23:00", closed: false },
      { day: "tuesday", open: "12:00", close: "23:00", closed: false },
      { day: "wednesday", open: "12:00", close: "23:00", closed: false },
      { day: "thursday", open: "12:00", close: "23:00", closed: false },
      { day: "friday", open: "12:00", close: "23:30", closed: false },
      { day: "saturday", open: "12:00", close: "23:30", closed: false },
      { day: "sunday", open: "", close: "", closed: true },
    ],
    holidays: [
      { date: "2026-12-25", label: "Natal", closed: true },
      { date: "2026-01-01", label: "Ano novo", closed: true },
    ],
    isOpen: true,
    minimumOrderAmount: 15000,
    deliveryFee: 1200,
    deliveryRadiusKm: 8,
    averagePreparationTime: 25,
    seoTitle: "RestaurantPro Platform",
    seoDescription: "Ambiente administrativo white label do RestaurantPro.",
    seoKeywords: "restaurantpro, white label, dashboard",
    ogImage: null,
    twitterTitle: "RestaurantPro Platform",
    twitterDescription: "White label profissional para restaurantes.",
    twitterImage: null,
    integrations: {
      cloudinary: { enabled: false, cloudName: "", uploadPreset: "" },
      googleMaps: { enabled: false, apiKey: "", placeId: "" },
      googleAnalytics: { enabled: false, measurementId: "" },
      metaPixel: { enabled: false, pixelId: "" },
      whatsapp: { enabled: true, phone: "+244900000000" },
    },
    active: true,
  });

  const restaurant = createRestaurant({
    name: "Demo Restaurant",
    slug: "demo-restaurant",
    subscriptionPlan: "PRO",
    email: "demo@restaurantpro.local",
    phone: "+244900000000",
    supportPhone: "+244900000001",
    whatsapp: "+244900000000",
    address: "Luanda",
    city: "Luanda",
    country: "AO",
    currency: "AOA",
    language: "pt",
    timezone: "Africa/Luanda",
    openingHours: "12h às 23h",
    website: "https://demo-restaurant.restaurantpro.local",
    instagram: "https://instagram.com/demo.restaurant",
    facebook: "https://facebook.com/demo.restaurant",
    tiktok: "https://tiktok.com/@demo.restaurant",
    youtube: "https://youtube.com/@demo.restaurant",
    linkedin: "https://linkedin.com/company/demo-restaurant",
    primaryColor: "#0f766e",
    secondaryColor: "#115e59",
    accentColor: "#f59e0b",
    backgroundColor: "#f8fafc",
    surfaceColor: "#ffffff",
    textColor: "#0f172a",
    successColor: "#16a34a",
    warningColor: "#d97706",
    errorColor: "#dc2626",
    fontFamily: "plus-jakarta",
    slogan: "Sabores autênticos com uma experiência premium.",
    history: "Uma casa pensada para unir hospitalidade, tecnologia e conversão.",
    mission: "Servir refeições memoráveis com operação clara e rápida.",
    description: "Restaurante demo utilizado para validar o comportamento white label.",
    state: "Luanda",
    neighborhood: "Mussulo",
    street: "Rua da Praia",
    number: "42",
    postalCode: "1000-100",
    latitude: -8.7929,
    longitude: 13.4165,
    weeklyHours: [
      { day: "monday", open: "11:30", close: "22:30", closed: false },
      { day: "tuesday", open: "11:30", close: "22:30", closed: false },
      { day: "wednesday", open: "11:30", close: "22:30", closed: false },
      { day: "thursday", open: "11:30", close: "22:30", closed: false },
      { day: "friday", open: "11:30", close: "23:30", closed: false },
      { day: "saturday", open: "11:00", close: "23:30", closed: false },
      { day: "sunday", open: "11:00", close: "22:00", closed: false },
    ],
    holidays: [{ date: "2026-12-25", label: "Natal", closed: true }],
    isOpen: true,
    minimumOrderAmount: 12000,
    deliveryFee: 1000,
    deliveryRadiusKm: 6,
    averagePreparationTime: 22,
    seoTitle: "Demo Restaurant | RestaurantPro",
    seoDescription: "Exemplo de restaurante white label com dados reais.",
    seoKeywords: "demo restaurant, restaurantpro, delivery",
    ogImage: null,
    twitterTitle: "Demo Restaurant",
    twitterDescription: "Experiência premium no RestaurantPro.",
    twitterImage: null,
    integrations: {
      cloudinary: { enabled: false, cloudName: "", uploadPreset: "" },
      googleMaps: { enabled: false, apiKey: "", placeId: "" },
      googleAnalytics: { enabled: false, measurementId: "" },
      metaPixel: { enabled: false, pixelId: "" },
      whatsapp: { enabled: true, phone: "+244900000000" },
    },
    borderRadius: "2xl",
    buttonStyle: "gradient",
    cardStyle: "glass",
    heroStyle: "editorial",
    footerStyle: "rich",
    active: true,
  });

  const users = [
    createUser({
      restaurantId: platformRestaurant.id,
      name: "Super Admin",
      email: "superadmin@restaurantpro.local",
      password: hashedPassword,
      role: ROLES.SUPER_ADMIN,
    }),
    createUser({
      restaurantId: restaurant.id,
      name: "Owner",
      email: "owner@restaurantpro.local",
      password: hashedPassword,
      role: ROLES.OWNER,
    }),
    createUser({
      restaurantId: restaurant.id,
      name: "Manager",
      email: "manager@restaurantpro.local",
      password: hashedPassword,
      role: ROLES.MANAGER,
    }),
    createUser({
      restaurantId: restaurant.id,
      name: "Staff",
      email: "staff@restaurantpro.local",
      password: hashedPassword,
      role: ROLES.STAFF,
    }),
  ];

  const categories = [
    createCategory({
      restaurantId: restaurant.id,
      name: "Entradas",
      slug: "entradas",
      description: "Pratos leves para abrir o apetite.",
      sortOrder: 1,
    }),
    createCategory({
      restaurantId: restaurant.id,
      name: "Pratos Principais",
      slug: "pratos-principais",
      description: "Itens centrais do menu.",
      sortOrder: 2,
    }),
  ];

  const products = [
    createProduct({
      restaurantId: restaurant.id,
      categoryId: categories[0].id,
      name: "Pão de alho artesanal",
      slug: "pao-de-alho-artesanal",
      description: "Crocante por fora e macio por dentro.",
      price: 8500,
      promotionalPrice: 7500,
      featured: true,
      preparationTime: 12,
    }),
    createProduct({
      restaurantId: restaurant.id,
      categoryId: categories[1].id,
      name: "Frango grelhado com legumes",
      slug: "frango-grelhado-com-legumes",
      description: "Servido com arroz e legumes frescos.",
      price: 14500,
      preparationTime: 22,
    }),
  ];

  const tables = [
    createTable({
      restaurantId: restaurant.id,
      number: 1,
      qrCode: buildQrCodeDataUrl(`${restaurant.id}:1`),
    }),
    createTable({
      restaurantId: restaurant.id,
      number: 2,
      qrCode: buildQrCodeDataUrl(`${restaurant.id}:2`),
    }),
  ];

  return {
    platformRestaurant,
    restaurant,
    users,
    categories,
    products,
    tables,
  };
}
