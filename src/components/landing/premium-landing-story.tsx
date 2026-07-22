import Image from "next/image";
import { Sparkles, HeartHandshake, ShieldCheck } from "lucide-react";
import {
  GlassCard,
  HighlightCard,
  InfoCard,
  ResponsiveGrid,
  SectionContainer,
  SectionSubtitle,
  SectionTitle,
} from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import type { RestaurantLanding } from "@/services/landing";
import { LandingPlaceholder } from "./landing-placeholder";

type PremiumLandingStoryProps = {
  landing: Pick<RestaurantLanding, "about" | "restaurant" | "stats" | "contact" | "gallery">;
};

function resolveHeroImage(landing: Pick<RestaurantLanding, "gallery">) {
  return landing.gallery.find((item) => item.src && !item.placeholder)?.src ?? null;
}

export function PremiumLandingStory({ landing }: PremiumLandingStoryProps) {
  const heroImage = resolveHeroImage(landing);
  const activeStats = landing.stats;

  return (
    <>
      <SectionContainer id="sobre" className="py-14 sm:py-18 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="space-y-6">
            <div className="space-y-3">
              <SectionTitle title={landing.about.title} />
              <SectionSubtitle>
                A história da casa é montada com base no conteúdo real disponível no cadastro do restaurante.
              </SectionSubtitle>
            </div>

            <GlassCard className="overflow-hidden">
              <div className="grid gap-0 sm:grid-cols-2">
                {heroImage ? (
                  <Image
                    src={heroImage}
                    alt={`Interior e atmosfera de ${landing.restaurant.name}`}
                    width={900}
                    height={900}
                    loading="lazy"
                    unoptimized
                    className="h-full min-h-64 w-full object-cover"
                  />
                ) : (
                  <LandingPlaceholder
                    title="Galeria insuficiente"
                    description="Quando ainda não há imagens para contextualizar a casa, um placeholder premium entra em cena."
                    className="min-h-64 rounded-none border-0 shadow-none"
                  />
                )}
                <div className="space-y-5 p-6">
                  <Badge variant="secondary" className="rounded-full">
                    História da casa
                  </Badge>
                  <p className="text-sm leading-6 text-muted-foreground">{landing.about.description}</p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {landing.contact.footerNote}
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>

          <div className="grid gap-4">
            <ResponsiveGrid minWidth="14rem">
              {landing.about.highlights.map((value, index) => {
                const Icon = index === 0 ? Sparkles : index === 1 ? HeartHandshake : ShieldCheck;

                return (
                  <InfoCard
                    key={value.title}
                    title={value.title}
                    description={value.description}
                    icon={<Icon className="h-5 w-5" />}
                  />
                );
              })}
            </ResponsiveGrid>
            <HighlightCard
              title="Resumo operacional"
              description={`${activeStats[0]?.value ?? 0} categorias, ${activeStats[1]?.value ?? 0} produtos ativos e ${activeStats[3]?.value ?? 0} promoções automáticas disponíveis.`}
              accent="from-amber-400/20 via-primary/10 to-emerald-400/10"
            />
          </div>
        </div>
      </SectionContainer>

      <SectionContainer id="numeros" className="py-14 sm:py-18 lg:py-20">
        <div className="mb-8 flex flex-col gap-3">
          <SectionTitle title="Números do restaurante" />
          <SectionSubtitle>
            Contadores derivados dos dados publicados para reforçar autoridade e clareza.
          </SectionSubtitle>
        </div>
        <ResponsiveGrid minWidth="14rem">
          {landing.stats.map((item) => (
            <div key={item.label} className="rounded-[1.75rem] border border-border/70 bg-card/90 p-6 shadow-[var(--shadow-soft)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{item.label}</p>
              <p className="mt-4 text-4xl font-semibold tracking-tight">
                {item.value}
                {item.suffix ?? ""}
              </p>
              {item.helper ? <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.helper}</p> : null}
            </div>
          ))}
        </ResponsiveGrid>
      </SectionContainer>

      <SectionContainer id="como-funciona" className="py-14 sm:py-18 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
          <div className="space-y-3">
            <SectionTitle title="Como funciona" />
            <SectionSubtitle>
              A jornada do cliente continua simples, com foco em conversão e leitura confortável.
            </SectionSubtitle>
          </div>
          <div className="grid gap-4">
            {[
              {
                meta: "Passo 01",
                title: "Escolha",
                description: "A navegação destaca categorias, pratos e promoções sem ruído visual.",
              },
              {
                meta: "Passo 02",
                title: "Peça",
                description: "O CTA leva o cliente para o canal mais adequado, como WhatsApp ou contato rápido.",
              },
              {
                meta: "Passo 03",
                title: "Receba",
                description: "A landing reforça localização, horário e credibilidade antes da conversão.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-[1.75rem] border border-border/70 bg-card/90 p-6 shadow-[var(--shadow-soft)]">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{item.meta}</p>
                <h3 className="mt-3 text-xl font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </SectionContainer>
    </>
  );
}
