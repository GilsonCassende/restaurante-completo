import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type InfoCardProps = {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
};

export function InfoCard({ title, description, icon, action, className }: InfoCardProps) {
  return (
    <Card className={cn("border-border/70 bg-card/90 shadow-[var(--shadow-soft)]", className)}>
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
            {icon}
          </div>
          {action}
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm leading-6 text-muted-foreground">{description}</CardContent>
    </Card>
  );
}
