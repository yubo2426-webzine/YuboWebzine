import React from 'react';
import { Pencil, Trash2, Plus, RefreshCw, FileText } from 'lucide-react';

export interface Issue {
  id: number;
  vol: string | number;
  title: string;
  date: string;
  description: string;
  cover_color?: string;
  cover_url?: string | null;
  articles?: any[] | null;
  views?: number;
}

// 💡 1. App.tsx가 기대하는 대로, 오직 'issue' 데이터 1개만 전달하도록 타입 수정
interface IssueCardProps {
  issue: Issue;
  onClick: (issue: Issue) => void;
  isAdmin: boolean;
  onDelete: (issue: Issue) => void;
  onAddArticle: (issue: Issue) => void;
  onEdit: (issue: Issue) => void;
  onRegenerateCover: (issue: Issue) => void;
}

const IssueCard: React.FC<IssueCardProps> = ({
  issue,
  onClick,
  isAdmin,
  onDelete,
  onAddArticle,
  onEdit,
  onRegenerateCover
}) => {
  return (
    <div 
      // 💡 2. 카드 전체 클릭 시에도 MouseEvent(e)가 아니라 issue 데이터를 전달!
      onClick={() => onClick(issue)}
      className="group relative bg-white dark:bg-slate-800 rounded-[2rem] overflow-hidden cursor-pointer shadow-sm hover:shadow-[0_20px_60px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)] transition-all duration-500 hover:-translate-y-2 border border-gray-100 dark:border-slate-700 flex flex-col h-full"
    >
      {/* 썸네일 영역 */}
      <div className={`aspect-[4/3] w-full relative overflow-hidden ${issue.cover_url ? 'bg-gray-100 dark:bg-slate-900' : issue.cover_color || 'bg-slate-100'}`}>
         {issue.cover_url ? (
            <img 
              src={issue.cover_url} 
              alt={issue.title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
         ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white/50 group-hover:scale-110 transition-transform duration-500">
               <FileText size={64} className="opacity-50 text-slate-300 dark:text-slate-600" />
            </div>
         )}
         <div className="absolute top-4 left-4">
           <span className="px-4 py-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl text-sm font-black text-slate-800 dark:text-slate-200 shadow-sm">
             Vol. {issue.vol}
           </span>
         </div>
      </div>

      {/* 텍스트 영역 */}
      <div className="p-8 flex-1 flex flex-col">
        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-3 line-clamp-2 leading-tight group-hover:text-emerald-500 transition-colors">
          {issue.title}
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium line-clamp-2 leading-relaxed mb-6 flex-1">
          {issue.description}
        </p>
        
        <div className="flex items-center justify-between text-sm font-bold text-slate-400 dark:text-slate-500 pt-4 border-t border-gray-50 dark:border-slate-700">
          <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">{issue.date}</span>
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
            <FileText size={14} /> {issue.articles ? issue.articles.length : 0}개
          </div>
        </div>
      </div>

      {/* 관리자 도구 */}
      {isAdmin && (
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button 
            // 💡 3. e.stopPropagation()으로 중복 클릭 방지, 올바른 데이터(issue) 전달
            onClick={(e) => { e.stopPropagation(); onRegenerateCover(issue); }} 
            className="p-2.5 bg-amber-500/90 text-white rounded-full hover:bg-amber-600 shadow-lg backdrop-blur-sm"
            title="표지 재생성"
          >
            <RefreshCw size={16} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(issue); }} 
            className="p-2.5 bg-blue-500/90 text-white rounded-full hover:bg-blue-600 shadow-lg backdrop-blur-sm"
            title="수정"
          >
            <Pencil size={16} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onAddArticle(issue); }} 
            className="p-2.5 bg-emerald-500/90 text-white rounded-full hover:bg-emerald-600 shadow-lg backdrop-blur-sm"
            title="자료 추가"
          >
            <Plus size={16} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(issue); }} 
            className="p-2.5 bg-rose-500/90 text-white rounded-full hover:bg-rose-600 shadow-lg backdrop-blur-sm"
            title="삭제"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default IssueCard;
