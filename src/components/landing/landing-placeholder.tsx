import { ImageOff, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type LandingPlaceholderProps = {
  title: string;
  description: string;
  className?: string;
  compact?: boolean;
};

export function LandingPlaceholder({ title, description, className, compact = false }: LandingPlaceholderProps) {
  return (
    <div
      className={cn(
        "relative flex h-full min-h-[16rem] w-full overflow-hidden rounded-[1.75rem] border border-border/70 bg-[image:var(--gradient-brand-soft)] p-6 shadow-[var(--shadow-soft)]",
        className
      )}
    >
      <div className="absolute inset-0 ds-surface-grid opacity-20" />
      <div className="relative flex h-full w-full flex-col justify-between gap-6">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-background/75 text-primary shadow-[var(--shadow-soft)] backdrop-blur">
            <ImageOff className="h-5 w-5" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Placeholder premium</span>
        </div>
        <div className={cn("space-y-3", compact && "max-w-sm")}>
          <p className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</p>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>Conteúdo ausente substituído por um bloco elegante</span>
        </div>
      </div>
    </div>
  );
}

