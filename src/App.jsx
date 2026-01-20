import React, { useState, useEffect, useRef } from 'react';
import { 
  Book, FileText, User, LogOut, ChevronRight, ArrowLeft, 
  Plus, Trash2, ChevronLeft,  
  X, Newspaper, Calendar as CalendarIcon, 
  Star, Image as ImageIcon, List as ListIcon,
  RefreshCw, ArrowRight, ArrowUpRight, Paperclip, Loader2, Home, Search, Menu,
  Sun, Moon, Eye, Megaphone
} from 'lucide-react';

// ✅ [Fix 1] Supabase 클라이언트 직접 통합 (CDN 방식 사용)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// ✅ [Fix 3] Canvas 환경 호환성 수정: import.meta 제거 및 직접 할당
// (실제 배포 시에는 환경 변수로 다시 변경해야 하지만, 캔버스 미리보기를 위해 직접 할당합니다)
const supabaseUrl = "https://rmlaqmrrkeiplabaikqi.supabase.co"; 
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtbGFxbXJya2VpcGxhYmFpa3FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MjQ5MTgsImV4cCI6MjA4MzMwMDkxOH0.-W8OO4wJGaZVojfmj9cj-PVpx8BmvZLLiftCf5_yfKA";
const supabase = createClient(supabaseUrl, supabaseKey);

// --- [유틸리티 & PDF 헬퍼] ---
const useContainerSize = (ref) => {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const updateSize = () => { if (ref.current) setSize({ width: ref.current.clientWidth, height: ref.current.clientHeight }); };
    window.addEventListener('resize', updateSize); updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, [ref]);
  return size;
};

const loadPdfScript = () => {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) { resolve(window.pdfjsLib); return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; resolve(window.pdfjsLib); };
    document.head.appendChild(script);
  });
};

// --- [조회수 증가 함수] ---
const incrementViewCount = async (table, id, currentViews) => {
  if (!supabase) return;
  try { await supabase.from(table).update({ views: (currentViews || 0) + 1 }).eq('id', id); } 
  catch (e) { console.error("조회수 업데이트 실패:", e); }
};

// ✅ [Fix 2] BottomNav 컴포넌트 통합
const BottomNav = ({ currentView, onViewChange }) => {
  const navItems = [
    { id: 'home', label: '홈', icon: Home },
    { id: 'news', label: '뉴스', icon: Newspaper },
    { id: 'notice', label: '소식', icon: Megaphone },
    { id: 'issue_list', label: '자료실', icon: Book },
    { id: 'gallery', label: '갤러리', icon: ImageIcon },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-gray-800 pb-safe z-50 h-[60px] flex items-center justify-around shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onViewChange(item.id)}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${
            currentView === item.id 
              ? 'text-blue-600 dark:text-blue-400' 
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          <item.icon size={22} strokeWidth={currentView === item.id ? 2.5 : 2} />
          <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

// --- [KRDS 스타일 모달 컴포넌트] ---
const AuthModal = ({ isOpen, onClose, onLoginSuccess }) => {
  if (!isOpen) return null;
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("가입 확인 메일을 보냈습니다."); setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onLoginSuccess(); onClose();
      }
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-sm overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="bg-gray-50 dark:bg-slate-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{isSignUp ? '회원가입' : '로그인'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"><X size={20}/></button>
        </div>
        <div className="p-6">
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">이메일</label>
              <input 
                type="email" 
                placeholder="example@korea.kr" 
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:text-white" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">비밀번호</label>
              <input 
                type="password" 
                placeholder="********" 
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:text-white" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required
              />
            </div>
            {error && <p className="text-red-600 dark:text-red-400 text-xs font-bold bg-red-50 dark:bg-red-900/30 p-2 rounded">{error}</p>}
            
            <button type="submit" disabled={loading} className="w-full py-2.5 bg-[#2563EB] text-white rounded-md font-bold text-sm hover:bg-[#1d4ed8] transition-colors shadow-sm disabled:opacity-50">
              {loading ? '처리 중...' : (isSignUp ? '가입하기' : '로그인')}
            </button>
          </form>
          <div className="mt-4 text-center">
             <button onClick={() => setIsSignUp(!isSignUp)} className="text-xs text-gray-500 dark:text-gray-400 underline hover:text-blue-600 dark:hover:text-blue-400">
              {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- [KRDS 스타일 업로드 모달] ---
const UniversalUploadModal = ({ isOpen, onClose, onSubmit, type, isUploading }) => {
  if (!isOpen) return null;
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '', event_date: '', description: '', vol: '' });

  const getInputClass = "w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400 dark:text-white";
  const getLabelClass = "block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1";

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in zoom-in-95">
       <div className="bg-white dark:bg-slate-800 rounded-lg w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 flex justify-between items-center sticky top-0">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
               {type === 'notice' && <><Megaphone className="text-blue-600" size={20}/> 공지사항 작성</>}
               {type === 'gallery' && <><ImageIcon className="text-blue-600" size={20}/> 갤러리 업로드</>}
               {type === 'issue' && <><Book className="text-blue-600" size={20}/> 월간호 발행</>}
               {type === 'article' && <><FileText className="text-blue-600" size={20}/> 자료 등록</>}
            </h2>
            <button onClick={onClose}><X className="text-gray-400 hover:text-gray-900 dark:hover:text-white"/></button>
          </div>

          <div className="p-6">
            {isUploading ? <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-blue-600 mb-2"/> <p className="text-sm text-gray-600 dark:text-gray-400">데이터를 전송 중입니다...</p></div> : (
               <form onSubmit={(e) => { e.preventDefault(); onSubmit({...formData, file, type}); }} className="space-y-5">
                  {type === 'issue' && <div><label className={getLabelClass}>호수 (Vol) <span className="text-red-500">*</span></label><input className={getInputClass} placeholder="예: 24" value={formData.vol} onChange={e => setFormData({...formData, vol: e.target.value})}/></div>}
                  
                  <div><label className={getLabelClass}>제목 <span className="text-red-500">*</span></label><input className={getInputClass} placeholder="제목을 입력하세요" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}/></div>
                  
                  {type === 'notice' && (
                     <>
                        <div><label className={getLabelClass}>내용 <span className="text-red-500">*</span></label><textarea className={`${getInputClass} h-32 resize-none`} placeholder="공지 내용을 입력하세요" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})}/></div>
                        <div><label className={getLabelClass}>행사 일정 (선택)</label><input type="date" className={getInputClass} value={formData.event_date} onChange={e => setFormData({...formData, event_date: e.target.value})}/></div>
                     </>
                  )}
                  
                  {type === 'issue' && <div><label className={getLabelClass}>설명</label><textarea className={`${getInputClass} h-24 resize-none`} placeholder="이번 호에 대한 간단한 설명을 입력하세요" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}/></div>}
                  
                  {(type === 'article' || type === 'gallery') && (
                     <div>
                        <label className={getLabelClass}>첨부 파일 <span className="text-red-500">*</span></label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-blue-400 transition-colors relative cursor-pointer group">
                           <div className="space-y-1 text-center">
                              <Paperclip className="mx-auto h-12 w-12 text-gray-400 group-hover:text-blue-500"/>
                              <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                                 <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                                    <span>파일 업로드</span>
                                    <input type="file" className="sr-only" onChange={e => setFile(e.target.files[0])}/>
                                 </label>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-500">{file ? file.name : (type === 'gallery' ? 'PNG, JPG up to 10MB' : 'PDF only')}</p>
                           </div>
                           <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={e => setFile(e.target.files[0])}/>
                        </div>
                     </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700 mt-6">
                     <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-sm">취소</button>
                     <button type="submit" className="flex-1 py-2.5 bg-[#2563EB] text-white font-bold rounded-md hover:bg-[#1d4ed8] transition-colors shadow-sm text-sm">등록 완료</button>
                  </div>
               </form>
            )}
         </div>
       </div>
    </div>
  );
};

// --- [PDF 뷰어] ---
const CustomPDFViewer = ({ article, onBack }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNum, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const containerSize = useContainerSize(containerRef);

  useEffect(() => {
    const loadPdf = async () => {
      try {
        await loadPdfScript();
        const pdfjs = window.pdfjsLib;
        const loadingTask = pdfjs.getDocument(article.fileUrl);
        const doc = await loadingTask.promise;
        setPdfDoc(doc);
        // ✅ 조회수 증가 로직 복구
        incrementViewCount('articles', article.id, article.views);
      } catch (e) { console.error(e); }
    };
    if (article.fileUrl) loadPdf();
  }, [article.fileUrl]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || !containerSize.width) return;
    const renderPage = async () => {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: scale * (containerSize.width / page.getViewport({ scale: 1 }).width) });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      canvas.height = viewport.height; canvas.width = viewport.width;
      await page.render({ canvasContext: context, viewport }).promise;
    };
    renderPage();
  }, [pdfDoc, pageNum, scale, containerSize]);

  return (
    <div className="fixed inset-0 bg-gray-100 dark:bg-slate-900 z-[150] flex flex-col h-screen w-screen animate-in slide-in-from-right">
       <div className="h-16 bg-white dark:bg-slate-800 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 shrink-0 shadow-sm">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"><ArrowLeft className="text-gray-700 dark:text-white"/></button>
          <span className="font-bold text-gray-900 dark:text-white truncate px-4">{article.title}</span>
          <div className="w-6"/>
       </div>
       <div className="flex-1 overflow-auto p-4 flex justify-center" ref={containerRef}>
          <canvas ref={canvasRef} className="bg-white shadow-md border border-gray-200"/>
       </div>
       {pdfDoc && (
         <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 flex items-center gap-4">
            <button onClick={() => setPageNumber(p => Math.max(1, p-1))} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-gray-700 dark:text-gray-200"><ChevronLeft size={20}/></button>
            <span className="font-mono text-sm font-bold text-gray-700 dark:text-gray-200">{pageNum} / {pdfDoc.numPages}</span>
            <button onClick={() => setPageNumber(p => Math.min(pdfDoc.numPages, p+1))} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-gray-700 dark:text-gray-200"><ChevronRight size={20}/></button>
         </div>
       )}
    </div>
  );
};

// --- [뉴스룸 컴포넌트] ---
const NewsFeed = ({ limit, onMoreClick, isAdmin }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false); // ✅ 새로고침 상태 추가
  
  const fetchNews = async () => {
    // 수동 새로고침일 경우 화면 전체 로딩 대신 아이콘 로딩만
    if (news.length > 0) setIsRefreshing(true);
    else setLoading(true);

    if(!supabase) return;
    const { data } = await supabase.from('news').select('*').order('pub_date', { ascending: false }).limit(limit || 50);
    if(data) setNews(data);
    
    setLoading(false);
    setIsRefreshing(false);
  };
  
  useEffect(() => { fetchNews(); }, [limit]);

  if (loading && !isRefreshing) return <div className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-600"/></div>;

  return (
    <div className={`max-w-7xl mx-auto px-4 ${limit ? 'py-12' : 'py-16'}`}>
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="w-1.5 h-6 bg-blue-600 inline-block rounded-sm"></span>
            뉴스룸
            </h2>
            {/* ✅ 새로고침 버튼 복구 */}
            <button 
                onClick={fetchNews} 
                disabled={isRefreshing}
                className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 transition-all"
                title="뉴스 새로고침"
            >
                <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
            </button>
        </div>
        {limit && <button onClick={onMoreClick} className="text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors">전체보기 <ChevronRight size={16}/></button>}
      </div>
      
      {/* KRDS List Style + Dark Mode + High Contrast Badges */}
      <div className="flex flex-col border-t border-gray-200 dark:border-gray-700">
         {news.map((item, idx) => (
            <a key={idx} href={item.link} target="_blank" className="group flex flex-col md:flex-row gap-4 p-5 border-b border-gray-200 dark:border-gray-700 hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-colors">
               <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                     {/* ✅ [Fix] 가독성 개선: 흰색 텍스트 제거 -> 연한 배경에 진한 텍스트 적용 (Badge High Contrast) */}
                     <span className={`text-[11px] font-bold px-2 py-0.5 rounded border 
                        ${item.author?.includes('Google') 
                            ? 'bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-300' 
                            : 'bg-green-100 border-green-200 text-green-700 dark:bg-green-900 dark:border-green-700 dark:text-green-300'
                        }`}
                     >
                        {item.author || '뉴스'}
                     </span>
                     <span className="text-xs text-gray-400 font-medium">{new Date(item.pub_date).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">{item.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">클릭하여 원문 기사를 확인하세요.</p>
               </div>
               <div className="hidden md:flex items-center text-gray-300 dark:text-gray-600 group-hover:text-blue-400 dark:group-hover:text-blue-400">
                  <ArrowUpRight size={20}/>
               </div>
            </a>
         ))}
         {news.length === 0 && <div className="text-center py-10 text-gray-400 dark:text-gray-500 border-b border-gray-200 dark:border-gray-700">등록된 뉴스가 없습니다.</div>}
      </div>
    </div>
  );
};

// --- [공지사항/캘린더] ---
const NoticeBoard = ({ userRole, onWriteClick }) => {
  const [mode, setMode] = useState('list');
  const [notices, setNotices] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const fetchNotices = async () => {
      const { data } = await supabase.from('notices').select('*').order('created_at', { ascending: false });
      if (data) setNotices(data);
    };
    fetchNotices();
  }, []);

  const getEvents = (date) => notices.filter(n => n.event_date && new Date(n.event_date).toDateString() === date.toDateString());

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
         <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="w-1.5 h-6 bg-blue-600 inline-block rounded-sm"></span>
            소식 & 일정
         </h2>
         <div className="flex gap-2">
            <div className="bg-gray-100 dark:bg-slate-800 p-1 rounded-md flex border border-gray-200 dark:border-gray-600">
               <button onClick={() => setMode('list')} className={`p-1.5 rounded-sm text-sm font-bold flex items-center gap-1 ${mode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}><ListIcon size={16}/> 목록</button>
               <button onClick={() => setMode('calendar')} className={`p-1.5 rounded-sm text-sm font-bold flex items-center gap-1 ${mode === 'calendar' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}><CalendarIcon size={16}/> 달력</button>
            </div>
            {(userRole === 'team' || userRole === 'admin') && 
               <button onClick={() => onWriteClick('notice')} className="bg-[#2563EB] text-white px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 hover:bg-[#1d4ed8] transition-colors"><Plus size={16}/> 글쓰기</button>
            }
         </div>
      </div>
      
      {mode === 'list' ? (
        <div className="grid gap-4">
           {notices.map(n => (
              <div key={n.id} className="bg-white dark:bg-slate-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors shadow-sm">
                 <div className="flex justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${n.category === 'event' ? 'bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400' : 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-slate-700 dark:border-slate-600 dark:text-gray-400'}`}>{n.category === 'event' ? '행사' : '공지'}</span>
                    <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleDateString()}</span>
                 </div>
                 <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{n.title}</h3>
                 <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{n.content}</p>
                 {n.event_date && <div className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded border border-blue-100 dark:border-blue-800"><CalendarIcon size={14}/> 일정: {n.event_date}</div>}
              </div>
           ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
           <div className="flex justify-center items-center mb-6 gap-8">
              <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth()-1)))} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full dark:text-white"><ChevronLeft/></button>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{currentDate.getFullYear()}년 {currentDate.getMonth()+1}월</h3>
              <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth()+1)))} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full dark:text-white"><ChevronRight/></button>
           </div>
           <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
              {['일','월','화','수','목','금','토'].map(d => <div key={d} className="bg-gray-50 dark:bg-slate-900 text-center text-xs font-bold text-gray-500 dark:text-gray-400 py-2">{d}</div>)}
              {Array.from({length: 35}).map((_, i) => {
                 const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), i - new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() + 1);
                 const isToday = d.toDateString() === new Date().toDateString();
                 const isCurrentMonth = d.getMonth() === currentDate.getMonth();
                 return (
                    <div key={i} className={`min-h-[100px] bg-white dark:bg-slate-800 p-2 ${!isCurrentMonth ? 'bg-gray-50/50 dark:bg-slate-900/50 text-gray-300 dark:text-gray-600' : 'text-gray-900 dark:text-gray-200'}`}>
                       <span className={`text-sm font-bold inline-block w-6 h-6 text-center leading-6 rounded-full ${isToday ? 'bg-blue-600 text-white' : ''}`}>{d.getDate()}</span>
                       <div className="mt-1 flex flex-col gap-1">{getEvents(d).map(ev => <div key={ev.id} className="text-[10px] bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-1 py-0.5 rounded truncate font-bold">{ev.title}</div>)}</div>
                    </div>
                 );
              })}
           </div>
        </div>
      )}
    </div>
  );
};

// --- [갤러리] ---
const Gallery = ({ userRole, onUploadClick }) => {
  const [images, setImages] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const fetchImages = async () => {
      const { data } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });
      if (data) setImages(data);
    };
    fetchImages();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
         <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="w-1.5 h-6 bg-blue-600 inline-block rounded-sm"></span>
            활동 갤러리
         </h2>
         {(userRole === 'team' || userRole === 'admin') && <button onClick={() => onUploadClick('gallery')} className="bg-[#2563EB] text-white px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 hover:bg-[#1d4ed8] transition-colors"><ImageIcon size={16}/> 사진 올리기</button>}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         {images.map(img => (
            <div key={img.id} onClick={() => setSelected(img)} className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group">
               <div className="aspect-square overflow-hidden bg-gray-100 dark:bg-slate-700">
                  <img src={img.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
               </div>
               <div className="p-3">
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">{img.title}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(img.created_at).toLocaleDateString()}</p>
               </div>
            </div>
         ))}
      </div>
      {selected && (
         <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelected(null)}>
            <img src={selected.image_url} className="max-w-full max-h-[90vh] rounded shadow-2xl bg-white" onClick={e => e.stopPropagation()}/>
            <button className="absolute top-5 right-5 text-white/70 hover:text-white"><X size={32}/></button>
         </div>
      )}
    </div>
  );
};

// --- [자료실 (Issue Card) - Refined] ---
const IssueCard = ({ issue, onClick, isAdmin, onDelete }) => (
  <div onClick={() => onClick(issue)} className="group cursor-pointer flex flex-col bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:border-blue-500 hover:ring-1 hover:ring-blue-500 hover:shadow-lg transition-all duration-300">
    <div className={`aspect-[4/5] w-full ${issue.cover_color || 'bg-slate-50 dark:bg-slate-700'} relative flex items-center justify-center border-b border-gray-100 dark:border-gray-700`}>
      <div className="text-6xl transform group-hover:scale-105 transition-transform duration-500 drop-shadow-sm">{issue.icon || '📘'}</div>
      <div className="absolute top-0 left-0">
         <span className="inline-block bg-[#2563EB] text-white text-[11px] font-bold px-3 py-1.5 rounded-br-lg shadow-sm">Vol.{issue.vol}</span>
      </div>
    </div>
    
    <div className="p-5 flex-1 flex flex-col">
      <div className="flex justify-between items-start mb-2">
        <span className="text-[12px] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded text-center">{issue.date}</span>
        {isAdmin && <button onClick={(e) => { e.stopPropagation(); onDelete(issue.id); }} className="text-gray-300 hover:text-red-600 transition-colors p-1"><Trash2 size={16}/></button>}
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-snug mb-2 group-hover:text-[#2563EB] dark:group-hover:text-blue-400 transition-colors break-keep">{issue.title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mt-auto">{issue.description || "내용이 없습니다."}</p>
      
      <div className="mt-4 flex items-center text-xs font-bold text-[#2563EB] dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
        열람하기 <ArrowRight size={12} className="ml-1"/>
      </div>
    </div>
  </div>
);

// --- [네비게이션 (Navbar) - Brand Renaming] ---
const Navbar = ({ isAdmin, onLoginClick, onLogout, onHomeClick, onViewChange, currentView, isDarkMode, toggleTheme }) => (
  <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 h-[70px] flex items-center shadow-sm transition-colors">
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3 cursor-pointer group" onClick={onHomeClick}>
         <div className="w-10 h-10 bg-[#2563EB] rounded-lg flex items-center justify-center text-white font-black text-xl shadow-md group-hover:bg-[#1d4ed8] transition-colors">K</div>
         {/* ✅ [Fix] 브랜드명 교체: Kids Insight -> 아이들의 미래를 잇는 지식 플랫폼 */}
         <div className="flex flex-col justify-center">
           <span className="font-bold text-lg md:text-xl text-gray-900 dark:text-white leading-none tracking-tight group-hover:text-[#2563EB] dark:group-hover:text-blue-400 transition-colors">아이들의 미래를 잇는</span>
           <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mt-0.5 tracking-wide">지식 플랫폼</span>
         </div>
      </div>
      
      <nav className="hidden md:flex items-center h-full">
        {['home', 'news', 'notice', 'issue_list', 'gallery'].map(key => (
          <button key={key} onClick={() => onViewChange(key)} className={`h-full px-5 text-[15px] font-medium transition-all relative flex items-center ${currentView === key ? 'text-[#2563EB] dark:text-blue-400 font-bold after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[3px] after:bg-[#2563EB] dark:after:bg-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-[#2563EB] dark:hover:text-blue-300 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>
             {key === 'home' ? '홈' : key === 'news' ? '뉴스룸' : key === 'notice' ? '소식' : key === 'issue_list' ? '자료실' : '갤러리'}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        {/* ✅ 다크모드 토글 버튼 */}
        <button onClick={toggleTheme} className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
           {isDarkMode ? <Sun size={20} className="text-yellow-400"/> : <Moon size={20}/>}
        </button>

        <button className="p-2 text-gray-400 hover:text-[#2563EB] transition-colors hidden sm:block"><Search size={20}/></button>
        {isAdmin ? (
          <button onClick={onLogout} className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">로그아웃</button>
        ) : (
          <button onClick={onLoginClick} className="px-5 py-2 bg-[#2563EB] text-white rounded-md text-sm font-bold hover:bg-[#1d4ed8] hover:shadow-lg transition-all shadow-sm">로그인</button>
        )}
      </div>
    </div>
  </header>
);

// --- [메인 앱 로직] ---
const MainApp = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('guest');
  const [view, setView] = useState('home'); 
  const [issues, setIssues] = useState([]);
  const [currentIssue, setCurrentIssue] = useState(null);
  const [currentArticle, setCurrentArticle] = useState(null);
  
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadType, setUploadType] = useState('notice');
  const [isUploading, setIsUploading] = useState(false);

  // ✅ 테마 상태 관리
  const [isDarkMode, setIsDarkMode] = useState(false);
  const toggleTheme = () => setIsDarkMode(p => !p);

  useEffect(() => {
    // Auth Check
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
         setUser(session.user);
         const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
         setRole(data?.role || 'general');
      }
    };
    initAuth();
    
    // Fetch Issues for Home
    const fetchIssues = async () => {
       const { data } = await supabase.from('issues').select('*').order('created_at', { ascending: false });
       if (data) setIssues(data);
    };
    fetchIssues();
  }, []);

  const handleUpload = async (data) => {
    setIsUploading(true);
    try {
       if (data.type === 'notice') {
          await supabase.from('notices').insert([{ title: data.title, content: data.content, event_date: data.event_date || null, category: data.event_date ? 'event' : 'notice', author_id: user.id }]);
       } else if (data.type === 'gallery' && data.file) {
          const fn = `${Date.now()}_${data.file.name}`;
          await supabase.storage.from('gallery').upload(fn, data.file);
          const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(fn);
          await supabase.from('gallery').insert([{ title: data.title, image_url: publicUrl, author_id: user.id }]);
       } else if (data.type === 'issue') {
          await supabase.from('issues').insert([{ vol: data.vol, title: data.title, description: data.description, date: new Date().toLocaleDateString(), cover_color: 'bg-blue-100', icon: '📘' }]);
       } else if (data.type === 'article' && currentIssue) {
          let fileUrl = '';
          if (data.file) {
             const fn = `${Date.now()}.pdf`;
             await supabase.storage.from('files').upload(fn, data.file);
             fileUrl = supabase.storage.from('files').getPublicUrl(fn).data.publicUrl;
          }
          const newArticle = { id: Date.now(), title: data.title, fileUrl, views: 0 };
          const updated = [...(currentIssue.articles || []), newArticle];
          await supabase.from('issues').update({ articles: updated }).eq('id', currentIssue.id);
          setCurrentIssue({...currentIssue, articles: updated});
       }
       alert("완료되었습니다!"); setIsUploadOpen(false);
       if (data.type !== 'article') window.location.reload();
    } catch (e) { alert("오류: " + e.message); } finally { setIsUploading(false); }
  };

  const handleDeleteIssue = async (id) => { if(confirm('삭제하시겠습니까?')) { await supabase.from('issues').delete().eq('id', id); window.location.reload(); }};

  return (
    // ✅ 최상위 div에 dark 클래스 토글
    <div className={`${isDarkMode ? 'dark' : ''}`}>
       <div className="min-h-screen bg-white dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300">
       
       <Navbar 
          isAdmin={role === 'admin' || user} // 간소화
          onLoginClick={() => setIsAuthOpen(true)}
          onLogout={() => {if(supabase) supabase.auth.signOut(); window.location.reload();}}
          onHomeClick={() => setView('home')}
          onViewChange={setView}
          currentView={view}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
       />

       <main className="flex-1 pb-24">
          {view === 'home' && (
             <div className="animate-in fade-in space-y-20">
                {/* --- [KRDS Hero Section] --- */}
                <section className="bg-gray-50 dark:bg-slate-800 py-16 md:py-24 border-b border-gray-200 dark:border-gray-700">
                   <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                      <div>
                         <span className="inline-block py-1 px-3 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold mb-4">Beta v1.0</span>
                         {/* ✅ [Fix] 메인 카피 브랜드명 교체 */}
                         <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white leading-tight mb-6">
                            아이들의 미래를 잇는<br/>
                            <span className="text-[#2563EB] dark:text-blue-400">지식 플랫폼.</span>
                         </h1>
                         <p className="text-gray-600 dark:text-gray-300 text-lg mb-8 leading-relaxed">
                            이 플랫폼은 선생님과 부모님을 위한<br/>
                            깊이 있는 교육 정보를 공신력 있게 전달합니다.
                         </p>
                         <div className="flex gap-4">
                            <button onClick={() => setView('issue_list')} className="px-8 py-4 bg-[#2563EB] text-white rounded-md font-bold shadow-md hover:bg-[#1d4ed8] transition-all flex items-center gap-2">
                               자료실 바로가기 <ArrowRight size={18}/>
                            </button>
                            <button onClick={() => setView('news')} className="px-8 py-4 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white rounded-md font-bold hover:bg-gray-50 dark:hover:bg-slate-600 transition-all">
                               뉴스룸 탐색
                            </button>
                         </div>
                      </div>
                      <div className="relative h-[300px] md:h-[400px] bg-white dark:bg-slate-700 rounded-2xl border border-gray-200 dark:border-gray-600 shadow-xl overflow-hidden flex items-center justify-center p-10">
                         {issues[0] ? (
                            <div className="text-center">
                               <div className="text-xs font-bold text-gray-400 mb-2">LATEST ISSUE</div>
                               <div className="text-9xl mb-4 animate-bounce-slow">{issues[0].icon}</div>
                               <h3 className="text-2xl font-black text-gray-900 dark:text-white">{issues[0].title}</h3>
                            </div>
                         ) : <div className="text-gray-300 font-bold">발행된 호수가 없습니다.</div>}
                      </div>
                   </div>
                </section>

                <NewsFeed limit={4} onMoreClick={() => setView('news')}/>

                <section className="max-w-7xl mx-auto px-4 pb-20">
                   <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200 dark:border-gray-700">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><span className="w-1.5 h-6 bg-blue-600 inline-block rounded-sm"></span>월간 자료실</h2>
                      <button onClick={() => setView('issue_list')} className="text-sm font-bold text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 flex items-center gap-1 transition-colors">전체보기 <ChevronRight size={16}/></button>
                   </div>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {issues.slice(0, 4).map(issue => <IssueCard key={issue.id} issue={issue} onClick={(i) => {setCurrentIssue(i); setView('issue_detail');}} isAdmin={role === 'admin'} onDelete={handleDeleteIssue}/>)}
                   </div>
                </section>
             </div>
          )}
          
          {view === 'news' && <NewsFeed isAdmin={role === 'admin'}/>}
          {view === 'notice' && <NoticeBoard userRole={role} onWriteClick={(t) => { setUploadType(t); setIsUploadOpen(true); }}/>}
          {view === 'gallery' && <Gallery userRole={role} onUploadClick={(t) => { setUploadType(t); setIsUploadOpen(true); }}/>}
          
          {view === 'issue_list' && (
             <div className="pt-10 max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200 dark:border-gray-700">
                   <h2 className="text-3xl font-bold text-gray-900 dark:text-white">월간 자료실</h2>
                   {role === 'admin' && <button onClick={() => { setUploadType('issue'); setIsUploadOpen(true); }} className="bg-[#2563EB] text-white px-5 py-2.5 rounded-md font-bold shadow-sm hover:bg-[#1d4ed8] flex items-center gap-2"><Plus size={18}/> 호수 발행</button>}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">{issues.map(issue => <IssueCard key={issue.id} issue={issue} onClick={(i) => {setCurrentIssue(i); setView('issue_detail');}} isAdmin={role === 'admin'} onDelete={handleDeleteIssue}/>)}</div>
             </div>
          )}
          
          {view === 'issue_detail' && currentIssue && (
             <div className="max-w-5xl mx-auto px-4 py-10 animate-in slide-in-from-right">
                <button onClick={() => setView('issue_list')} className="mb-6 flex items-center gap-2 font-bold text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"><ArrowLeft size={20}/> 목록으로 돌아가기</button>
                <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 md:p-12 mb-10 shadow-sm flex flex-col md:flex-row gap-8 items-start">
                   <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-5xl border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400">{currentIssue.icon}</div>
                   <div>
                      <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-xs font-bold rounded mb-3">Vol.{currentIssue.vol}</span>
                      <h1 className="text-3xl font-black mb-4 text-gray-900 dark:text-white">{currentIssue.title}</h1>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl">{currentIssue.description}</p>
                   </div>
                </div>
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                   <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><span className="w-1.5 h-6 bg-blue-600 inline-block rounded-sm"></span>수록 자료 목록</h3>
                   {role === 'admin' && (
                      <button 
                         onClick={() => { setUploadType('article'); setIsUploadOpen(true); }} 
                         className="flex items-center gap-2 shadow-sm bg-[#2563EB] text-white px-4 py-2 rounded-md font-bold hover:bg-[#1d4ed8]"
                      >
                         <Plus size={18} /> 자료 추가
                      </button>
                   )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {currentIssue.articles?.map(art => (
                      <div key={art.id} onClick={() => { setCurrentArticle(art); setView('article_view'); }} className="group p-5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md cursor-pointer transition-all flex items-center gap-4">
                         <div className="w-12 h-12 bg-gray-50 dark:bg-slate-700 rounded-md flex items-center justify-center text-gray-400 dark:text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600 dark:group-hover:bg-blue-900/30 dark:group-hover:text-blue-400 transition-colors"><FileText size={24}/></div>
                         <div className="flex-1">
                            <div className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{art.title}</div>
                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                               <span>PDF 문서</span>
                               {/* ✅ 조회수 표시 */}
                               {art.views > 0 && <span className="flex items-center gap-0.5 text-blue-500 font-bold"><Eye size={10}/> {art.views}</span>}
                            </div>
                         </div>
                         <ArrowRight className="ml-auto text-gray-300 dark:text-gray-600 group-hover:text-blue-400"/>
                      </div>
                   ))}
                   {(!currentIssue.articles || currentIssue.articles.length === 0) && <div className="col-span-full py-10 text-center text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">등록된 자료가 없습니다.</div>}
                </div>
             </div>
          )}

          {view === 'article_view' && currentArticle && <CustomPDFViewer article={currentArticle} onBack={() => setView('issue_detail')}/>}
       </main>

       <BottomNav currentView={view} onViewChange={setView} />
       
       <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onLoginSuccess={() => window.location.reload()}/>
       <UniversalUploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} type={uploadType} isUploading={isUploading} onSubmit={handleUpload}/>
       </div>
    </div>
  );
};

export default function App() { return <MainApp />; }
