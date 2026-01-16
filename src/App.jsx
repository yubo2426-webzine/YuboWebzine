import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Book, FileText, User, Lock, LogOut, ChevronRight, ArrowLeft, 
  Search, Plus, Trash2, Eye, ChevronLeft, ZoomIn, ZoomOut, Download, 
  Link as LinkIcon, ExternalLink, RefreshCw, Star, Heart, Cloud, 
  Paperclip, Server, Database, Image as ImageIcon, Loader2, List, 
  Edit, Share2, X, Newspaper, Calendar, Filter, AlertTriangle, AlertCircle, Zap, Menu, 
  MousePointer2, Smartphone, Mail, Instagram, MessageCircle, Copy,
  ArrowRight, ArrowUpRight 
} from 'lucide-react';
import { supabase } from './lib/supabase';
import BottomNav from './components/BottomNav';

// --- [유틸리티] 컨테이너 크기 감지 ---
const useContainerSize = (ref) => {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const updateSize = () => {
      if (ref.current) {
        setSize({ 
          width: ref.current.clientWidth, 
          height: ref.current.clientHeight 
        });
      }
    };
    const timer = setTimeout(updateSize, 100);
    window.addEventListener('resize', updateSize);
    return () => {
      window.removeEventListener('resize', updateSize);
      clearTimeout(timer);
    };
  }, [ref]);
  return size;
};

// --- [유틸리티] 공유 기능 ---
const handleShare = async (title, text, url) => {
  if (navigator.share) {
    try { await navigator.share({ title, text, url });
    } catch (error) { console.log('공유 취소됨'); }
  } else {
    try { await navigator.clipboard.writeText(url);
    alert('주소가 클립보드에 복사되었습니다.'); } catch (err) { alert('공유하기를 지원하지 않는 환경입니다.'); }
  }
};

// --- [유틸리티] 조회수 증가 ---
const incrementViewCount = async (table, id, currentViews) => {
  if (!supabase) return;
  try { await supabase.from(table).update({ views: (currentViews || 0) + 1 }).eq('id', id); } catch (e) { console.error("조회수 증가 실패:", e);
  }
};

// --- [에러 방어막] ---
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error("앱 렌더링 오류:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#F5F5F7]">
          <AlertCircle size={48} className="text-orange-500 mb-4" />
          <h1 className="text-xl font-bold mb-2 text-slate-800">앱을 불러오는 중입니다.</h1>
          <button onClick={() => window.location.reload()} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-colors">새로고침</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- [도우미] PDF 라이브러리 로더 ---
const loadPdfScript = () => {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) { resolve(window.pdfjsLib); return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      } else { reject(new Error("PDF 라이브러리 로드 실패")); }
    };
    script.onerror = () => reject(new Error("스크립트 로드 오류"));
    document.head.appendChild(script);
  });
};

const generatePDFThumbnail = async (file) => {
  try {
    const pdfjs = await loadPdfScript();
    if (!pdfjs) return null;
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 0.5 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height; canvas.width = viewport.width;
    await page.render({ canvasContext: context, viewport }).promise;
    return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.8));
  } catch (e) { console.warn("썸네일 생성 실패:", e); return null; }
};

const getTouchDistance = (touches) => {
  return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
};

// --- [PDF 뷰어] Updated (Phase 1: Nav Buttons & Toolbar) ---
const CustomPDFViewer = ({ article, onBack }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const contentWrapperRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNum, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isOutlineOpen, setIsOutlineOpen] = useState(true);
  const [outline, setOutline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [libReady, setLibReady] = useState(false);
  const lastTapTime = useRef(0); 
  const pinchStartDist = useRef(0);
  const pinchStartScale = useRef(1);
  const isPinching = useRef(false);
  const tempPinchScaleRef = useRef(1);

  const containerSize = useContainerSize(containerRef);
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsOutlineOpen(!mobile);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!pdfDoc) return;
      if (e.key === 'ArrowLeft') setPageNumber(p => Math.max(1, p - 1));
      if (e.key === 'ArrowRight') setPageNumber(p => Math.min(pdfDoc.numPages, p + 1));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pdfDoc]);

  useEffect(() => {
    let isMounted = true;
    const initLibrary = async () => {
      try { await loadPdfScript(); if (isMounted) setLibReady(true); } catch (e) { if (isMounted) setError(true); }
    };
    initLibrary();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!libReady || !article.fileUrl) return;
    let isMounted = true;
    const loadPdf = async () => {
      setLoading(true); setError(false);
      try {
        const pdfjs = window.pdfjsLib; 
        const loadingTask = pdfjs.getDocument(article.fileUrl);
        const doc = await loadingTask.promise;
        if (!isMounted) return;
        setPdfDoc(doc); setPageNumber(1);
        try { const outlineData = await doc.getOutline(); setOutline(outlineData || []); } catch (e) { console.warn("목차 없음"); }
        incrementViewCount('articles', article.id, article.views);
      } catch (err) { if (isMounted) setError(true); } finally { if (isMounted) setLoading(false); }
    };
    loadPdf();
    return () => { isMounted = false; };
  }, [libReady, article.fileUrl]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || !containerSize.width) return;
    let renderTask = null;
    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const viewportOriginal = page.getViewport({ scale: 1 });
        let finalScale = scale;
        if (scale < 1.1) {
             if (isMobile) {
                const availableWidth = containerSize.width - 20;
                finalScale = Math.max((availableWidth / viewportOriginal.width) * scale, 0.5);
            } else {
                const fitHeightScale = (containerSize.height - 40) / viewportOriginal.height; 
                const fitWidthScale = (containerSize.width - 64) / viewportOriginal.width; 
                finalScale = Math.min(fitHeightScale, fitWidthScale) * scale;
            }
        } else {
             if(isMobile) {
                const availableWidth = containerSize.width - 20;
                finalScale = (availableWidth / viewportOriginal.width) * scale;
             }
        }
        const viewport = page.getViewport({ scale: finalScale });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        canvas.height = viewport.height; canvas.width = viewport.width;
        await page.render({ canvasContext: context, viewport }).promise;
      } catch (err) { if (err?.name !== 'RenderingCancelledException') console.error("Render error:", err); }
    };
    renderPage();
    return () => { if (renderTask) renderTask.cancel(); };
  }, [pdfDoc, pageNum, scale, containerSize, isMobile]);

  const handleOutlineClick = async (dest) => {
    if (!pdfDoc) return;
    try {
      let explicitDest = dest;
      if (typeof dest === 'string') explicitDest = await pdfDoc.getDestination(dest);
      if (Array.isArray(explicitDest)) {
        const ref = explicitDest[0];
        const pageIndex = await pdfDoc.getPageIndex(ref);
        setPageNumber(pageIndex + 1);
        if (isMobile) setIsOutlineOpen(false);
      }
    } catch(e) { console.warn("이동 실패:", e); }
  };

  // ✅ [수정] 스와이프 로직 제거, 핀치 줌만 유지
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) { 
        isPinching.current = true; 
        pinchStartDist.current = getTouchDistance(e.touches);
        pinchStartScale.current = scale; 
    } else { 
        isPinching.current = false; 
    }
  };

  const handleTouchMove = (e) => { if (isPinching.current && e.touches.length === 2) e.preventDefault(); };

  const handlePinchMove = (e) => {
      if (e.touches.length === 2 && contentWrapperRef.current) {
        e.preventDefault();
        const currentDist = getTouchDistance(e.touches);
        const ratio = currentDist / pinchStartDist.current;
        tempPinchScaleRef.current = Math.min(Math.max(pinchStartScale.current * ratio, 0.5), 4.0);
        contentWrapperRef.current.style.transform = `scale(${ratio})`;
        contentWrapperRef.current.style.transformOrigin = 'center top';
      }
  };

  const handlePinchEnd = () => { 
      if (contentWrapperRef.current) { 
          contentWrapperRef.current.style.transform = 'none'; 
          setScale(tempPinchScaleRef.current);
      } 
      isPinching.current = false; 
  };

  const handleTouchEnd = (e) => {
    if (isPinching.current) { 
        if (e.touches.length < 2) handlePinchEnd();
    } 
    // 스와이프 로직 제거됨 (#9)
  };

  return (
    <div className="fixed inset-0 bg-[#F5F5F7] z-[110] flex flex-col h-screen w-screen animate-in fade-in duration-300 text-left">
      <div className="h-16 bg-white/90 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-4 shrink-0 shadow-sm z-[120]">
        <div className="flex items-center gap-3 overflow-hidden">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"><ArrowLeft size={20} /></button>
          <button onClick={() => setIsOutlineOpen(!isOutlineOpen)} className={`p-2 rounded-lg transition-colors ${isOutlineOpen ? 'bg-orange-50 text-orange-600' : 'text-slate-500 hover:bg-slate-50'}`}>
            {isOutlineOpen ? <X size={20}/> : <List size={20}/>}
          </button>
          <h3 className="font-bold truncate text-sm md:text-lg text-slate-800">{article.title}</h3>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => handleShare(article.title, '자료 공유', window.location.href)} className="p-2 text-slate-500 hover:bg-orange-50 hover:text-orange-500 rounded-full transition-colors"><Share2 size={20} /></button>
           
           {/* ✅ [수정] 확대/축소/다운로드 버튼 모바일에서도 노출 (#8) */}
           <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200 shadow-inner mr-2">
             <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} className="p-1.5 hover:bg-white rounded text-slate-500"><ZoomOut size={16}/></button>
             <span className="w-10 text-center text-[10px] text-slate-600 font-mono font-bold hidden sm:block">{Math.round(scale * 100)}%</span>
             <button onClick={() => setScale(s => Math.min(3.0, s + 0.2))} className="p-1.5 hover:bg-white rounded text-slate-500"><ZoomIn size={16}/></button>
           </div>
           
           {article.fileUrl && (
             <a href={article.fileUrl} target="_blank" download className="bg-slate-900 hover:bg-orange-500 text-white p-2 rounded-lg transition-colors shadow-sm" title="다운로드">
                <Download size={18}/>
             </a>
           )}
        </div>
      </div>

      <div className="flex-1 flex relative overflow-hidden bg-[#F5F5F7]">
        {/* 목차 사이드바 */}
        <div className={`absolute md:relative left-0 top-0 bottom-0 w-72 bg-white border-r border-gray-200 transition-all duration-300 z-[115] flex flex-col shadow-xl md:shadow-none ${isOutlineOpen ? 'translate-x-0' : '-translate-x-full md:w-0 md:border-none'}`}>
            <div className="p-4 border-b border-gray-100 flex justify-between items-center text-slate-700 bg-gray-50/50"><span className="font-bold text-sm">목차</span></div>
            <div className="overflow-y-auto flex-1 p-2 custom-scrollbar bg-white">
              {outline.length > 0 ? (
                <ul className="space-y-1">{outline.map((item, idx) => (<li key={idx} onClick={() => handleOutlineClick(item.dest)} className="text-sm text-slate-600 hover:bg-orange-50 hover:text-orange-700 py-2.5 px-3 rounded cursor-pointer truncate transition-colors border-b border-gray-50 last:border-0 font-medium">{item.title}</li>))}</ul>
              ) : (<p className="text-gray-400 text-xs text-center mt-10">{loading ? "로딩 중..." : "목차가 없는 문서입니다."}</p>)}
            </div>
        </div>

        {/* PDF 캔버스 영역 */}
        <div 
            className="flex-1 overflow-auto flex justify-center items-start p-2 md:p-8 relative" 
            ref={containerRef} 
            style={{ touchAction: 'none' }} 
            onTouchStart={handleTouchStart} 
            onTouchMove={(e) => isPinching.current ? handlePinchMove(e) : null} 
            onTouchEnd={(e) => isPinching.current ? handlePinchEnd(e) : handleTouchEnd(e)}
        >
           {article.fileUrl ? (
             <div ref={contentWrapperRef} className="relative shadow-2xl bg-white transition-transform duration-75 origin-top mt-2 md:mt-0">
                {(!libReady || loading) && (<div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 gap-3 min-h-[300px]"><Loader2 size={48} className="animate-spin text-orange-400"/><span className="text-sm font-bold text-gray-400">{!libReady ? "뷰어 엔진 로딩 중..." : "문서 로딩 중..."}</span></div>)}
                {error && <div className="flex flex-col items-center justify-center w-full h-96 text-red-400 bg-white"><AlertTriangle size={48}/><p className="mt-2 font-bold">문서 로드 실패</p></div>}
                <canvas ref={canvasRef} className="block bg-white"/>
             </div>
           ) : (<div className="flex flex-col items-center justify-center h-full text-gray-400"><LinkIcon size={48} className="mx-auto mb-4 opacity-30"/><p>외부 링크 자료입니다.</p></div>)}
        </div>

        {/* ✅ [추가] 모바일 전용 좌우 페이지 넘김 버튼 (화면에 고정) #9 */}
        {pdfDoc && (
          <>
            <button 
                onClick={() => setPageNumber(p => Math.max(1, p-1))} 
                disabled={pageNum <= 1}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-3 bg-white/80 backdrop-blur shadow-lg rounded-full text-slate-700 hover:bg-orange-50 disabled:opacity-30 z-[125]"
            >
                <ChevronLeft size={24} />
            </button>
            <button 
                onClick={() => setPageNumber(p => Math.min(pdfDoc.numPages, p+1))} 
                disabled={pageNum >= pdfDoc.numPages}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-white/80 backdrop-blur shadow-lg rounded-full text-slate-700 hover:bg-orange-50 disabled:opacity-30 z-[125]"
            >
                <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>

      {/* 하단 페이지 표시 (기존 유지) */}
      {pdfDoc && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-gray-200 px-6 py-2 rounded-full shadow-xl flex items-center gap-4 z-[130]">
             <span className="text-slate-800 font-mono font-black text-lg text-center">{pageNum} <span className="text-gray-300 text-sm">/</span> {pdfDoc.numPages}</span>
          </div>
      )}
    </div>
  );
};

// --- [네비게이션] ✅ 명칭 변경: 아이의 내일을 잇는 지식 플랫폼 (#6) ---
const Navbar = ({ isAdmin, onLoginClick, onLogout, onHomeClick, onViewChange, currentView }) => (
  <nav className="w-full sticky top-0 z-[60] bg-white/80 backdrop-blur-md border-b border-gray-200 transition-all duration-300">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2 cursor-pointer group" onClick={onHomeClick}>
        <div className="w-8 h-8 bg-gradient-to-tr from-orange-400 to-orange-500 text-white flex items-center justify-center rounded-lg shadow-sm group-hover:shadow-md transition-all group-hover:scale-105">
          <Star size={16} fill="currentColor" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold tracking-tight text-slate-900 font-sans leading-none">
            아이의 내일을 잇는 <span className="text-orange-500">지식 플랫폼</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 md:gap-2">
        <button 
          onClick={() => onViewChange('news')} 
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${currentView === 'news' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
        >
          <Newspaper size={16}/> <span className="hidden md:inline">뉴스룸</span>
        </button>
        <button 
          onClick={() => onViewChange('issue_list')} 
          className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${currentView === 'issue_list' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
        >
          <Book size={16}/> <span>자료실</span>
        </button>

        <div className="w-px h-4 bg-gray-300 mx-2 hidden md:block"></div>

        {isAdmin ? (
          <div className="flex items-center gap-2 pl-2">
            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full ring-1 ring-orange-100">ADMIN</span>
            <button onClick={onLogout} className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-red-500 transition-colors"><LogOut size={16} /></button>
          </div>
        ) : (
          <button onClick={onLoginClick} className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm active:scale-95 flex items-center gap-2">
            <Lock size={14} /> <span>로그인</span>
          </button>
        )}
      </div>
    </div>
  </nav>
);

// --- [푸터] ---
const Footer = () => {
  const currentUrl = window.location.href;
  const handleCopyLink = async () => { try { await navigator.clipboard.writeText(currentUrl); alert('🔗 링크가 복사되었습니다.'); } catch (e) { alert('복사 실패'); } };
  return (
    <footer className="bg-white border-t border-gray-200 py-12 pb-24 md:pb-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start mb-2 opacity-80"><div className="w-8 h-8 bg-orange-400 text-white flex items-center justify-center font-bold rounded-lg shadow-sm"><Star size={14} fill="currentColor" /></div><span className="font-bold text-slate-900 text-lg">아이의 내일을 잇는 <span className="text-orange-500">지식 플랫폼</span></span></div>
          <p className="text-slate-400 text-xs font-medium leading-relaxed">The First Step of Education | 영유아 교육 전문가를 위한 아카이브<br/>Contact: support@kids-insight.com</p>
        </div>
        <div className="flex flex-col items-center md:items-end gap-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">Share with Friends</span>
          <div className="flex items-center gap-3">
            <button onClick={handleCopyLink} className="w-10 h-10 bg-[#FEE500] rounded-full flex items-center justify-center text-[#3b1e1e] hover:scale-110 transition-transform shadow-sm" title="링크 복사"><MessageCircle size={20} fill="currentColor" className="opacity-90"/></button>
            <button className="w-10 h-10 bg-[#00C300] rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform shadow-sm" title="밴드로 공유"><span className="font-black text-sm">b</span></button>
            <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:scale-110 transition-all shadow-sm" title="이메일 보내기"><Mail size={18} /></button>
          </div>
        </div>
      </div>
    </footer>
  );
};

// --- 모달 ---
const UploadModal = ({ isOpen, onClose, onSubmit, type, isUploading, initialData }) => {
  if (!isOpen) return null;
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', author: '', vol: '', url: '' });
  useEffect(() => { if (isOpen && initialData) setFormData({ title: initialData.title || '', description: initialData.description || '', author: initialData.author || '', vol: initialData.vol || '', url: initialData.url || '' }); else if (isOpen) setFormData({ title: '', description: '', author: '', vol: '', url: '' }); setFile(null); }, [isOpen, initialData]);
  const isEdit = !!initialData;
  return (
    <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200 border border-gray-100">
        <h2 className="text-2xl font-black mb-6 text-slate-900 text-left">{isEdit ? '✏️ 정보 수정' : (type === 'issue' ? '✨ 새 호수 발행' : '📝 새 자료 등록')}</h2>
        {isUploading ? (<div className="flex flex-col items-center justify-center py-10 space-y-4"><Loader2 className="animate-spin text-orange-500" size={40} /><p className="font-bold text-gray-500">업로드 중...</p></div>) : (
            <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...formData, file }); }} className="space-y-5 text-left">
            {type === 'issue' ? (<><div className="flex gap-3 text-left"><div className="w-1/3"><label className="block text-xs font-bold text-gray-400 mb-1">호수</label><input required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-orange-400 font-bold outline-none" value={formData.vol} onChange={e => setFormData({...formData, vol: e.target.value})}/></div><div className="flex-1 text-left"><label className="block text-xs font-bold text-gray-400 mb-1">제목</label><input required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-orange-400 font-bold outline-none" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}/></div></div><div className="text-left"><label className="block text-xs font-bold text-gray-400 mb-1">설명</label><textarea className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-orange-400 font-medium h-24 outline-none resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}/></div></>) : (
                <><div className="text-left"><label className="block text-xs font-bold text-gray-400 mb-1">자료 제목</label><input required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:border-orange-400" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}/></div><div className="text-left"><label className="block text-xs font-bold text-gray-400 mb-1">발행처</label><input required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-400 font-medium" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})}/></div><div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-left"><p className="text-[11px] font-black text-gray-500 mb-2">연결 방식</p><div className="space-y-3"><div><label className="flex items-center gap-2 text-[10px] font-bold text-gray-400 mb-1"><LinkIcon size={12}/> 웹 링크</label><input type="url" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none text-sm" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})}/></div><div><label className="flex items-center gap-2 text-[10px] font-bold text-gray-400 mb-1"><Paperclip size={12}/> PDF 파일 업로드</label><input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} className="w-full text-[11px] text-gray-500 file:border-0 file:bg-orange-50 file:text-orange-600 file:rounded-full file:px-4 file:py-1 file:font-black"/></div></div></div></>)}
            <div className="flex gap-3 pt-2"><button type="button" onClick={onClose} className="flex-1 py-3 text-gray-500 hover:bg-gray-100 rounded-xl font-bold transition-colors">취소</button><button type="submit" className="flex-1 py-3 bg-slate-900 text-white rounded-xl hover:bg-orange-600 font-bold shadow-md">확인</button></div>
            </form>)}
      </div>
    </div>
  );
};

const LoginModal = ({ isOpen, onClose, onLogin }) => {
  if (!isOpen) return null;
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const handleSubmit = (e) => { e.preventDefault();
  if (password === 'admin') { onLogin(); setPassword(''); setError(false); onClose(); } else { setError(true); } };
  return (
    <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4 backdrop-blur-sm text-center"><div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm p-8 border border-gray-100 animate-in zoom-in-95 text-center"><div className="mb-6 flex flex-col items-center"><div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4 text-orange-500"><Lock size={32} /></div><h2 className="text-2xl font-black text-slate-900">선생님 접속</h2></div><form onSubmit={handleSubmit} className="space-y-4"><input type="password" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-center tracking-widest outline-none focus:border-orange-400" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••"/>{error && <p className="text-red-500 text-xs font-bold">비밀번호가 일치하지 않습니다.</p>}<button type="submit" className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg active:scale-95 hover:bg-slate-800">로그인</button><button type="button" onClick={onClose} className="w-full py-2 text-gray-400 text-sm font-bold">닫기</button></form></div></div>
  );
};

// --- [뉴스 피드] ---
const NewsFeed = ({ limit, onMoreClick, isAdmin }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [backfillOpen, setBackfillOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const fetchStoredNews = async () => {
    if (!supabase) { setLoading(false); return; }
    try {
      const { data, error } = await supabase.from('news').select('*').order('pub_date', { ascending: false }).limit(limit ? limit : 100);
      if (!error && data) setNews(data);
    } catch (e) { console.error("뉴스 로드 오류:", e); } finally { setLoading(false); }
  };
  const scrapeAndSyncNews = async (startDate = null, endDate = null) => {
    if (!supabase) return;
    setIsUpdating(true);
    try {
      const searchKeywords = ['유보통합', '영유아학교']; 
      let allItems = [];
      const googlePromises = searchKeywords.map(async (query) => {
          let googleQuery = query; if (startDate && endDate) googleQuery += ` after:${startDate} before:${endDate}`;
          const RSS_URL = `https://news.google.com/rss/search?q=${encodeURIComponent(googleQuery)}&hl=ko&gl=KR&ceid=KR:ko&scoring=n`;
          const PROXY_URL = `https://api.allorigins.win/raw?url=${encodeURIComponent(RSS_URL)}&t=${Date.now()}`;
          try { const res = await fetch(PROXY_URL); if(!res.ok) return []; const text = await res.text(); const xml = new DOMParser().parseFromString(text, "text/xml"); return Array.from(xml.querySelectorAll("item")).map(item => ({ title: item.querySelector("title")?.textContent || "", link: item.querySelector("link")?.textContent || "", description: (item.querySelector("description")?.textContent || "").replace(/<[^>]*>?/gm, ''), author: item.querySelector("source")?.textContent || "Google News", pub_date: new Date(item.querySelector("pubDate")?.textContent || Date.now()).toISOString() })); } catch(e) { return []; }
      });
      const results = await Promise.all(googlePromises);
      allItems = results.flat();
      const uniqueItems = Array.from(new Map(allItems.map(item => [item.link, item])).values()).filter(item => item.title && item.link && item.pub_date);
      if (uniqueItems.length > 0) { await supabase.from('news').upsert(uniqueItems, { onConflict: 'link', ignoreDuplicates: true }); await fetchStoredNews(); }
      if (startDate) alert(`${uniqueItems.length}개의 기사를 수집했습니다.`);
    } catch (err) { console.error("뉴스 수집 오류:", err);
    } finally { setBackfillOpen(false); setIsUpdating(false); }
  };

  useEffect(() => { fetchStoredNews(); if (!limit) scrapeAndSyncNews(); }, [limit]);
  const displayNews = (Array.isArray(news) ? news : []).filter(item => searchTerm === '' || item.title.toLowerCase().includes(searchTerm.toLowerCase()));
  if (loading) return <div className="py-20 text-center text-orange-400 font-bold text-sm"><Loader2 className="animate-spin inline mr-2"/> 뉴스 로딩 중...</div>;
  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${limit ? 'py-12' : 'py-16'} animate-in fade-in duration-500`}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
             <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">News Room</span>
          </div>
          {/* ✅ 명칭 변경 (#6) */}
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">지식 플랫폼 뉴스룸</h2>
        </div>
        
        <div className="flex items-center gap-3">
           {!limit && (
             <div className="relative group w-full md:w-64">
               <input type="text" placeholder="뉴스 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2.5 bg-gray-100 border-none rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all w-full"/>
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
             </div>
           )}
           <button onClick={() => scrapeAndSyncNews()} disabled={isUpdating} className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-slate-600 transition-colors disabled:opacity-50">
             {isUpdating ? <Loader2 size={18} className="animate-spin"/> : <RefreshCw size={18} />}
           </button>
           {limit ? (
             <button onClick={onMoreClick} className="flex items-center gap-1 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-sm">
               전체보기 <ArrowRight size={16}/>
             </button>
           ) : (
             isAdmin && <button onClick={() => setBackfillOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-orange-100 text-orange-700 rounded-xl text-sm font-bold hover:bg-orange-200 transition-colors"><Filter size={16}/> 과거 수집</button>
           )}
        </div>
      </div>
      {backfillOpen && (<div className="mb-8 p-6 bg-white border border-gray-100 rounded-[2rem] shadow-xl text-left animate-in slide-in-from-top-2"><h4 className="font-black text-slate-900 mb-4 flex items-center gap-2 text-left"><Calendar size={18}/> 날짜별 뉴스 수집 (관리자용)</h4><div className="flex flex-col md:flex-row gap-4 items-center"><input id="start-date" type="date" className="flex-1 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:border-orange-400"/><input id="end-date" type="date" className="flex-1 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:border-orange-400"/><button onClick={() => { const s = document.getElementById('start-date').value; const e = document.getElementById('end-date').value; if(s && e) scrapeAndSyncNews(s, e); else alert('기간 선택 필요'); }} className="w-full md:w-auto px-8 py-3 bg-slate-900 text-white rounded-xl font-black shadow-lg">수집 시작</button></div></div>)}
      <div className={`grid ${limit ? 'grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6' : 'grid-cols-1 gap-4'}`}>
        {displayNews.map((item, index) => (
          <a key={index} href={item.link} target="_blank" rel="noopener noreferrer" className="group flex gap-5 items-start p-5 rounded-2xl hover:bg-white border border-transparent hover:border-gray-100 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300">
            <div className="hidden sm:flex flex-col items-center justify-center w-16 h-16 bg-slate-100 rounded-2xl shrink-0 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
               <span className="text-[10px] font-bold uppercase opacity-70">{new Date(item.pub_date).toLocaleString('en-US', { month: 'short' })}</span>
              <span className="text-xl font-black leading-none mt-0.5">{new Date(item.pub_date).getDate()}</span>
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${item.author.includes('Google') ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                   {item.author.includes('Google') ? 'Google' : 'Naver'}
                 </span>
                 <span className="text-xs text-slate-400 font-medium sm:hidden">{new Date(item.pub_date).toLocaleDateString()}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800 leading-tight group-hover:text-orange-600 transition-colors line-clamp-2 break-keep mb-2">
                {item.title.replace(/<[^>]*>?/gm, '')}
               </h3>
              {!limit && <p className="text-sm text-slate-500 line-clamp-1 group-hover:text-slate-600">{item.description}</p>}
            </div>
            {!limit && <ChevronRight size={20} className="hidden sm:block text-gray-300 self-center group-hover:text-orange-500 group-hover:translate-x-1 transition-all"/>}
          </a>
        ))}
        {displayNews.length === 0 && <div className="col-span-full py-20 text-gray-400 font-bold text-center bg-white rounded-3xl border border-dashed border-gray-200">데이터가 없습니다.</div>}
      </div>
    </div>
  );
};

const IssueCard = ({ issue, onClick, isAdmin, onDelete, onEdit }) => (
  <div onClick={() => onClick(issue)} className="group cursor-pointer flex flex-col gap-3 relative text-left">
    <div className={`aspect-[4/5] w-full ${issue.cover_color || 'bg-slate-200'} rounded-2xl overflow-hidden relative shadow-sm group-hover:shadow-md transition-all duration-500`}>
      <div className="absolute inset-0 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-700 ease-out">
        <div className="text-5xl md:text-8xl filter drop-shadow-sm opacity-90 transition-transform">{issue.icon || '📚'}</div>
      </div>
      <div className="absolute top-3 left-3 z-10">
         <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-md border border-white/20 shadow-sm text-[10px] font-bold tracking-widest uppercase text-slate-900">
           Vol.{issue.vol}
         </span>
      </div>
    </div>
    <div className="flex flex-col px-0.5">
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-bold text-slate-400 mb-1 block">{issue.date}</span>
        {isAdmin && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
             <button onClick={(e) => { e.stopPropagation(); onEdit(issue); }} className="p-1 text-blue-500 hover:bg-blue-50 rounded"><Edit size={14}/></button>
             <button onClick={(e) => { e.stopPropagation(); onDelete(issue.id); }} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
          </div>
        )}
      </div>
      <h3 className="text-base md:text-lg font-bold text-slate-900 leading-tight group-hover:text-orange-600 transition-colors line-clamp-2 break-keep">
        {issue.title}
      </h3>
      <p className="hidden md:block text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
        {issue.description}
      </p>
    </div>
  </div>
);

const ArticleItem = ({ article, onClick, isAdmin, onDelete, onEdit }) => (
  <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-200 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full relative text-left" onClick={() => onClick(article)}>
    <div className="aspect-[4/5] bg-slate-50 relative overflow-hidden flex items-center justify-center">
      {article.thumbnailUrl ? (<img src={article.thumbnailUrl} alt="표지" className="w-full h-full object-cover transition-transform group-hover:scale-105" />) : (<div className="w-full h-full flex flex-col items-center justify-center text-orange-200 bg-orange-50/50 group-hover:bg-orange-100 transition-colors"><FileText size={48} className="mb-2"/><span className="text-[10px] font-black uppercase text-orange-300">PDF</span></div>)}
      {article.fileUrl && <div className="absolute top-3 left-3 bg-red-500 text-white text-[9px] font-black px-2 py-1 rounded-md shadow-sm">PDF</div>}
    </div>
    <div className="p-4 flex flex-col flex-1 bg-white text-left">
      <h4 className="text-base font-bold text-slate-900 leading-snug mb-2 line-clamp-2 group-hover:text-orange-500">{article.title}</h4>
      <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between"><span className="text-xs font-bold text-gray-400 truncate flex items-center gap-1">{article.author}{article.views > 0 && <span className="flex items-center ml-2"><Eye size={10} className="mr-0.5"/> {article.views}</span>}</span><div className="flex gap-1"><button onClick={(e) => { e.preventDefault();
      e.stopPropagation(); handleShare(article.title, '자료 공유', window.location.href); }} className="w-7 h-7 bg-gray-50 hover:bg-orange-50 text-gray-300 hover:text-orange-500 rounded-full flex items-center justify-center transition-colors"><Share2 size={12} /></button>{isAdmin && <button onClick={(e) => { e.stopPropagation();
      onDelete(article.id); }} className="w-7 h-7 bg-gray-50 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-full flex items-center justify-center transition-colors"><Trash2 size={12} /></button>}</div></div>
    </div>
  </div>
);

// --- [메인 앱 로직] ---
const MainApp = () => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [view, setView] = useState('home'); 
  const [issues, setIssues] = useState([]);
  const [currentIssue, setCurrentIssue] = useState(null);
  const [currentArticle, setCurrentArticle] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadType, setUploadType] = useState('issue'); 
  const [isUploading, setIsUploading] = useState(false);
  const [editTarget, setEditTarget] = useState(null); 

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#article/')) {
        const articleId = hash.replace('#article/', '');
        const articleFound = issues.flatMap(i => i.articles || []).find(a => String(a.id) === String(articleId));
        if (articleFound) { setCurrentArticle(articleFound); setView('article'); }
      } else if (hash.startsWith('#issue/')) {
        const issueId = Number(hash.replace('#issue/', ''));
        const issueFound = issues.find(i => i.id === issueId);
        if (issueFound) { setCurrentIssue(issueFound); setView('issue'); }
      } else if (hash === '#news') { setView('news'); }
      else if (hash === '#issues') { setView('issue_list'); }
      else { setView('home'); setCurrentIssue(null); setCurrentArticle(null); }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [issues]);

  useEffect(() => { 
    if (supabase) {
        supabase.from('issues').select('*').order('created_at', { ascending: false }).then(({data, error}) => { if(!error && data) setIssues(data); });
    }
  }, []);

  // ✅ [수정] 로그아웃 로직 강화 (#3)
  const handleLogout = async () => {
    try {
        await supabase.auth.signOut();
        setIsAdminMode(false);
        window.location.reload();
    } catch (e) {
        console.error("Logout failed:", e);
        window.location.reload();
    }
  };

  const handleCreateIssue = async (data) => {
    if (!supabase) return; setIsUploading(true);
    try {
        if (editTarget) { await supabase.from('issues').update({ vol: data.vol, title: data.title, description: data.description }).eq('id', editTarget.id);
        setEditTarget(null); } 
        else { const newIssue = { vol: data.vol, title: data.title, date: new Date().toLocaleDateString(), cover_color: "bg-orange-400", icon: "📚", description: data.description, created_at: Date.now(), articles: [] };
        await supabase.from('issues').insert([newIssue]); }
        const { data: refreshed } = await supabase.from('issues').select('*').order('created_at', { ascending: false });
        setIssues(refreshed || []); setIsUploadOpen(false);
    } catch (e) { alert('오류 발생'); } finally { setIsUploading(false); }
  };
  const handleAddArticle = async (data) => {
    if (!currentIssue || !supabase) return; setIsUploading(true);
    try {
        let fileUrl = editTarget?.fileUrl || '', thumbnailUrl = editTarget?.thumbnailUrl || '';
        if (data.file) {
            const fn = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.pdf`;
            const thumbBlob = await generatePDFThumbnail(data.file);
            await supabase.storage.from('files').upload(fn, data.file);
            fileUrl = supabase.storage.from('files').getPublicUrl(fn).data.publicUrl;
            if (thumbBlob) { const thumbName = `thumb_${fn}.jpg`;
            await supabase.storage.from('files').upload(thumbName, thumbBlob); thumbnailUrl = supabase.storage.from('files').getPublicUrl(thumbName).data.publicUrl; }
        }
        let updated = editTarget ?
        currentIssue.articles.map(a => a.id === editTarget.id ? { ...a, ...data, fileUrl, thumbnailUrl, file: undefined } : a) : [...(currentIssue.articles || []), { id: Date.now().toString(), ...data, fileUrl, thumbnailUrl, isNew: true, views: 0 }];
        await supabase.from('issues').update({ articles: updated }).eq('id', currentIssue.id); setCurrentIssue({ ...currentIssue, articles: updated });
        const { data: refreshed } = await supabase.from('issues').select('*').order('created_at', { ascending: false }); setIssues(refreshed || []); setIsUploadOpen(false); setEditTarget(null);
    } catch (e) { alert("업로드 실패: " + e.message); } finally { setIsUploading(false); }
  };
  const handleDeleteIssue = async (issueId) => { if (!window.confirm("삭제하시겠습니까?")) return; await supabase.from('issues').delete().eq('id', issueId);
  const { data } = await supabase.from('issues').select('*').order('created_at', { ascending: false }); setIssues(data || []); if(currentIssue?.id === issueId) window.location.hash = '#issues';
  };
  const handleDeleteArticle = async (articleId) => { if (!window.confirm("삭제하시겠습니까?")) return; const updatedArticles = currentIssue.articles.filter(a => a.id !== articleId);
  await supabase.from('issues').update({ articles: updatedArticles }).eq('id', currentIssue.id); setCurrentIssue({ ...currentIssue, articles: updatedArticles });
  const { data } = await supabase.from('issues').select('*').order('created_at', { ascending: false }); setIssues(data || []); };
  const handleEditIssue = (issue) => { setEditTarget(issue); setUploadType('issue'); setIsUploadOpen(true); };
  const handleEditArticle = (article) => { setEditTarget(article); setUploadType('article'); setIsUploadOpen(true); };
  const onUploadSubmit = (data) => { if (uploadType === 'issue') handleCreateIssue(data); else handleAddArticle(data); };

  const displayIssues = Array.isArray(issues) ? issues : [];

  return (
    <div className="min-h-screen bg-[#F5F5F7] font-sans text-slate-900 overflow-x-hidden selection:bg-orange-100 selection:text-orange-600 flex flex-col">
      <Navbar isAdmin={isAdminMode} onLoginClick={() => setIsLoginOpen(true)} onLogout={handleLogout} onHomeClick={() => window.location.hash = ''} onViewChange={(v) => window.location.hash = (v === 'news' ? '#news' : (v === 'issue_list' ? '#issues' : ''))} currentView={view} />
      
      <main className="flex-1 pb-20">
        
        {view === 'home' && (
           <div className="animate-in fade-in duration-500 space-y-20">
            <section className="pt-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
               <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[400px]">
                  <div className="col-span-12 md:col-span-7 bg-white rounded-[2rem] p-8 md:p-12 flex flex-col justify-center items-start shadow-sm border border-gray-100 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-orange-200/50 transition-colors duration-700"></div>
                     <div className="relative z-10 text-left">
                        <span className="inline-block py-1 px-3 rounded-full bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider mb-4 border border-slate-200">The First Step of Education</span>
                        {/* ✅ 명칭 변경 (#6) */}
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-tight mb-6 tracking-tight">
                           아이의 내일을 잇는 <br/>
                           <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500">지식 플랫폼.</span>
                        </h1>
                        <p className="text-slate-500 text-lg font-medium mb-8 max-w-md">현장의 목소리부터 미래 교육의 트렌드까지,<br/>선생님에게 꼭 필요한 깊이 있는 정보를 전합니다.</p>
                        <div className="flex gap-3">
                           <button onClick={() => window.location.hash = '#issues'} className="px-8 py-3.5 bg-slate-900 text-white rounded-full font-bold shadow-lg shadow-slate-200 hover:bg-orange-500 hover:shadow-orange-200 transition-all transform active:scale-95 flex items-center gap-2">
                             인사이트 탐색하기 <ArrowRight size={18}/>
                           </button>
                        </div>
                     </div>
                  </div>

                  <div onClick={() => displayIssues[0] && (window.location.hash = `#issue/${displayIssues[0].id}`)} className="col-span-12 md:col-span-5 bg-orange-500 rounded-[2rem] p-8 relative overflow-hidden cursor-pointer group shadow-lg shadow-orange-200">
                     {displayIssues[0] ? (
                        <>
                           <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/10 z-10"/>
                           <div className="relative z-20 h-full flex flex-col justify-between text-white text-left">
                              <div className="flex justify-between items-start">
                                 <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold border border-white/10">NEW ISSUE</span>
                                 <div className="p-2 bg-white/10 rounded-full group-hover:bg-white group-hover:text-orange-500 transition-colors"><ArrowUpRight size={24}/></div>
                              </div>
                              <div>
                                 <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-500 origin-bottom-left">{displayIssues[0].icon}</div>
                                 <h3 className="text-2xl font-black leading-tight line-clamp-2">{displayIssues[0].title}</h3>
                                 <p className="text-white/80 text-sm mt-2 font-medium line-clamp-1">{displayIssues[0].description}</p>
                              </div>
                           </div>
                        </>
                     ) : (
                        <div className="h-full flex items-center justify-center text-white/50 font-bold">발행된 소식이 없습니다.</div>
                     )}
                  </div>
               </div>
            </section>

            <NewsFeed limit={4} onMoreClick={() => window.location.hash = '#news'} isAdmin={isAdminMode}/>
            
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
              <div className="flex items-end justify-between mb-8 border-b border-gray-200 pb-6">
                 <div className="text-left">
                    <h2 className="text-3xl font-black text-slate-900">월간 자료실</h2>
                    <p className="text-slate-500 font-medium mt-1">지난 호수들을 확인해보세요.</p>
                 </div>
                 <button onClick={() => window.location.hash = '#issues'} className="text-sm font-bold text-slate-400 hover:text-orange-500 flex items-center gap-1 transition-colors">전체보기 <ChevronRight size={16}/></button>
              </div>
              {displayIssues.length === 0 ? <div className="text-center py-32 bg-white rounded-[2rem] border border-dashed border-gray-200 text-gray-400 font-bold">아직 발행된 소식이 없습니다.</div> 
                 : 
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                    {displayIssues.slice(0, 4).map(issue => (
                       <IssueCard key={issue.id} issue={issue} onClick={(iss) => window.location.hash = `#issue/${iss.id}`} isAdmin={isAdminMode} onDelete={handleDeleteIssue} onEdit={handleEditIssue}/>
                    ))}
                 </div>
              }
            </section>
          </div>
        )}

        {view === 'news' && <NewsFeed isAdmin={isAdminMode} />}

        {view === 'issue_list' && (
           <div className="animate-in fade-in duration-500 pt-10">
             <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 text-center">
                <span className="text-orange-500 font-bold tracking-widest uppercase text-xs mb-2 block">Archive</span>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">월간 자료실</h2>
                <p className="text-slate-500 text-lg max-w-2xl mx-auto">유보통합 실무에 필요한 핵심 자료들을 모았습니다.</p>
                {isAdminMode && <button onClick={() => { setUploadType('issue');
                setEditTarget(null); setIsUploadOpen(true); }} className="mt-8 bg-slate-900 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-orange-500 transition-all flex items-center gap-2 mx-auto"><Plus size={18} /> 새 호수 발행</button>}
             </div>
             <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-8">
                  {displayIssues.map(issue => (<IssueCard key={issue.id} issue={issue} onClick={(iss) => window.location.hash = `#issue/${iss.id}`} isAdmin={isAdminMode} onDelete={handleDeleteIssue} onEdit={handleEditIssue}/>))}
               </div>
             </div>
           </div>
        )}

        {view === 'issue' && currentIssue && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 bg-white min-h-screen">
             <div className="max-w-5xl mx-auto px-4 pt-10 pb-20">
                <button onClick={() => window.location.hash = '#issues'} className="mb-8 flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors"><ArrowLeft size={20}/> 목록으로 돌아가기</button>
                <div className={`w-full ${currentIssue.cover_color} rounded-[2.5rem] p-10 md:p-16 text-white shadow-2xl relative overflow-hidden mb-16 text-left`}>
                    <div className="relative z-10 flex flex-col md:flex-row items-start gap-8">
                        <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-5xl shadow-inner border border-white/10">{currentIssue.icon}</div>
                        <div>
                           <div className="flex gap-3 mb-4 text-xs font-bold tracking-widest uppercase opacity-80">
                              <span>Vol.{currentIssue.vol}</span>
                              <span>•</span>
                              <span>{currentIssue.date}</span>
                           </div>
                           <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6">{currentIssue.title}</h1>
                           <p className="text-lg opacity-90 leading-relaxed max-w-2xl">{currentIssue.description}</p>
                        </div>
                    </div>
                  </div>
                
                <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
                   <h3 className="text-2xl font-bold text-slate-900">포함된 자료</h3>
                   {isAdminMode && <button onClick={() => { setUploadType('article');
                   setEditTarget(null); setIsUploadOpen(true); }} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-orange-500 transition-colors">자료 추가 +</button>}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                   {currentIssue.articles?.map(article => (
                      <ArticleItem key={article.id} article={article} onClick={(art) => window.location.hash = `#article/${art.id}`} isAdmin={isAdminMode} onDelete={handleDeleteArticle} onEdit={handleEditArticle}/>
                   ))}
                </div>
             </div>
          </div>
        )}
        {view === 'article' && currentArticle && (<CustomPDFViewer article={currentArticle} onBack={() => { window.location.hash = `#issue/${currentIssue.id}`; }} />)}
      </main>

      <div className="hidden md:block bg-white"><Footer /></div>
      <BottomNav currentView={view} onViewChange={(v) => { if (v === 'news') window.location.hash = '#news';
      else if (v === 'issue_list') window.location.hash = '#issues'; else window.location.hash = '';
      }} onMenuClick={() => setIsLoginOpen(true)} />
      
      <div className="h-16 md:hidden"></div>
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} onLogin={() => setIsAdminMode(true)}/>
      <UploadModal isOpen={isUploadOpen} onClose={() => {setIsUploadOpen(false);
      setEditTarget(null);}} onSubmit={onUploadSubmit} type={uploadType} isUploading={isUploading} initialData={editTarget}/>
    </div>
  );
}

export default function App() { return (<ErrorBoundary><MainApp /></ErrorBoundary>); }
