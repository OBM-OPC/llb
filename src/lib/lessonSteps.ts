/**
 * Pure helpers for building lesson steps in `LearningApp`.
 *
 * Lives in its own file (no `@/` imports) so the Node test runner can
 * resolve it without the Next path-alias plumbing.
 */

import type { Word } from '@/data/words';

export type ExerciseKind = 'learn' | 'choice' | 'type' | 'listen';
export type Step = { kind: ExerciseKind; word: Word; choices?: string[] };

/**
 * Whether a step requires the learner to actively recall the answer.
 * "learn" steps are intros where the learner is shown a card and taps "Got it";
 * they are not graded and must not count toward the lesson score.
 *
 * Used by the summary screen to compute the score denominator — historically
 * `steps.length` was used, which silently inflated the denominator with
 * "learn" intros and made correct-recall ratios look worse than they were.
 */
export function isGradedStep(step: Step): boolean {
  return step.kind !== 'learn';
}

export function gradedStepCount(steps: Step[]): number {
  return steps.filter(isGradedStep).length;
}

/**
 * Deterministic Fisher–Yates shuffle. The caller decides whether the
 * result is consumed (e.g. tests use the seed to assert against an
 * exact ordering) or fed through `Math.random` via a closure.
 */
export function shuffle<T>(items: T[], rand: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = out[i] as T;
    out[i] = out[j] as T;
    out[j] = tmp;
  }
  return out;
}

/**
 * Return `count` distractors from `pool` that are not equal to `answer`.
 * Trims a leading/trailing whitespace around the answer to avoid trivial
 * duplicates from CSV pasted data.
 *
 * Returning fewer than `count` items in the worst case (e.g. tiny lessons)
 * is acceptable; the caller pads the choice list with whichever distractors
 * are available so the choice step never asks an un-answerable question.
 */
export function pickDistractors(
  answer: string,
  pool: Word[],
  count: number,
): string[] {
  const safeAnswer = (answer ?? '').trim();
  // Over-collect then dedupe, so if two distractor words share the same
  // Bulgarian string we still return unique strings.
  const candidates: string[] = [];
  for (const w of pool) {
    const candidate = (w.bulgarian ?? '').trim();
    if (!candidate) continue;
    if (candidate === safeAnswer) continue;
    if (candidates.includes(candidate)) continue;
    candidates.push(candidate);
    if (candidates.length >= count) break;
  }
  return candidates.slice(0, count);
}

/**
 * Build the multiple-choice options for a "choice" step:
 * the correct answer plus `count` unique distractors, shuffled.
 * Guarantee the correct answer appears exactly once.
 */
export function buildChoiceOptions(
  answer: string,
  pool: Word[],
  count: number,
  rand: () => number = Math.random,
): string[] {
  const distractors = pickDistractors(answer, pool, count);
  const safeAnswer = (answer ?? '').trim();
  const all = [safeAnswer, ...distractors].filter(Boolean);
  return shuffle(all, rand);
}
