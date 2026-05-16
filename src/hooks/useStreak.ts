import { useEffect, useState } from 'react';

const STREAK_KEY = 'royal-plate-streak';
const STREAK_TTL = 1000 * 60 * 60 * 30;

interface StreakData {
  count: number;
  lastActive: string;
  longestStreak: number;
}

const defaultStreak: StreakData = { count: 0, lastActive: '', longestStreak: 0 };

export function useStreak() {
  const [streak, setStreak] = useState<StreakData>(defaultStreak);
  const [justUpdated, setJustUpdated] = useState(false);

  useEffect(() => {
    loadStreak();
  }, []);

  const loadStreak = () => {
    try {
      const raw = localStorage.getItem(STREAK_KEY);
      if (raw) {
        const data = JSON.parse(raw) as StreakData;
        setStreak(data);
        checkAndUpdate(data);
      } else {
        setStreak(defaultStreak);
      }
    } catch {
      setStreak(defaultStreak);
    }
  };

  const checkAndUpdate = (data: StreakData) => {
    if (!data.lastActive) return;
    const now = new Date();
    const last = new Date(data.lastActive);
    const diffMs = now.getTime() - last.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours >= 48) {
      const updated = { ...data, count: 0, lastActive: now.toISOString() };
      applyStreak(updated);
    }
  };

  const markActive = () => {
    const now = new Date();
    const data = getCurrentData();
    const last = data.lastActive ? new Date(data.lastActive) : null;
    const diffHours = last ? (now.getTime() - last.getTime()) / (1000 * 60 * 60) : Infinity;

    if (!last || diffHours >= 48) {
      const updated = { count: 1, lastActive: now.toISOString(), longestStreak: Math.max(data.longestStreak, 1) };
      applyStreak(updated);
      setJustUpdated(true);
    } else if (diffHours >= 24) {
      const newCount = data.count + 1;
      const updated = { count: newCount, lastActive: now.toISOString(), longestStreak: Math.max(data.longestStreak, newCount) };
      applyStreak(updated);
      setJustUpdated(true);
    } else {
      setJustUpdated(false);
    }

    setTimeout(() => setJustUpdated(false), 2000);
  };

  const getCurrentData = (): StreakData => {
    try {
      const raw = localStorage.getItem(STREAK_KEY);
      return raw ? JSON.parse(raw) : defaultStreak;
    } catch {
      return defaultStreak;
    }
  };

  const applyStreak = (data: StreakData) => {
    setStreak(data);
    try {
      localStorage.setItem(STREAK_KEY, JSON.stringify(data));
    } catch {}
  };

  const getStreakEmoji = (): string => {
    if (streak.count >= 30) return '🔥🔥';
    if (streak.count >= 14) return '🔥';
    if (streak.count >= 7) return '⭐';
    if (streak.count >= 3) return '✨';
    return '🔥';
  };

  const getStreakTier = (): string => {
    if (streak.count >= 30) return 'Diamond';
    if (streak.count >= 14) return 'Gold';
    if (streak.count >= 7) return 'Silver';
    if (streak.count >= 3) return 'Bronze';
    return 'New';
  };

  return { streak, markActive, justUpdated, getStreakEmoji, getStreakTier };
}
