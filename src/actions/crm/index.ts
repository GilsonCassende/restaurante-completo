"use server";

import { revalidatePath } from "next/cache";
import { ROLES } from "@/permissions";
import { requireRole } from "@/lib/session";
import {
  getCrmDashboard,
  listCampaigns,
  listCrmCustomers,
  saveCampaign,
  saveCampaignRecipient,
  saveCustomerAddress,
  saveCustomerPreferences,
  saveCustomerProfile,
  updateCrmCustomer,
} from "@/services/crm";
import {
  campaignRecipientSchema,
  campaignSchema,
  customerAddressSchema,
  customerPreferencesSchema,
  customerProfileSchema,
  updateCustomerSchema,
  type CampaignInput,
  type CampaignFilterInput,
  type CampaignRecipientInput,
  type CustomerAddressInput,
  type CustomerFilterInput,
  type CustomerPreferencesInput,
  type CustomerProfileInput,
  type UpdateCustomerInput,
} from "@/schemas";

export type CrmActionResult<T> = { ok: true; data: T } | { ok: false; message: string };

const DASHBOARD_PATH = "/dashboard/crm";
const DASHBOARD_ROLES = [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER] as const;

async function getContext() {
  const user = await requireRole(DASHBOARD_ROLES);
  return user;
}

export async function getCrmDashboardAction() {
  const user = await getContext();
  return getCrmDashboard(user.restaurantId);
}

export async function listCrmCustomersAction(filters: Partial<CustomerFilterInput> = {}) {
  const user = await getContext();
  return listCrmCustomers(user.restaurantId, filters);
}

export async function updateCrmCustomerAction(input: UpdateCustomerInput): Promise<CrmActionResult<unknown>> {
  const parsed = updateCustomerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Cliente inválido." };
  }

  const user = await getContext();
  const data = await updateCrmCustomer(user.restaurantId, parsed.data);
  revalidatePath(DASHBOARD_PATH);
  return { ok: true, data };
}

export async function saveCustomerProfileAction(input: CustomerProfileInput): Promise<CrmActionResult<unknown>> {
  const parsed = customerProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Perfil inválido." };
  }

  const user = await getContext();
  const data = await saveCustomerProfile(user.restaurantId, parsed.data);
  revalidatePath(DASHBOARD_PATH);
  return { ok: true, data };
}

export async function saveCustomerAddressAction(input: CustomerAddressInput): Promise<CrmActionResult<unknown>> {
  const parsed = customerAddressSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Endereço inválido." };
  }

  const user = await getContext();
  const data = await saveCustomerAddress(user.restaurantId, parsed.data);
  revalidatePath(DASHBOARD_PATH);
  return { ok: true, data };
}

export async function saveCustomerPreferencesAction(input: CustomerPreferencesInput): Promise<CrmActionResult<unknown>> {
  const parsed = customerPreferencesSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Preferências inválidas." };
  }

  const user = await getContext();
  const data = await saveCustomerPreferences(user.restaurantId, parsed.data);
  revalidatePath(DASHBOARD_PATH);
  return { ok: true, data };
}

export async function createCampaignAction(input: CampaignInput): Promise<CrmActionResult<unknown>> {
  const parsed = campaignSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Campanha inválida." };
  }

  const user = await getContext();
  const data = await saveCampaign(user.restaurantId, parsed.data);
  revalidatePath(DASHBOARD_PATH);
  return { ok: true, data };
}

export async function listCampaignsAction(filters: Partial<CampaignFilterInput> = {}) {
  const user = await getContext();
  return listCampaigns(user.restaurantId, filters);
}

export async function saveCampaignRecipientAction(input: CampaignRecipientInput): Promise<CrmActionResult<unknown>> {
  const parsed = campaignRecipientSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Destinatário inválido." };
  }

  const user = await getContext();
  const data = await saveCampaignRecipient(user.restaurantId, parsed.data);
  revalidatePath(DASHBOARD_PATH);
  return { ok: true, data };
}
