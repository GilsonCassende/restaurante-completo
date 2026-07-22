"use server";

import { revalidatePath } from "next/cache";
import { ROLES } from "@/permissions";
import { requireRole } from "@/lib/session";
import {
  adminSwitcherSchema,
  invitationSchema,
  apiKeySchema,
  usageLimitSchema,
  usageSchema,
  billingHistorySchema,
  restaurantMemberSchema,
  type AdminSwitcherInput,
  type InvitationInput,
  type ApiKeyInput,
  type UsageLimitInput,
  type UsageInput,
  type BillingHistoryInput,
  type RestaurantMemberInput,
} from "@/schemas";
import {
  acceptInvitation,
  createApiKey,
  createBillingHistory,
  createInvitation,
  getAdminDashboard,
  getOrganizationSummary,
  listApiKeys,
  listAuditLogs,
  listBillingHistory,
  listLicenses,
  listInvitations,
  listMembers,
  listOrganizations,
  listRestaurants,
  listUsageLimits,
  listUsages,
  recordAuditLog,
  recordUsage,
  switchRestaurant,
  upsertMember,
  upsertUsageLimit,
} from "@/services/admin";

export type AdminActionResult<T> = { ok: true; data: T } | { ok: false; message: string };

const SUPER_ADMIN = [ROLES.SUPER_ADMIN] as const;
const ADMIN_PATHS = ["/dashboard/admin", "/dashboard/subscriptions", "/dashboard/plans"] as const;

async function getContext() {
  const user = await requireRole(SUPER_ADMIN);
  return { user, restaurantId: user.restaurantId };
}

export async function getAdminDashboardAction(selectedOrganizationId?: string | null) {
  await getContext();
  return getAdminDashboard(selectedOrganizationId ?? null);
}

export async function listOrganizationsAction() {
  await getContext();
  return listOrganizations();
}

export async function listRestaurantsAction() {
  await getContext();
  return listRestaurants();
}

export async function switchRestaurantAction(input: AdminSwitcherInput): Promise<AdminActionResult<NonNullable<ReturnType<typeof switchRestaurant>>>> {
  const parsed = adminSwitcherSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Organização inválida." };
  }

  await getContext();
  const organization = switchRestaurant(parsed.data.organizationId);
  if (!organization) {
    return { ok: false, message: "Organização não encontrada." };
  }
  ADMIN_PATHS.forEach((pathname) => revalidatePath(pathname));
  return { ok: true, data: organization };
}

export async function listMembersAction() {
  await getContext();
  return listMembers();
}

export async function saveMemberAction(input: RestaurantMemberInput): Promise<AdminActionResult<Awaited<ReturnType<typeof upsertMember>>>> {
  const parsed = restaurantMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Membro inválido." };
  }

  await getContext();
  const member = upsertMember(parsed.data);
  ADMIN_PATHS.forEach((pathname) => revalidatePath(pathname));
  return { ok: true, data: member };
}

export async function listInvitationsAction() {
  await getContext();
  return listInvitations();
}

export async function listLicensesAction() {
  await getContext();
  return listLicenses();
}

export async function createInvitationAction(input: InvitationInput): Promise<AdminActionResult<Awaited<ReturnType<typeof createInvitation>>>> {
  const parsed = invitationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Convite inválido." };
  }

  await getContext();
  const invitation = createInvitation({
    organizationId: parsed.data.organizationId,
    restaurantId: parsed.data.restaurantId,
    email: parsed.data.email,
    role: parsed.data.role,
    invitedByUserId: parsed.data.invitedByUserId ?? null,
  });
  ADMIN_PATHS.forEach((pathname) => revalidatePath(pathname));
  return { ok: true, data: invitation };
}

export async function acceptInvitationAction(token: string) {
  await getContext();
  return acceptInvitation(token);
}

export async function listApiKeysAction() {
  await getContext();
  return listApiKeys();
}

export async function createApiKeyAction(input: ApiKeyInput): Promise<AdminActionResult<Awaited<ReturnType<typeof createApiKey>>>> {
  const parsed = apiKeySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Chave inválida." };
  }

  await getContext();
  const apiKey = createApiKey({
    organizationId: parsed.data.organizationId,
    restaurantId: parsed.data.restaurantId,
    name: parsed.data.name,
    scopes: parsed.data.scopes ?? null,
  });
  ADMIN_PATHS.forEach((pathname) => revalidatePath(pathname));
  return { ok: true, data: apiKey };
}

export async function listUsagesAction() {
  await getContext();
  return listUsages();
}

export async function recordUsageAction(input: UsageInput): Promise<AdminActionResult<Awaited<ReturnType<typeof recordUsage>>>> {
  const parsed = usageSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Uso inválido." };
  }

  await getContext();
  const usage = recordUsage({
    organizationId: parsed.data.organizationId,
    restaurantId: parsed.data.restaurantId,
    metric: parsed.data.metric,
    used: parsed.data.used,
    limit: parsed.data.limit ?? null,
  });
  ADMIN_PATHS.forEach((pathname) => revalidatePath(pathname));
  return { ok: true, data: usage };
}

export async function listUsageLimitsAction() {
  await getContext();
  return listUsageLimits();
}

export async function upsertUsageLimitAction(input: UsageLimitInput): Promise<AdminActionResult<Awaited<ReturnType<typeof upsertUsageLimit>>>> {
  const parsed = usageLimitSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Limite inválido." };
  }

  await getContext();
  const limit = upsertUsageLimit({
    planId: parsed.data.planId,
    metric: parsed.data.metric,
    limit: parsed.data.limit,
    hardLimit: parsed.data.hardLimit,
    warningThreshold: parsed.data.warningThreshold,
    active: parsed.data.active,
  });
  ADMIN_PATHS.forEach((pathname) => revalidatePath(pathname));
  return { ok: true, data: limit };
}

export async function listAuditLogsAction() {
  await getContext();
  return listAuditLogs();
}

export async function listBillingHistoryAction() {
  await getContext();
  return listBillingHistory();
}

export async function createBillingHistoryAction(input: BillingHistoryInput): Promise<AdminActionResult<Awaited<ReturnType<typeof createBillingHistory>>>> {
  const parsed = billingHistorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Billing inválido." };
  }

  await getContext();
  const entry = createBillingHistory({
    organizationId: parsed.data.organizationId,
    restaurantId: parsed.data.restaurantId,
    subscriptionId: parsed.data.subscriptionId ?? null,
    invoiceNumber: parsed.data.invoiceNumber,
    status: parsed.data.status,
    amount: parsed.data.amount,
    currency: parsed.data.currency,
    description: parsed.data.description ?? null,
  });
  ADMIN_PATHS.forEach((pathname) => revalidatePath(pathname));
  return { ok: true, data: entry };
}

export async function recordAuditLogAction(action: string, resource: string, resourceId?: string | null) {
  const { restaurantId } = await getContext();
  return recordAuditLog({
    organizationId: getAdminDashboard().selectedOrganizationId,
    restaurantId,
    action,
    resource,
    resourceId: resourceId ?? null,
  });
}

export async function getOrganizationSummaryAction(organizationId: string) {
  await getContext();
  return getOrganizationSummary(organizationId);
}
