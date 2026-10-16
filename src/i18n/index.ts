import { en } from './locales/en';

export const defaultLanguage = 'en' as const;

const locales = { en } as const;

export type TranslationKey = keyof typeof en;
export type TranslationParams = Record<string, string | number>;

const roleTranslationKeys: Record<string, TranslationKey> = {
  admin: 'roleAdmin',
  sub_admin: 'roleSubAdmin',
  franchise_admin: 'roleFranchiseAdmin',
  employee: 'roleEmployee',
};

export function t(key: TranslationKey, params: TranslationParams = {}): string {
  const template: string = locales[defaultLanguage][key];
  return template.replace(/\{\{(\w+)\}\}/g, (_match, name: string) =>
    String(params[name] ?? ''),
  );
}

export function translateRole(role: string): string {
  return t(roleTranslationKeys[role] ?? 'unknownRole');
}