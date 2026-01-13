// ✅ [v20.0 Stable] 유보통합 웹진 새로운 표준 코드
// - 핵심 기능: 뉴스 검색, 하이브리드 PDF 뷰어(제스처), SNS 공유, 반응형 푸터 탑재
// - 기술 스택: React(Local), Supabase(CDN), PDF.js(CDN Injection)

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Book, FileText, User, Lock, LogOut, ChevronRight, ArrowLeft, 
  Search, Plus, Trash2, Eye, ChevronLeft, ZoomIn, ZoomOut, Download, 
  Link as LinkIcon, ExternalLink, RefreshCw, Star, Heart, Cloud, 
  Paperclip, Server, Database, Image as ImageIcon, Loader2, List, 
  Edit, Share2, X, Newspaper, Calendar, Filter, AlertTriangle, AlertCircle, Zap, Menu, 
  MousePointer2, Smartphone, Mail, Instagram, MessageCircle, Copy
} from 'lucide-react';

// ✅ [핵심] Supabase CDN 로드 (빌드 없이 즉시 사용)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// --- [Supabase 설정] ---
const YOUR_SUPABASE_URL = "https://rmlaqmrrkeiplabaikqi.supabase.co";
const YOUR_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtbGFxbXJya2VpcGxhYmFpa3FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MjQ5MTgsImV4cCI6MjA4MzMwMDkxOH0.-W8OO4wJGaZVojfmj9cj-PVpx8BmvZLLiftCf5_yfKA"; 

let supabase = null;
try {
  supabase = createClient(YOUR_SUPABASE_URL, YOUR_SUPABASE_KEY);
} catch (e) {
  console.error("Supabase 초기화 실패:", e);
}

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

// --- [유틸리티] 공유 기능 (Web Share API & Fallback) ---
const handleShare = async (title, text, url) => {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
    } catch (error) {
      console.log('공유 취소됨');
    }
  } else {
    try {
      await navigator.clipboard.writeText(url);
      alert('주소가 클립보드에 복사되었습니다.');
    } catch (err) {
      alert('공유하기를 지원하지 않는 환경입니다.');
    }
  }
};

// --- [유틸리티] 조회수 증가 (RPC 호출 시뮬레이션) ---
const incrementViewCount = async (table, id, currentViews) => {
  if (!supabase) return;
  try {
    await supabase.from(table).update({ views: (currentViews || 0) + 1 }).eq('id', id);
  } catch (e) {
    console.error("조회수 증가 실패:", e);
  }
};

// --- [에러 방어막] ---
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error("앱 렌더링 오류:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#FFF9F0]">
          <AlertCircle size={48} className="text-orange-500 mb-4" />
          <h1 className="text-xl font-bold mb-2 text-gray-800">앱을 불러오는 중입니다.</h1>
          <button onClick={() => window.location.reload()} className="bg-orange-500 text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:bg-orange-600 transition-colors">새로고침</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- [도우미] PDF 라이브러리 스크립트 로더 ---
const loadPdfScript = () => {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) {
      resolve(window.pdfjsLib);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      } else {
        reject(new Error("PDF 라이브러리 로드 실패"));
      }
    };
    script.onerror = () => reject(new Error("스크립트 로드 오류"));
    document.head.appendChild(script);
  });
};

// --- [도우미] 썸네일 생성 ---
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
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({ canvasContext: context, viewport }).promise;
    return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.8));
  } catch (e) {
    console.warn("썸네일 생성 실패:", e);
    return null;
  }
};

// --- [도우미] 두 손가락 거리 계산 ---
const getTouchDistance = (touches) => {
  return Math.hypot(
    touches[0].clientX - touches[1].clientX,
    touches[0].clientY - touches[1].clientY
  );
};

// --- [순수 PDF 뷰어 컴포넌트 (제스처 엔진 탑재)] ---
const CustomPDFViewer = ({ article, onBack }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const contentWrapperRef = useRef(null); // 핀치 줌 시 transform 적용할 대상
  
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNum, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isOutlineOpen, setIsOutlineOpen] = useState(true);
  const [outline, setOutline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [libReady, setLibReady] = useState(false);
  
  // 제스처 상태
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const lastTapTime = useRef(0); 
  const pinchStartDist = useRef(0);
  const pinchStartScale = useRef(1);
  const isPinching = useRef(false);
  const tempPinchScaleRef = useRef(1); // 핀치 중 임시 스케일

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

  // 키보드 이벤트
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!pdfDoc) return;
      if (e.key === 'ArrowLeft') setPageNumber(p => Math.max(1, p - 1));
      if (e.key === 'ArrowRight') setPageNumber(p => Math.min(pdfDoc.numPages, p + 1));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pdfDoc]);

  // 라이브러리 로드
  useEffect(() => {
    let isMounted = true;
    const initLibrary = async () => {
      try {
        await loadPdfScript();
        if (isMounted) setLibReady(true);
      } catch (e) {
        if (isMounted) setError(true);
      }
    };
    initLibrary();
    return () => { isMounted = false; };
  }, []);

  // 문서 로드
  useEffect(() => {
    if (!libReady || !article.fileUrl) return;

    let isMounted = true;
    const loadPdf = async () => {
      setLoading(true);
      setError(false);
      try {
        const pdfjs = window.pdfjsLib; 
        const loadingTask = pdfjs.getDocument(article.fileUrl);
        const doc = await loadingTask.promise;
        
        if (!isMounted) return;
        setPdfDoc(doc);
        setPageNumber(1);
        try {
          const outlineData = await doc.getOutline();
          setOutline(outlineData || []);
        } catch (e) { console.warn("목차 없음"); }
        incrementViewCount('articles', article.id, article.views);
      } catch (err) {
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadPdf();
    return () => { isMounted = false; };
  }, [libReady, article.fileUrl]);

  // 렌더링
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || !containerSize.width) return;
    let renderTask = null;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const viewportOriginal = page.getViewport({ scale: 1 });
        
        let finalScale = scale;
        // 기본 핏 계산 (줌인 상태가 아닐 때만 적용하거나, scale이 1.0 근처일때만 보정)
        if (scale < 1.1) {
             if (isMobile) {
                const availableWidth = containerSize.width - 20;
                // 모바일에서도 너무 작아지지 않게 최소 스케일 보정
                finalScale = Math.max((availableWidth / viewportOriginal.width) * scale, 0.5);
            } else {
                const availableHeight = containerSize.height - 40; 
                const fitHeightScale = availableHeight / viewportOriginal.height;
                const fitWidthScale = (containerSize.width - 64) / viewportOriginal.width; 
                finalScale = Math.min(fitHeightScale, fitWidthScale) * scale;
            }
        } else {
             // 줌인 상태에서는 기본 핏 무시하고 배율 적용 (다만 모바일 기본 너비 기준)
             if(isMobile) {
                const availableWidth = containerSize.width - 20;
                const baseScale = availableWidth / viewportOriginal.width;
                // 현재 scale state는 배수 개념으로 사용 (1.0 = fit width)
                finalScale = baseScale * scale;
             }
        }

        const viewport = page.getViewport({ scale: finalScale });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport }).promise;
      } catch (err) {
        if (err?.name !== 'RenderingCancelledException') console.error("Render error:", err);
      }
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

  // --- [UX] 제스처 핸들러 (핀치줌 & 더블탭 & 스와이프) ---
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      // 핀치 시작
      isPinching.current = true;
      pinchStartDist.current = getTouchDistance(e.touches);
      pinchStartScale.current = scale;
    } else {
      // 스와이프/탭 시작
      isPinching.current = false;
      touchStartX.current = e.changedTouches[0].screenX;
    }
  };

  const handleTouchMove = (e) => {
    if (isPinching.current && e.touches.length === 2 && contentWrapperRef.current) {
      // 핀치 중에는 브라우저 줌 방지 및 실시간 변환 없음(이벤트 핸들러에서 분리)
      e.preventDefault(); 
    }
  };

  const handlePinchMove = (e) => {
      if (e.touches.length === 2 && contentWrapperRef.current) {
        e.preventDefault(); 
        const currentDist = getTouchDistance(e.touches);
        const ratio = currentDist / pinchStartDist.current;
        tempPinchScaleRef.current = Math.min(Math.max(pinchStartScale.current * ratio, 0.5), 4.0);
        
        // 시각적 피드백 (Canvas 스케일링)
        contentWrapperRef.current.style.transform = `scale(${ratio})`;
        contentWrapperRef.current.style.transformOrigin = 'center top';
      }
  };

  const handlePinchEnd = () => {
      if (contentWrapperRef.current) {
          contentWrapperRef.current.style.transform = 'none';
          // 손을 떼면 고화질 렌더링 수행
          setScale(tempPinchScaleRef.current);
      }
      isPinching.current = false;
  };

  const handleTouchEnd = (e) => {
    if (isPinching.current) {
      // 핀치가 끝났지만 터치 포인트가 남은 경우 (손가락 하나만 뗐을 때)
      if (e.touches.length < 2) {
        handlePinchEnd();
      }
    } else {
      // 스와이프 및 더블탭 로직
      touchEndX.current = e.changedTouches[0].screenX;
      
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTapTime.current;
      
      if (tapLength < 300 && tapLength > 0) {
        // [더블탭 감지]
        e.preventDefault(); // 브라우저 더블탭 줌 방지
        const newScale = scale > 1.2 ? 1.0 : 2.0; // 토글
        setScale(newScale);
      } else {
        handleSwipeGesture();
      }
      lastTapTime.current = currentTime;
    }
  };

  const handleSwipeGesture = () => {
    if (scale > 1.2) return; // 확대 상태에서는 스와이프 페이지 이동 방지 (패닝 해야함)
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 50) {
      if (pageNum < pdfDoc.numPages) setPageNumber(p => p + 1);
    } else if (distance < -50) {
      if (pageNum > 1) setPageNumber(p => p - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#FDF8F0] z-[110] flex flex-col h-screen w-screen animate-in fade-in duration-300 text-left">
      {/* 툴바 (UI 고정됨) */}
      <div className="h-16 bg-white border-b border-orange-100 flex items-center justify-between px-4 shrink-0 shadow-sm z-[120]">
        <div className="flex items-center gap-3 overflow-hidden">
          <button onClick={onBack} className="p-2 hover:bg-orange-50 rounded-full text-slate-600 transition-colors"><ArrowLeft size={20} /></button>
          <button onClick={() => setIsOutlineOpen(!isOutlineOpen)} className={`p-2 rounded-lg transition-colors ${isOutlineOpen ? 'bg-orange-100 text-orange-600' : 'text-slate-500 hover:bg-gray-50'}`}>
            {isOutlineOpen ? <X size={20}/> : <List size={20}/>}
          </button>
          <h3 className="font-bold truncate text-sm md:text-lg text-slate-800">{article.title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => handleShare(article.title, '유보통합 웹진 자료 공유', window.location.href)} className="p-2 text-slate-500 hover:bg-orange-50 hover:text-orange-500 rounded-full transition-colors">
            <Share2 size={20} />
          </button>
          <div className="hidden md:flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200 shadow-inner mr-2">
             <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} className="p-1.5 hover:bg-white rounded text-slate-500"><ZoomOut size={16}/></button>
             <span className="w-12 text-center text-xs text-slate-600 font-mono font-bold">{Math.round(scale * 100)}%</span>
             <button onClick={() => setScale(s => Math.min(3.0, s + 0.2))} className="p-1.5 hover:bg-white rounded text-slate-500"><ZoomIn size={16}/></button>
           </div>
           {article.fileUrl && <a href={article.fileUrl} target="_blank" download className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-lg transition-colors hidden sm:flex shadow-md shadow-orange-200"><Download size={18}/></a>}
        </div>
      </div>

      <div className="flex-1 flex relative overflow-hidden bg-slate-100">
        {/* 목차 사이드바 (UI 고정됨) */}
        <div className={`absolute md:relative left-0 top-0 bottom-0 w-72 bg-white border-r border-orange-100 transition-all duration-300 z-[115] flex flex-col shadow-xl md:shadow-none ${isOutlineOpen ? 'translate-x-0' : '-translate-x-full md:w-0 md:border-none'}`}>
            <div className="p-4 border-b border-orange-50 flex justify-between items-center text-slate-700 bg-orange-50/30">
              <span className="font-bold text-sm">목차</span>
            </div>
            <div className="overflow-y-auto flex-1 p-2 custom-scrollbar bg-white">
              {outline.length > 0 ? (
                <ul className="space-y-1">
                  {outline.map((item, idx) => (
                    <li key={idx} onClick={() => handleOutlineClick(item.dest)} className="text-sm text-slate-600 hover:bg-orange-50 hover:text-orange-700 py-2.5 px-3 rounded cursor-pointer truncate transition-colors border-b border-gray-50 last:border-0 font-medium">
                      {item.title}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 text-xs text-center mt-10">{loading ? "로딩 중..." : "목차가 없는 문서입니다."}</p>
              )}
            </div>
        </div>

        {/* 뷰어 컨테이너 (제스처 영역) */}
        <div 
          className="flex-1 overflow-auto flex justify-center items-start p-2 md:p-8 relative" 
          ref={containerRef} 
          style={{ touchAction: 'none' }} // 브라우저 기본 동작 차단 (핵심)
          onTouchStart={handleTouchStart}
          onTouchMove={(e) => isPinching.current ? handlePinchMove(e) : null}
          onTouchEnd={(e) => isPinching.current ? handlePinchEnd(e) : handleTouchEnd(e)}
        >
           {article.fileUrl ? (
             <div 
                ref={contentWrapperRef} // 변환(Transform) 대상
                className="relative shadow-2xl bg-white transition-transform duration-75 origin-top mt-2 md:mt-0"
             >
                {(!libReady || loading) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 gap-3 min-h-[300px]">
                    <Loader2 size={48} className="animate-spin text-orange-400"/>
                    <span className="text-sm font-bold text-gray-400">{!libReady ? "뷰어 엔진 로딩 중..." : "문서 로딩 중..."}</span>
                  </div>
                )}
                {error && <div className="flex flex-col items-center justify-center w-full h-96 text-red-400 bg-white"><AlertTriangle size={48}/><p className="mt-2 font-bold">문서 로드 실패</p></div>}
                <canvas ref={canvasRef} className="block bg-white"/>
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center h-full text-gray-400"><LinkIcon size={48} className="mx-auto mb-4 opacity-30"/><p>외부 링크 자료입니다.</p></div>
           )}
        </div>
      </div>

      {pdfDoc && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-orange-100 px-6 py-2 rounded-full shadow-xl flex items-center gap-6 z-[130]">
          <button onClick={() => setPageNumber(p => Math.max(1, p-1))} disabled={pageNum <= 1} className="p-2 rounded-full text-orange-600 hover:bg-orange-100 disabled:opacity-20 transition-colors"><ChevronLeft size={24}/></button>
          <span className="text-slate-800 font-mono font-black text-lg min-w-[60px] text-center">{pageNum} <span className="text-gray-300 text-sm">/</span> {pdfDoc.numPages}</span>
          <button onClick={() => setPageNumber(p => Math.min(pdfDoc.numPages, p+1))} disabled={pageNum >= pdfDoc.numPages} className="p-2 rounded-full text-orange-600 hover:bg-orange-100 disabled:opacity-20 transition-colors"><ChevronRight size={24}/></button>
        </div>
      )}
    </div>
  );
};

// --- [네비게이션 컴포넌트] ---
const Navbar = ({ isAdmin, onLoginClick, onLogout, onHomeClick, onViewChange, currentView }) => (
  <nav className="w-full bg-[#FFF9F0] border-b-4 border-orange-100 sticky top-0 z-[60] backdrop-blur-sm shadow-sm">
    <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
      <div className="flex items-center gap-3 cursor-pointer group" onClick={onHomeClick}>
        <div className="w-11 h-11 bg-orange-400 text-white flex items-center justify-center font-bold rounded-full shadow-md transform group-hover:scale-110 transition-transform border-4 border-white">
          <Star size={20} fill="currentColor" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-xl md:text-2xl font-black tracking-tight text-gray-800 font-sans leading-tight">유보통합 <span className="text-orange-500">웹진</span></span>
          <span className="text-[10px] md:text-[11px] font-bold text-gray-400 tracking-wider uppercase">Together Edu-Care</span>
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        <button onClick={() => onViewChange('news')} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs md:text-sm font-black transition-all ${currentView === 'news' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}><Newspaper size={16}/> 뉴스</button>
        {isAdmin ? (
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border-2 border-orange-200 shadow-sm"><span className="text-[10px] font-black text-orange-500 bg-orange-50 px-2 py-1 rounded-full whitespace-nowrap">관리자</span><button onClick={onLogout} className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"><LogOut size={14} /></button></div>
        ) : (
          <button onClick={onLoginClick} className="px-4 py-2 bg-white border-2 border-orange-400 text-orange-600 rounded-full text-xs md:text-sm font-black hover:bg-orange-50 transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap"><Lock size={14} /> <span className="hidden md:inline">로그인</span><span className="md:hidden">로그인</span></button>
        )}
      </div>
    </div>
  </nav>
);

// --- [푸터 컴포넌트] SNS 공유 기능 포함 ---
const Footer = () => {
  const currentUrl = window.location.href;
  const siteTitle = "유보통합 웹진 Together Edu-Care";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      alert('🔗 링크가 복사되었습니다. 카카오톡 채팅방에 붙여넣어 공유하세요!');
    } catch (e) {
      alert('링크 복사에 실패했습니다.');
    }
  };

  const handleBandShare = () => {
    const bandUrl = `https://band.us/plugin/share?body=${encodeURIComponent(siteTitle)}&route=${encodeURIComponent(currentUrl)}`;
    window.open(bandUrl, '_blank', 'width=500,height=500');
  };

  const handleEmailShare = () => {
    const mailUrl = `mailto:?subject=${encodeURIComponent(siteTitle)}&body=${encodeURIComponent('이 유용한 웹진을 확인해보세요: ' + currentUrl)}`;
    window.location.href = mailUrl;
  };

  return (
    <footer className="bg-white border-t-4 border-orange-100 py-12 pb-24 md:pb-12 mt-auto">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start mb-2 opacity-80">
            <div className="w-8 h-8 bg-orange-400 text-white flex items-center justify-center font-bold rounded-full shadow-sm">
              <Star size={14} fill="currentColor" />
            </div>
            <span className="font-black text-gray-800 text-lg">유보통합 <span className="text-orange-500">웹진</span></span>
          </div>
          <p className="text-gray-400 text-xs font-bold leading-relaxed">
            Together Edu-Care | 유치원·어린이집 교사를 위한 아카이브<br/>
            Contact: support@educare-webzine.com
          </p>
        </div>

        <div className="flex flex-col items-center md:items-end gap-3">
          <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest bg-orange-50 px-3 py-1 rounded-full">Share with Friends</span>
          <div className="flex items-center gap-3">
            {/* 카카오톡 (링크 복사로 대체) */}
            <button onClick={handleCopyLink} className="w-10 h-10 bg-[#FEE500] rounded-full flex items-center justify-center text-[#3b1e1e] hover:scale-110 transition-transform shadow-sm" title="카카오톡/링크 복사">
              <MessageCircle size={20} fill="currentColor" className="opacity-90"/>
            </button>
            
            {/* 네이버 밴드 */}
            <button onClick={handleBandShare} className="w-10 h-10 bg-[#00C300] rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform shadow-sm" title="밴드로 공유">
              <span className="font-black text-sm">b</span>
            </button>
            
            {/* 인스타그램 (공식 계정 이동 예시) */}
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform shadow-sm" title="공식 인스타그램">
              <Instagram size={20} />
            </a>

            {/* 이메일 */}
            <button onClick={handleEmailShare} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:scale-110 transition-all shadow-sm" title="이메일 보내기">
              <Mail size={18} />
            </button>
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
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200 border-8 border-white ring-4 ring-yellow-100">
        <h2 className="text-2xl font-black mb-6 text-gray-800 text-left">{isEdit ? '✏️ 정보 수정' : (type === 'issue' ? '✨ 새 호수 발행' : '📝 새 자료 등록')}</h2>
        {isUploading ? (<div className="flex flex-col items-center justify-center py-10 space-y-4"><div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div><p className="font-bold text-gray-500">업로드 중... (파일명 변환됨)</p></div>) : (
            <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...formData, file }); }} className="space-y-5 text-left">
            {type === 'issue' ? (<><div className="flex gap-3 text-left"><div className="w-1/3"><label className="block text-xs font-bold text-gray-400 mb-1">호수</label><input required className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-orange-400 font-bold outline-none" value={formData.vol} onChange={e => setFormData({...formData, vol: e.target.value})}/></div><div className="flex-1 text-left"><label className="block text-xs font-bold text-gray-400 mb-1">제목</label><input required className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-orange-400 font-bold outline-none" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}/></div></div><div className="text-left"><label className="block text-xs font-bold text-gray-400 mb-1">설명</label><textarea className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-orange-400 font-medium h-24 outline-none resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}/></div></>) : (
                <><div className="text-left"><label className="block text-xs font-bold text-gray-400 mb-1">자료 제목</label><input required className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-orange-400" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}/></div><div className="text-left"><label className="block text-xs font-bold text-gray-400 mb-1">발행처</label><input required className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-orange-400 font-medium" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})}/></div><div className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100 text-left"><p className="text-[11px] font-black text-gray-500 mb-2">연결 방식 {isEdit && '(변경 시 입력)'}</p><div className="space-y-3"><div><label className="flex items-center gap-2 text-[10px] font-bold text-gray-400 mb-1"><LinkIcon size={12}/> 웹 링크</label><input type="url" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none text-sm" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})}/></div><div><label className="flex items-center gap-2 text-[10px] font-bold text-gray-400 mb-1"><Paperclip size={12}/> PDF 파일 업로드</label><input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} className="w-full text-[11px] text-gray-500 file:border-0 file:bg-orange-50 file:text-orange-600 file:rounded-full file:px-4 file:py-1 file:font-black"/></div></div></div></>)}
            <div className="flex gap-3 pt-2"><button type="button" onClick={onClose} className="flex-1 py-3 text-gray-500 hover:bg-gray-100 rounded-2xl font-black transition-colors">취소</button><button type="submit" className="flex-1 py-3 bg-orange-500 text-white rounded-2xl hover:bg-orange-600 font-black shadow-md shadow-orange-200">확인</button></div>
            </form>)}
      </div>
    </div>
  );
};

const LoginModal = ({ isOpen, onClose, onLogin }) => {
  if (!isOpen) return null;
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const handleSubmit = (e) => { e.preventDefault(); if (password === 'admin') { onLogin(); setPassword(''); setError(false); onClose(); } else { setError(true); } };
  return (
    <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4 backdrop-blur-sm text-center"><div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm p-8 border-4 border-white ring-4 ring-orange-100 animate-in zoom-in-95 text-center"><div className="mb-6 flex flex-col items-center"><div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4 text-orange-500"><Lock size={32} /></div><h2 className="text-2xl font-black text-gray-800">선생님 접속</h2></div><form onSubmit={(e) => { e.preventDefault(); if (password === 'admin') { onLogin(); setPassword(''); setError(false); onClose(); } else { setError(true); } }} className="space-y-4"><input type="password" className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-center tracking-widest outline-none focus:border-orange-400" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••"/>{error && <p className="text-red-500 text-xs font-bold">비밀번호가 일치하지 않습니다.</p>}<button type="submit" className="w-full py-3 bg-orange-500 text-white rounded-2xl font-black shadow-lg shadow-orange-200 active:scale-95">로그인</button><button type="button" onClick={onClose} className="w-full py-2 text-gray-400 text-sm font-bold">닫기</button></form></div></div>
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
          let googleQuery = query;
          if (startDate && endDate) googleQuery += ` after:${startDate} before:${endDate}`;
          const RSS_URL = `https://news.google.com/rss/search?q=${encodeURIComponent(googleQuery)}&hl=ko&gl=KR&ceid=KR:ko&scoring=n`;
          const PROXY_URL = `https://api.allorigins.win/raw?url=${encodeURIComponent(RSS_URL)}&t=${Date.now()}`;
          try {
              const res = await fetch(PROXY_URL);
              if(!res.ok) return [];
              const text = await res.text();
              const xml = new DOMParser().parseFromString(text, "text/xml");
              return Array.from(xml.querySelectorAll("item")).map(item => ({
                  title: item.querySelector("title")?.textContent || "",
                  link: item.querySelector("link")?.textContent || "",
                  description: (item.querySelector("description")?.textContent || "").replace(/<[^>]*>?/gm, ''),
                  author: item.querySelector("source")?.textContent || "Google News",
                  pub_date: new Date(item.querySelector("pubDate")?.textContent || Date.now()).toISOString()
              }));
          } catch(e) { return []; }
      });

      const naverPromises = searchKeywords.map(async (query) => {
          const RSS_URL = `http://newssearch.naver.com/search.naver?where=rss&query=${encodeURIComponent(query)}`;
          const PROXY_URL = `https://api.allorigins.win/raw?url=${encodeURIComponent(RSS_URL)}&t=${Date.now()}`;
          try {
              const res = await fetch(PROXY_URL);
              if(!res.ok) return [];
              const text = await res.text();
              const xml = new DOMParser().parseFromString(text, "text/xml");
              return Array.from(xml.querySelectorAll("item")).map(item => ({
                  title: item.querySelector("title")?.textContent || "",
                  link: item.querySelector("link")?.textContent || "",
                  description: (item.querySelector("description")?.textContent || "").replace(/<[^>]*>?/gm, ''),
                  author: item.querySelector("author")?.textContent || "Naver News",
                  pub_date: new Date(item.querySelector("pubDate")?.textContent || Date.now()).toISOString()
              }));
          } catch(e) { return []; }
      });

      const results = await Promise.all([...googlePromises, ...naverPromises]);
      allItems = results.flat();
      const uniqueItems = Array.from(new Map(allItems.map(item => [item.link, item])).values())
        .filter(item => item.title && item.link && item.pub_date);

      if (uniqueItems.length > 0) {
        await supabase.from('news').upsert(uniqueItems, { onConflict: 'link', ignoreDuplicates: true });
        await fetchStoredNews();
      }
      if (startDate) alert(`${uniqueItems.length}개의 기사를 수집했습니다.`);
    } catch (err) { 
      console.error("뉴스 수집 오류:", err); 
    } finally { 
      setBackfillOpen(false); setIsUpdating(false); 
    }
  };

  useEffect(() => { fetchStoredNews(); if (!limit) scrapeAndSyncNews(); }, [limit]);

  const displayNews = (Array.isArray(news) ? news : []).filter(item => 
    searchTerm === '' || 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="py-20 text-center text-orange-400 font-bold text-sm"><Loader2 className="animate-spin inline mr-2"/> 뉴스 로딩 중...</div>;

  return (
    <div className={`max-w-6xl mx-auto px-4 ${limit ? 'py-10' : 'py-12'} animate-in fade-in duration-500`}>
      <div className={`flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 ${limit ? 'border-b border-gray-100 pb-4' : 'border-b-4 border-orange-100 pb-6'}`}>
        <div className="flex items-center gap-3 text-left">
          {!limit && <div className="p-4 bg-orange-100 text-orange-600 rounded-3xl shadow-sm"><Newspaper size={32}/></div>}
          <div><h2 className={`${limit ? 'text-2xl' : 'text-4xl'} font-black text-gray-800`}>{limit && '📰'} 유보통합 뉴스룸</h2>{!limit && <p className="text-sm text-gray-500 font-bold mt-1 text-orange-500 uppercase">Live Insight Feed</p>}</div>
        </div>
        <div className="flex flex-col md:flex-row items-end md:items-center gap-2">
          {!limit && (
            <div className="relative w-full md:w-64">
              <input 
                type="text" 
                placeholder="키워드 검색..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-orange-400 font-bold"
              />
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          )}

           <button onClick={() => scrapeAndSyncNews()} disabled={isUpdating} className={`flex items-center gap-1 px-3 py-2 bg-gray-100 rounded-full text-xs font-bold text-gray-500 hover:bg-gray-200 transition-all ${isUpdating ? 'opacity-50' : ''}`}>
             {isUpdating ? <Loader2 size={14} className="animate-spin"/> : <Zap size={14} className="text-yellow-500"/>} 
             {isUpdating ? ' 수집 중...' : ' 최신 뉴스 동기화'}
          </button>
          {limit ? (<button onClick={onMoreClick} className="flex items-center gap-1 px-4 py-2 bg-white border-2 border-orange-100 rounded-full text-xs font-black text-gray-400 hover:text-orange-500 transition-all shadow-sm">전체보기 <ChevronRight size={16}/></button>) : (isAdmin && <button onClick={() => setBackfillOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-600 rounded-full text-xs font-black hover:bg-orange-200 transition-colors shadow-sm"><Filter size={14}/> 과거 수집</button>)}
        </div>
      </div>
      
      {backfillOpen && (
        <div className="mb-8 p-6 bg-white border-4 border-orange-100 rounded-[2.5rem] shadow-xl text-left animate-in slide-in-from-top-2">
          <h4 className="font-black text-gray-800 mb-4 flex items-center gap-2 text-left"><Calendar size={18}/> 날짜별 뉴스 수집 (관리자용)</h4>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <input id="start-date" type="date" className="flex-1 w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-orange-400"/>
            <input id="end-date" type="date" className="flex-1 w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-orange-400"/>
            <button onClick={() => { const s = document.getElementById('start-date').value; const e = document.getElementById('end-date').value; if(s && e) scrapeAndSyncNews(s, e); else alert('기간 선택 필요'); }} className="w-full md:w-auto px-8 py-3 bg-orange-500 text-white rounded-2xl font-black shadow-lg">수집 시작</button>
          </div>
        </div>
      )}

      <div className={`grid ${limit ? 'grid-cols-1 md:grid-cols-2 gap-5' : 'flex flex-col gap-3'}`}>
        {displayNews.map((item, index) => (
          <a key={index} href={item.link} target="_blank" rel="noopener noreferrer" className="group bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col md:flex-row items-center gap-4 relative text-left overflow-hidden">
            {!limit && <div className="hidden md:flex flex-col items-center justify-center bg-gray-50 rounded-xl w-20 h-20 shrink-0 text-gray-400 group-hover:bg-orange-50 transition-colors border border-gray-100"><span className="text-[10px] font-black uppercase">{new Date(item.pub_date).toLocaleString('en-US', { month: 'short' })}</span><span className="text-xl font-black">{new Date(item.pub_date).getDate()}</span></div>}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${item.author.includes('Google') ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>{item.author.includes('Google') ? 'G' : 'N'} | {item.author.replace('Google News', '뉴스').replace('Naver News', '네이버')}</span>
                <span className="text-[10px] font-bold text-gray-400">{new Date(item.pub_date).toLocaleDateString()}</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 group-hover:text-orange-600 transition-colors leading-tight break-keep">{item.title.replace(/<[^>]*>?/gm, '')}</h3>
              {!limit && <p className="text-sm text-gray-400 line-clamp-1 mt-1">{item.description}</p>}
            </div>
            {!limit && <ChevronRight size={20} className="hidden md:block text-gray-300 group-hover:text-orange-400 group-hover:translate-x-1 transition-all"/>}
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleShare(item.title, '뉴스 공유', item.link); }} className="absolute top-2 right-2 p-2 text-gray-300 hover:text-orange-500"><Share2 size={16}/></button>
          </a>
        ))}
        {displayNews.length === 0 && <div className="col-span-full py-20 text-gray-400 font-bold text-center">{searchTerm ? '검색 결과가 없습니다.' : '저장된 기사가 없습니다.'}</div>}
      </div>
    </div>
  );
};

// --- 메인 카드/아이템 ---
const IssueCard = ({ issue, onClick, isAdmin, onDelete, onEdit }) => (
  <div onClick={() => onClick(issue)} className="group cursor-pointer flex flex-col relative transform transition-all hover:-translate-y-2 h-full text-left">
    <div className={`aspect-[3/4] ${issue.cover_color || 'bg-orange-400'} rounded-[2.5rem] shadow-xl relative overflow-hidden p-8 flex flex-col justify-between border-8 border-white group-hover:shadow-2xl transition-all`}>
      <span className="bg-white/95 text-gray-800 text-[11px] font-black px-4 py-2 rounded-full shadow-sm w-fit">{issue.date}</span>
      <div className="relative z-10 mt-auto text-left">
        <div className="text-6xl mb-4 filter drop-shadow-md">{issue.icon || '📚'}</div>
        <h3 className="text-2xl font-black text-white leading-tight mb-3 drop-shadow-md line-clamp-2">{issue.title}</h3>
        <p className="text-white/90 text-sm font-bold line-clamp-2 leading-relaxed h-10">{issue.description}</p>
      </div>
    </div>
    {isAdmin && <div className="absolute top-4 right-4 flex gap-2 scale-0 group-hover:scale-100 transition-all z-20"><button onClick={(e) => { e.stopPropagation(); onEdit(issue); }} className="bg-white p-2 rounded-full text-blue-400 shadow-lg border border-blue-100 hover:bg-blue-50"><Edit size={18} /></button><button onClick={(e) => { e.stopPropagation(); onDelete(issue.id); }} className="bg-white p-2 rounded-full text-red-400 shadow-lg border border-red-100 hover:bg-red-50"><Trash2 size={18} /></button></div>}
  </div>
);

const ArticleItem = ({ article, onClick, isAdmin, onDelete, onEdit }) => (
  <div className="group bg-white rounded-[2rem] border-4 border-white shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full relative text-left" onClick={() => onClick(article)}>
    <div className="aspect-[4/5] bg-slate-50 relative overflow-hidden border-b border-gray-100 flex items-center justify-center">
      {article.thumbnailUrl ? (
        <img src={article.thumbnailUrl} alt="표지" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-orange-200 bg-orange-50/50 group-hover:bg-orange-100 transition-colors">
          <FileText size={64} className="mb-2"/>
          <span className="text-[10px] font-black uppercase text-orange-300">PDF Document</span>
        </div>
      )}
      {article.fileUrl && <div className="absolute top-3 left-3 bg-red-500 text-white text-[9px] font-black px-2 py-1 rounded-full shadow-sm">PDF</div>}
    </div>
    <div className="p-5 flex flex-col flex-1 bg-white text-left">
      <h4 className="text-lg font-black text-gray-800 leading-snug mb-3 line-clamp-2 group-hover:text-orange-500">{article.title}</h4>
      <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
         <span className="text-xs font-bold text-gray-500 truncate flex items-center gap-1">
           {article.author}
           {article.views > 0 && <span className="flex items-center text-gray-400 ml-2"><Eye size={10} className="mr-0.5"/> {article.views}</span>}
         </span>
         <div className="flex gap-1">
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleShare(article.title, '자료 공유', window.location.href); }} className="w-7 h-7 bg-gray-50 hover:bg-orange-50 text-gray-300 hover:text-orange-500 rounded-full flex items-center justify-center transition-colors"><Share2 size={12} /></button>
            {isAdmin && <button onClick={(e) => { e.stopPropagation(); onDelete(article.id); }} className="w-7 h-7 bg-gray-50 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-full flex items-center justify-center transition-colors"><Trash2 size={12} /></button>}
         </div>
      </div>
    </div>
  </div>
);

// --- 메인 앱 로직 ---
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

  const handleCreateIssue = async (data) => {
    if (!supabase) return;
    setIsUploading(true);
    try {
        if (editTarget) {
            await supabase.from('issues').update({ vol: data.vol, title: data.title, description: data.description }).eq('id', editTarget.id);
            setEditTarget(null);
        } else {
            const newIssue = { vol: data.vol, title: data.title, date: new Date().toLocaleDateString(), cover_color: "bg-orange-400", icon: "📚", description: data.description, created_at: Date.now(), articles: [] };
            await supabase.from('issues').insert([newIssue]);
        }
        const { data: refreshed } = await supabase.from('issues').select('*').order('created_at', { ascending: false });
        setIssues(refreshed || []); setIsUploadOpen(false);
    } catch (e) { alert('오류 발생'); } finally { setIsUploading(false); }
  };

  const handleAddArticle = async (data) => {
    if (!currentIssue || !supabase) return;
    setIsUploading(true);
    try {
        let fileUrl = editTarget?.fileUrl || '', thumbnailUrl = editTarget?.thumbnailUrl || '';
        if (data.file) {
            const fn = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.pdf`;
            const thumbBlob = await generatePDFThumbnail(data.file);
            await supabase.storage.from('files').upload(fn, data.file);
            fileUrl = supabase.storage.from('files').getPublicUrl(fn).data.publicUrl;
              
            if (thumbBlob) { 
               const thumbName = `thumb_${fn}.jpg`; 
               await supabase.storage.from('files').upload(thumbName, thumbBlob); 
               thumbnailUrl = supabase.storage.from('files').getPublicUrl(thumbName).data.publicUrl; 
            }
        }
        let updated = editTarget ? currentIssue.articles.map(a => a.id === editTarget.id ? { ...a, ...data, fileUrl, thumbnailUrl, file: undefined } : a) : [...(currentIssue.articles || []), { id: Date.now().toString(), ...data, fileUrl, thumbnailUrl, isNew: true, views: 0 }];
        await supabase.from('issues').update({ articles: updated }).eq('id', currentIssue.id);
        setCurrentIssue({ ...currentIssue, articles: updated });
        
        const { data: refreshed } = await supabase.from('issues').select('*').order('created_at', { ascending: false });
        setIssues(refreshed || []);
        
        setIsUploadOpen(false); setEditTarget(null);
    } catch (e) { alert("업로드 실패: " + e.message); } finally { setIsUploading(false); }
  };

  const handleDeleteIssue = async (issueId) => { if (!window.confirm("삭제하시겠습니까?")) return; await supabase.from('issues').delete().eq('id', issueId); const { data } = await supabase.from('issues').select('*').order('created_at', { ascending: false }); setIssues(data || []); if(currentIssue?.id === issueId) window.location.hash = ''; };
  const handleDeleteArticle = async (articleId) => { if (!window.confirm("삭제하시겠습니까?")) return; const updatedArticles = currentIssue.articles.filter(a => a.id !== articleId); await supabase.from('issues').update({ articles: updatedArticles }).eq('id', currentIssue.id); setCurrentIssue({ ...currentIssue, articles: updatedArticles }); const { data } = await supabase.from('issues').select('*').order('created_at', { ascending: false }); setIssues(data || []); };

  const handleEditIssue = (issue) => { setEditTarget(issue); setUploadType('issue'); setIsUploadOpen(true); };
  const handleEditArticle = (article) => { setEditTarget(article); setUploadType('article'); setIsUploadOpen(true); };
  const onUploadSubmit = (data) => { if (uploadType === 'issue') handleCreateIssue(data); else handleAddArticle(data); };

  const displayIssues = Array.isArray(issues) ? issues : [];

  return (
    <div className="min-h-screen bg-[#FFF9F0] font-sans text-slate-800 overflow-x-hidden text-center select-none flex flex-col">
      <Navbar isAdmin={isAdminMode} onLoginClick={() => setIsLoginOpen(true)} onLogout={() => setIsAdminMode(false)} onHomeClick={() => window.location.hash = ''} onViewChange={(v) => window.location.hash = (v === 'news' ? '#news' : '')} currentView={view} />
      <main className="flex-1 pb-10">
        {view === 'home' && (
          <div className="animate-in fade-in duration-500">
            <div className="bg-yellow-50 py-16 md:py-24 relative overflow-hidden border-b-4 border-yellow-100">
              <div className="max-w-6xl mx-auto px-4 text-center relative z-10">
                <span className="inline-block bg-orange-100 text-orange-600 font-black px-4 py-1.5 rounded-full text-xs mb-4 shadow-sm uppercase tracking-widest leading-none">Together Edu-Care</span>
                <h1 className="text-4xl md:text-6xl font-black text-gray-800 mb-6 leading-tight">유보통합<br/><span className="text-yellow-500 drop-shadow-sm">웹 매거진</span></h1>
                <p className="text-gray-500 max-w-xl mx-auto font-medium text-lg leading-relaxed text-balance">유보통합 관련 자료를 공유합니다.</p>
                {isAdminMode && <button onClick={() => { setUploadType('issue'); setEditTarget(null); setIsUploadOpen(true); }} className="mt-10 bg-orange-400 text-white px-10 py-4 rounded-full font-black shadow-xl hover:bg-orange-500 active:scale-95 transition-all flex items-center gap-2 mx-auto transform"><Plus size={24} /> 새 소식 발행하기</button>}
              </div>
            </div>
            <NewsFeed limit={4} onMoreClick={() => window.location.hash = '#news'} isAdmin={isAdminMode}/>
            <div className="max-w-6xl mx-auto px-4 py-12 md:py-20 text-left">
              <h2 className="text-3xl font-black text-gray-800 mb-12 border-b-4 border-orange-100 pb-6 leading-none"><span className="text-4xl leading-none">📚</span> 월간 발행 소식</h2>
              {displayIssues.length === 0 ? <div className="text-center py-32 bg-white rounded-[3rem] border-4 border-dashed border-gray-100 text-gray-400 font-black">아직 발행된 소식이 없습니다.</div> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">{displayIssues.map(issue => (<IssueCard key={issue.id} issue={issue} onClick={(iss) => window.location.hash = `#issue/${iss.id}`} isAdmin={isAdminMode} onDelete={handleDeleteIssue} onEdit={handleEditIssue}/>))}</div>}
            </div>
          </div>
        )}
        {view === 'news' && <NewsFeed isAdmin={isAdminMode} />}
        {view === 'issue' && currentIssue && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="max-w-5xl mx-auto px-4 pt-8 pb-12 text-left"><button onClick={() => window.location.hash = ''} className="mb-8 bg-white text-gray-500 px-6 py-3 rounded-full shadow-md font-black text-sm flex items-center gap-2 w-fit hover:text-orange-500 transition-colors"><ArrowLeft size={18} /> 홈으로</button><div className={`relative ${currentIssue.cover_color} rounded-[3rem] p-8 md:p-12 shadow-2xl border-8 border-white overflow-hidden text-left`}><div className="relative z-10 flex flex-col md:flex-row items-center gap-10 text-white"><div className="shrink-0 w-32 h-32 md:w-48 md:h-48 bg-white rounded-full flex items-center justify-center text-8xl shadow-lg -rotate-6 border-4 border-white/50">{currentIssue.icon || '📚'}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-3 mb-4"><span className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-xs font-black leading-none">{currentIssue.date}</span><span className="bg-black/20 px-4 py-2 rounded-full text-xs font-black leading-none">Vol.{currentIssue.vol}</span></div><h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight break-keep text-balance">{currentIssue.title}</h1><p className="text-white/95 text-lg leading-relaxed text-balance">{currentIssue.description}</p></div></div></div></div>
            <div className="max-w-6xl mx-auto px-6 pb-20 text-left">
               <div className="flex items-center justify-between mb-10 border-b-4 border-orange-100 pb-6"><h2 className="text-3xl font-black text-gray-800 flex items-center gap-3"><span className="text-4xl leading-none">📑</span> 자료 리스트</h2>{isAdminMode && <button onClick={() => { setUploadType('article'); setEditTarget(null); setIsUploadOpen(true); }} className="bg-orange-500 text-white px-6 py-3 rounded-full font-black shadow-lg hover:bg-orange-600 transition-all active:scale-95 flex items-center gap-2"><Plus size={20} /> 자료 추가</button>}</div>
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">{(!currentIssue.articles || currentIssue.articles.length === 0) ? <div className="col-span-full text-center py-20 bg-white rounded-[3rem] text-gray-400 font-black border-4 border-dashed border-orange-50">자료가 아직 없습니다.</div> : currentIssue.articles.map(article => (<ArticleItem key={article.id} article={article} onClick={(art) => window.location.hash = `#article/${art.id}`} isAdmin={isAdminMode} onDelete={handleDeleteArticle} onEdit={handleEditArticle}/>))}</div>
            </div>
          </div>
        )}
        {view === 'article' && currentArticle && (<CustomPDFViewer article={currentArticle} onBack={() => { window.location.hash = `#issue/${currentIssue.id}`; }} />)}
      </main>
      <Footer />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} onLogin={() => setIsAdminMode(true)}/>
      <UploadModal isOpen={isUploadOpen} onClose={() => {setIsUploadOpen(false); setEditTarget(null);}} onSubmit={onUploadSubmit} type={uploadType} isUploading={isUploading} initialData={editTarget}/>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}