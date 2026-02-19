
export enum NoteCategory {
  PHILOSOPHY = 'Philosophy',
  LANGUAGE = 'Language',
  REFLECTION = 'Reflection',
  GENERAL = 'General'
}

export type AppLanguage = 'en' | 'ru' | 'fr' | 'de';

export interface Note {
  id: string;
  title: string;
  content: string;
  category: NoteCategory;
  language: AppLanguage;
  createdAt: string;
  tags: string[];
}
