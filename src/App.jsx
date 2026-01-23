import React, { useState, useEffect, useRef } from 'react';
import { 
  Book, FileText, User, LogOut, ChevronRight, ArrowLeft, 
  Plus, Trash2, ChevronLeft,  
  X, Newspaper, Calendar as CalendarIcon, 
  Star, Image as ImageIcon, List as ListIcon,
  RefreshCw, ArrowRight, ArrowUpRight, Paperclip, Loader2, Home, Search, Menu,
  Sun, Moon, Eye, Megaphone,
  ZoomIn, ZoomOut, Download, Share2, Check, AlertTriangle 
} from 'lucide-react';

// ✅ [수정됨] TextArea 제거 (에러 원인 해결)
import { Button, Input, Badge } from 'krds-react';

// ✅ [Supabase 클라이언트] CDN 방식
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// 🚀 [Production 설정]
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// --- [유틸리티] 컨테이너 크기 감지 ---
const useContainerSize = (ref) => {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const updateSize = () => { if (ref.current) setSize({ width: ref.current.clientWidth, height: ref.current.clientHeight }); };
    window.addEventListener('resize', updateSize); updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, [ref]);
  return size;
};

// --- [유틸리티] PDF 라이브러리 로드 ---
const loadPdfScript = () => {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) { resolve(window.pdfjsLib); return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; resolve(window.pdfjsLib); };
    document.head.appendChild(script);
  });
};

// --- [유틸리티] 조회수 증가 ---
const incrementViewCount = async (table, id, currentViews) => {
  if (!supabase) return;
  try { await supabase.from(table).update({ views: (currentViews || 0) + 1 }).eq('id', id);
  } 
  catch (e) { console.error("조회수 업데이트 실패:", e); }
};

// --- [컴포넌트] 하단 네비게이션 (모바일) ---
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

// --- [컴포넌트] PC 푸터 ---
const Footer = () => (
  <footer className="hidden md:block w-full bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-gray-800 py-12 mt-auto z-10 relative">
    <div className="max-w-7xl mx-auto px-4 text-center">
       <div className="flex justify-center gap-8 mb-6">
          <button className="text-sm font-bold text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">이용약관</button>
          <button className="text-sm font-bold text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">개인정보처리방침</button>
          <button className="text-sm font-bold text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">운영 정책</button>
       </div>
       <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
          © 2026 아이들의 미래를 잇는 지식 플랫폼. All rights reserved.<br/>
          Contact: help@korea-kids-platform.kr
       </p>
    </div>
  </footer>
);

// --- [컴포넌트] 인증 모달 ---
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
    } catch (err) { setError(err.message); } finally { setLoading(false);
    }
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
              <Input 
                type="email" 
                placeholder="example@korea.kr" 
                size="medium"
                className="w-full"
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">비밀번호</label>
              <Input 
                type="password" 
                placeholder="********" 
                size="medium"
                className="w-full"
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required
              />
            </div>
            {error && <p className="text-red-600 dark:text-red-400 text-xs font-bold bg-red-50 dark:bg-red-900/30 p-2 rounded">{error}</p>}
            
            <Button 
              type="submit" 
              disabled={loading} 
              variant="primary"
              size="large"
              className="w-full"
            >
              {loading ? '처리 중...' : (isSignUp ? '가입하기' : '로그인')}
            </Button>
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

// --- [컴포넌트] 업로드 모달 ---
const UniversalUploadModal = ({ isOpen, onClose, onSubmit, type, isUploading }) => {
  if (!isOpen) return null;
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '', event_date: '', description: '', vol: '' });
  const getInputClass = "w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white";
  const getLabelClass = "block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1";
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
            <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-blue-600 mb-2"/> <p className="text-sm text-gray-600 dark:text-gray-400">데이터를 전송 중입니다...</p></div> : (
               <form onSubmit={(e) => { e.preventDefault(); onSubmit({...formData, file, type}); }} className="space-y-5">
                  {type === 'issue' && <div><label className={getLabelClass}>호수 (Vol) <span className="text-red-500">*</span></label><input className={getInputClass} placeholder="예: 24" value={formData.vol} onChange={e => setFormData({...formData, vol: e.target.value})}/></div>}
                  <div><label className={getLabelClass}>제목 <span className="text-red-500">*</span></label><input className={getInputClass} placeholder="제목을 입력하세요" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}/></div>
                  {type === 'notice' && (
                     <>
                        <div>
                          <label className={getLabelClass}>내용 <span className="text-red-500">*</span></label>
                          {/* ✅ [수정됨] TextArea 에러 방지를 위해 기본 HTML textarea로 롤백 */}
                          <textarea 
                            className={`${getInputClass} h-32 resize-none`} 
                            placeholder="공지 내용을 입력하세요" 
                            value={formData.content} 
                            onChange={e => setFormData({...formData, content: e.target.value})}
                          />
                        </div>
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
                                   <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500"><span>파일 업로드</span><input type="file" className="sr-only" onChange={e => setFile(e.target.files[0])}/></label>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-500">{file ? file.name : (type === 'gallery' ? 'PNG, JPG up to 10MB' : 'PDF only')}</p>
                           </div>
                           <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={e => setFile(e.target.files[0])}/>
                        </div>
                     </div>
                  )}
                  <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700 mt-6">
                     <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-sm">취소</button>
                     <Button type="submit" variant="primary" size="medium" className="flex-1 shadow-sm">
                        등록 완료
                     </Button>
                  </div>
               </form>
            )}
         </div>
      </div>
    </div>
  );
};

// --- [PC/Mobile 하이브리드 PDF 뷰어] ---
const CustomPDFViewer = ({ article, onBack }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const contentWrapperRef = useRef(null);
  const size = useContainerSize(containerRef);

  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNum, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // 제스처 Refs
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const pinchStartDist = useRef(0);
  const pinchStartScale = useRef(1);
  const isPinching = useRef(false);

  useEffect(() => {
    const loadPdf = async () => {
      try {
        await loadPdfScript(); 
        if (!window.pdfjsLib) return;
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const doc = await window.pdfjsLib.getDocument(article.fileUrl || article.file_url).promise;
        setPdfDoc(doc);
        incrementViewCount('articles', article.id, article.views);
      } catch (err) { console.error("PDF Load Error:", err); alert("문서를 불러올 수 없습니다."); }
    };
    loadPdf();
  }, [article]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || !containerRef.current) return;
    let isCancelled = false;
    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const unscaledViewport = page.getViewport({ scale: 1.0 });
        const containerWidth = containerRef.current.clientWidth;
        const autoScale = (containerWidth / unscaledViewport.width) * 0.98;
        const finalScale = scale * autoScale; 
        const viewport = page.getViewport({ scale: finalScale });
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        canvas.style.width = '100%';
        canvas.style.height = '100%';

        if (!isCancelled) await page.render({ canvasContext: ctx, viewport }).promise;
      } catch (err) { console.error(err); }
    };
    renderPage();
    return () => { isCancelled = true; };
  }, [pdfDoc, pageNum, scale, size]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') setPageNumber(p => Math.max(1, p - 1));
      if (e.key === 'ArrowRight') setPageNumber(p => Math.min(pdfDoc?.numPages || 1, p + 1));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pdfDoc]);

  const getTouchDistance = (touches) => Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      isPinching.current = true;
      pinchStartDist.current = getTouchDistance(e.touches);
      pinchStartScale.current = scale;
    } else {
      isPinching.current = false;
      touchStartX.current = e.changedTouches[0].screenX;
    }
  };
  const handleTouchMove = (e) => {
    if (isPinching.current && e.touches.length === 2 && contentWrapperRef.current) {
        e.preventDefault();
        const dist = getTouchDistance(e.touches);
        const ratio = dist / pinchStartDist.current;
        contentWrapperRef.current.style.transform = `scale(${ratio})`;
    }
  };
  const handleTouchEnd = (e) => {
    if (isPinching.current) {
        if(contentWrapperRef.current) contentWrapperRef.current.style.transform = 'none';
        isPinching.current = false;
    } else {
        touchEndX.current = e.changedTouches[0].screenX;
        const diff = touchStartX.current - touchEndX.current;
        if (Math.abs(diff) > 50) {
             if (diff > 0) setPageNumber(p => Math.min(pdfDoc?.numPages || 1, p + 1));
             else setPageNumber(p => Math.max(1, p - 1));
        }
    }
  };
  const handleDownload = () => window.open(article.fileUrl || article.file_url, '_blank');
  const handleShareURL = async () => {
     try { await navigator.share({ title: article.title, url: window.location.href });
     } 
     catch { alert("주소가 복사되었습니다."); }
  };
  return (
    <div className="fixed inset-0 bg-gray-100 dark:bg-slate-900 z-[150] flex flex-col h-screen w-screen text-left animate-in slide-in-from-right">
       <div className="h-16 bg-white dark:bg-slate-800 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 shrink-0 shadow-sm z-50">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full"><ArrowLeft className="text-gray-700 dark:text-white"/></button>
            <h2 className="font-bold text-gray-900 dark:text-white truncate max-w-[150px] md:max-w-md">{article.title}</h2>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
             <div className="hidden md:flex items-center bg-gray-100 dark:bg-slate-700 rounded-lg mr-2">
                <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-600 rounded text-gray-600 dark:text-gray-200"><ZoomOut size={18}/></button>
                <span className="text-xs w-10 text-center font-bold text-gray-600 dark:text-gray-200">{Math.round(scale * 100)}%</span>
                <button onClick={() => setScale(s => Math.min(3.0, s + 0.2))} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-600 rounded text-gray-600 dark:text-gray-200"><ZoomIn size={18}/></button>
             </div>
             <button onClick={handleDownload} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-600 dark:text-gray-200" title="다운로드"><Download size={20}/></button>
             <button onClick={handleShareURL} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-600 dark:text-gray-200" title="공유"><Share2 size={20}/></button>
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-2 rounded-full transition-colors ${isSidebarOpen ?
                'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-200'}`}><ListIcon size={20}/></button>
          </div>
       </div>

       <div className="flex-1 overflow-hidden flex relative">
          <div className={`absolute md:static inset-y-0 left-0 w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 z-40 ${isSidebarOpen ?
             'translate-x-0' : '-translate-x-full md:hidden'}`}>
             <div className="p-4 font-bold border-b border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white">목차 ({pdfDoc?.numPages}p)</div>
             <div className="overflow-y-auto h-full p-2 space-y-1 pb-20">
                {pdfDoc && Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1).map((num) => (
                   <button 
                      key={num} 
                      onClick={() => { setPageNumber(num); if(window.innerWidth < 768) setIsSidebarOpen(false); }}
                      className={`w-full text-left p-3 rounded-md text-sm flex items-center justify-between ${pageNum === num ? 'bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400' : 'hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300'}`}
                   >
                      <span>Page {num}</span>
                      {pageNum === num && <Check size={14}/>}
                   </button>
                ))}
             </div>
          </div>

          <div 
             className="flex-1 overflow-auto bg-gray-100 dark:bg-slate-900 flex justify-center items-start p-4 relative group"
             ref={containerRef}
             onTouchStart={handleTouchStart}
             onTouchMove={handleTouchMove}
             onTouchEnd={handleTouchEnd}
          >
             {isSidebarOpen && <div className="absolute inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)}/>}
             
             {/* 모바일 전용 좌우 반투명 페이지 넘김 버튼 */}
             <div className="absolute left-0 top-0 bottom-0 w-[15%] z-10 hover:bg-black/5 active:bg-black/10 transition-colors cursor-pointer md:hidden flex items-center justify-start pl-2" onClick={(e) => 
                { e.stopPropagation(); setPageNumber(p => Math.max(1, p - 1)); }}>
                <ChevronLeft className="text-gray-400/50" size={32} />
             </div>
             <div className="absolute right-0 top-0 bottom-0 w-[15%] z-10 hover:bg-black/5 active:bg-black/10 transition-colors cursor-pointer md:hidden flex items-center justify-end pr-2" onClick={(e) => { e.stopPropagation();
                setPageNumber(p => Math.min(pdfDoc?.numPages || 1, p + 1)); }}>
               <ChevronRight className="text-gray-400/50" size={32} />
             </div>

             <div ref={contentWrapperRef} className="shadow-lg transition-transform duration-75 ease-out origin-top w-full">
                <canvas ref={canvasRef} className="bg-white block rounded-sm mx-auto"/>
             </div>
          </div>
       </div>

       <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-slate-800/90 backdrop-blur px-4 py-2 rounded-full shadow-2xl border border-gray-200 dark:border-gray-600 flex items-center gap-6 z-50">
          <button onClick={() => setPageNumber(p => Math.max(1, p-1))} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-gray-700 dark:text-white"><ChevronLeft/></button>
          <span className="font-mono font-bold text-gray-800 dark:text-white">{pageNum} / {pdfDoc?.numPages || '-'}</span>
          <button onClick={() => setPageNumber(p => Math.min(pdfDoc?.numPages || 1, p+1))} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-gray-700 dark:text-white"><ChevronRight/></button>
       </div>
    </div>
  );
};

// --- [뉴스룸] ---
const NewsFeed = ({ limit, isAdmin }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const fetchNews = async () => {
    if(!supabase) return;
    if (news.length > 0) setIsRefreshing(true);
    else setLoading(true);
    const { data } = await supabase.from('news').select('*').order('pub_date', { ascending: false }).limit(limit || 50);
    if(data) setNews(data);
    setLoading(false);
    setIsRefreshing(false);
  };
  useEffect(() => { fetchNews(); }, [limit]);

  if (loading && !isRefreshing) return <div className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-600"/></div>;
  return (
    <div className={`w-full ${limit ? '' : 'max-w-7xl mx-auto px-4 py-16'}`}>
      {!limit && (
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="w-1.5 h-6 bg-blue-600 inline-block rounded-sm"></span>
               뉴스룸
              </h2>
             <button onClick={fetchNews} disabled={isRefreshing} className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 transition-all" title="뉴스 새로고침">
                 <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
              </button>
          </div>
      </div>
      )}
      
      <div className={`flex flex-col ${limit ? '' : 'border-t border-gray-200 dark:border-gray-700'}`}>
         {news.map((item, idx) => (
            <a key={idx} href={item.link} target="_blank" className="group flex flex-col md:flex-row gap-4 p-5 border-b border-gray-200 dark:border-gray-700 hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-colors">
               <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                     <Badge 
                        variant={item.author?.includes('Google') ? 'primary' : 'success'} 
                        shape="round" 
                        size="small"
                     >
                       {item.author || '뉴스'}
                     </Badge>
                     <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{new Date(item.pub_date).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-bold text-base md:text-lg text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">{item.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">클릭하여 원문 기사를 확인하세요.</p>
               </div>
               {!limit && <div className="hidden md:flex items-center text-gray-300 dark:text-gray-600 group-hover:text-blue-400 dark:group-hover:text-blue-400"><ArrowUpRight size={20}/></div>}
            </a>
         ))}
         {news.length === 0 && <div className="text-center py-10 text-gray-400 dark:text-gray-500 border-b border-gray-200 dark:border-gray-700">등록된 뉴스가 없습니다.</div>}
      </div>
    </div>
  );
};

// --- [공지사항/캘린더] ---
const NoticeBoard = ({ userRole, onWriteClick, initialMode }) => {
  const [mode, setMode] = useState(initialMode || 'list');
  const [notices, setNotices] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  useEffect(() => {
    const fetchNotices = async () => {
      if(!supabase) return;
      const { data } = await supabase.from('notices').select('*').order('created_at', { ascending: false });
      if (data) setNotices(data);
    };
    fetchNotices();
  }, []);
  const getEvents = (date) => notices.filter(n => n.event_date && new Date(n.event_date).toDateString() === date.toDateString());
  return (
    <div className={`w-full ${initialMode ? '' : 'max-w-7xl mx-auto px-4 py-16'}`}>
      {!initialMode && (
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
           <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="w-1.5 h-6 bg-blue-600 inline-block rounded-sm"></span>
              소식 & 일정
           </h2>
           <div className="flex gap-2">
              <div className="bg-gray-100 dark:bg-slate-800 p-1 rounded-md flex border border-gray-200 dark:border-gray-600">
                 <button onClick={() => setMode('list')} className={`p-1.5 rounded-sm text-sm font-bold flex items-center gap-1 ${mode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}><ListIcon size={16}/> 목록</button>
                 <button onClick={() => setMode('calendar')} className={`p-1.5 rounded-sm text-sm font-bold flex items-center gap-1 ${mode === 'calendar' ?
                  'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}><CalendarIcon size={16}/> 달력</button>
              </div>
              {(userRole === 'team' || userRole === 'admin') && 
                 <button onClick={() => onWriteClick('notice')} className="bg-[#2563EB] text-white px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 hover:bg-[#1d4ed8] transition-colors"><Plus size={16}/> 글쓰기</button>
              }
           </div>
        </div>
      )}
      
      {mode === 'list' ?
      (
        <div className="grid gap-4">
           {notices.map(n => (
              <div key={n.id} className="bg-white dark:bg-slate-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors shadow-sm">
                 <div className="flex justify-between mb-2">
                    <Badge 
                       variant={n.category === 'event' ? 'primary' : 'neutral'} 
                       size="small"
                    >
                       {n.category === 'event' ? '행사' : '공지'}
                    </Badge>
                    <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleDateString()}</span>
                 </div>
                 <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{n.title}</h3>
                 <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{n.content}</p>
                 {n.event_date && <div className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded border border-blue-100 dark:border-blue-800"><CalendarIcon size={14}/> 일정: {n.event_date}</div>}
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
                 return (
                    <div key={i} className={`min-h-[60px] md:min-h-[80px] bg-white dark:bg-slate-800 p-1 ${!isCurrentMonth ? 'bg-gray-50/50 dark:bg-slate-900/50 text-gray-300 dark:text-gray-600' : 'text-gray-900 dark:text-gray-200'}`}>
                       <span className={`text-xs font-bold inline-block w-5 h-5 text-center leading-5 rounded-full ${isToday ? 'bg-blue-600 text-white' : ''}`}>{d.getDate()}</span>
                       <div className="mt-1 flex flex-col gap-0.5">{getEvents(d).map(ev => <div key={ev.id} className="text-[9px] bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-1 py-0.5 rounded truncate font-bold">{ev.title}</div>)}</div>
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
const Gallery = ({ userRole, onUploadClick, limit, isWidget }) => {
  const [images, setImages] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const fetchImages = async () => {
      if(!supabase) return;
      let query = supabase.from('gallery').select('*').order('created_at', { ascending: false });
      if(limit) query = query.limit(limit);
      const { data } = await query;
      if (data) setImages(data);
    };
    fetchImages();
  }, [limit]);
  return (
    <div className={`w-full ${isWidget ? '' : 'max-w-7xl mx-auto px-4 py-16'}`}>
      {!isWidget && (
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
             <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-blue-600 inline-block rounded-sm"></span>
                활동 갤러리
             </h2>
             {(userRole === 'team' || userRole === 'admin') && <button onClick={() => onUploadClick('gallery')} className="bg-[#2563EB] text-white px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 hover:bg-[#1d4ed8] transition-colors"><ImageIcon size={16}/> 사진 올리기</button>}
          </div>
      )}
      <div className={`grid gap-4 ${isWidget ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
         {images.map(img => (
            <div key={img.id} onClick={() => setSelected(img)} className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group">
               <div className="aspect-square overflow-hidden bg-gray-100 dark:bg-slate-700">
                   <img src={img.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
               </div>
               {!isWidget && (
                   <div className="p-3">
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">{img.title}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(img.created_at).toLocaleDateString()}</p>
                   </div>
                )}
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

// --- [자료실 (Issue Card)] ---
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

// --- [네비게이션 (Navbar)] ---
const Navbar = ({ isAdmin, onLoginClick, onLogout, onHomeClick, onViewChange, currentView, isDarkMode, toggleTheme }) => (
  <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 h-[70px] flex items-center shadow-sm transition-colors">
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3 cursor-pointer group" onClick={onHomeClick}>
         <div className="w-10 h-10 bg-[#2563EB] rounded-lg flex items-center justify-center text-white font-black text-xl shadow-md group-hover:bg-[#1d4ed8] transition-colors">K</div>
         <div className="flex flex-col justify-center">
             <span className="font-bold text-lg text-gray-900 dark:text-white leading-none tracking-tight group-hover:text-[#2563EB] dark:group-hover:text-blue-400 transition-colors">지식 플랫폼</span>
           <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mt-0.5 tracking-wide">아이들의 미래를 잇는</span>
         </div>
      </div>
      
      <nav className="hidden md:flex items-center gap-2">
        {['home', 'news', 'notice', 'issue_list', 'gallery'].map(key => (
          <button 
             key={key} 
             onClick={() => onViewChange(key)} 
             className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                currentView === key 
                ? 'bg-[#2563EB] text-white shadow-md' 
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-[#2563EB] dark:hover:text-blue-300'
             }`}
          >
             {key === 'home' ? '홈' : key === 'news' ? '뉴스룸' : key === 'notice' ? '소식' : key === 'issue_list' ? '자료실' : '갤러리'}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <button onClick={toggleTheme} className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
           {isDarkMode ? <Sun size={20} className="text-yellow-400"/> : <Moon size={20}/>}
        </button>

        <button className="p-2 text-gray-400 hover:text-[#2563EB] transition-colors hidden sm:block"><Search size={20}/></button>
        {isAdmin ? (
          <button onClick={onLogout} className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">로그아웃</button>
        ) : (
          <Button 
            variant="primary" 
            size="medium" 
            onClick={onLoginClick}
            className="shadow-sm"
          >
            로그인
          </Button>
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

  const [isDarkMode, setIsDarkMode] = useState(false);
  // ✅ [수정] 테마 토글 로직: documentElement에 직접 class 적용
  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      if (next) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      return next;
    });
  };

  if (!supabase) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-center p-4 flex-col">
         <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-200">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} strokeWidth={2.5}/>
            </div>
             <h1 className="text-2xl font-black text-gray-900 mb-2">Supabase 설정 필요</h1>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
               앱을 실행하려면 <strong>Supabase API Key</strong>가 필요합니다.<br/>
               Vercel 배포 시, <strong>Environment Variables</strong> 설정에<br/>
               <code>VITE_SUPABASE_URL</code> 및 <code>VITE_SUPABASE_ANON_KEY</code>를<br/>
               반드시 추가해 주세요.
             </p>
         </div>
      </div>
    );
  }

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
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
       <Navbar 
          isAdmin={role === 'admin' || user} 
          onLoginClick={() => setIsAuthOpen(true)}
          onLogout={async () => {if(supabase) { await supabase.auth.signOut(); window.location.reload(); }}}
          onHomeClick={() => setView('home')}
          onViewChange={setView}
          currentView={view}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
       />

       {/* ✅ [수정] Main 영역 flex-1을 주어 푸터가 하단으로 밀리도록 보장 */}
       <main className="flex-1 pb-24 w-full">
          {view === 'home' && (
             <div className="animate-in fade-in space-y-12 pb-20">
              
                 {/* 1. 히어로 섹션 */}
                <section className="bg-gray-50 dark:bg-slate-800 py-12 md:py-20 border-b border-gray-200 dark:border-gray-700">
                   <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                      <div>
                          <span className="inline-block py-1 px-3 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold mb-4">Beta v25.7.1</span>
                         <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white leading-tight mb-6">
                            아이들의 내일을 잇는<br/>
                             <span className="text-[#2563EB] dark:text-blue-400">지식 플랫폼.</span>
                         </h1>
                         <p className="text-gray-600 dark:text-gray-300 text-lg mb-8 leading-relaxed">
                            선생님과 부모님을 위한 필수 지식과<br/>
                             다양한 교육 자료를 한곳에서 만나보세요.
                         </p>
                         <div className="flex gap-4">
                            <button onClick={() => setView('issue_list')} className="px-8 py-4 bg-[#2563EB] text-white rounded-md font-bold shadow-md hover:bg-[#1d4ed8] transition-all flex items-center gap-2">
                                자료실 바로가기 <ArrowRight size={18}/>
                            </button>
                         </div>
                      </div>
                    
                     <div className="relative h-[250px] md:h-[350px] bg-white dark:bg-slate-700 rounded-2xl border border-gray-200 dark:border-gray-600 shadow-xl overflow-hidden flex items-center justify-center p-10">
                         {issues[0] ?
                           (
                            <div className="text-center">
                               <div className="text-xs font-bold text-gray-400 mb-2">LATEST ISSUE</div>
                               <div className="text-8xl mb-4 animate-bounce-slow">{issues[0].icon}</div>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white">{issues[0].title}</h3>
                            </div>
                         ) : <div className="text-gray-300 font-bold">발행된 호수가 없습니다.</div>}
                       </div>
                   </div>
                </section>

                {/* ✅ [수정] 3단 구성 그리드 (헤더 가독성 강화 + 더보기 버튼 추가) */}
                <section className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-10">
                   
                   {/* 1) 뉴스룸 */}
                   <div className="lg:col-span-5 flex flex-col h-[520px]">
                      <div className="flex justify-between items-end mb-4 border-b-2 border-gray-900 dark:border-gray-100 pb-2">
                          <h3 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                            <Newspaper size={24} className="text-blue-600"/> 뉴스룸
                         </h3>
                          <button onClick={() => setView('news')} className="text-sm font-bold text-gray-500 hover:text-blue-600 flex items-center gap-1">전체보기 <ChevronRight size={14}/></button>
                      </div>
                      <div className="flex-1 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-slate-800 shadow-sm">
                         <NewsFeed limit={10} isAdmin={false} />
                      </div>
                   </div>

                   {/* 2) 일정 */}
                   <div className="lg:col-span-4 flex flex-col h-[520px]">
                       <div className="flex justify-between items-end mb-4 border-b-2 border-gray-900 dark:border-gray-100 pb-2">
                         <h3 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                            <CalendarIcon size={24} className="text-blue-600"/> 이달의 일정
                          </h3>
                         <button onClick={() => setView('notice')} className="text-sm font-bold text-gray-500 hover:text-blue-600 flex items-center gap-1">전체보기 <ChevronRight size={14}/></button>
                      </div>
                      <div className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800 shadow-sm">
                          <NoticeBoard userRole={role} onWriteClick={()=>{}} initialMode='calendar' />
                      </div>
                   </div>

                   {/* 3) 갤러리 */}
                   <div className="lg:col-span-3 flex flex-col h-[520px]">
                      <div className="flex justify-between items-end mb-4 border-b-2 border-gray-900 dark:border-gray-100 pb-2">
                         <h3 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                             <ImageIcon size={24} className="text-blue-600"/> 갤러리
                         </h3>
                         <button onClick={() => setView('gallery')} className="text-sm font-bold text-gray-500 hover:text-blue-600 flex items-center gap-1">전체보기 <ChevronRight size={14}/></button>
                      </div>
                       <div className="flex-1 overflow-y-auto">
                         <Gallery userRole={role} onUploadClick={()=>{}} limit={4} isWidget={true} />
                      </div>
                   </div>
                </section>

                {/* 월간 자료실 */}
                <section className="max-w-7xl mx-auto px-4">
                   <div className="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">월간 자료실</h2>
                       <button onClick={() => setView('issue_list')} className="text-sm font-bold text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 flex items-center gap-1 transition-colors">전체보기 <ChevronRight size={16}/></button>
                   </div>
                   <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {issues.slice(0, 6).map(issue => (
                          <div key={issue.id} className="transform scale-95 origin-top-left">
                           <IssueCard issue={issue} onClick={(i) => {setCurrentIssue(i);
                            setView('issue_detail');}} isAdmin={role === 'admin'} onDelete={handleDeleteIssue}/>
                         </div>
                      ))}
                   </div>
                </section>
             </div>
          )}
          
          {view === 'news' && <NewsFeed isAdmin={role === 'admin'}/>}
          {view === 'notice' && <NoticeBoard userRole={role} onWriteClick={(t) => { setUploadType(t);
            setIsUploadOpen(true);}}/>}
          {view === 'gallery' && <Gallery userRole={role} onUploadClick={(t) => { setUploadType(t);
            setIsUploadOpen(true); }}/>}
          
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
                      <button onClick={() => { setUploadType('article'); setIsUploadOpen(true);}} className="flex items-center gap-2 shadow-sm bg-[#2563EB] text-white px-4 py-2 rounded-md font-bold hover:bg-[#1d4ed8]">
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

       {/* PC 푸터 / 모바일 바텀 내비게이션 */}
       <Footer />
       <BottomNav currentView={view} onViewChange={setView} />
       
       <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onLoginSuccess={() => window.location.reload()}/>
       <UniversalUploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} type={uploadType} isUploading={isUploading} onSubmit={handleUpload}/>
    </div>
  );
};

export default function App() { return <MainApp />; }
