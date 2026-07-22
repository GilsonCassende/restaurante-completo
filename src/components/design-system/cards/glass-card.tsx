import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function GlassCard({ className, ...props }: React.ComponentProps<typeof Card>) {
  return <Card className={cn("ds-glass border-white/40 bg-white/60 shadow-[var(--shadow-card)]", className)} {...props} />;
}
