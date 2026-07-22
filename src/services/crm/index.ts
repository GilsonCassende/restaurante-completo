import { findRestaurantById, listCustomersByRestaurant, listOrdersByRestaurant, listReservationsByRestaurant } from "@/prisma";
import { safeRevalidateTag, tenantCacheTag, withTenantCache } from "@/lib/production/cache";
import type {
  Campaign,
  CampaignRecipient,
  Customer,
  CustomerAddress,
  CustomerPreferences,
  CustomerProfile,
  Restaurant,
} from "@/types";
import type {
  CampaignFilterInput,
  CampaignInput,
  CampaignRecipientInput,
  CustomerAddressInput,
  CustomerFilterInput,
  CustomerPreferencesInput,
  CustomerProfileInput,
  UpdateCustomerInput,
} from "@/schemas";

export type CrmCustomerSnapshot = Customer & {
  lastVisitLabel: string;
  ordersCount: number;
  reservationsCount: number;
  spendLabel: string;
  tagsLabel: string;
};

export type CrmDashboard = {
  restaurant: Restaurant | null;
  customers: CrmCustomerSnapshot[];
  campaigns: Campaign[];
  recipients: CampaignRecipient[];
  kpis: {
    customers: number;
    activeCustomers: number;
    newCustomers: number;
    vipCustomers: number;
    averageTicket: number;
    pointsIssued: number;
    cashbackIssued: number;
    couponsUsed: number;
    campaigns: number;
    deliveredCampaigns: number;
  };
};

type CustomerExtraData = {
  profile?: CustomerProfile | null;
  addresses: CustomerAddress[];
  preferences?: CustomerPreferences | null;
};

type CampaignStore = {
  campaigns: Campaign[];
  recipients: CampaignRecipient[];
};

const extraCustomerStore = new Map<string, Map<string, CustomerExtraData>>();
const campaignStore = new Map<string, CampaignStore>();

function getRestaurantStore(restaurantId: string) {
  const current = extraCustomerStore.get(restaurantId);
  if (current) return current;
  const store = new Map<string, CustomerExtraData>();
  extraCustomerStore.set(restaurantId, store);
  return store;
}

function getCampaignStore(restaurantId: string) {
  const current = campaignStore.get(restaurantId);
  if (current) return current;
  const store: CampaignStore = { campaigns: [], recipients: [] };
  campaignStore.set(restaurantId, store);
  return store;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: "AOA",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateLabel(value: Date | null | undefined) {
  if (!value) return "Sem visitas";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(value));
}

function toDate(value: string | Date | null | undefined) {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

function getOrderSpend(order: { total: number }) {
  return order.total;
}

function getCustomerContacts(customer: Customer) {
  const tags = Array.isArray(customer.tags) ? customer.tags.join(" ") : "";
  return [customer.name, customer.phone, customer.email ?? "", tags].join(" ").toLowerCase();
}

function getTagsLabel(tags: unknown) {
  if (!Array.isArray(tags) || tags.length === 0) return "Sem tags";
  return tags.join(", ");
}

function toSnapshot(customer: Customer, orders: Array<{ customerPhone: string; total: number; createdAt: Date }>, reservations: Array<{ customerPhone: string; createdAt: Date }>): CrmCustomerSnapshot {
  const customerOrders = orders.filter((order) => order.customerPhone === customer.phone);
  const customerReservations = reservations.filter((reservation) => reservation.customerPhone === customer.phone);
  const totalSpent = customer.totalSpent || customerOrders.reduce((sum, order) => sum + getOrderSpend(order), 0);
  const frequency = customer.frequency || customerOrders.length + customerReservations.length;
  const averageTicket = customer.averageTicket || (customerOrders.length ? totalSpent / customerOrders.length : 0);

  return {
    ...customer,
    totalSpent,
    averageTicket,
    frequency,
    lastVisitLabel: formatDateLabel(customer.lastVisitAt ?? customerReservations[0]?.createdAt ?? customerOrders[0]?.createdAt),
    ordersCount: customerOrders.length,
    reservationsCount: customerReservations.length,
    spendLabel: formatCurrency(totalSpent),
    tagsLabel: getTagsLabel(customer.tags),
  };
}

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeCampaign(input: CampaignInput, restaurantId: string, current?: Campaign): Campaign {
  const scheduledAt = toDate(input.scheduledAt);
  return {
    id: current?.id ?? makeId("camp"),
    restaurantId,
    name: input.name,
    channel: input.channel,
    status: input.status,
    subject: input.subject ?? null,
    message: input.message ?? null,
    audience: input.audience ?? [],
    scheduledAt,
    sentAt: current?.sentAt ?? null,
    totalRecipients: current?.totalRecipients ?? 0,
    totalDelivered: current?.totalDelivered ?? 0,
    active: input.active,
    createdAt: current?.createdAt ?? new Date(),
    updatedAt: new Date(),
  };
}

export const getCrmDashboard = withTenantCache("crm", async (restaurantId: string): Promise<CrmDashboard> => {
  const [restaurant, restaurantCustomers, orders, reservations] = await Promise.all([
    findRestaurantById(restaurantId),
    listCustomersByRestaurant(restaurantId),
    listOrdersByRestaurant(restaurantId),
    listReservationsByRestaurant(restaurantId),
  ]);

  const campaignState = getCampaignStore(restaurantId);
  const customers = restaurantCustomers.map((customer) => toSnapshot(customer, orders, reservations));
  const now = new Date();
  const newCustomers = customers.filter((customer) => now.getTime() - new Date(customer.createdAt).getTime() < 30 * 24 * 60 * 60 * 1000).length;
  const activeCustomers = customers.filter((customer) => customer.active && customer.status !== "INACTIVE").length;
  const vipCustomers = customers.filter((customer) => customer.status === "VIP").length;
  const averageTicket = customers.length ? customers.reduce((sum, customer) => sum + customer.averageTicket, 0) / customers.length : 0;
  const pointsIssued = customers.reduce((sum, customer) => sum + Math.max(customer.frequency * 10, 0), 0);
  const cashbackIssued = customers.reduce((sum, customer) => sum + Math.max(customer.totalSpent * 0.02, 0), 0);

  return {
    restaurant,
    customers,
    campaigns: campaignState.campaigns.slice().sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
    recipients: campaignState.recipients.slice().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    kpis: {
      customers: customers.length,
      activeCustomers,
      newCustomers,
      vipCustomers,
      averageTicket,
      pointsIssued,
      cashbackIssued,
      couponsUsed: orders.filter((order) => order.notes?.toLowerCase().includes("cupom")).length,
      campaigns: campaignState.campaigns.length,
      deliveredCampaigns: campaignState.recipients.filter((recipient) => recipient.status === "DELIVERED").length,
    },
  };
}, {
  tenantIndex: 0,
  keyPrefix: "crm-dashboard",
  revalidate: 90,
});

export async function listCrmCustomers(restaurantId: string, filters: Partial<CustomerFilterInput> = {}) {
  const dashboard = await getCrmDashboard(restaurantId);
  const search = (filters.search ?? "").trim().toLowerCase();
  const status = filters.status ?? "all";

  let items = dashboard.customers;
  if (status && status !== "all") {
    items = items.filter((customer) => customer.status === status);
  }

  if (search) {
    items = items.filter((customer) => getCustomerContacts(customer).includes(search));
  }

  const segment = filters.segment ?? "all";
  if (segment !== "all") {
    items = items.filter((customer) => {
      switch (segment) {
        case "new":
          return customer.frequency <= 1;
        case "recurring":
          return customer.frequency > 1 && customer.status !== "VIP";
        case "vip":
          return customer.status === "VIP";
        case "inactive":
          return customer.status === "INACTIVE";
        case "birthday":
          return Boolean(customer.birthday);
        case "high-value":
          return customer.totalSpent >= 30000;
        case "low-value":
          return customer.totalSpent < 10000;
        default:
          return true;
      }
    });
  }

  const total = items.length;
  const perPage = filters.perPage ?? 20;
  const page = Math.min(Math.max(filters.page ?? 1, 1), Math.max(Math.ceil(total / perPage), 1));

  return {
    items: items.slice((page - 1) * perPage, (page - 1) * perPage + perPage),
    total,
    page,
    perPage,
    totalPages: Math.max(Math.ceil(total / perPage), 1),
  };
}

export async function updateCrmCustomer(restaurantId: string, input: UpdateCustomerInput) {
  const restaurantStore = getRestaurantStore(restaurantId);
  const current = restaurantStore.get(input.id) ?? { addresses: [] };
  restaurantStore.set(input.id, {
    ...current,
    profile: current.profile ?? null,
    preferences: current.preferences ?? null,
  });
  safeRevalidateTag(tenantCacheTag("crm", restaurantId), tenantCacheTag("analytics", restaurantId), tenantCacheTag("reports", restaurantId));
  return listCrmCustomers(restaurantId, {});
}

export async function saveCustomerProfile(restaurantId: string, input: CustomerProfileInput) {
  const restaurantStore = getRestaurantStore(restaurantId);
  const current = restaurantStore.get(input.customerId) ?? { addresses: [] };
  const profile: CustomerProfile = {
    id: current.profile?.id ?? makeId("profile"),
    restaurantId,
    customerId: input.customerId,
    notes: input.notes ?? null,
    occupation: input.occupation ?? null,
    preferredLanguage: input.preferredLanguage ?? null,
    marketingConsent: input.marketingConsent,
    createdAt: current.profile?.createdAt ?? new Date(),
    updatedAt: new Date(),
  };
  restaurantStore.set(input.customerId, {
    ...current,
    profile,
  });
  safeRevalidateTag(tenantCacheTag("crm", restaurantId), tenantCacheTag("analytics", restaurantId));
  return profile;
}

export async function saveCustomerAddress(restaurantId: string, input: CustomerAddressInput) {
  const restaurantStore = getRestaurantStore(restaurantId);
  const current = restaurantStore.get(input.customerId) ?? { addresses: [] };
  const address: CustomerAddress = {
    id: makeId("address"),
    restaurantId,
    customerId: input.customerId,
    label: input.label,
    street: input.street ?? null,
    number: input.number ?? null,
    neighborhood: input.neighborhood ?? null,
    city: input.city ?? null,
    state: input.state ?? null,
    country: input.country ?? null,
    postalCode: input.postalCode ?? null,
    complement: input.complement ?? null,
    isDefault: input.isDefault,
    active: input.active,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  restaurantStore.set(input.customerId, {
    ...current,
    addresses: [...current.addresses, address],
  });
  safeRevalidateTag(tenantCacheTag("crm", restaurantId), tenantCacheTag("analytics", restaurantId));
  return address;
}

export async function saveCustomerPreferences(restaurantId: string, input: CustomerPreferencesInput) {
  const restaurantStore = getRestaurantStore(restaurantId);
  const current = restaurantStore.get(input.customerId) ?? { addresses: [] };
  const preferences: CustomerPreferences = {
    id: current.preferences?.id ?? makeId("prefs"),
    restaurantId,
    customerId: input.customerId,
    favoriteCategories: input.favoriteCategories,
    favoriteProducts: input.favoriteProducts,
    dietaryRestrictions: input.dietaryRestrictions,
    channels: input.channels,
    whatsappOptIn: input.whatsappOptIn,
    emailOptIn: input.emailOptIn,
    smsOptIn: input.smsOptIn,
    pushOptIn: input.pushOptIn,
    birthdayOptIn: input.birthdayOptIn,
    marketingOptIn: input.marketingOptIn,
    createdAt: current.preferences?.createdAt ?? new Date(),
    updatedAt: new Date(),
  };
  restaurantStore.set(input.customerId, {
    ...current,
    preferences,
  });
  safeRevalidateTag(tenantCacheTag("crm", restaurantId), tenantCacheTag("analytics", restaurantId));
  return preferences;
}

export async function listCampaigns(restaurantId: string, filters: Partial<CampaignFilterInput> = {}) {
  const dashboard = await getCrmDashboard(restaurantId);
  const search = (filters.search ?? "").trim().toLowerCase();

  let items = dashboard.campaigns;
  if (filters.channel && filters.channel !== "all") {
    items = items.filter((campaign) => campaign.channel === filters.channel);
  }
  if (filters.status && filters.status !== "all") {
    items = items.filter((campaign) => campaign.status === filters.status);
  }
  if (search) {
    items = items.filter((campaign) => [campaign.name, campaign.subject ?? "", campaign.message ?? ""].join(" ").toLowerCase().includes(search));
  }

  const total = items.length;
  const perPage = filters.perPage ?? 20;
  const page = Math.min(Math.max(filters.page ?? 1, 1), Math.max(Math.ceil(total / perPage), 1));

  return {
    items: items.slice((page - 1) * perPage, (page - 1) * perPage + perPage),
    total,
    page,
    perPage,
    totalPages: Math.max(Math.ceil(total / perPage), 1),
  };
}

export async function saveCampaign(restaurantId: string, input: CampaignInput) {
  const store = getCampaignStore(restaurantId);
  const existingIndex = store.campaigns.findIndex((item) => item.name.toLowerCase() === input.name.toLowerCase() && item.channel === input.channel);
  const current = existingIndex >= 0 ? store.campaigns[existingIndex] : null;
  const campaign = normalizeCampaign(input, restaurantId, current ?? undefined);
  if (existingIndex >= 0) {
    store.campaigns[existingIndex] = campaign;
  } else {
    store.campaigns.push(campaign);
  }
  safeRevalidateTag(tenantCacheTag("crm", restaurantId), tenantCacheTag("analytics", restaurantId));
  return campaign;
}

export async function saveCampaignRecipient(restaurantId: string, input: CampaignRecipientInput) {
  const store = getCampaignStore(restaurantId);
  const campaign = store.campaigns.find((item) => item.id === input.campaignId) ?? null;
  if (!campaign) {
    throw new Error("Campanha não encontrada.");
  }

  const recipient: CampaignRecipient = {
    id: makeId("recipient"),
    campaignId: input.campaignId,
    restaurantId,
    customerId: input.customerId,
    status: input.status,
    deliveredAt: toDate(input.deliveredAt),
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  store.recipients.push(recipient);
  campaign.totalRecipients += 1;
  if (recipient.status === "DELIVERED") {
    campaign.totalDelivered += 1;
    campaign.sentAt = campaign.sentAt ?? new Date();
  }
  campaign.updatedAt = new Date();
  safeRevalidateTag(tenantCacheTag("crm", restaurantId), tenantCacheTag("analytics", restaurantId));
  return recipient;
}
