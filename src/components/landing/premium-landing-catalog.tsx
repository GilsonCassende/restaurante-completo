import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  HoverCard,
  ResponsiveGrid,
  SectionContainer,
  SectionSubtitle,
  SectionTitle,
  EmptyState,
} from "@/components/design-system";
import { FlameKindling, Fish, GlassWater, Salad, Sparkles, ChefHat, ShoppingBag, ImageOff } from "lucide-react";
import type { LandingCategory, LandingContact, LandingProduct } from "@/services/landing";
import { cn } from "@/lib/utils";

type PremiumLandingCatalogProps = {
  categories: LandingCategory[];
  featuredProducts: LandingProduct[];
  promotionalProducts: LandingProduct[];
  contact: LandingContact;
};

function categoryIcon(name: string) {
  const normalized = name.toLowerCase();
  if (normalized.includes("peixe") || normalized.includes("mar")) return Fish;
  if (normalized.includes("beb")) return GlassWater;
  if (normalized.includes("salada") || normalized.includes("verde")) return Salad;
  if (normalized.includes("chef") || normalized.includes("assin")) return ChefHat;
  if (normalized.includes("sobrem")) return Sparkles;
  return FlameKindling;
}

function resolveTarget(href: string) {
  return href.startsWith("http") ? "_blank" : undefined;
}

function resolveRel(href: string) {
  return href.startsWith("http") ? "noreferrer" : undefined;
}

function ProductVisual({ product }: { product: LandingProduct }) {
  if (product.image) {
    return (
      <Image
        src={product.image}
        alt={product.name}
        width={1200}
        height={900}
        loading="lazy"
        unoptimized
        className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
      />
    );
  }

  return (
    <div className="flex h-56 w-full items-end bg-[image:var(--gradient-brand-soft)] p-5">
      <div className="w-full rounded-[1.25rem] border border-white/50 bg-background/70 p-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ImageOff className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold">Imagem indisponível</p>
            <p className="text-xs text-muted-foreground">Placeholder premium para este prato.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PremiumLandingCatalog({ categories, featuredProducts, promotionalProducts, contact }: PremiumLandingCatalogProps) {
  return (
    <>
      <SectionContainer id="categorias" className="py-14 sm:py-18 lg:py-20">
        <div className="mb-8 flex flex-col gap-3">
          <SectionTitle title="Categorias em destaque" />
          <SectionSubtitle>
            Navegação alimentada pelo cadastro real do restaurante, com a hierarquia que o cliente já entende.
          </SectionSubtitle>
        </div>

        {categories.length === 0 ? (
          <EmptyState
            title="Nenhuma categoria ativa"
            description="Quando o restaurante ainda não cadastrou categorias, mostramos um bloco de vazio premium em vez de inventar conteúdo."
          />
        ) : (
          <ResponsiveGrid minWidth="14.5rem">
            {categories.map((category) => {
              const Icon = categoryIcon(category.name);

              return (
                <HoverCard key={category.id} className="bg-gradient-to-br from-card to-muted/25">
                  <div className="flex h-full flex-col space-y-4 p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant="secondary" className="rounded-full">
                        {category.badge}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{category.name}</CardTitle>
                    <CardContent className="flex-1 p-0 text-sm leading-6 text-muted-foreground">
                      {category.description ?? "Categoria sem descrição cadastrada."}
                    </CardContent>
                  </div>
                </HoverCard>
              );
            })}
          </ResponsiveGrid>
        )}
      </SectionContainer>

      <SectionContainer id="cardapio" className="py-14 sm:py-18 lg:py-20">
        <div className="mb-8 flex flex-col gap-3">
          <SectionTitle title="Produtos em destaque" />
          <SectionSubtitle>
            Os itens relevantes entram automaticamente aqui com preço, promoção e imagem real.
          </SectionSubtitle>
        </div>

        {featuredProducts.length === 0 ? (
          <EmptyState
            title="Nenhum produto em destaque"
            description="Se o restaurante ainda não marcou pratos como destaque, o espaço permanece elegante com um estado vazio controlado."
          />
        ) : (
          <ResponsiveGrid minWidth="17rem">
            {featuredProducts.map((product) => (
              <Card
                key={product.id}
                className="group overflow-hidden border-border/70 bg-card/95 shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card)]"
              >
                <div className="relative">
                  <ProductVisual product={product} />
                  <div className="absolute left-4 top-4 flex items-center gap-2">
                    <Badge className="rounded-full bg-background/90 text-foreground shadow-[var(--shadow-soft)] backdrop-blur">
                      {product.badge}
                    </Badge>
                    <Badge variant="secondary" className="rounded-full bg-background/90 text-foreground shadow-[var(--shadow-soft)] backdrop-blur">
                      {product.categoryName}
                    </Badge>
                  </div>
                </div>
                <CardHeader className="space-y-2">
                  <CardTitle className="text-xl">{product.name}</CardTitle>
                  <p className="text-sm leading-6 text-muted-foreground">{product.description ?? "Sem descrição cadastrada."}</p>
                </CardHeader>
                <CardContent className="flex items-end justify-between gap-4">
                  <div>
                    {product.displayOriginalPrice ? (
                      <p className="text-sm text-muted-foreground line-through">{product.displayOriginalPrice}</p>
                    ) : null}
                    <p className="text-2xl font-semibold tracking-tight">{product.displayPrice}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Categoria</p>
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{product.categoryName}</p>
                  </div>
                </CardContent>
                <CardFooter className="pb-6">
                  <Button asChild className="w-full">
                    <Link href={contact.whatsappUrl ?? "#pedido"} target={resolveTarget(contact.whatsappUrl ?? "#pedido")} rel={resolveRel(contact.whatsappUrl ?? "#pedido")}>
                      <ShoppingBag className="h-4 w-4" />
                      Pedir agora
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </ResponsiveGrid>
        )}
      </SectionContainer>

      <SectionContainer id="promocoes" className="py-14 sm:py-18 lg:py-20">
        <div className="mb-8 flex flex-col gap-3">
          <SectionTitle title="Promoções automáticas" />
          <SectionSubtitle>
            Produtos com preço promocional aparecem aqui sem intervenção manual.
          </SectionSubtitle>
        </div>

        {promotionalProducts.length === 0 ? (
          <EmptyState
            title="Sem promoções ativas"
            description="Quando não houver descontos cadastrados, mostramos um empty state premium em vez de conteúdo fictício."
          />
        ) : (
          <ResponsiveGrid minWidth="16rem">
            {promotionalProducts.map((product) => (
              <Card key={product.id} className="border-border/70 bg-card/95 shadow-[var(--shadow-soft)]">
                <CardHeader className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="rounded-full">{product.badge}</Badge>
                    <Badge variant="secondary" className="rounded-full">
                      {product.categoryName}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className={cn("text-sm leading-6 text-muted-foreground")}>{product.description ?? "Sem descrição cadastrada."}</p>
                  <div className="flex items-baseline gap-3">
                    {product.displayOriginalPrice ? (
                      <p className="text-sm text-muted-foreground line-through">{product.displayOriginalPrice}</p>
                    ) : null}
                    <p className="text-xl font-semibold tracking-tight">{product.displayPrice}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </ResponsiveGrid>
        )}
      </SectionContainer>
    </>
  );
}
