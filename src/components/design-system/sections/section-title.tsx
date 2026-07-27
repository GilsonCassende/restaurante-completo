import { cn } from "@/lib/utils";

type SectionTitleProps = {
  title: string;
  className?: string;
};

export function SectionTitle({ title, className }: SectionTitleProps) {
  return <h2 className={cn("font-display text-2xl font-semibold tracking-tight text-balance md:text-3xl", className)}>{title}</h2>;
}
