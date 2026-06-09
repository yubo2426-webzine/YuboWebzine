import React from 'react';
import { Home, Newspaper, Calendar, Image as ImageIcon, Book } from 'lucide-react';

const BottomNav = ({ currentView, onViewChange }) => {
  // 모바일 하단 5대 핵심 메뉴
  const navItems = [
    { id: 'home', label: '홈', icon: Home },
    { id: 'news', label: '뉴스', icon: Newspaper },
    { id: 'notice', label: '소식', icon: Calendar },
    { id: 'gallery', label: '갤러리', icon: ImageIcon },
    { id: 'issue_list', label: '자료실', icon: Book },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 pb-safe z-[100] md:hidden transition-all duration-300">
      <div className="flex justify-between items-center px-2 h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className="flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 active:scale-95 group"
            >
              <div
                className={`p-1.5 rounded-xl mb-0.5 transition-colors ${
                  isActive ? 'bg-orange-50 text-orange-500' : 'text-gray-400 group-hover:text-gray-600'
                }`}
              >
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span
                className={`text-[10px] font-bold transition-colors ${
                  isActive ? 'text-orange-600' : 'text-gray-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
