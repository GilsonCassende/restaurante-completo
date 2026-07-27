"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchBarProps = React.InputHTMLAttributes<HTMLInputElement> & {
  onClear?: () => void;
  wrapperClassName?: string;
};

export function SearchBar({ className, wrapperClassName, onClear, value, ...props }: SearchBarProps) {
  const hasValue = typeof value === "string" ? value.length > 0 : Boolean(value);

  return (
    <div className={cn("relative flex items-center gap-2", wrapperClassName)}>
      <Search className="pointer-events-none absolute left-4 h-4 w-4 text-muted-foreground" />
      <Input className={cn("pl-10 pr-11", className)} value={value} {...props} />
      {hasValue && onClear ? (
        <Button type="button" variant="ghost" size="icon" className="absolute right-1.5 h-8 w-8 rounded-full border border-border/60 bg-background/80 shadow-[var(--shadow-soft)]" onClick={onClear}>
          <X className="h-4 w-4" />
          <span className="sr-only">Limpar busca</span>
        </Button>
      ) : null}
    </div>
  );
}
