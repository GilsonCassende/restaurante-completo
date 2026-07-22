import { cn } from "@/lib/utils";

type DrawerSurfaceProps = React.HTMLAttributes<HTMLDivElement> & {
  side?: "bottom" | "right";
};

export function DrawerSurface({ className, side = "bottom", children, ...props }: DrawerSurfaceProps) {
  return (
    <div
      className={cn(
        "rounded-t-3xl border border-border/70 bg-card p-5 shadow-[var(--shadow-card)]",
        side === "right" ? "rounded-t-none rounded-l-3xl" : "",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
