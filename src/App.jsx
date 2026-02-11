import React, { useState, useEffect, useRef } from 'react';
import { 
  Book, FileText, User, ChevronRight, ArrowLeft, 
  Plus, Trash2, ChevronLeft,  
  X, Newspaper, Calendar as CalendarIcon, 
  Image as ImageIcon, List as ListIcon,
  RefreshCw, ArrowRight, ArrowUpRight, Paperclip, Loader2, Home, Search, 
  Sun, Moon, Eye, Megaphone,
  ZoomIn, ZoomOut, Download, AlertTriangle
} from 'lucide-react';

// ✅ [KRDS] Button 사용
import { Button } from 'krds-react';

// ✅ [Supabase] 클라이언트
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// ------------------------------------------------------------------
// ✅ [Assets] src/assets 폴더의 이미지 불러오기 (Import 방식)
// ❗ 파일명과 확장자(.png / .svg)가 실제 파일과 똑같아야 합니다!
// ------------------------------------------------------------------
import imgKakao from './assets/kakao_icon.svg';
import imgBand from './assets/band_icon.svg';
import imgFacebook from './assets/facebook_icon.png';
import imgX from './assets/x_icon.svg';

// ------------------------------------------------------------------
// 🏛️ [KRDS System] 커스텀 컴포넌트
// ------------------------------------------------------------------
const KRDSInput = ({ className, ...props }) => (
  <input 
    className={`w-full h-[50px] px-4 bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded text-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] disabled:bg-gray-100 disabled:text-gray-400 transition-all ${className}`}
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
    <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded text-xs font-bold ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};

// ------------------------------------------------------------------
// 🔗 [Social] 공유 기능 컴포넌트 (링크 전송 강화 버전)
// ------------------------------------------------------------------
const SocialShare = () => {
  // 1. 인코딩된 URL (밴드, 페이스북, X용 - 기존 방식 유지)
  const currentUrlEncoded = encodeURIComponent(window.location.href);
  const titleEncoded = encodeURIComponent("아이들의 미래를 잇는 지식 플랫폼");

  // 2. ✅ [추가] 순수 URL (카카오톡용 - 인코딩 없이 원본 주소 사용)
  const rawUrl = window.location.href;

  // ✅ Import한 이미지 변수 연결
  const icons = {
    kakao: imgKakao,
    band: imgBand,
    facebook: imgFacebook,
    x: imgX
  };

  const shareKakao = () => {
    if (!window.Kakao) {
      alert("⚠️ 카카오 연결 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    if (!window.Kakao.isInitialized()) {
      window.Kakao.init('ee00ac93b075fc1e56de1a0dc90ccaf3'); 
    }

    // ✅ 카카오톡 메시지 보내기 (링크 연결 강화)
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: '아이들의 미래를 잇는 지식 플랫폼',
        description: '선생님과 부모님을 위한 교육 정보와 최신 자료를 확인해보세요.',
        imageUrl: 'https://cdn-icons-png.flaticon.com/512/3408/3408599.png',
        
        // 👇 [핵심] 썸네일 이미지를 클릭해도 해당 페이지로 이동
        link: {
          mobileWebUrl: rawUrl,
          webUrl: rawUrl,
        },
      },
      buttons: [
        {
          title: '웹진 바로가기', // 👇 버튼 텍스트 변경
          link: {
            mobileWebUrl: rawUrl, // 👇 버튼 클릭 시 이동할 링크
            webUrl: rawUrl,
          },
        },
      ],
    });
  };

  const shareBand = () => window.open(`https://band.us/plugin/share?body=${titleEncoded}%0A${currentUrlEncoded}&route=${currentUrlEncoded}`, '_blank');
  const shareX = () => window.open(`https://twitter.com/intent/tweet?text=${titleEncoded}&url=${currentUrlEncoded}`, '_blank');
  const shareFacebook = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${currentUrlEncoded}`, '_blank');

  // 버튼 스타일 (이미지 꽉 채우기)
  const btnClass = "w-12 h-12 rounded-full overflow-hidden shadow-md border border-gray-100 dark:border-gray-700 hover:-translate-y-1 transition-transform cursor-pointer bg-white flex items-center justify-center";

  return (
    <div className="flex justify-center gap-5 py-6">
       <button onClick={shareKakao} className={btnClass} title="카카오톡"><img src={icons.kakao} alt="Kakao" className="w-full h-full object-cover" /></button>
       <button onClick={shareBand} className={btnClass} title="밴드"><img src={icons.band} alt="Band" className="w-full h-full object-cover" /></button>
       <button onClick={shareFacebook} className={btnClass} title="페이스북"><img src={icons.facebook} alt="Facebook" className="w-full h-full object-cover" /></button>
       <button onClick={shareX} className={`${btnClass} bg-black p-2.5`} title="X"><img src={icons.x} alt="X" className="w-full h-full object-contain filter invert" /></button>
    </div>
  );
};
// ------------------------------------------------------------------
// 🚀 Main Logic
// ------------------------------------------------------------------

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// --- [Hook] History API ---
const useHistoryState = (initialState) => {
  const [state, setState] = useState(initialState);
  useEffect(() => {
    window.history.replaceState({ view: initialState }, '');
    const handlePopState = (event) => {
      if (event.state && event.state.view) setState(event.state.view);
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-gray-800 pb-safe z-50 h-[65px] flex items-center justify-around shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onViewChange(item.id)}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${
            currentView === item.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'
          }`}
        >
          <item.icon size={24} strokeWidth={currentView === item.id ? 2.5 : 2} />
          <span className="text-[11px] font-medium tracking-tight">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

const Footer = () => (
  <footer className="w-full bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-gray-800 py-10 pb-28 md:pb-12 mt-auto z-10 relative">
    <div className="max-w-7xl mx-auto px-4 text-center">
       <div className="mb-8">
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3">콘텐츠 공유하기</p>
          <SocialShare />
       </div>
       <div className="flex justify-center gap-6 mb-6">
          <button className="text-sm font-bold text-gray-500 hover:text-blue-600">이용약관</button>
          <button className="text-sm font-bold text-gray-500 hover:text-blue-600">개인정보처리방침</button>
          <button className="text-sm font-bold text-gray-500 hover:text-blue-600">운영 정책</button>
       </div>
       <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
          © 2026 아이들의 미래를 잇는 지식 플랫폼. All rights reserved.<br/>
          Contact: help@korea-kids-platform.kr
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
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="bg-gray-50 dark:bg-slate-900 px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{isSignUp ? '회원가입' : '로그인'}</h2>
          <button onClick={onClose}><X size={26} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"/></button>
        </div>
        <div className="p-7">
          <form onSubmit={handleAuth} className="space-y-6">
            <div>
              <label className="block text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">이메일</label>
              <KRDSInput type="email" placeholder="example@korea.kr" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">비밀번호</label>
              <KRDSInput type="password" placeholder="********" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-red-600 text-sm font-bold bg-red-50 p-3 rounded">{error}</p>}
            <Button type="submit" disabled={loading} variant="primary" size="large" className="w-full text-lg h-[50px]">
              {loading ? '처리 중...' : (isSignUp ? '가입하기' : '로그인')}
            </Button>
          </form>
          <div className="mt-6 text-center">
             <button onClick={() => setIsSignUp(!isSignUp)} className="text-base text-gray-500 underline hover:text-blue-600">
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
  const getLabelClass = "block text-base font-bold text-gray-700 dark:text-gray-300 mb-1";
  
  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in zoom-in-95">
       <div className="bg-white dark:bg-slate-800 rounded-lg w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 flex justify-between items-center sticky top-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
               {type === 'notice' && <><Megaphone className="text-blue-600" size={24}/> 공지사항 작성</>}
               {type === 'gallery' && <><ImageIcon className="text-blue-600" size={24}/> 갤러리 업로드</>}
               {type === 'issue' && <><Book className="text-blue-600" size={24}/> 월간호 발행</>}
               {type === 'article' && <><FileText className="text-blue-600" size={24}/> 자료 등록</>}
            </h2>
            <button onClick={onClose}><X className="text-gray-400 hover:text-gray-900 dark:hover:text-white"/></button>
          </div>
          <div className="p-6">
            {isUploading ? <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-blue-600 mb-2"/> <p className="text-lg text-gray-600">전송 중...</p></div> : (
               <form onSubmit={(e) => { e.preventDefault(); onSubmit({...formData, file, type}); }} className="space-y-5">
                  {type === 'issue' && <div><label className={getLabelClass}>호수 (Vol)</label><KRDSInput placeholder="예: 24" value={formData.vol} onChange={e => setFormData({...formData, vol: e.target.value})}/></div>}
                  <div><label className={getLabelClass}>제목</label><KRDSInput placeholder="제목 입력" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}/></div>
                  {type === 'notice' && (
                     <>
                        <div><label className={getLabelClass}>내용</label><textarea className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none" placeholder="내용 입력" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})}/></div>
                        <div><label className={getLabelClass}>일정 (선택)</label><KRDSInput type="date" value={formData.event_date} onChange={e => setFormData({...formData, event_date: e.target.value})}/></div>
                     </>
                  )}
                  {type === 'issue' && <div><label className={getLabelClass}>설명</label><textarea className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none" placeholder="설명 입력" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}/></div>}
                  {(type === 'article' || type === 'gallery') && (
                     <div>
                        <label className={getLabelClass}>파일</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 relative cursor-pointer group">
                           <div className="space-y-1 text-center">
                              <Paperclip className="mx-auto h-12 w-12 text-gray-400 group-hover:text-blue-500"/>
                              <div className="flex text-base text-gray-600 justify-center">
                                 <label className="relative cursor-pointer text-blue-600 hover:text-blue-500"><span>업로드</span><input type="file" className="sr-only" onChange={e => setFile(e.target.files[0])}/></label>
                              </div>
                              <p className="text-sm text-gray-500">{file ? file.name : '파일 선택'}</p>
                           </div>
                        </div>
                     </div>
                  )}
                  <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700 mt-6">
                     <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-300 rounded-md text-base font-bold hover:bg-gray-50 transition-colors">취소</button>
                     <Button type="submit" variant="primary" size="medium" className="flex-1 shadow-sm">완료</Button>
                  </div>
               </form>
            )}
         </div>
      </div>
    </div>
  );
};

const CustomPDFViewer = ({ article, onBack }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const contentWrapperRef = useRef(null);
  const size = useContainerSize(containerRef);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNum, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const pinchStartDist = useRef(0);
  const pinchStartScale = useRef(1);
  const isPinching = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') setPageNumber(p => Math.max(1, p - 1));
      if (e.key === 'ArrowRight') setPageNumber(p => Math.min(pdfDoc?.numPages || 1, p + 1));
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
        let autoScale;
        if (window.innerWidth >= 768) { 
           const widthScale = (containerWidth / unscaledViewport.width);
           const heightScale = (containerHeight / unscaledViewport.height);
           autoScale = Math.min(widthScale, heightScale) * 0.95; 
        } else { 
           autoScale = (containerWidth / unscaledViewport.width) * 0.98;
        }
        const finalScale = scale * autoScale;
        const viewport = page.getViewport({ scale: finalScale });
        const outputScale = window.devicePixelRatio || 1;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = Math.floor(viewport.width) + "px";
        canvas.style.height = Math.floor(viewport.height) + "px";
        const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;
        await page.render({ canvasContext: ctx, viewport, transform }).promise;
      } catch (err) { console.error(err); }
    };
    renderPage();
  }, [pdfDoc, pageNum, scale, size]);

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
  
  return (
    <div className="fixed inset-0 bg-gray-100 dark:bg-slate-900 z-[150] flex flex-col h-screen w-screen text-left animate-in slide-in-from-right outline-none" tabIndex={0}>
       <div className="h-16 bg-white dark:bg-slate-800 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 shadow-sm z-50">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full"><ArrowLeft className="text-gray-700 dark:text-white"/></button>
            <h2 className="font-bold text-lg text-gray-900 dark:text-white truncate max-w-[150px] md:max-w-md">{article.title}</h2>
          </div>
          <div className="flex items-center gap-1">
             <div className="hidden md:flex items-center bg-gray-100 dark:bg-slate-700 rounded-lg mr-2">
                <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} className="p-2"><ZoomOut size={20}/></button>
                <span className="text-sm w-12 text-center font-bold">{Math.round(scale * 100)}%</span>
                <button onClick={() => setScale(s => Math.min(3.0, s + 0.2))} className="p-2"><ZoomIn size={20}/></button>
             </div>
             <button onClick={handleDownload} className="p-2"><Download size={24}/></button>
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-2 rounded-full ${isSidebarOpen ? 'bg-blue-100 text-blue-600' : ''}`}><ListIcon size={24}/></button>
          </div>
       </div>
       <div className="flex-1 overflow-hidden flex relative">
          <div className={`absolute md:static inset-y-0 left-0 w-64 bg-white dark:bg-slate-800 border-r border-gray-200 z-40 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:hidden'}`}>
             <div className="p-4 font-bold border-b text-lg">목차 ({pdfDoc?.numPages}p)</div>
             <div className="overflow-y-auto h-full p-2 space-y-1 pb-20">
                {pdfDoc && Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1).map((num) => (
                   <button key={num} onClick={() => { setPageNumber(num); if(window.innerWidth<768) setIsSidebarOpen(false); }} className={`w-full text-left p-3 rounded-md text-base ${pageNum === num ? 'bg-blue-50 text-blue-600 font-bold' : 'hover:bg-gray-50'}`}>Page {num}</button>
                ))}
             </div>
          </div>
          <div 
             className="flex-1 overflow-auto bg-gray-200 dark:bg-slate-900 flex justify-center items-center p-4 relative h-full" 
             ref={containerRef}
             onTouchStart={handleTouchStart}
             onTouchMove={handleTouchMove}
             onTouchEnd={handleTouchEnd}
          >
             {isSidebarOpen && <div className="absolute inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)}/>}
             <div className="absolute left-0 top-0 bottom-0 w-[15%] z-20 md:hidden cursor-pointer active:bg-black/5" onClick={(e) => {e.stopPropagation(); setPageNumber(p => Math.max(1, p-1));}} />
             <div className="absolute right-0 top-0 bottom-0 w-[15%] z-20 md:hidden cursor-pointer active:bg-black/5" onClick={(e) => {e.stopPropagation(); setPageNumber(p => Math.min(pdfDoc?.numPages||1, p+1));}} />
             <div ref={contentWrapperRef} className="shadow-2xl transition-transform duration-75 ease-out origin-center">
                <canvas ref={canvasRef} className="bg-white block rounded-sm mx-auto"/>
             </div>
          </div>
       </div>
       <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-6 py-3 rounded-full shadow-2xl border flex items-center gap-8 z-50">
          <button onClick={() => setPageNumber(p => Math.max(1, p-1))}><ChevronLeft size={24}/></button>
          <span className="font-mono font-bold text-lg">{pageNum} / {pdfDoc?.numPages || '-'}</span>
          <button onClick={() => setPageNumber(p => Math.min(pdfDoc?.numPages || 1, p+1))}><ChevronRight size={24}/></button>
       </div>
    </div>
  );
};

const NewsFeed = ({ limit, isAdmin, onBack }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const fetchNews = async () => {
    if(!supabase) return;
    setLoading(true);
    const { data } = await supabase.from('news').select('*').order('pub_date', { ascending: false }).limit(limit || 50);
    if(data) setNews(data);
    setLoading(false);
  };
  useEffect(() => { fetchNews(); }, [limit]);

  const handleNewsClick = (item) => {
      incrementViewCount('news', item.id, item.views);
      setNews(prev => prev.map(n => n.id === item.id ? {...n, views: (n.views || 0) + 1} : n));
      if (item.link) window.open(item.link, '_blank');
  };

  const handleDelete = async (id) => {
    if(confirm('이 뉴스를 삭제하시겠습니까?')) {
        await supabase.from('news').delete().eq('id', id);
        setNews(prev => prev.filter(n => n.id !== id));
    }
  };
  return (
    <div className={`w-full ${limit ? '' : 'max-w-7xl mx-auto px-4 py-16'}`}>
      {!limit && (
        <div className="flex justify-between items-center mb-8 pb-4 border-b-2 border-gray-900 dark:border-gray-100">
           <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                 <Newspaper size={36} className="text-blue-600"/> 뉴스룸
              </h2>
              <button onClick={fetchNews} disabled={loading} className="p-2 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-all" title="새로고침">
                 <RefreshCw size={24} className={loading ? "animate-spin" : ""} />
              </button>
           </div>
           {onBack && (
              <button onClick={onBack} className="text-base font-bold text-gray-500 hover:text-blue-600 flex items-center gap-2">
                <Home size={20}/> 홈으로
             </button>
           )}
        </div>
      )}
      <div className={`flex flex-col ${limit ? '' : 'border-t border-gray-200 dark:border-gray-700'}`}>
         {news.map((item, idx) => (
            <div key={idx} onClick={() => handleNewsClick(item)} className="group cursor-pointer flex flex-col md:flex-row gap-4 p-5 border-b border-gray-200 dark:border-gray-700 hover:bg-blue-50/50 transition-colors relative">
               <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                     <KRDSBadge variant={item.author?.includes('Google') ? 'primary' : 'success'}>{item.author || '뉴스'}</KRDSBadge>
                     <span className="text-base text-gray-500 font-medium">{new Date(item.pub_date).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-bold text-xl text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-1">{item.title}</h3>
                  <p className="text-lg text-gray-500 mt-1 line-clamp-2">클릭하여 원문 기사를 확인하세요.</p>
                  
                  {/* ✅ 조회수 메타 정보 */}
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-400 font-medium">
                      <span className="flex items-center gap-1"><Eye size={12}/> 조회수: {item.views || 0}회</span>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                   {!limit && <ArrowUpRight size={20} className="hidden md:block text-gray-300"/>}
                   {isAdmin && <button onClick={(e) => {e.stopPropagation(); handleDelete(item.id)}} className="text-gray-300 hover:text-red-500 p-2"><Trash2 size={16}/></button>}
               </div>
            </div>
         ))}
      </div>
    </div>
  );
};

const NoticeBoard = ({ userRole, onWriteClick, initialMode }) => {
  const [mode, setMode] = useState(initialMode || 'list');
  const [filter, setFilter] = useState('all'); 
  const [notices, setNotices] = useState([]);
  const [selectedNotice, setSelectedNotice] = useState(null);

  useEffect(() => {
    const f = async () => { if(supabase) { const { data } = await supabase.from('notices').select('*').order('created_at', { ascending: false }); if(data) setNotices(data); }}; f();
  }, []);
  const handleDelete = async (id) => {
    if(confirm('삭제하시겠습니까?')) {
        await supabase.from('notices').delete().eq('id', id);
        setNotices(prev => prev.filter(n => n.id !== id));
        setSelectedNotice(null);
    }
  };
  const handleNoticeClick = (item) => {
      incrementViewCount('notices', item.id, item.views);
      const updated = { ...item, views: (item.views || 0) + 1 };
      setNotices(prev => prev.map(n => n.id === item.id ? updated : n));
      setSelectedNotice(updated); // 팝업 오픈
  };
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
           <h2 className="text-3xl font-bold flex items-center gap-2"><span className="w-1.5 h-8 bg-blue-600 rounded-sm"></span>소식 & 일정</h2>
           <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <div className="bg-gray-100 p-1 rounded-md flex">
                  {['all', 'notice', 'event'].map(f => (
                      <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 text-sm font-bold rounded ${filter === f ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>{f === 'all' ? '전체' : f === 'notice' ? '공지' : '행사'}</button>
                  ))}
              </div>
              <div className="bg-gray-100 p-1 rounded-md flex">
                  <button onClick={() => setMode('list')} className={`p-1.5 text-sm font-bold flex gap-1 ${mode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}><ListIcon size={18}/> 목록</button>
                  <button onClick={() => setMode('calendar')} className={`p-1.5 text-sm font-bold flex gap-1 ${mode === 'calendar' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}><CalendarIcon size={18}/> 달력</button>
              </div>
              {(userRole === 'team' || userRole === 'admin') && <button onClick={() => onWriteClick('notice')} className="bg-[#2563EB] text-white px-4 py-2 rounded-md text-sm font-bold flex gap-2 items-center"><Plus size={18}/> 글쓰기</button>}
           </div>
        </div>
      )}
      {mode === 'list' ? (
        <div className="grid gap-4">
           {filteredNotices.map(n => (
              <div key={n.id} onClick={() => handleNoticeClick(n)} className="bg-white dark:bg-slate-800 p-6 rounded-lg border hover:border-blue-300 transition-colors shadow-sm relative group cursor-pointer">
                 <div className="flex justify-between mb-2">
                    <KRDSBadge variant={n.category === 'event' ? 'primary' : 'neutral'}>{n.category === 'event' ? '행사' : '공지'}</KRDSBadge>
                    <span className="text-sm text-gray-400">{new Date(n.created_at).toLocaleDateString()}</span>
                 </div>
                 <h3 className="text-xl font-bold mb-2 line-clamp-1">{n.title}</h3>
                 <p className="text-base text-gray-600 dark:text-gray-400 line-clamp-2">{n.content}</p>
                 {n.event_date && <div className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded border border-blue-100"><CalendarIcon size={16}/> 일정: {n.event_date}</div>}
                 
                 {/* ✅ 작성자+조회수 */}
                 <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center gap-3 text-xs text-gray-400 font-bold">
                     <span className="flex items-center gap-1"><User size={12}/> 관리자</span>
                    <span className="w-px h-2 bg-gray-300"></span>
                    <span className="flex items-center gap-1"><Eye size={12}/> {n.views || 0}</span>
                 </div>
              </div>
           ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm h-full">
           <div className="h-64 flex items-center justify-center text-gray-400">달력 보기 모드</div>
        </div>
      )}

      {/* ✅ [Popup] 공지사항 상세 모달 */}
      {selectedNotice && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedNotice(null)}>
           <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col relative" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start z-10">
                 <div>
                    <div className="flex items-center gap-2 mb-2">
                       <KRDSBadge variant={selectedNotice.category === 'event' ? 'primary' : 'neutral'}>{selectedNotice.category === 'event' ? '행사' : '공지'}</KRDSBadge>
                       <span className="text-sm text-gray-500">{new Date(selectedNotice.created_at).toLocaleDateString()}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-snug">{selectedNotice.title}</h2>
                 </div>
                 <button onClick={() => setSelectedNotice(null)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"><X size={24} className="text-gray-500"/></button>
              </div>
              <div className="p-6 md:p-8">
                 {selectedNotice.event_date && (
                    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center gap-3 border border-blue-100 dark:border-blue-800">
                       <CalendarIcon className="text-blue-600 dark:text-blue-400" size={24}/>
                       <div>
                          <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Event Date</div>
                          <div className="text-lg font-bold text-gray-900 dark:text-white">{selectedNotice.event_date}</div>
                       </div>
                    </div>
                 )}
                 <p className="text-lg leading-relaxed whitespace-pre-wrap text-gray-800 dark:text-gray-200">{selectedNotice.content}</p>
              </div>
              <div className="px-6 py-4 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center text-sm text-gray-500">
                 <div className="flex items-center gap-3 font-medium">
                     <span className="flex items-center gap-1"><User size={14}/> 작성자: 관리자</span>
                     <span className="w-px h-3 bg-gray-300"></span>
                     <span className="flex items-center gap-1"><Eye size={14}/> 조회수: {selectedNotice.views || 0}회</span>
                 </div>
                 {(userRole === 'team' || userRole === 'admin') && (
                    <button onClick={() => handleDelete(selectedNotice.id)} className="text-red-500 hover:text-red-700 font-bold flex items-center gap-1"><Trash2 size={16}/> 삭제</button>
                 )}
              </div>
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
    if(confirm('사진을 삭제하시겠습니까?')) { await supabase.from('gallery').delete().eq('id', id);
    setImages(prev => prev.filter(img => img.id !== id)); }
  };
  const handleImageClick = (img) => {
      setSelected(img);
      incrementViewCount('gallery', img.id, img.views);
      setImages(prev => prev.map(i => i.id === img.id ? {...i, views: (i.views || 0) + 1} : i));
  };
  return (
    <div className={`w-full ${isWidget ? '' : 'max-w-7xl mx-auto px-4 py-16'}`}>
      {!isWidget && <div className="flex justify-between items-center mb-6 pb-4 border-b"><h2 className="text-3xl font-bold flex items-center gap-2"><span className="w-1.5 h-8 bg-blue-600 rounded-sm"></span>활동 갤러리</h2>{(userRole === 'team' || userRole === 'admin') && <button onClick={() => onUploadClick('gallery')} className="bg-[#2563EB] text-white px-4 py-2 rounded-md text-sm font-bold flex gap-2"><ImageIcon size={18}/> 사진 올리기</button>}</div>}
      <div className={`grid gap-6 ${isWidget ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-4'}`}>
         {images.map(img => (
            <div key={img.id} onClick={() => handleImageClick(img)} className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden border hover:border-blue-400 hover:shadow-md cursor-pointer group relative flex flex-col h-full">
               <div className="aspect-square bg-gray-100 overflow-hidden"><img src={img.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform"/></div>
               {!isWidget && (
                   <div className="p-4 flex flex-col flex-1">
                       <h4 className="font-bold text-base truncate mb-1">{img.title}</h4>
                       <p className="text-sm text-gray-500 mb-3">{new Date(img.created_at).toLocaleDateString()}</p>
                       
                       {/* ✅ 작성자+조회수 */}
                       <div className="mt-auto pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-[11px] text-gray-400 font-bold">
                           <span className="flex items-center gap-1">관리자</span>
                           <span className="flex items-center gap-1"><Eye size={10}/> {img.views || 0}</span>
                       </div>
                   </div>
               )}
               {!isWidget && (userRole === 'team' || userRole === 'admin') && <button onClick={(e) => {e.stopPropagation();
               handleDelete(img.id)}} className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>}
            </div>
         ))}
      </div>
      {selected && <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4" onClick={() => setSelected(null)}><img src={selected.image_url} className="max-w-full max-h-[90vh] rounded shadow-2xl"/><button className="absolute top-5 right-5 text-white/70"><X size={32}/></button></div>}
    </div>
  );
};

const IssueCard = ({ issue, onClick, isAdmin, onDelete }) => (
  <div onClick={() => onClick(issue)} className="group cursor-pointer flex flex-col bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:border-blue-500 hover:ring-1 hover:ring-blue-500 hover:shadow-lg transition-all h-full">
    <div className={`aspect-[4/5] w-full relative flex items-center justify-center border-b overflow-hidden ${issue.thumbnail_url || issue.image_url ? 'bg-gray-100' : 'bg-blue-50 dark:bg-slate-700'}`}>
      {issue.thumbnail_url || issue.image_url ? (
          <img src={issue.thumbnail_url || issue.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
      ) : (
           <div className="p-6 text-center w-full h-full flex flex-col justify-center items-center break-keep group-hover:scale-105 transition-transform duration-500 bg-gradient-to-br from-blue-50 to-white dark:from-slate-700 dark:to-slate-800">
             <div className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-widest border-b-2 border-blue-600 dark:border-blue-400 pb-1">Vol.{issue.vol}</div>
             <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-tight line-clamp-3">{issue.title}</h3>
          </div>
      )}
      {(issue.thumbnail_url || issue.image_url) && (
        <div className="absolute top-0 left-0"><span className="inline-block bg-[#2563EB] text-white text-sm font-bold px-3 py-1.5 rounded-br-lg shadow-sm">Vol.{issue.vol}</span></div>
      )}
    </div>
    <div className="p-5 flex-1 flex flex-col">
      <div className="flex justify-between items-start mb-2"><span className="text-sm font-bold text-gray-500 bg-gray-100 dark:bg-slate-700 dark:text-gray-300 px-2 py-0.5 rounded">{issue.date}</span>{isAdmin && <button onClick={(e) => { e.stopPropagation();
      onDelete(issue.id); }} className="text-gray-300 hover:text-red-600"><Trash2 size={16}/></button>}</div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white leading-snug mb-2 group-hover:text-[#2563EB] dark:group-hover:text-blue-400 transition-colors line-clamp-2">{issue.title}</h3>
      <p className="text-lg text-gray-500 dark:text-gray-400 line-clamp-2 mt-auto mb-3">{issue.description || "내용 없음"}</p>
      
      {/* ✅ 자료실 조회수 표시 */}
      <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs font-bold text-gray-400">
         <span>관리자 발행</span>
         <span className="flex items-center gap-1"><Eye size={12}/> {issue.views || 0}</span>
      </div>
    </div>
  </div>
);

const Navbar = ({ isAdmin, onLoginClick, onLogout, onHomeClick, onViewChange, currentView, isDarkMode, toggleTheme }) => (
  <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 h-[70px] flex items-center shadow-sm">
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3 cursor-pointer group" onClick={onHomeClick}>
         <div className="w-10 h-10 bg-[#2563EB] rounded-lg flex items-center justify-center text-white font-black text-xl shadow-md group-hover:bg-[#1d4ed8] transition-colors">K</div>
         <div className="flex flex-col justify-center"><span className="font-bold text-2xl leading-none tracking-tight group-hover:text-[#2563EB] transition-colors">지식 플랫폼</span><span className="text-sm font-bold text-gray-500 mt-0.5 tracking-wide">아이들의 미래를 잇는</span></div>
      </div>
      <nav className="hidden md:flex items-center gap-2">
        {['home', 'news', 'notice', 'issue_list', 'gallery'].map(key => (
          <button key={key} onClick={() => onViewChange(key)} className={`px-5 py-2.5 rounded-full text-lg font-bold transition-all ${currentView === key ? 'bg-[#2563EB] text-white shadow-md' : 'text-gray-600 hover:bg-gray-100 hover:text-[#2563EB] dark:text-gray-300 dark:hover:bg-slate-800'}`}>{key === 'home' ? '홈' : key === 'news' ? '뉴스룸' : key === 'notice' ? '소식' : key === 'issue_list' ? '자료실' : '갤러리'}</button>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <button onClick={toggleTheme} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full dark:text-gray-400 dark:hover:bg-slate-800">{isDarkMode ? <Sun size={24} className="text-yellow-400"/> : <Moon size={24}/>}</button>
        <button className="p-2 text-gray-400 hover:text-[#2563EB] hidden sm:block"><Search size={24}/></button>
        {isAdmin ? <button onClick={onLogout} className="px-4 py-2 border rounded-md text-sm font-bold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800">로그아웃</button> : <Button variant="primary" size="medium" onClick={onLoginClick} className="shadow-sm">로그인</Button>}
      </div>
    </div>
  </header>
);

const MainApp = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('guest');
  const [view, setView] = useHistoryState('home');
  const [issues, setIssues] = useState([]);
  const [currentIssue, setCurrentIssue] = useState(null);
  const [currentArticle, setCurrentArticle] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadType, setUploadType] = useState('notice');
  const [isUploading, setIsUploading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      return savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const [newsKey, setNewsKey] = useState(0);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);
  const toggleTheme = () => setIsDarkMode(prev => !prev);

  const handleLogout = async () => { if(supabase) { await supabase.auth.signOut(); localStorage.clear(); window.location.href = '/'; }};

  if (!supabase) return <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4"><div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border text-center"><AlertTriangle size={32} className="mx-auto text-red-500 mb-4"/><h1 className="text-xl font-bold mb-2">Supabase 설정 필요</h1><p className="text-gray-600 text-sm">Vercel 환경변수를 확인해주세요.</p></div></div>;
  useEffect(() => {
    const initAuth = async () => { const { data: { session } } = await supabase.auth.getSession(); if (session) { setUser(session.user); const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single(); setRole(data?.role || 'general'); }}; initAuth();
    const fetchIssues = async () => { const { data } = await supabase.from('issues').select('*').order('created_at', { ascending: false }); if (data) setIssues(data); }; fetchIssues();
  }, []);
  const handleUpload = async (data) => {
    setIsUploading(true);
    try {
       if (data.type === 'notice') await supabase.from('notices').insert([{ title: data.title, content: data.content, event_date: data.event_date || null, category: data.event_date ? 'event' : 'notice', author_id: user.id }]);
       else if (data.type === 'gallery' && data.file) { const fn = `${Date.now()}_${data.file.name}`; await supabase.storage.from('gallery').upload(fn, data.file);
       const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(fn); await supabase.from('gallery').insert([{ title: data.title, image_url: publicUrl, author_id: user.id }]);
       }
       else if (data.type === 'issue') await supabase.from('issues').insert([{ vol: data.vol, title: data.title, description: data.description, date: new Date().toLocaleDateString(), cover_color: 'bg-blue-100', icon: '📘' }]);
       else if (data.type === 'article' && currentIssue) { let fileUrl = ''; if (data.file) { const fn = `${Date.now()}.pdf`;
       await supabase.storage.from('files').upload(fn, data.file); fileUrl = supabase.storage.from('files').getPublicUrl(fn).data.publicUrl; } const updated = [...(currentIssue.articles || []), { id: Date.now(), title: data.title, fileUrl, views: 0 }];
       await supabase.from('issues').update({ articles: updated }).eq('id', currentIssue.id); setCurrentIssue({...currentIssue, articles: updated}); }
       alert("완료되었습니다!"); setIsUploadOpen(false);
       if (data.type !== 'article') window.location.reload();
    } catch (e) { alert("오류: " + e.message); } finally { setIsUploading(false); }
  };
  const handleDeleteIssue = async (id) => { if(confirm('삭제하시겠습니까?')) { await supabase.from('issues').delete().eq('id', id); window.location.reload(); }};
  const handleIssueClick = (issue) => {
    incrementViewCount('issues', issue.id, issue.views);
    const updatedIssue = { ...issue, views: (issue.views || 0) + 1 };
    setIssues(prev => prev.map(i => i.id === issue.id ? updatedIssue : i));
    setCurrentIssue(updatedIssue);
    setView('issue_detail');
  };
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
       <Navbar isAdmin={role === 'admin' || user} onLoginClick={() => setIsAuthOpen(true)} onLogout={handleLogout} onHomeClick={() => setView('home')} onViewChange={setView} currentView={view} isDarkMode={isDarkMode} toggleTheme={toggleTheme}/>
       <main className="flex-1 pb-24 w-full">
          {view === 'home' && (
             <div className="animate-in fade-in space-y-16 pb-20">
                <section className="bg-gray-50 dark:bg-slate-800 py-16 md:py-24 border-b border-gray-200 dark:border-gray-700">
                   <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                      <div><span className="inline-block py-1.5 px-4 rounded bg-blue-100 text-blue-700 text-sm font-bold mb-6">Beta v25.9.6 (Assets Patch)</span><h1 className="text-5xl md:text-6xl font-black leading-tight mb-8">아이들의 내일을 잇는<br/><span className="text-[#2563EB] dark:text-blue-400">지식 플랫폼.</span></h1><p className="text-gray-600 dark:text-gray-300 text-xl mb-10 leading-relaxed">선생님과 부모님을 위한 필수 지식과<br/>다양한 교육 자료를 한곳에서 만나보세요.</p><div className="flex gap-4"><button onClick={() => setView('issue_list')} className="px-10 py-5 bg-[#2563EB] text-white rounded-lg font-bold shadow-lg hover:bg-[#1d4ed8] flex items-center gap-3 text-lg">자료실 바로가기 <ArrowRight size={20}/></button></div></div>
                      <div className="relative h-[300px] md:h-[400px] bg-white dark:bg-slate-700 rounded-2xl border shadow-2xl flex items-center justify-center p-12">{issues[0] ?
                      (<div className="text-center"><div className="text-sm font-bold text-gray-400 mb-4">LATEST ISSUE</div><div className="text-9xl mb-6 animate-bounce-slow">{issues[0].icon}</div><h3 className="text-3xl font-black">{issues[0].title}</h3></div>) : <div className="text-gray-300 font-bold text-xl">발행된 호수가 없습니다.</div>}</div>
                   </div>
                </section>
                <section className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12">
                   <div className="flex flex-col h-[600px]">
                      <div className="flex justify-between items-end mb-6 border-b-2 border-gray-900 dark:border-gray-100 pb-3">
                          <div className="flex items-center gap-3">
                             <h3 className="text-3xl font-black flex items-center gap-3"><Newspaper size={32} className="text-blue-600"/> 뉴스룸</h3>
                             <button onClick={() => setNewsKey(prev => prev + 1)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 transition-colors" title="새로고침"><RefreshCw size={20} /></button>
                          </div>
                          <button onClick={() => setView('news')} className="text-base font-bold text-gray-500 hover:text-blue-600 flex items-center gap-1">전체보기 <ChevronRight size={18}/></button>
                      </div>
                      <div className="flex-1 overflow-y-auto border rounded-xl bg-white dark:bg-slate-800 shadow-sm"><NewsFeed key={newsKey} limit={10} isAdmin={role === 'admin'} /></div>
                   </div>
                   <div className="flex flex-col h-[600px]">
                       <div className="flex justify-between items-end mb-6 border-b-2 border-gray-900 dark:border-gray-100 pb-3">
                          <h3 className="text-3xl font-black flex items-center gap-3"><CalendarIcon size={32} className="text-blue-600"/> 이달의 일정</h3>
                         <button onClick={() => setView('notice')} className="text-base font-bold text-gray-500 hover:text-blue-600 flex items-center gap-1">전체보기 <ChevronRight size={18}/></button>
                      </div>
                      <div className="flex-1 border rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm"><NoticeBoard userRole={role} onWriteClick={()=>{}} initialMode='calendar' /></div>
                   </div>
                </section>
                <section className="max-w-7xl mx-auto px-4 mt-8">
                   <div className="flex justify-between items-end mb-6 border-b-2 border-gray-900 dark:border-gray-100 pb-3">
                      <h3 className="text-3xl font-black flex items-center gap-3"><ImageIcon size={32} className="text-blue-600"/> 갤러리</h3>
                      <button onClick={() => setView('gallery')} className="text-base font-bold text-gray-500 hover:text-blue-600 flex items-center gap-1">전체보기 <ChevronRight size={18}/></button>
                   </div>
                   <div className="w-full">
                      <Gallery userRole={role} onUploadClick={()=>{}} limit={4} isWidget={true} />
                   </div>
                </section>
                <section className="max-w-7xl mx-auto px-4 mt-8">
                   <div className="flex items-center justify-between mb-6 border-b border-gray-200 dark:border-gray-700 pb-3">
                      <h2 className="text-3xl font-bold">월간 자료실</h2>
                      <button onClick={() => setView('issue_list')} className="text-base font-bold text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors">전체보기 <ChevronRight size={18}/></button>
                   </div>
                   <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                      {issues.slice(0, 6).map(issue => (
                         <div key={issue.id} className="transform scale-95 origin-top-left h-full">
                           <IssueCard issue={issue} onClick={handleIssueClick} isAdmin={role === 'admin'} onDelete={handleDeleteIssue}/>
                         </div>
                      ))}
                   </div>
                </section>
             </div>
          )}
          {view === 'news' && <NewsFeed isAdmin={role === 'admin'} onBack={() => setView('home')} />}
          {view === 'notice' && <NoticeBoard userRole={role} onWriteClick={(t) => { setUploadType(t); setIsUploadOpen(true);}}/>}
          {view === 'gallery' && <Gallery userRole={role} onUploadClick={(t) => { setUploadType(t); setIsUploadOpen(true); }}/>}
          {view === 'issue_list' && <div className="pt-10 max-w-7xl mx-auto px-4"><div className="flex items-center justify-between mb-8 pb-4 border-b"><h2 className="text-4xl font-bold">월간 자료실</h2>{role === 'admin' && <button onClick={() => { setUploadType('issue'); setIsUploadOpen(true); }} className="bg-[#2563EB] text-white px-6 py-3 rounded-lg font-bold shadow-md flex items-center gap-2 text-lg"><Plus size={20}/> 호수 발행</button>}</div><div className="grid grid-cols-2 md:grid-cols-4 gap-8">{issues.map(issue => <IssueCard key={issue.id} issue={issue} onClick={handleIssueClick} isAdmin={role === 'admin'} onDelete={handleDeleteIssue}/>)}</div></div>}
          {view === 'issue_detail' && currentIssue && <div className="max-w-5xl mx-auto px-4 py-12 animate-in slide-in-from-right"><button onClick={() => setView('issue_list')} className="mb-8 flex items-center gap-2 font-bold text-gray-500 hover:text-blue-600 text-lg"><ArrowLeft size={24}/> 목록으로 돌아가기</button><div className="bg-white dark:bg-slate-800 border rounded-xl p-10 md:p-14 mb-12 shadow-lg flex flex-col md:flex-row gap-10 items-start"><div className="w-32 h-32 bg-blue-50 rounded-xl flex items-center justify-center text-7xl border border-blue-100 text-blue-600">{currentIssue.icon}</div><div><span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-sm font-bold rounded mb-4">Vol.{currentIssue.vol}</span><h1 className="text-4xl font-black mb-6">{currentIssue.title}</h1><p className="text-gray-600 text-lg leading-relaxed max-w-2xl">{currentIssue.description}</p></div></div><div className="flex justify-between items-center mb-8 pb-4 border-b"><h3 className="text-2xl font-bold flex items-center gap-3"><span className="w-1.5 h-8 bg-blue-600 rounded-sm"></span>수록 자료 목록</h3>{role === 'admin' && <button onClick={() => { setUploadType('article'); setIsUploadOpen(true);}} className="flex items-center gap-2 shadow-sm bg-[#2563EB] text-white px-5 py-2.5 rounded-lg font-bold text-base"><Plus size={20} /> 자료 추가</button>}</div><div className="grid grid-cols-1 md:grid-cols-2 gap-6">{currentIssue.articles?.map(art => <div key={art.id} onClick={() => { setCurrentArticle(art); setView('article_view'); }} className="group p-6 bg-white dark:bg-slate-800 border rounded-xl hover:border-blue-400 hover:shadow-lg cursor-pointer transition-all flex items-center gap-5"><div className="w-14 h-14 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors"><FileText size={28}/></div><div className="flex-1"><div className="font-bold text-lg group-hover:text-blue-600 transition-colors">{art.title}</div><div className="flex items-center gap-3 text-sm text-gray-400 mt-1.5"><span>PDF 문서</span>{art.views > 0 && <span className="flex items-center gap-1 text-blue-500 font-bold"><Eye size={14}/> {art.views}</span>}</div></div><ArrowRight className="ml-auto text-gray-300 group-hover:text-blue-400" size={24}/></div>)}{(!currentIssue.articles || currentIssue.articles.length === 0) && <div className="col-span-full py-16 text-center text-gray-400 border border-dashed rounded-xl text-lg">등록된 자료가 없습니다.</div>}</div></div>}
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
