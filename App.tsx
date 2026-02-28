
import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import NoteCard from './components/NoteCard';
import AdminPanel from './components/AdminPanel';
import LoginModal from './components/LoginModal';
import GraphView from './components/GraphView';
import { INITIAL_NOTES } from './constants';
import { Note, NoteCategory, AppLanguage } from './types';
import { supabase } from './lib/supabase';
import { translations } from './translations';

const App: React.FC = () => {
  const [language, setLanguage] = useState<AppLanguage>(() => {
    return (localStorage.getItem('lumina_lang') as AppLanguage) || 'en';
  });
  
  // Forced dark theme only as requested
  const [theme] = useState<'dark'>('dark');

  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>(() => {
    return localStorage.getItem('lumina_active_category') || 'All';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [zenNoteId, setZenNoteId] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState(0);

  const t = translations[language];

  const loadLocalNotes = () => {
    const saved = localStorage.getItem('lumina_local_notes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_NOTES;
      }
    }
    return INITIAL_NOTES;
  };

  const saveLocalNotes = (updatedNotes: Note[]) => {
    localStorage.setItem('lumina_local_notes', JSON.stringify(updatedNotes));
  };

  useEffect(() => {
    localStorage.setItem('lumina_lang', language);
  }, [language]);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setIsLoading(true);
        if (!supabase) {
          setNotes(loadLocalNotes());
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          const transformedNotes: Note[] = data.map(n => ({
            id: n.id,
            title: n.title,
            content: n.content,
            category: n.category as NoteCategory,
            language: (n.language as AppLanguage) || 'en',
            createdAt: n.created_at,
            tags: n.tags || []
          }));
          setNotes(transformedNotes);
          saveLocalNotes(transformedNotes);
        } else {
          setNotes(loadLocalNotes());
        }
      } catch (err) {
        setNotes(loadLocalNotes());
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotes();
  }, []);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    localStorage.setItem('lumina_active_category', activeCategory);
    if (!zenNoteId) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeCategory, zenNoteId]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredNotes = useMemo(() => {
    let result = notes;
    if (activeCategory !== 'All') {
      result = result.filter(n => n.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n => 
        n.title.toLowerCase().includes(q) || 
        n.content.toLowerCase().includes(q) ||
        n.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [notes, activeCategory, searchQuery]);

  const handleAddNote = async (newNoteData: Omit<Note, 'id' | 'createdAt'>) => {
    const tempId = Math.random().toString(36).substr(2, 9);
    const newNote: Note = {
      ...newNoteData,
      id: tempId,
      createdAt: new Date().toISOString(),
    };

    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    saveLocalNotes(updatedNotes);

    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('notes')
        .insert([{
          title: newNote.title,
          content: newNote.content,
          category: newNote.category,
          language: newNote.language,
          tags: newNote.tags,
          created_at: newNote.createdAt
        }])
        .select();

      if (error) throw error;
      if (data && data[0]) {
        const dbNote: Note = {
          id: data[0].id,
          title: data[0].title,
          content: data[0].content,
          category: data[0].category as NoteCategory,
          language: data[0].language as AppLanguage,
          createdAt: data[0].created_at,
          tags: data[0].tags || []
        };
        const finalNotes = updatedNotes.map(n => n.id === tempId ? dbNote : n);
        setNotes(finalNotes);
        saveLocalNotes(finalNotes);
      }
    } catch (err) {
      console.error('Error adding note:', err);
    }
  };

  const handleDeleteNote = async (id: string) => {
    const originalNotes = [...notes];
    const updatedNotes = notes.filter(n => n.id !== id);
    setNotes(updatedNotes);
    saveLocalNotes(updatedNotes);

    if (!supabase) return;

    try {
      await supabase.from('notes').delete().eq('id', id);
    } catch (err) {
      setNotes(originalNotes);
      saveLocalNotes(originalNotes);
    }
  };

  const handleEditNote = async (updatedNote: Note) => {
    const updatedNotes = notes.map(n => n.id === updatedNote.id ? updatedNote : n);
    setNotes(updatedNotes);
    saveLocalNotes(updatedNotes);
    setEditingNote(null);

    if (!supabase) return;

    try {
      await supabase.from('notes').update({
        title: updatedNote.title,
        content: updatedNote.content,
        category: updatedNote.category,
        language: updatedNote.language,
        tags: updatedNote.tags,
      }).eq('id', updatedNote.id);
    } catch (err) {
      console.error('Error updating note:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 overflow-x-hidden selection:bg-purple-500/30">
      <Header 
        isAdmin={isAdmin} 
        onToggleAdmin={() => isAdmin ? setIsAdmin(false) : setShowLoginModal(true)} 
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        theme="dark"
        toggleTheme={() => {}} // Disabled as requested
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenGraph={() => setShowGraph(true)}
        language={language}
        setLanguage={setLanguage}
      />

      <main className="max-w-6xl mx-auto px-6 py-12 md:py-24 relative">
        <section className="mb-32 text-center md:text-left relative z-10">
          <div 
            style={{ 
                transform: `translateY(${scrollY * 0.1}px)`, 
                opacity: Math.max(0, 1 - scrollY / 800) 
            }}
            className="transition-all duration-150"
          >
            <h1 className="text-6xl md:text-8xl font-serif font-bold text-white leading-[1.1] mb-6">
              LE JARDIN DU<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
               PÉDÉ PUANT
              </span>
            </h1>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 relative z-10">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-96 rounded-[2.5rem] bg-zinc-900 animate-pulse border border-zinc-800" />
            ))
          ) : (
            filteredNotes.map(note => (
              <NoteCard 
                key={note.id} 
                note={note} 
                isAdmin={isAdmin} 
                onDelete={handleDeleteNote}
                onEdit={(note) => { setEditingNote(note); setShowAdminPanel(true); }}
                onNavigate={(title) => setZenNoteId(notes.find(n => n.title.toLowerCase() === title.toLowerCase())?.id || null)}
              />
            ))
          )}
        </div>
        
        {!isLoading && filteredNotes.length === 0 && (
          <div className="text-center py-32">
            <p className="text-zinc-400 font-serif italic text-xl">{t.noThoughts}</p>
          </div>
        )}

        {isAdmin && (
          <div className="mt-32 flex justify-center pb-20">
            <button
              onClick={() => setShowAdminPanel(true)}
              className="group flex items-center gap-4 bg-white text-black px-10 py-5 rounded-full font-black uppercase tracking-[0.3em] text-xs transition-all hover:scale-105 active:scale-95 shadow-2xl"
            >
              <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t.newEntry}
            </button>
          </div>
        )}
      </main>

      {showAdminPanel && (
        <AdminPanel 
          onAddNote={handleAddNote} 
          onEditNote={handleEditNote}
          onClose={() => { setShowAdminPanel(false); setEditingNote(null); }} 
          appLanguage={language}
          editingNote={editingNote}
        />
      )}

      {showLoginModal && (
        <LoginModal 
          onSuccess={() => { setIsAdmin(true); setShowLoginModal(false); }} 
          onClose={() => setShowLoginModal(false)} 
        />
      )}

      {showGraph && (
        <GraphView 
          notes={notes} 
          onNoteSelect={(id) => setZenNoteId(id)} 
          onClose={() => setShowGraph(false)} 
        />
      )}

      {zenNoteId && (
        <NoteCard 
          note={notes.find(n => n.id === zenNoteId)!} 
          isZenOnly={true} 
          onCloseZen={() => setZenNoteId(null)}
          onNavigate={(title) => setZenNoteId(notes.find(n => n.title.toLowerCase() === title.toLowerCase())?.id || null)}
        />
      )}

      <footer className="max-w-6xl mx-auto px-6 py-20 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">
          {t.footer} &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
};

export default App;
