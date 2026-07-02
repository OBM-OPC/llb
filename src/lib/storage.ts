import { initialReviewState, reviewCard, type ReviewGrade, type ReviewState } from './sm2';
export type ProgressMap = Record<number, ReviewState>;
const KEY = 'llb-progress-v1';

function safeGet(key: string): string | null {
  try { return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null; } catch { return null; }
}
function safeSet(key: string, value: string): boolean {
  try { if (typeof localStorage === 'undefined') return false; localStorage.setItem(key, value); return true; } catch { return false; }
}

export function loadProgress(): ProgressMap {
  const raw = safeGet(KEY);
  if (!raw) return {};
  try { return JSON.parse(raw) as ProgressMap ?? {}; } catch { return {}; }
}
export function saveProgress(p: ProgressMap) { safeSet(KEY, JSON.stringify(p)); }
export function gradeWord(rank: number, grade: ReviewGrade) { const p = loadProgress(); p[rank] = reviewCard(p[rank] ?? initialReviewState(), grade); saveProgress(p); return p[rank]; }
