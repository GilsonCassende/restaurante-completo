import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { APP_CONFIG } from "@/constants";

export const metadata: Metadata = {
  title: "Login",
  description: "Acesso autenticado ao RestaurantPro.",
};

type LoginPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const callbackUrl =
    typeof resolvedSearchParams?.callbackUrl === "string" ? resolvedSearchParams.callbackUrl : "/";

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="flex flex-col justify-center rounded-[2rem] border border-border/60 bg-gradient-to-br from-card via-card to-muted/20 p-8 shadow-[var(--shadow-soft)] backdrop-blur">
          <p className="text-sm font-medium uppercase tracking-[0.35em] text-muted-foreground">
            {APP_CONFIG.name}
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-balance">
            Infraestrutura de acesso pronta para escalar.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
            Autenticação com Auth.js v5, JWT, bcrypt, Prisma e MongoDB Atlas, preparada para multi-tenant.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-muted-foreground">
            <p>
              Credenciais de desenvolvimento: <code>superadmin@restaurantpro.local</code> /{" "}
              <code>Password123!</code>
            </p>
            <p>
              Também existem contas <code>owner</code>, <code>manager</code> e <code>staff</code>{" "}
              com a mesma senha.
            </p>
          </div>
        </section>

        <section className="flex items-center">
          <LoginForm callbackUrl={callbackUrl} />
        </section>
      </div>
    </div>
  );
}
