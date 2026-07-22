import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type PricingCardProps = {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

export function PricingCard({
  name,
  price,
  description,
  features,
  highlighted,
  badge,
  actionLabel = "Começar agora",
  onAction,
  className,
}: PricingCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden border-border/70 bg-card/95 shadow-[var(--shadow-soft)]",
        highlighted && "border-primary/40 shadow-[var(--shadow-glow)]",
        className
      )}
    >
      {highlighted ? <div className="absolute inset-x-0 top-0 h-1 bg-[image:var(--gradient-brand)]" /> : null}
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-xl">{name}</CardTitle>
          {badge ? <Badge variant="secondary">{badge}</Badge> : null}
        </div>
        <div>
          <p className="text-4xl font-semibold tracking-tight">{price}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {features.map((feature) => (
          <div key={feature} className="flex items-center gap-3 text-sm">
            <Check className="h-4 w-4 text-emerald-600" />
            <span>{feature}</span>
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <Button className="w-full" variant={highlighted ? "default" : "outline"} onClick={onAction}>
          {actionLabel}
        </Button>
      </CardFooter>
    </Card>
  );
}
