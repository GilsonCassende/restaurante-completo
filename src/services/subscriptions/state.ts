import { randomUUID } from "node:crypto";
import { buildDevelopmentSeed } from "@/prisma/seed";
import { ROLES } from "@/permissions";
import type {
  ApiKey,
  AuditLog,
  BillingHistory,
  Invitation,
  License,
  Organization,
  Plan,
  RestaurantMember,
  Restaurant,
  Subscription,
  Usage,
  UsageLimit,
} from "@/types";

export type SaaSState = {
  revision: number;
  organizations: Organization[];
  restaurants: Restaurant[];
  plans: Plan[];
  subscriptions: Subscription[];
  licenses: License[];
  members: RestaurantMember[];
  invitations: Invitation[];
  apiKeys: ApiKey[];
  usages: Usage[];
  limits: UsageLimit[];
  billingHistory: BillingHistory[];
  auditLogs: AuditLog[];
};

const stateStore = new Map<string, SaaSState>();

function now() {
  return new Date();
}

function makeId(prefix: string) {
  return `${prefix}_${randomUUID().replace(/-/g, "")}`;
}

function makePlan(code: Plan["code"], name: string, monthlyPrice: number, yearlyPrice: number, trialDays: number, limits: Record<string, number>) {
  const createdAt = now();
  return {
    id: makeId("plan"),
    code,
    name,
    description: `${name} para operações SaaS enterprise.`,
    billingInterval: "MONTHLY" as const,
    monthlyPrice,
    yearlyPrice,
    trialDays,
    features: {
      whiteLabel: code !== "starter",
      apiAccess: code !== "starter",
      audits: true,
      switcher: true,
      billing: code !== "starter",
      automations: code === "pro" || code === "premium" || code === "enterprise",
    },
    limits,
    active: true,
    createdAt,
    updatedAt: createdAt,
  } satisfies Plan;
}

function createOrganization(restaurant: Restaurant, trialDays: number): Organization {
  const createdAt = now();
  return {
    id: makeId("org"),
    restaurantId: restaurant.id,
    name: restaurant.name,
    slug: restaurant.slug,
    billingEmail: restaurant.email,
    ownerName: "Restaurant Owner",
    trialEndsAt: new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000),
    currentRestaurantId: restaurant.id,
    active: true,
    createdAt,
    updatedAt: createdAt,
  };
}

function createSubscription(organization: Organization, plan: Plan, status: Subscription["status"]): Subscription {
  const createdAt = now();
  const currentPeriodStart = createdAt;
  const currentPeriodEnd = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  return {
    id: makeId("sub"),
    organizationId: organization.id,
    restaurantId: organization.restaurantId,
    planId: plan.id,
    status,
    billingInterval: "MONTHLY",
    trialEndsAt: organization.trialEndsAt,
    currentPeriodStart,
    currentPeriodEnd,
    cancelAtPeriodEnd: false,
    seats: 25,
    metadata: {
      source: "seed",
      planCode: plan.code,
    },
    createdAt,
    updatedAt: createdAt,
  };
}

function createLicense(organization: Organization, status: License["status"]): License {
  const createdAt = now();
  return {
    id: makeId("lic"),
    organizationId: organization.id,
    restaurantId: organization.restaurantId,
    key: `LIC-${organization.slug.toUpperCase()}-${randomUUID().slice(0, 8).toUpperCase()}`,
    status,
    seats: 25,
    activatedAt: status === "ACTIVE" ? createdAt : null,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    revokedAt: null,
    metadata: { tier: "enterprise-ready" },
    createdAt,
    updatedAt: createdAt,
  };
}

function createMember(organization: Organization, name: string, email: string, role: RestaurantMember["role"], status: RestaurantMember["status"]): RestaurantMember {
  const createdAt = now();
  return {
    id: makeId("mem"),
    organizationId: organization.id,
    restaurantId: organization.restaurantId,
    userId: null,
    name,
    email,
    role,
    status,
    invitedByUserId: null,
    joinedAt: status === "ACTIVE" ? createdAt : null,
    createdAt,
    updatedAt: createdAt,
  };
}

function createInvitation(organization: Organization, email: string, role: RestaurantMember["role"], status: Invitation["status"]): Invitation {
  const createdAt = now();
  return {
    id: makeId("inv"),
    organizationId: organization.id,
    restaurantId: organization.restaurantId,
    email,
    role,
    token: randomUUID().replace(/-/g, ""),
    status,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    acceptedAt: status === "ACCEPTED" ? createdAt : null,
    invitedByUserId: null,
    createdAt,
    updatedAt: createdAt,
  };
}

function createApiKey(organization: Organization, name: string, scopes: string[]): ApiKey {
  const createdAt = now();
  return {
    id: makeId("key"),
    organizationId: organization.id,
    restaurantId: organization.restaurantId,
    name,
    prefix: `rp_${organization.slug.slice(0, 4)}`,
    keyHash: randomUUID().replace(/-/g, ""),
    scopes,
    lastUsedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    active: true,
    createdAt,
    updatedAt: createdAt,
  };
}

function createUsage(organization: Organization, metric: string, used: number, limit: number | null): Usage {
  const createdAt = now();
  return {
    id: makeId("use"),
    organizationId: organization.id,
    restaurantId: organization.restaurantId,
    metric,
    period: "monthly",
    used,
    limit,
    resetAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    metadata: { source: "seed" },
    createdAt,
    updatedAt: createdAt,
  };
}

function createLimit(planId: string, metric: string, limit: number) {
  const createdAt = now();
  return {
    id: makeId("lim"),
    planId,
    metric,
    limit,
    hardLimit: false,
    warningThreshold: Math.max(Math.floor(limit * 0.8), 1),
    active: true,
    createdAt,
    updatedAt: createdAt,
  } satisfies UsageLimit;
}

function createBillingHistory(organization: Organization, subscriptionId: string, amount: number, currency: string, status: BillingHistory["status"], description: string): BillingHistory {
  const createdAt = now();
  return {
    id: makeId("bill"),
    organizationId: organization.id,
    restaurantId: organization.restaurantId,
    subscriptionId,
    invoiceNumber: `INV-${organization.slug.slice(0, 4).toUpperCase()}-${Math.floor(Math.random() * 9000) + 1000}`,
    status,
    amount,
    currency,
    description,
    periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    periodEnd: createdAt,
    metadata: { source: "seed" },
    createdAt,
    updatedAt: createdAt,
  };
}

function createAuditLog(organization: Organization, action: string, resource: string, resourceId: string | null): AuditLog {
  return {
    id: makeId("log"),
    organizationId: organization.id,
    restaurantId: organization.restaurantId,
    actorUserId: null,
    action,
    resource,
    resourceId,
    metadata: { source: "seed" },
    createdAt: now(),
  };
}

function buildSeed() {
  const seed = buildDevelopmentSeed();
  const starter = makePlan("starter", "Starter", 0, 0, 7, {
    products: 50,
    orders: 500,
    tables: 10,
    users: 3,
    customers: 500,
    campaigns: 5,
    coupons: 10,
    drivers: 2,
    reservations: 20,
  });
  const basic = makePlan("basic", "Basic", 25000, 240000, 14, {
    products: 250,
    orders: 2500,
    tables: 25,
    users: 10,
    customers: 2500,
    campaigns: 15,
    coupons: 25,
    drivers: 10,
    reservations: 100,
  });
  const pro = makePlan("pro", "Pro", 65000, 620000, 30, {
    products: 1000,
    orders: 10000,
    tables: 75,
    users: 50,
    customers: 10000,
    campaigns: 50,
    coupons: 100,
    drivers: 30,
    reservations: 500,
  });
  const premium = makePlan("premium", "Premium", 125000, 1180000, 30, {
    products: 5000,
    orders: 50000,
    tables: 250,
    users: 200,
    customers: 50000,
    campaigns: 200,
    coupons: 500,
    drivers: 120,
    reservations: 2500,
  });
  const enterprise = makePlan("enterprise", "Enterprise", 250000, 2400000, 30, {
    products: 999999,
    orders: 999999,
    tables: 999999,
    users: 999999,
    customers: 999999,
    campaigns: 999999,
    coupons: 999999,
    drivers: 999999,
    reservations: 999999,
  });
  const plans = [starter, basic, pro, premium, enterprise];
  const organizationA = createOrganization(seed.platformRestaurant, 30);
  const organizationB = createOrganization(seed.restaurant, 14);
  const organizations = [organizationA, organizationB];
  const subscriptions = [
    createSubscription(organizationA, enterprise, "ACTIVE"),
    createSubscription(organizationB, pro, "TRIALING"),
  ];
  const licenses = [
    createLicense(organizationA, "ACTIVE"),
    createLicense(organizationB, "ACTIVE"),
  ];
  const members = [
    createMember(organizationA, "Super Admin", "superadmin@restaurantpro.local", ROLES.SUPER_ADMIN, "ACTIVE"),
    createMember(organizationB, "Owner", "owner@restaurantpro.local", ROLES.OWNER, "ACTIVE"),
    createMember(organizationB, "Manager", "manager@restaurantpro.local", ROLES.MANAGER, "ACTIVE"),
    createMember(organizationB, "Staff", "staff@restaurantpro.local", ROLES.STAFF, "ACTIVE"),
  ];
  const invitations = [
    createInvitation(organizationB, "finance@example.com", ROLES.MANAGER, "PENDING"),
    createInvitation(organizationB, "ops@example.com", ROLES.STAFF, "ACCEPTED"),
  ];
  const apiKeys = [
    createApiKey(organizationA, "Admin API", ["read:all", "write:all"]),
    createApiKey(organizationB, "Restaurant API", ["read:orders", "read:customers"]),
  ];
  const usages = [
    createUsage(organizationA, "products", 120, 999999),
    createUsage(organizationA, "orders", 1520, 999999),
    createUsage(organizationB, "products", 42, 1000),
    createUsage(organizationB, "orders", 240, 10000),
  ];
  const limits = [
    createLimit(starter.id, "products", 50),
    createLimit(starter.id, "orders", 500),
    createLimit(starter.id, "tables", 10),
    createLimit(starter.id, "users", 3),
    createLimit(basic.id, "products", 250),
    createLimit(pro.id, "orders", 10000),
    createLimit(premium.id, "drivers", 120),
    createLimit(enterprise.id, "customers", 999999),
  ];
  const billingHistory = [
    createBillingHistory(organizationA, subscriptions[0].id, enterprise.monthlyPrice, "AOA", "PAID", "Assinatura Enterprise"),
    createBillingHistory(organizationB, subscriptions[1].id, pro.monthlyPrice, "AOA", "PAID", "Assinatura Pro"),
    createBillingHistory(organizationB, subscriptions[1].id, pro.monthlyPrice, "AOA", "PENDING", "Fatura do próximo ciclo"),
  ];
  const auditLogs = [
    createAuditLog(organizationA, "SUBSCRIPTION_CREATED", "subscription", subscriptions[0].id),
    createAuditLog(organizationB, "INVITATION_SENT", "invitation", invitations[0].id),
    createAuditLog(organizationB, "USAGE_LIMIT_UPDATED", "usage_limit", limits[4].id),
  ];

  return {
    organizations,
    restaurants: [seed.platformRestaurant, seed.restaurant],
    plans,
    subscriptions,
    licenses,
    members,
    invitations,
    apiKeys,
    usages,
    limits,
    billingHistory,
    auditLogs,
  };
}

export function getSaasState() {
  const current = stateStore.get("global");
  if (current) return current;
  const seed = buildSeed();
  const state: SaaSState = {
    revision: 1,
    ...seed,
  };
  stateStore.set("global", state);
  return state;
}

export function touchSaasState() {
  const state = getSaasState();
  state.revision += 1;
  return state;
}

export function makeSaasId(prefix: string) {
  return makeId(prefix);
}
