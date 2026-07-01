export type ReviewState = { easeFactor:number; intervalDays:number; repetitions:number; dueAt:string; lapses:number; updatedAt:string };
export type ReviewGrade = 0|1|2|3|4|5;
const DAY = 86_400_000;
export function initialReviewState(now = new Date()): ReviewState { return { easeFactor:2.5, intervalDays:0, repetitions:0, lapses:0, dueAt:now.toISOString(), updatedAt:now.toISOString() }; }
export function reviewCard(state: ReviewState, grade: ReviewGrade, now = new Date()): ReviewState {
  const quality = Math.max(0, Math.min(5, grade));
  let repetitions = state.repetitions; let intervalDays = state.intervalDays; let lapses = state.lapses;
  let easeFactor = Math.max(1.3, state.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  if (quality < 3) { repetitions = 0; intervalDays = quality === 0 ? 0 : 1; lapses += 1; }
  else { repetitions += 1; if (repetitions === 1) intervalDays = 1; else if (repetitions === 2) intervalDays = 6; else intervalDays = Math.max(1, Math.round(state.intervalDays * easeFactor)); }
  const dueAt = new Date(now.getTime() + intervalDays * DAY).toISOString();
  return { easeFactor, intervalDays, repetitions, lapses, dueAt, updatedAt: now.toISOString() };
}
export function isDue(state: ReviewState, now = new Date()): boolean { return Date.parse(state.dueAt) <= now.getTime(); }
