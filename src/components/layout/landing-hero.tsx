"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Layers3, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/layout/app-shell";

const stagger = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.08, delayChildren: 0.12 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export function LandingHero() {
  return (
    <AppShell>
      <motion.section
        id="estrutura"
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="overflow-hidden rounded-[2rem] border bg-hero-radial p-8 shadow-soft sm:p-10 lg:p-14"
      >
        <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
          <motion.div variants={item} className="max-w-2xl">
            <Badge variant="secondary" className="rounded-full px-4 py-1 text-xs font-medium">
              FASE 1 - Base profissional
            </Badge>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              RestaurantPro nasce com uma fundação limpa, modular e pronta para evoluir.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Esta fase prepara o terreno para um SaaS de restaurantes sem implementar
              funcionalidade de negócio, mantendo a arquitetura, a identidade visual e a
              extensibilidade alinhadas desde o começo.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="#estrutura">
                  Ver estrutura
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/api/health">Validar base</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            variants={item}
            className="grid gap-4 rounded-2xl border bg-background/75 p-5 backdrop-blur"
          >
            {[
              {
                icon: Layers3,
                title: "Estrutura modular",
                description: "Pastas isoladas por responsabilidade para acelerar a evolução.",
              },
              {
                icon: ShieldCheck,
                title: "Padrões seguros",
                description: "TypeScript, Zod e Prisma já organizados para validação e consistência.",
              },
              {
                icon: Sparkles,
                title: "UI escalável",
                description: "Shadcn/UI, Tailwind e dark mode prontos para padronização visual.",
              },
            ].map((feature) => (
              <div key={feature.title} className="flex gap-4 rounded-xl border p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <feature.icon className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-medium">{feature.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.section>
    </AppShell>
  );
}
