import { cn } from "@/lib/utils";

type ActionMenuProps = React.HTMLAttributes<HTMLDivElement> & {
  label?: string;
};

export function ActionMenu({ className, label, children, ...props }: ActionMenuProps) {
  return (
    <div className={cn("min-w-60 max-w-[22rem] rounded-[1.25rem] border border-border/70 bg-popover/95 p-2 shadow-[var(--shadow-card)] backdrop-blur", className)} {...props}>
      {label ? <p className="px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</p> : null}
      <div className="grid gap-1">{children}</div>
    </div>
  );
}
