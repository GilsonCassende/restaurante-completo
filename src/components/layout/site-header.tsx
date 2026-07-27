"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_CONFIG, NAV_LINKS } from "@/constants";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout/app-shell";
import { cn } from "@/lib/utils";

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="relative sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="absolute inset-x-0 top-0 h-px bg-[image:var(--gradient-brand)] opacity-80" />
      <AppShell className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[image:var(--gradient-brand)] text-sm font-semibold text-white shadow-[var(--shadow-glow)]">
            RP
          </span>
          <span className="flex flex-col">
            <span className="text-sm font-semibold leading-none">{APP_CONFIG.name}</span>
            <span className="text-xs text-muted-foreground">Design system premium</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {NAV_LINKS.map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-3 py-2 text-sm transition-all duration-200",
                  active
                    ? "bg-primary/10 text-primary shadow-[var(--shadow-soft)]"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="secondary" className="hidden sm:inline-flex">
            <Link href="/api/health">Health</Link>
          </Button>
        </div>
      </AppShell>
    </header>
  );
}
