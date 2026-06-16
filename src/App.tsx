import React, { useState, useEffect } from 'react';
import { 
  Book, ChevronRight, X, Newspaper, Calendar as CalendarIcon, 
  MapPin, RefreshCw, ArrowUpRight, Loader2, Home, Search, 
  Eye, Map as MapIcon, Phone, CheckCircle2, Sparkles, LayoutGrid,
  Compass, Wind, Sprout, Flower2, Heart, Rabbit, Plus,
  ArrowDown, ArrowUp
} from 'lucide-react';

import UniversalUploadModal from './components/UniversalUploadModal';
import IssueCard from './components/IssueCard';
import NoticeBoard from './components/NoticeBoard';
import NewsFeed from './components/NewsFeed';
import CustomPDFViewer from './components/CustomPDFViewer';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ResourceMap from './components/ResourceMap';

import { supabase } from './lib/supabase';

const globalStyles = `
  @keyframes float-rotate {
    0% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(8deg); }
    100% { transform: translateY(0px) rotate(0deg); }
  }
  .animate-float {
    animation: float-rotate 6s ease-in-out infinite;
  }
`;

interface KRDSBadgeProps {
  variant?: 'primary' | 'success' | 'warning' | 'neutral';
  children: React.ReactNode;
  className?: string;
}

const KRDSBadge: React.FC<KRDSBadgeProps> = ({ variant = 'neutral', children, className = '' }) => {
  const styles = {
    primary: 'bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300 border border-sky-200/50 dark:border-sky-800',
    success: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800',
    warning: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800',
    neutral: 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-300 border border-gray-200/50 dark:border-slate-700',
  };
  return <span className={`inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-[11px] font-black tracking-wide ${styles[variant]} ${className}`}>{children}</span>;
};

const getValidSupabaseUrl = (url: string) => {
  const currentSupabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  if (!url || !currentSupabaseUrl) return url;
  const marker = '/storage/v1/object/public/';
  if (url.includes(marker)) {
    const filePath = url.substring(url.indexOf(marker) + marker.length);
    const cleanBaseUrl = currentSupabaseUrl.endsWith('/') ? currentSupabaseUrl.slice(0, -1) : currentSupabaseUrl;
    return `${cleanBaseUrl}${marker}${filePath}`; 
  }
  return url;
};

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

const incrementViewCount = async (table: string, id: any, currentViews: number) => {
  if (!supabase) return;
  const sessionKey = `viewed_${table}_${id}`;
  if (sessionStorage.getItem(sessionKey)) return;
  try { 
    await supabase.from(table).update({ views: (currentViews || 0) + 1 }).eq('id', id); 
    sessionStorage.setItem(sessionKey, 'true');
  } catch (e) { console.error(e); }
};

const useHistoryState = (initialState: string): [string, (newState: string) => void] => {
  const [state, setState] = useState<string>(initialState);
  useEffect(() => {
    window.history.replaceState({ view: initialState }, '');
    const handlePopState = (event: PopStateEvent) => { if (event.state && event.state.view) setState(event.state.view); };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [initialState]);
  const setHistoryState = (newState: string) => {
    if (newState !== state) { 
      window.history.pushState({ view: newState }, '', `?view=${newState}`);
      setState(newState); 
    }
  };
  return [state, setHistoryState];
};

const loadPdfScript = (): Promise<any> => {
  return new Promise((resolve) => {
    if ((window as any).pdfjsLib) { resolve((window as any).pdfjsLib); return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => { (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; resolve((window as any).pdfjsLib); };
    document.head.appendChild(script);
  });
};

const extractPdfCover = async (fileOrBlob: File | Blob): Promise<Blob | null> => {
  return new Promise(async (resolve) => {
    try {
      await loadPdfScript();
      (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

      const fileReader = new FileReader();
      fileReader.onload = async function() {
        let pdf: any = null;
        try {
          const typedarray = new Uint8Array(this.result as ArrayBuffer);
          const loadingTask = (window as any).pdfjsLib.getDocument({ data: typedarray, disableAutoFetch: true });
    
          pdf = await loadingTask.promise;
          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: 0.6 });

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

          const isSpread = viewport.width > viewport.height * 1.2;
          let finalCanvas = canvas;
          if (isSpread) {
            const halfWidth = canvas.width / 2;
            const fullHeight = canvas.height;
            finalCanvas = document.createElement('canvas');
            finalCanvas.width = halfWidth;
            finalCanvas.height = fullHeight;
            finalCanvas.getContext('2d')?.drawImage(canvas, halfWidth, 0, halfWidth, fullHeight, 0, 0, halfWidth, fullHeight);
          }

          finalCanvas.toBlob(async (blob) => {
            if (pdf) await pdf.destroy();
            resolve(blob);
          }, 'image/jpeg', 0.85);
        } catch(e) {
            console.error(e);
            if (pdf) await pdf.destroy();
            resolve(null);
        }
      };
      fileReader.readAsArrayBuffer(fileOrBlob);
    } catch (error) {
      console.error("표지 추출 에러:", error);
      resolve(null);
    }
  });
};

const RESOURCE_TYPES = ['놀이·생활', '건강·안전', '창의·융합', '역사·문화', '자연·환경', '인문·독서'];

const MainApp = () => {
  const [role, setRole] = useState<string>(() => typeof window !== 'undefined' ? sessionStorage.getItem('userRole') || 'guest' : 'guest');
  const [view, setView] = useHistoryState('home');
  const [issues, setIssues] = useState<any[]>([]);
  
  const [sortOption, setSortOption] = useState<string>('date_order');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');

  const [currentIssue, setCurrentIssue] = useState<any>(null);
  const [currentArticle, setCurrentArticle] = useState<any>(null);
  const [recentNotices, setRecentNotices] = useState<any[]>([]);
  const [recentNews, setRecentNews] = useState<any[]>([]);
  
  const [activeHomeTab, setActiveHomeTab] = useState<string>('news'); 

  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [uploadType, setUploadType] = useState<string>('notice');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isMigrating, setIsMigrating] = useState<boolean>(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState<boolean>(false);
  
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('전체');
  const [selectedType, setSelectedType] = useState<string>('전체');
  
  const [recentTags, setRecentTags] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('recentTags');
      if (saved) return JSON.parse(saved);
    }
    return ['전주시', '익산시', '군산시', '정읍시', '남원시'];
  });
  
  const jeonbukRegions = ['전주시', '익산시', '군산시', '정읍시', '남원시', '김제시', '완주군', '진안군', '무주군', '장수군', '임실군', '순창군', '고창군', '부안군'];
  
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      return savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    document.title = '함께누리웹진';
  }, []);

  useEffect(() => {
    if (isDarkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); } 
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  useEffect(() => {
    const fetchData = async () => {
      if(!supabase) return;
      const resIssues = await supabase.from('issues').select('*');
      if (resIssues.data) {
        const sortedByDate = resIssues.data.sort((a, b) => Number(b.vol || b.id || 0) - Number(a.vol || a.id || 0));
        setIssues(sortedByDate);
      }
      
      const resNotices = await supabase.from('notices').select('*').order('created_at', { ascending: false }).limit(4);
      if(resNotices.data) setRecentNotices(resNotices.data);

      const resNews = await supabase.from('news').select('*').order('pub_date', { ascending: false }).limit(4);
      if(resNews.data) setRecentNews(resNews.data);
    };
    fetchData();
  }, []);

  const handleSearchSubmit = () => {
    if (selectedRegion !== '전체') {
      setRecentTags(prev => {
        const newTags = [selectedRegion, ...prev.filter(t => t !== selectedRegion)].slice(0, 5);
        localStorage.setItem('recentTags', JSON.stringify(newTags));
        return newTags;
      });
    }
    setView('resource_map');
  };

  const openArticleUploadForIssue = (issue: any) => {
     setCurrentIssue(issue);
     setUploadType('article');
     setIsUploadOpen(true);
  };

  const handleUpload = async (data: any) => {
    if (data.type === 'article' && data.file) {
      const maxSize = 50 * 1024 * 1024;
      if (data.file.size > maxSize) {
        alert("⚠️ 파일 크기가 너무 큽니다. 50MB 이하로 업로드해주세요.");
        return; 
      }
    }

    setIsUploading(true);
    try {
       if (data.type === 'notice') {
           const { error } = await supabase!.from('notices').insert([{ title: data.title, content: data.content, event_date: data.event_date || null, category: data.event_date ? 'event' : 'notice' }]);
           if (error) throw new Error(`공지 등록 실패: ${error.message}`);
       }
       else if (data.type === 'issue') {
           const { error } = await supabase!.from('issues').insert([{ vol: data.vol, title: data.title, description: data.description, date: new Date().toLocaleDateString(), cover_color: 'bg-teal-100', icon: '📘' }]);
           if (error) throw new Error(`호수 발행 실패: ${error.message}`);
       }
       else if (data.type === 'article' && currentIssue) { 
           let fileUrl = '';
           let coverUrl = currentIssue.cover_url || currentIssue.coverUrl || null; 

           if (data.file) { 
               const timestamp = Date.now();
               const fn = `${timestamp}.pdf`;
               
               const { error: uploadError } = await supabase!.storage.from('files').upload(fn, data.file);
               if (uploadError) throw new Error(`PDF 저장소 업로드 실패: ${uploadError.message}`);

               fileUrl = supabase!.storage.from('files').getPublicUrl(fn).data.publicUrl; 

               const coverBlob = await extractPdfCover(data.file);
               if (coverBlob) {
                   const coverFn = `cover_${timestamp}.jpg`;
                   const { error: coverError } = await supabase!.storage.from('files').upload(coverFn, coverBlob, { contentType: 'image/jpeg', upsert: true });
                   if (coverError) throw new Error(`표지 이미지 업로드 실패: ${coverError.message}`);
                   
                   coverUrl = supabase!.storage.from('files').getPublicUrl(coverFn).data.publicUrl;
               }
           } 

           const updatedArticles = [{ id: Date.now(), title: currentIssue.title, fileUrl, views: 0 }];
           const { error: dbError } = await supabase!.from('issues').update({ articles: updatedArticles, cover_url: coverUrl }).eq('id', currentIssue.id);
           if (dbError) throw new Error(`DB 업데이트 실패: ${dbError.message}`);

           const updatedIssue = {...currentIssue, articles: updatedArticles, cover_url: coverUrl};
           setCurrentIssue(updatedIssue);
           setIssues(prev => prev.map(i => i.id === currentIssue.id ? updatedIssue : i));
       }
       
       alert("등록 완료되었습니다!"); 
       setIsUploadOpen(false);
       if (data.type !== 'article') window.location.reload();
       
    } catch (e: any) { 
       console.error("업로드 에러 상세:", e);
       alert("오류: " + e.message); 
    } finally { 
       setIsUploading(false); 
    }
  };

  const handleFixDatabaseUrls = async () => {
    if (!confirm("DB의 모든 예전 주소를 새 주소로 영구 변환하시겠습니까?")) return;
    setIsMigrating(true);

    try {
      const { data: allIssues } = await supabase!.from('issues').select('*');
      let updatedCount = 0;
      if (allIssues) {
        for (const issue of allIssues) {
          let isModified = false;
          let newCoverUrl = issue.cover_url || issue.coverUrl;
          let newArticles = issue.articles ? [...issue.articles] : [];
          if (newCoverUrl && newCoverUrl.includes('/storage/v1/object/public/')) {
            const expectedUrl = getValidSupabaseUrl(newCoverUrl);
            if (newCoverUrl !== expectedUrl) {
              newCoverUrl = expectedUrl;
              isModified = true;
            }
          }

          if (newArticles.length > 0) {
            newArticles = newArticles.map(art => {
              const oldUrl = art.fileUrl || art.file_url;
              if (oldUrl && oldUrl.includes('/storage/v1/object/public/')) {
                const expectedUrl = getValidSupabaseUrl(oldUrl);
                if (oldUrl !== expectedUrl) {
                  isModified = true;
                  return { ...art, fileUrl: expectedUrl, file_url: expectedUrl };
                }
              }
              return art;
            });
          }

          if (isModified) {
            await supabase!.from('issues').update({
              cover_url: newCoverUrl,
              articles: newArticles
            }).eq('id', issue.id);
            updatedCount++;
          }
        }
      }

      alert(`🎉 총 ${updatedCount}개의 게시물 DB 주소가 영구적으로 수정되었습니다!`);
      window.location.reload();
    } catch (error) {
      console.error("DB 업데이트 실패:", error);
      alert("업데이트 중 오류가 발생했습니다.");
    } finally {
      setIsMigrating(false);
    }
  };

  const handleDeleteIssue = async (issue: any) => {
    if (confirm(`'Vol.${issue.vol}'호를 삭제하시겠습니까? 관련 PDF 및 표지 파일도 모두 삭제됩니다.`)) {
      try {
        const filesToRemove: string[] = [];
        if (issue.articles && issue.articles.length > 0) {
          issue.articles.forEach((art: any) => {
            const fileUrl = art.fileUrl || art.file_url;
            if (fileUrl) filesToRemove.push(fileUrl.split('/').pop());
          });
        }
        
        const coverUrl = issue.cover_url || issue.coverUrl;
        if (coverUrl) {
          filesToRemove.push(coverUrl.split('/').pop());
        }

        if (filesToRemove.length > 0) {
          await supabase!.storage.from('files').remove(filesToRemove);
        }

        await supabase!.from('issues').delete().eq('id', issue.id);
        
        alert('파일과 게시물이 모두 안전하게 삭제되었습니다.');
        window.location.reload();
      } catch (e) {
        console.error("삭제 중 오류:", e);
        alert("삭제 처리에 실패했습니다.");
      }
    }
  };
  
  const handleEditIssue = async (issue: any) => {
    const newTitle = prompt(`'${issue.vol}호'의 새로운 제목을 입력하세요:`, issue.title);
    if (newTitle && newTitle.trim() !== "" && newTitle !== issue.title) {
        try {
            await supabase!.from('issues').update({ title: newTitle.trim() }).eq('id', issue.id);
            setIssues(prev => prev.map(i => i.id === issue.id ? { ...i, title: newTitle.trim() } : i));
        } catch(e: any) {
            alert("제목 수정 중 오류가 발생했습니다: " + e.message);
        }
    }
  };

  const handleIssueClick = (issue: any) => { 
    incrementViewCount('issues', issue.id, issue.views);
    const updatedIssue = { ...issue, views: (issue.views || 0) + 1 };
    setIssues(prev => prev.map(i => i.id === issue.id ? updatedIssue : i)); 
    setCurrentIssue(updatedIssue);
    if (updatedIssue.articles && updatedIssue.articles.length > 0) {
      setCurrentArticle(updatedIssue.articles[0]);
      setView('article_view');
    } else {
      alert("등록된 PDF 자료가 없습니다. (관리자 모드에서 + 버튼을 눌러 PDF 추가)");
    }
  };

  return (
    <>
    <style>{globalStyles}</style>
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-100 transition-colors">
       
       {isSideMenuOpen && (
         <div className="fixed inset-0 z-[100] flex justify-end">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsSideMenuOpen(false)} />
           <div className="relative w-[320px] h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col rounded-l-[2.5rem] overflow-hidden border-l border-white/10">
             <div className="flex items-center justify-between p-8 border-b border-slate-50 dark:border-slate-800 relative">
                <div className="absolute top-2 right-10 text-emerald-200 dark:text-emerald-900/50 opacity-60"><Flower2 size={24}/></div>
                <span className="font-black text-2xl flex items-center gap-2 relative z-10 dark:text-white"><LayoutGrid className="text-emerald-500"/> 전체 메뉴</span>
                <button onClick={() => setIsSideMenuOpen(false)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 relative z-10"><X size={20} className="dark:text-slate-300" /></button>
             </div>
             <nav className="flex-1 overflow-y-auto p-6">
               <ul className="flex flex-col gap-3">
                 {[
                   { id: 'home', icon: <Home size={24} className="text-sky-500 dark:text-sky-400" />, label: '홈' },
                   { id: 'resource_map', icon: <MapIcon size={24} className="text-emerald-500 dark:text-emerald-400" />, label: '체험자원 지도' },
                   { id: 'issue_list', icon: <Book size={24} className="text-teal-500 dark:text-teal-400"/>, label: '자료실' },
                   { id: 'notice', icon: <CalendarIcon size={24} className="text-amber-500 dark:text-amber-400"/>, label: '소식' },
                   { id: 'news', icon: <Newspaper size={24} className="text-rose-500 dark:text-rose-400"/>, label: '뉴스' }
                 ].map((item) => (
                   <li key={item.id}>
                     <button onClick={() => { setView(item.id); setIsSideMenuOpen(false); }} className="w-full flex items-center justify-between p-5 rounded-3xl hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-all text-left font-black text-lg text-slate-700 dark:text-slate-200">
                       <div className="flex items-center gap-4 bg-white dark:bg-slate-950 shadow-sm dark:shadow-none p-3 rounded-2xl border dark:border-slate-800">{item.icon} {item.label}</div>
                     </button>
                   </li>
                 ))}
               </ul>
             </nav>
           </div>
         </div>
       )}

       <Navbar onHomeClick={() => setView('home')} onViewChange={setView} currentView={view} onMenuClick={() => setIsSideMenuOpen(true)} isDarkMode={isDarkMode} toggleTheme={toggleTheme} role={role}/>
       
       <main className="flex-1 w-full pb-24">
          
          {view === 'home' && (
            <div className="w-full animate-in fade-in">
               <section className="relative w-full py-28 bg-gradient-to-br from-[#e0f2fe] via-[#ecfdf5] to-[#f0f9ff] dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 flex flex-col items-center justify-center px-4 overflow-hidden relative transition-colors">
                 
                 <div className="z-10 relative flex flex-col items-center text-center w-full max-w-4xl mt-10 lg:mt-0 relative pb-16">
                   <div className="absolute top-0 right-1/4 text-sky-300 dark:text-sky-900/50 opacity-60 z-0 animate-pulse"><Sprout size={56}/></div>
                   <div className="absolute bottom-5 left-1/4 text-emerald-300 dark:text-emerald-900/50 opacity-60 z-0 animate-bounce"><Rabbit size={72} strokeWidth={1}/></div>

                   <span className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm text-emerald-600 dark:text-emerald-400 font-black px-6 py-2.5 rounded-full text-sm shadow-sm mb-8 inline-flex items-center gap-2 border border-white dark:border-slate-700"><Sparkles size={18}/> 우리 아이들의 행복한 체험활동</span>
                   <h2 className="text-5xl md:text-6xl font-black text-emerald-600 dark:text-emerald-400 leading-[1.3] mb-10 tracking-tight">함께누리웹진</h2>
                   
                   <div className="w-full max-w-2xl relative shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[2.5rem] mb-8 z-20 bg-white dark:bg-slate-800 border border-white/50 dark:border-slate-700 flex flex-col overflow-hidden">
                     <div className="flex border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                        <select value={selectedRegion} onChange={(e)=>setSelectedRegion(e.target.value)} className="flex-1 h-14 bg-transparent px-6 font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer appearance-none text-center border-r border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                           <option value="전체">= 지역 전체 =</option>
                           {jeonbukRegions.map(reg => <option key={reg} value={reg}>{reg}</option>)}
                        </select>
                        <select value={selectedType} onChange={(e)=>setSelectedType(e.target.value)} className="flex-1 h-14 bg-transparent px-6 font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer appearance-none text-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                           <option value="전체">= 자원형태 전체 =</option>
                           {RESOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                     </div>
                     <div className="relative">
                        <input 
                          type="text" placeholder="검색어를 입력해주세요." 
                          className="w-full h-20 pl-8 pr-24 text-lg font-black text-slate-800 dark:text-white bg-transparent focus:outline-none shadow-inner"
                          value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') handleSearchSubmit(); }}
                        />
                        <button onClick={handleSearchSubmit} className="absolute right-3 top-3 bottom-3 w-14 md:w-16 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-md">
                          <Compass size={28} strokeWidth={2.5}/>
                        </button>
                     </div>
                   </div>

                   <div className="flex gap-2.5 justify-center flex-wrap relative z-20 max-w-2xl">
                     {recentTags.map(tag => (
                        <button key={tag} onClick={() => { setSelectedRegion(tag); handleSearchSubmit(); }} className="px-5 py-2 bg-white/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-full shadow-sm text-[13px] transition-all border border-white dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400">#{tag}</button>
                     ))}
                   </div>
                 </div>
                 
                 <div className="absolute right-[5%] bottom-[10%] opacity-20 dark:opacity-10 select-none pointer-events-none animate-float">
                    <Compass size={380} className="text-sky-600 dark:text-sky-400" strokeWidth={1} />
                 </div>
                 <div className="absolute left-[5%] top-[15%] opacity-10 dark:opacity-5 select-none pointer-events-none transform -rotate-12">
                    <Wind size={250} className="text-emerald-500 dark:text-emerald-400" strokeWidth={1} />
                 </div>
               </section>

               <section className="max-w-6xl mx-auto px-4 -mt-16 relative z-20 mb-28">
                 <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.08)] py-10 px-8 flex justify-around items-center gap-4 border border-slate-50/50 dark:border-slate-700">
                   {[
                      { id: 'map', title: '체험자원 지도', icon: <MapPin size={36}/>, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 group-hover:bg-emerald-500 dark:group-hover:bg-emerald-500 group-hover:text-white', decorators: [<Flower2 key="f1" size={20} className="text-emerald-300 dark:text-emerald-500/50 absolute -top-1 -right-1"/>, <Heart key="h1" size={12} className="text-emerald-200 dark:text-emerald-500/50 absolute bottom-1 -left-1"/>] },
                      { id: 'issue_list', title: '자료실', icon: <Book size={36}/>, color: 'text-teal-500 bg-teal-50 dark:bg-teal-900/30 dark:text-teal-400 group-hover:bg-teal-500 dark:group-hover:bg-teal-500 group-hover:text-white' },
                      { id: 'notice', title: '소식', icon: <CalendarIcon size={36}/>, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 group-hover:bg-amber-500 dark:group-hover:bg-amber-500 group-hover:text-white', decorators: [<Sprout key="s1" size={20} className="text-amber-300 dark:text-amber-500/50 absolute -top-1 -left-1"/>, <Flower2 key="f2" size={12} className="text-amber-200 dark:text-amber-500/50 absolute bottom-1 -right-1"/>] },
                      { id: 'news', title: '뉴스', icon: <Newspaper size={36}/>, color: 'text-rose-500 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-400 group-hover:bg-rose-500 dark:group-hover:bg-rose-500 group-hover:text-white' }
                   ].map(menu => (
                      <div key={menu.id} onClick={() => setView(menu.id === 'map' ? 'resource_map' : menu.id)} className="flex flex-col items-center gap-4 cursor-pointer group relative">
                         <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center transition-all shadow-inner group-hover:shadow-[0_15px_30px_rgba(0,0,0,0.1)] group-hover:-translate-y-2 relative border border-transparent dark:border-slate-700 group-hover:border-transparent ${menu.color}`}>{menu.icon}{menu.decorators}</div>
                         <span className="font-black text-slate-700 dark:text-slate-300 text-base md:text-lg">{menu.title}</span>
                      </div>
                   ))}
                 </div>
               </section>

               <section className="max-w-7xl mx-auto px-4 pb-28">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                   
                   <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-6 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.04)] border border-slate-100 dark:border-slate-700 relative overflow-hidden flex flex-col h-full min-h-[380px]">
                      <div className="absolute top-10 right-10 text-sky-100 dark:text-sky-900/30 opacity-60 z-0"><Flower2 size={64}/></div>
                      <div className="absolute bottom-10 left-10 text-emerald-100 dark:text-emerald-900/30 opacity-60 z-0 animate-pulse"><Sprout size={64}/></div>

                      <div className="flex justify-between items-center mb-6 md:mb-8 border-b border-slate-800 dark:border-slate-600 pb-4 md:pb-6 relative z-10 shrink-0">
                         <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 dark:text-white flex items-center gap-3 md:gap-4 tracking-tight">최신 자료실 <Flower2 className="text-sky-500 dark:text-sky-400 w-7 h-7 md:w-9 md:h-9" strokeWidth={2}/></h3>
                         <button onClick={() => setView('issue_list')} className="text-sm md:text-base font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 flex items-center gap-1 md:gap-2 group">더보기 <ChevronRight size={20} className="text-teal-400 group-hover:translate-x-1.5 transition-transform"/></button>
                      </div>
                      <div className="grid grid-cols-2 gap-4 md:gap-8 pt-2 relative z-10 flex-1">
                        {issues.slice(0, 2).map(issue => (
                           <IssueCard key={issue.id} issue={issue} onClick={handleIssueClick} isAdmin={role === 'admin'} onDelete={handleDeleteIssue} onAddArticle={openArticleUploadForIssue} onEdit={handleEditIssue} />
                        ))}
                      </div>
                   </div>

                   <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-6 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.04)] border border-slate-100 dark:border-slate-700 relative overflow-hidden flex flex-col min-h-[380px]">
                      <div className="absolute -top-4 -left-4 text-indigo-100 dark:text-indigo-900/30 opacity-60 z-0"><Rabbit size={80} strokeWidth={1}/></div>

                      <div className="flex justify-between items-center mb-6 md:mb-8 border-b border-slate-800 dark:border-slate-600 pb-4 md:pb-6 relative z-10">
                         <div className="flex gap-2 p-1.5 bg-slate-50 dark:bg-slate-900 rounded-full border border-slate-100 dark:border-slate-700 shadow-inner">
                            <button onClick={() => setActiveHomeTab('notice')} className={`px-4 sm:px-5 md:px-7 py-2 md:py-2.5 rounded-full text-sm sm:text-base md:text-lg font-black transition-all ${activeHomeTab === 'notice' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'}`}>최근 소식</button>
                            <button onClick={() => setActiveHomeTab('news')} className={`px-4 sm:px-5 md:px-7 py-2 md:py-2.5 rounded-full text-sm sm:text-base md:text-lg font-black transition-all ${activeHomeTab === 'news' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'}`}>최근 뉴스</button>
                         </div>
                         <button onClick={() => setView(activeHomeTab === 'notice' ? 'notice' : 'news')} className="text-sm md:text-base font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 group shrink-0">더보기 <ChevronRight size={18} className="text-indigo-400 group-hover:translate-x-1.5 transition-transform"/></button>
                      </div>

                      <div className="flex flex-col relative z-10 pl-1 md:pl-2">
                        {activeHomeTab === 'notice' && recentNotices.map(n => (
                           <div key={n.id} onClick={() => {setView('notice');}} className="py-4 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer flex items-center justify-between group px-2">
                              <div className="flex items-center gap-3 md:gap-5 w-full">
                                 <span className={`text-[11px] md:text-[13px] font-black px-3 md:px-4 py-1.5 rounded-full border shrink-0 ${n.category === 'event' ? 'bg-amber-100 text-amber-600 border-amber-200/50 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800' : 'bg-gray-100 text-gray-500 border-gray-200/50 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'}`}>{n.category === 'event' ? '행사' : '공지'}</span>
                                 <span className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-1 text-base md:text-lg flex-1 tracking-tight">{n.title}</span>
                                 <span className="text-xs md:text-sm font-bold text-slate-400 dark:text-slate-500 hidden sm:block shrink-0">{new Date(n.created_at).toLocaleDateString()}</span>
                              </div>
                           </div>
                        ))}
                        {activeHomeTab === 'news' && recentNews.map(n => {
                           const { title: cleanTitle } = parseNewsData(n.title);
                           return (
                             <div key={n.id} onClick={() => { if (n.link) window.open(n.link, '_blank'); }} className="py-4 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer flex items-center justify-between group px-2">
                                <div className="flex items-center gap-3 md:gap-5 w-full">
                                   <span className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-1 text-base md:text-lg flex-1 tracking-tight pl-1 md:pl-2">{cleanTitle}</span>
                                   <span className="text-xs md:text-sm font-bold text-slate-400 dark:text-slate-500 hidden sm:block shrink-0">{new Date(n.pub_date).toLocaleDateString()}</span>
                                </div>
                             </div>
                           );
                        })}
                      </div>
                   </div>

                 </div>
               </section>
            </div>
          )}

          {view === 'resource_map' && (
             <ResourceMap 
                searchKeyword={searchKeyword} 
                setSearchKeyword={setSearchKeyword} 
                selectedRegion={selectedRegion} 
                setSelectedRegion={setSelectedRegion} 
                selectedType={selectedType} 
                setSelectedType={setSelectedType} 
                role={role}
             />
          )}

          {view === 'news' && <NewsFeed isAdmin={role === 'admin'} />}
          {view === 'notice' && <NoticeBoard userRole={role} onWriteClick={(t: string) => { setUploadType(t); setIsUploadOpen(true);}}/>}
          
          {view === 'issue_list' && (
            <div className="pt-16 max-w-7xl mx-auto px-4 animate-in fade-in mb-28">
              <div className="flex items-center justify-between mb-12 pb-8 border-b border-slate-800 dark:border-slate-700 relative overflow-hidden px-10">
                <div className="absolute top-4 left-4 text-teal-100 dark:text-teal-900/30 opacity-60 z-0"><Book size={48} className="text-teal-200 dark:text-teal-800"/></div>
                <h2 className="text-3xl md:text-4xl font-black flex items-center gap-4 text-slate-800 dark:text-white tracking-tight relative z-10">자료실 <Book className="text-teal-500 dark:text-teal-400" size={36}/></h2>
                
                {role === 'admin' && (
                  <div className="flex gap-2 relative z-10">
                    <button onClick={handleFixDatabaseUrls} disabled={isMigrating} className="bg-rose-500 text-white px-5 py-3.5 rounded-2xl font-black shadow-sm flex items-center gap-2 hover:bg-rose-600 transition-colors disabled:opacity-50">
                      {isMigrating ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} />}
                      <span className="hidden sm:inline">DB 주소 영구 변환</span>
                    </button>
                    <button onClick={() => { setUploadType('issue'); setIsUploadOpen(true); }} className="bg-teal-500 dark:bg-teal-600 text-white px-7 py-3.5 rounded-2xl font-black shadow-md flex items-center gap-2 hover:bg-teal-600 dark:hover:bg-teal-500 transition-colors">
                      <Plus size={20}/> 호수 발행
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end mb-6 gap-2 px-2">
                <select 
                  value={sortOption} 
                  onChange={(e) => setSortOption(e.target.value)}
                  className="h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <option value="date_order">날짜 순</option>
                  <option value="hit_order">조회 순</option>
                  <option value="thumbup_order">추천 순</option>
                </select>
                
                <button 
                  onClick={() => setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc')}
                  className="h-11 px-3 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm"
                  title="오름차순/내림차순 변경"
                >
                  {sortDirection === 'desc' ? <ArrowDown size={18} /> : <ArrowUp size={18} />}
                </button>
              </div>
        
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8">
                {[...issues].sort((a, b) => {
                  let valA = 0, valB = 0;
                  if (sortOption === 'date_order') {
                    valA = Number(a.vol || a.id || 0); 
                    valB = Number(b.vol || b.id || 0);
                  } else if (sortOption === 'hit_order') {
                    valA = Number(a.views || 0);
                    valB = Number(b.views || 0);
                  } else if (sortOption === 'thumbup_order') {
                    valA = Number(a.likes || 0);
                    valB = Number(b.likes || 0);
                  }
                  return sortDirection === 'desc' ? valB - valA : valA - valB;
                }).map(issue => (
                  <IssueCard key={issue.id} issue={issue} onClick={handleIssueClick} isAdmin={role === 'admin'} onDelete={handleDeleteIssue} onAddArticle={openArticleUploadForIssue} onEdit={handleEditIssue} />
                ))}
              </div>
            </div>
          )}
          
          {view === 'article_view' && currentArticle && <CustomPDFViewer article={currentArticle} onBack={() => setView('issue_list')}/>}
       </main>
       
       {view !== 'resource_map' && view !== 'article_view' && (
         <Footer onSecretAdminUnlock={() => {
           setRole('admin');
           if (typeof window !== 'undefined') sessionStorage.setItem('userRole', 'admin');
         }} />
       )}
       
       <UniversalUploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} type={uploadType} isUploading={isUploading} onSubmit={handleUpload}/>
    </div>
    </>
  );
};

export default function App() { return <MainApp />; }