// @ts-nocheck — exercises the pure matcher from lessonAnswer.ts.
import test from 'node:test';
import assert from 'node:assert/strict';

const { matchesTypedAnswer, normalizeAnswer } = await import('../src/lib/lessonAnswer.ts');

const word = { bulgarian: 'да', english: 'yes; to' };

test('exact Bulgarian answer is accepted', () => {
  assert.equal(matchesTypedAnswer('да', word), true);
});

test('casing and trailing punctuation are normalized', () => {
  assert.equal(matchesTypedAnswer('Да.', word), true);
  assert.equal(matchesTypedAnswer('  ДА!  ', word), true);
});

test('English prompt text does NOT pass for a type/listen exercise', () => {
  // Regression: the previous implementation also accepted the English
  // sentence shown in the `type` exercise, so the learner could "succeed"
  // by re-typing the visible prompt instead of recalling the Bulgarian.
  assert.equal(matchesTypedAnswer('yes', word), false);
  assert.equal(matchesTypedAnswer('yes; to', word), false);
  assert.equal(matchesTypedAnswer('Yes.', word), false);
});

test('empty / whitespace input is rejected', () => {
  assert.equal(matchesTypedAnswer('', word), false);
  assert.equal(matchesTypedAnswer('   ', word), false);
});

test('near-miss Bulgarian strings are rejected', () => {
  assert.equal(matchesTypedAnswer('не', word), false); // rank-2 "no"
  assert.equal(matchesTypedAnswer('дай', word), false); // extra letter
});

test('normalizeAnswer trims only defined punctuation', () => {
  assert.equal(normalizeAnswer('  Здравей!  '), 'здравей');
  assert.equal(normalizeAnswer('Здравей.'), 'здравей');
  // Quotation-style chars are not stripped (intentional; learners must type
  // them or omit them).
  assert.equal(normalizeAnswer('"здравей"'), '"здравей"');
});
