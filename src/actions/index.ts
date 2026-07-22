export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

export * from "./auth";
export * from "./category";
export * from "./theme";
export * from "./settings";
export * from "./order";
export * from "./product";
export * from "./table";
export * from "./reservation";
export * from "./crm";
export * from "./loyalty";
export * from "./coupons";
export * from "./cashback";
export * from "./analytics";
export * from "./reports";
export * from "./delivery";
export * from "./drivers";
export * from "./tracking";
export * from "./subscriptions";
export * from "./plans";
export * from "./licenses";
export * from "./admin";
