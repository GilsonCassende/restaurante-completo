import { cache } from "react";
import { listCustomersByRestaurant } from "@/prisma";
import type { Coupon, CouponUsage } from "@/types";
import type { CouponFilterInput, CouponInput, CouponUsageInput } from "@/schemas";

export type CouponDashboard = {
  coupons: Coupon[];
  usages: CouponUsage[];
  kpis: {
    coupons: number;
    activeCoupons: number;
    usedCoupons: number;
    totalDiscount: number;
    birthdayCoupons: number;
  };
};

const couponStore = new Map<string, Coupon[]>();
const couponUsageStore = new Map<string, CouponUsage[]>();

function getCoupons(restaurantId: string) {
  const current = couponStore.get(restaurantId);
  if (current) return current;
  const store: Coupon[] = [];
  couponStore.set(restaurantId, store);
  return store;
}

function getCouponUsages(restaurantId: string) {
  const current = couponUsageStore.get(restaurantId);
  if (current) return current;
  const store: CouponUsage[] = [];
  couponUsageStore.set(restaurantId, store);
  return store;
}

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeCode(value: string) {
  return value.trim().toUpperCase();
}

function toDate(value: string | null | undefined) {
  if (!value) return null;
  return new Date(value);
}

function isCouponActive(coupon: Coupon, now = new Date()) {
  if (!coupon.active) return false;
  if (coupon.startsAt && coupon.startsAt > now) return false;
  if (coupon.endsAt && coupon.endsAt < now) return false;
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) return false;
  return true;
}

export const getCouponDashboard = cache(async (restaurantId: string): Promise<CouponDashboard> => {
  const coupons = getCoupons(restaurantId);
  const usages = getCouponUsages(restaurantId);

  return {
    coupons: coupons.slice().sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
    usages: usages.slice().sort((a, b) => b.usedAt.getTime() - a.usedAt.getTime()),
    kpis: {
      coupons: coupons.length,
      activeCoupons: coupons.filter((coupon) => isCouponActive(coupon)).length,
      usedCoupons: usages.length,
      totalDiscount: usages.reduce((sum, usage) => sum + usage.discountAmount, 0),
      birthdayCoupons: coupons.filter((coupon) => coupon.type === "BIRTHDAY").length,
    },
  };
});

export async function listCoupons(restaurantId: string, filters: Partial<CouponFilterInput> = {}) {
  const dashboard = await getCouponDashboard(restaurantId);
  const search = (filters.search ?? "").trim().toLowerCase();
  let items = dashboard.coupons;

  if (filters.type && filters.type !== "all") {
    items = items.filter((coupon) => coupon.type === filters.type);
  }
  if (search) {
    items = items.filter((coupon) => [coupon.code, coupon.name].join(" ").toLowerCase().includes(search));
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

export async function createCoupon(restaurantId: string, input: CouponInput) {
  const store = getCoupons(restaurantId);
  const code = normalizeCode(input.code);
  if (store.some((coupon) => coupon.code === code)) {
    throw new Error("Cupom já existe.");
  }

  const coupon: Coupon = {
    id: makeId("coupon"),
    restaurantId,
    segmentId: input.segmentId ?? null,
    code,
    name: input.name,
    type: input.type,
    value: input.value,
    minimumOrderAmount: input.minimumOrderAmount ?? null,
    maxUses: input.maxUses ?? null,
    maxUsesPerCustomer: input.maxUsesPerCustomer ?? null,
    usedCount: 0,
    startsAt: toDate(input.startsAt),
    endsAt: toDate(input.endsAt),
    stackable: input.stackable,
    active: input.active,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  store.push(coupon);
  return coupon;
}

export async function updateCoupon(restaurantId: string, id: string, input: Partial<CouponInput>) {
  const store = getCoupons(restaurantId);
  const current = store.find((coupon) => coupon.id === id) ?? null;
  if (!current) return null;
  const updated: Coupon = {
    ...current,
    segmentId: input.segmentId ?? current.segmentId,
    code: input.code ? normalizeCode(input.code) : current.code,
    name: input.name ?? current.name,
    type: input.type ?? current.type,
    value: input.value ?? current.value,
    minimumOrderAmount: input.minimumOrderAmount ?? current.minimumOrderAmount,
    maxUses: input.maxUses ?? current.maxUses,
    maxUsesPerCustomer: input.maxUsesPerCustomer ?? current.maxUsesPerCustomer,
    startsAt: input.startsAt === undefined ? current.startsAt : toDate(input.startsAt),
    endsAt: input.endsAt === undefined ? current.endsAt : toDate(input.endsAt),
    stackable: input.stackable ?? current.stackable,
    active: input.active ?? current.active,
    updatedAt: new Date(),
  };
  store[store.findIndex((coupon) => coupon.id === id)] = updated;
  return updated;
}

export async function findCouponByCode(restaurantId: string, code: string) {
  return getCoupons(restaurantId).find((coupon) => coupon.code === normalizeCode(code)) ?? null;
}

export async function recordCouponUsage(restaurantId: string, input: CouponUsageInput) {
  const store = getCoupons(restaurantId);
  const usages = getCouponUsages(restaurantId);
  const coupon = store.find((item) => item.id === input.couponId) ?? null;
  if (!coupon) throw new Error("Cupom não encontrado.");
  if (!isCouponActive(coupon)) throw new Error("Cupom inativo.");

  const customerUsages = usages.filter((usage) => usage.couponId === coupon.id && usage.customerId === (input.customerId ?? null));
  if (coupon.maxUsesPerCustomer !== null && customerUsages.length >= coupon.maxUsesPerCustomer) {
    throw new Error("Limite de uso por cliente atingido.");
  }

  const usage: CouponUsage = {
    id: makeId("usage"),
    couponId: coupon.id,
    restaurantId,
    customerId: input.customerId ?? null,
    orderId: input.orderId ?? null,
    reservationId: input.reservationId ?? null,
    usedAt: new Date(),
    discountAmount: input.discountAmount,
    metadata: null,
  };

  coupon.usedCount += 1;
  coupon.updatedAt = new Date();
  usages.push(usage);
  return usage;
}

export async function isCouponUsable(restaurantId: string, couponCode: string, customerId?: string | null) {
  const coupon = await findCouponByCode(restaurantId, couponCode);
  if (!coupon || !isCouponActive(coupon)) {
    return { ok: false, message: "Cupom inválido." };
  }

  if (customerId) {
    const customerUsages = getCouponUsages(restaurantId).filter((usage) => usage.couponId === coupon.id && usage.customerId === customerId);
    if (coupon.maxUsesPerCustomer !== null && customerUsages.length >= coupon.maxUsesPerCustomer) {
      return { ok: false, message: "Cupom já foi usado pelo cliente." };
    }
  }

  return { ok: true, coupon };
}

export async function validateCouponOrder(restaurantId: string, couponCode: string, orderTotal: number, customerId?: string | null) {
  const result = await isCouponUsable(restaurantId, couponCode, customerId);
  if (!result.ok) return result;
  const coupon = result.coupon!;
  if (coupon.minimumOrderAmount && orderTotal < coupon.minimumOrderAmount) {
    return { ok: false, message: "Pedido abaixo do valor mínimo." };
  }
  return { ok: true, coupon };
}

export async function getCouponAudience(restaurantId: string) {
  return listCustomersByRestaurant(restaurantId);
}
