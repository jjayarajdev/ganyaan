import React, { useState } from 'react';
import type { User } from '../../shared/types';
import { useT } from '../hooks/useLanguage';
import PinEntryDialog from './PinEntryDialog';

interface ProfilePickerProps {
  users: User[];
  onSelect: (userId: number, pin?: string) => Promise<{ success: boolean; error?: string }>;
  onAddNew: () => void;
}

export default function ProfilePicker({ users, onSelect, onAddNew }: ProfilePickerProps) {
  const t = useT();
  const [pinUser, setPinUser] = useState<User | null>(null);
  const [pinError, setPinError] = useState('');

  const handleUserClick = async (user: User) => {
    if (user.role === 'student') {
      await onSelect(user.id);
    } else {
      setPinUser(user);
      setPinError('');
    }
  };

  const handlePinSubmit = async (pin: string) => {
    if (!pinUser) return;
    const result = await onSelect(pinUser.id, pin);
    if (!result.success) {
      setPinError(t('profile.wrongPin'));
    } else {
      setPinUser(null);
    }
  };

  const roleLabel = (role: string) => {
    switch (role) {
      case 'student': return t('profile.student');
      case 'teacher': return t('profile.teacher');
      case 'parent': return t('profile.parent');
      default: return role;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full py-12 px-4">
      <h2 className="text-2xl font-bold text-slate-800 mb-2">{t('profile.title')}</h2>
      <p className="text-sm text-slate-400 mb-8">{t('app.subtitle')}</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 max-w-md mb-8">
        {users.map(user => (
          <button
            key={user.id}
            onClick={() => handleUserClick(user)}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl hover:bg-slate-100 transition-colors group"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md group-hover:scale-105 transition-transform"
              style={{ backgroundColor: user.avatarColor || '#3b82f6' }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-slate-700 truncate max-w-[100px]">{user.name}</span>
            <span className="text-xs text-slate-400">{roleLabel(user.role)}</span>
          </button>
        ))}

        {/* Add new profile */}
        <button
          onClick={onAddNew}
          className="flex flex-col items-center gap-2 p-4 rounded-2xl hover:bg-slate-100 transition-colors group"
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-slate-200 text-slate-400 text-3xl group-hover:bg-slate-300 transition-colors">
            +
          </div>
          <span className="text-sm font-medium text-slate-500">{t('profile.addNew')}</span>
        </button>
      </div>

      {/* PIN Entry Dialog */}
      {pinUser && (
        <PinEntryDialog
          userName={pinUser.name}
          error={pinError}
          onSubmit={handlePinSubmit}
          onCancel={() => setPinUser(null)}
        />
      )}
    </div>
  );
}
