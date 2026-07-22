"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CalendarDays, Clock3, MapPin, PhoneCall, Sparkles, UtensilsCrossed } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/design-system/buttons";
import { AnimatedCounter, motionPresets } from "@/components/design-system";
import { cn } from "@/lib/utils";
import type { LandingHero, LandingStat } from "@/services/landing";
import { LandingPlaceholder } from "./landing-placeholder";

type PremiumLandingHeroProps = {
  hero: LandingHero;
  stats: LandingStat[];
};

function resolveTarget(href: string) {
  return href.startsWith("http") ? "_blank" : undefined;
}

function resolveRel(href: string) {
  return href.startsWith("http") ? "noreferrer" : undefined;
}

export function PremiumLandingHero({ hero, stats }: PremiumLandingHeroProps) {
  return (
    <section id="topo" className="relative border-b border-border/50">
      <div className="absolute inset-0 bg-[image:var(--gradient-hero)] opacity-70" />
      <AppShell className="relative py-6 sm:py-8 lg:py-10">
        <motion.div
          initial="initial"
          animate="animate"
          variants={motionPresets.stagger}
          className="overflow-hidden rounded-[2rem] border border-border/70 bg-[image:var(--gradient-surface)] shadow-[var(--shadow-card)]"
        >
          <div className="grid gap-8 p-5 sm:p-7 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:p-10">
            <motion.div variants={motionPresets.staggerItem} className="flex flex-col justify-center">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="w-fit rounded-full px-4 py-1 text-[11px] uppercase tracking-[0.24em]">
                  Landing premium
                </Badge>
                {hero.logo ? (
                  <Badge className="w-fit rounded-full bg-background/90 text-foreground backdrop-blur">
                    <Sparkles className="mr-1 h-3.5 w-3.5" />
                    Logotipo disponível
                  </Badge>
                ) : null}
              </div>

              <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                {hero.title}
              </h1>
              <p className="mt-4 max-w-2xl text-lg font-medium text-primary sm:text-xl">{hero.slogan}</p>
              <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">{hero.description}</p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <GradientButton asChild>
                  <Link href={hero.primaryAction.href} target={resolveTarget(hero.primaryAction.href)} rel={resolveRel(hero.primaryAction.href)}>
                    {hero.primaryAction.label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </GradientButton>
                <Button asChild variant="outline">
                  <Link href={hero.secondaryAction.href} target={resolveTarget(hero.secondaryAction.href)} rel={resolveRel(hero.secondaryAction.href)}>
                    <UtensilsCrossed className="h-4 w-4" />
                    {hero.secondaryAction.label}
                  </Link>
                </Button>
              <Button asChild variant="secondary">
                <Link href="#localizacao">
                  <PhoneCall className="h-4 w-4" />
                  Ver contato
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/reservas">
                  <CalendarDays className="h-4 w-4" />
                  Reservar mesa
                </Link>
              </Button>
            </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-3xl border border-border/70 bg-card/85 p-4 shadow-[var(--shadow-soft)] backdrop-blur"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{stat.label}</p>
                    <p className="mt-3 text-2xl font-semibold tracking-tight">
                      <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                    </p>
                    {stat.helper ? <p className="mt-2 text-xs leading-5 text-muted-foreground">{stat.helper}</p> : null}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={motionPresets.staggerItem} className="space-y-4">
              <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/80 p-3 shadow-[var(--shadow-card)]">
                <div className="absolute inset-0 ds-surface-grid opacity-20" />
                <div className="relative overflow-hidden rounded-[1.6rem]">
                  {hero.banner ? (
                    <Image
                      src={hero.banner}
                      alt={`${hero.title} - imagem principal`}
                      width={1200}
                      height={960}
                      priority
                      unoptimized
                      className="h-[24rem] w-full object-cover sm:h-[30rem] lg:h-[32rem]"
                    />
                  ) : (
                    <LandingPlaceholder
                      title="Banner premium ausente"
                      description="Um placeholder elegante ocupa o espaço do banner quando o restaurante ainda não enviou uma imagem."
                      className="min-h-[24rem] rounded-[1.6rem] border-0 shadow-none sm:min-h-[30rem] lg:min-h-[32rem]"
                    />
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/65 to-transparent p-5">
                    <div className="flex flex-wrap gap-2">
                      {hero.facts.slice(0, 3).map((fact) => (
                        <Badge key={fact.label} className="rounded-full bg-background/85 text-foreground backdrop-blur">
                          {fact.value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {hero.facts.map((fact) => {
                  const icon = fact.label === "Horário" ? Clock3 : fact.label === "Localização" ? MapPin : Sparkles;

                  return (
                    <div key={fact.label} className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-[var(--shadow-soft)]">
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          {icon === Clock3 ? <Clock3 className="h-5 w-5" /> : icon === MapPin ? <MapPin className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                        </span>
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{fact.label}</p>
                          <p className={cn("font-medium", fact.value.length > 32 && "text-sm")}>{fact.value}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AppShell>
    </section>
  );
}
