import { cache } from "react";
import type {
  ApiKey,
  AdminDashboard,
  AuditLog,
  BillingHistory,
  Invitation,
  License,
  Plan,
  PlansDashboard,
  RestaurantMember,
  Subscription,
  SubscriptionDashboard,
  Usage,
  UsageLimit,
} from "@/types";
import { recordAuditEvent } from "@/lib/production";
import { getSaasState, makeSaasId, touchSaasState } from "./state";

function now() {
  return new Date();
}

function sortLatest<T extends { createdAt: Date }>(items: T[]) {
  return [...items].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

function getPlanById(planId: string) {
  return getSaasState().plans.find((plan) => plan.id === planId) ?? null;
}

function buildSelection(selectedOrganizationId?: string | null) {
  const state = getSaasState();
  return state.organizations.find((organization) => organization.id === selectedOrganizationId) ?? state.organizations[0] ?? null;
}

function buildAdminKpis(subscriptions: Subscription[], billingHistory: BillingHistory[]) {
  const activeSubscriptions = subscriptions.filter((subscription) => subscription.status === "ACTIVE");
  const trialingSubscriptions = subscriptions.filter((subscription) => subscription.status === "TRIALING");
  const paidInvoices = billingHistory.filter((entry) => entry.status === "PAID");
  const mrr = subscriptions.reduce((sum, subscription) => sum + (getPlanById(subscription.planId)?.monthlyPrice ?? 0), 0);
  return {
    mrr,
    arr: mrr * 12,
    ltv: activeSubscriptions.length ? Math.round(paidInvoices.reduce((sum, entry) => sum + entry.amount, 0) / activeSubscriptions.length) : 0,
    cac: trialingSubscriptions.length ? Math.round((paidInvoices.reduce((sum, entry) => sum + entry.amount, 0) / trialingSubscriptions.length) * 0.18) : 0,
    churn: subscriptions.length ? Math.round((subscriptions.filter((subscription) => subscription.status === "CANCELED").length / subscriptions.length) * 100) : 0,
    revenue: paidInvoices.reduce((sum, entry) => sum + entry.amount, 0),
    newCustomers: getSaasState().members.length,
    trialConversion: subscriptions.length ? Math.round((activeSubscriptions.length / subscriptions.length) * 100) : 0,
    planConversion: subscriptions.length ? Math.round((paidInvoices.length / subscriptions.length) * 100) : 0,
  };
}

function buildSubscriptionKpis(subscriptions: Subscription[]) {
  const nowDate = now();
  return {
    active: subscriptions.filter((subscription) => subscription.status === "ACTIVE").length,
    trialing: subscriptions.filter((subscription) => subscription.status === "TRIALING").length,
    pastDue: subscriptions.filter((subscription) => subscription.status === "PAST_DUE").length,
    canceled: subscriptions.filter((subscription) => subscription.status === "CANCELED").length,
    renewals: subscriptions.filter((subscription) => subscription.currentPeriodEnd.getTime() > nowDate.getTime()).length,
    trialEndsSoon: subscriptions.filter((subscription) => subscription.trialEndsAt && subscription.trialEndsAt.getTime() - nowDate.getTime() < 7 * 24 * 60 * 60 * 1000).length,
  };
}

function buildPlansKpis(plans: Plan[]) {
  return {
    activePlans: plans.filter((plan) => plan.active).length,
    starter: plans.filter((plan) => plan.code === "starter").length,
    basic: plans.filter((plan) => plan.code === "basic").length,
    pro: plans.filter((plan) => plan.code === "pro").length,
    premium: plans.filter((plan) => plan.code === "premium").length,
    enterprise: plans.filter((plan) => plan.code === "enterprise").length,
  };
}

const getAdminDashboardForRevision = cache((selectedOrganizationId: string | null, revision: number): AdminDashboard => {
  void revision;
  const state = getSaasState();
  const selected = buildSelection(selectedOrganizationId);
  return {
    organizations: sortLatest(state.organizations),
    restaurants: sortLatest(state.restaurants),
    subscriptions: sortLatest(state.subscriptions),
    plans: sortLatest(state.plans),
    licenses: sortLatest(state.licenses),
    members: sortLatest(state.members),
    invitations: sortLatest(state.invitations),
    apiKeys: sortLatest(state.apiKeys),
    usages: sortLatest(state.usages),
    limits: sortLatest(state.limits),
    billingHistory: sortLatest(state.billingHistory),
    auditLogs: sortLatest(state.auditLogs),
    selectedOrganizationId: selected?.id ?? state.organizations[0]?.id ?? "",
    kpis: buildAdminKpis(state.subscriptions, state.billingHistory),
  };
});

const getSubscriptionDashboardForRevision = cache((revision: number): SubscriptionDashboard => {
  void revision;
  const state = getSaasState();
  return {
    subscriptions: sortLatest(state.subscriptions),
    plans: sortLatest(state.plans),
    usage: sortLatest(state.usages),
    limits: sortLatest(state.limits),
    billingHistory: sortLatest(state.billingHistory),
    kpis: buildSubscriptionKpis(state.subscriptions),
  };
});

const getPlansDashboardForRevision = cache((revision: number): PlansDashboard => {
  void revision;
  const state = getSaasState();
  return {
    plans: sortLatest(state.plans),
    limits: sortLatest(state.limits),
    kpis: buildPlansKpis(state.plans),
  };
});

function bump() {
  return touchSaasState();
}

export function getAdminDashboard(selectedOrganizationId?: string | null) {
  const state = getSaasState();
  return getAdminDashboardForRevision(selectedOrganizationId ?? null, state.revision);
}

export function getSubscriptionDashboard() {
  const state = getSaasState();
  return getSubscriptionDashboardForRevision(state.revision);
}

export function getPlansDashboard() {
  const state = getSaasState();
  return getPlansDashboardForRevision(state.revision);
}

export function listOrganizations() {
  return sortLatest(getSaasState().organizations);
}

export function listRestaurants() {
  return sortLatest(getSaasState().restaurants);
}

export function listPlans() {
  return sortLatest(getSaasState().plans);
}

export function listSubscriptions() {
  return sortLatest(getSaasState().subscriptions);
}

export function listLicenses() {
  return sortLatest(getSaasState().licenses);
}

export function listMembers() {
  return sortLatest(getSaasState().members);
}

export function listInvitations() {
  return sortLatest(getSaasState().invitations);
}

export function listApiKeys() {
  return sortLatest(getSaasState().apiKeys);
}

export function listUsages() {
  return sortLatest(getSaasState().usages);
}

export function listUsageLimits() {
  return sortLatest(getSaasState().limits);
}

export function listBillingHistory() {
  return sortLatest(getSaasState().billingHistory);
}

export function listAuditLogs() {
  return sortLatest(getSaasState().auditLogs);
}

export function switchRestaurant(organizationId: string) {
  const state = bump();
  const organization = state.organizations.find((item) => item.id === organizationId) ?? null;
  if (!organization) return null;
  organization.currentRestaurantId = organization.restaurantId;
  organization.updatedAt = now();
  state.auditLogs.push({
    id: makeSaasId("log"),
    organizationId: organization.id,
    restaurantId: organization.restaurantId,
    actorUserId: null,
    action: "RESTAURANT_SWITCHED",
    resource: "organization",
    resourceId: organization.id,
    metadata: { restaurantId: organization.restaurantId },
    createdAt: now(),
  });
  return organization;
}

export function upsertPlan(input: Partial<Plan> & { code: Plan["code"]; name: string; monthlyPrice: number; yearlyPrice: number; trialDays: number }) {
  const state = bump();
  const existing = state.plans.find((plan) => plan.id === input.id || plan.code === input.code) ?? null;
  const createdAt = existing?.createdAt ?? now();
  const plan: Plan = {
    id: existing?.id ?? input.id ?? makeSaasId("plan"),
    code: input.code,
    name: input.name,
    description: input.description ?? existing?.description ?? null,
    billingInterval: input.billingInterval ?? existing?.billingInterval ?? "MONTHLY",
    monthlyPrice: input.monthlyPrice,
    yearlyPrice: input.yearlyPrice,
    trialDays: input.trialDays,
    features: input.features ?? existing?.features ?? null,
    limits: input.limits ?? existing?.limits ?? null,
    active: input.active ?? existing?.active ?? true,
    createdAt,
    updatedAt: now(),
  };
  const index = state.plans.findIndex((item) => item.id === plan.id);
  if (index >= 0) state.plans[index] = plan;
  else state.plans.push(plan);
  return plan;
}

export function upsertSubscription(input: Partial<Subscription> & { organizationId: string; restaurantId: string; planId: string; status: Subscription["status"] }) {
  const state = bump();
  const existing = state.subscriptions.find((item) => item.id === input.id || item.organizationId === input.organizationId) ?? null;
  const createdAt = existing?.createdAt ?? now();
  const subscription: Subscription = {
    id: existing?.id ?? input.id ?? makeSaasId("sub"),
    organizationId: input.organizationId,
    restaurantId: input.restaurantId,
    planId: input.planId,
    status: input.status,
    billingInterval: input.billingInterval ?? existing?.billingInterval ?? "MONTHLY",
    trialEndsAt: input.trialEndsAt ?? existing?.trialEndsAt ?? null,
    currentPeriodStart: input.currentPeriodStart ?? existing?.currentPeriodStart ?? now(),
    currentPeriodEnd: input.currentPeriodEnd ?? existing?.currentPeriodEnd ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    cancelAtPeriodEnd: input.cancelAtPeriodEnd ?? existing?.cancelAtPeriodEnd ?? false,
    seats: input.seats ?? existing?.seats ?? 1,
    metadata: input.metadata ?? existing?.metadata ?? null,
    createdAt,
    updatedAt: now(),
  };
  const index = state.subscriptions.findIndex((item) => item.id === subscription.id);
  if (index >= 0) state.subscriptions[index] = subscription;
  else state.subscriptions.push(subscription);
  return subscription;
}

export function upsertLicense(input: Partial<License> & { organizationId: string; restaurantId: string; key: string; status: License["status"] }) {
  const state = bump();
  const existing = state.licenses.find((item) => item.id === input.id || item.key === input.key) ?? null;
  const createdAt = existing?.createdAt ?? now();
  const license: License = {
    id: existing?.id ?? input.id ?? makeSaasId("lic"),
    organizationId: input.organizationId,
    restaurantId: input.restaurantId,
    key: input.key,
    status: input.status,
    seats: input.seats ?? existing?.seats ?? 1,
    activatedAt: input.activatedAt ?? existing?.activatedAt ?? null,
    expiresAt: input.expiresAt ?? existing?.expiresAt ?? null,
    revokedAt: input.revokedAt ?? existing?.revokedAt ?? null,
    metadata: input.metadata ?? existing?.metadata ?? null,
    createdAt,
    updatedAt: now(),
  };
  const index = state.licenses.findIndex((item) => item.id === license.id);
  if (index >= 0) state.licenses[index] = license;
  else state.licenses.push(license);
  return license;
}

export function upsertMember(input: Partial<RestaurantMember> & { organizationId: string; restaurantId: string; email: string; name: string; role: RestaurantMember["role"] }) {
  const state = bump();
  const existing = state.members.find((item) => item.id === input.id || item.email === input.email) ?? null;
  const createdAt = existing?.createdAt ?? now();
  const member: RestaurantMember = {
    id: existing?.id ?? input.id ?? makeSaasId("mem"),
    organizationId: input.organizationId,
    restaurantId: input.restaurantId,
    userId: input.userId ?? existing?.userId ?? null,
    name: input.name,
    email: input.email,
    role: input.role,
    status: input.status ?? existing?.status ?? "PENDING",
    invitedByUserId: input.invitedByUserId ?? existing?.invitedByUserId ?? null,
    joinedAt: input.joinedAt ?? existing?.joinedAt ?? null,
    createdAt,
    updatedAt: now(),
  };
  const index = state.members.findIndex((item) => item.id === member.id);
  if (index >= 0) state.members[index] = member;
  else state.members.push(member);
  return member;
}

export function createInvitation(input: { organizationId: string; restaurantId: string; email: string; role: RestaurantMember["role"]; invitedByUserId?: string | null }) {
  const state = bump();
  const invitation: Invitation = {
    id: makeSaasId("inv"),
    organizationId: input.organizationId,
    restaurantId: input.restaurantId,
    email: input.email,
    role: input.role,
    token: makeSaasId("tok"),
    status: "PENDING",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    acceptedAt: null,
    invitedByUserId: input.invitedByUserId ?? null,
    createdAt: now(),
    updatedAt: now(),
  };
  state.invitations.push(invitation);
  return invitation;
}

export function acceptInvitation(token: string) {
  const state = bump();
  const invitation = state.invitations.find((item) => item.token === token) ?? null;
  if (!invitation) return null;
  invitation.status = "ACCEPTED";
  invitation.acceptedAt = now();
  invitation.updatedAt = now();
  return invitation;
}

export function createApiKey(input: { organizationId: string; restaurantId: string; name: string; scopes?: string[] | null }) {
  const state = bump();
  const apiKey = {
    id: makeSaasId("key"),
    organizationId: input.organizationId,
    restaurantId: input.restaurantId,
    name: input.name,
    prefix: `rp_${input.name.slice(0, 4).toLowerCase()}`,
    keyHash: makeSaasId("hash"),
    scopes: input.scopes ?? null,
    lastUsedAt: null,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    active: true,
    createdAt: now(),
    updatedAt: now(),
  } satisfies ApiKey;
  state.apiKeys.push(apiKey);
  return apiKey;
}

export function recordUsage(input: { organizationId: string; restaurantId: string; metric: string; used: number; limit?: number | null }) {
  const state = bump();
  const usage = {
    id: makeSaasId("use"),
    organizationId: input.organizationId,
    restaurantId: input.restaurantId,
    metric: input.metric,
    period: "monthly",
    used: input.used,
    limit: input.limit ?? null,
    resetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    metadata: { manual: true },
    createdAt: now(),
    updatedAt: now(),
  } satisfies Usage;
  state.usages.push(usage);
  return usage;
}

export function upsertUsageLimit(input: { planId: string; metric: string; limit: number; hardLimit?: boolean; warningThreshold?: number; active?: boolean }) {
  const state = bump();
  const existing = state.limits.find((item) => item.planId === input.planId && item.metric === input.metric) ?? null;
  const createdAt = existing?.createdAt ?? now();
  const limit = {
    id: existing?.id ?? makeSaasId("lim"),
    planId: input.planId,
    metric: input.metric,
    limit: input.limit,
    hardLimit: input.hardLimit ?? existing?.hardLimit ?? false,
    warningThreshold: input.warningThreshold ?? existing?.warningThreshold ?? Math.floor(input.limit * 0.8),
    active: input.active ?? existing?.active ?? true,
    createdAt,
    updatedAt: now(),
  } satisfies UsageLimit;
  const index = state.limits.findIndex((item) => item.id === limit.id);
  if (index >= 0) state.limits[index] = limit;
  else state.limits.push(limit);
  return limit;
}

export function createBillingHistory(input: { organizationId: string; restaurantId: string; subscriptionId: string | null; invoiceNumber: string; status: BillingHistory["status"]; amount: number; currency: string; description?: string | null }) {
  const state = bump();
  const entry: BillingHistory = {
    id: makeSaasId("bill"),
    organizationId: input.organizationId,
    restaurantId: input.restaurantId,
    subscriptionId: input.subscriptionId,
    invoiceNumber: input.invoiceNumber,
    status: input.status,
    amount: input.amount,
    currency: input.currency,
    description: input.description ?? null,
    periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    periodEnd: now(),
    metadata: null,
    createdAt: now(),
    updatedAt: now(),
  };
  state.billingHistory.push(entry);
  return entry;
}

export function recordAuditLog(input: { organizationId: string; restaurantId: string; actorUserId?: string | null; action: string; resource: string; resourceId?: string | null; metadata?: unknown | null }) {
  const state = bump();
  const entry = {
    id: makeSaasId("log"),
    organizationId: input.organizationId,
    restaurantId: input.restaurantId,
    actorUserId: input.actorUserId ?? null,
    action: input.action,
    resource: input.resource,
    resourceId: input.resourceId ?? null,
    metadata: input.metadata ?? null,
    createdAt: now(),
  } satisfies AuditLog;
  state.auditLogs.push(entry);
  recordAuditEvent({
    tenantId: input.organizationId,
    restaurantId: input.restaurantId,
    actorUserId: input.actorUserId ?? null,
    action: input.action,
    resource: input.resource,
    resourceId: input.resourceId ?? null,
    metadata: input.metadata && typeof input.metadata === "object" && !Array.isArray(input.metadata) ? (input.metadata as Record<string, unknown>) : null,
  });
  return entry;
}

export function getOrganizationSummary(organizationId: string) {
  const state = getSaasState();
  const organization = state.organizations.find((item) => item.id === organizationId) ?? null;
  const subscription = state.subscriptions.find((item) => item.organizationId === organizationId) ?? null;
  const license = state.licenses.find((item) => item.organizationId === organizationId) ?? null;
  return { organization, subscription, license };
}
