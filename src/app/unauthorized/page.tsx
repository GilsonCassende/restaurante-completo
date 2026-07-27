import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Acesso negado",
  description: "Você não tem permissão para acessar esta área.",
};

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md rounded-[2rem] border border-border/60 bg-gradient-to-br from-card via-card to-muted/20 p-8 text-center shadow-[var(--shadow-soft)] backdrop-blur">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">
          RestaurantPro
        </p>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">Acesso negado</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Sua conta não tem permissão para acessar esta rota.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Voltar ao início</Link>
        </Button>
      </div>
    </div>
  );
}
