import { cn } from "@/lib/utils";

type DialogSurfaceProps = React.HTMLAttributes<HTMLDivElement> & {
  title?: string;
  description?: string;
};

export function DialogSurface({ className, title, description, children, ...props }: DialogSurfaceProps) {
  return (
    <div className={cn("w-full max-w-lg rounded-3xl border border-border/70 bg-card p-6 shadow-[var(--shadow-card)] backdrop-blur max-h-[90vh] overflow-y-auto", className)} {...props}>
      {title ? <h2 className="text-xl font-semibold tracking-tight">{title}</h2> : null}
      {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
      <div className="mt-5">{children}</div>
    </div>
  );
}
