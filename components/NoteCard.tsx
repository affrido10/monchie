
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Note, NoteCategory } from '../types';
import { CATEGORY_COLORS } from '../constants';

interface NoteCardProps {
  note: Note;
  onDelete?: (id: string) => void;
  onEdit?: (note: Note) => void;
  isAdmin?: boolean;
  onNavigate?: (title: string) => void;
  isZenOnly?: boolean;
  onCloseZen?: () => void;
}

type ReaderFont = 'sans' | 'serif' | 'reader' | 'mono';

const NoteCard: React.FC<NoteCardProps> = ({ note, onDelete, onEdit, isAdmin, onNavigate, isZenOnly, onCloseZen }) => {
  const [isZenMode, setIsZenMode] = useState(isZenOnly || false);
  const [isMini, setIsMini] = useState(false);
  const [miniStage, setMiniStage] = useState<'closed' | 'opening' | 'open' | 'closing'>('closed');
  const [copied, setCopied] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [readerFont, setReaderFont] = useState<ReaderFont>('sans');
  
  const [miniPos, setMiniPos] = useState({ x: 100, y: 120 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (isZenOnly) setIsZenMode(true);
  }, [isZenOnly]);

  useEffect(() => {
    if (isMini && miniStage === 'closed') {
      setMiniStage('opening');
      const timer = setTimeout(() => setMiniStage('open'), 50);
      return () => clearTimeout(timer);
    }
  }, [isMini]);

  const readingTime = useMemo(() => {
    const words = note.content.split(/\s+/).length;
    return Math.ceil(words / 200) || 1;
  }, [note.content]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${note.title}\n\n${note.content}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const handleLinkClick = (e: React.MouseEvent, title: string) => {
    e.stopPropagation();
    if (onNavigate) onNavigate(title);
  };

  // Modern Markdown + Obsidian parser
  const processFormattedText = (text: string) => {
    // 1. Support [[Link|Alias]] or [[Link]]
    const parts = text.split(/(\[\[.*?\]\])/g);
    
    return parts.map((part, i) => {
      if (part.startsWith('[[') && part.endsWith(']]')) {
        const raw = part.slice(2, -2);
        const [target, alias] = raw.split('|');
        return (
          <button
            key={`link-${i}`}
            onClick={(e) => handleLinkClick(e, target.trim())}
            className="text-purple-600 dark:text-purple-400 font-bold hover:underline decoration-purple-500/30 underline-offset-4 decoration-2 transition-all inline-block"
          >
            {alias ? alias.trim() : target.trim()}
          </button>
        );
      }

      // 2. Bold/Italic
      let content: any = part;
      
      // Highlight: ==text==
      content = String(content).split(/(==.*?==)/g).map((s, idx) => 
        s.startsWith('==') && s.endsWith('==') ? <span key={idx} className="md-highlight">{s.slice(2, -2)}</span> : s
      );

      // Strikethrough: ~~text~~
      content = React.Children.toArray(content).flatMap(item => 
        typeof item === 'string' ? item.split(/(~~.*?~~)/g).map((s, idx) => 
          s.startsWith('~~') && s.endsWith('~~') ? <span key={idx} className="md-strikethrough">{s.slice(2, -2)}</span> : s
        ) : item
      );

      // Code: `code`
      content = React.Children.toArray(content).flatMap(item => 
        typeof item === 'string' ? item.split(/(`.*?`)/g).map((s, idx) => 
          s.startsWith('`') && s.endsWith('`') ? <code key={idx} className="md-inline-code">{s.slice(1, -1)}</code> : s
        ) : item
      );

      // Bold-Italic: ***text***
      content = React.Children.toArray(content).flatMap(item => 
        typeof item === 'string' ? item.split(/(\*\*\*.*?\*\*\*)/g).map((s, idx) => 
          s.startsWith('***') && s.endsWith('***') ? <strong key={idx} className="italic font-black text-zinc-950 dark:text-white">{s.slice(3, -3)}</strong> : s
        ) : item
      );

      // Bold: **text**
      content = React.Children.toArray(content).flatMap(item => 
        typeof item === 'string' ? item.split(/(\*\*.*?\*\*)/g).map((s, idx) => 
          s.startsWith('**') && s.endsWith('**') ? <strong key={idx} className="font-black text-zinc-950 dark:text-white">{s.slice(2, -2)}</strong> : s
        ) : item
      );

      // Italic: *text*
      content = React.Children.toArray(content).flatMap(item => 
        typeof item === 'string' ? item.split(/(\*.*?\*)/g).map((s, idx) => 
          s.startsWith('*') && s.endsWith('*') ? <em key={idx} className="italic font-medium">{s.slice(1, -1)}</em> : s
        ) : item
      );

      return content;
    });
  };

  const renderContent = (content: string, useDropCap: boolean = false) => {
    const lines = content.split('\n');
    const firstNonEmptyLineIdx = lines.findIndex(l => l.trim().length > 0);
    
    const fontClass = {
      sans: 'font-sans',
      serif: 'font-serif',
      reader: 'font-reader',
      mono: 'font-mono'
    }[readerFont];

    return lines.map((line, lineIdx) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return <div key={lineIdx} className="h-4" />;

      // 1. Horizontal Rule
      if (trimmedLine === '---' || trimmedLine === '***' || trimmedLine === '___') {
        return <hr key={lineIdx} className="md-hr" />;
      }

      // 2. Blockquotes
      if (trimmedLine.startsWith('>')) {
        return (
          <blockquote key={lineIdx} className={`md-quote ${fontClass}`}>
            {processFormattedText(trimmedLine.replace(/^>\s?/, ''))}
          </blockquote>
        );
      }

      // 3. Task Lists
      const taskMatch = trimmedLine.match(/^([-*+]\s\[([ xX])\])\s(.*)/);
      if (taskMatch) {
        const isChecked = taskMatch[2].toLowerCase() === 'x';
        return (
          <div key={lineIdx} className={`task-list-item ${fontClass} ${isChecked ? 'opacity-50' : ''}`}>
            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${isChecked ? 'bg-purple-500 border-purple-400' : 'border-zinc-300 dark:border-zinc-700'}`}>
              {isChecked && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
            </div>
            <span className={isChecked ? 'line-through text-zinc-400' : 'text-zinc-700 dark:text-zinc-200'}>
              {processFormattedText(taskMatch[3])}
            </span>
          </div>
        );
      }

      // 4. Standard Lists (Bulleted)
      if (trimmedLine.match(/^([-*+]\s)/)) {
        return (
          <div key={lineIdx} className={`flex gap-3 mb-2 ml-4 ${fontClass}`}>
            <span className="text-purple-500 mt-1.5">•</span>
            <span className="text-zinc-700 dark:text-zinc-400 font-light">
              {processFormattedText(trimmedLine.replace(/^[-*+]\s/, ''))}
            </span>
          </div>
        );
      }

      // 5. Headers
      const headerMatch = trimmedLine.match(/^(#{1,6})\s(.*)/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const text = headerMatch[2];
        const headerSizes = [
          'text-4xl font-serif font-black mb-8 mt-12',
          'text-3xl font-serif font-bold mb-6 mt-10',
          'text-2xl font-bold mb-5 mt-8',
          'text-xl font-bold mb-4 mt-6',
          'text-lg font-bold mb-3 mt-4',
          'text-base font-bold mb-2 mt-2'
        ];
        return (
          <div key={lineIdx} className={`${headerSizes[level-1]} text-zinc-950 dark:text-white ${fontClass}`}>
            {processFormattedText(text)}
          </div>
        );
      }

      // 6. Normal Paragraph
      const isFirstLine = lineIdx === firstNonEmptyLineIdx;
      const lineClass = `block mb-6 ${fontClass} ${useDropCap && isFirstLine ? 'first-letter:text-7xl first-letter:font-serif first-letter:mr-4 first-letter:float-left first-letter:text-purple-600 dark:first-letter:text-purple-400 first-letter:mt-2' : ''}`;

      return (
        <span key={lineIdx} className={`${lineClass} text-zinc-700 dark:text-zinc-400 font-light leading-relaxed`}>
          {processFormattedText(line)}
        </span>
      );
    });
  };

  const handleMiniMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); 
    isDragging.current = true;
    dragStart.current = { x: e.clientX - miniPos.x, y: e.clientY - miniPos.y };
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      setMiniPos({ 
        x: e.clientX - dragStart.current.x, 
        y: e.clientY - dragStart.current.y 
      });
    };
    const onUp = () => {
      isDragging.current = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  const closeMini = () => {
    setMiniStage('closing');
    setTimeout(() => {
      setIsMini(false);
      setMiniStage('closed');
    }, 400);
  };

  const restoreFromMini = () => {
    setMiniStage('closing');
    setTimeout(() => {
      setIsMini(false);
      setMiniStage('closed');
      setIsZenMode(true);
    }, 300);
  };

  const cardContent = (
    <div 
      className={`group relative bg-white/60 dark:bg-zinc-900/40 rounded-[1.75rem] p-6 transition-all duration-700 cursor-pointer border border-zinc-200 dark:border-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-white dark:hover:bg-zinc-900/60 shadow-sm hover:shadow-xl active:scale-[0.99] h-full flex flex-col`}
      onClick={() => setIsZenMode(true)}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-2">
          <span className={`px-3 py-1 rounded-full text-[9px] uppercase tracking-[0.2em] font-black ${CATEGORY_COLORS[note.category]}`}>
            {note.category}
          </span>
          <button 
            onClick={toggleFavorite}
            className={`transition-colors duration-300 ${isFavorite ? 'text-yellow-500' : 'text-zinc-300 dark:text-zinc-700 hover:text-yellow-500'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill={isFavorite ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
        </div>
        <span className="text-[10px] text-zinc-500 dark:text-zinc-600 font-bold uppercase tracking-widest">
          {new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>
      </div>

      <h3 className="text-xl font-serif font-bold text-zinc-900 dark:text-zinc-100 mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors leading-tight">
        {note.title}
      </h3>

      <div className={`text-zinc-700 dark:text-zinc-400 leading-relaxed font-light mb-4 line-clamp-4 text-sm whitespace-pre-wrap flex-grow`}>
        {renderContent(note.content)}
      </div>

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-100 dark:border-white/5">
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <svg className="w-3 h-3 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">{readingTime} min read</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button onClick={handleCopy} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
            {copied ? (
              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2-2h-8a2 2 0 00-2-2h-8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {isAdmin && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete?.(note.id); }}
            className="absolute -top-3 -right-3 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg z-10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit?.(note); }}
            className="absolute -top-3 -left-3 bg-purple-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg z-10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
              <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
            </svg>
          </button>
        </>
      )}
    </div>
  );

  return (
    <>
      {!isZenOnly && cardContent}

      {isZenMode && (() => {
        let mouseDownTarget: EventTarget | null = null;
        return (
        <div 
          className="fixed inset-0 z-[100] bg-white dark:bg-[#050505] animate-in fade-in duration-300 flex flex-col items-center p-8 md:p-24 overflow-y-auto"
          onMouseDown={(e) => { mouseDownTarget = e.target; }}
          onClick={(e) => { 
            // Закрываем только если mousedown и click были на одном элементе (не было drag/выделения)
            if (mouseDownTarget === e.currentTarget && e.target === e.currentTarget) {
              setIsZenMode(false); onCloseZen?.(); 
            }
          }}
        >
          <div className="fixed top-8 right-8 flex items-center gap-4 z-[110]">
            <div className="bg-zinc-100 dark:bg-white/5 p-1 rounded-2xl border border-zinc-200 dark:border-white/10 flex items-center gap-1 shadow-2xl backdrop-blur-xl">
              {(['sans', 'serif', 'reader', 'mono'] as ReaderFont[]).map(f => (
                <button
                  key={f}
                  onClick={(e) => { e.stopPropagation(); setReaderFont(f); }}
                  className={`px-3 py-1.5 rounded-xl text-[9px] uppercase font-black transition-all ${readerFont === f ? 'bg-white dark:bg-white/20 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
                >
                  {f}
                </button>
              ))}
            </div>
            
            <button 
              className="p-4 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all hover:scale-110 active:scale-90 bg-zinc-100 dark:bg-white/5 rounded-full border border-zinc-200 dark:border-white/10"
              onClick={(e) => { e.stopPropagation(); setIsMini(true); setIsZenMode(false); }}
              title="Minimize to Floating Window"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>

            <button 
              className="p-4 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all hover:scale-110 active:scale-90 bg-zinc-100 dark:bg-white/5 rounded-full border border-zinc-200 dark:border-white/10"
              onClick={() => { setIsZenMode(false); onCloseZen?.(); }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <article 
            className="max-w-3xl w-full mx-auto animate-in slide-in-from-bottom-12 duration-1000 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="mb-20 text-center">
              <div className={`inline-block mb-8 px-6 py-2 rounded-full text-[11px] uppercase tracking-[0.4em] font-black shadow-sm ${CATEGORY_COLORS[note.category]}`}>
                {note.category}
              </div>
              <h1 className="text-5xl md:text-7xl font-serif font-bold text-zinc-950 dark:text-white leading-tight mb-8">
                {note.title}
              </h1>
              <div className="flex items-center justify-center gap-6 text-zinc-500 dark:text-zinc-500 font-bold text-xs uppercase tracking-[0.2em]">
                <span>{new Date(note.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                <span className="w-1.5 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full"></span>
                <span>{readingTime} min read</span>
              </div>
            </header>

            <div className="prose prose-xl prose-zinc dark:prose-invert max-w-none">
              <div className="text-xl md:text-2xl leading-[1.8] font-light text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">
                {renderContent(note.content, true)}
              </div>
            </div>

            <footer className="mt-32 pt-16 border-t border-zinc-100 dark:border-zinc-900 flex flex-wrap gap-3 justify-center">
              {note.tags.map(tag => (
                <span key={tag} className="text-[10px] font-black text-zinc-500 bg-zinc-50 dark:bg-zinc-900 px-5 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 uppercase tracking-widest hover:border-purple-500/50 transition-colors">
                  #{tag}
                </span>
              ))}
            </footer>
          </article>
        </div>
        );
      })()}

      {isMini && (
        <div 
          style={{ 
            left: miniPos.x, 
            top: miniPos.y,
            transition: 'transform 0.5s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.4s cubic-bezier(0.32, 0.72, 0, 1)',
            transform: miniStage === 'open' ? 'scale(1) translateZ(0)' : 'scale(0.6) translateZ(0)',
            opacity: miniStage === 'open' ? 1 : 0,
            pointerEvents: miniStage === 'open' ? 'auto' : 'none'
          }}
          className="fixed z-[200] w-72 h-96 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-3xl border border-zinc-200/50 dark:border-white/10 rounded-[2.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden origin-center select-none"
        >
          <div 
            onMouseDown={handleMiniMouseDown}
            className="h-14 flex items-center justify-between px-6 bg-zinc-50/50 dark:bg-white/5 cursor-grab active:cursor-grabbing border-b border-zinc-100 dark:border-white/5"
          >
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 truncate pr-4">{note.title}</span>
            <div className="flex gap-2.5">
              <button onClick={closeMini} className="w-3.5 h-3.5 rounded-full bg-[#ff5f57] hover:scale-110 active:scale-90 transition-all shadow-[0_2px_10px_rgba(255,95,87,0.3)]" title="Close" />
              <button onClick={restoreFromMini} className="w-3.5 h-3.5 rounded-full bg-[#28c940] hover:scale-110 active:scale-90 transition-all shadow-[0_2px_10px_rgba(40,201,64,0.3)]" title="Expand" />
            </div>
          </div>
          <div className="p-8 overflow-y-auto flex-grow text-[11px] leading-[1.8] font-light text-zinc-600 dark:text-zinc-300 scroll-smooth">
             <h4 className="font-serif font-bold text-xl text-zinc-900 dark:text-white mb-5 leading-tight">{note.title}</h4>
             <div className="whitespace-pre-wrap">{renderContent(note.content)}</div>
          </div>
        </div>
      )}
    </>
  );
};

export default NoteCard;
