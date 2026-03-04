import React, { useState, useEffect } from 'react';
import { useSettingsStore } from './stores/settings-store';
import { useProgressStore } from './stores/progress-store';
import { useAuthStore } from './stores/auth-store';
import ChapterLauncher from './components/ChapterLauncher';
import ChatInterface from './components/ChatInterface';
import ApiKeyDialog from './components/ApiKeyDialog';
import LanguageToggle from './components/LanguageToggle';
import ProfilePicker from './components/ProfilePicker';
import AddProfileDialog from './components/AddProfileDialog';
import ParentReportCard from './components/ParentReportCard';
import TeacherDashboard from './components/TeacherDashboard';
import PracticeMode from './components/PracticeMode';
import { useT } from './hooks/useLanguage';
import type { User, InsightId } from '../shared/types';

type Screen =
  | { type: 'profiles' }
  | { type: 'launcher' }
  | { type: 'chat'; chapterId: string }
  | { type: 'report' }
  | { type: 'teacher-dashboard' }
  | { type: 'practice'; chapterId: string; insightId: string }
  | { type: 'review'; chapterId: string; insightIds: string[] };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ type: 'profiles' });
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [linkedStudents, setLinkedStudents] = useState<User[]>([]);
  const { loaded: settingsLoaded, load: loadSettings, apiKey } = useSettingsStore();
  const progressLoad = useProgressStore(s => s.load);
  const { currentUser, users, loaded: usersLoaded, loadUsers, login, createUser, logout } = useAuthStore();
  const t = useT();

  // Load users on mount
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // When users are loaded, auto-navigate
  useEffect(() => {
    if (!usersLoaded) return;
    if (users.length === 0) {
      setShowAddProfile(true);
    }
  }, [usersLoaded, users.length]);

  // After login, load settings + progress and route by role
  useEffect(() => {
    if (!currentUser) return;
    loadSettings();
    progressLoad();

    if (currentUser.role === 'teacher') {
      setScreen({ type: 'teacher-dashboard' });
    } else if (currentUser.role === 'parent') {
      // Load linked students for parent
      window.electronAPI.getLinkedStudents(currentUser.id).then(students => {
        setLinkedStudents(students);
        setScreen({ type: 'report' });
      });
    } else {
      setScreen({ type: 'launcher' });
    }
  }, [currentUser, loadSettings, progressLoad]);

  // Show API key dialog if missing after settings load
  useEffect(() => {
    if (settingsLoaded && !apiKey && currentUser?.role === 'student') {
      setShowApiKeyDialog(true);
    }
  }, [settingsLoaded, apiKey, currentUser]);

  const handleLogin = async (userId: number, pin?: string) => {
    return login(userId, pin);
  };

  const handleCreateUser = async (data: {
    name: string;
    role: 'student' | 'teacher' | 'parent';
    pin?: string;
    email?: string;
    schoolName?: string;
    linkStudentId?: number;
  }) => {
    const user = await createUser({
      name: data.name,
      role: data.role,
      pin: data.pin,
      email: data.email,
      schoolName: data.schoolName,
    });
    if (data.role === 'parent' && data.linkStudentId) {
      await window.electronAPI.linkStudent(data.linkStudentId, user.id);
    }
    setShowAddProfile(false);
    await login(user.id, data.pin);
  };

  const handleSwitchProfile = () => {
    logout();
    setScreen({ type: 'profiles' });
    loadUsers();
  };

  // Loading state
  if (!usersLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-notebook">
        <div className="text-stone-400 text-lg font-display">{t('app.title')}...</div>
      </div>
    );
  }

  // Profile selection screen
  if (!currentUser || screen.type === 'profiles') {
    return (
      <div className="h-screen flex flex-col bg-notebook">
        <header className="flex items-center justify-between px-5 py-2.5 bg-white/90 backdrop-blur-sm border-b-2 border-amber-200/60 shrink-0">
          <h1 className="text-lg font-extrabold text-amber-800 font-display">{t('app.title')}</h1>
          <LanguageToggle />
        </header>
        <main className="flex-1 overflow-y-auto">
          <ProfilePicker
            users={users}
            onSelect={handleLogin}
            onAddNew={() => setShowAddProfile(true)}
          />
        </main>
        {showAddProfile && (
          <AddProfileDialog
            existingStudents={users.filter(u => u.role === 'student')}
            onAdd={handleCreateUser}
            onCancel={users.length > 0 ? () => setShowAddProfile(false) : undefined}
          />
        )}
      </div>
    );
  }

  // Waiting for settings/progress to load after login
  if (!settingsLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-notebook">
        <div className="text-stone-400 text-lg font-display">{t('app.title')}...</div>
      </div>
    );
  }

  // Determine main content based on screen type
  const renderContent = () => {
    switch (screen.type) {
      case 'chat':
        return <ChatInterface chapterId={screen.chapterId} />;
      case 'review':
        return <ChatInterface chapterId={screen.chapterId} />;
      case 'report':
        return <ParentReportCard linkedStudents={linkedStudents} />;
      case 'teacher-dashboard':
        return <TeacherDashboard />;
      case 'practice':
        return (
          <PracticeMode
            chapterId={screen.chapterId}
            insightId={screen.insightId}
            onBack={() => setScreen({ type: 'launcher' })}
          />
        );
      case 'launcher':
      default:
        return (
          <ChapterLauncher
            onStartChapter={(chapterId) => setScreen({ type: 'chat', chapterId })}
            onStartPractice={(chapterId, insightId) => setScreen({ type: 'practice', chapterId, insightId })}
            onStartReview={(chapterId, insightIds) => setScreen({ type: 'review', chapterId, insightIds })}
          />
        );
    }
  };

  // Back button logic
  const handleBack = () => {
    if (screen.type === 'chat' || screen.type === 'review' || screen.type === 'practice') {
      setScreen({ type: 'launcher' });
    }
  };

  const showBackButton = screen.type === 'chat' || screen.type === 'review' || screen.type === 'practice';

  return (
    <div className="h-screen flex flex-col bg-notebook">
      {/* Header — notebook spine */}
      <header className="flex items-center justify-between px-5 py-2.5 bg-white/90 backdrop-blur-sm border-b-2 border-amber-200/60 shrink-0">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <button
              onClick={handleBack}
              className="text-sm text-amber-700 hover:text-amber-900 font-semibold font-display transition-colors flex items-center gap-1"
            >
              <span className="text-base">{'\u2190'}</span> {t('chat.back')}
            </button>
          )}
          <h1 className="text-lg font-extrabold text-amber-800 font-display tracking-tight">{t('app.title')}</h1>
          {!showBackButton && <span className="text-xs text-stone-400 font-body">{t('app.subtitle')}</span>}
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSwitchProfile}
            className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 transition-colors px-2 py-1 rounded-lg hover:bg-amber-50"
            title={t('profile.switch')}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
              style={{ backgroundColor: currentUser.avatarColor || '#b45309' }}
            >
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:inline font-display font-semibold">{currentUser.name}</span>
          </button>
          <LanguageToggle />
          <button
            onClick={() => setShowApiKeyDialog(true)}
            className="text-xs text-stone-400 hover:text-stone-600 transition-colors p-1"
            title={t('settings.title')}
          >
            {'\u2699\uFE0F'}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {renderContent()}
      </main>

      {/* API Key Dialog */}
      {showApiKeyDialog && (
        <ApiKeyDialog onClose={() => setShowApiKeyDialog(false)} />
      )}

      {/* Add Profile Dialog */}
      {showAddProfile && (
        <AddProfileDialog
          existingStudents={users.filter(u => u.role === 'student')}
          onAdd={handleCreateUser}
          onCancel={() => setShowAddProfile(false)}
        />
      )}
    </div>
  );
}
