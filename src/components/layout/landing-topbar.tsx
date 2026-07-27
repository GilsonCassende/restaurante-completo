import Link from "next/link";
import { LogIn, MenuSquare, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const NAV_ITEMS = [
  { label: "Cardápio", href: "#cardapio" },
  { label: "Galeria", href: "#galeria" },
  { label: "Contato", href: "#localizacao" },
];

type LandingTopBarProps = {
  restaurantName: string;
};

export function LandingTopBar({ restaurantName }: LandingTopBarProps) {
  return (
    <header className="relative sticky top-0 z-50 border-b border-border/60 bg-background/78 backdrop-blur-xl">
      <div className="absolute inset-x-0 top-0 h-px bg-[image:var(--gradient-brand)] opacity-90" />
      <AppShell className="flex min-h-16 items-center gap-3 py-3">
        <Link href="#topo" className="group flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[image:var(--gradient-brand)] text-sm font-semibold text-white shadow-[var(--shadow-glow)] transition-transform duration-200 group-hover:scale-105">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="hidden min-[420px]:flex min-[420px]:flex-col">
            <span className="text-sm font-semibold leading-none">{restaurantName}</span>
            <span className="text-xs text-muted-foreground">Experiência premium</span>
          </span>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <Button key={item.href} asChild variant="ghost" className="rounded-full px-4 text-sm text-muted-foreground hover:text-foreground">
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Badge variant="secondary" className="hidden rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.22em] md:inline-flex">
            Menu aberto
          </Badge>
          <Button asChild variant="outline" className="hidden sm:inline-flex">
            <Link href="/reservas">
              <MenuSquare className="h-4 w-4" />
              Reservar
            </Link>
          </Button>
          <Button asChild className="shadow-[var(--shadow-glow)]">
            <Link href="/login">
              <LogIn className="h-4 w-4" />
              Entrar
            </Link>
          </Button>
        </div>
      </AppShell>
    </header>
  );
}
