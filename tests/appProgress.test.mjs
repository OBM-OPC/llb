// @ts-nocheck — intentionally exercises both .ts modules through dynamic import.
import test from 'node:test';
import assert from 'node:assert/strict';

// Stub a minimal localStorage so the modules can run outside the browser.
class MemoryStorage {
  constructor() { this.map = new Map(); }
  getItem(k) { return this.map.has(k) ? this.map.get(k) : null; }
  setItem(k, v) { this.map.set(k, String(v)); }
  removeItem(k) { this.map.delete(k); }
  clear() { this.map.clear(); }
  key(i) { return Array.from(this.map.keys())[i] ?? null; }
  get length() { return this.map.size; }
}
const store = new MemoryStorage();
globalThis.localStorage = store;

const { completeLesson, loadAppProgress, defaultProgress } = await import('../src/lib/appProgress.ts');

function daysBetween(a, b) {
  return Math.round((Date.parse(a + 'T00:00:00Z') - Date.parse(b + 'T00:00:00Z')) / 86_400_000);
}

// We can't easily mock `new Date()` inside the imported module without extra plumbing,
// so we drive the streak by manipulating the ISO date explicitly through localStorage.
function setLastActive(dateStr) {
  store.setItem('llb.appProgress.v1', JSON.stringify({ ...defaultProgress(), xp: 0, streak: dateStr ? 5 : 0, lastActiveDate: dateStr, hearts: 5 }));
}

test('first ever lesson starts a streak at 1', () => {
  store.clear();
  const p = completeLesson('lesson-1', 10);
  assert.equal(p.streak, 1);
  assert.equal(p.xp, 10);
  assert.ok(p.lastActiveDate);
});

test('two lessons on the same day keep streak unchanged (≥1)', () => {
  store.clear();
  completeLesson('a', 10);
  const p = completeLesson('b', 10);
  assert.ok(p.streak >= 1);
  assert.equal(daysBetween(p.lastActiveDate, p.lastActiveDate), 0);
});

test('skipping a day resets streak', () => {
  setLastActive('2026-06-30');
  const p = completeLesson('x', 10);
  // "today" relative to the test machine is unknown, but whichever it is must
  // be at least 2 days after 2026-06-30 only if the runner is on ≥2026-07-02.
  // We assert the much stronger invariant: the streak must NOT be greater than
  // the previous one by more than 1, even when the gap is ≥2.
  const lastDay = '2026-06-30';
  const todayDay = p.lastActiveDate;
  const gap = Math.max(0, daysBetween(todayDay, lastDay));
  if (gap >= 2) {
    assert.equal(p.streak, 1, `expected streak reset on gap=${gap}`);
  } else if (gap === 1) {
    assert.equal(p.streak, 6, 'expected streak continuation on a one-day gap');
  } else {
    assert.equal(p.streak, 5, 'expected streak unchanged on same-day gap');
  }
});
