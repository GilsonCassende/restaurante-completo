import { cn } from "@/lib/utils";

type SectionSubtitleProps = {
  children: React.ReactNode;
  className?: string;
};

export function SectionSubtitle({ children, className }: SectionSubtitleProps) {
  return <p className={cn("max-w-2xl text-sm leading-6 text-muted-foreground md:text-base", className)}>{children}</p>;
}
