
import React, { useState, useRef, useEffect } from 'react';
import { NoteCategory, Note, AppLanguage } from '../types';
import { translations } from '../translations';
import { supabase } from '../lib/supabase';

interface AdminPanelProps {
  onAddNote: (note: Omit<Note, 'id' | 'createdAt'>) => void;
  onEditNote: (note: Note) => void;
  onClose: () => void;
  appLanguage: AppLanguage;
  editingNote?: Note | null;
}

const DRAFT_KEY = 'lumina_note_draft';

const AdminPanel: React.FC<AdminPanelProps> = ({ onAddNote, onEditNote, onClose, appLanguage, editingNote }) => {
  const t = translations[appLanguage].adminPanel;
  const isEditing = !!editingNote;
  
  const [title, setTitle] = useState(editingNote?.title || '');
  const [content, setContent] = useState(editingNote?.content || '');
  const [category, setCategory] = useState<NoteCategory>(editingNote?.category || NoteCategory.PHILOSOPHY);
  const [noteLanguage, setNoteLanguage] = useState<AppLanguage>(editingNote?.language || appLanguage);
  const [tags, setTags] = useState(editingNote?.tags?.join(', ') || '');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Health states
  const [dbStatus, setDbStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [latency, setLatency] = useState<number | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkHealth = async () => {
      if (!supabase) {
        setDbStatus('offline');
        return;
      }
      
      const start = performance.now();
      try {
        const { error } = await supabase.from('notes').select('id', { count: 'exact', head: true }).limit(1);
        const end = performance.now();
        if (error) throw error;
        setDbStatus('online');
        setLatency(Math.round(end - start));
      } catch (err) {
        setDbStatus('offline');
      }
    };
    
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isEditing) return; // не загружаем черновик при редактировании
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const { title, content, category, tags, language } = JSON.parse(savedDraft);
        setTitle(title || '');
        setContent(content || '');
        setCategory(category || NoteCategory.PHILOSOPHY);
        setTags(tags || '');
        setNoteLanguage(language || appLanguage);
        setLastSaved(new Date());
      } catch (e) {
        console.error('Failed to restore draft', e);
      }
    }
  }, []);

  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (title || content || tags) {
        const draft = { title, content, category, tags, language: noteLanguage };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        setLastSaved(new Date());
      }
    }, 30000);

    return () => clearInterval(saveInterval);
  }, [title, content, category, tags, noteLanguage]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    let parsedTitle = file.name.replace(/\.md$/, '');
    let parsedContent = text;
    let extractedTags: string[] = [];

    // 1. Handle YAML Frontmatter
    const yamlRegex = /^---\n([\s\S]*?)\n---/;
    const yamlMatch = text.match(yamlRegex);
    if (yamlMatch) {
      const yamlContent = yamlMatch[1];
      parsedContent = text.replace(yamlRegex, '').trim();

      // Extract title from YAML
      const titleMatch = yamlContent.match(/title:\s*(.*)/);
      if (titleMatch) parsedTitle = titleMatch[1].replace(/['"]/g, '').trim();

      // Extract tags from YAML
      const tagsMatch = yamlContent.match(/tags:\s*\[(.*?)\]/) || yamlContent.match(/tags:\s*(.*)/);
      if (tagsMatch) {
        const rawTags = tagsMatch[1].replace(/[\[\]'"]/g, '');
        extractedTags = rawTags.split(/[, ]+/).filter(t => t.trim());
      }
    }

    // 2. Extract H1 if no title in YAML
    if (parsedContent.startsWith('# ')) {
      const lines = parsedContent.split('\n');
      parsedTitle = lines[0].replace('# ', '').trim();
      parsedContent = lines.slice(1).join('\n').trim();
    }

    // 3. Extract hashtags from content (#tag)
    const hashtagRegex = /#(\w+)/g;
    let m;
    while ((m = hashtagRegex.exec(parsedContent)) !== null) {
      extractedTags.push(m[1]);
    }
    
    // Clean unique tags
    const finalTags = Array.from(new Set(extractedTags)).join(', ');

    setTitle(parsedTitle);
    setContent(parsedContent);
    setTags(finalTags);
    
    // Reset input
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    
    if (isEditing && editingNote) {
      onEditNote({
        ...editingNote,
        title,
        content,
        category,
        language: noteLanguage,
        tags: tags.split(',').map(t => t.trim()).filter(t => t)
      });
    } else {
      onAddNote({
        title,
        content,
        category,
        language: noteLanguage,
        tags: tags.split(',').map(t => t.trim()).filter(t => t)
      });
    }

    localStorage.removeItem(DRAFT_KEY);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-3xl bg-black/40 dark:bg-black/60">
      <div 
        className="bg-white dark:bg-zinc-900 rounded-[3rem] shadow-2xl dark:shadow-[0_0_100px_rgba(0,0,0,0.8)] w-full max-w-4xl grid grid-cols-1 lg:grid-cols-3 p-0 border border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-bottom-12 duration-700 overflow-hidden max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Main Form Area */}
        <div className="lg:col-span-2 p-10 md:p-12 overflow-y-auto border-r border-zinc-100 dark:border-white/5">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h2 className="text-4xl font-serif font-bold text-zinc-900 dark:text-zinc-100">{isEditing ? 'Редактировать' : t.title}</h2>
              <p className="text-[9px] text-zinc-400 uppercase tracking-widest mt-2">{t.subtitle}</p>
            </div>
            <button onClick={onClose} className="lg:hidden p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all text-zinc-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em] mb-4 ml-1">{t.essence}</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-6 py-4 focus:border-purple-500/50 outline-none transition-all text-lg font-light dark:text-white"
                  placeholder="..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em] mb-4 ml-1">{t.language}</label>
                <div className="flex gap-2">
                  {(['en', 'ru', 'fr', 'de'] as AppLanguage[]).map(lang => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setNoteLanguage(lang)}
                      className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                        noteLanguage === lang 
                          ? 'bg-purple-600 text-white border-purple-400 shadow-lg scale-105' 
                          : 'bg-zinc-50 dark:bg-black/20 text-zinc-400 border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div>
                <label className="block text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em] mb-4 ml-1">{t.keywords}</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-6 py-4 focus:border-purple-500/50 outline-none transition-all text-sm font-light dark:text-white"
                  placeholder="philosophy, thoughts, logic..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em] mb-4 ml-1">{t.domain}</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as NoteCategory)}
                  className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-6 py-4 focus:border-purple-500/50 outline-none transition-all text-sm font-black uppercase tracking-widest text-zinc-500 appearance-none"
                >
                  {Object.values(NoteCategory).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em] mb-4 ml-1">{t.stream}</label>
              <textarea
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800 rounded-3xl px-6 py-4 focus:border-purple-500/50 outline-none transition-all font-mono leading-relaxed text-zinc-700 dark:text-zinc-200"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 bg-zinc-900 text-white dark:bg-white dark:text-black font-black uppercase tracking-[0.3em] py-5 rounded-2xl hover:scale-[1.02] transition-all shadow-xl text-xs"
              >
                {isEditing ? 'Сохранить изменения' : t.commit}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-10 py-5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-black uppercase tracking-[0.3em] transition-all text-[10px]"
              >
                {t.cease}
              </button>
            </div>
          </form>
        </div>

        {/* Status Sidebar */}
        <div className="hidden lg:flex flex-col p-10 bg-zinc-50/50 dark:bg-black/20 h-full">
           <div className="flex justify-between items-center mb-12">
             <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
               <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
               </svg>
             </div>
             <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
             </button>
           </div>

           <div className="mb-12">
             <h3 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em] mb-6">{t.health}</h3>
             <div className="space-y-6">
                <div className="bg-white dark:bg-zinc-800/50 p-6 rounded-3xl border border-zinc-100 dark:border-white/5 shadow-sm">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-3">{t.status}</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${dbStatus === 'online' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`} />
                    <span className={`text-xs font-bold ${dbStatus === 'online' ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                      {dbStatus === 'online' ? t.connected : t.disconnected}
                    </span>
                  </div>
                </div>

                <div className="bg-white dark:bg-zinc-800/50 p-6 rounded-3xl border border-zinc-100 dark:border-white/5 shadow-sm">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-3">{t.latency}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-serif font-bold dark:text-white">{latency || '--'}</span>
                    <span className="text-[10px] font-bold text-zinc-400">ms</span>
                  </div>
                </div>
             </div>
           </div>

           <div className="mt-auto">
             <div 
               className="p-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl group hover:border-purple-500/50 transition-all cursor-pointer text-center"
               onClick={() => fileInputRef.current?.click()}
             >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept=".md" 
                  className="hidden" 
                />
                <svg className="w-6 h-6 mx-auto mb-3 text-zinc-400 group-hover:text-purple-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-purple-500 transition-colors leading-tight block">
                  {t.import}
                </span>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
