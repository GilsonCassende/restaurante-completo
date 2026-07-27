import { cn } from "@/lib/utils";

type LoadingSkeletonProps = {
  variant?: "card" | "list" | "menu" | "dashboard";
  className?: string;
};

function Block({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-gradient-to-r from-muted/70 via-muted/95 to-muted/70", className)} />;
}

export function LoadingSkeleton({ variant = "card", className }: LoadingSkeletonProps) {
  if (variant === "list") {
    return (
      <div className={cn("grid gap-3", className)}>
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="relative flex items-center gap-3 overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/80 p-4 shadow-[var(--shadow-soft)]">
            <div className="absolute inset-x-0 top-0 h-px bg-[image:var(--gradient-brand)] opacity-50" />
            <Block className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Block className="h-4 w-1/2" />
              <Block className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "menu") {
    return (
      <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", className)}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="relative overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/80 p-4 shadow-[var(--shadow-soft)]">
            <div className="absolute inset-x-0 top-0 h-px bg-[image:var(--gradient-brand)] opacity-50" />
            <Block className="h-44 w-full" />
            <div className="mt-4 space-y-3">
              <Block className="h-5 w-2/3" />
              <Block className="h-4 w-full" />
              <Block className="h-4 w-5/6" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "dashboard") {
    return (
      <div className={cn("grid gap-4 xl:grid-cols-[repeat(4,minmax(0,1fr))]", className)}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="relative overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/80 p-5 shadow-[var(--shadow-soft)]">
            <div className="absolute inset-x-0 top-0 h-px bg-[image:var(--gradient-brand)] opacity-50" />
            <Block className="h-4 w-24" />
            <Block className="mt-3 h-8 w-20" />
            <Block className="mt-4 h-3 w-32" />
          </div>
        ))}
        <div className="relative overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/80 p-5 shadow-[var(--shadow-soft)] xl:col-span-4">
          <div className="absolute inset-x-0 top-0 h-px bg-[image:var(--gradient-brand)] opacity-50" />
          <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="space-y-3">
              <Block className="h-4 w-40" />
              <Block className="h-24 w-full" />
            </div>
            <div className="space-y-3">
              <Block className="h-4 w-28" />
              <Block className="h-16 w-full" />
              <Block className="h-16 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/80 p-5 shadow-[var(--shadow-soft)]", className)}>
      <div className="absolute inset-x-0 top-0 h-px bg-[image:var(--gradient-brand)] opacity-50" />
      <Block className="h-56 w-full" />
      <div className="mt-4 space-y-3">
        <Block className="h-6 w-2/3" />
        <Block className="h-4 w-1/2" />
      </div>
    </div>
  );
}
