import { AlertTriangle, CheckCircle2, CloudOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FeedbackStateProps = {
  variant: "loading" | "error" | "success" | "offline";
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

const icons = {
  loading: Loader2,
  error: AlertTriangle,
  success: CheckCircle2,
  offline: CloudOff,
} as const;

export function FeedbackState({ variant, title, description, actionLabel, onAction, className }: FeedbackStateProps) {
  const Icon = icons[variant];

  return (
    <div className={cn("flex flex-col items-center justify-center rounded-3xl border border-border/70 bg-card/90 px-6 py-10 text-center", className)}>
      <div className={cn("mb-4 flex h-14 w-14 items-center justify-center rounded-2xl", variant === "success" ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/10 text-primary")}>
        <Icon className={cn("h-6 w-6", variant === "loading" && "animate-spin")} />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {actionLabel && onAction ? (
        <Button type="button" className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
