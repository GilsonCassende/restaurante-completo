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
    <header className={cn("space-y-4", className)}>
      {breadcrumbs?.length ? <Breadcrumb items={breadcrumbs} /> : null}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
          {description ? <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">{description}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
