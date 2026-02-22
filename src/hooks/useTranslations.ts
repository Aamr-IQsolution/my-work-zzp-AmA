
import { useMemo } from 'react';
import { ar } from '../locales/ar';
import { nl } from '../locales/nl';

// We can infer the structure of the translations from one of the files.
export type TranslationKeys = typeof ar;

const translations = {
  ar,
  nl,
};

export const useTranslations = (language: 'ar' | 'nl') => {
  const t = useMemo(() => translations[language], [language]);
  return t;
};
