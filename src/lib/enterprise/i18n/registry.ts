import { resolveRuntimeConfig, setTenantRuntimeConfig, setUserRuntimeConfig } from "../config";
import type { LocalePreference, LocaleResolutionInput, NamespaceLoader, TranslationCatalog } from "./types";
import type { SupportedLocale } from "../config";

type I18nStore = {
  messages: Map<string, TranslationCatalog>;
  loaders: Map<string, NamespaceLoader>;
  cache: Map<string, TranslationCatalog>;
  tenantLocales: Map<string, LocalePreference>;
  userLocales: Map<string, LocalePreference>;
};

const store: I18nStore = {
  messages: new Map(),
  loaders: new Map(),
  cache: new Map(),
  tenantLocales: new Map(),
  userLocales: new Map(),
};

const FALLBACK_LOCALE: SupportedLocale = "pt-BR";
const SUPPORTED_LOCALES = new Set<SupportedLocale>(["pt-BR", "en-US", "es-ES"]);

function namespaceKey(locale: SupportedLocale, namespace: string) {
  return `${locale}:${namespace}`;
}

export function normalizeSupportedLocale(value?: string | null, fallback: SupportedLocale = FALLBACK_LOCALE) {
  return value && SUPPORTED_LOCALES.has(value as SupportedLocale) ? (value as SupportedLocale) : fallback;
}

function lookup(catalog: TranslationCatalog, key: string) {
  const segments = key.split(".");
  let current: TranslationCatalog | string | number | boolean | null | undefined = catalog;
  for (const segment of segments) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return undefined;
    }
    current = (current as TranslationCatalog)[segment];
  }
  return current;
}

function interpolate(value: string, params?: Record<string, unknown>) {
  if (!params) return value;
  return value.replace(/\{(\w+)\}/g, (_match, token) => {
    const param = params[token];
    return param === undefined || param === null ? "" : String(param);
  });
}

function resolvePreferenceLocale(input?: LocaleResolutionInput): SupportedLocale {
  const runtime = resolveRuntimeConfig(input?.tenantId ?? undefined, input?.userId ?? undefined);
  const userPreference = input?.userId ? store.userLocales.get(input.userId) ?? null : null;
  const tenantPreference = input?.tenantId ? store.tenantLocales.get(input.tenantId) ?? null : null;
  const runtimeTenantLocale = runtime.tenant?.locale as SupportedLocale | undefined;
  const runtimeUserLocale = runtime.user?.locale as SupportedLocale | undefined;

  return (
    userPreference?.locale ??
    runtimeUserLocale ??
    tenantPreference?.locale ??
    runtimeTenantLocale ??
    normalizeSupportedLocale(input?.restaurantLocale ?? undefined, runtime.defaultLocale) ??
    input?.fallback ??
    runtime.defaultLocale ??
    FALLBACK_LOCALE
  );
}

export function registerLocaleMessages(locale: SupportedLocale, namespace: string, catalog: TranslationCatalog) {
  store.messages.set(namespaceKey(locale, namespace), catalog);
  store.cache.delete(namespaceKey(locale, namespace));
  return catalog;
}

export function registerNamespaceLoader(namespace: string, loader: NamespaceLoader) {
  store.loaders.set(namespace, loader);
  return loader;
}

export async function loadNamespace(locale: SupportedLocale, namespace: string) {
  const cacheKey = namespaceKey(locale, namespace);
  const cached = store.cache.get(cacheKey);
  if (cached) return cached;

  const loaded = store.messages.get(cacheKey) ?? (await store.loaders.get(namespace)?.(locale)) ?? {};
  store.messages.set(cacheKey, loaded);
  store.cache.set(cacheKey, loaded);
  return loaded;
}

export function hasMessage(locale: SupportedLocale, namespace: string, key: string) {
  const catalog = store.messages.get(namespaceKey(locale, namespace));
  if (!catalog) return false;
  return lookup(catalog, key) !== undefined;
}

export async function translate(
  locale: SupportedLocale,
  namespace: string,
  key: string,
  fallback?: string,
  params?: Record<string, unknown>
) {
  const catalog = await loadNamespace(locale, namespace);
  const value = lookup(catalog, key);
  if (typeof value === "string") {
    return interpolate(value, params);
  }

  if (locale !== FALLBACK_LOCALE) {
    const fallbackCatalog = await loadNamespace(FALLBACK_LOCALE, namespace);
    const fallbackValue = lookup(fallbackCatalog, key);
    if (typeof fallbackValue === "string") {
      return interpolate(fallbackValue, params);
    }
  }

  return fallback ?? key;
}

export function setTenantLocale(tenantId: string, preference: Omit<LocalePreference, "source"> & { source?: LocalePreference["source"] }) {
  const localePreference: LocalePreference = {
    ...preference,
    source: preference.source ?? "tenant",
  };
  store.tenantLocales.set(tenantId, localePreference);
  setTenantRuntimeConfig({
    tenantId,
    locale: localePreference.locale,
    timezone: localePreference.timezone ?? null,
    currency: localePreference.currency ?? null,
    metadata: null,
  });
  return localePreference;
}

export function setUserLocale(userId: string, preference: Omit<LocalePreference, "source"> & { source?: LocalePreference["source"] }) {
  const localePreference: LocalePreference = {
    ...preference,
    source: preference.source ?? "user",
  };
  store.userLocales.set(userId, localePreference);
  setUserRuntimeConfig(userId, {
    tenantId: userId,
    locale: localePreference.locale,
    timezone: localePreference.timezone ?? null,
    currency: localePreference.currency ?? null,
    metadata: null,
  });
  return localePreference;
}

export function getTenantLocale(tenantId: string) {
  return store.tenantLocales.get(tenantId) ?? null;
}

export function getUserLocale(userId: string) {
  return store.userLocales.get(userId) ?? null;
}

export function resolveLocale(input?: LocaleResolutionInput) {
  return resolvePreferenceLocale(input);
}

export function formatCurrency(value: number, locale: SupportedLocale = FALLBACK_LOCALE, currency = resolveRuntimeConfig().defaultCurrency) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(value: Date | string | number, locale: SupportedLocale = FALLBACK_LOCALE, options?: Intl.DateTimeFormatOptions & { timezone?: string | null }) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: options?.timeStyle,
    timeZone: options?.timezone ?? resolveRuntimeConfig().defaultTimezone,
    ...options,
  }).format(new Date(value));
}

export function formatNumber(value: number, locale: SupportedLocale = FALLBACK_LOCALE, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(locale, options).format(value);
}

export function clearNamespaceCache(namespace?: string) {
  if (!namespace) {
    store.cache.clear();
    return;
  }

  for (const key of Array.from(store.cache.keys())) {
    if (key.endsWith(`:${namespace}`)) {
      store.cache.delete(key);
    }
  }
}
