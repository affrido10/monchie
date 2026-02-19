
import { Note, NoteCategory } from './types';

export const INITIAL_NOTES: Note[] = [
  {
    id: '1',
    title: 'The Paradox of Choice',
    content: 'Is having more freedom to choose truly liberating, or does it lead to paralysis? Barry Schwartz argues that an abundance of options leads to higher anxiety and lower satisfaction.',
    category: NoteCategory.PHILOSOPHY,
    // Fix: Added missing language property required by Note interface
    language: 'en',
    createdAt: new Date('2024-03-20').toISOString(),
    tags: ['existentialism', 'psychology', 'freedom']
  },
  {
    id: '2',
    title: 'Japanese "Mono no aware"',
    content: 'The pathost of things. A Japanese term for the awareness of impermanence, or transience of things, and both a transient gentle sadness at their passing as well as a longer, deeper gentle sadness about this state being the reality of life.',
    category: NoteCategory.LANGUAGE,
    // Fix: Added missing language property required by Note interface
    language: 'en',
    createdAt: new Date('2024-03-22').toISOString(),
    tags: ['linguistics', 'culture', 'japan']
  },
  {
    id: '3',
    title: 'The Hegelian Dialectic',
    content: 'Thesis, antithesis, synthesis. The process of change where a concept is preserved and fulfilled by its opposite.',
    category: NoteCategory.PHILOSOPHY,
    // Fix: Added missing language property required by Note interface
    language: 'en',
    createdAt: new Date('2024-03-25').toISOString(),
    tags: ['hegel', 'dialectic', 'growth']
  }
];

export const CATEGORY_COLORS: Record<NoteCategory, string> = {
  [NoteCategory.PHILOSOPHY]: 'bg-purple-900/40 text-purple-300 border border-purple-500/30',
  [NoteCategory.LANGUAGE]: 'bg-blue-900/40 text-blue-300 border border-blue-500/30',
  [NoteCategory.REFLECTION]: 'bg-emerald-900/40 text-emerald-300 border border-emerald-500/30',
  [NoteCategory.GENERAL]: 'bg-zinc-800 text-zinc-300 border border-zinc-700'
};
