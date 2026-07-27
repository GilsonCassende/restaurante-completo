import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatisticCardProps = {
  label: string;
  value: string;
  delta?: string;
  icon?: React.ReactNode;
  className?: string;
};

export function StatisticCard({ label, value, delta, icon, className }: StatisticCardProps) {
  return (
    <Card className={cn("group relative overflow-hidden border-border/70 bg-gradient-to-br from-card via-card to-muted/20 shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]", className)}>
      <div className="absolute inset-x-0 top-0 h-px bg-[image:var(--gradient-brand)] opacity-70" />
      <CardContent className="relative flex items-start justify-between gap-4 p-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          {delta ? <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{delta}</p> : null}
        </div>
        {icon ? <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary">{icon}</div> : null}
      </CardContent>
    </Card>
  );
}
