import { en } from './locales/en';
import { kn } from './locales/kn';
import type { TranslationKey, TranslationParams } from './types';

export type { TranslationKey, TranslationParams } from './types';
export type AppLanguage = 'en' | 'kn';

export const defaultLanguage = 'en' as const;

const locales: Record<AppLanguage, Partial<Record<TranslationKey, string>>> = { en, kn };
let currentLanguage: AppLanguage = defaultLanguage;
const listeners = new Set<() => void>();

export function getLanguage(): AppLanguage {
  return currentLanguage;
}

const languageLocales: Record<AppLanguage, string> = { en: 'en-IN', kn: 'kn-IN' };

/** BCP 47 locale for Intl date/number formatting in the current app language. */
export function getLocale(): string {
  return languageLocales[currentLanguage];
}

export function setLanguage(language: AppLanguage): void {
  if (currentLanguage === language) return;
  currentLanguage = language;
  listeners.forEach((listener) => listener());
}

export function subscribeToLanguageChanges(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const roleTranslationKeys: Record<string, TranslationKey> = {
  admin: 'roleAdmin',
  sub_admin: 'roleSubAdmin',
  franchise_admin: 'roleFranchiseAdmin',
  employee: 'roleEmployee',
};

export function t(key: TranslationKey, params: TranslationParams = {}): string {
  // Partial locale dictionaries fall back to English before exposing a raw translation key.
  const template = locales[currentLanguage][key] ?? locales[defaultLanguage][key] ?? key;
  return template.replace(/\{\{(\w+)\}\}/g, (_match, name: string) =>
    String(params[name] ?? ''),
  );
}

export function translateRole(role: string): string {
  return t(roleTranslationKeys[role] ?? 'unknownRole');
}