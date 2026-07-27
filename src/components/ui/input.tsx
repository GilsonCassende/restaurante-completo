import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-2xl border border-input/80 bg-background/80 px-4 py-2.5 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] ring-offset-background transition-all duration-200 placeholder:text-muted-foreground/70 hover:border-primary/30 focus-visible:outline-none focus-visible:border-primary/40 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
