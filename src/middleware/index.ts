import { ROLES } from "@/permissions";
import type { Role } from "@/types";

const PUBLIC_PATHS = ["/", "/login", "/unauthorized"] as const;

const PROTECTED_ROUTE_RULES: Array<{
  prefix: string;
  roles: Role[];
}> = [
  {
    prefix: "/admin",
    roles: [ROLES.SUPER_ADMIN],
  },
  {
    prefix: "/settings",
    roles: [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER],
  },
  {
    prefix: "/menu",
    roles: [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.STAFF],
  },
  {
    prefix: "/cart",
    roles: [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.STAFF],
  },
  {
    prefix: "/checkout",
    roles: [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.STAFF],
  },
  {
    prefix: "/dashboard/orders",
    roles: [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.STAFF],
  },
  {
    prefix: "/dashboard/admin",
    roles: [ROLES.SUPER_ADMIN],
  },
  {
    prefix: "/dashboard/subscriptions",
    roles: [ROLES.SUPER_ADMIN],
  },
  {
    prefix: "/dashboard/plans",
    roles: [ROLES.SUPER_ADMIN],
  },
  {
    prefix: "/dashboard/delivery",
    roles: [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.STAFF, ROLES.DRIVER],
  },
  {
    prefix: "/dashboard/drivers",
    roles: [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.STAFF, ROLES.DRIVER],
  },
  {
    prefix: "/dashboard/tracking",
    roles: [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.STAFF, ROLES.DRIVER],
  },
  {
    prefix: "/dashboard",
    roles: [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.STAFF, ROLES.DRIVER],
  },
  {
    prefix: "/app",
    roles: [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.STAFF],
  },
];

export function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function getRouteAccessRule(pathname: string) {
  return PROTECTED_ROUTE_RULES.find((rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)) ?? null;
}

export function getLoginRedirect(pathname: string) {
  const next = pathname === "/" ? "/" : pathname;
  return `/login?callbackUrl=${encodeURIComponent(next)}`;
}
