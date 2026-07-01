import { initialReviewState, reviewCard, type ReviewGrade, type ReviewState } from './sm2';
export type ProgressMap = Record<number, ReviewState>;
const KEY = 'llb-progress-v1';
export function loadProgress(): ProgressMap { if (typeof localStorage === 'undefined') return {}; try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } }
export function saveProgress(p: ProgressMap) { localStorage.setItem(KEY, JSON.stringify(p)); }
export function gradeWord(rank: number, grade: ReviewGrade) { const p = loadProgress(); p[rank] = reviewCard(p[rank] ?? initialReviewState(), grade); saveProgress(p); return p[rank]; }
