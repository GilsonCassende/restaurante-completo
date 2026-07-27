import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-transparent text-sm font-medium tracking-tight transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[var(--shadow-soft)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)] hover:bg-primary/90",
        secondary: "border-border/70 bg-secondary text-secondary-foreground shadow-[var(--shadow-soft)] hover:-translate-y-0.5 hover:bg-secondary/80",
        outline: "border-border/80 bg-background/80 text-foreground shadow-none hover:-translate-y-0.5 hover:border-primary/30 hover:bg-accent/50 hover:text-foreground",
        ghost: "text-foreground hover:bg-accent/60 hover:text-foreground",
        link: "h-auto rounded-none border-0 bg-transparent px-0 py-0 text-primary underline-offset-4 hover:underline",
        destructive: "bg-destructive text-destructive-foreground shadow-[var(--shadow-soft)] hover:-translate-y-0.5 hover:bg-destructive/90 hover:shadow-[var(--shadow-card)]",
        success: "bg-emerald-600 text-white shadow-[var(--shadow-soft)] hover:-translate-y-0.5 hover:bg-emerald-500 hover:shadow-[var(--shadow-card)]",
        warning: "bg-amber-500 text-white shadow-[var(--shadow-soft)] hover:-translate-y-0.5 hover:bg-amber-400 hover:shadow-[var(--shadow-card)]",
        subtle: "border-border/70 bg-muted/80 text-foreground shadow-none hover:-translate-y-0.5 hover:bg-muted",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-11 rounded-xl px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = Boolean(disabled || loading);

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          loading && "cursor-progress opacity-90",
          asChild && isDisabled && "pointer-events-none"
        )}
        ref={ref}
        aria-busy={loading || undefined}
        aria-disabled={asChild ? isDisabled || undefined : undefined}
        data-loading={loading || undefined}
        disabled={asChild ? undefined : isDisabled}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
