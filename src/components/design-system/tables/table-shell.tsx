import { cn } from "@/lib/utils";

type TableShellProps = React.HTMLAttributes<HTMLDivElement> & {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
};

export function TableShell({ className, title, description, actions, children, ...props }: TableShellProps) {
  return (
    <section className={cn("overflow-hidden rounded-[1.75rem] border border-border/70 bg-gradient-to-br from-card via-card to-muted/15 shadow-[var(--shadow-soft)]", className)} {...props}>
      {(title || description || actions) ? (
        <header className="flex flex-col gap-3 border-b border-border/70 bg-background/35 p-5 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            {title ? <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2> : null}
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className="overflow-x-auto p-5 [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-muted/30 [&_thead]:bg-background/40 [&_thead_th]:bg-background/40 [&_thead_th]:backdrop-blur">
        {children}
      </div>
    </section>
  );
}
