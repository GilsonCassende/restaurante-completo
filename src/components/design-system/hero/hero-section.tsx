import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GradientButton } from "../buttons";
import { AnimatedCounter } from "../stats";

type HeroSectionProps = {
  eyebrow?: string;
  title: string;
  subtitle: string;
  primaryAction?: { label: string; onClick?: () => void };
  secondaryAction?: { label: string; onClick?: () => void };
  metrics?: Array<{ label: string; value: number; suffix?: string }>;
  className?: string;
};

export function HeroSection({ eyebrow, title, subtitle, primaryAction, secondaryAction, metrics, className }: HeroSectionProps) {
  return (
    <section className={cn("relative overflow-hidden rounded-[2rem] border border-border/70 bg-gradient-to-br from-card via-card to-muted/40 px-6 py-12 shadow-[var(--shadow-card)] md:px-10 md:py-16", className)}>
      <div className="absolute inset-0 bg-[image:var(--gradient-hero)] opacity-70" />
      <div className="absolute inset-0 ds-surface-grid opacity-[0.18]" />
      <div className="relative space-y-8">
        <div className="max-w-3xl space-y-4">
          {eyebrow ? <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">{eyebrow}</p> : null}
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance md:text-6xl">
            <span className="ds-gradient-text">{title}</span>
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {primaryAction ? (
            <GradientButton onClick={primaryAction.onClick}>
              {primaryAction.label}
              <ArrowRight className="h-4 w-4" />
            </GradientButton>
          ) : null}
          {secondaryAction ? (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          ) : null}
        </div>
        {metrics?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-3xl border border-white/50 bg-white/55 p-4 shadow-[var(--shadow-soft)] backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{metric.label}</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight">
                  <AnimatedCounter value={metric.value} suffix={metric.suffix} />
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
