import { words, type Word } from '@/data/words';

export type ExerciseKind = 'learn' | 'choice' | 'type' | 'listen' | 'match';
export type Lesson = { id: string; title: string; subtitle: string; category: string; words: Word[]; color: string; xp: number };

const colors = ['#58cc02', '#1cb0f6', '#ce82ff', '#ff9600', '#ff4b4b', '#00cd9c'];
const categories = Array.from(new Set(words.map((w) => w.category)));

export const lessons: Lesson[] = categories.flatMap((category, catIndex) => {
  const categoryWords = words.filter((w) => w.category === category);
  const chunks: Lesson[] = [];
  for (let i = 0; i < categoryWords.length; i += 12) {
    const chunk = categoryWords.slice(i, i + 12);
    if (chunk.length < 6) continue;
    chunks.push({
      id: `${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.floor(i / 12) + 1}`,
      title: `${category} ${Math.floor(i / 12) + 1}`,
      subtitle: chunk.slice(0, 3).map((w) => w.bulgarian).join(' · '),
      category,
      words: chunk,
      color: colors[catIndex % colors.length],
      xp: 10 + Math.min(10, chunk.length),
    });
  }
  return chunks;
}).slice(0, 30);

export function getLesson(id: string) { return lessons.find((lesson) => lesson.id === id) ?? lessons[0]; }
