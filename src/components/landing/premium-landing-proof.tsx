import Image from "next/image";
import Link from "next/link";
import { Clock3, MapPin, MessageCircle, PhoneCall, ImageOff } from "lucide-react";
import {
  EmptyState,
  ResponsiveGrid,
  SectionContainer,
  SectionSubtitle,
  SectionTitle,
} from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { LandingContact, LandingGalleryItem, RestaurantLanding } from "@/services/landing";
import { cn } from "@/lib/utils";

type PremiumLandingProofProps = {
  gallery: LandingGalleryItem[];
  contact: LandingContact;
  restaurant: RestaurantLanding["restaurant"];
};

function resolveTarget(href: string) {
  return href.startsWith("http") ? "_blank" : undefined;
}

function resolveRel(href: string) {
  return href.startsWith("http") ? "noreferrer" : undefined;
}

function GalleryTile({ item }: { item: LandingGalleryItem }) {
  return (
    <button
      type="button"
      aria-label={`Abrir imagem da galeria: ${item.title}`}
      className="group relative overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/90 text-left shadow-[var(--shadow-soft)]"
    >
      <div className="relative">
        {item.src ? (
          <Image
            src={item.src}
            alt={item.alt}
            width={1200}
            height={900}
            loading="lazy"
            unoptimized
            className="h-72 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-72 w-full items-center justify-center bg-[image:var(--gradient-brand-soft)]">
            <div className="flex max-w-[18rem] flex-col items-center gap-4 rounded-[1.5rem] border border-white/50 bg-background/70 p-6 text-center backdrop-blur">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ImageOff className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">Imagem não disponível</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Placeholder premium da galeria.</p>
              </div>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/15 to-transparent opacity-90" />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <Badge className="rounded-full bg-background/90 text-foreground backdrop-blur">{item.title}</Badge>
          <p className="mt-2 text-sm text-muted-foreground">
            {item.placeholder ? "Conteúdo ausente substituído por um bloco premium." : "Imagem real carregada do cadastro."}
          </p>
        </div>
      </div>
    </button>
  );
}

export function PremiumLandingProof({ gallery, contact, restaurant }: PremiumLandingProofProps) {
  return (
    <>
      <SectionContainer id="galeria" className="py-14 sm:py-18 lg:py-20">
        <div className="mb-8 flex flex-col gap-3">
          <SectionTitle title="Galeria" />
          <SectionSubtitle>
            O bloco visual se adapta ao conteúdo real e exibe placeholders premium quando necessário.
          </SectionSubtitle>
        </div>

        {gallery.length === 0 ? (
          <EmptyState
            title="Galeria vazia"
            description="Nenhuma imagem foi cadastrada ainda, então mostramos um estado vazio elegante e coerente com a identidade premium."
          />
        ) : (
          <ResponsiveGrid minWidth="15rem">
            {gallery.map((item, index) => (
              <div key={item.id} className={cn(index === 0 && "sm:col-span-2")}>
                <GalleryTile item={item} />
              </div>
            ))}
          </ResponsiveGrid>
        )}
      </SectionContainer>

      <SectionContainer id="localizacao" className="py-14 sm:py-18 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
          <Card className="overflow-hidden border-border/70 bg-card/95 shadow-[var(--shadow-card)]">
            <CardContent className="p-4 sm:p-5">
              <div className="relative overflow-hidden rounded-[1.5rem] border border-border/70 bg-muted/30">
                {contact.mapUrl ? (
                  <iframe
                    src={contact.mapUrl}
                    title={`Mapa de ${restaurant.name}`}
                    loading="lazy"
                    className="h-[22rem] w-full border-0"
                  />
                ) : (
                  <div className="flex h-[22rem] w-full items-center justify-center bg-[image:var(--gradient-brand-soft)]">
                    <div className="rounded-[1.5rem] border border-white/50 bg-background/70 px-6 py-5 text-center backdrop-blur">
                      <MapPin className="mx-auto h-6 w-6 text-primary" />
                      <p className="mt-3 text-sm font-semibold">Mapa indisponível</p>
                      <p className="mt-1 text-xs text-muted-foreground">Endereço ainda não cadastrado.</p>
                    </div>
                  </div>
                )}
                <div className="absolute left-4 top-4">
                  <Badge className="rounded-full">Localização real</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <div className="space-y-3">
              <SectionTitle title="Contato e horário" />
              <SectionSubtitle>Informações reais do restaurante, organizadas para conversão rápida.</SectionSubtitle>
            </div>

            <div className="grid gap-4">
              {[
                { icon: Clock3, label: "Horário", value: contact.hours },
                { icon: PhoneCall, label: "Telefone", value: contact.phone ?? "Não informado" },
                { icon: MapPin, label: "Endereço", value: contact.address ?? "Não informado" },
                { icon: MessageCircle, label: "WhatsApp", value: contact.whatsappUrl ? "Ativo" : "Não disponível" },
              ].map((row) => (
                <div key={row.label} className="flex items-start gap-4 rounded-[1.5rem] border border-border/70 bg-card/90 p-4 shadow-[var(--shadow-soft)]">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <row.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{row.label}</p>
                    <p className="mt-1 text-sm leading-6">{row.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div id="pedido" className="flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href={contact.whatsappUrl ?? "#cardapio"} target={resolveTarget(contact.whatsappUrl ?? "#cardapio")} rel={resolveRel(contact.whatsappUrl ?? "#cardapio")}>
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={contact.phone ? `tel:${contact.phone.replace(/\D/g, "")}` : "#topo"} target={resolveTarget(contact.phone ? `tel:${contact.phone.replace(/\D/g, "")}` : "#topo")} rel={resolveRel(contact.phone ? `tel:${contact.phone.replace(/\D/g, "")}` : "#topo")}>
                  <PhoneCall className="h-4 w-4" />
                  Ligar agora
                </Link>
              </Button>
            </div>

            <div id="reservar" className="rounded-[1.75rem] border border-border/70 bg-gradient-to-br from-card via-card to-muted/25 p-5 shadow-[var(--shadow-soft)]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Reserva de mesa</p>
                  <p className="mt-2 text-lg font-semibold">Acesso rápido ao canal certo sem depender de conteúdo falso.</p>
                </div>
                <Button asChild variant="secondary">
                  <Link href="#pedido">Reservar mesa</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SectionContainer>

      <SectionContainer id="cta-final" className="py-14 sm:py-18 lg:py-20">
        <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-[image:var(--gradient-brand-soft)] p-6 shadow-[var(--shadow-card)] sm:p-8 lg:p-10">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-4">
              <Badge className="w-fit rounded-full bg-background/90 text-foreground backdrop-blur">Conversão premium</Badge>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{restaurant.name} pronto para converter visitantes?</h2>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                A landing fica pronta para operar com dados reais, placeholders elegantes e SEO dinâmico.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Button asChild size="lg">
                <Link href="#cardapio">Pedir agora</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="#sobre">Conhecer a casa</Link>
              </Button>
            </div>
          </div>
        </div>
      </SectionContainer>

      <footer className="border-t border-border/70 bg-background/75">
        <SectionContainer className="py-10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
            <div className="space-y-4">
              <p className="text-lg font-semibold">{restaurant.name}</p>
              <p className="max-w-sm text-sm leading-6 text-muted-foreground">{contact.footerNote}</p>
            </div>
            <div className="space-y-3 text-sm">
              <p className="font-semibold">Links</p>
              <div className="grid gap-2 text-muted-foreground">
                <Link href="#categorias">Categorias</Link>
                <Link href="#cardapio">Cardápio</Link>
                <Link href="#galeria">Galeria</Link>
                <Link href="#localizacao">Localização</Link>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <p className="font-semibold">Contato</p>
              <div className="grid gap-2 text-muted-foreground">
                {contact.phone ? <Link href={`tel:${contact.phone.replace(/\D/g, "")}`}>{contact.phone}</Link> : null}
                {contact.email ? <Link href={`mailto:${contact.email}`}>{contact.email}</Link> : null}
                {contact.whatsappUrl ? (
                  <Link href={contact.whatsappUrl} target="_blank" rel="noreferrer">
                    WhatsApp
                  </Link>
                ) : null}
                {contact.address ? <span>{contact.address}</span> : null}
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <p className="font-semibold">Horário</p>
              <div className="grid gap-2 text-muted-foreground">
                <span>{contact.hours}</span>
                <span>Atendimento adaptado aos dados do restaurante.</span>
              </div>
            </div>
          </div>
        </SectionContainer>
      </footer>
    </>
  );
}
