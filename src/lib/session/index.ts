import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ROLES, hasRoleAccess } from "@/permissions";
import { findRestaurantById, findUserById } from "@/prisma";
import { recordPermissionEvent } from "@/lib/production";
import type { Restaurant, Role, User } from "@/types";

export type CurrentUserWithRestaurant = User & {
  restaurant: Restaurant;
};

export const getCurrentSession = cache(async () => {
  return (await auth()) as { user?: User } | null;
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
