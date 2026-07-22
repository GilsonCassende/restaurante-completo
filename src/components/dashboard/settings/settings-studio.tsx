"use client";

import { useActionState, useMemo, useRef, useState, type ReactNode } from "react";
import { useFieldArray, useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftRight, Plus, RotateCcw, Save, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveRestaurantSettingsAction, type SettingsActionState } from "@/actions/settings";
import { FeedbackState, SectionContainer, SectionSubtitle, SectionTitle } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Restaurant } from "@/types";
import { restaurantSettingsSchema, type RestaurantSettingsInput } from "@/schemas";
import { SettingsTabs, type SettingsTabItem } from "./settings-tabs";
import { SettingsSwitch } from "./settings-switch";
import { SettingsSelect } from "./settings-select";
import { SettingsUpload } from "./settings-upload";
import { SettingsPreview } from "./settings-preview";

type SettingsStudioProps = {
  restaurant: Restaurant;
};

const SETTINGS_TABS: SettingsTabItem[] = [
  { id: "geral", label: "Geral", description: "História, missão e descrição da casa." },
  { id: "contato", label: "Contato", description: "Telefones, e-mail e website." },
  { id: "endereco", label: "Endereço", description: "Localização estruturada e coordenadas." },
  { id: "funcionamento", label: "Funcionamento", description: "Horários, feriados e disponibilidade." },
  { id: "redes", label: "Redes Sociais", description: "Presença social do restaurante." },
  { id: "seo", label: "SEO", description: "Meta tags e cards sociais." },
  { id: "branding", label: "Branding", description: "Integração com a Fase 5D." },
  { id: "integracoes", label: "Integrações", description: "Cloudinary, Maps, Analytics e Pixel." },
  { id: "comercial", label: "Comercial", description: "Pedido mínimo e entrega." },
];

const WEEK_DAYS = [
  { day: "monday", label: "Segunda" },
  { day: "tuesday", label: "Terça" },
  { day: "wednesday", label: "Quarta" },
  { day: "thursday", label: "Quinta" },
  { day: "friday", label: "Sexta" },
  { day: "saturday", label: "Sábado" },
  { day: "sunday", label: "Domingo" },
] as const;

const DEFAULT_WEEKLY_HOURS: RestaurantSettingsInput["weeklyHours"] = WEEK_DAYS.map((item) => ({
  day: item.day,
  open: "12:00",
  close: "23:00",
  closed: item.day === "sunday",
}));

const DEFAULT_SETTINGS = {
  integrations: {
    cloudinary: { enabled: false, cloudName: "", uploadPreset: "" },
    googleMaps: { enabled: false, apiKey: "", placeId: "" },
    googleAnalytics: { enabled: false, measurementId: "" },
    metaPixel: { enabled: false, pixelId: "" },
    whatsapp: { enabled: false, phone: "" },
  },
};

const initialActionState: SettingsActionState = {
  ok: false,
  message: "",
};

function buildDefaultValues(restaurant: Restaurant): RestaurantSettingsInput {
  return {
    name: restaurant.name,
    slogan: restaurant.slogan ?? "",
    history: restaurant.history ?? "",
    mission: restaurant.mission ?? "",
    description: restaurant.description ?? "",
    phone: restaurant.phone ?? "",
    supportPhone: restaurant.supportPhone ?? "",
    whatsapp: restaurant.whatsapp ?? "",
    email: restaurant.email ?? "",
    website: restaurant.website ?? "",
    instagram: restaurant.instagram ?? "",
    facebook: restaurant.facebook ?? "",
    tiktok: restaurant.tiktok ?? "",
    youtube: restaurant.youtube ?? "",
    linkedin: restaurant.linkedin ?? "",
    country: restaurant.country ?? "",
    state: restaurant.state ?? "",
    city: restaurant.city ?? "",
    neighborhood: restaurant.neighborhood ?? "",
    street: restaurant.street ?? "",
    number: restaurant.number ?? "",
    postalCode: restaurant.postalCode ?? "",
    latitude: restaurant.latitude ?? undefined,
    longitude: restaurant.longitude ?? undefined,
    openingHours: restaurant.openingHours ?? "",
    timezone: restaurant.timezone ?? "",
    currency: restaurant.currency ?? "AOA",
    language: restaurant.language ?? "pt",
    seoTitle: restaurant.seoTitle ?? restaurant.name,
    seoDescription: restaurant.seoDescription ?? restaurant.description ?? "",
    seoKeywords: restaurant.seoKeywords ?? "",
    ogImage: restaurant.ogImage ?? "",
    twitterTitle: restaurant.twitterTitle ?? restaurant.seoTitle ?? restaurant.name,
    twitterDescription: restaurant.twitterDescription ?? restaurant.seoDescription ?? restaurant.description ?? "",
    twitterImage: restaurant.twitterImage ?? "",
    isOpen: restaurant.isOpen ?? true,
    minimumOrderAmount: restaurant.minimumOrderAmount ?? undefined,
    deliveryFee: restaurant.deliveryFee ?? undefined,
    deliveryRadiusKm: restaurant.deliveryRadiusKm ?? undefined,
    averagePreparationTime: restaurant.averagePreparationTime ?? undefined,
    weeklyHours: restaurant.weeklyHours?.length
      ? restaurant.weeklyHours
      : DEFAULT_WEEKLY_HOURS,
    holidays: restaurant.holidays ?? [],
    integrations: restaurant.integrations
      ? {
          cloudinary: {
            enabled: restaurant.integrations.cloudinary.enabled,
            cloudName: restaurant.integrations.cloudinary.cloudName,
            uploadPreset: restaurant.integrations.cloudinary.uploadPreset,
          },
          googleMaps: {
            enabled: restaurant.integrations.googleMaps.enabled,
            apiKey: restaurant.integrations.googleMaps.apiKey,
            placeId: restaurant.integrations.googleMaps.placeId,
          },
          googleAnalytics: {
            enabled: restaurant.integrations.googleAnalytics.enabled,
            measurementId: restaurant.integrations.googleAnalytics.measurementId,
          },
          metaPixel: {
            enabled: restaurant.integrations.metaPixel.enabled,
            pixelId: restaurant.integrations.metaPixel.pixelId,
          },
          whatsapp: {
            enabled: restaurant.integrations.whatsapp.enabled,
            phone: restaurant.integrations.whatsapp.phone,
          },
        }
      : DEFAULT_SETTINGS.integrations,
  };
}

function toFormData(values: RestaurantSettingsInput) {
  const formData = new FormData();
  const append = (name: string, value: string | number | boolean | null | undefined) => {
    if (value === null || value === undefined || value === "") return;
    if (typeof value === "number" && Number.isNaN(value)) return;
    formData.set(name, String(value));
  };

  append("name", values.name);
  append("slogan", values.slogan ?? "");
  append("history", values.history ?? "");
  append("mission", values.mission ?? "");
  append("description", values.description ?? "");
  append("phone", values.phone ?? "");
  append("supportPhone", values.supportPhone ?? "");
  append("whatsapp", values.whatsapp ?? "");
  append("email", values.email ?? "");
  append("website", values.website ?? "");
  append("instagram", values.instagram ?? "");
  append("facebook", values.facebook ?? "");
  append("tiktok", values.tiktok ?? "");
  append("youtube", values.youtube ?? "");
  append("linkedin", values.linkedin ?? "");
  append("country", values.country ?? "");
  append("state", values.state ?? "");
  append("city", values.city ?? "");
  append("neighborhood", values.neighborhood ?? "");
  append("street", values.street ?? "");
  append("number", values.number ?? "");
  append("postalCode", values.postalCode ?? "");
  append("latitude", values.latitude ?? "");
  append("longitude", values.longitude ?? "");
  append("openingHours", values.openingHours ?? "");
  append("timezone", values.timezone ?? "");
  append("currency", values.currency ?? "");
  append("language", values.language ?? "");
  append("seoTitle", values.seoTitle ?? "");
  append("seoDescription", values.seoDescription ?? "");
  append("seoKeywords", values.seoKeywords ?? "");
  append("ogImage", values.ogImage ?? "");
  append("twitterTitle", values.twitterTitle ?? "");
  append("twitterDescription", values.twitterDescription ?? "");
  append("twitterImage", values.twitterImage ?? "");
  append("isOpen", values.isOpen ? "true" : "false");
  append("minimumOrderAmount", values.minimumOrderAmount ?? "");
  append("deliveryFee", values.deliveryFee ?? "");
  append("deliveryRadiusKm", values.deliveryRadiusKm ?? "");
  append("averagePreparationTime", values.averagePreparationTime ?? "");
  formData.set("weeklyHours", JSON.stringify(values.weeklyHours));
  formData.set("holidays", JSON.stringify(values.holidays));
  formData.set("integrations", JSON.stringify(values.integrations));
  return formData;
}

function SectionCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <SectionContainer className="rounded-[2rem] border border-border/70 bg-card/90 py-6 shadow-[var(--shadow-soft)]">
      <div className="mb-6">
        <SectionTitle title={title} />
        <SectionSubtitle>{description}</SectionSubtitle>
      </div>
      {children}
    </SectionContainer>
  );
}

export function SettingsStudio({ restaurant }: SettingsStudioProps) {
  const [activeTab, setActiveTab] = useState("geral");
  const router = useRouter();
  const brandingUploadRef = useRef<HTMLInputElement | null>(null);
  const [result, formAction, pending] = useActionState(saveRestaurantSettingsAction, initialActionState);
  const defaultValues = useMemo(() => buildDefaultValues(restaurant), [restaurant]);

  const form = useForm<RestaurantSettingsInput>({
    resolver: zodResolver(restaurantSettingsSchema),
    defaultValues,
    mode: "onSubmit",
  });

  const weeklyHours = useFieldArray({
    control: form.control,
    name: "weeklyHours",
  });

  const holidays = useFieldArray({
    control: form.control,
    name: "holidays",
  });

  const draft = form.watch();

  const handleReset = () => {
    form.reset(defaultValues);
    setActiveTab("geral");
  };

  const onSubmit = form.handleSubmit((values) => {
    const payload = toFormData(values);
    void formAction(payload);
  });

  const activeContent = useMemo(() => {
    switch (activeTab) {
      case "contato":
        return (
          <SectionCard title="Contato" description="Telefones, WhatsApp, e-mail e website públicos.">
            <div className="grid gap-4 md:grid-cols-2">
              <Input {...form.register("phone")} placeholder="+244..." />
              <Input {...form.register("supportPhone")} placeholder="+244..." />
              <Input {...form.register("whatsapp")} placeholder="+244..." />
              <Input {...form.register("email")} type="email" placeholder="contato@restaurante.com" />
              <Input {...form.register("website")} placeholder="https://..." />
            </div>
          </SectionCard>
        );
      case "endereco":
        return (
          <SectionCard title="Endereço" description="Localização detalhada para mapa, SEO local e operação.">
            <div className="grid gap-4 md:grid-cols-2">
              <Input {...form.register("country")} placeholder="País" />
              <Input {...form.register("state")} placeholder="Estado" />
              <Input {...form.register("city")} placeholder="Cidade" />
              <Input {...form.register("neighborhood")} placeholder="Bairro" />
              <Input {...form.register("street")} placeholder="Rua" />
              <Input {...form.register("number")} placeholder="Número" />
              <Input {...form.register("postalCode")} placeholder="Código Postal" />
              <Input {...form.register("latitude", { valueAsNumber: true })} type="number" step="any" placeholder="-8.8" />
              <Input {...form.register("longitude", { valueAsNumber: true })} type="number" step="any" placeholder="13.2" />
            </div>
          </SectionCard>
        );
      case "funcionamento":
        return (
          <SectionCard title="Funcionamento" description="Aberto/fechado, horários semanais, feriados e preparo médio.">
            <div className="space-y-6">
              <Controller
                control={form.control}
                name="isOpen"
                render={({ field }) => (
                  <SettingsSwitch
                    checked={Boolean(field.value)}
                    onCheckedChange={(checked) => field.onChange(checked)}
                    label="Restaurante aberto"
                    description="Use este toggle para fechar temporariamente o restaurante."
                  />
                )}
              />

              <div className="grid gap-3">
                {weeklyHours.fields.map((field, index) => (
                  <div key={field.id} className="grid gap-3 rounded-[1.5rem] border border-border/70 bg-background/70 p-4 md:grid-cols-[0.9fr_1fr_1fr]">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">
                        {WEEK_DAYS.find((item) => item.day === form.getValues(`weeklyHours.${index}.day`))?.label ?? "Dia"}
                      </p>
                      <Controller
                        control={form.control}
                        name={`weeklyHours.${index}.closed`}
                        render={({ field: switchField }) => (
                          <SettingsSwitch
                            checked={Boolean(switchField.value)}
                            onCheckedChange={(checked) => switchField.onChange(checked)}
                            label="Fechado"
                            description="Desative quando o restaurante não estiver operando."
                          />
                        )}
                      />
                    </div>
                    <Input {...form.register(`weeklyHours.${index}.open`)} type="time" />
                    <Input {...form.register(`weeklyHours.${index}.close`)} type="time" />
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Feriados</p>
                    <p className="text-xs text-muted-foreground">Defina datas especiais ou períodos em que o restaurante fecha.</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => holidays.append({ date: "", label: "", closed: true })}
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar feriado
                  </Button>
                </div>
                <div className="space-y-3">
                  {holidays.fields.length ? (
                    holidays.fields.map((field, index) => (
                      <div key={field.id} className="grid gap-3 rounded-[1.5rem] border border-border/70 bg-background/70 p-4 md:grid-cols-[1fr_1fr_auto]">
                        <Input {...form.register(`holidays.${index}.date`)} type="date" />
                        <Input {...form.register(`holidays.${index}.label`)} placeholder="Nome do feriado" />
                        <div className="flex items-center gap-2">
                          <Controller
                            control={form.control}
                            name={`holidays.${index}.closed`}
                            render={({ field: switchField }) => (
                              <SettingsSwitch
                                checked={Boolean(switchField.value)}
                                onCheckedChange={(checked) => switchField.onChange(checked)}
                                label="Fechado"
                                description="Fecha no período."
                              />
                            )}
                          />
                          <Button type="button" variant="ghost" onClick={() => holidays.remove(index)}>
                            Remover
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[1.5rem] border border-dashed border-border/70 bg-muted/25 p-6 text-sm text-muted-foreground">
                      Nenhum feriado cadastrado ainda.
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium">Tempo médio de preparo</span>
                  <Input {...form.register("averagePreparationTime", { valueAsNumber: true })} type="number" min="0" placeholder="25" />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium">Horário texto legado</span>
                  <Textarea {...form.register("openingHours")} placeholder="12h às 23h" />
                </label>
              </div>
            </div>
          </SectionCard>
        );
      case "redes":
        return (
          <SectionCard title="Redes Sociais" description="Canais oficiais do restaurante.">
            <div className="grid gap-4 md:grid-cols-2">
              <Input {...form.register("instagram")} placeholder="https://instagram.com/..." />
              <Input {...form.register("facebook")} placeholder="https://facebook.com/..." />
              <Input {...form.register("tiktok")} placeholder="https://tiktok.com/@..." />
              <Input {...form.register("youtube")} placeholder="https://youtube.com/@..." />
              <Input {...form.register("linkedin")} placeholder="https://linkedin.com/..." />
            </div>
          </SectionCard>
        );
      case "seo":
        return (
          <SectionCard title="SEO" description="Título, descrição, keywords e cards sociais.">
            <div className="grid gap-4 md:grid-cols-2">
              <Input {...form.register("seoTitle")} placeholder="Título SEO" />
              <Input {...form.register("seoDescription")} placeholder="Descrição SEO" />
              <Input {...form.register("seoKeywords")} placeholder="keywords, separadas, por vírgula" />
              <Input {...form.register("ogImage")} placeholder="https://..." />
              <Input {...form.register("twitterTitle")} placeholder="Twitter title" />
              <Input {...form.register("twitterDescription")} placeholder="Twitter description" />
              <Input {...form.register("twitterImage")} placeholder="https://..." />
            </div>
          </SectionCard>
        );
      case "branding":
        return (
          <SectionCard title="Branding" description="O branding visual avançado continua centralizado na Fase 5D.">
            <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
              <SettingsUpload
                title="Atalho de upload"
                description="Os uploads de logo, banner e favicon seguem na área premium de branding."
                value={restaurant.logo ?? restaurant.banner ?? restaurant.favicon ?? ""}
                onClear={() => {}}
                inputRef={brandingUploadRef}
                accentLabel="Fase 5D"
                onChooseFile={() => router.push("/dashboard/branding")}
              />
              <div className="rounded-[1.75rem] border border-border/70 bg-background/70 p-5">
                <p className="text-sm font-semibold">Resumo atual</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Logotipo, banner e paleta já são consumidos automaticamente pela landing, dashboard e checkout.
                </p>
                <div className="mt-4 space-y-2 text-sm">
                  <p>Logo: {restaurant.logo ? "Configurado" : "Padrão"}</p>
                  <p>Banner: {restaurant.banner ? "Configurado" : "Padrão"}</p>
                  <p>Fonte: {restaurant.fontFamily ?? "Padrão"}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild>
                    <Link href="/dashboard/branding">
                      <ArrowLeftRight className="h-4 w-4" />
                      Abrir branding
                    </Link>
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setActiveTab("geral")}>
                    Voltar ao início
                  </Button>
                </div>
              </div>
            </div>
          </SectionCard>
        );
      case "integracoes":
        return (
          <SectionCard title="Integrações" description="Estrutura pronta para conectar serviços externos no futuro.">
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-4 rounded-[1.75rem] border border-border/70 bg-background/70 p-5">
                <Controller
                  control={form.control}
                  name="integrations.cloudinary.enabled"
                  render={({ field }) => (
                    <SettingsSwitch
                      checked={Boolean(field.value)}
                      onCheckedChange={field.onChange}
                      label="Cloudinary"
                      description="Preparado para upload e entrega de mídia."
                    />
                  )}
                />
                <Input {...form.register("integrations.cloudinary.cloudName")} placeholder="Cloud name" />
                <Input {...form.register("integrations.cloudinary.uploadPreset")} placeholder="Upload preset" />
              </div>

              <div className="space-y-4 rounded-[1.75rem] border border-border/70 bg-background/70 p-5">
                <Controller
                  control={form.control}
                  name="integrations.googleMaps.enabled"
                  render={({ field }) => (
                    <SettingsSwitch
                      checked={Boolean(field.value)}
                      onCheckedChange={field.onChange}
                      label="Google Maps"
                      description="Mapas e localização inteligente."
                    />
                  )}
                />
                <Input {...form.register("integrations.googleMaps.apiKey")} placeholder="API key" />
                <Input {...form.register("integrations.googleMaps.placeId")} placeholder="Place ID" />
              </div>

              <div className="space-y-4 rounded-[1.75rem] border border-border/70 bg-background/70 p-5">
                <Controller
                  control={form.control}
                  name="integrations.googleAnalytics.enabled"
                  render={({ field }) => (
                    <SettingsSwitch
                      checked={Boolean(field.value)}
                      onCheckedChange={field.onChange}
                      label="Google Analytics"
                      description="Medição de tráfego e conversão."
                    />
                  )}
                />
                <Input {...form.register("integrations.googleAnalytics.measurementId")} placeholder="G-XXXXXXXXXX" />
              </div>

              <div className="space-y-4 rounded-[1.75rem] border border-border/70 bg-background/70 p-5">
                <Controller
                  control={form.control}
                  name="integrations.metaPixel.enabled"
                  render={({ field }) => (
                    <SettingsSwitch
                      checked={Boolean(field.value)}
                      onCheckedChange={field.onChange}
                      label="Meta Pixel"
                      description="Medição e remarketing da Meta."
                    />
                  )}
                />
                <Input {...form.register("integrations.metaPixel.pixelId")} placeholder="Pixel ID" />
              </div>

              <div className="space-y-4 rounded-[1.75rem] border border-border/70 bg-background/70 p-5 xl:col-span-2">
                <Controller
                  control={form.control}
                  name="integrations.whatsapp.enabled"
                  render={({ field }) => (
                    <SettingsSwitch
                      checked={Boolean(field.value)}
                      onCheckedChange={field.onChange}
                      label="WhatsApp"
                      description="Canal de conversão e atendimento."
                    />
                  )}
                />
                <Input {...form.register("integrations.whatsapp.phone")} placeholder="+244..." />
              </div>
            </div>
          </SectionCard>
        );
      case "comercial":
        return (
          <SectionCard title="Comercial" description="Configurações de pedido e entrega.">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium">Pedido mínimo</span>
                <Input {...form.register("minimumOrderAmount", { valueAsNumber: true })} type="number" min="0" step="0.01" placeholder="15000" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium">Taxa de entrega</span>
                <Input {...form.register("deliveryFee", { valueAsNumber: true })} type="number" min="0" step="0.01" placeholder="1000" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium">Raio de entrega (km)</span>
                <Input {...form.register("deliveryRadiusKm", { valueAsNumber: true })} type="number" min="0" step="1" placeholder="8" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium">Tempo médio</span>
                <Input {...form.register("averagePreparationTime", { valueAsNumber: true })} type="number" min="0" step="1" placeholder="25" />
              </label>
              <SettingsSelect label="Moeda" {...form.register("currency")}>
                <option value="AOA">AOA</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </SettingsSelect>
              <SettingsSelect label="Idioma" {...form.register("language")}>
                <option value="pt">Português</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </SettingsSelect>
            </div>
          </SectionCard>
        );
      default:
        return (
          <SectionCard title="Geral" description="História, missão e descrição institucional do restaurante.">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium">Nome</span>
                <Input {...form.register("name")} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium">Slogan</span>
                <Input {...form.register("slogan")} placeholder="Frase curta da marca" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium">História</span>
                <Textarea {...form.register("history")} placeholder="História da casa." />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium">Missão</span>
                <Textarea {...form.register("mission")} placeholder="Missão da marca." />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium">Descrição</span>
                <Textarea {...form.register("description")} placeholder="Descrição institucional." />
              </label>
            </div>
          </SectionCard>
        );
    }
  }, [activeTab, form, holidays, router, restaurant, weeklyHours]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-sm backdrop-blur xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">RestaurantPro CMS</p>
          <h1 className="text-3xl font-semibold tracking-tight">Centro de Configuração do Restaurante</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Administre dados institucionais, operação, SEO e integrações sem alterar código, com isolamento por restaurante.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <Button type="submit" form="settings-form" disabled={pending}>
            <Save className="h-4 w-4" />
            {pending ? "Salvando..." : "Salvar configurações"}
          </Button>
        </div>
      </div>

      {result.message ? (
        <FeedbackState
          variant={result.ok ? "success" : "error"}
          title={result.ok ? "Configurações atualizadas" : "Falha ao salvar"}
          description={result.message}
        />
      ) : pending ? (
        <FeedbackState variant="loading" title="Salvando configurações" description="Aguarde enquanto persistimos os dados do restaurante." />
      ) : null}

      <SettingsTabs value={activeTab} onValueChange={setActiveTab} tabs={SETTINGS_TABS} />

      <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <form id="settings-form" onSubmit={onSubmit} className="space-y-8">
          {activeContent}
        </form>

        <div className="space-y-8">
          <SettingsPreview restaurant={restaurant} draft={draft} />
          <SectionContainer className="rounded-[2rem] border border-border/70 bg-card/90 py-6 shadow-[var(--shadow-soft)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <SectionTitle title="Status rápido" />
                <SectionSubtitle>Resumo técnico da configuração atual.</SectionSubtitle>
              </div>
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">SEO</p>
                <p className="mt-2 text-sm font-medium">{draft.seoTitle || "Sem título SEO"}</p>
                <p className="mt-1 text-xs text-muted-foreground">{draft.seoKeywords || "Sem keywords"}</p>
              </div>
              <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Funcionamento</p>
                <p className="mt-2 text-sm font-medium">{draft.isOpen ? "Aberto" : "Fechado"}</p>
                <p className="mt-1 text-xs text-muted-foreground">{draft.openingHours || "Horário legado não informado"}</p>
              </div>
            </div>
          </SectionContainer>
        </div>
      </div>
    </div>
  );
}
