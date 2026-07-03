export type AppProgress = { completedLessons: string[]; xp: number; todayXp: number; streak: number; hearts: number; lastActiveDate?: string; dailyGoalXp: number };
const KEY = 'llb.appProgress.v1';
const today = () => new Date().toISOString().slice(0, 10);

function safeGet(key: string): string | null {
  try { return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null; } catch { return null; }
}
function safeSet(key: string, value: string): boolean {
  try { if (typeof localStorage === 'undefined') return false; localStorage.setItem(key, value); return true; } catch { return false; }
}

export function defaultProgress(): AppProgress { return { completedLessons: [], xp: 0, todayXp: 0, streak: 0, hearts: 5, dailyGoalXp: 30 }; }
export function loadAppProgress(): AppProgress {
  const raw = safeGet(KEY);
  if (!raw) return defaultProgress();
  try { return { ...defaultProgress(), ...JSON.parse(raw) }; } catch { return defaultProgress(); }
}
export function saveAppProgress(progress: AppProgress) { safeSet(KEY, JSON.stringify(progress)); }
function dayDiff(a: string, b: string): number {
  // Returns whole-day difference between two ISO date strings (YYYY-MM-DD) in UTC.
  const ms = Date.parse(a + 'T00:00:00Z') - Date.parse(b + 'T00:00:00Z');
  return Math.round(ms / 86_400_000);
}

export function completeLesson(id: string, xp: number) {
  const p = loadAppProgress();
  const now = today();
  let nextStreak = p.streak;
  if (p.lastActiveDate === now) {
    nextStreak = nextStreak || 1;
  } else if (!p.lastActiveDate) {
    nextStreak = Math.max(1, nextStreak + 1);
  } else {
    const diff = dayDiff(now, p.lastActiveDate);
    // Same calendar day is impossible here (handled above).
    // 1 day later → continue streak, ≥2 days later → broken, reset to 1.
    nextStreak = diff === 1 ? p.streak + 1 : 1;
  }
  const completed = p.completedLessons.includes(id) ? p.completedLessons : [...p.completedLessons, id];
  const isNewDay = p.lastActiveDate !== now;
  const next: AppProgress = {
    ...p,
    completedLessons: completed,
    xp: p.xp + xp,
    todayXp: (isNewDay ? 0 : p.todayXp) + xp,
    streak: nextStreak,
    hearts: Math.min(5, p.hearts + 1),
    lastActiveDate: now,
  };
  saveAppProgress(next);
  return next;
}
export function loseHeart() { const p = loadAppProgress(); const next = { ...p, hearts: Math.max(0, p.hearts - 1) }; saveAppProgress(next); return next; }

/**
 * Percent (0-100) of today's daily XP goal the user has earned.
 * On a freshly opened app from a new day, `todayXp` from yesterday's stored
 * progress is reset to 0 so the bar reflects today only.
 */
export function computeDailyPct(progress: AppProgress, now: Date = new Date()): number {
  const todayStr = now.toISOString().slice(0, 10);
  const effective = progress.lastActiveDate === todayStr ? progress.todayXp : 0;
  if (progress.dailyGoalXp <= 0) return 0;
  return Math.min(100, Math.round((effective / progress.dailyGoalXp) * 100));
}

