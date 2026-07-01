import test from 'node:test'; import assert from 'node:assert/strict';
const { initialReviewState, reviewCard, isDue } = await import('../src/lib/sm2.ts');
test('initial state is due now',()=>{const now=new Date('2026-01-01T00:00:00Z'); assert.equal(isDue(initialReviewState(now),now),true)});
test('good first review schedules one day',()=>{const now=new Date('2026-01-01T00:00:00Z'); const s=reviewCard(initialReviewState(now),4,now); assert.equal(s.repetitions,1); assert.equal(s.intervalDays,1); assert.equal(s.lapses,0)});
test('failed review resets repetitions and records lapse',()=>{const now=new Date('2026-01-01T00:00:00Z'); const s=reviewCard({...initialReviewState(now),repetitions:3,intervalDays:10},1,now); assert.equal(s.repetitions,0); assert.equal(s.lapses,1)});
