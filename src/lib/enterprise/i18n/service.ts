import { resolveRuntimeConfig, setTenantRuntimeConfig, setUserRuntimeConfig } from "../config";
import {
  clearNamespaceCache,
  formatCurrency,
  formatDate,
  formatNumber,
  getTenantLocale,
  getUserLocale,
  hasMessage,
  loadNamespace,
  registerLocaleMessages,
  registerNamespaceLoader,
  resolveLocale,
  setTenantLocale,
  setUserLocale,
  translate,
} from "./registry";
import type { I18nService, LocaleResolutionInput, TranslationCatalog } from "./types";

export function createI18nService(): I18nService {
  return {
    registerMessages: registerLocaleMessages,
    registerNamespaceLoader,
    loadNamespace,
    translate,
    hasMessage,
    resolveLocale(input?: LocaleResolutionInput) {
      return resolveLocale(input);
    },
    setTenantLocale(tenantId, preference) {
      return setTenantLocale(tenantId, preference);
    },
    setUserLocale(userId, preference) {
      return setUserLocale(userId, preference);
    },
    getTenantLocale,
    getUserLocale,
    formatCurrency(value, locale, currency) {
      const runtime = resolveRuntimeConfig();
      return formatCurrency(value, locale ?? runtime.defaultLocale, currency ?? runtime.defaultCurrency);
    },
    formatDate(value, locale, options) {
      const runtime = resolveRuntimeConfig();
      return formatDate(value, locale ?? runtime.defaultLocale, {
        ...options,
        timezone: options?.timezone ?? runtime.defaultTimezone,
      });
    },
    formatNumber(value, locale, options) {
      const runtime = resolveRuntimeConfig();
      return formatNumber(value, locale ?? runtime.defaultLocale, options);
    },
    clearNamespaceCache,
  };
}

export const i18n = createI18nService();

export function registerDefaultMessages() {
  const commonPt: TranslationCatalog = {
    app: {
      name: "RestaurantPro",
      description: "Plataforma enterprise para restaurantes.",
    },
    seo: {
      homeTitle: "RestaurantPro",
    },
  };

  const commonEn: TranslationCatalog = {
    app: {
      name: "RestaurantPro",
      description: "Enterprise restaurant platform.",
    },
    seo: {
      homeTitle: "RestaurantPro",
    },
  };

  const commonEs: TranslationCatalog = {
    app: {
      name: "RestaurantPro",
      description: "Plataforma empresarial para restaurantes.",
    },
    seo: {
      homeTitle: "RestaurantPro",
    },
  };

  registerLocaleMessages("pt-BR", "common", commonPt);
  registerLocaleMessages("en-US", "common", commonEn);
  registerLocaleMessages("es-ES", "common", commonEs);

  return {
    commonPt,
    commonEn,
    commonEs,
  };
}

registerDefaultMessages();

export function resolveCurrentLocale(input?: LocaleResolutionInput & { tenantId?: string | null; userId?: string | null }) {
  return resolveLocale(input);
}

export function syncTenantLocale(tenantId: string, locale: Parameters<typeof setTenantLocale>[1]) {
  const preference = setTenantLocale(tenantId, locale);
  setTenantRuntimeConfig({
    tenantId,
    locale: preference.locale,
    timezone: preference.timezone ?? null,
    currency: preference.currency ?? null,
    metadata: null,
  });
  return preference;
}

export function syncUserLocale(userId: string, locale: Parameters<typeof setUserLocale>[1]) {
  const preference = setUserLocale(userId, locale);
  setUserRuntimeConfig(userId, {
    tenantId: userId,
    locale: preference.locale,
    timezone: preference.timezone ?? null,
    currency: preference.currency ?? null,
    metadata: null,
  });
  return preference;
}
