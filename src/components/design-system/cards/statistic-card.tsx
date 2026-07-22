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
    <Card className={cn("overflow-hidden border-border/70 bg-card/90 shadow-[var(--shadow-soft)]", className)}>
      <CardContent className="flex items-start justify-between gap-4 p-6">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          {delta ? <p className="text-xs text-emerald-600 dark:text-emerald-400">{delta}</p> : null}
        </div>
        {icon ? <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">{icon}</div> : null}
      </CardContent>
    </Card>
  );
}
