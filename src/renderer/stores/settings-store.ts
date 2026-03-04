import { create } from 'zustand';
import type { Language, SettingsData } from '../../shared/types';

interface SettingsStore {
  language: Language;
  apiKey: string;
  loaded: boolean;
  setLanguage: (lang: Language) => void;
  setApiKey: (key: string) => void;
  load: () => Promise<void>;
  save: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  language: 'en',
  apiKey: '',
  loaded: false,

  setLanguage: (lang) => {
    set({ language: lang });
    get().save();
  },

  setApiKey: (key) => {
    set({ apiKey: key });
    get().save();
  },

  load: async () => {
    const data: SettingsData = await window.electronAPI.loadSettings();
    set({ language: data.language, apiKey: data.apiKey, loaded: true });
  },

  save: async () => {
    const { language, apiKey } = get();
    await window.electronAPI.saveSettings({ language, apiKey });
  },
}));
