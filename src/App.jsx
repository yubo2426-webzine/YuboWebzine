import React, { useState, useEffect, useRef } from 'react';
import { 
  Book, FileText, User, ChevronRight, ArrowLeft, 
  Plus, Trash2, ChevronLeft,  
  X, Newspaper, Calendar as CalendarIcon, 
  List as ListIcon, MapPin, Navigation,
  RefreshCw, ArrowRight, ArrowUpRight, Paperclip, Loader2, Home, Search, 
  Sun, Moon, Eye, Megaphone,
  ZoomIn, ZoomOut, Download, AlertTriangle,
  Map as MapIcon, Menu, Filter, Phone, CheckCircle2, Sparkles, LayoutGrid, Globe,
  Compass, CloudSun, Wind, Sprout, Flower2, Heart, Rabbit,
  Link, Check
} from 'lucide-react';
import { Button } from 'krds-react';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

import imgKakao from './assets/kakao_icon.svg';
import imgBand from './assets/band_icon.svg';

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

const useCustomKakaoLoader = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (window.kakao && window.kakao.maps) { setLoading(false); return; }
    const scriptId = 'kakao-map-script';
    let script = document.getElementById(scriptId);

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${import.meta.env.VITE_KAKAO_MAP_API_KEY}&libraries=services,clusterer&autoload=false`;
      script.async = true;
      document.head.appendChild(script);
    }

    const handleLoad = () => window.kakao.maps.load(() => setLoading(false));
    const handleError = () => { console.error("카카오맵 API 로드 실패"); setError(true); };

    script.addEventListener('load', handleLoad);
    script.addEventListener('error', handleError);

    return () => {
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
    };
  }, []);
  return [loading, error];
};

const KRDSInput = ({ className, ...props }) => (
  <input className={`w-full h-[52px] px-5 bg-gray-50 dark:bg-slate-800 border-none rounded-2xl text-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all shadow-inner ${className}`} {...props} />
);

const KRDSBadge = ({ variant = 'neutral', children, className }) => {
  const styles = {
    primary: 'bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300 border border-sky-200/50 dark:border-sky-800',
    success: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800',
    warning: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800',
    neutral: 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-300 border border-gray-200/50 dark:border-slate-700',
  };
  return <span className={`inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-[11px] font-black tracking-wide ${styles[variant]} ${className}`}>{children}</span>;
};

// 사용자가 원하시는 형태(텍스트 링크 말풍선 + 자동 OG 썸네일 말풍선 동시 노출) 반영 완료!
const SocialShare = () => {
  const [isKakaoReady, setIsKakaoReady] = useState(false);
  const [showToast, setShowToast] = useState(false);
  
  const rawUrl = window.location.href;
  const currentUrlEncoded = encodeURIComponent(rawUrl);
  
  const shareTitle = "함께누리웹진";
  const shareDesc = "우리 동네 유보통합 자원과 자료를 확인하세요.";
  const combinedTextEncoded = encodeURIComponent(`[${shareTitle}]\n${shareDesc}\n\n🔗 ${rawUrl}`);

  const icons = { kakao: imgKakao, band: imgBand };

  useEffect(() => {
    if (window.Kakao && window.Kakao.isInitialized()) {
      setIsKakaoReady(true);
      return;
    }
    
    const scriptId = 'kakao-share-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.6.0/kakao.min.js'; 
      script.async = true;
      script.onload = () => {
        if (window.Kakao && !window.Kakao.isInitialized()) {
          const appKey = import.meta.env.VITE_KAKAO_JS_KEY || 'ee00ac93b075fc1e56de1a0dc90ccaf3';
          window.Kakao.init(appKey);
          setIsKakaoReady(true);
        }
      };
      document.head.appendChild(script);
    } else if (window.Kakao) {
       setIsKakaoReady(true);
    }
  }, []);

  const shareKakao = () => {
    if (!isKakaoReady || !window.Kakao) {
      alert("⚠️ 카카오톡 공유 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    // ✅ 동료님이 원하시는 '두 개의 말풍선' 효과를 내기 위해 text 타입에 rawUrl을 직접 꽂아넣습니다.
    window.Kakao.Share.sendDefault({
      objectType: 'text',
      text: `[${shareTitle}]\n${shareDesc}\n\n🔗 ${rawUrl}`,
      link: { mobileWebUrl: rawUrl, webUrl: rawUrl },
      buttons: [{ title: '웹진 바로가기', link: { mobileWebUrl: rawUrl, webUrl: rawUrl } }],
    });
  };

  const shareBand = () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      if (/Android/i.test(navigator.userAgent)) {
        window.location.href = `intent:bandapp://create/post?text=${combinedTextEncoded}#Intent;package=com.nhn.android.band;end`;
      } else {
        window.location.href = `bandapp://create/post?text=${combinedTextEncoded}`;
      }
    } else {
       window.open(`https://band.us/plugin/share?body=${combinedTextEncoded}&route=${currentUrlEncoded}`, '_blank');
    }
  };
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(rawUrl);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    } catch (err) {
      console.error('URL 복사 실패:', err);
      alert('링크 복사를 지원하지 않는 브라우저입니다.');
    }
  };
  
  const btnClass = "w-14 h-14 rounded-full overflow-hidden shadow-sm hover:shadow-md border border-gray-100 dark:border-slate-700 hover:-translate-y-1 transition-all cursor-pointer bg-white dark:bg-slate-800 flex items-center justify-center p-1 group relative z-10 shrink-0";

  return (
    <div className="flex flex-col items-center relative">
       <div className="flex justify-center gap-4 py-4 relative z-10">
         <button onClick={shareKakao} className={btnClass} title="카카오톡 앱 공유">
           <img src={icons.kakao} alt="Kakao" className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform" />
         </button>
         <button onClick={shareBand} className={btnClass} title="네이버 밴드 공유">
           <img src={icons.band} alt="Band" className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform" />
         </button>
         <button onClick={handleCopyLink} className={`${btnClass} bg-slate-50 dark:bg-slate-700`} title="링크 복사하기">
           <Link className="w-6 h-6 text-slate-600 dark:text-slate-300 group-hover:scale-110 transition-transform" />
         </button>
       </div>

       <div className={`absolute -top-10 bg-slate-800 dark:bg-emerald-600 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 transition-all duration-300 z-20 ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
         <Check size={16} className="text-emerald-400 dark:text-white" />
         링크가 복사되었습니다
       </div>
    </div>
  );
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

const parseNewsData = (rawTitle) => {
  if (!rawTitle) return { title: '제목 없음', publisher: '뉴스' };
  
  const parts = rawTitle.split(' - ');
  if (parts.length > 1) {
    const publisher = parts.pop().trim();
    let title = parts.join(' - ').trim();
    
    title = title.replace(/\s*>\s*뉴스$/, '').replace(/\s*\|$/, '').trim();
    
    return { title, publisher };
  }
  return { title: rawTitle, publisher: '뉴스' };
};

const incrementViewCount = async (table, id, currentViews) => {
  if (!supabase) return;
  const sessionKey = `viewed_${table}_${id}`;
  if (sessionStorage.getItem(sessionKey)) return; 

  try { 
    await supabase.from(table).update({ views: (currentViews || 0) + 1 }).eq('id', id); 
    sessionStorage.setItem(sessionKey, 'true');
  } catch (e) { console.error(e); }
};

const useHistoryState = (initialState) => {
  const [state, setState] = useState(initialState);
  useEffect(() => {
    window.history.replaceState({ view: initialState }, '');
    const handlePopState = (event) => { if (event.state && event.state.view) setState(event.state.view); };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const setHistoryState = (newState) => {
    if (newState !== state) { window.history.pushState({ view: newState }, '', `?view=${newState}`);
    setState(newState); }
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
  return new Promise((resolve) => {
    if (window.pdfjsLib) { resolve(window.pdfjsLib); return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; resolve(window.pdfjsLib); };
    document.head.appendChild(script);
  });
};

const Footer = ({ onSecretAdminUnlock }) => {
  const [clicks, setClicks] = useState(0);

  const handleSecretClick = () => {
    setClicks(prev => prev + 1);
    if (clicks + 1 >= 5) {
      const passcode = prompt("관리자 암호를 입력하세요.");
      const adminCode = import.meta.env.VITE_ADMIN_PASSCODE || 'admin1234';
      if (passcode === adminCode) {
        onSecretAdminUnlock();
        alert("관리자 권한이 활성화되었습니다.");
      } else if (passcode !== null) {
        alert("암호가 일치하지 않습니다.");
      }
      setClicks(0);
    }
  };

  return (
    <footer className="w-full bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 py-12 mt-auto z-10 relative transition-colors">
      <div className="max-w-7xl mx-auto px-4 text-center">
         <div className="mb-6">
           <p className="text-sm font-black text-gray-500 dark:text-slate-400 mb-2">콘텐츠 공유하기</p>
           <SocialShare />
         </div>
         <p onClick={handleSecretClick} className="text-sm text-gray-400 dark:text-slate-500 font-medium cursor-default select-none">
           © 2026 함께누리웹진. All rights reserved.<br/>Contact: help@korea-kids-platform.kr
         </p>
      </div>
    </footer>
  );
};

const UniversalUploadModal = ({ isOpen, onClose, onSubmit, type, isUploading }) => {
  if (!isOpen) return null;
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '', event_date: '', description: '', vol: '' });
  const getLabelClass = "block text-sm font-black text-slate-700 dark:text-slate-300 mb-2 ml-1";

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in zoom-in-95">
       <div className="bg-white dark:bg-slate-800 rounded-[2rem] w-full max-w-lg shadow-[0_20px_60px_rgba(0,0,0,0.2)] max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-slate-700 flex flex-col">
          <div className="px-8 py-6 border-b border-gray-50 dark:border-slate-700 bg-white dark:bg-slate-900 flex justify-between items-center sticky top-0 z-10">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
               {type === 'notice' && <><Megaphone className="text-amber-500" size={28}/> 소식 작성</>}
               {type === 'issue' && <><Book className="text-teal-500" size={28}/> 자료실 발행</>}
               {type === 'article' && <><FileText className="text-sky-500" size={28}/> 자료 등록</>}
            </h2>
            <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"><X className="text-slate-500 dark:text-slate-400"/></button>
          </div>
        
          <div className="p-8">
            {isUploading ? 
            <div className="text-center py-12"><Loader2 className="animate-spin mx-auto text-emerald-500 mb-4" size={48}/> <p className="text-lg font-bold text-slate-600 dark:text-slate-300">서버에 안전하게 저장 중입니다...</p></div> : (
               <form onSubmit={(e) => { e.preventDefault(); onSubmit({...formData, file, type}); }} className="space-y-6">
                  {type === 'issue' && <div><label className={getLabelClass}>호수 (Vol)</label><KRDSInput placeholder="예: 24" value={formData.vol} onChange={e => setFormData({...formData, vol: e.target.value})}/></div>}
                  <div><label className={getLabelClass}>제목</label><KRDSInput placeholder="제목을 입력하세요" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required/></div>
                  
                  {type === 'notice' && (
                     <>
                        <div><label className={getLabelClass}>상세 내용</label><textarea className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-900 border-none rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-amber-400 h-36 resize-none shadow-inner text-slate-800 dark:text-slate-100" placeholder="내용 입력" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} required/></div>
                        <div><label className={getLabelClass}>행사 일정 (선택)</label><KRDSInput type="date" value={formData.event_date} onChange={e => setFormData({...formData, event_date: e.target.value})}/></div>
                     </>
                  )}
              
                  {type === 'issue' && <div><label className={getLabelClass}>설명</label><textarea className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-900 border-none rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-teal-400 h-28 resize-none shadow-inner text-slate-800 dark:text-slate-100" placeholder="설명 입력" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}/></div>}
                  {type === 'article' && (
                     <div>
                        <label className={getLabelClass}>PDF 파일 첨부</label>
                        <label className="mt-1 flex justify-center px-6 pt-8 pb-8 bg-gray-50 dark:bg-slate-900 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-[2rem] hover:bg-sky-50 dark:hover:bg-slate-800 relative cursor-pointer group transition-colors">
                           <div className="space-y-3 text-center">
                              <Paperclip className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-500 group-hover:text-sky-500 transition-colors"/>
                              <div className="flex text-base justify-center">
                                 <span className="relative text-sky-600 dark:text-sky-400 font-black hover:text-sky-700">파일 찾아보기</span>
                                 <input type="file" className="sr-only" onChange={e => setFile(e.target.files[0])} required/>
                              </div>
                              <p className="text-sm font-medium text-slate-400">{file ? file.name : 'PDF 문서 (50MB 이하 권장)'}</p>
                           </div>
                        </label>
                     </div>
                  )}
      
                  <div className="flex gap-4 pt-4 mt-8">
                    <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl text-lg font-black hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">취소</button>
                    <button type="submit" className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl text-lg font-black hover:bg-emerald-600 shadow-md transition-colors">등록 완료</button>
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
        let autoScale = (window.innerWidth >= 768) 
        ? Math.min((containerWidth / unscaledViewport.width), (containerHeight / unscaledViewport.height)) * 0.95 : (containerWidth / unscaledViewport.width) * 0.98;
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
    if (e.touches.length === 2) { isPinching.current = true; pinchStartDist.current = getTouchDistance(e.touches); pinchStartScale.current = scale; } 
    else { isPinching.current = false; touchStartX.current = e.changedTouches[0].screenX; }
  };

  const handleTouchMove = (e) => {
    if (isPinching.current && e.touches.length === 2 && contentWrapperRef.current) { e.preventDefault(); const dist = getTouchDistance(e.touches); contentWrapperRef.current.style.transform = `scale(${dist / pinchStartDist.current})`; }
  };

  const handleTouchEnd = (e) => {
    if (isPinching.current) { if(contentWrapperRef.current) contentWrapperRef.current.style.transform = 'none'; isPinching.current = false; } 
    else {
        touchEndX.current = e.changedTouches[0].screenX;
        const diff = touchStartX.current - touchEndX.current;
        if (Math.abs(diff) > 50) { if (diff > 0) setPageNumber(p => Math.min(pdfDoc?.numPages || 1, p + 1)); else setPageNumber(p => Math.max(1, p - 1)); }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-100 dark:bg-slate-950 z-[150] flex flex-col h-screen w-screen text-left animate-in slide-in-from-right outline-none">
       <div className="h-16 bg-white dark:bg-slate-900 flex items-center justify-between px-4 shadow-sm z-50 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-2"><button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><ArrowLeft className="text-slate-700 dark:text-slate-300"/></button><h2 className="font-black text-lg text-slate-800 dark:text-white truncate max-w-[150px] md:max-w-md">{article.title}</h2></div>
          <div className="flex items-center gap-1">
             <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 rounded-full mr-2 px-2"><button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} className="p-2 text-slate-600 dark:text-slate-300"><ZoomOut size={18}/></button><span className="text-sm w-12 text-center font-bold text-slate-800 dark:text-white">{Math.round(scale * 100)}%</span><button onClick={() => setScale(s => Math.min(3.0, s + 0.2))} className="p-2 text-slate-600 dark:text-slate-300"><ZoomIn size={18}/></button></div>
             <button onClick={() => window.open(article.fileUrl || article.file_url, '_blank')} className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><Download size={24}/></button>
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-2 rounded-full ${isSidebarOpen ? 'bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400' : 'text-slate-600 dark:text-slate-300'}`}><ListIcon size={24}/></button>
          </div>
       </div>
       <div className="flex-1 overflow-hidden flex relative">
          <div className={`absolute md:static inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 shadow-lg border-r border-gray-100 dark:border-slate-800 z-40 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:hidden'}`}>
             <div className="p-5 font-black border-b border-slate-100 dark:border-slate-800 text-lg dark:text-white">목차 ({pdfDoc?.numPages}p)</div>
             <div className="overflow-y-auto h-full p-3 space-y-1 pb-20">
                {pdfDoc && Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1).map((num) => (
                   <button key={num} onClick={() => { setPageNumber(num); if(window.innerWidth<768) setIsSidebarOpen(false); }} className={`w-full text-left p-3 rounded-xl text-base font-bold transition-colors ${pageNum === num ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>Page {num}</button>
                ))}
             </div>
          </div>
          <div className="flex-1 overflow-auto bg-slate-200 dark:bg-slate-950 flex justify-center items-center p-4 relative" ref={containerRef} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
             {isSidebarOpen && <div className="absolute inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)}/>}
             <div className="absolute left-0 top-0 bottom-0 w-[15%] z-20 md:hidden cursor-pointer" onClick={(e) => {e.stopPropagation(); setPageNumber(p => Math.max(1, p-1));}} />
             <div className="absolute right-0 top-0 bottom-0 w-[15%] z-20 md:hidden cursor-pointer" onClick={(e) => {e.stopPropagation(); setPageNumber(p => Math.min(pdfDoc?.numPages||1, p+1));}} />
             <div ref={contentWrapperRef} className="shadow-2xl transition-transform duration-75 origin-center"><canvas ref={canvasRef} className="bg-white block rounded-md mx-auto"/></div>
          </div>
       </div>
       <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-slate-800/90 backdrop-blur px-6 py-3 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.15)] flex items-center gap-8 z-50 border border-white/50 dark:border-slate-700">
          <button onClick={() => setPageNumber(p => Math.max(1, p-1))} className="text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"><ChevronLeft size={24}/></button>
          <span className="font-mono font-black text-lg text-slate-800 dark:text-white">{pageNum} <span className="text-slate-400 dark:text-slate-500">/ {pdfDoc?.numPages || '-'}</span></span>
          <button onClick={() => setPageNumber(p => Math.min(pdfDoc?.numPages || 1, p+1))} className="text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"><ChevronRight size={24}/></button>
       </div>
    </div>
  );
};

const NewsFeed = ({ limit, isAdmin }) => {
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
    <div className={`w-full ${limit ? '' : 'max-w-7xl mx-auto px-4 py-12 md:py-16'}`}>
      {!limit && (
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
           <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3"><span className="p-2 bg-rose-100 dark:bg-rose-900/40 rounded-2xl"><Newspaper size={32} className="text-rose-500 dark:text-rose-400"/></span> 뉴스</h2>
           </div>
           <button onClick={fetchNews} disabled={loading} className="text-sm font-bold text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 flex items-center gap-2 bg-white dark:bg-slate-800 border dark:border-slate-700 px-4 py-2 rounded-full shadow-sm transition-colors disabled:opacity-50">
             <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> 새로고침
           </button>
        </div>
      )}
      <div className="flex flex-col gap-4">
         {news.map((item, idx) => {
            const { title: cleanTitle, publisher } = parseNewsData(item.title);
            
            return (
              <div key={idx} onClick={() => handleNewsClick(item)} className="group cursor-pointer flex flex-col md:flex-row gap-4 p-6 bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-100 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-500/50 transition-all relative">
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
                    
                     {isAdmin && <button onClick={(e) => {e.stopPropagation(); handleDelete(item.id)}} className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 p-2 bg-white dark:bg-slate-900 rounded-full shadow-sm"><Trash2 size={16}/></button>}
                 </div>
              </div>
            );
         })}
      </div>
    </div>
  );
};

const NoticeBoard = ({ userRole, onWriteClick, initialMode }) => {
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
      setSelectedNotice(updated);
  };

  const filteredNotices = notices.filter(n => {
      if(filter === 'all') return true;
      if(filter === 'notice') return n.category !== 'event';
      if(filter === 'event') return n.category === 'event';
      return true;
  });

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
      
      <div className="grid gap-4">
         {filteredNotices.map(n => (
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
         {filteredNotices.length === 0 && <div className="py-16 text-center text-slate-400 font-bold bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700">등록된 소식이 없습니다.</div>}
      </div>

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

const IssueCard = ({ issue, onClick, isAdmin, onDelete, onAddArticle }) => (
  <div onClick={() => onClick(issue)} className="group cursor-pointer flex flex-col bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[2.5rem] overflow-hidden hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)] hover:-translate-y-2 transition-all h-full relative shadow-sm">
    <div className={`aspect-[4/3] w-full relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/30 dark:to-emerald-900/30 border-b border-gray-100 dark:border-slate-700 relative`}>
       <div className="absolute top-4 right-4 text-emerald-100 dark:text-emerald-900/50 opacity-60 z-0"><Rabbit size={32} strokeWidth={1.5}/></div>
       <div className="absolute bottom-4 left-4 text-sky-100 dark:text-sky-900/50 opacity-60 z-0"><Sprout size={32}/></div>
       <div className="absolute inset-0 flex items-center justify-center opacity-10 dark:opacity-5"><Book size={150} className="text-teal-200 dark:text-teal-400" strokeWidth={0.5}/></div>
       
       <div className="p-8 text-center w-full h-full flex flex-col justify-center items-center group-hover:scale-105 transition-transform duration-500 z-10 relative">
          <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-sm text-teal-600 dark:text-teal-400 text-sm font-black px-5 py-2 rounded-full mb-6 shadow-sm border border-white dark:border-slate-700">Vol.{issue.vol}</div>
          <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100 leading-tight line-clamp-2 tracking-tight">{issue.title}</h3>
       </div>
    </div>
  
    <div className="p-10 flex-1 flex flex-col relative z-10">
      <div className="flex justify-between items-center mb-6">
        <span className="text-sm font-bold text-slate-400 dark:text-slate-500">{issue.date}</span>
        {isAdmin && (
           <div className="flex gap-2">
              <button onClick={(e) => { e.stopPropagation(); onAddArticle(issue); }} className="text-sky-500 hover:text-sky-600 bg-sky-50 dark:bg-sky-900/30 p-2 rounded-full transition-colors" title="이 호수에 자료 추가"><Plus size={16}/></button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(issue.id); }} className="text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 bg-slate-50 dark:bg-slate-900 p-2 rounded-full transition-colors" title="호수 삭제"><Trash2 size={16}/></button>
           </div>
        )}
      </div>
      <p className="text-base font-medium text-slate-500 dark:text-slate-400 line-clamp-2 mt-auto leading-relaxed max-w-[90%]">{issue.description || "내용 없음"}</p>
      
      <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs font-bold text-slate-400 dark:text-slate-500">
         <span className="flex items-center gap-1.5"><Eye size={18}/> {issue.views || 0}</span>
         <span className="flex items-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg"><Paperclip size={18} className="text-slate-300 dark:text-slate-600"/> {(issue.articles || []).length}개</span>
      </div>
    </div>
  </div>
);

const Navbar = ({ onHomeClick, onViewChange, currentView, onMenuClick, toggleTheme, isDarkMode, role }) => (
  <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 shadow-sm h-20 flex items-center relative transition-colors">
    <div className="absolute top-2 left-10 text-emerald-200 dark:text-emerald-900/50 opacity-60"><Flower2 size={24}/></div>
    <div className="absolute bottom-2 right-10 text-sky-200 dark:text-sky-900/50 opacity-60"><Sprout size={24}/></div>

    <div className="container mx-auto px-4 w-full flex items-center justify-between relative z-10">
      <div className="flex items-center gap-3 cursor-pointer group" onClick={onHomeClick}>
         <div className="w-11 h-11 bg-gradient-to-br from-emerald-400 to-teal-400 dark:from-emerald-500 dark:to-teal-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md group-hover:rotate-12 transition-transform"><Sparkles size={24}/></div>
         <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">함께누리웹진</h1>
         {role === 'admin' && <span className="hidden sm:inline-block bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-black px-3 py-1 rounded-full">관리자 모드</span>}
      </div>
      <nav className="hidden md:flex items-center gap-2 bg-slate-50/80 dark:bg-slate-800/80 px-2.5 py-2.5 rounded-full border border-slate-100 dark:border-slate-700">
        {['home', 'issue_list', 'notice', 'news', 'resource_map'].map(key => (
          <button key={key} onClick={() => onViewChange(key)} className={`px-5 py-2.5 rounded-full text-sm font-black transition-all ${currentView === key ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-100 dark:border-slate-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>
            {key === 'home' ? '홈' : key === 'issue_list' ? '자료실' : key === 'notice' ? '소식' : key === 'news' ? '뉴스' : '체험자원 지도'}
          </button>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <button onClick={toggleTheme} className="p-3 text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-full border border-slate-100 dark:border-slate-700 shadow-sm transition-all">
          {isDarkMode ? <Sun size={20} className="text-amber-400"/> : <Moon size={20}/>}
        </button>
        <button onClick={onMenuClick} className="p-3 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-full border border-slate-100 dark:border-slate-700 shadow-sm transition-all">
          <Menu size={20} />
        </button>
      </div>
    </div>
  </header>
);

const MainApp = () => {
  const [role, setRole] = useState(() => typeof window !== 'undefined' ? sessionStorage.getItem('userRole') || 'guest' : 'guest'); 
  const [view, setView] = useHistoryState('home');
  const [issues, setIssues] = useState([]);
  const [currentIssue, setCurrentIssue] = useState(null);
  const [currentArticle, setCurrentArticle] = useState(null);
  
  const [recentNotices, setRecentNotices] = useState([]);
  const [recentNews, setRecentNews] = useState([]);
  const [activeHomeTab, setActiveHomeTab] = useState('notice'); // 'notice' | 'news'

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadType, setUploadType] = useState('notice');
  const [isUploading, setIsUploading] = useState(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  
  const [resources, setResources] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('전체');
  const [selectedType, setSelectedType] = useState('전체');
  const [selectedResource, setSelectedResource] = useState(null);
  
  const [recentTags, setRecentTags] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('recentTags');
      if (saved) return JSON.parse(saved);
    }
    return ['전주시', '익산시', '군산시', '정읍시', '남원시'];
  });
  
  const [mapLoading, mapError] = useCustomKakaoLoader();
  const mapContainerRefStandalone = useRef(null);

  const jeonbukRegions = ['전주시', '익산시', '군산시', '정읍시', '남원시', '김제시', '완주군', '진안군', '무주군', '장수군', '임실군', '순창군', '고창군', '부안군'];

  const [isDarkMode, setIsDarkMode] = useState(() => {
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
      const resIssues = await supabase.from('issues').select('*').order('id', { ascending: false });
      if (resIssues.data) setIssues(resIssues.data);
      
      const resResources = await supabase.from('resources').select('*');
      if (resResources.data) setResources(resResources.data);
      
      const resNotices = await supabase.from('notices').select('*').order('created_at', { ascending: false }).limit(4);
      if(resNotices.data) setRecentNotices(resNotices.data);

      const resNews = await supabase.from('news').select('*').order('pub_date', { ascending: false }).limit(4);
      if(resNews.data) setRecentNews(resNews.data);
    };
    fetchData();
  }, []);

  const filteredResources = resources.filter(res => {
    const matchRegion = selectedRegion === '전체' || res.region === selectedRegion;
    const matchType = selectedType === '전체' || res.category === selectedType;
    const matchKeyword = res.name.includes(searchKeyword) || res.address.includes(searchKeyword);
    return matchRegion && matchType && matchKeyword;
  });

  const renderMap = (ref) => {
    if (!mapLoading && !mapError && ref.current && window.kakao && window.kakao.maps) {
        ref.current.innerHTML = '';
        let centerPos = new window.kakao.maps.LatLng(35.8242238, 127.1479532);
        let level = 10;
        if (selectedResource) { centerPos = new window.kakao.maps.LatLng(selectedResource.lat, selectedResource.lng); level = 4; }
        const map = new window.kakao.maps.Map(ref.current, { center: centerPos, level: level });
        const bounds = new window.kakao.maps.LatLngBounds();
        let hasMarkers = false;

        const imageSrc = "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png"; 
        const imageSize = new window.kakao.maps.Size(24, 35);
        const markerImage = new window.kakao.maps.MarkerImage(imageSrc, imageSize); 

        filteredResources.forEach(res => {
          const position = new window.kakao.maps.LatLng(res.lat, res.lng);
          const marker = new window.kakao.maps.Marker({ position: position, image: markerImage });
          marker.setMap(map);
          bounds.extend(position);
          hasMarkers = true;
          window.kakao.maps.event.addListener(marker, 'click', () => setSelectedResource(res));
        });

        setTimeout(() => {
          if (map) { map.relayout(); if (!selectedResource && hasMarkers) map.setBounds(bounds); else if (selectedResource) map.setCenter(centerPos); }
        }, 150);
    }
  };

  useEffect(() => {
    if (view === 'resource_map') renderMap(mapContainerRefStandalone);
  }, [view, mapLoading, mapError, filteredResources, selectedResource]);

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

  const openArticleUploadForIssue = (issue) => {
     setCurrentIssue(issue);
     setUploadType('article');
     setIsUploadOpen(true);
  };

  const handleUpload = async (data) => {
    if (data.type === 'article' && data.file) {
      const maxSize = 50 * 1024 * 1024;
      if (data.file.size > maxSize) {
        alert("⚠️ 파일 크기가 너무 큽니다. 50MB 이하로 업로드해주세요.");
        return; 
      }
    }

    setIsUploading(true);
    try {
       if (data.type === 'notice') await supabase.from('notices').insert([{ title: data.title, content: data.content, event_date: data.event_date || null, category: data.event_date ? 'event' : 'notice' }]);
       else if (data.type === 'issue') await supabase.from('issues').insert([{ vol: data.vol, title: data.title, description: data.description, date: new Date().toLocaleDateString(), cover_color: 'bg-teal-100', icon: '📘' }]);
       else if (data.type === 'article' && currentIssue) { let fileUrl = ''; if (data.file) { const fn = `${Date.now()}.pdf`;
       await supabase.storage.from('files').upload(fn, data.file); fileUrl = supabase.storage.from('files').getPublicUrl(fn).data.publicUrl; } const updated = [...(currentIssue.articles || []), { id: Date.now(), title: data.title, fileUrl, views: 0 }];
       await supabase.from('issues').update({ articles: updated }).eq('id', currentIssue.id); setCurrentIssue({...currentIssue, articles: updated}); }
       alert("등록 완료되었습니다!"); setIsUploadOpen(false);
       if (data.type !== 'article') window.location.reload();
    } catch (e) { alert("오류: " + e.message); } finally { setIsUploading(false); }
  };

  const handleDeleteIssue = async (id) => { if(confirm('삭제하시겠습니까?')) { await supabase.from('issues').delete().eq('id', id); window.location.reload(); }};
  
  const handleIssueClick = (issue) => { 
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

  if (!supabase) return <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900"><AlertTriangle className="text-red-500 mb-4" size={40}/>DB 연결 오류</div>;

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
                 
                 <div className="absolute top-10 right-10 xl:right-20 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white dark:border-slate-700 rounded-[2rem] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.06)] hidden lg:flex flex-col gap-4 z-20">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-bold text-sm">
                       <MapPin size={18} className="text-emerald-500 dark:text-emerald-400"/> 전북특별자치도 전주시
                    </div>
                    <div className="flex items-center justify-between gap-6">
                       <div className="flex items-center gap-3">
                          <CloudSun size={48} className="text-amber-500" strokeWidth={1.5} />
                          <span className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">18<span className="text-2xl">°C</span></span>
                       </div>
                    </div>
                    <div className="flex gap-2 text-xs font-black mt-1">
                       <div className="bg-white/80 dark:bg-slate-800/80 px-4 py-2 rounded-xl shadow-sm flex items-center gap-2 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700">미세 <span className="text-blue-500 dark:text-blue-400">좋음</span></div>
                       <div className="bg-white/80 dark:bg-slate-800/80 px-4 py-2 rounded-xl shadow-sm flex items-center gap-2 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700">초미세 <span className="text-emerald-500 dark:text-emerald-400">보통</span></div>
                    </div>
                 </div>

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
                           {['형태 1', '형태 2', '형태 3', '형태 4', '형태 5', '형태 6', '형태 7'].map(t => <option key={t} value={t}>{t}</option>)}
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
                   
                   <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-10 px-12 shadow-[0_20px_60px_rgba(0,0,0,0.04)] border border-slate-100 dark:border-slate-700 relative overflow-hidden flex flex-col min-h-[480px]">
                      <div className="absolute -top-4 -left-4 text-indigo-100 dark:text-indigo-900/30 opacity-60 z-0"><Rabbit size={80} strokeWidth={1}/></div>

                      <div className="flex justify-between items-center mb-10 border-b border-slate-800 dark:border-slate-600 pb-6 relative z-10">
                         <div className="flex gap-2 p-1.5 bg-slate-50 dark:bg-slate-900 rounded-full border border-slate-100 dark:border-slate-700 shadow-inner">
                            <button onClick={() => setActiveHomeTab('notice')} className={`px-5 md:px-7 py-2.5 rounded-full text-base md:text-lg font-black transition-all ${activeHomeTab === 'notice' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'}`}>최근 소식</button>
                            <button onClick={() => setActiveHomeTab('news')} className={`px-5 md:px-7 py-2.5 rounded-full text-base md:text-lg font-black transition-all ${activeHomeTab === 'news' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'}`}>최근 뉴스</button>
                         </div>
                         <button onClick={() => setView(activeHomeTab === 'notice' ? 'notice' : 'news')} className="text-sm md:text-base font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 group">더보기 <ChevronRight size={18} className="text-indigo-400 group-hover:translate-x-1.5 transition-transform"/></button>
                      </div>

                      <div className="flex flex-col relative z-10 pl-2">
                        {activeHomeTab === 'notice' && recentNotices.map(n => (
                           <div key={n.id} onClick={() => {setView('notice');}} className="py-5 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer flex items-center justify-between group px-2">
                              <div className="flex items-center gap-5 w-full">
                                 <span className={`text-[13px] font-black px-4 py-1.5 rounded-full border shrink-0 ${n.category === 'event' ? 'bg-amber-100 text-amber-600 border-amber-200/50 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800' : 'bg-gray-100 text-gray-500 border-gray-200/50 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'}`}>{n.category === 'event' ? '행사' : '공지'}</span>
                                 <span className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-1 text-lg flex-1 tracking-tight">{n.title}</span>
                                 <span className="text-sm font-bold text-slate-400 dark:text-slate-500 hidden md:block shrink-0">{new Date(n.created_at).toLocaleDateString()}</span>
                              </div>
                           </div>
                        ))}
                        {activeHomeTab === 'news' && recentNews.map(n => {
                           const { title: cleanTitle } = parseNewsData(n.title);
                           return (
                             <div key={n.id} onClick={() => { if (n.link) window.open(n.link, '_blank'); }} className="py-5 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer flex items-center justify-between group px-2">
                                <div className="flex items-center gap-5 w-full">
                                   <span className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-1 text-lg flex-1 tracking-tight pl-2">{cleanTitle}</span>
                                   <span className="text-sm font-bold text-slate-400 dark:text-slate-500 hidden md:block shrink-0">{new Date(n.pub_date).toLocaleDateString()}</span>
                                </div>
                             </div>
                           );
                        })}
                      </div>
                   </div>

                   <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-10 px-12 shadow-[0_20px_60px_rgba(0,0,0,0.04)] border border-slate-100 dark:border-slate-700 relative overflow-hidden">
                      <div className="absolute top-10 right-10 text-sky-100 dark:text-sky-900/30 opacity-60 z-0"><Flower2 size={64}/></div>
                      <div className="absolute bottom-10 left-10 text-emerald-100 dark:text-emerald-900/30 opacity-60 z-0 animate-pulse"><Sprout size={64}/></div>

                      <div className="flex justify-between items-center mb-10 border-b border-slate-800 dark:border-slate-600 pb-6 relative z-10">
                         <h3 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white flex items-center gap-4 tracking-tight">최신 자료실 <Flower2 size={36} className="text-sky-500 dark:text-sky-400" strokeWidth={2}/></h3>
                         <button onClick={() => setView('issue_list')} className="text-base font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 flex items-center gap-2 group">더보기 <ChevronRight size={20} className="text-teal-400 group-hover:translate-x-1.5 transition-transform"/></button>
                      </div>
                      <div className="grid grid-cols-2 gap-8 pt-2 relative z-10 pl-2">
                        {issues.slice(0, 2).map(issue => (
                           <IssueCard key={issue.id} issue={issue} onClick={handleIssueClick} isAdmin={role === 'admin'} onDelete={handleDeleteIssue} onAddArticle={openArticleUploadForIssue}/>
                        ))}
                      </div>
                   </div>

                 </div>
               </section>
            </div>
          )}

          {view === 'resource_map' && (
             <div className="flex flex-col-reverse md:flex-row w-full h-[calc(100vh-80px)] relative bg-white dark:bg-slate-900 animate-in fade-in">
                <div className="w-full md:w-[480px] bg-white dark:bg-slate-800 flex flex-col border-r border-slate-100 dark:border-slate-700 z-10 shrink-0 h-[55%] md:h-full relative shadow-[0_-10px_20px_rgba(0,0,0,0.05)] md:shadow-xl relative">
                   <div className="absolute top-4 right-10 text-emerald-100 dark:text-emerald-900/30 opacity-60"><Rabbit size={32} strokeWidth={1.5}/></div>

                   <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 sticky top-0 z-20 relative">
                      <div className="flex items-center gap-3 mb-6 relative z-10">
                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800 rounded-2xl flex items-center justify-center shadow-inner"><MapPin size={24}/></div>
                        <div><h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">체험자원 지도</h2></div>
                      </div>

                      <div className="relative mb-4 z-10 flex gap-2">
                         <select value={selectedRegion} onChange={(e) => { setSelectedRegion(e.target.value); setSelectedResource(null); }} className="flex-1 h-12 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400 appearance-none">
                           <option value="전체">= 지역 전체 =</option>
                           {jeonbukRegions.map(reg => <option key={reg} value={reg}>{reg}</option>)}
                         </select>
                         <select value={selectedType} onChange={(e) => { setSelectedType(e.target.value); setSelectedResource(null); }} className="flex-1 h-12 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400 appearance-none">
                           <option value="전체">= 형태 전체 =</option>
                           {['형태 1', '형태 2', '형태 3', '형태 4', '형태 5', '형태 6', '형태 7'].map(t => <option key={t} value={t}>{t}</option>)}
                         </select>
                      </div>

                      <div className="relative mb-2 z-10">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20}/>
                        <input type="text" placeholder="체험처명 또는 주소 검색" value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} className="w-full h-14 pl-12 pr-4 bg-slate-50 dark:bg-slate-900 border-none rounded-[1.5rem] text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-400 transition-all font-black text-base shadow-inner" />
                      </div>
                   </div>
                   <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center border-b border-slate-100 dark:border-slate-700">
                      <div className="font-black text-slate-700 dark:text-slate-300 px-4">총 <span className="text-emerald-600 dark:text-emerald-400 text-xl">{filteredResources.length}</span>건</div>
                   </div>
                   <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4 md:gap-5 custom-scrollbar pb-24 bg-slate-50/20 dark:bg-slate-900/20">
                     {filteredResources.map(res => (
                       <div key={res.id} onClick={() => setSelectedResource(res)} className={`p-6 rounded-[1.5rem] cursor-pointer transition-all border bg-white dark:bg-slate-800 group ${selectedResource?.id === res.id ? 'border-emerald-500 dark:border-emerald-500 ring-4 ring-emerald-50 dark:ring-emerald-900/30 shadow-[0_15px_30px_rgba(16,185,129,0.15)]' : 'border-slate-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-500/50 hover:shadow-sm'}`}>
                         <div className="flex flex-wrap gap-1.5 mb-4">
                            <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-100/50 dark:border-emerald-800 px-2.5 py-1 rounded-full">#{res.category}</span>
                            <span className="text-[11px] font-black text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/40 border border-sky-100/50 dark:border-sky-800 px-2.5 py-1 rounded-full">#누리과정</span>
                         </div>
                         <h4 className="font-black text-xl md:text-2xl text-slate-800 dark:text-white mb-5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors tracking-tight leading-snug">{res.name}</h4>
                         <ul className="flex flex-col gap-3">
                            <li className="flex items-start gap-3 text-sm font-bold text-slate-500 dark:text-slate-400">
                               <div className="p-1.5 bg-slate-50 dark:bg-slate-900 rounded-lg shrink-0 mt-0.5"><MapPin size={16} className="text-slate-400 dark:text-slate-500"/></div>
                               <span className="leading-snug pt-1">{res.address}</span>
                            </li>
                            <li className="flex items-center gap-3 text-sm font-bold text-slate-500 dark:text-slate-400">
                               <div className="p-1.5 bg-slate-50 dark:bg-slate-900 rounded-lg shrink-0"><Phone size={16} className="text-slate-400 dark:text-slate-500"/></div>
                               <span className="pt-0.5">{res.phone || '연락처 정보 없음'}</span>
                            </li>
                         </ul>
                       </div>
                     ))}
                   </div>
                </div>

                <div className="w-full md:flex-1 relative h-[45%] md:h-full bg-slate-100 dark:bg-slate-950 relative">
                   <div className="absolute bottom-10 right-10 text-sky-100 dark:text-sky-900/30 opacity-60 animate-float"><Compass size={150} strokeWidth={1}/></div>

                   {mapLoading ? <div className="w-full h-full flex items-center justify-center bg-white dark:bg-slate-900"><Loader2 className="animate-spin text-emerald-500" size={40} /></div> 
                   : <div ref={mapContainerRefStandalone} className="w-full h-full" />}
                   
                   <div className={`fixed md:absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_-20px_50px_rgba(0,0,0,0.5)] z-50 transform transition-transform duration-500 ${selectedResource ? 'translate-y-0' : 'translate-y-[110%]'}`}>
                      {selectedResource && (
                        <div className="p-8 md:p-10 pb-12 relative border-t border-slate-100 dark:border-slate-700">
                           <button className="absolute top-6 right-6 p-3 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors" onClick={() => setSelectedResource(null)}><X size={24}/></button>
                           <div className="flex gap-2 mb-5"><KRDSBadge variant="success">{selectedResource.category}</KRDSBadge><KRDSBadge variant="primary">누리과정 연계</KRDSBadge></div>
                           <h3 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white mb-4 tracking-tight leading-tight pr-12">{selectedResource.name}</h3>
                           <p className="text-slate-500 dark:text-slate-400 font-bold text-base md:text-lg flex items-center gap-2 mb-8"><MapPin size={20} className="text-emerald-500 dark:text-emerald-400"/> {selectedResource.address}</p>
                           <div className="grid grid-cols-2 gap-4">
                              <button className="bg-emerald-500 dark:bg-emerald-600 text-white py-4 md:py-5 rounded-2xl font-black text-lg md:text-xl shadow-md flex justify-center items-center gap-3 hover:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors"><CheckCircle2 size={24}/> 프로그램 보기</button>
                              <button className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 py-4 md:py-5 rounded-2xl font-black text-lg md:text-xl flex justify-center items-center gap-3 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"><Phone size={24}/> 전화 연결</button>
                           </div>
                        </div>
                      )}
                   </div>
                </div>
             </div>
          )}

          {view === 'news' && <NewsFeed isAdmin={role === 'admin'} />}
          {view === 'notice' && <NoticeBoard userRole={role} onWriteClick={(t) => { setUploadType(t); setIsUploadOpen(true);}}/>}
          
          {view === 'issue_list' && (
            <div className="pt-16 max-w-7xl mx-auto px-4 animate-in fade-in mb-28">
              <div className="flex items-center justify-between mb-12 pb-8 border-b border-slate-800 dark:border-slate-700 relative overflow-hidden px-10">
                <div className="absolute top-4 left-4 text-teal-100 dark:text-teal-900/30 opacity-60 z-0"><Book size={48} className="text-teal-200 dark:text-teal-800"/></div>
                <h2 className="text-3xl md:text-4xl font-black flex items-center gap-4 text-slate-800 dark:text-white tracking-tight relative z-10">자료실 <Book className="text-teal-500 dark:text-teal-400" size={36}/></h2>
                {role === 'admin' && <button onClick={() => { setUploadType('issue'); setIsUploadOpen(true); }} className="bg-teal-500 dark:bg-teal-600 text-white px-7 py-3.5 rounded-2xl font-black shadow-md flex items-center gap-2 hover:bg-teal-600 dark:hover:bg-teal-500 transition-colors relative z-10"><Plus size={20}/> 호수 발행</button>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {issues.map(issue => <IssueCard key={issue.id} issue={issue} onClick={handleIssueClick} isAdmin={role === 'admin'} onDelete={handleDeleteIssue} onAddArticle={openArticleUploadForIssue}/>)}
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
