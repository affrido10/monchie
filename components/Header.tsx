
import React from 'react';
import { AppLanguage } from '../types';
import { translations } from '../translations';

interface HeaderProps {
  isAdmin: boolean;
  onToggleAdmin: () => void;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenGraph: () => void;
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  isAdmin, 
  onToggleAdmin, 
  activeCategory, 
  setActiveCategory, 
  searchQuery,
  setSearchQuery,
  onOpenGraph,
  language,
  setLanguage
}) => {
  const t = translations[language];
  const categories = ['All', 'Philosophy', 'Language', 'Reflection'];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-2xl bg-black/40 border-b border-white/5 transition-colors duration-500">
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between gap-4">
        <div 
          className="text-2xl font-serif font-bold tracking-tight text-white cursor-pointer group shrink-0"
          onClick={() => {
            setActiveCategory('All');
            setSearchQuery('');
          }}
        >
          {t.siteTitle}<span className="text-purple-500 group-hover:animate-ping inline-block ml-0.5">.</span>
        </div>
        
        <div className="flex-1 max-w-sm hidden lg:block relative group">
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full bg-zinc-800/50 border border-transparent focus:border-purple-500/30 rounded-full py-2 px-10 text-xs font-medium tracking-wide outline-none transition-all placeholder:text-zinc-600"
          />
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <nav className="hidden md:flex items-center space-x-6">
          <div className="flex items-center bg-zinc-800/40 p-1 rounded-full border border-white/5">
            {(['en', 'ru', 'fr', 'de'] as AppLanguage[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`w-8 h-8 rounded-full text-[9px] font-black uppercase transition-all ${
                  language === lang 
                    ? 'bg-zinc-700 text-purple-400 shadow-sm' 
                    : 'text-zinc-400 hover:text-zinc-300'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenGraph}
            className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400 hover:text-purple-500 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {t.mindMap}
          </button>
          
          <div className="flex space-x-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-500 relative group/nav ${
                  activeCategory === cat 
                    ? 'text-white' 
                    : 'text-zinc-500 hover:text-zinc-200'
                }`}
              >
                {cat === 'All' ? t.all : t.categories[cat as keyof typeof t.categories]}
                <span className={`absolute -bottom-1 left-0 w-full h-[1px] bg-purple-500 transition-transform duration-500 origin-left ${
                  activeCategory === cat ? 'scale-x-100' : 'scale-x-0 group-hover/nav:scale-x-100'
                }`}></span>
              </button>
            ))}
          </div>
        </nav>

        <div className="flex items-center space-x-3">
          {/* Theme toggle removed per user request */}

          <button
            onClick={onToggleAdmin}
            className={`group flex items-center gap-0 hover:gap-3 px-3 hover:px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-700 border overflow-hidden ${
              isAdmin 
                ? 'bg-purple-600/10 border-purple-500/40 text-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.15)] hover:bg-purple-600/20' 
                : 'bg-white/[0.03] text-zinc-500 border-white/10 hover:border-purple-500/50 hover:text-purple-500'
            }`}
          >
            <div className="shrink-0 transition-transform duration-500 group-hover:scale-110">
              {isAdmin ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              )}
            </div>
            <span className="max-w-0 group-hover:max-w-[100px] opacity-0 group-hover:opacity-100 transition-all duration-700 whitespace-nowrap">
              {isAdmin ? t.admin : t.access}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
