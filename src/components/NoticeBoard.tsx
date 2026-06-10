import React, { useState, useEffect } from 'react';
import { Megaphone, Calendar as CalendarIcon, Trash2, ChevronRight, ChevronLeft, Plus, Loader2, ArrowRight, X, User, Eye } from 'lucide-react';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// 💡 App.jsx에 있던 DB 연결과 뱃지, 조회수 증가 함수를 안전하게 모듈 안으로 가져옵니다.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

const incrementViewCount = async (table: string, id: number, currentViews: number) => {
  if (!supabase) return;
  const sessionKey = `viewed_${table}_${id}`;
  if (sessionStorage.getItem(sessionKey)) return;
  try { 
    await supabase.from(table).update({ views: (currentViews || 0) + 1 }).eq('id', id); 
    sessionStorage.setItem(sessionKey, 'true');
  } catch (e) { console.error(e); }
};

const KRDSBadge: React.FC<{ variant?: 'primary' | 'success' | 'warning' | 'neutral', children: React.ReactNode, className?: string }> = ({ variant = 'neutral', children, className }) => {
  const styles = {
    primary: 'bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300 border border-sky-200/50 dark:border-sky-800',
    success: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800',
    warning: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800',
    neutral: 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-300 border border-gray-200/50 dark:border-slate-700',
  };
  return <span className={`inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-[11px] font-black tracking-wide ${styles[variant]} ${className}`}>{children}</span>;
};

// 💡 데이터 타입 정의
export interface Notice {
  id: number;
  title: string;
  content: string;
  category: string;
  event_date?: string;
  created_at: string;
  views: number;
}

interface NoticeBoardProps {
  userRole: string;
  onWriteClick: (type: string) => void;
  initialMode?: boolean;
}

const NoticeBoard: React.FC<NoticeBoardProps> = ({ userRole, onWriteClick, initialMode }) => {
  const [filter, setFilter] = useState('all');
  const [notices, setNotices] = useState<Notice[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const itemsPerPage = 10;

  const fetchNotices = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      let query = supabase.from('notices').select('*', { count: 'exact' });
      if (filter === 'notice') query = query.neq('category', 'event');
      if (filter === 'event') query = query.eq('category', 'event');
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      const { data, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);
      if (data) {
        setNotices(data as Notice[]);
        setTotalCount(count || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setCurrentPage(1); }, [filter]);
  useEffect(() => { fetchNotices(); }, [currentPage, filter]);

  const handleDelete = async (id: number) => {
    if(confirm('삭제하시겠습니까?')) {
        await supabase!.from('notices').delete().eq('id', id);
        fetchNotices();
        setSelectedNotice(null);
    }
  };

  const handleNoticeClick = (item: Notice) => {
      incrementViewCount('notices', item.id, item.views);
      const updated = { ...item, views: (item.views || 0) + 1 };
      setNotices(prev => prev.map(n => n.id === item.id ? updated : n));
      setSelectedNotice(updated);
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);
  const pageNumbers = Array.from({ length: Math.max(0, endPage - startPage + 1) }, (_, i) => startPage + i);

  return (
    <div className={`w-full ${initialMode ? '' : 'max-w-7xl mx-auto px-4 py-12 md:py-16'}`}>
      {!initialMode && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
           <h2 className="text-3xl font-black flex items-center gap-3 text-slate-800 dark:text-white"><span className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-2xl"><Megaphone className="text-amber-500 dark:text-amber-400" size={32}/></span> 소식</h2>
           <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <div className="bg-white dark:bg-slate-800 shadow-sm p-1.5 rounded-2xl flex border border-slate-100 dark:border-slate-700">
                  {['all', 'notice', 'event'].map(f => (
                      <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 text-sm font-black rounded-xl transition-all ${filter === f ? 'bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>{f === 'all' ? '전체' : f === 'notice' ? '공지' : '행사'}</button>
                  ))}
              </div>
              {userRole === 'admin' && <button onClick={() => onWriteClick('notice')} className="bg-amber-500 dark:bg-amber-600 text-white px-5 py-2 rounded-2xl text-sm font-black shadow-md hover:bg-amber-600 dark:hover:bg-amber-500 flex gap-2 items-center"><Plus size={18}/> 새 소식 작성</button>}
           </div>
        </div>
      )}
      
      <div className="flex flex-col gap-4 relative min-h-[300px]">
         {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-[2px] rounded-[2rem]">
               <Loader2 className="animate-spin text-amber-500" size={40} />
            </div>
         )}
      
         {notices.map(n => (
            <div key={n.id} onClick={() => handleNoticeClick(n)} className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-700 hover:border-amber-200 dark:hover:border-amber-500/50 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all relative group cursor-pointer flex flex-col md:flex-row gap-4 md:items-center justify-between">
               <div className="flex-1">
                 <div className="flex items-center gap-3 mb-3">
                    <KRDSBadge variant={n.category === 'event' ? 'warning' : 'neutral'}>{n.category === 'event' ? '행사안내' : '일반공지'}</KRDSBadge>
                    <span className="text-sm font-bold text-slate-400 dark:text-slate-500">{new Date(n.created_at).toLocaleDateString()}</span>
                 </div>
                 <h3 className="text-xl font-black mb-2 line-clamp-1 text-slate-800 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{n.title}</h3>
                 <p className="text-base font-medium text-slate-500 dark:text-slate-400 line-clamp-1">{n.content}</p>
                 {n.event_date && <div className="mt-4 inline-flex items-center gap-2 text-sm font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-4 py-2 rounded-xl border border-amber-100/50 dark:border-amber-800/50"><CalendarIcon size={18}/> 행사일: {n.event_date}</div>}
               </div>
               <div className="hidden md:flex w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-900 items-center justify-center group-hover:bg-amber-50 dark:group-hover:bg-amber-900/40 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors shrink-0">
                  <ArrowRight size={20} className="text-slate-300 dark:text-slate-600 group-hover:text-amber-500 dark:group-hover:text-amber-400"/>
               </div>
            </div>
         ))}
         {!loading && notices.length === 0 && <div className="py-16 text-center text-slate-400 font-bold bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700">등록된 소식이 없습니다.</div>}
      </div>

      {!initialMode && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-10 mb-4">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-500 hover:text-amber-500 hover:border-amber-200 dark:hover:border-amber-800 disabled:opacity-40 transition-all shadow-sm">
                <ChevronLeft size={20}/>
            </button>
            {pageNumbers.map(p => (
                <button key={p} onClick={() => setCurrentPage(p)} className={`w-11 h-11 rounded-2xl font-black text-base transition-all shadow-sm ${currentPage === p ? 'bg-amber-500 text-white border-transparent' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700 hover:text-amber-500'}`}>
                    {p}
                </button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-500 hover:text-amber-500 hover:border-amber-200 dark:hover:border-amber-800 disabled:opacity-40 transition-all shadow-sm">
                <ChevronRight size={20}/>
            </button>
        </div>
      )}

      {selectedNotice && (
        <div className="fixed inset-0 bg-slate-900/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedNotice(null)}>
           <div className="bg-white dark:bg-slate-800 rounded-[2rem] w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.2)] flex flex-col relative border border-slate-100 dark:border-slate-700" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-8 py-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-start z-10">
                 <div>
                    <div className="flex items-center gap-3 mb-3">
                       <KRDSBadge variant={selectedNotice.category === 'event' ? 'warning' : 'neutral'}>{selectedNotice.category === 'event' ? '행사' : '공지'}</KRDSBadge>
                       <span className="text-sm font-bold text-slate-400 dark:text-slate-500">{new Date(selectedNotice.created_at).toLocaleDateString()}</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-snug">{selectedNotice.title}</h2>
                 </div>
                 <button onClick={() => setSelectedNotice(null)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"><X size={20} className="text-slate-600 dark:text-slate-300"/></button>
              </div>
              <div className="p-8">
                 {selectedNotice.event_date && (
                    <div className="mb-8 p-5 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center gap-4 border border-amber-100 dark:border-amber-800/50">
                       <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm"><CalendarIcon className="text-amber-500 dark:text-amber-400" size={24}/></div>
                       <div><div className="text-sm font-black text-amber-600 dark:text-amber-500 mb-1">예정된 행사일</div><div className="text-lg font-black text-slate-800 dark:text-white">{selectedNotice.event_date}</div></div>
                    </div>
                 )}
                 <p className="text-lg leading-relaxed whitespace-pre-wrap text-slate-700 dark:text-slate-300 font-medium">{selectedNotice.content}</p>
              </div>
              <div className="px-8 py-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-sm">
                 <div className="flex items-center gap-4 font-bold text-slate-400 dark:text-slate-500">
                     <span className="flex items-center gap-1.5"><User size={16}/> 관리자</span>
                     <span className="flex items-center gap-1.5"><Eye size={16}/> 조회수 {selectedNotice.views || 0}</span>
                 </div>
                 {userRole === 'admin' && (
                    <button onClick={() => handleDelete(selectedNotice.id)} className="text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 font-black flex items-center gap-1 bg-white dark:bg-slate-800 border dark:border-slate-700 px-4 py-2 rounded-xl shadow-sm"><Trash2 size={16}/> 삭제</button>
                 )}
               </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default NoticeBoard;