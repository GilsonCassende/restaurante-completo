import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
};

export function EmptyState({ title, description, actionLabel, onAction, icon, className }: EmptyStateProps) {
  return (
    <div className={cn("relative flex flex-col items-center justify-center overflow-hidden rounded-[2rem] border border-dashed border-border/80 bg-gradient-to-br from-card via-card to-muted/20 px-6 py-12 text-center shadow-[var(--shadow-soft)]", className)}>
      <div className="absolute inset-x-0 top-0 h-px bg-[image:var(--gradient-brand)] opacity-50" />
      {icon ? <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border/70 bg-primary/10 text-primary">{icon}</div> : null}
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {actionLabel && onAction ? (
        <Button type="button" variant="outline" className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
