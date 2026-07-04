/**
 * Pure helpers for the "type the Bulgarian word" / "Listen and write"
 * exercises. Lives in its own file (no @/ imports) so the Node test runner
 * can resolve it without the Next path-alias plumbing.
 */

/**
 * Normalize a learner-typed answer for lenient comparison: trim, lowercase,
 * strip common trailing sentence punctuation beginners sometimes include.
 */
export function normalizeAnswer(s: string): string {
  return (s ?? '').trim().toLowerCase().replace(/[.;,!]/g, '');
}

/**
 * Whether an input string matches the Bulgarian word expected for a
 * `type` / `listen` exercise.
 *
 * In both exercise kinds the Bulgarian word is the only canonical answer:
 * the prompt hides it (English text or audio), and the learner has to
 * recall and produce the Bulgarian. Accepting the English prompt text as
 * a "correct" answer would let the learner succeed by re-typing the
 * visible prompt instead of actually practising the recall — that
 * silently bypasses the learning loop.
 *
 * Casing and trailing punctuation are normalized on both sides so
 * "Да", "да", and "да." all pass.
 */
export function matchesTypedAnswer(
  input: string,
  word: { bulgarian: string },
): boolean {
  const expected = normalizeAnswer(word.bulgarian);
  if (!expected) return false;
  return normalizeAnswer(input) === expected;
}
