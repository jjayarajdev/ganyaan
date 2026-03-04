import React, { useState, useRef, useEffect } from 'react';
import { useT } from '../hooks/useLanguage';

interface PinEntryDialogProps {
  userName: string;
  error: string;
  onSubmit: (pin: string) => void;
  onCancel: () => void;
}

export default function PinEntryDialog({ userName, error, onSubmit, onCancel }: PinEntryDialogProps) {
  const t = useT();
  const [pin, setPin] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length >= 4) {
      onSubmit(pin);
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
        <h3 className="text-lg font-bold text-slate-800 mb-1">{t('profile.enterPin')}</h3>
        <p className="text-sm text-slate-500 mb-4">{userName}</p>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
            className="w-full text-center text-2xl tracking-[0.5em] px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="----"
          />

          {error && (
            <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
          )}

          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              {t('chat.clearCancel')}
            </button>
            <button
              type="submit"
              disabled={pin.length < 4}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t('profile.enterPin')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
