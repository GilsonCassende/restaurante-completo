import { cn } from "@/lib/utils";

type ActionMenuProps = React.HTMLAttributes<HTMLDivElement> & {
  label?: string;
};

export function ActionMenu({ className, label, children, ...props }: ActionMenuProps) {
  return (
    <div className={cn("min-w-56 rounded-2xl border border-border/70 bg-popover p-2 shadow-[var(--shadow-card)]", className)} {...props}>
      {label ? <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</p> : null}
      <div className="grid gap-1">{children}</div>
    </div>
  );
}
