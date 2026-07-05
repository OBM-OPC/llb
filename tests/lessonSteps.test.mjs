// @ts-nocheck — exercises the pure step helpers.
import test from 'node:test';
import assert from 'node:assert/strict';

const {
  buildChoiceOptions,
  gradedStepCount,
  isGradedStep,
  pickDistractors,
  shuffle,
} = await import('../src/lib/lessonSteps.ts');

const word = (rank, bulgarian) => ({ rank, bulgarian, english: '', spoken: '', source: '', category: 'x' });

test('isGradedStep excludes learn intros and includes all graded kinds', () => {
  const kinds = ['learn', 'choice', 'type', 'listen'];
  const graded = kinds.filter((k) => isGradedStep({ kind: k, word: word(1, 'да') }));
  assert.deepEqual(graded, ['choice', 'type', 'listen']);
});

test('gradedStepCount ignores learn intros', () => {
  const steps = [
    { kind: 'learn', word: word(1, 'да') },
    { kind: 'choice', word: word(1, 'да'), choices: [] },
    { kind: 'learn', word: word(2, 'не') },
    { kind: 'type', word: word(2, 'не') },
    { kind: 'listen', word: word(3, 'се') },
  ];
  assert.equal(gradedStepCount(steps), 3);
});

test('gradedStepCount is zero for an all-learn deck', () => {
  const steps = [
    { kind: 'learn', word: word(1, 'да') },
    { kind: 'learn', word: word(2, 'не') },
  ];
  assert.equal(gradedStepCount(steps), 0);
});

test('pickDistractors never returns the answer, even with whitespace', () => {
  const pool = [
    word(1, 'не'),
    word(2, 'да'), // answer
    word(3, '  да  '), // same answer with padding — must be skipped
    word(4, 'един'),
  ];
  const out = pickDistractors('да', pool, 5);
  assert.ok(!out.includes('да'));
  assert.ok(!out.includes('  да  '));
  assert.deepEqual(out.sort(), ['един', 'не']);
});

test('pickDistractors deduplicates repeated Bulgarian strings', () => {
  const pool = [
    word(1, 'не'),
    word(2, 'не'), // duplicate Bulgarian string — must not produce duplicate
    word(3, 'един'),
  ];
  const out = pickDistractors('да', pool, 5);
  // Iteration order follows the pool: rank-1 'не' then rank-3 'един'.
  assert.deepEqual(out, ['не', 'един']);
});

test('pickDistractors returns at most `count` unique items', () => {
  const pool = [word(1, 'а'), word(2, 'б'), word(3, 'в'), word(4, 'г')];
  assert.equal(pickDistractors('да', pool, 2).length, 2);
  pool.push(word(5, 'д'), word(6, 'е'));
  assert.equal(pickDistractors('да', pool, 2).length, 2);
});

test('buildChoiceOptions contains the answer exactly once and distractors are unique', () => {
  const pool = [word(2, 'не'), word(3, 'себя'), word(4, 'един'), word(5, 'аз')];
  const opts = buildChoiceOptions('да', pool, 3);
  // Answer appears exactly once.
  const answerCount = opts.filter((o) => o === 'да').length;
  assert.equal(answerCount, 1);
  // No duplicate distractors.
  assert.equal(new Set(opts).size, opts.length);
  // We get the answer + 3 distractors.
  assert.equal(opts.length, 4);
});

test('buildChoiceOptions still works when there are fewer distractors than requested', () => {
  const pool = [word(2, 'не')];
  const opts = buildChoiceOptions('да', pool, 3);
  assert.deepEqual(opts.sort(), ['да', 'не']);
});

test('shuffle is deterministic for a seeded rand and is a permutation', () => {
  const items = [1, 2, 3, 4, 5];
  const seeded = () => 0.3; // any constant → deterministic path
  const out = shuffle(items, seeded);
  assert.equal(out.length, items.length);
  assert.deepEqual([...out].sort(), [...items].sort());
});

test('shuffle preserves all items (no drops, no duplicates)', () => {
  const items = [1, 2, 3, 4, 5, 6];
  // 100 random seeds so we don't rely on a single path.
  for (let seed = 0; seed < 100; seed++) {
    let s = seed;
    const rand = () => {
      // Linear-congruential for stable, varied but reproducible randoms.
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
    const out = shuffle(items, rand);
    assert.equal(out.length, items.length, `seed ${seed}`);
    assert.deepEqual([...out].sort(), [...items].sort(), `seed ${seed}`);
  }
});
