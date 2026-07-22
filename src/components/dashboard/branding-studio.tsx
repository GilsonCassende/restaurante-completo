"use client";

import { useActionState, useMemo, useRef, useState, type ChangeEvent, type RefObject } from "react";
import Image from "next/image";
import { MonitorSmartphone, RotateCcw, TabletSmartphone, Smartphone, Sparkles, Upload } from "lucide-react";
import { saveRestaurantBrandingAction, type BrandingActionState } from "@/actions/theme";
import { RestaurantThemeProvider } from "@/context/theme/restaurant-theme-provider";
import { useRestaurantTheme } from "@/hooks/theme/use-restaurant-theme";
import { THEME_REGISTRY, resolveThemeTokens } from "@/lib/theme";
import { cn } from "@/lib/utils";
import type { Restaurant } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, SectionContainer, SectionSubtitle, SectionTitle, FeedbackState } from "@/components/design-system";

const THEME_FIELD_NAMES = [
  "logo",
  "favicon",
  "banner",
  "coverImage",
  "primaryColor",
  "secondaryColor",
  "accentColor",
  "backgroundColor",
  "surfaceColor",
  "textColor",
  "successColor",
  "warningColor",
  "errorColor",
  "fontFamily",
  "borderRadius",
  "buttonStyle",
  "cardStyle",
  "heroStyle",
  "footerStyle",
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
  "linkedin",
  "website",
  "supportPhone",
  "whatsapp",
  "openingHours",
  "timezone",
  "currency",
  "language",
  "country",
  "city",
] as const;

type ThemeFieldName = (typeof THEME_FIELD_NAMES)[number];

type BrandingStudioProps = {
  restaurant: Restaurant;
};

type BrandingDraft = Record<ThemeFieldName, string>;

const initialActionState: BrandingActionState = {
  ok: false,
  message: "",
  theme: null,
};

function buildDraft(restaurant: Restaurant): BrandingDraft {
  return {
    logo: restaurant.logo ?? "",
    favicon: restaurant.favicon ?? "",
    banner: restaurant.banner ?? "",
    coverImage: restaurant.coverImage ?? "",
    primaryColor: restaurant.primaryColor ?? "",
    secondaryColor: restaurant.secondaryColor ?? "",
    accentColor: restaurant.accentColor ?? "",
    backgroundColor: restaurant.backgroundColor ?? "",
    surfaceColor: restaurant.surfaceColor ?? "",
    textColor: restaurant.textColor ?? "",
    successColor: restaurant.successColor ?? "",
    warningColor: restaurant.warningColor ?? "",
    errorColor: restaurant.errorColor ?? "",
    fontFamily: restaurant.fontFamily ?? "plus-jakarta",
    borderRadius: restaurant.borderRadius ?? "xl",
    buttonStyle: restaurant.buttonStyle ?? "gradient",
    cardStyle: restaurant.cardStyle ?? "glass",
    heroStyle: restaurant.heroStyle ?? "editorial",
    footerStyle: restaurant.footerStyle ?? "rich",
    instagram: restaurant.instagram ?? "",
    facebook: restaurant.facebook ?? "",
    tiktok: restaurant.tiktok ?? "",
    youtube: restaurant.youtube ?? "",
    linkedin: restaurant.linkedin ?? "",
    website: restaurant.website ?? "",
    supportPhone: restaurant.supportPhone ?? "",
    whatsapp: restaurant.whatsapp ?? "",
    openingHours: restaurant.openingHours ?? "",
    timezone: restaurant.timezone ?? "",
    currency: restaurant.currency ?? "AOA",
    language: restaurant.language ?? "pt",
    country: restaurant.country ?? "AO",
    city: restaurant.city ?? "",
  };
}

function buildRestaurantDraft(base: Restaurant, draft: BrandingDraft): Restaurant {
  return {
    ...base,
    ...draft,
    logo: draft.logo || null,
    favicon: draft.favicon || null,
    banner: draft.banner || null,
    coverImage: draft.coverImage || null,
    primaryColor: draft.primaryColor || null,
    secondaryColor: draft.secondaryColor || null,
    accentColor: draft.accentColor || null,
    backgroundColor: draft.backgroundColor || null,
    surfaceColor: draft.surfaceColor || null,
    textColor: draft.textColor || null,
    successColor: draft.successColor || null,
    warningColor: draft.warningColor || null,
    errorColor: draft.errorColor || null,
    fontFamily: draft.fontFamily || null,
    borderRadius: draft.borderRadius || null,
    buttonStyle: draft.buttonStyle || null,
    cardStyle: draft.cardStyle || null,
    heroStyle: draft.heroStyle || null,
    footerStyle: draft.footerStyle || null,
    instagram: draft.instagram || null,
    facebook: draft.facebook || null,
    tiktok: draft.tiktok || null,
    youtube: draft.youtube || null,
    linkedin: draft.linkedin || null,
    website: draft.website || null,
    supportPhone: draft.supportPhone || null,
    whatsapp: draft.whatsapp || null,
    openingHours: draft.openingHours || null,
    timezone: draft.timezone || null,
    currency: draft.currency || null,
    language: draft.language || null,
    country: draft.country || null,
    city: draft.city || null,
  };
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error ?? new Error("Falha ao ler arquivo."));
    reader.readAsDataURL(file);
  });
}

function UploadControl({
  title,
  description,
  value,
  onChange,
  inputRef,
  accentLabel,
}: {
  title: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  accentLabel: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-border/70 bg-card/90 p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Badge variant="secondary" className="rounded-full">
          {accentLabel}
        </Badge>
      </div>
      <div className="mt-4 overflow-hidden rounded-[1.25rem] border border-border/70 bg-muted/25">
        {value ? (
          <Image src={value} alt={title} width={640} height={320} className="h-40 w-full object-cover" unoptimized />
        ) : (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            Nenhum arquivo selecionado
          </div>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
          <Upload className="h-4 w-4" />
          Escolher arquivo
        </Button>
        <Button type="button" variant="ghost" onClick={() => onChange("")}>
          Limpar
        </Button>
      </div>
    </div>
  );
}

function PreviewViewport({
  viewport,
}: {
  viewport: "desktop" | "tablet" | "mobile";
}) {
  const themeContext = useRestaurantTheme();
  const previewWidth =
    viewport === "mobile" ? "max-w-[390px]" : viewport === "tablet" ? "max-w-[900px]" : "max-w-none";

  return (
    <div className={cn("mx-auto w-full", previewWidth)}>
      <div className={cn("rounded-[2rem] border border-border/70 p-4 shadow-[var(--shadow-card)]", themeContext.cardStyle.className)}>
        <div className="flex items-center justify-between gap-3 rounded-[1.5rem] border border-border/70 bg-background/85 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-primary">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">
                {themeContext.restaurantName.slice(0, 2)}
              </span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Live preview</p>
              <p className="font-semibold">{themeContext.restaurantName}</p>
            </div>
          </div>
          <Button className={themeContext.buttonStyle.className}>Reservar</Button>
        </div>

        <div className={cn("mt-4 grid gap-4", viewport === "mobile" ? "grid-cols-1" : "lg:grid-cols-[1.1fr_0.9fr]")}>
          <div className={cn("overflow-hidden rounded-[1.75rem] border border-border/70 p-4", themeContext.heroStyle.className)}>
            <div className="space-y-3">
              <Badge className="w-fit rounded-full bg-background/90 text-foreground backdrop-blur">
                Hero white label
              </Badge>
              <h3 className="text-2xl font-semibold tracking-tight">{themeContext.preview.title}</h3>
              <p className="text-sm leading-6 text-muted-foreground">{themeContext.preview.description}</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-card/90 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Primary</p>
                <p className="mt-2 text-sm font-medium">{themeContext.light.colors.primary}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card/90 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Accent</p>
                <p className="mt-2 text-sm font-medium">{themeContext.light.colors.accent}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card/90 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Radius</p>
                <p className="mt-2 text-sm font-medium">{THEME_REGISTRY.radius[themeContext.radius].label}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className={cn("rounded-[1.75rem] border border-border/70 p-4", themeContext.cardStyle.className)}>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Cards</p>
              <p className="mt-2 text-base font-semibold">Shadow and surface follow the restaurant identity.</p>
            </div>
            <div className={cn("rounded-[1.75rem] border border-border/70 p-4", themeContext.footerStyle.className)}>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Footer</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Contato, horário e links com o mesmo idioma visual da marca.</p>
            </div>
          </div>
        </div>

        {themeContext.warnings.length ? (
          <div className="mt-4 rounded-[1.5rem] border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-100">
            <p className="font-semibold">Atenção ao contraste</p>
            <ul className="mt-2 space-y-1">
              {themeContext.warnings.map((warning) => (
                <li key={warning}>• {warning}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function BrandingStudio({ restaurant }: BrandingStudioProps) {
  const [draft, setDraft] = useState<BrandingDraft>(() => buildDraft(restaurant));
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [result, formAction, pending] = useActionState(saveRestaurantBrandingAction, initialActionState);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);
  const faviconInputRef = useRef<HTMLInputElement | null>(null);

  const draftRestaurant = useMemo(() => buildRestaurantDraft(restaurant, draft), [draft, restaurant]);
  const previewTheme = useMemo(() => resolveThemeTokens(draftRestaurant), [draftRestaurant]);

  const handleFieldChange = (field: ThemeFieldName, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleFileChange = async (field: "logo" | "banner" | "favicon", event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    handleFieldChange(field, dataUrl);
  };

  const hiddenInputs = THEME_FIELD_NAMES.map((field) => (
    <input key={field} type="hidden" name={field} value={draft[field] ?? ""} />
  ));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Branding White Label"
        description="Personalize cores, fontes e assets do restaurante sem alterar código. Uploads locais já estão preparados para a futura integração com Cloudinary."
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={() => setDraft(buildDraft(restaurant))}>
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button type="submit" form="branding-form" disabled={pending}>
              <Sparkles className="h-4 w-4" />
              {pending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        )}
      />

      {result.message ? (
        <FeedbackState
          variant={result.ok ? "success" : "error"}
          title={result.ok ? "Branding atualizado" : "Falha ao salvar"}
          description={result.message}
          className="w-full"
        />
      ) : null}

      <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <form id="branding-form" action={formAction} className="space-y-8">
          {hiddenInputs}

          <SectionContainer className="rounded-[2rem] border border-border/70 bg-card/90 py-6 shadow-[var(--shadow-soft)]">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <SectionTitle title="Uploads" />
                <SectionSubtitle>
                  Os arquivos podem ser selecionados localmente e persistidos como data URLs até a integração com Cloudinary.
                </SectionSubtitle>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => void handleFileChange("logo", event)} />
                <UploadControl
                  title="Upload Logo"
                  description="Logotipo do restaurante."
                  value={draft.logo}
                  onChange={(value) => handleFieldChange("logo", value)}
                  inputRef={logoInputRef}
                  accentLabel="Logo"
                />
              </div>
              <div>
                <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => void handleFileChange("banner", event)} />
                <UploadControl
                  title="Upload Banner"
                  description="Imagem principal usada no hero."
                  value={draft.banner}
                  onChange={(value) => handleFieldChange("banner", value)}
                  inputRef={bannerInputRef}
                  accentLabel="Hero"
                />
              </div>
              <div>
                <input ref={faviconInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => void handleFileChange("favicon", event)} />
                <UploadControl
                  title="Upload Favicon"
                  description="Ícone do navegador."
                  value={draft.favicon}
                  onChange={(value) => handleFieldChange("favicon", value)}
                  inputRef={faviconInputRef}
                  accentLabel="Icon"
                />
              </div>
            </div>
          </SectionContainer>

          <SectionContainer className="rounded-[2rem] border border-border/70 bg-card/90 py-6 shadow-[var(--shadow-soft)]">
            <div className="mb-6">
              <SectionTitle title="Identidade Visual" />
              <SectionSubtitle>Fontes, cores e estilos de superfície usados em todo o sistema.</SectionSubtitle>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium">Fonte</span>
                <select
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                  value={draft.fontFamily}
                  onChange={(event) => handleFieldChange("fontFamily", event.target.value)}
                >
                  {Object.entries(THEME_REGISTRY.fonts).map(([key, font]) => (
                    <option key={key} value={key}>
                      {font.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium">Radius</span>
                <select
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                  value={draft.borderRadius}
                  onChange={(event) => handleFieldChange("borderRadius", event.target.value)}
                >
                  {Object.entries(THEME_REGISTRY.radius).map(([key, radius]) => (
                    <option key={key} value={key}>
                      {radius.label}
                    </option>
                  ))}
                </select>
              </label>
              {[
                { field: "primaryColor", label: "Cor Primária" },
                { field: "secondaryColor", label: "Cor Secundária" },
                { field: "accentColor", label: "Cor de Destaque" },
                { field: "backgroundColor", label: "Background" },
                { field: "surfaceColor", label: "Surface" },
                { field: "textColor", label: "Texto" },
              ].map((item) => (
                <label key={item.field} className="space-y-2">
                  <span className="text-sm font-medium">{item.label}</span>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      className="h-11 w-14 rounded-xl border border-input bg-background p-1"
                      value={draft[item.field as ThemeFieldName] || "#ffffff"}
                      onChange={(event) => handleFieldChange(item.field as ThemeFieldName, event.target.value)}
                    />
                    <Input
                      value={draft[item.field as ThemeFieldName]}
                      onChange={(event) => handleFieldChange(item.field as ThemeFieldName, event.target.value)}
                      placeholder="#0f766e"
                    />
                  </div>
                </label>
              ))}
              <label className="space-y-2">
                <span className="text-sm font-medium">Botão</span>
                <select
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                  value={draft.buttonStyle}
                  onChange={(event) => handleFieldChange("buttonStyle", event.target.value)}
                >
                  {Object.entries(THEME_REGISTRY.buttonStyles).map(([key, style]) => (
                    <option key={key} value={key}>
                      {style.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium">Cards</span>
                <select
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                  value={draft.cardStyle}
                  onChange={(event) => handleFieldChange("cardStyle", event.target.value)}
                >
                  {Object.entries(THEME_REGISTRY.cardStyles).map(([key, style]) => (
                    <option key={key} value={key}>
                      {style.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </SectionContainer>

          <SectionContainer className="rounded-[2rem] border border-border/70 bg-card/90 py-6 shadow-[var(--shadow-soft)]">
            <div className="mb-6">
              <SectionTitle title="Informações Públicas" />
              <SectionSubtitle>Dados usados no footer, localização e integração social.</SectionSubtitle>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { field: "website", label: "Website" },
                { field: "supportPhone", label: "Telefone de suporte" },
                { field: "whatsapp", label: "WhatsApp" },
                { field: "openingHours", label: "Horário" },
                { field: "timezone", label: "Timezone" },
                { field: "currency", label: "Moeda" },
                { field: "language", label: "Idioma" },
                { field: "country", label: "País" },
                { field: "city", label: "Cidade" },
                { field: "instagram", label: "Instagram" },
                { field: "facebook", label: "Facebook" },
                { field: "tiktok", label: "TikTok" },
                { field: "youtube", label: "YouTube" },
                { field: "linkedin", label: "LinkedIn" },
              ].map((item) => (
                <label key={item.field} className="space-y-2">
                  <span className="text-sm font-medium">{item.label}</span>
                  <Input
                    value={draft[item.field as ThemeFieldName]}
                    onChange={(event) => handleFieldChange(item.field as ThemeFieldName, event.target.value)}
                    placeholder={item.label}
                  />
                </label>
              ))}
            </div>
          </SectionContainer>
        </form>

        <SectionContainer className="rounded-[2rem] border border-border/70 bg-card/90 py-6 shadow-[var(--shadow-soft)]">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <SectionTitle title="Preview em tempo real" />
              <SectionSubtitle>Desktop, tablet e mobile com o tema atualizado instantaneamente.</SectionSubtitle>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant={viewport === "desktop" ? "default" : "outline"} size="icon" onClick={() => setViewport("desktop")}>
                <MonitorSmartphone className="h-4 w-4" />
              </Button>
              <Button type="button" variant={viewport === "tablet" ? "default" : "outline"} size="icon" onClick={() => setViewport("tablet")}>
                <TabletSmartphone className="h-4 w-4" />
              </Button>
              <Button type="button" variant={viewport === "mobile" ? "default" : "outline"} size="icon" onClick={() => setViewport("mobile")}>
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <RestaurantThemeProvider theme={previewTheme} className="relative">
            <style dangerouslySetInnerHTML={{ __html: previewTheme.cssText }} />
            <PreviewViewport viewport={viewport} />
          </RestaurantThemeProvider>
        </SectionContainer>
      </div>
    </div>
  );
}
