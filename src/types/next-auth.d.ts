import type { DefaultSession } from "next-auth";
import type { Role } from "./domain";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      restaurantId: string;
      role: Role;
      active: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    restaurantId: string;
    role: Role;
    active: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    restaurantId?: string;
    role?: Role;
    active?: boolean;
  }
}
