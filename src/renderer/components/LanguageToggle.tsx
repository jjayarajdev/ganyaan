import React from 'react';
import { useSettingsStore } from '../stores/settings-store';
import type { Language } from '../../shared/types';

export default function LanguageToggle() {
  const { language, setLanguage } = useSettingsStore();

  const options: { value: Language; label: string }[] = [
    { value: 'en', label: 'EN' },
    { value: 'hi', label: 'HI' },
  ];

  return (
    <div className="flex bg-slate-100 rounded-full p-0.5">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => setLanguage(opt.value)}
          className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
            language === opt.value
              ? 'bg-primary-500 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
