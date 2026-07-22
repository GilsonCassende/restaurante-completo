import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type FeatureCardProps = {
  icon?: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  className?: string;
};

export function FeatureCard({ icon, title, description, badge, className }: FeatureCardProps) {
  return (
    <Card className={cn("group overflow-hidden border-border/70 bg-gradient-to-br from-card to-muted/30 shadow-[var(--shadow-soft)]", className)}>
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {icon ?? <ArrowRight className="h-5 w-5" />}
          </div>
          {badge ? <Badge variant="secondary" className="rounded-full">{badge}</Badge> : null}
        </div>
        <div className="space-y-2">
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="text-sm leading-6">{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pb-6">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
      </CardContent>
    </Card>
  );
}
