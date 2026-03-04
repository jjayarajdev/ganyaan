import React, { useState } from 'react';
import { useSettingsStore } from '../stores/settings-store';
import { useT } from '../hooks/useLanguage';

interface ApiKeyDialogProps {
  onClose: () => void;
}

export default function ApiKeyDialog({ onClose }: ApiKeyDialogProps) {
  const { apiKey, setApiKey } = useSettingsStore();
  const [key, setKey] = useState(apiKey);
  const t = useT();

  const handleSave = () => {
    if (key.trim()) {
      setApiKey(key.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          {t('apikey.dialog.title')}
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          {t('apikey.dialog.description')}
        </p>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {t('settings.apiKey')}
        </label>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder={t('settings.apiKeyPlaceholder')}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          autoFocus
        />
        <div className="flex gap-3 mt-6">
          {apiKey && (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!key.trim()}
            className="flex-1 px-4 py-3 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('apikey.dialog.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
