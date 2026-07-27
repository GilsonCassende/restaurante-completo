"use client";

import { cn } from "@/lib/utils";

type SettingsSwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  description?: string;
};

export function SettingsSwitch({ checked, onCheckedChange, label, description }: SettingsSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "flex w-full items-center justify-between gap-4 rounded-[1.25rem] border border-border/70 bg-background/80 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[var(--shadow-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        checked && "border-primary/40 bg-primary/5"
      )}
    >
      <span className="space-y-1">
        <span className="block text-sm font-semibold">{label}</span>
        {description ? <span className="block text-xs leading-5 text-muted-foreground">{description}</span> : null}
      </span>
      <span
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full border border-border/70 transition-colors",
          checked ? "bg-primary" : "bg-muted"
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 rounded-full bg-background shadow-sm transition-transform duration-200",
            checked ? "translate-x-5" : "translate-x-0.5"
          )}
        />
      </span>
    </button>
  );
}
