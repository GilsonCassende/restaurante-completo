import type { Restaurant } from "@/types";
import { THEME_REGISTRY } from "./registry";
import {
  colorToCssHsl,
  contrastRatio,
  normalizeHexColor,
  shiftLightness,
} from "./utils";
import type { ThemeModeTokens, ThemePresetKey, ThemeRadiusKey, ThemeStyleKey, ThemeTokens } from "./types";

const DEFAULTS = {
  primary: "#0f766e",
  secondary: "#115e59",
  accent: "#f59e0b",
  background: "#f8fafc",
  surface: "#ffffff",
  text: "#0f172a",
  success: "#16a34a",
  warning: "#d97706",
  error: "#dc2626",
  fontFamily: "plus-jakarta" as ThemePresetKey,
  radius: "xl" as ThemeRadiusKey,
  buttonStyle: "gradient" as ThemeStyleKey,
  cardStyle: "glass" as ThemeStyleKey,
  heroStyle: "editorial" as ThemeStyleKey,
  footerStyle: "rich" as ThemeStyleKey,
};

function resolvePresetKey(value: string | null | undefined, fallback: ThemePresetKey) {
  const entries = Object.keys(THEME_REGISTRY.fonts) as ThemePresetKey[];
  if (value && entries.includes(value as ThemePresetKey)) {
    return value as ThemePresetKey;
  }
  return fallback;
}

function resolveRadiusKey(value: string | null | undefined, fallback: ThemeRadiusKey) {
  const entries = Object.keys(THEME_REGISTRY.radius) as ThemeRadiusKey[];
  if (value && entries.includes(value as ThemeRadiusKey)) {
    return value as ThemeRadiusKey;
  }
  return fallback;
}

function resolveStyleKey(value: string | null | undefined, fallback: ThemeStyleKey) {
  const entries = ["solid", "gradient", "outline", "flat", "glass", "soft", "split", "editorial", "immersive", "simple", "rich", "minimal"] as const;
  if (value && entries.includes(value as ThemeStyleKey)) {
    return value as ThemeStyleKey;
  }
  return fallback;
}

function buildModeTokens(rest: Restaurant, mode: "light" | "dark"): ThemeModeTokens {
  const primary = normalizeHexColor(rest.primaryColor, DEFAULTS.primary);
  const secondary = normalizeHexColor(rest.secondaryColor, DEFAULTS.secondary);
  const accent = normalizeHexColor(rest.accentColor, DEFAULTS.accent);
  const background =
    mode === "dark"
      ? normalizeHexColor(rest.backgroundColor, shiftLightness(DEFAULTS.background, -88))
      : normalizeHexColor(rest.backgroundColor, DEFAULTS.background);
  const surface =
    mode === "dark"
      ? normalizeHexColor(rest.surfaceColor, shiftLightness(DEFAULTS.surface, -88))
      : normalizeHexColor(rest.surfaceColor, DEFAULTS.surface);
  const text =
    mode === "dark"
      ? normalizeHexColor(rest.textColor, "#f8fafc")
      : normalizeHexColor(rest.textColor, DEFAULTS.text);
  const success = normalizeHexColor(rest.successColor, DEFAULTS.success);
  const warning = normalizeHexColor(rest.warningColor, DEFAULTS.warning);
  const error = normalizeHexColor(rest.errorColor, DEFAULTS.error);
  const border = mode === "dark" ? shiftLightness(surface, -14) : shiftLightness(surface, -10);
  const ring = primary;

  return {
    colors: {
      primary,
      secondary,
      accent,
      background,
      surface,
      text,
      success,
      warning,
      error,
      border,
      ring,
    },
    gradients: {
      brand: `linear-gradient(135deg, ${primary} 0%, ${accent} 48%, ${secondary} 100%)`,
      brandSoft: `linear-gradient(135deg, color-mix(in srgb, ${primary} 20%, transparent) 0%, color-mix(in srgb, ${accent} 18%, transparent) 52%, color-mix(in srgb, ${secondary} 16%, transparent) 100%)`,
      hero: `radial-gradient(circle at top left, color-mix(in srgb, ${primary} 22%, transparent), transparent 32%), radial-gradient(circle at top right, color-mix(in srgb, ${accent} 20%, transparent), transparent 30%), radial-gradient(circle at bottom center, color-mix(in srgb, ${secondary} 14%, transparent), transparent 34%)`,
      surface: `linear-gradient(180deg, color-mix(in srgb, ${surface} 92%, transparent) 0%, color-mix(in srgb, ${surface} 76%, transparent) 100%)`,
    },
    shadows: {
      soft: `0 18px 50px -28px color-mix(in srgb, ${text} 24%, transparent)`,
      card: `0 24px 70px -42px color-mix(in srgb, ${text} 32%, transparent)`,
      glow: `0 0 0 1px color-mix(in srgb, ${accent} 18%, transparent), 0 24px 70px -30px color-mix(in srgb, ${accent} 28%, transparent)`,
      float: `0 24px 60px -30px color-mix(in srgb, ${primary} 24%, transparent)`,
    },
  };
}

function buildCssVars(tokens: ThemeModeTokens, rest: Restaurant, registry = THEME_REGISTRY) {
  const fontFamily = resolvePresetKey(rest.fontFamily, DEFAULTS.fontFamily);
  const radius = resolveRadiusKey(rest.borderRadius, DEFAULTS.radius);
  const buttonStyle = resolveStyleKey(rest.buttonStyle, DEFAULTS.buttonStyle) as "solid" | "gradient" | "outline";
  const cardStyle = resolveStyleKey(rest.cardStyle, DEFAULTS.cardStyle) as "flat" | "glass" | "soft";
  const heroStyle = resolveStyleKey(rest.heroStyle, DEFAULTS.heroStyle) as "split" | "editorial" | "immersive";
  const footerStyle = resolveStyleKey(rest.footerStyle, DEFAULTS.footerStyle) as "simple" | "rich" | "minimal";

  return {
    "--background": colorToCssHsl(tokens.colors.background),
    "--foreground": colorToCssHsl(tokens.colors.text),
    "--card": colorToCssHsl(tokens.colors.surface),
    "--card-foreground": colorToCssHsl(tokens.colors.text),
    "--popover": colorToCssHsl(tokens.colors.surface),
    "--popover-foreground": colorToCssHsl(tokens.colors.text),
    "--primary": colorToCssHsl(tokens.colors.primary),
    "--primary-foreground": colorToCssHsl(modeAwareText(tokens.colors.primary, tokens.colors.background)),
    "--secondary": colorToCssHsl(tokens.colors.secondary),
    "--secondary-foreground": colorToCssHsl(modeAwareText(tokens.colors.secondary, tokens.colors.background)),
    "--muted": colorToCssHsl(tokens.colors.surface),
    "--muted-foreground": colorToCssHsl(shiftLightness(tokens.colors.text, 20)),
    "--accent": colorToCssHsl(tokens.colors.accent),
    "--accent-foreground": colorToCssHsl(modeAwareText(tokens.colors.accent, tokens.colors.background)),
    "--destructive": colorToCssHsl(tokens.colors.error),
    "--destructive-foreground": colorToCssHsl(modeAwareText(tokens.colors.error, tokens.colors.background)),
    "--border": colorToCssHsl(tokens.colors.border),
    "--input": colorToCssHsl(tokens.colors.border),
    "--ring": colorToCssHsl(tokens.colors.ring),
    "--radius": registry.radius[radius].value,
    "--radius-sm": "0.75rem",
    "--radius-md": "1rem",
    "--radius-lg": "1.25rem",
    "--radius-xl": "1.5rem",
    "--radius-2xl": "2rem",
    "--radius-full": "9999px",
    "--shadow-soft": tokens.shadows.soft,
    "--shadow-card": tokens.shadows.card,
    "--shadow-glow": tokens.shadows.glow,
    "--shadow-float": tokens.shadows.float,
    "--gradient-brand": tokens.gradients.brand,
    "--gradient-brand-soft": tokens.gradients.brandSoft,
    "--gradient-surface": tokens.gradients.surface,
    "--gradient-hero": tokens.gradients.hero,
    "--font-sans": registry.fonts[fontFamily].stack,
    "--font-display": registry.fonts[fontFamily].stack,
    "--restaurant-button-style": buttonStyle,
    "--restaurant-card-style": cardStyle,
    "--restaurant-hero-style": heroStyle,
    "--restaurant-footer-style": footerStyle,
    "--restaurant-primary": tokens.colors.primary,
    "--restaurant-secondary": tokens.colors.secondary,
    "--restaurant-accent": tokens.colors.accent,
    "--restaurant-background": tokens.colors.background,
    "--restaurant-surface": tokens.colors.surface,
    "--restaurant-text": tokens.colors.text,
  };
}

function modeAwareText(color: string, background: string) {
  return contrastRatio(color, background) >= 4.5 ? color : "#ffffff";
}

function buildCssText(restaurantId: string, light: ThemeModeTokens, dark: ThemeModeTokens, rest: Restaurant) {
  const lightVars = buildCssVars(light, rest);
  const darkVars = buildCssVars(dark, rest);
  const stringify = (vars: Record<string, string>) =>
    Object.entries(vars)
      .map(([key, value]) => `${key}:${value};`)
      .join("");

  return `
[data-restaurant-theme="${restaurantId}"]{${stringify(lightVars)}}
.dark [data-restaurant-theme="${restaurantId}"]{${stringify(darkVars)}}
`.trim();
}

export function resolveThemeTokens(restaurant: Restaurant): ThemeTokens {
  const light = buildModeTokens(restaurant, "light");
  const dark = buildModeTokens(restaurant, "dark");
  const fontFamily = resolvePresetKey(restaurant.fontFamily, DEFAULTS.fontFamily);
  const radius = resolveRadiusKey(restaurant.borderRadius, DEFAULTS.radius);
  const buttonStyle = resolveStyleKey(restaurant.buttonStyle, DEFAULTS.buttonStyle) as "solid" | "gradient" | "outline";
  const cardStyle = resolveStyleKey(restaurant.cardStyle, DEFAULTS.cardStyle) as "flat" | "glass" | "soft";
  const heroStyle = resolveStyleKey(restaurant.heroStyle, DEFAULTS.heroStyle) as "split" | "editorial" | "immersive";
  const footerStyle = resolveStyleKey(restaurant.footerStyle, DEFAULTS.footerStyle) as "simple" | "rich" | "minimal";

  const cssVariables = buildCssVars(light, restaurant);
  const cssText = buildCssText(restaurant.id, light, dark, restaurant);
  const primaryContrast = contrastRatio(light.colors.primary, light.colors.background);
  const textContrast = contrastRatio(light.colors.text, light.colors.background);
  const accentContrast = contrastRatio(light.colors.accent, light.colors.surface);
  const warnings = [
    primaryContrast < 4.5 ? "A cor primária pode ter contraste insuficiente sobre o fundo." : "",
    textContrast < 4.5 ? "A cor do texto pode ter contraste insuficiente sobre o fundo." : "",
    accentContrast < 3 ? "A cor de destaque pode ficar pouco legível sobre superfícies claras." : "",
  ].filter(Boolean);

  return {
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    themeMode: "system",
    fontFamily,
    radius,
    buttonStyle,
    cardStyle,
    heroStyle,
    footerStyle,
    registry: THEME_REGISTRY,
    light,
    dark,
    cssText,
    cssVariables,
    contrast: {
      primaryOnBackground: primaryContrast,
      textOnBackground: textContrast,
      accentOnSurface: accentContrast,
    },
    warnings,
    preview: {
      title: `${restaurant.name} visual identity`,
      description: [restaurant.city, restaurant.country].filter(Boolean).join(", ") || restaurant.slug,
      accentLabel: restaurant.website ?? restaurant.instagram ?? restaurant.whatsapp ?? "Brand preview",
    },
  };
}
