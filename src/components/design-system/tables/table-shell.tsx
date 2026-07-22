import { cn } from "@/lib/utils";

type TableShellProps = React.HTMLAttributes<HTMLDivElement> & {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
};

export function TableShell({ className, title, description, actions, children, ...props }: TableShellProps) {
  return (
    <section className={cn("overflow-hidden rounded-3xl border border-border/70 bg-card/90 shadow-[var(--shadow-soft)]", className)} {...props}>
      {(title || description || actions) ? (
        <header className="flex flex-col gap-3 border-b border-border/70 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            {title ? <h2 className="text-lg font-semibold tracking-tight">{title}</h2> : null}
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}
