import { create } from 'zustand';
import type { InsightId, ChapterProgress, ProgressData } from '../../shared/types';
import { CHAPTERS } from '../../shared/constants';

interface ProgressStore {
  chapters: Record<string, ChapterProgress>;
  loaded: boolean;
  load: () => Promise<void>;
  unlockInsight: (chapterId: string, insightId: InsightId) => Promise<boolean>;
  getChapterProgress: (chapterId: string) => ChapterProgress;
  isChapterMastered: (chapterId: string) => boolean;
}

function defaultChapterProgress(chapterId: string): ChapterProgress {
  return {
    chapterId,
    unlockedInsights: [],
    mastered: false,
    lastActivity: Date.now(),
  };
}

export const useProgressStore = create<ProgressStore>((set, get) => ({
  chapters: {},
  loaded: false,

  load: async () => {
    const data: ProgressData = await window.electronAPI.loadProgress();
    set({ chapters: data.chapters, loaded: true });
  },

  unlockInsight: async (chapterId, insightId) => {
    const { chapters } = get();
    const current = chapters[chapterId] || defaultChapterProgress(chapterId);

    if (current.unlockedInsights.includes(insightId)) return false;

    const updated: ChapterProgress = {
      ...current,
      unlockedInsights: [...current.unlockedInsights, insightId],
      lastActivity: Date.now(),
    };

    // Check mastery
    const chapter = CHAPTERS.find(c => c.id === chapterId);
    if (chapter && updated.unlockedInsights.length >= chapter.insights.length) {
      updated.mastered = true;
    }

    const newChapters = { ...chapters, [chapterId]: updated };
    set({ chapters: newChapters });
    await window.electronAPI.saveProgress({ chapters: newChapters });
    return true;
  },

  getChapterProgress: (chapterId) => {
    const { chapters } = get();
    return chapters[chapterId] || defaultChapterProgress(chapterId);
  },

  isChapterMastered: (chapterId) => {
    const { chapters } = get();
    return chapters[chapterId]?.mastered ?? false;
  },
}));
