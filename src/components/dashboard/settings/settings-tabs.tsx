"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type SettingsTabItem = {
  id: string;
  label: string;
  description: string;
};

type SettingsTabsProps = {
  value: string;
  onValueChange: (value: string) => void;
  tabs: SettingsTabItem[];
};

export function SettingsTabs({ value, onValueChange, tabs }: SettingsTabsProps) {
  return (
    <div className="rounded-[1.75rem] border border-border/70 bg-gradient-to-br from-card via-card to-muted/20 p-2 shadow-[var(--shadow-soft)]">
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {tabs.map((tab) => {
          const active = tab.id === value;
          return (
            <Button
              key={tab.id}
              type="button"
              variant={active ? "default" : "ghost"}
              className={cn(
                "h-auto justify-start rounded-[1.25rem] px-4 py-3 text-left transition-all duration-200",
                active ? "shadow-[var(--shadow-soft)]" : "bg-transparent text-muted-foreground"
              )}
              onClick={() => onValueChange(tab.id)}
            >
              <span className="flex flex-col items-start gap-1">
                <span className="text-sm font-semibold">{tab.label}</span>
                <span className={cn("text-xs font-normal leading-5", active ? "text-primary-foreground/80" : "text-muted-foreground")}>
                  {tab.description}
                </span>
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
