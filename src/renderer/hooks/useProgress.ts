import { useEffect } from 'react';
import { useProgressStore } from '../stores/progress-store';

export function useProgress() {
  const { loaded, load, ...rest } = useProgressStore();

  useEffect(() => {
    if (!loaded) {
      load();
    }
  }, [loaded, load]);

  return { loaded, ...rest };
}
