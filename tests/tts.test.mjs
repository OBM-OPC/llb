// @ts-nocheck — exercises the pure selector from tts.ts.
import test from 'node:test';
import assert from 'node:assert/strict';

const { pickBulgarianVoice } = await import('../src/lib/tts.ts');

const V = (lang, { name = 'Voice', default_ = false } = {}) => ({
  lang,
  name,
  default: default_,
  voiceURI: `uri:${lang}:${name}`,
  localService: true,
});

test('prefers exact bg-BG voice', () => {
  const bg = V('bg-BG');
  const prefix = V('bg');
  const chosen = pickBulgarianVoice([prefix, V('en-US'), bg, V('fr-FR')]);
  assert.equal(chosen, bg);
});

test('falls back to bg-prefixed voice', () => {
  const prefix = V('bg');
  const chosen = pickBulgarianVoice([V('en-US'), prefix, V('fr-FR')]);
  assert.equal(chosen, prefix);
});

test('returns null when no Bulgarian voice is installed', () => {
  assert.equal(pickBulgarianVoice([V('en-US'), V('fr-FR')]), null);
  assert.equal(pickBulgarianVoice([]), null);
});

test('case-insensitive locale match', () => {
  const bg = V('BG-bg');
  const chosen = pickBulgarianVoice([V('en-US'), bg]);
  assert.equal(chosen, bg);
});

test('does not treat other locales starting with b as Bulgarian', () => {
  // Polish (pl-PL) should never be picked up by an "startsWith('bg')" check.
  const pl = V('pl-PL');
  const chosen = pickBulgarianVoice([pl, V('en-US')]);
  assert.equal(chosen, null);
});
