import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type HighlightCardProps = {
  title: string;
  description: string;
  accent?: string;
  className?: string;
};

export function HighlightCard({ title, description, accent = "from-primary/15 via-secondary/10 to-transparent", className }: HighlightCardProps) {
  return (
    <Card className={cn("overflow-hidden border-border/70 bg-card/90 shadow-[var(--shadow-soft)]", className)}>
      <div className={cn("h-1 w-full bg-gradient-to-r", accent)} />
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm leading-6 text-muted-foreground">{description}</CardContent>
    </Card>
  );
}
