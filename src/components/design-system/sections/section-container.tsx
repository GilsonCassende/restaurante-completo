import { cn } from "@/lib/utils";

type SectionContainerProps = React.HTMLAttributes<HTMLElement> & {
  padded?: boolean;
};

export function SectionContainer({ className, padded = true, ...props }: SectionContainerProps) {
  return <section className={cn("mx-auto w-full max-w-7xl", padded && "px-4 sm:px-6 lg:px-8", className)} {...props} />;
}
