import * as React from "react";
import { cn } from "@/lib/utils";

const Separator = React.forwardRef<
  HTMLHRElement,
  React.HTMLAttributes<HTMLHRElement> & {
    decorative?: boolean;
    orientation?: "horizontal" | "vertical";
  }
>(({ className, decorative = true, orientation = "horizontal", ...props }, ref) => (
  <hr
    ref={ref}
    data-orientation={orientation}
    aria-hidden={decorative}
    className={cn(
      "shrink-0 bg-border",
      orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
      className
    )}
    {...props}
  />
));
Separator.displayName = "Separator";

export { Separator };
