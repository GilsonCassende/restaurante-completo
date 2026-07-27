import { cn } from "@/lib/utils";
import { Breadcrumb } from "../navigation";

type PageHeaderProps = {
  title: string;
  description?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, description, breadcrumbs, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("relative overflow-hidden space-y-5 rounded-[2rem] border border-border/70 bg-gradient-to-br from-card via-card to-muted/20 p-6 shadow-[var(--shadow-soft)]", className)}>
      <div className="absolute inset-x-0 top-0 h-px bg-[image:var(--gradient-brand)] opacity-80" />
      {breadcrumbs?.length ? <Breadcrumb items={breadcrumbs} /> : null}
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-balance md:text-4xl">{title}</h1>
          {description ? <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
