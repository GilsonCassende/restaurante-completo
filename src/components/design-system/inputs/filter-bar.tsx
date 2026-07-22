import { cn } from "@/lib/utils";

type FilterBarProps = React.HTMLAttributes<HTMLDivElement> & {
  label?: string;
  actions?: React.ReactNode;
};

export function FilterBar({ className, label, actions, children, ...props }: FilterBarProps) {
  return (
    <div className={cn("flex flex-col gap-3 rounded-3xl border border-border/70 bg-card/90 p-4 shadow-[var(--shadow-soft)] md:flex-row md:items-center md:justify-between", className)} {...props}>
      <div className="space-y-1">
        {label ? <p className="text-sm font-medium text-foreground">{label}</p> : null}
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
