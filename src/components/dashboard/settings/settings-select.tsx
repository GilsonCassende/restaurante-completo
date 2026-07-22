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
        className={cn("h-11 w-full rounded-xl border border-input bg-background px-3 text-sm", className)}
        {...props}
      >
        {children}
      </select>
    </label>
  );
  }
);

