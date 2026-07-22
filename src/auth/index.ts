import Credentials from "next-auth/providers/credentials";
import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import { verifyCredentials } from "./credentials";
import { env } from "@/lib/env";
import { ROLES } from "@/permissions";
import type { Role } from "@/types";
import type { AuthenticatedUser } from "./credentials";

const providers: NextAuthConfig["providers"] = [
  Credentials({
    name: "Email e senha",
    credentials: {
      email: { label: "E-mail", type: "email" },
      password: { label: "Senha", type: "password" },
    },
    async authorize(credentials): Promise<AuthenticatedUser | null> {
      const email = typeof credentials?.email === "string" ? credentials.email : "";
      const password = typeof credentials?.password === "string" ? credentials.password : "";

      if (!email || !password) {
        return null;
      }

      return verifyCredentials({
        email,
        password,
      });
    },
  }),
];

export const authConfig = {
  trustHost: true,
  secret: env.AUTH_SECRET ?? "restaurantpro-dev-secret",
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.restaurantId = user.restaurantId;
        token.role = user.role;
        token.active = user.active;
        token.name = user.name ?? "";
        token.email = user.email ?? "";
        token.picture = user.image ?? undefined;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.id === "string" ? token.id : "";
        session.user.restaurantId =
          typeof token.restaurantId === "string" ? token.restaurantId : "";
        session.user.role = (typeof token.role === "string" ? token.role : ROLES.STAFF) as Role;
        session.user.active = typeof token.active === "boolean" ? token.active : false;
        session.user.name = token.name ?? session.user.name ?? "";
        session.user.email = token.email ?? session.user.email ?? "";
        session.user.image = token.picture ?? session.user.image ?? null;
      }

      return session;
    },
  },
} satisfies NextAuthConfig;

const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

export { handlers, auth, signIn, signOut };
