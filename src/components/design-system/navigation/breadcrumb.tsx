import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex flex-wrap items-center gap-2 text-sm", className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-2">
            {item.href && !isLast ? (
              <Link href={item.href} className="rounded-full px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground">
                {item.label}
              </Link>
            ) : (
              <span className={cn("rounded-full px-2.5 py-1.5", isLast ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground")}>
                {item.label}
              </span>
            )}
            {!isLast ? <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" /> : null}
          </span>
        );
      })}
    </nav>
  );
}
