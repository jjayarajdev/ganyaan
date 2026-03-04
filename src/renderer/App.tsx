import React, { useState, useEffect } from 'react';
import { useSettingsStore } from './stores/settings-store';
import { useProgressStore } from './stores/progress-store';
import ChapterLauncher from './components/ChapterLauncher';
import ChatInterface from './components/ChatInterface';
import ApiKeyDialog from './components/ApiKeyDialog';
import LanguageToggle from './components/LanguageToggle';
import { useT } from './hooks/useLanguage';

type Screen = { type: 'launcher' } | { type: 'chat'; chapterId: string };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ type: 'launcher' });
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const { loaded, load, apiKey } = useSettingsStore();
  const progressLoad = useProgressStore(s => s.load);
  const progressLoaded = useProgressStore(s => s.loaded);
  const t = useT();

  useEffect(() => {
    load();
    progressLoad();
  }, [load, progressLoad]);

  useEffect(() => {
    if (loaded && !apiKey) {
      setShowApiKeyDialog(true);
    }
  }, [loaded, apiKey]);

  if (!loaded || !progressLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-slate-400 text-lg">{t('app.title')}...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-3">
          {screen.type === 'chat' && (
            <button
              onClick={() => setScreen({ type: 'launcher' })}
              className="text-sm text-primary-500 hover:text-primary-700 font-medium transition-colors"
            >
              {t('chat.back')}
            </button>
          )}
          <h1 className="text-xl font-bold text-primary-600">{t('app.title')}</h1>
          <span className="text-sm text-slate-400">{t('app.subtitle')}</span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <button
            onClick={() => setShowApiKeyDialog(true)}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            title={t('settings.title')}
          >
            {'\u2699'}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {screen.type === 'launcher' ? (
          <ChapterLauncher
            onStartChapter={(chapterId) => setScreen({ type: 'chat', chapterId })}
          />
        ) : (
          <ChatInterface chapterId={screen.chapterId} />
        )}
      </main>

      {/* API Key Dialog */}
      {showApiKeyDialog && (
        <ApiKeyDialog onClose={() => setShowApiKeyDialog(false)} />
      )}
    </div>
  );
}
