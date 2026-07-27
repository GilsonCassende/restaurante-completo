import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function GlassCard({ className, ...props }: React.ComponentProps<typeof Card>) {
  return <Card className={cn("ds-glass shadow-[var(--shadow-card)]", className)} {...props} />;
}
