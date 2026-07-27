import { cn } from "@/lib/utils";

type TimelineItem = {
  title: string;
  description: string;
  meta?: string;
};

type TimelineProps = {
  items: TimelineItem[];
  className?: string;
};

export function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn("grid gap-4", className)}>
      {items.map((item, index) => (
        <div key={`${item.title}-${index}`} className="relative pl-6">
          <span className="absolute left-0 top-2 h-3 w-3 rounded-full border border-primary/30 bg-primary shadow-[0_0_0_6px_hsl(var(--primary)/0.12)]" />
          {index < items.length - 1 ? <span className="absolute left-1.5 top-5 h-full w-px bg-border/80" /> : null}
          <div className="space-y-1 rounded-[1.5rem] border border-border/70 bg-gradient-to-br from-card via-card to-muted/20 p-4 shadow-[var(--shadow-soft)]">
            {item.meta ? <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{item.meta}</p> : null}
            <h3 className="font-medium">{item.title}</h3>
            <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
