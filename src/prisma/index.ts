import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { env } from "@/lib/env";
import { ROLES } from "@/permissions";
import { prisma } from "./client";
import { buildDevelopmentSeed } from "./seed";
import type {
  Category,
  Customer,
  Order,
  OrderItem,
  OrderStatus,
  OrderWithDetails,
  Product,
  Restaurant,
  Reservation,
  ReservationHistory,
  ReservationHistoryAction,
  ReservationStatus,
  ReservationWithDetails,
  Table,
  User,
} from "@/types";

type AuthRepository = {
  ensureDevelopmentSeed: () => Promise<void>;
  findUserByEmail: (email: string) => Promise<User | null>;
  findUserById: (id: string) => Promise<User | null>;
  findRestaurantById: (id: string) => Promise<Restaurant | null>;
  findRestaurantBySlug: (slug: string) => Promise<Restaurant | null>;
  updateRestaurantBranding: (id: string, data: RestaurantBrandingUpdateInput) => Promise<Restaurant | null>;
  updateRestaurantSettings: (id: string, data: RestaurantSettingsUpdateInput) => Promise<Restaurant | null>;
};

type CategoryCreateInput = Omit<Category, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

type CategoryUpdateInput = Partial<Omit<CategoryCreateInput, "restaurantId">>;

type ProductCreateInput = Omit<Product, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

type ProductUpdateInput = Partial<Omit<ProductCreateInput, "restaurantId">>;

type TableCreateInput = Omit<Table, "id" | "capacity"> & {
  capacity?: number;
  id?: string;
};
type TableUpdateInput = Partial<Omit<TableCreateInput, "restaurantId">>;

type CustomerCreateInput = Omit<
  Customer,
  "id" | "createdAt" | "updatedAt" | "birthday" | "city" | "country" | "status" | "tags" | "lastVisitAt" | "totalSpent" | "averageTicket" | "frequency" | "notes"
> & {
  birthday?: Date | null;
  city?: string | null;
  country?: string | null;
  status?: Customer["status"];
  tags?: string[] | null;
  lastVisitAt?: Date | null;
  totalSpent?: number;
  averageTicket?: number;
  frequency?: number;
  notes?: string | null;
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

type ReservationCreateInput = Omit<Reservation, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  history?: Array<{
    id?: string;
    action: ReservationHistoryAction;
    actorUserId?: string | null;
    notes?: string | null;
    metadata?: unknown | null;
    createdAt?: Date;
  }>;
};

type ReservationUpdateInput = Partial<
  Omit<ReservationCreateInput, "restaurantId" | "history">
> & {
  history?: Array<{
    action: ReservationHistoryAction;
    actorUserId?: string | null;
    notes?: string | null;
    metadata?: unknown | null;
  }>;
};

type OrderItemCreateInput = Omit<OrderItem, "id" | "orderId"> & {
  id?: string;
};

type OrderCreateInput = Omit<Order, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  items: OrderItemCreateInput[];
};

type RestaurantBrandingUpdateInput = Partial<
  Omit<Restaurant, "id" | "slug" | "createdAt" | "updatedAt">
>;

type RestaurantSettingsUpdateInput = Partial<
  Omit<Restaurant, "id" | "slug" | "createdAt" | "updatedAt">
>;

type CatalogRepository = {
  listCategoriesByRestaurant: (restaurantId: string) => Promise<Category[]>;
  findCategoryById: (id: string, restaurantId: string) => Promise<Category | null>;
  createCategory: (data: CategoryCreateInput) => Promise<Category>;
  updateCategory: (id: string, restaurantId: string, data: CategoryUpdateInput) => Promise<Category | null>;
  deleteCategory: (id: string, restaurantId: string) => Promise<boolean>;
  listProductsByRestaurant: (restaurantId: string) => Promise<Product[]>;
  findProductById: (id: string, restaurantId: string) => Promise<Product | null>;
  createProduct: (data: ProductCreateInput) => Promise<Product>;
  updateProduct: (id: string, restaurantId: string, data: ProductUpdateInput) => Promise<Product | null>;
  deleteProduct: (id: string, restaurantId: string) => Promise<boolean>;
  listTablesByRestaurant: (restaurantId: string) => Promise<Table[]>;
  findTableById: (id: string, restaurantId: string) => Promise<Table | null>;
  createTable: (data: TableCreateInput) => Promise<Table>;
  updateTable: (id: string, restaurantId: string, data: TableUpdateInput) => Promise<Table | null>;
  deleteTable: (id: string, restaurantId: string) => Promise<boolean>;
  listOrdersByRestaurant: (restaurantId: string) => Promise<OrderWithDetails[]>;
  findOrderById: (id: string, restaurantId: string) => Promise<OrderWithDetails | null>;
  createOrder: (data: OrderCreateInput) => Promise<OrderWithDetails>;
  updateOrderStatus: (id: string, restaurantId: string, status: OrderStatus) => Promise<OrderWithDetails | null>;
  listCustomersByRestaurant: (restaurantId: string) => Promise<Customer[]>;
  findCustomerById: (id: string, restaurantId: string) => Promise<Customer | null>;
  findCustomerByContact: (restaurantId: string, phone: string, email?: string | null) => Promise<Customer | null>;
  upsertCustomer: (data: CustomerCreateInput) => Promise<Customer>;
  listReservationsByRestaurant: (restaurantId: string) => Promise<ReservationWithDetails[]>;
  listReservationsByDate: (restaurantId: string, date: string) => Promise<ReservationWithDetails[]>;
  findReservationById: (id: string, restaurantId: string) => Promise<ReservationWithDetails | null>;
  createReservation: (data: ReservationCreateInput) => Promise<ReservationWithDetails>;
  updateReservation: (id: string, restaurantId: string, data: ReservationUpdateInput) => Promise<ReservationWithDetails | null>;
  updateReservationStatus: (id: string, restaurantId: string, status: ReservationStatus) => Promise<ReservationWithDetails | null>;
  addReservationHistory: (
    reservationId: string,
    restaurantId: string,
    entry: {
      action: ReservationHistoryAction;
      actorUserId?: string | null;
      notes?: string | null;
      metadata?: unknown;
    }
  ) => Promise<ReservationHistory | null>;
};

function now() {
  return new Date();
}

function normalizeEmail(email: string) {
  return email.toLowerCase().trim();
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

function normalizeRestaurantRecord(restaurant: unknown): Restaurant {
  const record = restaurant as Record<string, unknown>;
  const weeklyHours = Array.isArray(record.weeklyHours) ? (record.weeklyHours as Restaurant["weeklyHours"]) : null;
  const holidays = Array.isArray(record.holidays) ? (record.holidays as Restaurant["holidays"]) : null;
  const integrations =
    record.integrations && typeof record.integrations === "object" && !Array.isArray(record.integrations)
      ? (record.integrations as Restaurant["integrations"])
      : null;

  return {
    ...(record as Restaurant),
    weeklyHours,
    holidays,
    integrations,
  };
}

function normalizeCustomerTags(tags: unknown): string[] | null {
  if (!Array.isArray(tags)) return null;
  return tags.filter((tag): tag is string => typeof tag === "string");
}

function normalizeCustomerRecord(customer: unknown): Customer {
  const record = customer as Record<string, unknown>;
  return {
    ...(record as Customer),
    birthday: record.birthday instanceof Date ? record.birthday : record.birthday ? new Date(String(record.birthday)) : null,
    city: typeof record.city === "string" ? record.city : null,
    country: typeof record.country === "string" ? record.country : null,
    status: (typeof record.status === "string" ? record.status : "ACTIVE") as Customer["status"],
    tags: normalizeCustomerTags(record.tags),
    lastVisitAt: record.lastVisitAt instanceof Date ? record.lastVisitAt : record.lastVisitAt ? new Date(String(record.lastVisitAt)) : null,
    totalSpent: typeof record.totalSpent === "number" ? record.totalSpent : 0,
    averageTicket: typeof record.averageTicket === "number" ? record.averageTicket : 0,
    frequency: typeof record.frequency === "number" ? record.frequency : 0,
    notes: typeof record.notes === "string" ? record.notes : null,
  };
}

type ReservationHistoryRecordLike = {
  id: string;
  reservationId: string;
  restaurantId: string;
  actorUserId?: string | null;
  action: ReservationHistoryAction;
  notes?: string | null;
  metadata?: unknown;
  createdAt: Date;
};

type ReservationRecordLike = Reservation & {
  table: Table;
  customer: unknown | null;
  history: ReservationHistoryRecordLike[];
};

function normalizeReservationHistoryRecord(history: ReservationHistoryRecordLike): ReservationHistory {
  return {
    id: history.id,
    reservationId: history.reservationId,
    restaurantId: history.restaurantId,
    actorUserId: history.actorUserId ?? null,
    action: history.action,
    notes: history.notes ?? null,
    metadata: history.metadata ?? null,
    createdAt: history.createdAt,
  };
}

function normalizeReservationRecord(reservation: ReservationRecordLike): ReservationWithDetails {
  return {
    ...reservation,
    table: reservation.table,
    customer: reservation.customer ? normalizeCustomerRecord(reservation.customer) : null,
    history: Array.isArray(reservation.history) ? reservation.history.map(normalizeReservationHistoryRecord) : [],
  };
}

class MemoryDataRepository implements AuthRepository, CatalogRepository {
  private seeded = false;
  private restaurants = new Map<string, Restaurant>();
  private users = new Map<string, User>();
  private categories = new Map<string, Category>();
  private products = new Map<string, Product>();
  private tables = new Map<string, Table>();
  private customers = new Map<string, Customer>();
  private orders = new Map<string, Order>();
  private orderItems = new Map<string, OrderItem>();
  private reservations = new Map<string, Reservation>();
  private reservationHistory = new Map<string, ReservationHistory>();

  async ensureDevelopmentSeed() {
    if (this.seeded) return;

    const seed = buildDevelopmentSeed();
    this.restaurants.set(seed.platformRestaurant.id, seed.platformRestaurant);
    this.restaurants.set(seed.restaurant.id, seed.restaurant);
    for (const user of seed.users) {
      this.users.set(user.id, user);
    }
    for (const category of seed.categories ?? []) {
      this.categories.set(category.id, category);
    }
    for (const product of seed.products ?? []) {
      this.products.set(product.id, product);
    }
    for (const table of seed.tables ?? []) {
      this.tables.set(table.id, table);
    }

    this.seeded = true;
  }

  async findUserByEmail(email: string) {
    await this.ensureDevelopmentSeed();
    const target = normalizeEmail(email);
    return Array.from(this.users.values()).find((user) => user.email === target) ?? null;
  }

  async findUserById(id: string) {
    await this.ensureDevelopmentSeed();
    return this.users.get(id) ?? null;
  }

  async findRestaurantById(id: string) {
    await this.ensureDevelopmentSeed();
    return this.restaurants.get(id) ?? null;
  }

  async findRestaurantBySlug(slug: string) {
    await this.ensureDevelopmentSeed();
    return Array.from(this.restaurants.values()).find((restaurant) => restaurant.slug === slug) ?? null;
  }

  async updateRestaurantBranding(id: string, data: RestaurantBrandingUpdateInput) {
    await this.ensureDevelopmentSeed();
    const current = await this.findRestaurantById(id);
    if (!current) return null;
    const updated: Restaurant = {
      ...current,
      ...data,
      logo: data.logo ?? current.logo,
      favicon: data.favicon ?? current.favicon,
      banner: data.banner ?? current.banner,
      coverImage: data.coverImage ?? current.coverImage,
      primaryColor: data.primaryColor ?? current.primaryColor,
      secondaryColor: data.secondaryColor ?? current.secondaryColor,
      accentColor: data.accentColor ?? current.accentColor,
      backgroundColor: data.backgroundColor ?? current.backgroundColor,
      surfaceColor: data.surfaceColor ?? current.surfaceColor,
      textColor: data.textColor ?? current.textColor,
      successColor: data.successColor ?? current.successColor,
      warningColor: data.warningColor ?? current.warningColor,
      errorColor: data.errorColor ?? current.errorColor,
      fontFamily: data.fontFamily ?? current.fontFamily,
      borderRadius: data.borderRadius ?? current.borderRadius,
      buttonStyle: data.buttonStyle ?? current.buttonStyle,
      cardStyle: data.cardStyle ?? current.cardStyle,
      heroStyle: data.heroStyle ?? current.heroStyle,
      footerStyle: data.footerStyle ?? current.footerStyle,
      instagram: data.instagram ?? current.instagram,
      facebook: data.facebook ?? current.facebook,
      tiktok: data.tiktok ?? current.tiktok,
      youtube: data.youtube ?? current.youtube,
      linkedin: data.linkedin ?? current.linkedin,
      website: data.website ?? current.website,
      phone: data.phone ?? current.phone,
      supportPhone: data.supportPhone ?? current.supportPhone,
      whatsapp: data.whatsapp ?? current.whatsapp,
      email: data.email ?? current.email,
      address: data.address ?? current.address,
      openingHours: data.openingHours ?? current.openingHours,
      timezone: data.timezone ?? current.timezone,
      currency: data.currency ?? current.currency,
      language: data.language ?? current.language,
      country: data.country ?? current.country,
      city: data.city ?? current.city,
      updatedAt: now(),
    };
    this.restaurants.set(updated.id, updated);
    return updated;
  }

  async updateRestaurantSettings(id: string, data: RestaurantSettingsUpdateInput) {
    await this.ensureDevelopmentSeed();
    const current = await this.findRestaurantById(id);
    if (!current) return null;
    const updated: Restaurant = {
      ...current,
      ...data,
      logo: data.logo ?? current.logo,
      favicon: data.favicon ?? current.favicon,
      banner: data.banner ?? current.banner,
      coverImage: data.coverImage ?? current.coverImage,
      primaryColor: data.primaryColor ?? current.primaryColor,
      secondaryColor: data.secondaryColor ?? current.secondaryColor,
      accentColor: data.accentColor ?? current.accentColor,
      backgroundColor: data.backgroundColor ?? current.backgroundColor,
      surfaceColor: data.surfaceColor ?? current.surfaceColor,
      textColor: data.textColor ?? current.textColor,
      successColor: data.successColor ?? current.successColor,
      warningColor: data.warningColor ?? current.warningColor,
      errorColor: data.errorColor ?? current.errorColor,
      fontFamily: data.fontFamily ?? current.fontFamily,
      borderRadius: data.borderRadius ?? current.borderRadius,
      buttonStyle: data.buttonStyle ?? current.buttonStyle,
      cardStyle: data.cardStyle ?? current.cardStyle,
      heroStyle: data.heroStyle ?? current.heroStyle,
      footerStyle: data.footerStyle ?? current.footerStyle,
      instagram: data.instagram ?? current.instagram,
      facebook: data.facebook ?? current.facebook,
      tiktok: data.tiktok ?? current.tiktok,
      youtube: data.youtube ?? current.youtube,
      linkedin: data.linkedin ?? current.linkedin,
      website: data.website ?? current.website,
      phone: data.phone ?? current.phone,
      supportPhone: data.supportPhone ?? current.supportPhone,
      whatsapp: data.whatsapp ?? current.whatsapp,
      email: data.email ?? current.email,
      address: data.address ?? current.address,
      slogan: data.slogan ?? current.slogan,
      history: data.history ?? current.history,
      mission: data.mission ?? current.mission,
      description: data.description ?? current.description,
      state: data.state ?? current.state,
      neighborhood: data.neighborhood ?? current.neighborhood,
      street: data.street ?? current.street,
      number: data.number ?? current.number,
      postalCode: data.postalCode ?? current.postalCode,
      latitude: data.latitude ?? current.latitude,
      longitude: data.longitude ?? current.longitude,
      openingHours: data.openingHours ?? current.openingHours,
      timezone: data.timezone ?? current.timezone,
      currency: data.currency ?? current.currency,
      language: data.language ?? current.language,
      country: data.country ?? current.country,
      city: data.city ?? current.city,
      weeklyHours: data.weeklyHours ?? current.weeklyHours,
      holidays: data.holidays ?? current.holidays,
      isOpen: data.isOpen ?? current.isOpen,
      minimumOrderAmount: data.minimumOrderAmount ?? current.minimumOrderAmount,
      deliveryFee: data.deliveryFee ?? current.deliveryFee,
      deliveryRadiusKm: data.deliveryRadiusKm ?? current.deliveryRadiusKm,
      averagePreparationTime: data.averagePreparationTime ?? current.averagePreparationTime,
      seoTitle: data.seoTitle ?? current.seoTitle,
      seoDescription: data.seoDescription ?? current.seoDescription,
      seoKeywords: data.seoKeywords ?? current.seoKeywords,
      ogImage: data.ogImage ?? current.ogImage,
      twitterTitle: data.twitterTitle ?? current.twitterTitle,
      twitterDescription: data.twitterDescription ?? current.twitterDescription,
      twitterImage: data.twitterImage ?? current.twitterImage,
      integrations: data.integrations ?? current.integrations,
      updatedAt: now(),
    };
    this.restaurants.set(updated.id, updated);
    return updated;
  }

  async listCategoriesByRestaurant(restaurantId: string) {
    await this.ensureDevelopmentSeed();
    return Array.from(this.categories.values())
      .filter((category) => category.restaurantId === restaurantId)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }

  async findCategoryById(id: string, restaurantId: string) {
    await this.ensureDevelopmentSeed();
    const category = this.categories.get(id) ?? null;
    return category?.restaurantId === restaurantId ? category : null;
  }

  async createCategory(data: CategoryCreateInput) {
    await this.ensureDevelopmentSeed();
    const createdAt = data.createdAt ?? now();
    const category: Category = {
      id: data.id ?? randomUUID().replace(/-/g, ""),
      restaurantId: data.restaurantId,
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      image: data.image ?? null,
      active: data.active ?? true,
      sortOrder: data.sortOrder ?? 0,
      createdAt,
      updatedAt: data.updatedAt ?? createdAt,
    };
    this.categories.set(category.id, category);
    return category;
  }

  async updateCategory(id: string, restaurantId: string, data: CategoryUpdateInput) {
    await this.ensureDevelopmentSeed();
    const current = await this.findCategoryById(id, restaurantId);
    if (!current) return null;
    const updated: Category = {
      ...current,
      ...data,
      description: data.description ?? current.description,
      image: data.image ?? current.image,
      active: data.active ?? current.active,
      sortOrder: data.sortOrder ?? current.sortOrder,
      updatedAt: now(),
    };
    this.categories.set(updated.id, updated);
    return updated;
  }

  async deleteCategory(id: string, restaurantId: string) {
    await this.ensureDevelopmentSeed();
    const current = await this.findCategoryById(id, restaurantId);
    if (!current) return false;
    this.categories.delete(id);
    for (const product of Array.from(this.products.values())) {
      if (product.categoryId === id && product.restaurantId === restaurantId) {
        this.products.delete(product.id);
      }
    }
    return true;
  }

  async listProductsByRestaurant(restaurantId: string) {
    await this.ensureDevelopmentSeed();
    return Array.from(this.products.values())
      .filter((product) => product.restaurantId === restaurantId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async findProductById(id: string, restaurantId: string) {
    await this.ensureDevelopmentSeed();
    const product = this.products.get(id) ?? null;
    return product?.restaurantId === restaurantId ? product : null;
  }

  async createProduct(data: ProductCreateInput) {
    await this.ensureDevelopmentSeed();
    const createdAt = data.createdAt ?? now();
    const product: Product = {
      id: data.id ?? randomUUID().replace(/-/g, ""),
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
      updatedAt: data.updatedAt ?? createdAt,
    };
    this.products.set(product.id, product);
    return product;
  }

  async updateProduct(id: string, restaurantId: string, data: ProductUpdateInput) {
    await this.ensureDevelopmentSeed();
    const current = await this.findProductById(id, restaurantId);
    if (!current) return null;
    const updated: Product = {
      ...current,
      ...data,
      description: data.description ?? current.description,
      image: data.image ?? current.image,
      price: data.price ?? current.price,
      promotionalPrice: data.promotionalPrice ?? current.promotionalPrice,
      active: data.active ?? current.active,
      featured: data.featured ?? current.featured,
      preparationTime: data.preparationTime ?? current.preparationTime,
      updatedAt: now(),
    };
    this.products.set(updated.id, updated);
    return updated;
  }

  async deleteProduct(id: string, restaurantId: string) {
    await this.ensureDevelopmentSeed();
    const current = await this.findProductById(id, restaurantId);
    if (!current) return false;
    this.products.delete(id);
    return true;
  }

  async listTablesByRestaurant(restaurantId: string) {
    await this.ensureDevelopmentSeed();
    return Array.from(this.tables.values())
      .filter((table) => table.restaurantId === restaurantId)
      .sort((a, b) => a.number - b.number);
  }

  async findTableById(id: string, restaurantId: string) {
    await this.ensureDevelopmentSeed();
    const table = this.tables.get(id) ?? null;
    return table?.restaurantId === restaurantId ? table : null;
  }

  async createTable(data: TableCreateInput) {
    await this.ensureDevelopmentSeed();
    const table: Table = {
      id: data.id ?? randomUUID().replace(/-/g, ""),
      restaurantId: data.restaurantId,
      number: data.number,
      capacity: data.capacity ?? 4,
      qrCode: data.qrCode,
      active: data.active ?? true,
    };
    this.tables.set(table.id, table);
    return table;
  }

  async updateTable(id: string, restaurantId: string, data: TableUpdateInput) {
    await this.ensureDevelopmentSeed();
    const current = await this.findTableById(id, restaurantId);
    if (!current) return null;
    const updated: Table = {
      ...current,
      ...data,
      number: data.number ?? current.number,
      capacity: data.capacity ?? current.capacity,
      qrCode: data.qrCode ?? current.qrCode,
      active: data.active ?? current.active,
    };
    this.tables.set(updated.id, updated);
    return updated;
  }

  async deleteTable(id: string, restaurantId: string) {
    await this.ensureDevelopmentSeed();
    const current = await this.findTableById(id, restaurantId);
    if (!current) return false;
    this.tables.delete(id);
    return true;
  }

  private buildReservationDetails(reservation: Reservation): ReservationWithDetails {
    const table = this.tables.get(reservation.tableId);
    if (!table) {
      throw new Error("Mesa da reserva não encontrada.");
    }

    const customer = reservation.customerId ? this.customers.get(reservation.customerId) ?? null : null;
    const history = Array.from(this.reservationHistory.values())
      .filter((entry) => entry.reservationId === reservation.id)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    return {
      ...reservation,
      table,
      customer,
      history,
    };
  }

  async listCustomersByRestaurant(restaurantId: string) {
    await this.ensureDevelopmentSeed();
    return Array.from(this.customers.values())
      .filter((customer) => customer.restaurantId === restaurantId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async findCustomerById(id: string, restaurantId: string) {
    await this.ensureDevelopmentSeed();
    const customer = this.customers.get(id) ?? null;
    return customer?.restaurantId === restaurantId ? customer : null;
  }

  async findCustomerByContact(restaurantId: string, phone: string, email?: string | null) {
    await this.ensureDevelopmentSeed();
    const normalizedPhone = normalizePhone(phone);
    const normalizedEmail = email?.trim().toLowerCase() ?? "";
    return (
      Array.from(this.customers.values()).find((customer) => {
        if (customer.restaurantId !== restaurantId) return false;
        if (normalizePhone(customer.phone) === normalizedPhone) return true;
        return normalizedEmail ? customer.email?.toLowerCase() === normalizedEmail : false;
      }) ?? null
    );
  }

  async upsertCustomer(data: CustomerCreateInput) {
    await this.ensureDevelopmentSeed();
    const existing = await this.findCustomerByContact(data.restaurantId, data.phone, data.email);
    const createdAt = existing?.createdAt ?? data.createdAt ?? now();
    const customer: Customer = {
      id: existing?.id ?? data.id ?? randomUUID().replace(/-/g, ""),
      restaurantId: data.restaurantId,
      name: data.name,
      phone: data.phone,
      email: data.email ?? null,
      birthday: data.birthday ?? existing?.birthday ?? null,
      city: data.city ?? existing?.city ?? null,
      country: data.country ?? existing?.country ?? null,
      status: data.status ?? existing?.status ?? "ACTIVE",
      tags: data.tags ?? existing?.tags ?? null,
      lastVisitAt: data.lastVisitAt ?? existing?.lastVisitAt ?? null,
      totalSpent: data.totalSpent ?? existing?.totalSpent ?? 0,
      averageTicket: data.averageTicket ?? existing?.averageTicket ?? 0,
      frequency: data.frequency ?? existing?.frequency ?? 0,
      notes: data.notes ?? existing?.notes ?? null,
      active: data.active ?? existing?.active ?? true,
      createdAt,
      updatedAt: data.updatedAt ?? now(),
    };
    this.customers.set(customer.id, customer);
    return customer;
  }

  async listReservationsByRestaurant(restaurantId: string) {
    await this.ensureDevelopmentSeed();
    return Array.from(this.reservations.values())
      .filter((reservation) => reservation.restaurantId === restaurantId)
      .sort((a, b) =>
        b.reservationDate.localeCompare(a.reservationDate) || b.reservationTime.localeCompare(a.reservationTime)
      )
      .map((reservation) => this.buildReservationDetails(reservation));
  }

  async listReservationsByDate(restaurantId: string, date: string) {
    await this.ensureDevelopmentSeed();
    return Array.from(this.reservations.values())
      .filter(
        (reservation) =>
          reservation.restaurantId === restaurantId &&
          reservation.reservationDate === date
      )
      .sort((a, b) => a.reservationTime.localeCompare(b.reservationTime))
      .map((reservation) => this.buildReservationDetails(reservation));
  }

  async findReservationById(id: string, restaurantId: string) {
    await this.ensureDevelopmentSeed();
    const reservation = this.reservations.get(id) ?? null;
    return reservation?.restaurantId === restaurantId ? this.buildReservationDetails(reservation) : null;
  }

  async addReservationHistory(
    reservationId: string,
    restaurantId: string,
    entry: {
      action: ReservationHistoryAction;
      actorUserId?: string | null;
      notes?: string | null;
      metadata?: unknown;
    }
  ) {
    await this.ensureDevelopmentSeed();
    const reservation = this.reservations.get(reservationId) ?? null;
    if (!reservation || reservation.restaurantId !== restaurantId) {
      return null;
    }

    const history: ReservationHistory = {
      id: randomUUID().replace(/-/g, ""),
      reservationId,
      restaurantId,
      actorUserId: entry.actorUserId ?? null,
      action: entry.action,
      notes: entry.notes ?? null,
      metadata: entry.metadata ?? null,
      createdAt: now(),
    };
    this.reservationHistory.set(history.id, history);
    return history;
  }

  async createReservation(data: ReservationCreateInput) {
    await this.ensureDevelopmentSeed();
    const customer = await this.upsertCustomer({
      restaurantId: data.restaurantId,
      name: data.customerName,
      phone: data.customerPhone,
      email: data.customerEmail ?? null,
      notes: null,
      active: true,
    });

    const createdAt = data.createdAt ?? now();
    const reservation: Reservation = {
      id: data.id ?? randomUUID().replace(/-/g, ""),
      restaurantId: data.restaurantId,
      tableId: data.tableId,
      customerId: customer.id,
      createdByUserId: data.createdByUserId ?? null,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail ?? null,
      guests: data.guests,
      reservationDate: data.reservationDate,
      reservationTime: data.reservationTime,
      duration: data.duration,
      status: data.status ?? "PENDING",
      notes: data.notes ?? null,
      confirmationCode: data.confirmationCode,
      source: data.source ?? "WEBSITE",
      createdAt,
      updatedAt: data.updatedAt ?? createdAt,
    };
    this.reservations.set(reservation.id, reservation);

    for (const entry of data.history ?? []) {
      const history: ReservationHistory = {
        id: entry.id ?? randomUUID().replace(/-/g, ""),
        reservationId: reservation.id,
        restaurantId: reservation.restaurantId,
        actorUserId: entry.actorUserId ?? null,
        action: entry.action,
        notes: entry.notes ?? null,
        metadata: entry.metadata ?? null,
        createdAt: entry.createdAt ?? createdAt,
      };
      this.reservationHistory.set(history.id, history);
    }

    return this.buildReservationDetails(reservation);
  }

  async updateReservation(id: string, restaurantId: string, data: ReservationUpdateInput) {
    await this.ensureDevelopmentSeed();
    const current = this.reservations.get(id) ?? null;
    if (!current || current.restaurantId !== restaurantId) {
      return null;
    }

    const updated: Reservation = {
      ...current,
      ...data,
      tableId: data.tableId ?? current.tableId,
      customerName: data.customerName ?? current.customerName,
      customerPhone: data.customerPhone ?? current.customerPhone,
      customerEmail: data.customerEmail ?? current.customerEmail,
      guests: data.guests ?? current.guests,
      reservationDate: data.reservationDate ?? current.reservationDate,
      reservationTime: data.reservationTime ?? current.reservationTime,
      duration: data.duration ?? current.duration,
      status: data.status ?? current.status,
      notes: data.notes ?? current.notes,
      confirmationCode: data.confirmationCode ?? current.confirmationCode,
      source: data.source ?? current.source,
      updatedAt: now(),
    };

    if (data.customerName || data.customerPhone || data.customerEmail !== undefined) {
      const customer = await this.upsertCustomer({
        restaurantId,
        name: updated.customerName,
        phone: updated.customerPhone,
        email: updated.customerEmail ?? null,
        notes: null,
        active: true,
      });
      updated.customerId = customer.id;
    }

    this.reservations.set(updated.id, updated);

    if (data.history?.length) {
      for (const entry of data.history) {
        const history: ReservationHistory = {
          id: randomUUID().replace(/-/g, ""),
          reservationId: updated.id,
          restaurantId,
          actorUserId: entry.actorUserId ?? null,
          action: entry.action,
          notes: entry.notes ?? null,
          metadata: entry.metadata ?? null,
          createdAt: now(),
        };
        this.reservationHistory.set(history.id, history);
      }
    }

    return this.buildReservationDetails(updated);
  }

  async updateReservationStatus(id: string, restaurantId: string, status: ReservationStatus) {
    await this.ensureDevelopmentSeed();
    const current = this.reservations.get(id) ?? null;
    if (!current || current.restaurantId !== restaurantId) {
      return null;
    }

    const updated: Reservation = {
      ...current,
      status,
      updatedAt: now(),
    };
    this.reservations.set(updated.id, updated);
    return this.buildReservationDetails(updated);
  }

  private buildOrderDetails(order: Order): OrderWithDetails {
    const table = this.tables.get(order.tableId);
    const items = Array.from(this.orderItems.values())
      .filter((item) => item.orderId === order.id)
      .map((item) => {
        const product = this.products.get(item.productId);
        if (!product) {
          throw new Error("Produto do pedido não encontrado.");
        }

        return {
          ...item,
          product,
        };
      });

    if (!table) {
      throw new Error("Mesa do pedido não encontrada.");
    }

    return {
      ...order,
      table,
      items,
    };
  }

  async listOrdersByRestaurant(restaurantId: string) {
    await this.ensureDevelopmentSeed();
    return Array.from(this.orders.values())
      .filter((order) => order.restaurantId === restaurantId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((order) => this.buildOrderDetails(order));
  }

  async findOrderById(id: string, restaurantId: string) {
    await this.ensureDevelopmentSeed();
    const order = this.orders.get(id) ?? null;
    if (!order || order.restaurantId !== restaurantId) {
      return null;
    }

    return this.buildOrderDetails(order);
  }

  async createOrder(data: OrderCreateInput) {
    await this.ensureDevelopmentSeed();
    const createdAt = data.createdAt ?? now();
    const order: Order = {
      id: data.id ?? randomUUID().replace(/-/g, ""),
      restaurantId: data.restaurantId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      tableId: data.tableId,
      status: data.status ?? "PENDING",
      total: data.total,
      notes: data.notes ?? null,
      createdAt,
      updatedAt: data.updatedAt ?? createdAt,
    };

    this.orders.set(order.id, order);
    for (const item of data.items) {
      const orderItem: OrderItem = {
        id: item.id ?? randomUUID().replace(/-/g, ""),
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
      };
      this.orderItems.set(orderItem.id, orderItem);
    }

    return this.buildOrderDetails(order);
  }

  async updateOrderStatus(id: string, restaurantId: string, status: OrderStatus) {
    await this.ensureDevelopmentSeed();
    const current = await this.findOrderById(id, restaurantId);
    if (!current) {
      return null;
    }

    const updated: Order = {
      ...current,
      status,
      updatedAt: now(),
    };
    this.orders.set(updated.id, updated);
    return this.buildOrderDetails(updated);
  }
}

class PrismaDataRepository implements AuthRepository, CatalogRepository {
  async ensureDevelopmentSeed() {
    if (env.NODE_ENV === "production") return;

    const seed = buildDevelopmentSeed();
    const [existingPlatformRestaurant, existingRestaurant] = await Promise.all([
      prisma.restaurant.findUnique({
        where: { slug: seed.platformRestaurant.slug },
      }),
      prisma.restaurant.findUnique({
        where: { slug: seed.restaurant.slug },
      }),
    ]);

    const platformRestaurant =
      existingPlatformRestaurant ?? (await prisma.restaurant.create({ data: seed.platformRestaurant }));
    const restaurant = existingRestaurant ?? (await prisma.restaurant.create({ data: seed.restaurant }));

    await Promise.all(
      seed.users.map(async (userSeed) => {
        const existingUser = await prisma.user.findUnique({
          where: { email: userSeed.email },
        });

        if (existingUser) return;

        await prisma.user.create({
          data: {
            ...userSeed,
            restaurantId:
              userSeed.role === ROLES.SUPER_ADMIN ? platformRestaurant.id : restaurant.id,
          },
        });
      })
    );

    await Promise.all(
      (seed.categories ?? []).map(async (category) => {
        const existing = await prisma.category.findFirst({
          where: {
            restaurantId: category.restaurantId,
            slug: category.slug,
          },
        });

        if (existing) return;

        await prisma.category.create({ data: category });
      })
    );

    await Promise.all(
      (seed.products ?? []).map(async (product) => {
        const existing = await prisma.product.findFirst({
          where: {
            restaurantId: product.restaurantId,
            slug: product.slug,
          },
        });

        if (existing) return;

        await prisma.product.create({ data: product });
      })
    );

    await Promise.all(
      (seed.tables ?? []).map(async (table) => {
        const existing = await prisma.table.findFirst({
          where: {
            restaurantId: table.restaurantId,
            number: table.number,
          },
        });

        if (existing) return;

        await prisma.table.create({ data: table });
      })
    );
  }

  async findUserByEmail(email: string) {
    await this.ensureDevelopmentSeed();
    return (await prisma.user.findUnique({ where: { email: normalizeEmail(email) } })) ?? null;
  }

  async findUserById(id: string) {
    await this.ensureDevelopmentSeed();
    return (await prisma.user.findUnique({ where: { id } })) ?? null;
  }

  async findRestaurantById(id: string) {
    await this.ensureDevelopmentSeed();
    const restaurant = await prisma.restaurant.findUnique({ where: { id } });
    return restaurant ? normalizeRestaurantRecord(restaurant) : null;
  }

  async findRestaurantBySlug(slug: string) {
    await this.ensureDevelopmentSeed();
    const restaurant = await prisma.restaurant.findUnique({ where: { slug } });
    return restaurant ? normalizeRestaurantRecord(restaurant) : null;
  }

  async updateRestaurantBranding(id: string, data: RestaurantBrandingUpdateInput) {
    await this.ensureDevelopmentSeed();
    const current = await this.findRestaurantById(id);
    if (!current) return null;
    const restaurant = await prisma.restaurant.update({
      where: { id: current.id },
      data,
    });
    return normalizeRestaurantRecord(restaurant);
  }

  async updateRestaurantSettings(id: string, data: RestaurantSettingsUpdateInput) {
    await this.ensureDevelopmentSeed();
    const current = await this.findRestaurantById(id);
    if (!current) return null;
    const restaurant = await prisma.restaurant.update({
      where: { id: current.id },
      data,
    });
    return normalizeRestaurantRecord(restaurant);
  }

  async listCategoriesByRestaurant(restaurantId: string) {
    await this.ensureDevelopmentSeed();
    return prisma.category.findMany({
      where: { restaurantId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  }

  async findCategoryById(id: string, restaurantId: string) {
    await this.ensureDevelopmentSeed();
    return (
      (await prisma.category.findFirst({
        where: {
          id,
          restaurantId,
        },
      })) ?? null
    );
  }

  async createCategory(data: CategoryCreateInput) {
    await this.ensureDevelopmentSeed();
    return prisma.category.create({ data });
  }

  async updateCategory(id: string, restaurantId: string, data: CategoryUpdateInput) {
    await this.ensureDevelopmentSeed();
    const current = await this.findCategoryById(id, restaurantId);
    if (!current) return null;
    return prisma.category.update({
      where: { id: current.id },
      data,
    });
  }

  async deleteCategory(id: string, restaurantId: string) {
    await this.ensureDevelopmentSeed();
    const current = await this.findCategoryById(id, restaurantId);
    if (!current) return false;
    await prisma.category.delete({ where: { id: current.id } });
    return true;
  }

  async listProductsByRestaurant(restaurantId: string) {
    await this.ensureDevelopmentSeed();
    return prisma.product.findMany({
      where: { restaurantId },
      orderBy: [{ name: "asc" }],
    });
  }

  async findProductById(id: string, restaurantId: string) {
    await this.ensureDevelopmentSeed();
    return (
      (await prisma.product.findFirst({
        where: {
          id,
          restaurantId,
        },
      })) ?? null
    );
  }

  async createProduct(data: ProductCreateInput) {
    await this.ensureDevelopmentSeed();
    return prisma.product.create({ data });
  }

  async updateProduct(id: string, restaurantId: string, data: ProductUpdateInput) {
    await this.ensureDevelopmentSeed();
    const current = await this.findProductById(id, restaurantId);
    if (!current) return null;
    return prisma.product.update({
      where: { id: current.id },
      data,
    });
  }

  async deleteProduct(id: string, restaurantId: string) {
    await this.ensureDevelopmentSeed();
    const current = await this.findProductById(id, restaurantId);
    if (!current) return false;
    await prisma.product.delete({ where: { id: current.id } });
    return true;
  }

  async listTablesByRestaurant(restaurantId: string) {
    await this.ensureDevelopmentSeed();
    return prisma.table.findMany({
      where: { restaurantId },
      orderBy: [{ number: "asc" }],
    });
  }

  async findTableById(id: string, restaurantId: string) {
    await this.ensureDevelopmentSeed();
    return (
      (await prisma.table.findFirst({
        where: {
          id,
          restaurantId,
        },
      })) ?? null
    );
  }

  async createTable(data: TableCreateInput) {
    await this.ensureDevelopmentSeed();
    return prisma.table.create({ data });
  }

  async updateTable(id: string, restaurantId: string, data: TableUpdateInput) {
    await this.ensureDevelopmentSeed();
    const current = await this.findTableById(id, restaurantId);
    if (!current) return null;
    return prisma.table.update({
      where: { id: current.id },
      data,
    });
  }

  async deleteTable(id: string, restaurantId: string) {
    await this.ensureDevelopmentSeed();
    const current = await this.findTableById(id, restaurantId);
    if (!current) return false;
    await prisma.table.delete({ where: { id: current.id } });
    return true;
  }

  async listCustomersByRestaurant(restaurantId: string) {
    await this.ensureDevelopmentSeed();
    return (await prisma.customer.findMany({
      where: { restaurantId },
      orderBy: [{ name: "asc" }],
    })).map(normalizeCustomerRecord);
  }

  async findCustomerById(id: string, restaurantId: string) {
    await this.ensureDevelopmentSeed();
    const customer =
      (await prisma.customer.findFirst({
        where: {
          id,
          restaurantId,
        },
      })) ?? null;
    return customer ? normalizeCustomerRecord(customer) : null;
  }

  async findCustomerByContact(restaurantId: string, phone: string, email?: string | null) {
    await this.ensureDevelopmentSeed();
    const customers = await prisma.customer.findMany({
      where: { restaurantId },
    });
    const normalizedPhone = normalizePhone(phone);
    const normalizedEmail = email?.trim().toLowerCase() ?? "";
    const customer =
      customers.find((item) => {
        if (normalizePhone(item.phone) === normalizedPhone) return true;
        return normalizedEmail ? item.email?.toLowerCase() === normalizedEmail : false;
      }) ?? null;
    return customer ? normalizeCustomerRecord(customer) : null;
  }

  async upsertCustomer(data: CustomerCreateInput) {
    await this.ensureDevelopmentSeed();
    const existing = await this.findCustomerByContact(data.restaurantId, data.phone, data.email);
    if (existing) {
      return normalizeCustomerRecord(
        await prisma.customer.update({
          where: { id: existing.id },
          data: {
            name: data.name,
            phone: data.phone,
            email: data.email,
            birthday: data.birthday,
            city: data.city,
            country: data.country,
            status: data.status,
            tags: data.tags == null ? null : (data.tags as Prisma.InputJsonValue),
            lastVisitAt: data.lastVisitAt,
            totalSpent: data.totalSpent,
            averageTicket: data.averageTicket,
            frequency: data.frequency,
            notes: data.notes,
            active: data.active,
          },
        })
      );
    }

    return normalizeCustomerRecord(
      await prisma.customer.create({
        data: {
          restaurantId: data.restaurantId,
          name: data.name,
          phone: data.phone,
          email: data.email ?? null,
          birthday: data.birthday ?? null,
          city: data.city ?? null,
          country: data.country ?? null,
          status: data.status ?? "ACTIVE",
          tags: data.tags ?? null,
          lastVisitAt: data.lastVisitAt ?? null,
          totalSpent: data.totalSpent ?? 0,
          averageTicket: data.averageTicket ?? 0,
          frequency: data.frequency ?? 0,
          notes: data.notes ?? null,
          active: data.active ?? true,
        },
      })
    );
  }

  async listReservationsByRestaurant(restaurantId: string) {
    await this.ensureDevelopmentSeed();
    const reservations = await prisma.reservation.findMany({
      where: { restaurantId },
      orderBy: [{ reservationDate: "desc" }, { reservationTime: "desc" }],
      include: {
        table: true,
        customer: true,
        history: {
          include: {
            actorUser: true,
          },
          orderBy: [{ createdAt: "asc" }],
        },
      },
    });

    return reservations.map((reservation) => ({
      ...normalizeReservationRecord(reservation),
    }));
  }

  async listReservationsByDate(restaurantId: string, date: string) {
    await this.ensureDevelopmentSeed();
    const reservations = await prisma.reservation.findMany({
      where: { restaurantId, reservationDate: date },
      orderBy: [{ reservationTime: "asc" }],
      include: {
        table: true,
        customer: true,
        history: {
          include: {
            actorUser: true,
          },
          orderBy: [{ createdAt: "asc" }],
        },
      },
    });

    return reservations.map((reservation) => ({
      ...normalizeReservationRecord(reservation),
    }));
  }

  async findReservationById(id: string, restaurantId: string) {
    await this.ensureDevelopmentSeed();
    const reservation =
      (await prisma.reservation.findFirst({
        where: {
          id,
          restaurantId,
        },
        include: {
          table: true,
          customer: true,
          history: {
            include: {
              actorUser: true,
            },
            orderBy: [{ createdAt: "asc" }],
          },
        },
      })) ?? null;

    if (!reservation) {
      return null;
    }

    return normalizeReservationRecord(reservation);
  }

  async addReservationHistory(
    reservationId: string,
    restaurantId: string,
    entry: {
      action: ReservationHistoryAction;
      actorUserId?: string | null;
      notes?: string | null;
      metadata?: unknown;
    }
  ) {
    await this.ensureDevelopmentSeed();
    const reservation = await this.findReservationById(reservationId, restaurantId);
    if (!reservation) {
      return null;
    }

    const history = await prisma.reservationHistory.create({
      data: {
        reservationId,
        restaurantId,
        actorUserId: entry.actorUserId ?? null,
        action: entry.action,
        notes: entry.notes ?? null,
        metadata: entry.metadata == null ? null : (entry.metadata as Prisma.InputJsonValue),
      },
    });

    return normalizeReservationHistoryRecord(history);
  }

  async createReservation(data: ReservationCreateInput) {
    await this.ensureDevelopmentSeed();
    const customer = await this.upsertCustomer({
      restaurantId: data.restaurantId,
      name: data.customerName,
      phone: data.customerPhone,
      email: data.customerEmail ?? null,
      notes: null,
      active: true,
    });

    const reservation = await prisma.reservation.create({
      data: {
        id: data.id,
        restaurantId: data.restaurantId,
        tableId: data.tableId,
        customerId: customer.id,
        createdByUserId: data.createdByUserId ?? null,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        guests: data.guests,
        reservationDate: data.reservationDate,
        reservationTime: data.reservationTime,
        duration: data.duration,
        status: data.status ?? "PENDING",
        notes: data.notes,
        confirmationCode: data.confirmationCode,
        source: data.source ?? "WEBSITE",
        history: data.history?.length
          ? {
              create: data.history.map((entry) => ({
                restaurant: {
                  connect: { id: data.restaurantId },
                },
                actorUserId: entry.actorUserId ?? null,
                action: entry.action,
                notes: entry.notes ?? null,
                metadata: entry.metadata == null ? null : (entry.metadata as Prisma.InputJsonValue),
                createdAt: entry.createdAt ?? undefined,
              })),
            }
          : undefined,
      },
      include: {
        table: true,
        customer: true,
        history: {
          include: {
            actorUser: true,
          },
          orderBy: [{ createdAt: "asc" }],
        },
      },
    });

    return {
      ...normalizeReservationRecord(reservation),
    };
  }

  async updateReservation(id: string, restaurantId: string, data: ReservationUpdateInput) {
    await this.ensureDevelopmentSeed();
    const current = await this.findReservationById(id, restaurantId);
    if (!current) return null;

    const customer = await this.upsertCustomer({
      restaurantId,
      name: data.customerName ?? current.customerName,
      phone: data.customerPhone ?? current.customerPhone,
      email: data.customerEmail ?? current.customerEmail ?? null,
      notes: null,
      active: true,
    });

    const reservation = await prisma.reservation.update({
      where: { id: current.id },
      data: {
        tableId: data.tableId ?? current.tableId,
        customerId: customer.id,
        customerName: data.customerName ?? current.customerName,
        customerPhone: data.customerPhone ?? current.customerPhone,
        customerEmail: data.customerEmail ?? current.customerEmail,
        guests: data.guests ?? current.guests,
        reservationDate: data.reservationDate ?? current.reservationDate,
        reservationTime: data.reservationTime ?? current.reservationTime,
        duration: data.duration ?? current.duration,
        status: data.status ?? current.status,
        notes: data.notes ?? current.notes,
        confirmationCode: data.confirmationCode ?? current.confirmationCode,
        source: data.source ?? current.source,
      },
      include: {
        table: true,
        customer: true,
        history: {
          include: {
            actorUser: true,
          },
          orderBy: [{ createdAt: "asc" }],
        },
      },
    });

    if (data.history?.length) {
      await prisma.reservationHistory.createMany({
        data: data.history.map((entry) => ({
          reservationId: current.id,
          restaurantId,
          actorUserId: entry.actorUserId ?? null,
          action: entry.action,
          notes: entry.notes ?? null,
          metadata: entry.metadata == null ? null : (entry.metadata as Prisma.InputJsonValue),
        })),
      });
    }

    return normalizeReservationRecord(reservation);
  }

  async updateReservationStatus(id: string, restaurantId: string, status: ReservationStatus) {
    await this.ensureDevelopmentSeed();
    const current = await this.findReservationById(id, restaurantId);
    if (!current) return null;
    const reservation = await prisma.reservation.update({
      where: { id: current.id },
      data: { status },
      include: {
        table: true,
        customer: true,
        history: {
          include: {
            actorUser: true,
          },
          orderBy: [{ createdAt: "asc" }],
        },
      },
    });

    return {
      ...normalizeReservationRecord(reservation),
    };
  }

  async listOrdersByRestaurant(restaurantId: string) {
    await this.ensureDevelopmentSeed();
    const orders = await prisma.order.findMany({
      where: { restaurantId },
      orderBy: [{ createdAt: "desc" }],
      include: {
        table: true,
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });
    return orders.map((order) => ({
      ...order,
      items: order.orderItems,
    }));
  }

  async findOrderById(id: string, restaurantId: string) {
    await this.ensureDevelopmentSeed();
    const order =
      (await prisma.order.findFirst({
        where: {
          id,
          restaurantId,
        },
        include: {
          table: true,
          orderItems: {
            include: {
              product: true,
            },
          },
        },
      })) ?? null;

    if (!order) {
      return null;
    }

    return {
      ...order,
      items: order.orderItems,
    };
  }

  async createOrder(data: OrderCreateInput) {
    await this.ensureDevelopmentSeed();
    const order = await prisma.order.create({
      data: {
        id: data.id,
        restaurantId: data.restaurantId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        tableId: data.tableId,
        status: data.status ?? "PENDING",
        total: data.total,
        notes: data.notes,
        orderItems: {
          create: data.items.map((item) => ({
            id: item.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal,
          })),
        },
      },
      include: {
        table: true,
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });
    return {
      ...order,
      items: order.orderItems,
    };
  }

  async updateOrderStatus(id: string, restaurantId: string, status: OrderStatus) {
    await this.ensureDevelopmentSeed();
    const current = await this.findOrderById(id, restaurantId);
    if (!current) return null;
    const order = await prisma.order.update({
      where: { id: current.id },
      data: { status },
      include: {
        table: true,
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });
    return {
      ...order,
      items: order.orderItems,
    };
  }
}

const repository: AuthRepository & CatalogRepository =
  process.env.CODEX_CI === "1" || env.NODE_ENV === "test" || !env.DATABASE_URL
    ? new MemoryDataRepository()
    : new PrismaDataRepository();

export { prisma };

export async function ensureDevelopmentSeed() {
  await repository.ensureDevelopmentSeed();
}

export async function findUserByEmail(email: string) {
  return repository.findUserByEmail(email);
}

export async function findUserById(id: string) {
  return repository.findUserById(id);
}

export async function findRestaurantById(id: string) {
  return repository.findRestaurantById(id);
}

export async function findRestaurantBySlug(slug: string) {
  return repository.findRestaurantBySlug(slug);
}

export async function updateRestaurantBranding(id: string, data: RestaurantBrandingUpdateInput) {
  return repository.updateRestaurantBranding(id, data);
}

export async function updateRestaurantSettings(id: string, data: RestaurantSettingsUpdateInput) {
  return repository.updateRestaurantSettings(id, data);
}

export async function listCategoriesByRestaurant(restaurantId: string) {
  return repository.listCategoriesByRestaurant(restaurantId);
}

export async function findCategoryById(id: string, restaurantId: string) {
  return repository.findCategoryById(id, restaurantId);
}

export async function createCategory(data: CategoryCreateInput) {
  return repository.createCategory(data);
}

export async function updateCategory(id: string, restaurantId: string, data: CategoryUpdateInput) {
  return repository.updateCategory(id, restaurantId, data);
}

export async function deleteCategory(id: string, restaurantId: string) {
  return repository.deleteCategory(id, restaurantId);
}

export async function listProductsByRestaurant(restaurantId: string) {
  return repository.listProductsByRestaurant(restaurantId);
}

export async function findProductById(id: string, restaurantId: string) {
  return repository.findProductById(id, restaurantId);
}

export async function createProduct(data: ProductCreateInput) {
  return repository.createProduct(data);
}

export async function updateProduct(id: string, restaurantId: string, data: ProductUpdateInput) {
  return repository.updateProduct(id, restaurantId, data);
}

export async function deleteProduct(id: string, restaurantId: string) {
  return repository.deleteProduct(id, restaurantId);
}

export async function listTablesByRestaurant(restaurantId: string) {
  return repository.listTablesByRestaurant(restaurantId);
}

export async function findTableById(id: string, restaurantId: string) {
  return repository.findTableById(id, restaurantId);
}

export async function createTable(data: TableCreateInput) {
  return repository.createTable(data);
}

export async function updateTable(id: string, restaurantId: string, data: TableUpdateInput) {
  return repository.updateTable(id, restaurantId, data);
}

export async function deleteTable(id: string, restaurantId: string) {
  return repository.deleteTable(id, restaurantId);
}

export async function listCustomersByRestaurant(restaurantId: string) {
  return repository.listCustomersByRestaurant(restaurantId);
}

export async function findCustomerById(id: string, restaurantId: string) {
  return repository.findCustomerById(id, restaurantId);
}

export async function findCustomerByContact(restaurantId: string, phone: string, email?: string | null) {
  return repository.findCustomerByContact(restaurantId, phone, email);
}

export async function upsertCustomer(data: CustomerCreateInput) {
  return repository.upsertCustomer(data);
}

export async function listOrdersByRestaurant(restaurantId: string) {
  return repository.listOrdersByRestaurant(restaurantId);
}

export async function findOrderById(id: string, restaurantId: string) {
  return repository.findOrderById(id, restaurantId);
}

export async function createOrder(data: OrderCreateInput) {
  return repository.createOrder(data);
}

export async function updateOrderStatus(id: string, restaurantId: string, status: OrderStatus) {
  return repository.updateOrderStatus(id, restaurantId, status);
}

export async function listReservationsByRestaurant(restaurantId: string) {
  return repository.listReservationsByRestaurant(restaurantId);
}

export async function listReservationsByDate(restaurantId: string, date: string) {
  return repository.listReservationsByDate(restaurantId, date);
}

export async function findReservationById(id: string, restaurantId: string) {
  return repository.findReservationById(id, restaurantId);
}

export async function createReservation(data: ReservationCreateInput) {
  return repository.createReservation(data);
}

export async function updateReservation(id: string, restaurantId: string, data: ReservationUpdateInput) {
  return repository.updateReservation(id, restaurantId, data);
}

export async function updateReservationStatus(id: string, restaurantId: string, status: ReservationStatus) {
  return repository.updateReservationStatus(id, restaurantId, status);
}

export async function addReservationHistory(
  reservationId: string,
  restaurantId: string,
  entry: {
    action: ReservationHistoryAction;
    actorUserId?: string | null;
    notes?: string | null;
    metadata?: Record<string, unknown> | null;
  }
) {
  return repository.addReservationHistory(reservationId, restaurantId, entry);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string) {
  return bcrypt.compare(password, hashedPassword);
}
