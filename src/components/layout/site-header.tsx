import Link from "next/link";
import { APP_CONFIG, NAV_LINKS } from "@/constants";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout/app-shell";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <AppShell className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
            RP
          </span>
          <span className="flex flex-col">
            <span className="text-sm font-semibold leading-none">{APP_CONFIG.name}</span>
            <span className="text-xs text-muted-foreground">Foundation phase</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {item.label}
            </Link>
          ))}
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

