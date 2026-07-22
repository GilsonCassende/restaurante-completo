import { cn } from "@/lib/utils";

type SectionTitleProps = {
  title: string;
  className?: string;
};

export function SectionTitle({ title, className }: SectionTitleProps) {
  return <h2 className={cn("text-2xl font-semibold tracking-tight md:text-3xl", className)}>{title}</h2>;
}
