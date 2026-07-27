import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type RestaurantCardProps = {
  name: string;
  subtitle?: string;
  status?: string;
  description?: string;
  logo?: React.ReactNode;
  className?: string;
};

export function RestaurantCard({ name, subtitle, status, description, logo, className }: RestaurantCardProps) {
  return (
    <Card className={cn("overflow-hidden border-border/70 bg-gradient-to-br from-card via-card to-muted/20 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]", className)}>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary shadow-[var(--shadow-soft)]">
            {logo ?? <span className="text-lg font-semibold">{name.slice(0, 1)}</span>}
          </div>
          <div>
            <CardTitle className="text-xl">{name}</CardTitle>
            {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
        </div>
        {status ? <Badge variant="secondary">{status}</Badge> : null}
      </CardHeader>
      {description ? <CardContent className="text-sm leading-6 text-muted-foreground">{description}</CardContent> : null}
    </Card>
  );
}
