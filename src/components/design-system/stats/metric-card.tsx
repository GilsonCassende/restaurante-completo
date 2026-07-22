import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: string;
  detail?: string;
  icon?: React.ReactNode;
  className?: string;
};

export function MetricCard({ label, value, detail, icon, className }: MetricCardProps) {
  return (
    <Card className={cn("border-border/70 bg-card/90 shadow-[var(--shadow-soft)]", className)}>
      <CardContent className="flex items-start justify-between gap-4 p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
          {detail ? <p className="mt-2 text-sm text-muted-foreground">{detail}</p> : null}
        </div>
        {icon ? <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">{icon}</div> : null}
      </CardContent>
    </Card>
  );
}
