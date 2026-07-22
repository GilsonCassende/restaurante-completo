import { cn } from "@/lib/utils";

type ResponsiveGridProps = React.HTMLAttributes<HTMLDivElement> & {
  minWidth?: string;
};

export function ResponsiveGrid({ className, minWidth = "18rem", ...props }: ResponsiveGridProps) {
  return <div className={cn("grid gap-4", className)} style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}, 1fr))` }} {...props} />;
}
