'use client';
import { useMemo, useState } from 'react';
import { lessons, type Lesson } from '@/lib/lessons';
import { completeLesson, computeDailyPct, loadAppProgress, loseHeart, type AppProgress } from '@/lib/appProgress';
import { gradeWord } from '@/lib/storage';
import { speakBulgarian } from '@/lib/tts';
import type { Word } from '@/data/words';
import { matchesTypedAnswer } from '@/lib/lessons';

type Screen = 'home' | 'lesson' | 'summary';
type Step = { kind: 'learn' | 'choice' | 'type' | 'listen'; word: Word; choices?: string[] };

function shuffle<T>(items: T[]) { return [...items].sort(() => Math.random() - 0.5); }
function buildSteps(lesson: Lesson): Step[] {
  const pool = lesson.words;
  return pool.slice(0, 8).flatMap((word, i) => [
    { kind: 'learn' as const, word },
    { kind: 'choice' as const, word, choices: shuffle([word.bulgarian, ...shuffle(pool.filter((w) => w.rank !== word.rank)).slice(0, 3).map((w) => w.bulgarian)]) },
    i % 2 === 0 ? { kind: 'type' as const, word } : { kind: 'listen' as const, word },
  ]);
}

function normalize(s: string) { return (s ?? '').trim().toLowerCase().replace(/[.;,!]/g, ''); }
function Stat({ label, value }: { label: string; value: string | number }) { return <div className="rounded-2xl bg-white px-4 py-3 text-center shadow-sm"><div className="text-xl font-black text-rosewood">{value}</div><div className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</div></div>; }

export function LearningApp() {
  const [screen, setScreen] = useState<Screen>('home');
  const [progress, setProgress] = useState<AppProgress>(() => loadAppProgress());
  const [activeLesson, setActiveLesson] = useState<Lesson>(lessons[0]);
  const [stepIndex, setStepIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [correct, setCorrect] = useState(0);
  const steps = useMemo(() => buildSteps(activeLesson), [activeLesson]);
  const step = steps[stepIndex];
  const unlocked = (i: number) => i === 0 || progress.completedLessons.includes(lessons[i - 1]?.id);
  const dailyPct = computeDailyPct(progress);

  function startLesson(lesson: Lesson) { setActiveLesson(lesson); setStepIndex(0); setAnswer(''); setFeedback(null); setCorrect(0); setScreen('lesson'); }
  function finishLesson() { const p = completeLesson(activeLesson.id, activeLesson.xp); setProgress(p); setScreen('summary'); }
  function next() { setFeedback(null); setAnswer(''); if (stepIndex + 1 >= steps.length) finishLesson(); else setStepIndex((i) => i + 1); }
  function mark(ok: boolean) { setFeedback(ok ? 'correct' : 'wrong'); gradeWord(step.word.rank, ok ? 4 : 1); if (ok) setCorrect((c) => c + 1); else setProgress(loseHeart()); }
  function checkChoice(choice: string) { if (!feedback) mark(choice === step.word.bulgarian); }
  function checkTyped() { if (!feedback) mark(matchesTypedAnswer(answer, step.word)); }

  if (screen === 'summary') return <main className="min-h-screen bg-yogurt px-4 py-8"><section className="mx-auto max-w-xl rounded-[2rem] bg-white p-8 text-center shadow-xl"><div className="text-6xl">🏆</div><h1 className="mt-4 text-3xl font-black text-rosewood">Lesson complete!</h1><p className="mt-2 text-gray-600">You got {correct} of {steps.length} exercises right.</p><div className="mt-6 grid grid-cols-3 gap-3"><Stat label="XP" value={`+${activeLesson.xp}`} /><Stat label="Streak" value={`${progress.streak}🔥`} /><Stat label="Hearts" value={`${progress.hearts}❤️`} /></div><button onClick={()=>setScreen('home')} className="mt-8 w-full rounded-2xl bg-[#58cc02] px-5 py-4 font-black text-white shadow-[0_6px_0_#46a302]">Continue</button></section></main>;

  if (screen === 'lesson' && step) {
    const pct = Math.round(((stepIndex + 1) / steps.length) * 100);
    return <main className="min-h-screen bg-yogurt px-4 py-6"><section className="mx-auto max-w-2xl"><div className="mb-6 flex items-center gap-4"><button onClick={()=>setScreen('home')} className="text-2xl font-black text-gray-400">×</button><div className="h-4 flex-1 overflow-hidden rounded-full bg-orange-100"><div className="h-full rounded-full bg-[#58cc02] transition-all" style={{width:`${pct}%`}} /></div><span className="font-black text-red-500">{progress.hearts}❤️</span></div><div className="rounded-[2rem] bg-white p-6 shadow-xl md:p-10"><p className="text-sm font-black uppercase tracking-widest text-gray-400">{activeLesson.title}</p>{step.kind==='learn'&&<><h1 className="mt-4 text-3xl font-black">Learn this word</h1><button onClick={()=>speakBulgarian(step.word.bulgarian)} className="mt-8 w-full rounded-3xl bg-orange-50 p-8 text-center"><div className="text-5xl font-black text-rosewood">{step.word.bulgarian}</div><div className="mt-3 text-xl text-gray-700">{step.word.english}</div><div className="mt-2 text-gray-500">/{step.word.spoken}/ · tap to hear</div></button><button onClick={next} className="mt-8 w-full rounded-2xl bg-[#58cc02] px-5 py-4 font-black text-white shadow-[0_6px_0_#46a302]">Got it</button></>}{step.kind==='choice'&&<><h1 className="mt-4 text-3xl font-black">Choose the Bulgarian translation</h1><p className="mt-6 rounded-2xl bg-orange-50 p-5 text-2xl font-black">{step.word.english}</p><div className="mt-6 grid gap-3">{step.choices?.map((choice)=><button key={choice} onClick={()=>checkChoice(choice)} className="rounded-2xl border-2 border-gray-100 bg-white p-4 text-left text-xl font-black hover:border-[#1cb0f6]">{choice}</button>)}</div></>}{(step.kind==='type'||step.kind==='listen')&&<><h1 className="mt-4 text-3xl font-black">{step.kind==='listen'?'Listen and write Bulgarian':'Type the Bulgarian word'}</h1>{step.kind==='listen'?<button onClick={()=>speakBulgarian(step.word.bulgarian)} className="mt-8 w-full rounded-3xl bg-orange-50 p-8 text-5xl">🔊</button>:<p className="mt-6 rounded-2xl bg-orange-50 p-5 text-2xl font-black">{step.word.english}</p>}<input autoFocus value={answer} onChange={(e)=>setAnswer(e.target.value)} onKeyDown={(e)=>{if(e.key==='Enter')checkTyped()}} className="mt-6 w-full rounded-2xl border-2 border-gray-100 px-5 py-4 text-xl font-bold outline-none focus:border-[#1cb0f6]" placeholder="Write your answer…"/><button onClick={checkTyped} className="mt-4 w-full rounded-2xl bg-[#1cb0f6] px-5 py-4 font-black text-white shadow-[0_6px_0_#168dc4]">Check</button></>}{feedback&&<div className={`mt-6 rounded-2xl p-5 ${feedback==='correct'?'bg-green-50 text-green-700':'bg-red-50 text-red-700'}`}><p className="text-xl font-black">{feedback==='correct'?'Correct!':'Not quite'}</p><p className="mt-1">{step.word.bulgarian} = {step.word.english}</p><button onClick={next} className="mt-4 rounded-xl bg-white px-4 py-2 font-black shadow">Continue</button></div>}</div></section></main>;
  }

  return <main className="min-h-screen bg-yogurt"><section className="mx-auto max-w-5xl px-4 py-8"><div className="rounded-[2rem] bg-gradient-to-br from-rosewood to-red-500 p-6 text-white shadow-xl md:p-10"><p className="font-black uppercase tracking-widest text-orange-100">LLB Bulgarian</p><h1 className="mt-2 text-4xl font-black md:text-6xl">Learn Bulgarian one guided lesson at a time.</h1><p className="mt-4 max-w-2xl text-lg text-orange-50">A more professional, Duolingo-style path with XP, hearts, streaks, audio, typing and spaced repetition.</p><div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4"><Stat label="XP" value={progress.xp} /><Stat label="Streak" value={`${progress.streak}🔥`} /><Stat label="Hearts" value={`${progress.hearts}❤️`} /><Stat label="Words" value="500" /></div><div className="mt-6 rounded-2xl bg-white/15 p-4"><div className="mb-2 flex justify-between text-sm font-black"><span>Daily goal</span><span>{dailyPct}%</span></div><div className="h-4 overflow-hidden rounded-full bg-white/20"><div className="h-full bg-[#58cc02]" style={{width:`${dailyPct}%`}} /></div></div></div><div className="mt-8 grid gap-4">{lessons.map((lesson, i)=>{const isDone=progress.completedLessons.includes(lesson.id); const isUnlocked=unlocked(i); return <button key={lesson.id} disabled={!isUnlocked} onClick={()=>startLesson(lesson)} className={`flex items-center gap-4 rounded-[1.5rem] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:hover:translate-y-0`}><div className="grid h-16 w-16 place-items-center rounded-2xl text-3xl font-black text-white" style={{background:lesson.color}}>{isDone?'✓':i+1}</div><div className="flex-1"><h2 className="text-xl font-black text-gray-900">{lesson.title}</h2><p className="text-gray-600">{lesson.subtitle}</p><p className="mt-1 text-sm font-bold text-gray-400">{lesson.words.length} words · {lesson.xp} XP</p></div><span className="rounded-full bg-orange-50 px-4 py-2 font-black text-rosewood">{isUnlocked?'Start':'Locked'}</span></button>})}</div></section></main>;
}
