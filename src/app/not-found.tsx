import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">
          RestaurantPro
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Página não encontrada</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          A rota solicitada ainda não faz parte desta fase da fundação do projeto.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Voltar para o início</Link>
        </Button>
      </div>
    </div>
  );
}

