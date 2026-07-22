import { useThemeTokens } from "@/context/theme/theme-provider";
import { THEME_REGISTRY } from "@/lib/theme";

export function useRestaurantTheme() {
  const theme = useThemeTokens();
  return {
    ...theme,
    registry: THEME_REGISTRY,
    buttonStyle: THEME_REGISTRY.buttonStyles[theme.buttonStyle],
    cardStyle: THEME_REGISTRY.cardStyles[theme.cardStyle],
    heroStyle: THEME_REGISTRY.heroStyles[theme.heroStyle],
    footerStyle: THEME_REGISTRY.footerStyles[theme.footerStyle],
    fontFamilyPreset: THEME_REGISTRY.fonts[theme.fontFamily],
  };
}
