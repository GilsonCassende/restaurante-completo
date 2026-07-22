import type { SupportedCurrency, SupportedLocale } from "../config";

export type TranslationValue = string | number | boolean | null | undefined;

export interface TranslationCatalog {
  [key: string]: TranslationValue | TranslationCatalog;
}

export type TranslationNamespace = string;

export type NamespaceLoader = (locale: SupportedLocale) => Promise<TranslationCatalog> | TranslationCatalog;

export type LocalePreferenceSource = "tenant" | "user" | "restaurant" | "global";

export type LocalePreference = {
  locale: SupportedLocale;
  timezone?: string | null;
  currency?: SupportedCurrency | null;
  source: LocalePreferenceSource;
};

export type LocaleResolutionInput = {
  tenantId?: string | null;
  userId?: string | null;
  restaurantLocale?: string | null;
  fallback?: SupportedLocale;
};

export type FormatDateOptions = Intl.DateTimeFormatOptions & {
  timezone?: string | null;
};

export type I18nService = {
  registerMessages: (locale: SupportedLocale, namespace: string, catalog: TranslationCatalog) => TranslationCatalog;
  registerNamespaceLoader: (namespace: string, loader: NamespaceLoader) => NamespaceLoader;
  loadNamespace: (locale: SupportedLocale, namespace: string) => Promise<TranslationCatalog>;
  translate: (locale: SupportedLocale, namespace: string, key: string, fallback?: string, params?: Record<string, TranslationValue>) => Promise<string>;
  hasMessage: (locale: SupportedLocale, namespace: string, key: string) => boolean;
  resolveLocale: (input?: LocaleResolutionInput) => SupportedLocale;
  setTenantLocale: (tenantId: string, preference: Omit<LocalePreference, "source"> & { source?: LocalePreferenceSource }) => LocalePreference;
  setUserLocale: (userId: string, preference: Omit<LocalePreference, "source"> & { source?: LocalePreferenceSource }) => LocalePreference;
  getTenantLocale: (tenantId: string) => LocalePreference | null;
  getUserLocale: (userId: string) => LocalePreference | null;
  formatCurrency: (value: number, locale?: SupportedLocale, currency?: SupportedCurrency) => string;
  formatDate: (value: Date | string | number, locale?: SupportedLocale, options?: FormatDateOptions) => string;
  formatNumber: (value: number, locale?: SupportedLocale, options?: Intl.NumberFormatOptions) => string;
  clearNamespaceCache: (namespace?: string) => void;
};
