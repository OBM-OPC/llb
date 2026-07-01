'use client';
import { useMemo, useState } from 'react';
import { words } from '@/data/words';
import { gradeWord, loadProgress } from '@/lib/storage';
import { isDue, type ReviewGrade } from '@/lib/sm2';
import { speakBulgarian } from '@/lib/tts';
const grades: [ReviewGrade,string][] = [[0,'Again'],[3,'Hard'],[4,'Good'],[5,'Easy']];
export function Flashcards(){
  const [index,setIndex]=useState(0); const [revealed,setRevealed]=useState(false); const [mode,setMode]=useState<'en-bg'|'bg-en'>('en-bg'); const [typed,setTyped]=useState(''); const [done,setDone]=useState(0);
  const queue=useMemo(()=>{const p=typeof window==='undefined'?{}:loadProgress(); const due=words.filter(w=>!p[w.rank]||isDue(p[w.rank])); return due.length?due:words.slice(0,30)},[done]);
  const word=queue[index%queue.length]; if(!word) return <p>No words loaded.</p>;
  const prompt=mode==='en-bg'?word.english:word.bulgarian; const answer=mode==='en-bg'?word.bulgarian:word.english;
  function grade(g:ReviewGrade){ gradeWord(word.rank,g); setRevealed(false); setTyped(''); setIndex(i=>i+1); setDone(d=>d+1); }
  return <section className="mx-auto max-w-3xl px-4 py-8">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl font-black text-rosewood">LLB Flashcards</h1><p className="text-sm text-gray-600">{queue.length} due · {words.length} total · SM-2 spaced repetition</p></div><button onClick={()=>setMode(mode==='en-bg'?'bg-en':'en-bg')} className="rounded-full bg-white px-4 py-2 font-semibold shadow">{mode==='en-bg'?'English → Bulgarian':'Bulgarian → English'}</button></div>
    <div className="card-shadow rounded-3xl bg-white p-6 md:p-10"><div className="mb-3 text-sm font-bold uppercase tracking-wide text-rosewood">#{word.rank} · {word.category}</div><button onClick={()=>speakBulgarian(word.bulgarian)} className="mb-6 rounded-full bg-orange-100 px-4 py-2 text-sm font-bold text-rosewood">🔊 Bulgarian audio</button><div className="min-h-36 text-center"><p className="text-sm text-gray-500">Prompt</p><p className="mt-2 text-4xl font-black">{prompt}</p>{mode==='en-bg'&&<p className="mt-2 text-gray-500">Spoken: {word.spoken}</p>}</div><input value={typed} onChange={e=>setTyped(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')setRevealed(true)}} placeholder="Type your answer…" className="mt-6 w-full rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 outline-none focus:ring-4 focus:ring-orange-200"/><button onClick={()=>setRevealed(true)} className="mt-4 w-full rounded-2xl bg-rosewood px-5 py-3 font-black text-white">Reveal answer</button>{revealed&&<div className="mt-6 rounded-2xl bg-yogurt p-5"><p className="text-sm text-gray-500">Answer</p><p className="text-3xl font-black">{answer}</p><p className="mt-1 text-gray-600">{word.english} · {word.bulgarian} · {word.spoken}</p><div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">{grades.map(([g,label])=><button key={g} onClick={()=>grade(g)} className="rounded-xl bg-white px-4 py-3 font-bold shadow hover:bg-orange-50">{label}</button>)}</div></div>}</div>
  </section>;
}
