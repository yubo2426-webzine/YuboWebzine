import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Book, FileText, User, LogOut, ChevronRight, ArrowLeft, 
  Plus, Trash2, ChevronLeft,  
  X, Newspaper, Calendar as CalendarIcon, 
  Star, Image as ImageIcon, List as ListIcon,
  RefreshCw, ArrowRight, ArrowUpRight, Paperclip, Loader2, Home, Search, Menu,
  Sun, Moon, Eye, Megaphone,
  ZoomIn, ZoomOut, Download, Share2, Check, AlertTriangle, Monitor
} from 'lucide-react';

// ✅ [KRDS] Button 사용 (안정성 확인됨)
import { Button } from 'krds-react';

// ✅ [Supabase] 클라이언트
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// ------------------------------------------------------------------
// 🏛️ [KRDS System] 커스텀 컴포넌트 (Input, Badge)
// ------------------------------------------------------------------
const KRDSInput = ({ className, ...props }) => (
  <input 
    className={`w-full h-[40px] px-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] disabled:bg-gray-100 disabled:text-gray-400 transition-all ${className}`}
    {...props}
  />
);

const KRDSBadge = ({ variant = 'neutral', children, className }) => {
  const styles = {
    primary: 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800',
    success: 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800',
    neutral: 'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:border-gray-600',
  };
  return (
    <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-black ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};

// ------------------------------------------------------------------
// 🚀 Main Logic
// ------------------------------------------------------------------

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// --- [Hook] 브라우저 History API 연동 (뒤로가기 지원) ---
const useHistoryState = (initialState) => {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    // 초기 로드시 현재 상태를 history에 replace
    window.history.replaceState({ view: initialState }, '');

    const handlePopState = (event) => {
      if (event.state && event.state.view) {
        setState(event.state.view);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const setHistoryState = (newState) => {
    if (newState !== state) {
      window.history.pushState({ view: newState }, '', `?view=${newState}`);
      setState(newState);
    }
  };

  return [state, setHistoryState];
};

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

const incrementViewCount = async (table, id, currentViews) => {
  if (!supabase) return;
  try { await supabase.from(table).update({ views: (currentViews || 0) + 1 }).eq('id', id); } catch (e) { console.error(e); }
};

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
            currentView === item.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'
          }`}
        >
          <item.icon size={22} strokeWidth={currentView === item.id ? 2.5 : 2} />
          <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

const Footer = () => (
  <footer className="hidden md:block w-full bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-gray-800 py-12 mt-auto z-10 relative">
    <div className="max-w-7xl mx-auto px-4 text-center">
       <div className="flex justify-center gap-8 mb-6">
          <button className="text-sm font-bold text-gray-500 hover:text-blue-600">이용약관</button>
          <button className="text-sm font-bold text-gray-500 hover:text-blue-600">개인정보처리방침</button>
          <button className="text-sm font-bold text-gray-500 hover:text-blue-600">운영 정책</button>
       </div>
       <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
          © 2026 아이들의 미래를 잇는 지식 플랫폼. All rights reserved.<br/>Contact: help@korea-kids-platform.kr
       </p>
    </div>
  </footer>
);

const AuthModal = ({ isOpen, onClose, onLoginSuccess }) => {
  if (!isOpen) return null;
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAuth = async (e) => {
    if (!supabase) return;
    e.preventDefault();
    setLoading(true);
    setError(null);
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
          <button onClick={onClose}><X size={20} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"/></button>
        </div>
        <div className="p-6">
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">이메일</label>
              <KRDSInput type="email" placeholder="example@korea.kr" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">비밀번호</label>
              <KRDSInput type="password" placeholder="********" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-red-600 text-xs font-bold bg-red-50 p-2 rounded">{error}</p>}
            <Button type="submit" disabled={loading} variant="primary" size="large" className="w-full">
              {loading ? '처리 중...' : (isSignUp ? '가입하기' : '로그인')}
            </Button>
          </form>
          <div className="mt-4 text-center">
             <button onClick={() => setIsSignUp(!isSignUp)} className="text-xs text-gray-500 underline hover:text-blue-600">
              {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const UniversalUploadModal = ({ isOpen, onClose, onSubmit, type, isUploading }) => {
  if (!isOpen) return null;
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '', event_date: '', description: '', vol: '' });
  const getLabelClass = "block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1";
  
  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in zoom-in-95">
       <div className="bg-white dark:bg-slate-800 rounded-lg w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700 flex flex-col">
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
            {isUploading ?
            <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-blue-600 mb-2"/> <p className="text-sm text-gray-600">전송 중...</p></div> : (
               <form onSubmit={(e) => { e.preventDefault(); onSubmit({...formData, file, type}); }} className="space-y-5">
                  {type === 'issue' && <div><label className={getLabelClass}>호수 (Vol)</label><KRDSInput placeholder="예: 24" value={formData.vol} onChange={e => setFormData({...formData, vol: e.target.value})}/></div>}
                  <div><label className={getLabelClass}>제목</label><KRDSInput placeholder="제목 입력" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}/></div>
                  {type === 'notice' && (
                     <>
                        <div><label className={getLabelClass}>내용</label><textarea className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none" placeholder="내용 입력" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})}/></div>
                        <div><label className={getLabelClass}>일정 (선택)</label><KRDSInput type="date" value={formData.event_date} onChange={e => setFormData({...formData, event_date: e.target.value})}/></div>
                     </>
                  )}
                  {type === 'issue' && <div><label className={getLabelClass}>설명</label><textarea className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none" placeholder="설명 입력" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}/></div>}
   
                  {(type === 'article' || type === 'gallery') && (
                     <div>
                        <label className={getLabelClass}>파일</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 relative cursor-pointer group">
                             <div className="space-y-1 text-center">
                              <Paperclip className="mx-auto h-12 w-12 text-gray-400 group-hover:text-blue-500"/>
                              <div className="flex text-sm text-gray-600 justify-center">
                                   <label className="relative cursor-pointer text-blue-600 hover:text-blue-500"><span>업로드</span><input type="file" className="sr-only" onChange={e => setFile(e.target.files[0])}/></label>
                              </div>
                              <p className="text-xs text-gray-500">{file ? file.name : '파일 선택'}</p>
                           </div>
                        </div>
                     </div>
                  )}
                  <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700 mt-6">
                     <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-300 rounded-md text-sm font-bold hover:bg-gray-50 transition-colors">취소</button>
                     <Button type="submit" variant="primary" size="medium" className="flex-1 shadow-sm">완료</Button>
                  </div>
               </form>
            )}
         </div>
      </div>
    </div>
  );
};

// --- [PDF Viewer 개선] HiDPI 지원 + PC 세로맞춤 + 키보드 ---
const CustomPDFViewer = ({ article, onBack }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const size = useContainerSize(containerRef);

  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNum, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 키보드 이벤트 핸들러 (방향키)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') { setPageNumber(p => Math.max(1, p - 1)); }
      if (e.key === 'ArrowRight') { setPageNumber(p => Math.min(pdfDoc?.numPages || 1, p + 1)); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pdfDoc]);

  useEffect(() => {
    const loadPdf = async () => {
      try {
        await loadPdfScript(); 
        if (!window.pdfjsLib) return;
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const doc = await window.pdfjsLib.getDocument(article.fileUrl || article.file_url).promise;
        setPdfDoc(doc);
        incrementViewCount('articles', article.id, article.views);
      } catch (err) { console.error("PDF Error:", err); alert("문서 로드 실패"); }
    };
    loadPdf();
  }, [article]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || !containerRef.current) return;
    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const unscaledViewport = page.getViewport({ scale: 1.0 });
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;

        // ✅ [1번 해결] PC에서는 세로(Height) 기준 맞춤 우선, 모바일은 가로(Width) 우선
        // PC(768px 이상)일 때는 화면 안에 쏙 들어오게(Min) 계산
        let autoScale;
        if (window.innerWidth >= 768) {
           const widthScale = (containerWidth / unscaledViewport.width);
           const heightScale = (containerHeight / unscaledViewport.height);
           autoScale = Math.min(widthScale, heightScale) * 0.95; // 여백 5%
        } else {
           autoScale = (containerWidth / unscaledViewport.width) * 0.98;
        }

        const finalScale = scale * autoScale;
        const viewport = page.getViewport({ scale: finalScale });

        // ✅ [2번 해결] HiDPI (Retina) 디스플레이 대응 - 해상도 열화 방지
        const outputScale = window.devicePixelRatio || 1;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = Math.floor(viewport.width) + "px";
        canvas.style.height = Math.floor(viewport.height) + "px";

        // 스케일 보정
        const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

        await page.render({ canvasContext: ctx, viewport, transform }).promise;
      } catch (err) { console.error(err); }
    };
    renderPage();
  }, [pdfDoc, pageNum, scale, size]);

  const handleDownload = () => window.open(article.fileUrl || article.file_url, '_blank');
  return (
    <div className="fixed inset-0 bg-gray-100 dark:bg-slate-900 z-[150] flex flex-col h-screen w-screen text-left animate-in slide-in-from-right outline-none" tabIndex={0}>
       <div className="h-16 bg-white dark:bg-slate-800 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 shadow-sm z-50">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full"><ArrowLeft className="text-gray-700 dark:text-white"/></button>
            <h2 className="font-bold text-gray-900 dark:text-white truncate max-w-[150px]">{article.title}</h2>
          </div>
          <div className="flex items-center gap-1">
             <div className="hidden md:flex items-center bg-gray-100 dark:bg-slate-700 rounded-lg mr-2">
                <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} className="p-2"><ZoomOut size={18}/></button>
                <span className="text-xs w-10 text-center font-bold">{Math.round(scale * 100)}%</span>
                <button onClick={() => setScale(s => Math.min(3.0, s + 0.2))} className="p-2"><ZoomIn size={18}/></button>
             </div>
             <button onClick={handleDownload} className="p-2"><Download size={20}/></button>
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2"><ListIcon size={20}/></button>
          </div>
       </div>
       <div className="flex-1 overflow-hidden flex relative">
          <div className={`absolute md:static inset-y-0 left-0 w-64 bg-white dark:bg-slate-800 border-r border-gray-200 z-40 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:hidden'}`}>
             <div className="p-4 font-bold border-b">목차 ({pdfDoc?.numPages}p)</div>
             <div className="overflow-y-auto h-full p-2 space-y-1 pb-20">
                {pdfDoc && Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1).map((num) => (
                   <button key={num} onClick={() => { setPageNumber(num); setIsSidebarOpen(false); }} className={`w-full text-left p-3 rounded-md text-sm ${pageNum === num ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}>Page {num}</button>
                ))}
             </div>
          </div>
          {/* 높이 100% 보장 및 Flex Center 적용 */}
          <div className="flex-1 overflow-auto bg-gray-200 dark:bg-slate-900 flex justify-center items-center p-4 relative h-full" ref={containerRef}>
             {isSidebarOpen && <div className="absolute inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)}/>}
             <div className="shadow-2xl"><canvas ref={canvasRef} className="bg-white block rounded-sm mx-auto"/></div>
          </div>
       </div>
       <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-2xl border flex items-center gap-6 z-50">
          <button onClick={() => setPageNumber(p => Math.max(1, p-1))}><ChevronLeft/></button>
          <span className="font-mono font-bold">{pageNum} / {pdfDoc?.numPages || '-'}</span>
          <button onClick={() => setPageNumber(p => Math.min(pdfDoc?.numPages || 1, p+1))}><ChevronRight/></button>
       </div>
    </div>
  );
};

const NewsFeed = ({ limit, isAdmin }) => {
  const [news, setNews] = useState([]);
  useEffect(() => {
    const f = async () => {
      if(!supabase) return;
      const { data } = await supabase.from('news').select('*').order('pub_date', { ascending: false }).limit(limit || 50);
      if(data) setNews(data);
    }; f();
  }, [limit]);

  // 뉴스 삭제 로직
  const handleDelete = async (id) => {
    if(confirm('이 뉴스를 삭제하시겠습니까?')) {
        await supabase.from('news').delete().eq('id', id);
        setNews(prev => prev.filter(n => n.id !== id));
    }
  };

  return (
    <div className={`w-full ${limit ? '' : 'max-w-7xl mx-auto px-4 py-16'}`}>
      <div className={`flex flex-col ${limit ? '' : 'border-t border-gray-200 dark:border-gray-700'}`}>
         {news.map((item, idx) => (
            <div key={idx} className="group flex flex-col md:flex-row gap-4 p-5 border-b border-gray-200 dark:border-gray-700 hover:bg-blue-50/50 transition-colors relative">
               <a href={item.link} target="_blank" className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                     <KRDSBadge variant={item.author?.includes('Google') ? 'primary' : 'success'}>{item.author || '뉴스'}</KRDSBadge>
                     <span className="text-xs text-gray-500 font-medium">{new Date(item.pub_date).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-bold text-base md:text-lg text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-1">{item.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">클릭하여 원문 기사를 확인하세요.</p>
               </a>
               <div className="flex items-center gap-2">
                   {!limit && <ArrowUpRight size={20} className="hidden md:block text-gray-300"/>}
                   {/* ✅ [5번 해결] 관리자 삭제 버튼 추가 */}
                   {isAdmin && <button onClick={(e) => {e.stopPropagation(); handleDelete(item.id)}} className="text-gray-300 hover:text-red-500 p-2"><Trash2 size={16}/></button>}
               </div>
            </div>
         ))}
      </div>
    </div>
  );
};

// ✅ [8번 해결] 소식 페이지에 공지사항/일정 탭 필터링 추가
const NoticeBoard = ({ userRole, onWriteClick, initialMode }) => {
  const [mode, setMode] = useState(initialMode || 'list');
  const [filter, setFilter] = useState('all'); // all, notice, event
  const [notices, setNotices] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const f = async () => { if(supabase) { const { data } = await supabase.from('notices').select('*').order('created_at', { ascending: false }); if(data) setNotices(data); }}; f();
  }, []);

  const handleDelete = async (id) => {
    if(confirm('삭제하시겠습니까?')) {
        await supabase.from('notices').delete().eq('id', id);
        setNotices(prev => prev.filter(n => n.id !== id));
    }
  };

  const getEvents = (date) => notices.filter(n => n.event_date && new Date(n.event_date).toDateString() === date.toDateString());
  
  // 필터링된 목록
  const filteredNotices = notices.filter(n => {
      if(filter === 'all') return true;
      if(filter === 'notice') return n.category !== 'event';
      if(filter === 'event') return n.category === 'event';
      return true;
  });

  return (
    <div className={`w-full ${initialMode ? '' : 'max-w-7xl mx-auto px-4 py-16'}`}>
      {!initialMode && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b gap-4">
           <h2 className="text-2xl font-bold flex items-center gap-2"><span className="w-1.5 h-6 bg-blue-600 rounded-sm"></span>소식 & 일정</h2>
           
           <div className="flex flex-wrap gap-2 w-full md:w-auto">
              {/* 탭 필터 버튼 */}
              <div className="bg-gray-100 p-1 rounded-md flex">
                  {['all', 'notice', 'event'].map(f => (
                      <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 text-xs font-bold rounded ${filter === f ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>
                          {f === 'all' ? '전체' : f === 'notice' ? '공지' : '행사'}
                      </button>
                  ))}
              </div>

              <div className="bg-gray-100 p-1 rounded-md flex"><button onClick={() => setMode('list')} className={`p-1.5 text-sm font-bold flex gap-1 ${mode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}><ListIcon size={16}/> 목록</button><button onClick={() => setMode('calendar')} className={`p-1.5 text-sm font-bold flex gap-1 ${mode === 'calendar' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}><CalendarIcon size={16}/> 달력</button></div>
              {(userRole === 'team' || userRole === 'admin') && <button onClick={() => onWriteClick('notice')} className="bg-[#2563EB] text-white px-4 py-2 rounded-md text-sm font-bold flex gap-2 items-center"><Plus size={16}/> 글쓰기</button>}
           </div>
        </div>
      )}
      {mode === 'list' ? (
        <div className="grid gap-4">
           {filteredNotices.map(n => (
              <div key={n.id} className="bg-white dark:bg-slate-800 p-5 rounded-lg border hover:border-blue-300 transition-colors shadow-sm relative group">
                 <div className="flex justify-between mb-2">
                    <KRDSBadge variant={n.category === 'event' ? 'primary' : 'neutral'}>{n.category === 'event' ? '행사' : '공지'}</KRDSBadge>
                    <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleDateString()}</span>
                 </div>
                 <h3 className="text-lg font-bold mb-2">{n.title}</h3>
                 <p className="text-sm text-gray-600 whitespace-pre-wrap">{n.content}</p>
                 {n.event_date && <div className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded border border-blue-100"><CalendarIcon size={14}/> 일정: {n.event_date}</div>}
                 
                 {/* ✅ [5번 해결] 관리자 삭제 버튼 */}
                 {(userRole === 'team' || userRole === 'admin') && 
                    <button onClick={() => handleDelete(n.id)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                 }
              </div>
           ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm h-full">
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
                 const daysEvents = notices.filter(n => n.event_date && new Date(n.event_date).toDateString() === d.toDateString());
                 return (
                    <div key={i} className={`min-h-[60px] md:min-h-[80px] bg-white dark:bg-slate-800 p-1 ${!isCurrentMonth ? 'bg-gray-50/50 dark:bg-slate-900/50 text-gray-300 dark:text-gray-600' : 'text-gray-900 dark:text-gray-200'}`}>
                       <span className={`text-xs font-bold inline-block w-5 h-5 text-center leading-5 rounded-full ${isToday ? 'bg-blue-600 text-white' : ''}`}>{d.getDate()}</span>
                       <div className="mt-1 flex flex-col gap-0.5">{daysEvents.map(ev => <div key={ev.id} className="text-[9px] bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-1 py-0.5 rounded truncate font-bold">{ev.title}</div>)}</div>
                    </div>
                 );
              })}
           </div>
        </div>
      )}
    </div>
  );
};

const Gallery = ({ userRole, onUploadClick, limit, isWidget }) => {
  const [images, setImages] = useState([]);
  const [selected, setSelected] = useState(null);
  useEffect(() => { const f = async () => { if(supabase) { let q = supabase.from('gallery').select('*').order('created_at', { ascending: false }); if(limit) q = q.limit(limit); const { data } = await q; if(data) setImages(data); }}; f(); }, [limit]);
  
  const handleDelete = async (id) => {
    if(confirm('사진을 삭제하시겠습니까?')) {
        await supabase.from('gallery').delete().eq('id', id);
        setImages(prev => prev.filter(img => img.id !== id));
    }
  };

  return (
    <div className={`w-full ${isWidget ? '' : 'max-w-7xl mx-auto px-4 py-16'}`}>
      {!isWidget && <div className="flex justify-between items-center mb-6 pb-4 border-b"><h2 className="text-2xl font-bold flex items-center gap-2"><span className="w-1.5 h-6 bg-blue-600 rounded-sm"></span>활동 갤러리</h2>{(userRole === 'team' || userRole === 'admin') && <button onClick={() => onUploadClick('gallery')} className="bg-[#2563EB] text-white px-4 py-2 rounded-md text-sm font-bold flex gap-2"><ImageIcon size={16}/> 사진 올리기</button>}</div>}
      <div className={`grid gap-4 ${isWidget ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
         {images.map(img => (
            <div key={img.id} onClick={() => setSelected(img)} className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden border hover:border-blue-400 hover:shadow-md cursor-pointer group relative">
               <div className="aspect-square bg-gray-100 overflow-hidden"><img src={img.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform"/></div>
               {!isWidget && <div className="p-3"><h4 className="font-bold text-sm truncate">{img.title}</h4><p className="text-xs text-gray-500 mt-1">{new Date(img.created_at).toLocaleDateString()}</p></div>}
               {/* ✅ [5번 해결] 갤러리 삭제 버튼 */}
               {!isWidget && (userRole === 'team' || userRole === 'admin') && 
                  <button onClick={(e) => {e.stopPropagation(); handleDelete(img.id)}} className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
               }
            </div>
         ))}
      </div>
      {selected && <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4" onClick={() => setSelected(null)}><img src={selected.image_url} className="max-w-full max-h-[90vh] rounded shadow-2xl"/><button className="absolute top-5 right-5 text-white/70"><X size={32}/></button></div>}
    </div>
  );
};

// ✅ [6번 해결] 썸네일 부활 (이미지 있으면 이미지 표시)
const IssueCard = ({ issue, onClick, isAdmin, onDelete }) => (
  <div onClick={() => onClick(issue)} className="group cursor-pointer flex flex-col bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:border-blue-500 hover:ring-1 hover:ring-blue-500 hover:shadow-lg transition-all">
    <div className={`aspect-[4/5] w-full ${issue.cover_color || 'bg-slate-50'} relative flex items-center justify-center border-b overflow-hidden`}>
      {/* 썸네일 이미지가 있으면 이미지 표시, 없으면 아이콘 표시 */}
      {issue.thumbnail_url || issue.image_url ? (
          <img src={issue.thumbnail_url || issue.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
      ) : (
          <div className="text-6xl group-hover:scale-105 transition-transform">{issue.icon || '📘'}</div>
      )}
      <div className="absolute top-0 left-0"><span className="inline-block bg-[#2563EB] text-white text-[11px] font-bold px-3 py-1.5 rounded-br-lg shadow-sm">Vol.{issue.vol}</span></div>
    </div>
    <div className="p-5 flex-1 flex flex-col">
      <div className="flex justify-between items-start mb-2"><span className="text-[12px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{issue.date}</span>{isAdmin && <button onClick={(e) => { e.stopPropagation(); onDelete(issue.id); }} className="text-gray-300 hover:text-red-600"><Trash2 size={16}/></button>}</div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-snug mb-2 group-hover:text-[#2563EB] transition-colors">{issue.title}</h3>
      <p className="text-sm text-gray-500 line-clamp-2 mt-auto">{issue.description || "내용 없음"}</p>
    </div>
  </div>
);

const Navbar = ({ isAdmin, onLoginClick, onLogout, onHomeClick, onViewChange, currentView, isDarkMode, toggleTheme }) => (
  <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 h-[70px] flex items-center shadow-sm">
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3 cursor-pointer group" onClick={onHomeClick}>
         <div className="w-10 h-10 bg-[#2563EB] rounded-lg flex items-center justify-center text-white font-black text-xl shadow-md group-hover:bg-[#1d4ed8] transition-colors">K</div>
         <div className="flex flex-col justify-center"><span className="font-bold text-lg leading-none tracking-tight group-hover:text-[#2563EB] transition-colors">지식 플랫폼</span><span className="text-[10px] font-bold text-gray-500 mt-0.5 tracking-wide">아이들의 미래를 잇는</span></div>
      </div>
      <nav className="hidden md:flex items-center gap-2">
        {['home', 'news', 'notice', 'issue_list', 'gallery'].map(key => (
          <button key={key} onClick={() => onViewChange(key)} className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${currentView === key ? 'bg-[#2563EB] text-white shadow-md' : 'text-gray-600 hover:bg-gray-100 hover:text-[#2563EB]'}`}>{key === 'home' ? '홈' : key === 'news' ? '뉴스룸' : key === 'notice' ? '소식' : key === 'issue_list' ? '자료실' : '갤러리'}</button>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <button onClick={toggleTheme} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">{isDarkMode ? <Sun size={20} className="text-yellow-400"/> : <Moon size={20}/>}</button>
        <button className="p-2 text-gray-400 hover:text-[#2563EB] hidden sm:block"><Search size={20}/></button>
        {isAdmin ? <button onClick={onLogout} className="px-3 py-1.5 border rounded-md text-xs font-bold text-gray-600 hover:bg-gray-100">로그아웃</button> : <Button variant="primary" size="medium" onClick={onLoginClick} className="shadow-sm">로그인</Button>}
      </div>
    </div>
  </header>
);

const MainApp = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('guest');
  // ✅ [4번 해결] 뒤로가기 지원을 위한 Custom Hook 사용
  const [view, setView] = useHistoryState('home');
  const [issues, setIssues] = useState([]);
  const [currentIssue, setCurrentIssue] = useState(null);
  const [currentArticle, setCurrentArticle] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadType, setUploadType] = useState('notice');
  const [isUploading, setIsUploading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      if (next) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark');
      return next;
    });
  };

  // ✅ [3번 해결] 강력한 로그아웃 로직
  const handleLogout = async () => {
    if(supabase) {
        await supabase.auth.signOut();
        localStorage.clear();
        window.location.href = '/'; // 강제 이동
    }
  };

  if (!supabase) return <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4"><div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border text-center"><AlertTriangle size={32} className="mx-auto text-red-500 mb-4"/><h1 className="text-xl font-bold mb-2">Supabase 설정 필요</h1><p className="text-gray-600 text-sm">Vercel 환경변수를 확인해주세요.</p></div></div>;

  useEffect(() => {
    const initAuth = async () => { const { data: { session } } = await supabase.auth.getSession(); if (session) { setUser(session.user); const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single(); setRole(data?.role || 'general'); }}; initAuth();
    const fetchIssues = async () => { const { data } = await supabase.from('issues').select('*').order('created_at', { ascending: false }); if (data) setIssues(data); }; fetchIssues();
  }, []);

  const handleUpload = async (data) => {
    setIsUploading(true);
    try {
       if (data.type === 'notice') await supabase.from('notices').insert([{ title: data.title, content: data.content, event_date: data.event_date || null, category: data.event_date ? 'event' : 'notice', author_id: user.id }]);
       else if (data.type === 'gallery' && data.file) { const fn = `${Date.now()}_${data.file.name}`; await supabase.storage.from('gallery').upload(fn, data.file); const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(fn); await supabase.from('gallery').insert([{ title: data.title, image_url: publicUrl, author_id: user.id }]); }
       else if (data.type === 'issue') await supabase.from('issues').insert([{ vol: data.vol, title: data.title, description: data.description, date: new Date().toLocaleDateString(), cover_color: 'bg-blue-100', icon: '📘' }]);
       else if (data.type === 'article' && currentIssue) { let fileUrl = ''; if (data.file) { const fn = `${Date.now()}.pdf`; await supabase.storage.from('files').upload(fn, data.file); fileUrl = supabase.storage.from('files').getPublicUrl(fn).data.publicUrl; } const updated = [...(currentIssue.articles || []), { id: Date.now(), title: data.title, fileUrl, views: 0 }]; await supabase.from('issues').update({ articles: updated }).eq('id', currentIssue.id); setCurrentIssue({...currentIssue, articles: updated}); }
       alert("완료되었습니다!"); setIsUploadOpen(false); if (data.type !== 'article') window.location.reload();
    } catch (e) { alert("오류: " + e.message); } finally { setIsUploading(false); }
  };
  const handleDeleteIssue = async (id) => { if(confirm('삭제하시겠습니까?')) { await supabase.from('issues').delete().eq('id', id); window.location.reload(); }};

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
       <Navbar isAdmin={role === 'admin' || user} onLoginClick={() => setIsAuthOpen(true)} onLogout={handleLogout} onHomeClick={() => setView('home')} onViewChange={setView} currentView={view} isDarkMode={isDarkMode} toggleTheme={toggleTheme}/>
       <main className="flex-1 pb-24 w-full">
          {view === 'home' && (
             <div className="animate-in fade-in space-y-12 pb-20">
                <section className="bg-gray-50 dark:bg-slate-800 py-12 md:py-20 border-b border-gray-200 dark:border-gray-700">
                   <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                      <div><span className="inline-block py-1 px-3 rounded bg-blue-100 text-blue-700 text-xs font-bold mb-4">Beta v25.8.3</span><h1 className="text-4xl md:text-5xl font-black leading-tight mb-6">아이들의 내일을 잇는<br/><span className="text-[#2563EB] dark:text-blue-400">지식 플랫폼.</span></h1><p className="text-gray-600 text-lg mb-8 leading-relaxed">선생님과 부모님을 위한 필수 지식과<br/>다양한 교육 자료를 한곳에서 만나보세요.</p><div className="flex gap-4"><button onClick={() => setView('issue_list')} className="px-8 py-4 bg-[#2563EB] text-white rounded-md font-bold shadow-md hover:bg-[#1d4ed8] flex items-center gap-2">자료실 바로가기 <ArrowRight size={18}/></button></div></div>
                      <div className="relative h-[250px] md:h-[350px] bg-white dark:bg-slate-700 rounded-2xl border shadow-xl flex items-center justify-center p-10">{issues[0] ? (<div className="text-center"><div className="text-xs font-bold text-gray-400 mb-2">LATEST ISSUE</div><div className="text-8xl mb-4 animate-bounce-slow">{issues[0].icon}</div><h3 className="text-2xl font-black">{issues[0].title}</h3></div>) : <div className="text-gray-300 font-bold">발행된 호수가 없습니다.</div>}</div>
                   </div>
                </section>
                <section className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-10">
                   <div className="lg:col-span-5 flex flex-col h-[520px]"><div className="flex justify-between items-end mb-4 border-b-2 border-gray-900 dark:border-gray-100 pb-2"><h3 className="text-2xl font-black flex items-center gap-2"><Newspaper size={24} className="text-blue-600"/> 뉴스룸</h3><button onClick={() => setView('news')} className="text-sm font-bold text-gray-500 hover:text-blue-600 flex items-center gap-1">전체보기 <ChevronRight size={14}/></button></div><div className="flex-1 overflow-y-auto border rounded-lg bg-white dark:bg-slate-800 shadow-sm"><NewsFeed limit={10} isAdmin={role === 'admin'} /></div></div>
                   <div className="lg:col-span-4 flex flex-col h-[520px]"><div className="flex justify-between items-end mb-4 border-b-2 border-gray-900 dark:border-gray-100 pb-2"><h3 className="text-2xl font-black flex items-center gap-2"><CalendarIcon size={24} className="text-blue-600"/> 이달의 일정</h3><button onClick={() => setView('notice')} className="text-sm font-bold text-gray-500 hover:text-blue-600 flex items-center gap-1">전체보기 <ChevronRight size={14}/></button></div><div className="flex-1 border rounded-lg overflow-hidden bg-white dark:bg-slate-800 shadow-sm"><NoticeBoard userRole={role} onWriteClick={()=>{}} initialMode='calendar' /></div></div>
                   <div className="lg:col-span-3 flex flex-col h-[520px]"><div className="flex justify-between items-end mb-4 border-b-2 border-gray-900 dark:border-gray-100 pb-2"><h3 className="text-2xl font-black flex items-center gap-2"><ImageIcon size={24} className="text-blue-600"/> 갤러리</h3><button onClick={() => setView('gallery')} className="text-sm font-bold text-gray-500 hover:text-blue-600 flex items-center gap-1">전체보기 <ChevronRight size={14}/></button></div><div className="flex-1 overflow-y-auto"><Gallery userRole={role} onUploadClick={()=>{}} limit={4} isWidget={true} /></div></div>
                </section>
                <section className="max-w-7xl mx-auto px-4"><div className="flex items-center justify-between mb-4 border-b pb-2"><h2 className="text-xl font-bold">월간 자료실</h2><button onClick={() => setView('issue_list')} className="text-sm font-bold text-gray-500 hover:text-blue-600 flex items-center gap-1">전체보기 <ChevronRight size={16}/></button></div><div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">{issues.slice(0, 6).map(issue => <div key={issue.id} className="transform scale-95 origin-top-left"><IssueCard issue={issue} onClick={(i) => {setCurrentIssue(i); setView('issue_detail');}} isAdmin={role === 'admin'} onDelete={handleDeleteIssue}/></div>)}</div></section>
             </div>
          )}
          {view === 'news' && <NewsFeed isAdmin={role === 'admin'}/>}
          {view === 'notice' && <NoticeBoard userRole={role} onWriteClick={(t) => { setUploadType(t); setIsUploadOpen(true);}}/>}
          {view === 'gallery' && <Gallery userRole={role} onUploadClick={(t) => { setUploadType(t); setIsUploadOpen(true); }}/>}
          {view === 'issue_list' && <div className="pt-10 max-w-7xl mx-auto px-4"><div className="flex items-center justify-between mb-8 pb-4 border-b"><h2 className="text-3xl font-bold">월간 자료실</h2>{role === 'admin' && <button onClick={() => { setUploadType('issue'); setIsUploadOpen(true); }} className="bg-[#2563EB] text-white px-5 py-2.5 rounded-md font-bold shadow-sm flex items-center gap-2"><Plus size={18}/> 호수 발행</button>}</div><div className="grid grid-cols-2 md:grid-cols-4 gap-6">{issues.map(issue => <IssueCard key={issue.id} issue={issue} onClick={(i) => {setCurrentIssue(i); setView('issue_detail');}} isAdmin={role === 'admin'} onDelete={handleDeleteIssue}/>)}</div></div>}
          {view === 'issue_detail' && currentIssue && <div className="max-w-5xl mx-auto px-4 py-10 animate-in slide-in-from-right"><button onClick={() => setView('issue_list')} className="mb-6 flex items-center gap-2 font-bold text-gray-500 hover:text-blue-600"><ArrowLeft size={20}/> 목록으로 돌아가기</button><div className="bg-white dark:bg-slate-800 border rounded-lg p-8 md:p-12 mb-10 shadow-sm flex flex-col md:flex-row gap-8 items-start"><div className="w-24 h-24 bg-blue-50 rounded-lg flex items-center justify-center text-5xl border border-blue-100 text-blue-600">{currentIssue.icon}</div><div><span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded mb-3">Vol.{currentIssue.vol}</span><h1 className="text-3xl font-black mb-4">{currentIssue.title}</h1><p className="text-gray-600 leading-relaxed max-w-2xl">{currentIssue.description}</p></div></div><div className="flex justify-between items-center mb-6 pb-4 border-b"><h3 className="text-xl font-bold flex items-center gap-2"><span className="w-1.5 h-6 bg-blue-600 rounded-sm"></span>수록 자료 목록</h3>{role === 'admin' && <button onClick={() => { setUploadType('article'); setIsUploadOpen(true);}} className="flex items-center gap-2 shadow-sm bg-[#2563EB] text-white px-4 py-2 rounded-md font-bold"><Plus size={18} /> 자료 추가</button>}</div><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{currentIssue.articles?.map(art => <div key={art.id} onClick={() => { setCurrentArticle(art); setView('article_view'); }} className="group p-5 bg-white dark:bg-slate-800 border rounded-lg hover:border-blue-400 hover:shadow-md cursor-pointer transition-all flex items-center gap-4"><div className="w-12 h-12 bg-gray-50 rounded-md flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors"><FileText size={24}/></div><div className="flex-1"><div className="font-bold group-hover:text-blue-600 transition-colors">{art.title}</div><div className="flex items-center gap-2 text-xs text-gray-400 mt-1"><span>PDF 문서</span>{art.views > 0 && <span className="flex items-center gap-0.5 text-blue-500 font-bold"><Eye size={10}/> {art.views}</span>}</div></div><ArrowRight className="ml-auto text-gray-300 group-hover:text-blue-400"/></div>)}{(!currentIssue.articles || currentIssue.articles.length === 0) && <div className="col-span-full py-10 text-center text-gray-400 border border-dashed rounded-lg">등록된 자료가 없습니다.</div>}</div></div>}
          {view === 'article_view' && currentArticle && <CustomPDFViewer article={currentArticle} onBack={() => setView('issue_detail')}/>}
       </main>
       <Footer />
       <BottomNav currentView={view} onViewChange={setView} />
       <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onLoginSuccess={() => window.location.reload()}/>
       <UniversalUploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} type={uploadType} isUploading={isUploading} onSubmit={handleUpload}/>
    </div>
  );
};

export default function App() { return <MainApp />; }
