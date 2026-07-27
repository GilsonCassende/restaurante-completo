import { AppShell } from "@/components/layout/app-shell";
import { APP_CONFIG } from "@/constants";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-background/70">
      <AppShell className="flex flex-col gap-2 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>{APP_CONFIG.name}</p>
        <p>Estrutura inicial pronta para escalar por domínio.</p>
      </AppShell>
    </footer>
  );
}
