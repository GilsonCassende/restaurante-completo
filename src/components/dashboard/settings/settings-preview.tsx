import Link from "next/link";
import { Globe, MapPin, PhoneCall, Settings2 } from "lucide-react";
import { GlassCard, HighlightCard, InfoCard, ResponsiveGrid, SectionSubtitle, SectionTitle } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import type { Restaurant } from "@/types";
import type { RestaurantSettingsInput } from "@/schemas";

type SettingsPreviewProps = {
  restaurant: Restaurant;
  draft: RestaurantSettingsInput;
};

function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "Não informado";
  return new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA", maximumFractionDigits: 0 }).format(value);
}

export function SettingsPreview({ restaurant, draft }: SettingsPreviewProps) {
  const fullAddress =
    [draft.street, draft.number, draft.neighborhood, draft.city, draft.state, draft.country].filter(Boolean).join(", ") ||
    restaurant.address ||
    "Endereço não informado";

  return (
    <div className="space-y-6">
      <div>
        <SectionTitle title="Preview operacional" />
        <SectionSubtitle>Uma leitura rápida de como o restaurante será interpretado pelo sistema e pelos clientes.</SectionSubtitle>
      </div>
      <GlassCard className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Identidade ativa</p>
            <h3 className="font-display text-2xl font-semibold">{draft.name}</h3>
            <p className="text-sm leading-6 text-muted-foreground">{draft.slogan || draft.description || restaurant.description || "Branding e dados reais conectados ao banco."}</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard/branding">
              <Settings2 className="h-4 w-4" />
              Branding
            </Link>
          </Button>
        </div>
      </GlassCard>
      <ResponsiveGrid minWidth="14rem">
        <InfoCard title="Contato" description={draft.phone || draft.whatsapp || "Sem telefone principal."} icon={<PhoneCall className="h-5 w-5" />} />
        <InfoCard title="Localização" description={fullAddress} icon={<MapPin className="h-5 w-5" />} />
        <InfoCard title="Website" description={draft.website || restaurant.website || "Não informado"} icon={<Globe className="h-5 w-5" />} />
      </ResponsiveGrid>
      <HighlightCard
        title="Operação"
        description={`Aberto: ${draft.isOpen ? "sim" : "não"} | Pedido mínimo: ${formatMoney(draft.minimumOrderAmount)} | Taxa de entrega: ${formatMoney(draft.deliveryFee)}`}
        accent="from-primary/15 via-secondary/10 to-transparent"
      />
      <div className="rounded-[1.75rem] border border-border/70 bg-card/90 p-6 shadow-[var(--shadow-soft)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Resumo editorial</p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {draft.history || restaurant.history || "O conteúdo institucional entra aqui para reforçar a narrativa do restaurante."}
        </p>
      </div>
    </div>
  );
}
