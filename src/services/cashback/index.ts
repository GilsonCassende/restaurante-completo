import { cache } from "react";
import { listCustomersByRestaurant } from "@/prisma";
import type { CashbackAccount, CashbackTransaction, Customer } from "@/types";
import type { CashbackAccountInput, CashbackFilterInput, CashbackTransactionInput } from "@/schemas";

export type CashbackPolicy = {
  percentage: number;
  minimumOrderAmount: number;
  expirationDays: number;
  active: boolean;
};

export type CashbackDashboard = {
  policy: CashbackPolicy;
  accounts: Array<
    CashbackAccount & {
      customer: Customer;
      transactions: CashbackTransaction[];
    }
  >;
  transactions: CashbackTransaction[];
  kpis: {
    accounts: number;
    activeAccounts: number;
    balance: number;
    earned: number;
    redeemed: number;
  };
};

const cashbackPolicyStore = new Map<string, CashbackPolicy>();
const cashbackAccountsStore = new Map<string, Map<string, CashbackAccount>>();
const cashbackTransactionsStore = new Map<string, CashbackTransaction[]>();

function getRestaurantAccounts(restaurantId: string) {
  const current = cashbackAccountsStore.get(restaurantId);
  if (current) return current;
  const store = new Map<string, CashbackAccount>();
  cashbackAccountsStore.set(restaurantId, store);
  return store;
}

function getRestaurantTransactions(restaurantId: string) {
  const current = cashbackTransactionsStore.get(restaurantId);
  if (current) return current;
  const store: CashbackTransaction[] = [];
  cashbackTransactionsStore.set(restaurantId, store);
  return store;
}

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function toDate(value: string | null | undefined) {
  if (!value) return null;
  return new Date(value);
}

export const getCashbackPolicy = cache(async (restaurantId: string): Promise<CashbackPolicy> => {
  return cashbackPolicyStore.get(restaurantId) ?? {
    percentage: 2,
    minimumOrderAmount: 0,
    expirationDays: 180,
    active: true,
  };
});

export async function saveCashbackPolicy(restaurantId: string, policy: Omit<CashbackPolicy, "active"> & { active?: boolean }) {
  const next: CashbackPolicy = {
    percentage: policy.percentage,
    minimumOrderAmount: policy.minimumOrderAmount,
    expirationDays: policy.expirationDays,
    active: policy.active ?? true,
  };
  cashbackPolicyStore.set(restaurantId, next);
  return next;
}

export async function listCashbackAccounts(restaurantId: string, filters: Partial<CashbackFilterInput> = {}) {
  const customers = await listCustomersByRestaurant(restaurantId);
  const accounts = getRestaurantAccounts(restaurantId);
  const transactions = getRestaurantTransactions(restaurantId);
  const search = (filters.search ?? "").trim().toLowerCase();

  let items = customers.map((customer) => {
    const account = accounts.get(customer.id);
    return {
      id: account?.id ?? makeId("cbk"),
      restaurantId,
      customerId: customer.id,
      balance: account?.balance ?? 0,
      totalEarned: account?.totalEarned ?? 0,
      totalRedeemed: account?.totalRedeemed ?? 0,
      expiresAt: account?.expiresAt ?? null,
      active: account?.active ?? true,
      createdAt: account?.createdAt ?? new Date(),
      updatedAt: account?.updatedAt ?? new Date(),
      customer,
      transactions: transactions.filter((entry) => entry.customerId === customer.id),
    };
  });

  if (search) {
    items = items.filter((item) => [item.customer.name, item.customer.phone, item.customer.email ?? ""].join(" ").toLowerCase().includes(search));
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

export async function upsertCashbackAccount(restaurantId: string, input: CashbackAccountInput) {
  const accounts = getRestaurantAccounts(restaurantId);
  const current = accounts.get(input.customerId);
  const next: CashbackAccount = {
    id: current?.id ?? makeId("cbk"),
    restaurantId,
    customerId: input.customerId,
    balance: input.balance,
    totalEarned: current?.totalEarned ?? 0,
    totalRedeemed: current?.totalRedeemed ?? 0,
    expiresAt: toDate(input.expiresAt),
    active: input.active,
    createdAt: current?.createdAt ?? new Date(),
    updatedAt: new Date(),
  };
  accounts.set(input.customerId, next);
  return next;
}

export async function recordCashbackTransaction(restaurantId: string, input: CashbackTransactionInput) {
  const accounts = getRestaurantAccounts(restaurantId);
  const current = accounts.get(input.customerId) ?? (await upsertCashbackAccount(restaurantId, {
    customerId: input.customerId,
    balance: 0,
    active: true,
  }));

  const transaction: CashbackTransaction = {
    id: makeId("ctx"),
    cashbackAccountId: input.accountId,
    restaurantId,
    customerId: input.customerId,
    type: input.type,
    amount: input.amount,
    orderId: input.orderId ?? null,
    reservationId: input.reservationId ?? null,
    notes: input.notes ?? null,
    metadata: null,
    createdAt: new Date(),
  };

  const nextBalance =
    input.type === "DEBIT" || input.type === "REDEEM"
      ? Math.max(current.balance - input.amount, 0)
      : current.balance + input.amount;

  accounts.set(input.customerId, {
    ...current,
    balance: nextBalance,
    totalEarned: input.type === "DEBIT" || input.type === "REDEEM" ? current.totalEarned : current.totalEarned + input.amount,
    totalRedeemed: input.type === "DEBIT" || input.type === "REDEEM" ? current.totalRedeemed + input.amount : current.totalRedeemed,
    updatedAt: new Date(),
  });
  getRestaurantTransactions(restaurantId).push(transaction);
  return transaction;
}

export async function redeemCashback(restaurantId: string, customerId: string, amount: number, notes?: string) {
  const accounts = getRestaurantAccounts(restaurantId);
  const account = accounts.get(customerId);
  if (!account) {
    throw new Error("Conta de cashback não encontrada.");
  }
  if (account.balance < amount) {
    throw new Error("Saldo insuficiente.");
  }

  return recordCashbackTransaction(restaurantId, {
    accountId: account.id,
    customerId,
    type: "REDEEM",
    amount,
    notes,
  });
}

export async function listCashbackTransactions(restaurantId: string) {
  return getRestaurantTransactions(restaurantId).slice().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export const getCashbackDashboard = cache(async (restaurantId: string): Promise<CashbackDashboard> => {
  const policy = await getCashbackPolicy(restaurantId);
  const accounts = await listCashbackAccounts(restaurantId, {});
  const transactions = await listCashbackTransactions(restaurantId);

  return {
    policy,
    accounts: accounts.items,
    transactions,
    kpis: {
      accounts: accounts.total,
      activeAccounts: accounts.items.filter((account) => account.active).length,
      balance: accounts.items.reduce((sum, account) => sum + account.balance, 0),
      earned: transactions.filter((transaction) => transaction.type === "CREDIT" || transaction.type === "REFUND").reduce((sum, transaction) => sum + transaction.amount, 0),
      redeemed: transactions.filter((transaction) => transaction.type === "DEBIT" || transaction.type === "REDEEM").reduce((sum, transaction) => sum + transaction.amount, 0),
    },
  };
});
