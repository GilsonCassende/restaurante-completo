import type { ThemeRegistry, ThemePresetKey, ThemeRadiusKey } from "./types";

export const THEME_REGISTRY: ThemeRegistry = {
  fonts: {
    inter: {
      label: "Inter",
      stack: `"Inter", "Segoe UI", Arial, sans-serif`,
    },
    "plus-jakarta": {
      label: "Plus Jakarta Sans",
      stack: `"Plus Jakarta Sans", "Inter", "Segoe UI", Arial, sans-serif`,
    },
    "dm-sans": {
      label: "DM Sans",
      stack: `"DM Sans", "Inter", "Segoe UI", Arial, sans-serif`,
    },
    "space-grotesk": {
      label: "Space Grotesk",
      stack: `"Space Grotesk", "Inter", "Segoe UI", Arial, sans-serif`,
    },
    sora: {
      label: "Sora",
      stack: `"Sora", "Inter", "Segoe UI", Arial, sans-serif`,
    },
    fraunces: {
      label: "Fraunces",
      stack: `"Fraunces", "Times New Roman", serif`,
    },
  },
  radius: {
    sm: { label: "Small", value: "0.75rem" },
    md: { label: "Medium", value: "1rem" },
    lg: { label: "Large", value: "1.25rem" },
    xl: { label: "XL", value: "1.5rem" },
    "2xl": { label: "2XL", value: "2rem" },
    pill: { label: "Pill", value: "9999px" },
  },
  buttonStyles: {
    solid: {
      label: "Solid",
      description: "Botão premium com cor forte e leitura clara.",
      className: "shadow-[0_16px_36px_-20px_hsl(var(--primary)/0.5)]",
    },
    gradient: {
      label: "Gradient",
      description: "Botão com aparência mais sofisticada e comercial.",
      className: "bg-[image:var(--gradient-brand)] text-white shadow-[var(--shadow-glow)]",
    },
    outline: {
      label: "Outline",
      description: "Visual leve para contextos mais editoriais.",
      className: "border border-border bg-background text-foreground",
    },
  },
  cardStyles: {
    flat: {
      label: "Flat",
      description: "Cards mais limpos e diretos.",
      className: "border border-border/70 bg-card",
    },
    glass: {
      label: "Glass",
      description: "Camada translúcida com profundidade.",
      className: "border border-border/70 bg-card/80 backdrop-blur-xl",
    },
    soft: {
      label: "Soft",
      description: "Superfície acolhedora com sombras suaves.",
      className: "border border-border/70 bg-card/95 shadow-[var(--shadow-soft)]",
    },
  },
  heroStyles: {
    split: {
      label: "Split",
      description: "Hero em duas colunas com foco em conversão.",
      className: "bg-[image:var(--gradient-surface)]",
    },
    editorial: {
      label: "Editorial",
      description: "Hero com mais narrativa e respiro visual.",
      className: "bg-[image:var(--gradient-hero)]",
    },
    immersive: {
      label: "Immersive",
      description: "Hero com presença visual intensa.",
      className: "bg-[image:var(--gradient-brand-soft)]",
    },
  },
  footerStyles: {
    simple: {
      label: "Simple",
      description: "Footer objetivo e minimalista.",
      className: "bg-background/75",
    },
    rich: {
      label: "Rich",
      description: "Footer com mais densidade e informação.",
      className: "bg-[image:var(--gradient-surface)]",
    },
    minimal: {
      label: "Minimal",
      description: "Footer quase editorial.",
      className: "bg-transparent",
    },
  },
};

export const THEME_PRESET_KEYS = Object.keys(THEME_REGISTRY.fonts) as ThemePresetKey[];
export const THEME_RADIUS_KEYS = Object.keys(THEME_REGISTRY.radius) as ThemeRadiusKey[];
