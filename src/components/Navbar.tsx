import React from 'react';
import { Flower2, Sprout, Sparkles, Sun, Moon, Menu } from 'lucide-react';

// 💡 부모(App)로부터 넘겨받는 7가지 데이터와 함수들의 타입을 엄격하게 정의합니다.
export interface NavbarProps {
  onHomeClick: () => void;
  onViewChange: (view: string) => void;
  currentView: string;
  onMenuClick: () => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
  role: string;
}

const Navbar: React.FC<NavbarProps> = ({ 
  onHomeClick, 
  onViewChange, 
  currentView, 
  onMenuClick, 
  toggleTheme, 
  isDarkMode, 
  role 
}) => (
  <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 shadow-sm h-20 flex items-center relative transition-colors">
    <div className="absolute top-2 left-10 text-emerald-200 dark:text-emerald-900/50 opacity-60"><Flower2 size={24}/></div>
    <div className="absolute bottom-2 right-10 text-sky-200 dark:text-sky-900/50 opacity-60"><Sprout size={24}/></div>

    <div className="container mx-auto px-4 w-full flex items-center justify-between relative z-10">
      <div className="flex items-center gap-3 cursor-pointer group" onClick={onHomeClick}>
         <div className="w-11 h-11 bg-gradient-to-br from-emerald-400 to-teal-400 dark:from-emerald-500 dark:to-teal-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md group-hover:rotate-12 transition-transform"><Sparkles size={24}/></div>
         <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">함께누리웹진</h1>
         {role === 'admin' && <span className="hidden sm:inline-block bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-black px-3 py-1 rounded-full">관리자 모드</span>}
      </div>
      <nav className="hidden md:flex items-center gap-2 bg-slate-50/80 dark:bg-slate-800/80 px-2.5 py-2.5 rounded-full border border-slate-100 dark:border-slate-700">
        {['home', 'issue_list', 'notice', 'news', 'resource_map'].map(key => (
          <button key={key} onClick={() => onViewChange(key)} className={`px-5 py-2.5 rounded-full text-sm font-black transition-all ${currentView === key ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-100 dark:border-slate-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>
            {/* 💡 딱 이 부분이 '뉴스'로 수정되었습니다! */}
            {key === 'home' ? '홈' : key === 'issue_list' ? '자료실' : key === 'notice' ? '소식' : key === 'news' ? '뉴스' : '체험자원 지도'}
          </button>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <button onClick={toggleTheme} className="p-3 text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-full border border-slate-100 dark:border-slate-700 shadow-sm transition-all">
          {isDarkMode ? <Sun size={20} className="text-amber-400"/> : <Moon size={20}/>}
        </button>
        <button onClick={onMenuClick} className="p-3 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-full border border-slate-100 dark:border-slate-700 shadow-sm transition-all">
          <Menu size={20} />
        </button>
      </div>
    </div>
  </header>
);

export default Navbar;
