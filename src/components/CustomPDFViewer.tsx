import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ZoomOut, ZoomIn, Download, List as ListIcon, Loader2, ChevronLeft, ChevronRight, BookOpen, Maximize } from 'lucide-react';
import { supabase } from '../lib/supabase';

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

const incrementViewCount = async (table: string, id: number, currentViews: number) => {
  if (!supabase) return;
  const sessionKey = `viewed_${table}_${id}`;
  if (sessionStorage.getItem(sessionKey)) return;
  try { 
    await supabase.from(table).update({ views: (currentViews || 0) + 1 }).eq('id', id); 
    sessionStorage.setItem(sessionKey, 'true');
  } catch (e) { console.error(e); }
};

const loadPdfScript = () => {
  return new Promise((resolve) => {
    if ((window as any).pdfjsLib) { resolve((window as any).pdfjsLib); return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => { 
        (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; 
        resolve((window as any).pdfjsLib); 
    };
    document.head.appendChild(script);
  });
};

export interface Article {
  id: number;
  title: string;
  fileUrl?: string;
  file_url?: string;
  views: number;
}

interface CustomPDFViewerProps {
  article: Article;
  onBack: () => void;
}

const CustomPDFViewer: React.FC<CustomPDFViewerProps> = ({ article, onBack }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<any>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [physicalPage, setPhysicalPage] = useState(1);
  const [subPage, setSubPage] = useState<'full' | 'left' | 'right'>('full');
  const [scale, setScale] = useState(1.0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pageImages, setPageImages] = useState<any>(null);
  
  const [isLandscape, setIsLandscape] = useState(typeof window !== 'undefined' ? window.innerWidth > window.innerHeight : true);
  
  const [viewMode, setViewMode] = useState<'single' | 'double'>(isLandscape ? 'double' : 'single');
  const [isManualViewMode, setIsManualViewMode] = useState(false);

  const pageCache = useRef(new Map());
  const pageInfoCache = useRef(new Map()); 
  const MAX_CACHE_SIZE = 5; // 💡 RAM 누수 방지: 최대 5페이지만 메모리에 캐싱

  const touchStartX = useRef(0);
  const pinchStartDist = useRef(0);
  const pinchStartScale = useRef(1);
  const isPinching = useRef(false);
  const isSwiping = useRef(false);
  const swipeOffsetRef = useRef(0);

  useEffect(() => {
    const handleResize = () => {
        setIsLandscape(window.innerWidth > window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isManualViewMode) {
        setViewMode(isLandscape ? 'double' : 'single');
    }
  }, [isLandscape, isManualViewMode]);

  // 💡 메모리 누수 완벽 방어 로직 (PDF 객체 및 캐시 소각)
  useEffect(() => {
    let activeDoc: any = null;

    const loadPdf = async () => {
      try {
        await loadPdfScript(); 
        if (!(window as any).pdfjsLib) return;
        (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        const doc = await (window as any).pdfjsLib.getDocument({
           url: getValidSupabaseUrl(article.fileUrl || article.file_url || ''),
           cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
           cMapPacked: true,
           disableAutoFetch: true
        }).promise;

        activeDoc = doc;
        setPdfDoc(doc);
        incrementViewCount('articles', article.id, article.views);
      } catch (err) { console.error("PDF Error:", err); alert("문서 로드 실패"); }
    };
    loadPdf();

    // 💡 Cleanup: 뷰어가 닫히거나 다른 글로 넘어갈 때 메모리 해제
    return () => {
      if (activeDoc) {
        activeDoc.destroy(); // PDF 바이너리 메모리 해제
      }
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel(); // 진행 중인 렌더링 중지
      }
      pageCache.current.clear(); // 캔버스 이미지 캐시 소각
      pageInfoCache.current.clear();
    };
  }, [article]);

  useEffect(() => {
    if (!pdfDoc || !containerRef.current) return;
    let isMounted = true;

    const renderCurrentPage = async () => {
      if (pageCache.current.has(physicalPage)) {
        const cached = pageCache.current.get(physicalPage);
        setPageImages(cached);
        return;
      }

      try {
        const page = await pdfDoc.getPage(physicalPage);
        const vp = page.getViewport({ scale: 1.0 });
        const isSpread = vp.width > vp.height * 1.2; 
        pageInfoCache.current.set(physicalPage, { isSpread });

        const outputScale = window.devicePixelRatio || 2;
        const viewport = page.getViewport({ scale: 2.0 }); 
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

        if (renderTaskRef.current) renderTaskRef.current.cancel();
        renderTaskRef.current = page.render({ canvasContext: ctx, viewport, transform });
        await renderTaskRef.current.promise;

        if (isMounted) {
           const fullDataUrl = canvas.toDataURL('image/jpeg', 0.85);
           const cacheObj: any = { full: fullDataUrl };

           if (isSpread) {
              const halfWidth = canvas.width / 2;
              const fullHeight = canvas.height;
              
              const leftCanvas = document.createElement('canvas');
              leftCanvas.width = halfWidth; leftCanvas.height = fullHeight;
              leftCanvas.getContext('2d')?.drawImage(canvas, 0, 0, halfWidth, fullHeight, 0, 0, halfWidth, fullHeight);
              
              const rightCanvas = document.createElement('canvas');
              rightCanvas.width = halfWidth; rightCanvas.height = fullHeight;
              rightCanvas.getContext('2d')?.drawImage(canvas, halfWidth, 0, halfWidth, fullHeight, 0, 0, halfWidth, fullHeight);
              
              cacheObj.left = leftCanvas.toDataURL('image/jpeg', 0.85);
              cacheObj.right = rightCanvas.toDataURL('image/jpeg', 0.85);
           }

           // 💡 캐시 폭발 방지: 최대 사이즈를 넘으면 가장 오래된 캐시 삭제 (LRU 알고리즘)
           if (pageCache.current.size >= MAX_CACHE_SIZE) {
             const oldestKey = pageCache.current.keys().next().value;
             pageCache.current.delete(oldestKey);
           }

           pageCache.current.set(physicalPage, cacheObj);
           setPageImages(cacheObj);
        }
      } catch (err: any) {
        if (err.name !== 'RenderingCancelledException') console.error(err);
      }
    };

    setPageImages(null); 
    renderCurrentPage();

    return () => { isMounted = false; };
  }, [pdfDoc, physicalPage]);

  useEffect(() => {
    if (!pageImages) return; 
    
    const info = pageInfoCache.current.get(physicalPage);
    if (info?.isSpread && viewMode === 'single') {
        if (subPage === 'full') setSubPage('left');
    } else {
        if (!info?.isSpread || viewMode === 'double') {
            setSubPage('full');
        }
    }
  }, [viewMode, physicalPage, pageImages]);

  const handleNext = () => {
     const info = pageInfoCache.current.get(physicalPage);
     if (info?.isSpread && viewMode === 'single' && subPage === 'left') {
         setSubPage('right');
     } else if (physicalPage < pdfDoc?.numPages) {
         setPhysicalPage(p => p + 1);
         setSubPage('full');
     }
  };

  const handlePrev = () => {
     const info = pageInfoCache.current.get(physicalPage);
     if (info?.isSpread && viewMode === 'single' && subPage === 'right') {
         setSubPage('left');
     } else if (physicalPage > 1) {
         setPhysicalPage(p => p - 1);
         const prevInfo = pageInfoCache.current.get(physicalPage - 1);
         if (prevInfo?.isSpread && viewMode === 'single') setSubPage('right');
         else setSubPage('full');
     }
  };

  const getTouchDistance = (touches: React.TouchList) => Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) { 
        isPinching.current = true;
        isSwiping.current = false;
        pinchStartDist.current = getTouchDistance(e.touches); 
        pinchStartScale.current = scale; 
    } else { 
        const touchX = e.touches[0].clientX;
        const edgeThreshold = 40; 
        if (touchX < edgeThreshold || touchX > window.innerWidth - edgeThreshold) {
            isPinching.current = false;
            isSwiping.current = false;
            return; 
        }
        isPinching.current = false; 
        isSwiping.current = true;
        touchStartX.current = e.touches[0].screenX; 
        if (contentWrapperRef.current) contentWrapperRef.current.style.transition = 'none';
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPinching.current && e.touches.length === 2 && contentWrapperRef.current) { 
        const dist = getTouchDistance(e.touches); 
        contentWrapperRef.current.style.transform = `scale(${dist / pinchStartDist.current})`; 
    } else if (isSwiping.current && scale === 1.0 && contentWrapperRef.current) { 
        const currentX = e.touches[0].screenX;
        const diffX = currentX - touchStartX.current;
        swipeOffsetRef.current = diffX * 0.8; 
        contentWrapperRef.current.style.transform = `translateX(${swipeOffsetRef.current}px)`;
    }
  };

  const handleTouchEnd = () => {
    if (isPinching.current) { 
        if(contentWrapperRef.current) contentWrapperRef.current.style.transform = 'none';
        isPinching.current = false;
    } else if (isSwiping.current) {
        isSwiping.current = false;
        const diff = swipeOffsetRef.current;
        swipeOffsetRef.current = 0; 
        
        if (contentWrapperRef.current) {
           contentWrapperRef.current.style.transition = 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
           contentWrapperRef.current.style.transform = 'translateX(0px)';
        }
        if (diff < -80) { handleNext(); } 
        else if (diff > 80) { handlePrev(); }
    }
  };

  const currentImageSrc = pageImages ? (subPage !== 'full' && pageImages[subPage] ? pageImages[subPage] : pageImages.full) : null;

  return (
    <div className="fixed inset-0 bg-slate-100 dark:bg-slate-950 z-[150] flex flex-col h-screen w-screen text-left animate-in slide-in-from-right outline-none">
       {/* Header */}
       <div className="h-16 bg-white dark:bg-slate-900 flex items-center justify-between px-4 shadow-sm z-50 border-b border-gray-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><ArrowLeft className="text-slate-700 dark:text-slate-300"/></button>
            <h2 className="font-black text-lg text-slate-800 dark:text-white truncate max-w-[150px] md:max-w-md">{article.title}</h2>
          </div>
          <div className="flex items-center gap-1">
             <button 
                onClick={() => {
                    setIsManualViewMode(true);
                    setViewMode(prev => prev === 'single' ? 'double' : 'single');
                }} 
                className="p-2 mr-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full flex items-center gap-1.5 text-sm font-bold border border-slate-200 dark:border-slate-700"
             >
                {viewMode === 'single' ? <><BookOpen size={16}/> 양쪽 보기</> : <><Maximize size={16}/> 한쪽 보기</>}
             </button>
             
             <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 rounded-full mr-2 px-2">
                 <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} className="p-2 text-slate-600 dark:text-slate-300"><ZoomOut size={18}/></button>
                 <span className="text-sm w-12 text-center font-bold text-slate-800 dark:text-white">{Math.round(scale * 100)}%</span>
                 <button onClick={() => setScale(s => Math.min(3.0, s + 0.2))} className="p-2 text-slate-600 dark:text-slate-300"><ZoomIn size={18}/></button>
             </div>
             <button onClick={() => window.open(getValidSupabaseUrl(article.fileUrl || article.file_url || ''), '_blank')} className="hidden sm:block p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><Download size={24}/></button>
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-2 rounded-full ${isSidebarOpen ? 'bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400' : 'text-slate-600 dark:text-slate-300'}`}><ListIcon size={24}/></button>
          </div>
       </div>

       {/* Main Area */}
       <div className="flex-1 overflow-hidden flex relative">
          <div className={`absolute md:static inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 shadow-lg border-r border-gray-100 dark:border-slate-800 z-40 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:hidden'}`}>
             <div className="p-5 font-black border-b border-slate-100 dark:border-slate-800 text-lg dark:text-white">목차 ({pdfDoc?.numPages}p)</div>
             <div className="overflow-y-auto h-full p-3 space-y-1 pb-20">
                {pdfDoc && Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1).map((num) => (
                   <button key={num} onClick={() => { setPhysicalPage(num); setSubPage('full'); if(window.innerWidth<768) setIsSidebarOpen(false); }} className={`w-full text-left p-3 rounded-xl text-base font-bold transition-colors ${physicalPage === num ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                       Page {num}
                   </button>
                ))}
             </div>
          </div>

          <div className="flex-1 overflow-hidden bg-slate-200 dark:bg-slate-950 flex justify-center items-center p-0 md:p-4 relative" ref={containerRef} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
             {isSidebarOpen && <div className="absolute inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)}/>}
             
             <div ref={contentWrapperRef} className="shadow-2xl bg-white origin-center overflow-auto flex w-full h-full items-center justify-center">
                {currentImageSrc ? (
                    <img 
                       src={currentImageSrc} 
                       style={{ 
                         transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)', 
                         height: isLandscape ? '100%' : 'auto', 
                         width: isLandscape ? 'auto' : '100%', 
                         objectFit: 'contain', 
                         transform: `scale(${scale})` 
                       }} 
                       alt={`Page ${physicalPage}`} 
                       draggable={false} 
                       className="pointer-events-none" 
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white dark:bg-slate-900">
                        <Loader2 className="animate-spin text-emerald-500" size={40} />
                    </div>
                )}
             </div>
          </div>
       </div>

       {/* Footer */}
       <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-slate-800/90 backdrop-blur px-6 py-3 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.15)] flex items-center gap-8 z-50 border border-white/50 dark:border-slate-700">
          <button onClick={handlePrev} className="text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"><ChevronLeft size={24}/></button>
          <span className="font-mono font-black text-lg text-slate-800 dark:text-white">
             {physicalPage} <span className="text-sm text-slate-400 font-medium">{subPage === 'left' ? '(좌)' : subPage === 'right' ? '(우)' : ''}</span>
             <span className="text-slate-400 dark:text-slate-500 ml-1">/ {pdfDoc?.numPages || '-'}</span>
          </span>
          <button onClick={handleNext} className="text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"><ChevronRight size={24}/></button>
       </div>
    </div>
  );
};

export default CustomPDFViewer;
