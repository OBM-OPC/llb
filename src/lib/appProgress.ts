export type AppProgress = { completedLessons: string[]; xp: number; streak: number; hearts: number; lastActiveDate?: string; dailyGoalXp: number };
const KEY = 'llb.appProgress.v1';
const today = () => new Date().toISOString().slice(0, 10);
export function defaultProgress(): AppProgress { return { completedLessons: [], xp: 0, streak: 0, hearts: 5, dailyGoalXp: 30 }; }
export function loadAppProgress(): AppProgress { if (typeof localStorage === 'undefined') return defaultProgress(); try { return { ...defaultProgress(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return defaultProgress(); } }
export function saveAppProgress(progress: AppProgress) { localStorage.setItem(KEY, JSON.stringify(progress)); }
export function completeLesson(id: string, xp: number) { const p = loadAppProgress(); const now = today(); const wasToday = p.lastActiveDate === now; const completed = p.completedLessons.includes(id) ? p.completedLessons : [...p.completedLessons, id]; const next = { ...p, completedLessons: completed, xp: p.xp + xp, streak: wasToday ? p.streak || 1 : Math.max(1, p.streak + 1), hearts: Math.min(5, p.hearts + 1), lastActiveDate: now }; saveAppProgress(next); return next; }
export function loseHeart() { const p = loadAppProgress(); const next = { ...p, hearts: Math.max(0, p.hearts - 1) }; saveAppProgress(next); return next; }
