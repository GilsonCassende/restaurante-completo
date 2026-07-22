import type { Role } from "@/types";

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  OWNER: "OWNER",
  MANAGER: "MANAGER",
  STAFF: "STAFF",
  DRIVER: "DRIVER",
} as const satisfies Record<Role, Role>;

export const ROLE_PRIORITY: Record<Role, number> = {
  SUPER_ADMIN: 4,
  OWNER: 3,
  MANAGER: 2,
  STAFF: 1,
  DRIVER: 1,
};

export const ROLE_PERMISSIONS = {
  manage_all_restaurants: [ROLES.SUPER_ADMIN],
  manage_current_restaurant: [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER],
  view_current_restaurant: [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.STAFF, ROLES.DRIVER],
} as const;

export const ROLE_HIERARCHY: Role[] = [
  ROLES.STAFF,
  ROLES.DRIVER,
  ROLES.MANAGER,
  ROLES.OWNER,
  ROLES.SUPER_ADMIN,
];

export function hasRoleAccess(currentRole: Role, allowedRoles: readonly Role[]) {
  return allowedRoles.includes(currentRole);
}

export function isRoleAtLeast(currentRole: Role, minimumRole: Role) {
  return ROLE_PRIORITY[currentRole] >= ROLE_PRIORITY[minimumRole];
}
