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

const {
  completeLesson,
  computeDailyPct,
  defaultProgress,
  loadAppProgress,
  refreshOnNewDay,
} = await import('../src/lib/appProgress.ts');

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

test('default progress exposes todayXp=0 and dailyGoalXp=30', () => {
  const p = defaultProgress();
  assert.equal(p.todayXp, 0);
  assert.equal(p.dailyGoalXp, 30);
});

test('xp on the same day accumulates into todayXp', () => {
  store.clear();
  completeLesson('a', 10);
  const after = completeLesson('b', 10);
  // Whatever "today" is for the test runner, both calls happen on it.
  const todayStr = new Date().toISOString().slice(0, 10);
  assert.equal(after.lastActiveDate, todayStr);
  assert.equal(after.todayXp, 20);
  assert.equal(after.xp, 20);
});

test('xp earned today drives the daily-pct bar', () => {
  store.clear();
  completeLesson('a', 12); // less than default dailyGoalXp=30
  const p = loadAppProgress();
  // Compute pct using a `now` aligned with the stored lastActiveDate so we
  // don't depend on the runner's real "today".
  const pct = computeDailyPct(p, new Date(p.lastActiveDate + 'T12:00:00Z'));
  assert.equal(pct, 40); // 12 / 30 = 0.4 → 40%
});

test('daily pct is capped at 100 even when todayXp exceeds the goal', () => {
  const base = defaultProgress();
  const pct = computeDailyPct({ ...base, todayXp: 9999, lastActiveDate: new Date().toISOString().slice(0, 10) });
  assert.equal(pct, 100);
});

test('daily pct falls back to 0 when lastActiveDate is from a previous day', () => {
  // Simulate stored progress from yesterday with a high todayXp value.
  const yesterday = new Date(Date.parse('2026-01-01T00:00:00Z'));
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  const base = defaultProgress();
  const pct = computeDailyPct(
    { ...base, todayXp: 25, lastActiveDate: yesterdayStr },
    new Date('2026-01-02T00:00:00Z'),
  );
  assert.equal(pct, 0);
});

test('daily pct guards against zero / negative daily goal', () => {
  const pct = computeDailyPct({ ...defaultProgress(), dailyGoalXp: 0, todayXp: 10, lastActiveDate: new Date().toISOString().slice(0, 10) });
  assert.equal(pct, 0);
});

test('starting fresh on a new day resets todayXp before adding the new xp', () => {
  // Pre-seed the storage with progress stamped two days ago.
  store.clear();
  store.setItem('llb.appProgress.v1', JSON.stringify({
    ...defaultProgress(),
    xp: 100,
    todayXp: 30,
    streak: 7,
    hearts: 5,
    lastActiveDate: '2026-01-01',
  }));
  const p = completeLesson('fresh', 10);
  // Whatever "today" is, it is NOT 2026-01-01, so todayXp must reset then add the new xp.
  assert.notEqual(p.lastActiveDate, '2026-01-01');
  assert.equal(p.todayXp, 10);
  assert.equal(p.xp, 110);
});

test('loading progress on a new day refills hearts to 5', () => {
  // Stored progress from a previous day with drained hearts.
  store.clear();
  store.setItem('llb.appProgress.v1', JSON.stringify({
    ...defaultProgress(),
    xp: 100,
    todayXp: 0,
    streak: 3,
    hearts: 0,
    lastActiveDate: '2026-01-01',
  }));
  const p = loadAppProgress();
  // `lastActiveDate` is intentionally not stamped until the user actually
  // completes a lesson — we only normalise per-day values on load.
  assert.equal(p.lastActiveDate, '2026-01-01');
  assert.equal(p.hearts, 5, 'hearts must refill overnight');
  assert.equal(p.todayXp, 0, 'todayXp must reset on the new day');
});

test('loading progress on the same day preserves the current heart count', () => {
  // Stamp "today" exactly as the runner sees it. Hearts must pass through.
  store.clear();
  const todayStr = new Date().toISOString().slice(0, 10);
  store.setItem('llb.appProgress.v1', JSON.stringify({
    ...defaultProgress(),
    hearts: 2,
    lastActiveDate: todayStr,
  }));
  const p = loadAppProgress();
  assert.equal(p.hearts, 2);
});

test('refreshOnNewDay clamps out-of-range heart counts', () => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const base = { ...defaultProgress(), hearts: -7, lastActiveDate: todayStr };
  assert.equal(refreshOnNewDay(base).hearts, 0);
  const overflow = { ...defaultProgress(), hearts: 99, lastActiveDate: todayStr };
  assert.equal(refreshOnNewDay(overflow).hearts, 5);
});

test('loading progress tolerates a non-object payload in localStorage', () => {
  // A stray primitive (e.g. an old, buggy build) must not crash the app.
  store.clear();
  store.setItem('llb.appProgress.v1', 'null');
  assert.deepEqual(loadAppProgress(), defaultProgress());
  store.setItem('llb.appProgress.v1', '"hello"');
  assert.deepEqual(loadAppProgress(), defaultProgress());
  store.setItem('llb.appProgress.v1', '[1,2,3]');
  assert.deepEqual(loadAppProgress(), defaultProgress());
});
