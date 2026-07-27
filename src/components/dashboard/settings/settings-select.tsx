"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type SettingsSelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  description?: string;
};

export const SettingsSelect = React.forwardRef<HTMLSelectElement, SettingsSelectProps>(
  function SettingsSelect({ label, description, className, children, ...props }, ref) {
    return (
      <label className="space-y-2">
        <span className="text-sm font-medium">{label}</span>
        {description ? <span className="block text-xs leading-5 text-muted-foreground">{description}</span> : null}
        <select
          ref={ref}
          className={cn(
            "h-11 w-full rounded-2xl border border-input/80 bg-background/80 px-4 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] transition-all duration-200 hover:border-primary/30 focus-visible:outline-none focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            className
          )}
          {...props}
        >
          {children}
        </select>
      </label>
    );
  }
);
