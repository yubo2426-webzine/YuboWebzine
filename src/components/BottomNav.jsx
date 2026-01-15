import React from 'react';
import { Home, Newspaper, BookOpen, Menu } from 'lucide-react';

const BottomNav = ({ currentView, onViewChange, onMenuClick }) => {
  // 탭 버튼의 스타일을 결정하는 함수 (활성화되면 주황색, 아니면 회색)
  const getItemClass = (viewName) => 
    `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${
      currentView === viewName 
        ? 'text-orange-500' 
        : 'text-gray-400 hover:text-gray-600'
    }`;

  // 아이콘 두께 조절 (선택된 탭은 좀 더 두껍게)
  const getStrokeWidth = (viewName) => (currentView === viewName ? 2.5 : 2);

  return (
    <div className="fixed bottom-0 left-0 z-[150] w-full h-16 bg-white border-t border-gray-100 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] md:hidden safe-area-pb">
      <div className="grid grid-cols-4 h-full max-w-md mx-auto">
        
        {/* 1. 홈 탭 */}
        <button 
          onClick={() => onViewChange('home')} 
          className={getItemClass('home')}
        >
          <Home size={24} strokeWidth={getStrokeWidth('home')} />
          <span className="text-[10px] font-bold">홈</span>
        </button>

        {/* 2. 뉴스 탭 */}
        <button 
          onClick={() => onViewChange('news')} 
          className={getItemClass('news')}
        >
          <Newspaper size={24} strokeWidth={getStrokeWidth('news')} />
          <span className="text-[10px] font-bold">뉴스</span>
        </button>

        {/* 3. 자료실 탭 (이슈/기사 뷰일 때도 불 켜짐) */}
        <button 
          onClick={() => onViewChange('issue_list')} 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${
            ['issue', 'article'].includes(currentView) ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <BookOpen size={24} strokeWidth={['issue', 'article'].includes(currentView) ? 2.5 : 2} />
          <span className="text-[10px] font-bold">자료실</span>
        </button>

        {/* 4. 메뉴(로그인) 탭 */}
        <button 
          onClick={onMenuClick} 
          className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-400 hover:text-gray-600"
        >
          <Menu size={24} strokeWidth={2} />
          <span className="text-[10px] font-bold">메뉴</span>
        </button>

      </div>
    </div>
  );
};

export default BottomNav;
