import { cache } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { ROLES, hasRoleAccess } from "@/permissions";
import { findRestaurantById, findUserById } from "@/prisma";
import { recordPermissionEvent } from "@/lib/production";
import type { Restaurant, Role, User } from "@/types";

export type CurrentUserWithRestaurant = User & {
  restaurant: Restaurant;
};

export const getCurrentSession = cache(async () => {
  const requestHeaders = await headers();
  const sessionResponse = await fetch(new URL("/api/auth/session", process.env.AUTH_URL ?? "http://localhost:3000"), {
    headers: {
      cookie: requestHeaders.get("cookie") ?? "",
    },
    cache: "no-store",
  });

  if (!sessionResponse.ok) {
    return null;
  }

  return (await sessionResponse.json()) as { user?: User } | null;
});

export const getCurrentUser = cache(async (): Promise<CurrentUserWithRestaurant | null> => {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    return null;
  }

  const user = await findUserById(session.user.id);

  if (!user || !user.active) {
    return null;
  }

  const restaurant = await findRestaurantById(user.restaurantId);

  if (!restaurant) {
    return null;
  }

  if (!restaurant.active && user.role !== ROLES.SUPER_ADMIN) {
    return null;
  }

  return {
    ...user,
    restaurant,
  };
});

export const getCurrentRestaurant = cache(async () => {
  const user = await getCurrentUser();
  return user?.restaurant ?? null;
});

export async function requireAuthenticatedUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireRole(allowedRoles: Role | readonly Role[]) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  const user = await requireAuthenticatedUser();

  const allowed = hasRoleAccess(user.role, roles);
  recordPermissionEvent({
    tenantId: user.restaurantId,
    restaurantId: user.restaurantId,
    userId: user.id,
    action: "require_role",
    allowed,
    resource: roles.join(","),
  });

  if (!allowed) {
    redirect("/unauthorized");
  }

  return user;
}
