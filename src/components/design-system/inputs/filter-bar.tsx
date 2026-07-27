import { cn } from "@/lib/utils";

type FilterBarProps = React.HTMLAttributes<HTMLDivElement> & {
  label?: string;
  actions?: React.ReactNode;
};

export function FilterBar({ className, label, actions, children, ...props }: FilterBarProps) {
  return (
    <div className={cn("relative flex flex-col gap-4 overflow-hidden rounded-[1.75rem] border border-border/70 bg-gradient-to-br from-card via-card to-muted/20 p-4 shadow-[var(--shadow-soft)] backdrop-blur md:flex-row md:items-center md:justify-between", className)} {...props}>
      <div className="absolute inset-x-0 top-0 h-px bg-[image:var(--gradient-brand)] opacity-60" />
      <div className="space-y-2">
        {label ? <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</p> : null}
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
