import { useCallback } from 'react';
import { useSettingsStore } from '../stores/settings-store';
import en from '../i18n/en.json';
import hi from '../i18n/hi.json';

const dictionaries: Record<string, Record<string, string>> = { en, hi };

export function useT() {
  const language = useSettingsStore(s => s.language);

  const t = useCallback(
    (key: string): string => {
      const dict = dictionaries[language] || dictionaries.en;
      return dict[key] || dictionaries.en[key] || key;
    },
    [language],
  );

  return t;
}
