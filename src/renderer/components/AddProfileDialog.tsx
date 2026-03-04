import React, { useState } from 'react';
import type { UserRole, User } from '../../shared/types';
import { useT } from '../hooks/useLanguage';

interface AddProfileDialogProps {
  existingStudents: User[];
  onAdd: (data: { name: string; role: UserRole; pin?: string; email?: string; schoolName?: string; linkStudentId?: number }) => void;
  onCancel?: () => void;
}

export default function AddProfileDialog({ existingStudents, onAdd, onCancel }: AddProfileDialogProps) {
  const t = useT();
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [pin, setPin] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [linkStudentId, setLinkStudentId] = useState<number>(0);
  const [error, setError] = useState('');

  const needsPin = role === 'teacher' || role === 'parent';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t('profile.nameRequired'));
      return;
    }
    if (needsPin && pin.length < 4) {
      setError(t('profile.pinRequired'));
      return;
    }
    onAdd({
      name: name.trim(),
      role,
      pin: needsPin ? pin : undefined,
      schoolName: schoolName.trim() || undefined,
      linkStudentId: role === 'parent' && linkStudentId > 0 ? linkStudentId : undefined,
    });
  };

  const roles: { value: UserRole; label: string }[] = [
    { value: 'student', label: t('profile.student') },
    { value: 'teacher', label: t('profile.teacher') },
    { value: 'parent', label: t('profile.parent') },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
        <h3 className="text-lg font-bold text-slate-800 mb-4">{t('profile.addNew')}</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role selector */}
          <div>
            <label className="text-sm font-medium text-slate-600 mb-1 block">{t('profile.role')}</label>
            <div className="flex gap-2">
              {roles.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => { setRole(r.value); setError(''); }}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
                    role === r.value
                      ? 'bg-primary-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-sm font-medium text-slate-600 mb-1 block">{t('profile.name')}</label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder={t('profile.name')}
              autoFocus
            />
          </div>

          {/* PIN for teacher/parent */}
          {needsPin && (
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1 block">{t('profile.pin')}</label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pin}
                onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setError(''); }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center tracking-widest"
                placeholder="4-6 digits"
              />
            </div>
          )}

          {/* School name for teacher */}
          {role === 'teacher' && (
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1 block">{t('profile.schoolName')}</label>
              <input
                type="text"
                value={schoolName}
                onChange={e => setSchoolName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder={t('profile.schoolName')}
              />
            </div>
          )}

          {/* Link to student for parent */}
          {role === 'parent' && existingStudents.length > 0 && (
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1 block">{t('profile.linkStudent')}</label>
              <select
                value={linkStudentId}
                onChange={e => setLinkStudentId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value={0}>--</option>
                {existingStudents.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                {t('chat.clearCancel')}
              </button>
            )}
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
            >
              {t('profile.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
