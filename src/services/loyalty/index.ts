import { cache } from "react";
import { listCustomersByRestaurant } from "@/prisma";
import type { Customer } from "@/types";
import type { LoyaltyAccountInput, LoyaltyFilterInput, LoyaltyRulesInput, LoyaltyTransactionInput } from "@/schemas";

export type LoyaltyRules = LoyaltyRulesInput & {
  active: boolean;
};

export type LoyaltyAccount = LoyaltyAccountInput & {
  id: string;
  restaurantId: string;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  createdAt: Date;
  updatedAt: Date;
};

export type LoyaltyTransaction = Omit<LoyaltyTransactionInput, "orderId" | "reservationId" | "notes" | "expiresAt"> & {
  id: string;
  restaurantId: string;
  orderId: string | undefined;
  reservationId: string | undefined;
  notes: string | undefined;
  expiresAt: Date | undefined;
  createdAt: Date;
};

export type LoyaltyDashboard = {
  kpis: {
    customers: number;
    activeCustomers: number;
    pointsIssued: number;
    pointsRedeemed: number;
  };
  accounts: Array<
    LoyaltyAccount & {
      customer: Customer;
      transactions: LoyaltyTransaction[];
    }
  >;
  transactions: LoyaltyTransaction[];
  rules: LoyaltyRules;
};

const loyaltyRulesStore = new Map<string, LoyaltyRules>();
const loyaltyAccountsStore = new Map<string, Map<string, LoyaltyAccount>>();
const loyaltyTransactionsStore = new Map<string, LoyaltyTransaction[]>();

function getRestaurantAccounts(restaurantId: string) {
  const current = loyaltyAccountsStore.get(restaurantId);
  if (current) return current;
  const store = new Map<string, LoyaltyAccount>();
  loyaltyAccountsStore.set(restaurantId, store);
  return store;
}

function getRestaurantTransactions(restaurantId: string) {
  const current = loyaltyTransactionsStore.get(restaurantId);
  if (current) return current;
  const store: LoyaltyTransaction[] = [];
  loyaltyTransactionsStore.set(restaurantId, store);
  return store;
}

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export const getLoyaltyRules = cache(async (restaurantId: string): Promise<LoyaltyRules> => {
  return loyaltyRulesStore.get(restaurantId) ?? {
    pointsPerCurrency: 1,
    currencyPerPoint: 100,
    pointsExpirationDays: 365,
    active: true,
  };
});

export async function saveLoyaltyRules(restaurantId: string, input: LoyaltyRulesInput) {
  const rules: LoyaltyRules = { ...input, active: true };
  loyaltyRulesStore.set(restaurantId, rules);
  return rules;
}

export async function listLoyaltyAccounts(restaurantId: string, filters: Partial<LoyaltyFilterInput> = {}) {
  const customers = await listCustomersByRestaurant(restaurantId);
  const accounts = Array.from(getRestaurantAccounts(restaurantId).values());
  const transactions = getRestaurantTransactions(restaurantId);
  const search = (filters.search ?? "").trim().toLowerCase();

  let items = customers.map((customer: Customer) => {
    const account = accounts.find((item) => item.customerId === customer.id);
    const history = transactions.filter((entry) => entry.customerId === customer.id);
    const pointsBalance = account?.pointsBalance ?? 0;

    return {
      id: account?.id ?? makeId("acct"),
      customerId: customer.id,
      restaurantId,
      pointsBalance,
      totalPointsEarned: account?.totalPointsEarned ?? 0,
      totalPointsRedeemed: account?.totalPointsRedeemed ?? 0,
      pointsExpiryDays: account?.pointsExpiryDays ?? undefined,
      rewardTier: account?.rewardTier ?? undefined,
      active: account?.active ?? true,
      customer,
      transactions: history,
      createdAt: account?.createdAt ?? new Date(),
      updatedAt: account?.updatedAt ?? new Date(),
    };
  });

  if (search) {
    items = items.filter((item) => {
      const value = [item.customer.name, item.customer.phone, item.customer.email ?? ""].join(" ").toLowerCase();
      return value.includes(search);
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

export async function upsertLoyaltyAccount(restaurantId: string, input: LoyaltyAccountInput) {
  const accounts = getRestaurantAccounts(restaurantId);
  const current = accounts.get(input.customerId);
  const next: LoyaltyAccount = {
    id: current?.id ?? makeId("acct"),
    restaurantId,
    customerId: input.customerId,
    pointsBalance: input.pointsBalance,
    pointsExpiryDays: input.pointsExpiryDays ?? current?.pointsExpiryDays,
    rewardTier: input.rewardTier ?? current?.rewardTier ?? undefined,
    active: input.active,
    totalPointsEarned: current?.totalPointsEarned ?? 0,
    totalPointsRedeemed: current?.totalPointsRedeemed ?? 0,
    createdAt: current?.createdAt ?? new Date(),
    updatedAt: new Date(),
  };
  accounts.set(input.customerId, next);
  return next;
}

export async function addLoyaltyTransaction(restaurantId: string, input: LoyaltyTransactionInput) {
  const accounts = getRestaurantAccounts(restaurantId);
  const account =
    accounts.get(input.customerId) ??
    (await upsertLoyaltyAccount(restaurantId, {
      customerId: input.customerId,
      pointsBalance: 0,
      active: true,
    }));

  const transaction: LoyaltyTransaction = {
    id: makeId("ltx"),
    restaurantId,
    accountId: input.accountId,
    customerId: input.customerId,
    type: input.type,
    points: input.points,
    orderId: input.orderId,
    reservationId: input.reservationId,
    notes: input.notes ?? undefined,
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
    createdAt: new Date(),
  };

  const nextBalance =
    input.type === "REDEEM" ? Math.max(account.pointsBalance - Math.abs(input.points), 0) : account.pointsBalance + input.points;

  accounts.set(input.customerId, {
    ...account,
    pointsBalance: nextBalance,
    totalPointsEarned: input.type === "REDEEM" ? account.totalPointsEarned : account.totalPointsEarned + Math.max(input.points, 0),
    totalPointsRedeemed: input.type === "REDEEM" ? account.totalPointsRedeemed + Math.abs(input.points) : account.totalPointsRedeemed,
    updatedAt: new Date(),
  });
  getRestaurantTransactions(restaurantId).push(transaction);
  return transaction;
}

export async function getLoyaltyDashboard(restaurantId: string): Promise<LoyaltyDashboard> {
  const [accounts, transactions, customers] = await Promise.all([
    listLoyaltyAccounts(restaurantId, {}),
    Promise.resolve(getRestaurantTransactions(restaurantId)),
    listCustomersByRestaurant(restaurantId),
  ]);

  return {
    kpis: {
      customers: customers.length,
      activeCustomers: customers.filter((customer) => customer.active).length,
      pointsIssued: transactions.filter((entry) => entry.type === "EARN").reduce((sum, entry) => sum + entry.points, 0),
      pointsRedeemed: transactions.filter((entry) => entry.type === "REDEEM").reduce((sum, entry) => sum + Math.abs(entry.points), 0),
    },
    accounts: accounts.items,
    transactions,
    rules: await getLoyaltyRules(restaurantId),
  };
}
