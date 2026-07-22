import { ROLES } from "@/permissions";
import { ensureDevelopmentSeed, findRestaurantById, findUserByEmail, verifyPassword } from "@/prisma";
import { recordLoginEvent } from "@/lib/production";
import type { Role } from "@/types";

export type AuthenticatedUser = {
  id: string;
  restaurantId: string;
  name: string;
  email: string;
  image: string | null;
  role: Role;
  active: boolean;
};

function isRestaurantAccessible(role: Role, active: boolean) {
  return active || role === ROLES.SUPER_ADMIN;
}

export async function verifyCredentials(input: { email: string; password: string }) {
  await ensureDevelopmentSeed();

  const user = await findUserByEmail(input.email);
  if (!user || !user.active) {
    recordLoginEvent({
      tenantId: null,
      restaurantId: null,
      email: input.email,
      success: false,
      reason: "USER_NOT_FOUND",
    });
    return null;
  }

  const passwordIsValid = await verifyPassword(input.password, user.password);
  if (!passwordIsValid) {
    recordLoginEvent({
      tenantId: user.restaurantId,
      restaurantId: user.restaurantId,
      email: input.email,
      success: false,
      reason: "INVALID_PASSWORD",
    });
    return null;
  }

  const restaurant = await findRestaurantById(user.restaurantId);
  if (!restaurant || !isRestaurantAccessible(user.role, restaurant.active)) {
    recordLoginEvent({
      tenantId: user.restaurantId,
      restaurantId: user.restaurantId,
      email: input.email,
      success: false,
      reason: "RESTAURANT_INACTIVE",
    });
    return null;
  }

  recordLoginEvent({
    tenantId: user.restaurantId,
    restaurantId: user.restaurantId,
    email: input.email,
    success: true,
  });

  return {
    id: user.id,
    restaurantId: user.restaurantId,
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
    active: user.active,
  } satisfies AuthenticatedUser;
}
