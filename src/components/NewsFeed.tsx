import React, { useState, useEffect } from 'react';
import { Newspaper, Search, RefreshCw, Loader2, Eye, ArrowUpRight, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

const parseNewsData = (rawTitle: string) => {
  if (!rawTitle) return { title: '제목 없음', publisher: '뉴스' };
  const parts = rawTitle.split(' - ');
  if (parts.length > 1) {
    const publisher = parts.pop()?.trim() || '뉴스';
    let title = parts.join(' - ').trim();
    title = title.replace(/\s*>\s*뉴스$/, '').replace(/\s*\|$/, '').trim();
    return { title, publisher };
  }
  return { title: rawTitle, publisher: '뉴스' };
};

// 💡 타겟 컬럼명(column)을 동적으로 받아서, id 대신 link를 조건으로 쓸 수 있도록 개선
const incrementViewCount = async (table: string, identifier: any, currentViews: number, column: string = 'id') => {
  if (!supabase || !identifier) return; 
  const sessionKey = `viewed_${table}_${identifier}`;
  if (sessionStorage.getItem(sessionKey)) return;
  try { 
    await supabase.from(table).update({ views: (currentViews || 0) + 1 }).eq(column, identifier); 
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

// 💡 id가 선택적(?)으로 들어올 수 있도록 타입 수정
export interface NewsItem {
  id?: number;
  title: string;
  link: string;
  pub_date: string;
  views: number;
}

interface NewsFeedProps {
  limit?: number;
  isAdmin: boolean;
}

const NewsFeed: React.FC<NewsFeedProps> = ({ limit, isAdmin }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const itemsPerPage = limit || 20;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (debouncedKeyword !== searchKeyword) {
        setDebouncedKeyword(searchKeyword);
        setCurrentPage(1); 
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchKeyword, debouncedKeyword]);

  const fetchNews = async () => {
    if(!supabase) return;
    setLoading(true);
    try {
      let query = supabase.from('news').select('*', { count: 'exact' });
      if (debouncedKeyword.trim()) {
        query = query.ilike('title', `%${debouncedKeyword}%`);
      }
      
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      const { data, count } = await query
        .order('pub_date', { ascending: false })
        .range(from, to);

      if (data) {
        setNews(data as NewsItem[]);
        setTotalCount(count || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNews(); }, [currentPage, debouncedKeyword, limit]);

  // 💡 방어 코드를 걷어내고, id가 없으면 무조건 link를 고유 기준으로 쓰도록 변경!
  const handleNewsClick = (item: NewsItem) => {
      const uniqueVal = item.id || item.link;
      const uniqueCol = item.id ? 'id' : 'link';

      if (uniqueVal) {
          incrementViewCount('news', uniqueVal, item.views, uniqueCol);
          setNews(prev => prev.map(n => (n.id || n.link) === uniqueVal ? {...n, views: (n.views || 0) + 1} : n));
      }
      // 새 창 열기는 어떠한 조건에도 막히지 않고 즉시 실행됩니다!
      if (item.link) window.open(item.link, '_blank');
  };

  const handleDelete = async (item: NewsItem) => {
    if(confirm('이 뉴스를 삭제하시겠습니까?')) {
        const uniqueVal = item.id || item.link;
        const uniqueCol = item.id ? 'id' : 'link';
        await supabase!.from('news').delete().eq(uniqueCol, uniqueVal);
        fetchNews(); 
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  if (endPage - startPage < 4) {
     startPage = Math.max(1, endPage - 4);
  }
  const pageNumbers = Array.from({ length: Math.max(0, endPage - startPage + 1) }, (_, i) => startPage + i);

  return (
    <div className={`w-full ${limit ? '' : 'max-w-7xl mx-auto px-4 py-12 md:py-16'}`}>
      {!limit && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
           <div className="flex items-center gap-3 shrink-0">
              <h2 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3"><span className="p-2 bg-rose-100 dark:bg-rose-900/40 rounded-2xl"><Newspaper size={32} className="text-rose-500 dark:text-rose-400"/></span> 뉴스</h2>
           </div>
           <div className="flex items-center gap-2 w-full md:w-auto">
             <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16}/>
                <input
                  type="text"
                  placeholder="뉴스 검색..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full pl-9 pr-4 h-10 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-full text-sm font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all shadow-inner"
                />
             </div>
             <button onClick={() => { setCurrentPage(1); fetchNews(); }} disabled={loading} className="text-sm font-bold text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 h-10 px-4 rounded-full shadow-sm transition-colors disabled:opacity-50 shrink-0">
               <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> <span className="hidden sm:inline">새로고침</span>
             </button>
           </div>
        </div>
      )}

      <div className="flex flex-col gap-4 relative min-h-[400px]">
         {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-[2px] rounded-[2rem]">
               <Loader2 className="animate-spin text-rose-500" size={40} />
            </div>
         )}

         {news.length > 0 ? (
           news.map((item, idx) => {
              const { title: cleanTitle, publisher } = parseNewsData(item.title);
              return (
                <div key={item.id || item.link || idx} onClick={() => handleNewsClick(item)} className="group cursor-pointer flex flex-col md:flex-row gap-4 p-6 bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-100 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-500/50 transition-all relative">
                   <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                         <KRDSBadge variant="primary">{publisher}</KRDSBadge>
                         <span className="text-sm text-slate-400 dark:text-slate-500 font-bold">{new Date(item.pub_date).toLocaleDateString()}</span>
                       </div>
                      <h3 className="font-black text-xl text-slate-800 dark:text-slate-100 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors line-clamp-2 leading-snug">{cleanTitle}</h3>
                      <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 font-bold"><span className="flex items-center gap-1"><Eye size={14}/> 조회 {item.views || 0}</span></div>
                   </div>
                   <div className="flex items-center justify-end gap-2">
                       {!limit && <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center group-hover:bg-rose-50 dark:group-hover:bg-rose-900/40 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors"><ArrowUpRight size={20} className="text-slate-300 dark:text-slate-600 group-hover:text-rose-500 dark:group-hover:text-rose-400"/></div>}
                       {/* 💡 관리자 삭제 버튼도 link 기준으로 처리되도록 item을 통째로 넘겨줍니다. */}
                       {isAdmin && <button onClick={(e) => {e.stopPropagation(); handleDelete(item)}} className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 p-2 bg-white dark:bg-slate-900 rounded-full shadow-sm"><Trash2 size={16}/></button>}
                   </div>
                </div>
              );
           })
         ) : (
           !loading && (
             <div className="py-16 text-center text-slate-400 font-bold bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700">
               검색어 '{searchKeyword}'에 대한 뉴스가 없습니다.
             </div>
           )
         )}
      </div>

      {!limit && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-10 mb-4">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-500 hover:text-rose-500 hover:border-rose-200 dark:hover:border-rose-800 disabled:opacity-40 transition-all shadow-sm">
                <ChevronLeft size={20}/>
            </button>
            {pageNumbers.map(p => (
                <button key={p} onClick={() => setCurrentPage(p)} className={`w-11 h-11 rounded-2xl font-black text-base transition-all shadow-sm ${currentPage === p ? 'bg-rose-500 text-white border-transparent' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-700 hover:text-rose-500'}`}>
                    {p}
                </button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-500 hover:text-rose-500 hover:border-rose-200 dark:hover:border-rose-800 disabled:opacity-40 transition-all shadow-sm">
                <ChevronRight size={20}/>
            </button>
        </div>
      )}
    </div>
  );
};

export default NewsFeed;