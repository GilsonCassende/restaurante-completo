import { cn } from "@/lib/utils";

type LoadingSkeletonProps = {
  variant?: "card" | "list" | "menu" | "dashboard";
  className?: string;
};

function Block({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-muted/70", className)} />;
}

export function LoadingSkeleton({ variant = "card", className }: LoadingSkeletonProps) {
  if (variant === "list") {
    return (
      <div className={cn("grid gap-3", className)}>
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 rounded-2xl border border-border/70 p-4">
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
          <div key={index} className="rounded-3xl border border-border/70 p-4">
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
      <div className={cn("grid gap-4 md:grid-cols-2 xl:grid-cols-4", className)}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-3xl border border-border/70 p-5">
            <Block className="h-4 w-24" />
            <Block className="mt-3 h-8 w-20" />
            <Block className="mt-4 h-3 w-32" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("rounded-3xl border border-border/70 p-5", className)}>
      <Block className="h-56 w-full" />
      <div className="mt-4 space-y-3">
        <Block className="h-6 w-2/3" />
        <Block className="h-4 w-1/2" />
      </div>
    </div>
  );
}
