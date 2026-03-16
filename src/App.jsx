import React, { useState, useEffect, useRef } from 'react';
import { 
  Book, FileText, User, ChevronRight, ArrowLeft, 
  Plus, Trash2, ChevronLeft,  
  X, Newspaper, Calendar as CalendarIcon, 
  List as ListIcon, MapPin, Navigation,
  RefreshCw, ArrowRight, ArrowUpRight, Paperclip, Loader2, Home, Search, 
  Sun, Moon, Eye, Megaphone,
  ZoomIn, ZoomOut, Download, AlertTriangle,
  Map as MapIcon, Menu, Filter, Phone, CheckCircle2, Sparkles, LayoutGrid
} from 'lucide-react';
import { Button } from 'krds-react';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

import imgKakao from './assets/kakao_icon.svg';
import imgBand from './assets/band_icon.svg';
import imgFacebook from './assets/facebook_icon.png';
import imgX from './assets/x_icon.svg';

// ------------------------------------------------------------------
// ✅ [React 19 호환] 자체 구현한 useKakaoLoader (지도 최적화)
// ------------------------------------------------------------------
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

// ------------------------------------------------------------------
// 🏛️ [Soft UI System] 아이꿈터 스타일 컴포넌트
// ------------------------------------------------------------------
const KRDSInput = ({ className, ...props }) => (
  <input className={`w-full h-[52px] px-5 bg-gray-50 dark:bg-slate-800 border-none rounded-2xl text-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all shadow-inner ${className}`} {...props} />
);

const KRDSBadge = ({ variant = 'neutral', children, className }) => {
  const styles = {
    primary: 'bg-sky-100 text-sky-600 dark:bg-sky-900/50 dark:text-sky-300',
    success: 'bg-teal-100 text-teal-600 dark:bg-teal-900/50 dark:text-teal-300',
    warning: 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300',
    neutral: 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300',
  };
  return <span className={`inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-xs font-black tracking-wide ${styles[variant]} ${className}`}>{children}</span>;
};

const SocialShare = () => {
  const currentUrlEncoded = encodeURIComponent(window.location.href);
  const titleEncoded = encodeURIComponent("아이들의 미래를 잇는 지식 플랫폼");
  const rawUrl = window.location.href;
  const icons = { kakao: imgKakao, band: imgBand, facebook: imgFacebook, x: imgX };

  const shareKakao = () => {
    if (!window.Kakao) { alert("⚠️ 카카오 연결 중입니다."); return; }
    if (!window.Kakao.isInitialized()) window.Kakao.init('ee00ac93b075fc1e56de1a0dc90ccaf3');
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: { title: '아이들의 미래를 잇는 지식 플랫폼', description: '우리 동네 유보통합 자원과 자료를 확인하세요.', imageUrl: 'https://cdn-icons-png.flaticon.com/512/3408/3408599.png', link: { mobileWebUrl: rawUrl, webUrl: rawUrl } },
      buttons: [{ title: '웹진 바로가기', link: { mobileWebUrl: rawUrl, webUrl: rawUrl } }],
    });
  };
  const shareBand = () => window.open(`https://band.us/plugin/share?body=${titleEncoded}%0A${currentUrlEncoded}&route=${currentUrlEncoded}`, '_blank');
  const shareX = () => window.open(`https://twitter.com/intent/tweet?text=${titleEncoded}&url=${currentUrlEncoded}`, '_blank');
  const shareFacebook = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${currentUrlEncoded}`, '_blank');
  
  const btnClass = "w-14 h-14 rounded-full overflow-hidden shadow-sm hover:shadow-md border border-gray-100 dark:border-gray-700 hover:-translate-y-1 transition-all cursor-pointer bg-white flex items-center justify-center p-1";
  return (
    <div className="flex justify-center gap-4 py-4">
       <button onClick={shareKakao} className={btnClass} title="카카오톡"><img src={icons.kakao} alt="Kakao" className="w-full h-full object-cover rounded-full" /></button>
       <button onClick={shareBand} className={btnClass} title="밴드"><img src={icons.band} alt="Band" className="w-full h-full object-cover rounded-full" /></button>
       <button onClick={shareFacebook} className={btnClass} title="페이스북"><img src={icons.facebook} alt="Facebook" className="w-full h-full object-cover rounded-full" /></button>
       <button onClick={shareX} className={`${btnClass} bg-black p-3`} title="X"><img src={icons.x} alt="X" className="w-full h-full object-contain filter invert" /></button>
    </div>
  );
};

// ------------------------------------------------------------------
// 🛠️ Supabase 및 공통 Hooks
// ------------------------------------------------------------------
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

const incrementViewCount = async (table, id, currentViews) => {
  if (!supabase) return;
  try { await supabase.from(table).update({ views: (currentViews || 0) + 1 }).eq('id', id); } catch (e) { console.error(e); }
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
    if (newState !== state) { window.history.pushState({ view: newState }, '', `?view=${newState}`); setState(newState); }
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

// ------------------------------------------------------------------
// 🕵️ [보안] 히든 관리자 모드가 탑재된 Footer
// ------------------------------------------------------------------
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
    <footer className="w-full bg-slate-50 dark:bg-slate-900 border-t border-gray-100 dark:border-gray-800 py-12 mt-auto z-10 relative">
      <div className="max-w-7xl mx-auto px-4 text-center">
         <div className="mb-6">
           <p className="text-sm font-black text-gray-500 dark:text-gray-400 mb-2">콘텐츠 공유하기</p>
           <SocialShare />
         </div>
         <p onClick={handleSecretClick} className="text-sm text-gray-400 dark:text-gray-500 font-medium cursor-default select-none">
           © 2026 아이들의 미래를 잇는 지식 플랫폼. All rights reserved.<br/>Contact: help@korea-kids-platform.kr
         </p>
      </div>
    </footer>
  );
};

// ------------------------------------------------------------------
// 📝 업로드 모달 (완전 복원)
// ------------------------------------------------------------------
const UniversalUploadModal = ({ isOpen, onClose, onSubmit, type, isUploading }) => {
  if (!isOpen) return null;
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '', event_date: '', description: '', vol: '' });
  const getLabelClass = "block text-sm font-black text-slate-700 dark:text-gray-300 mb-2 ml-1";
  
  return (
    <div className="fixed inset-0 bg-slate-900/40 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in zoom-in-95">
       <div className="bg-white dark:bg-slate-800 rounded-[2rem] w-full max-w-lg shadow-[0_20px_60px_rgba(0,0,0,0.1)] max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-gray-700 flex flex-col">
          <div className="px-8 py-6 border-b border-gray-50 dark:border-gray-700 bg-white dark:bg-slate-900 flex justify-between items-center sticky top-0 z-10">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
               {type === 'notice' && <><Megaphone className="text-sky-500" size={28}/> 기관 소식 작성</>}
               {type === 'issue' && <><Book className="text-teal-500" size={28}/> 월간호 발행</>}
               {type === 'article' && <><FileText className="text-amber-500" size={28}/> 자료 등록</>}
            </h2>
            <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 transition-colors"><X className="text-slate-500"/></button>
          </div>
          <div className="p-8">
            {isUploading ? 
            <div className="text-center py-12"><Loader2 className="animate-spin mx-auto text-sky-500 mb-4" size={48}/> <p className="text-lg font-bold text-slate-600">서버에 안전하게 저장 중입니다...</p></div> : (
               <form onSubmit={(e) => { e.preventDefault(); onSubmit({...formData, file, type}); }} className="space-y-6">
                  {type === 'issue' && <div><label className={getLabelClass}>호수 (Vol)</label><KRDSInput placeholder="예: 24" value={formData.vol} onChange={e => setFormData({...formData, vol: e.target.value})}/></div>}
                  <div><label className={getLabelClass}>제목</label><KRDSInput placeholder="제목을 입력하세요" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required/></div>
                  
                  {type === 'notice' && (
                     <>
                        <div><label className={getLabelClass}>상세 내용</label><textarea className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border-none rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-sky-400 h-36 resize-none shadow-inner" placeholder="내용 입력" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} required/></div>
                        <div><label className={getLabelClass}>행사 일정 (선택)</label><KRDSInput type="date" value={formData.event_date} onChange={e => setFormData({...formData, event_date: e.target.value})}/></div>
                     </>
                  )}
                  {type === 'issue' && <div><label className={getLabelClass}>설명</label><textarea className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border-none rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-teal-400 h-28 resize-none shadow-inner" placeholder="설명 입력" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}/></div>}
                  {type === 'article' && (
                     <div>
                        <label className={getLabelClass}>PDF 파일 첨부</label>
                        <div className="mt-1 flex justify-center px-6 pt-8 pb-8 bg-gray-50 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-[2rem] hover:bg-sky-50 dark:hover:bg-slate-700 relative cursor-pointer group transition-colors">
                           <div className="space-y-3 text-center">
                              <Paperclip className="mx-auto h-12 w-12 text-slate-300 group-hover:text-sky-500 transition-colors"/>
                              <div className="flex text-base justify-center">
                                 <label className="relative cursor-pointer text-sky-600 font-black hover:text-sky-700"><span>파일 찾아보기</span><input type="file" className="sr-only" onChange={e => setFile(e.target.files[0])} required/></label>
                              </div>
                              <p className="text-sm font-medium text-slate-400">{file ? file.name : 'PDF 문서를 선택해주세요'}</p>
                           </div>
                        </div>
                     </div>
                  )}
                  <div className="flex gap-4 pt-4 mt-8">
                    <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-lg font-black hover:bg-slate-200 transition-colors">취소</button>
                    <button type="submit" className="flex-1 py-4 bg-sky-500 text-white rounded-2xl text-lg font-black hover:bg-sky-600 shadow-md transition-colors">등록 완료</button>
                  </div>
               </form>
            )}
         </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// 📄 PDF 뷰어 (완전 복원)
// ------------------------------------------------------------------
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
        let autoScale = (window.innerWidth >= 768) ? Math.min((containerWidth / unscaledViewport.width), (containerHeight / unscaledViewport.height)) * 0.95 : (containerWidth / unscaledViewport.width) * 0.98;
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
    <div className="fixed inset-0 bg-slate-100 dark:bg-slate-900 z-[150] flex flex-col h-screen w-screen text-left animate-in slide-in-from-right outline-none">
       <div className="h-16 bg-white dark:bg-slate-800 flex items-center justify-between px-4 shadow-sm z-50">
          <div className="flex items-center gap-2"><button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full"><ArrowLeft className="text-slate-700"/></button><h2 className="font-black text-lg text-slate-800 truncate max-w-[150px] md:max-w-md">{article.title}</h2></div>
          <div className="flex items-center gap-1">
             <div className="hidden md:flex items-center bg-slate-100 rounded-full mr-2 px-2"><button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} className="p-2"><ZoomOut size={18}/></button><span className="text-sm w-12 text-center font-bold">{Math.round(scale * 100)}%</span><button onClick={() => setScale(s => Math.min(3.0, s + 0.2))} className="p-2"><ZoomIn size={18}/></button></div>
             <button onClick={() => window.open(article.fileUrl || article.file_url, '_blank')} className="p-2 text-slate-600"><Download size={24}/></button>
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-2 rounded-full ${isSidebarOpen ? 'bg-sky-100 text-sky-600' : 'text-slate-600'}`}><ListIcon size={24}/></button>
          </div>
       </div>
       <div className="flex-1 overflow-hidden flex relative">
          <div className={`absolute md:static inset-y-0 left-0 w-64 bg-white dark:bg-slate-800 shadow-lg z-40 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:hidden'}`}>
             <div className="p-5 font-black border-b border-slate-100 text-lg">목차 ({pdfDoc?.numPages}p)</div>
             <div className="overflow-y-auto h-full p-3 space-y-1 pb-20">
                {pdfDoc && Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1).map((num) => (
                   <button key={num} onClick={() => { setPageNumber(num); if(window.innerWidth<768) setIsSidebarOpen(false); }} className={`w-full text-left p-3 rounded-xl text-base font-bold ${pageNum === num ? 'bg-sky-50 text-sky-600' : 'text-slate-600 hover:bg-slate-50'}`}>Page {num}</button>
                ))}
             </div>
          </div>
          <div className="flex-1 overflow-auto bg-slate-200 dark:bg-slate-900 flex justify-center items-center p-4 relative" ref={containerRef} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
             {isSidebarOpen && <div className="absolute inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)}/>}
             <div className="absolute left-0 top-0 bottom-0 w-[15%] z-20 md:hidden cursor-pointer" onClick={(e) => {e.stopPropagation(); setPageNumber(p => Math.max(1, p-1));}} />
             <div className="absolute right-0 top-0 bottom-0 w-[15%] z-20 md:hidden cursor-pointer" onClick={(e) => {e.stopPropagation(); setPageNumber(p => Math.min(pdfDoc?.numPages||1, p+1));}} />
             <div ref={contentWrapperRef} className="shadow-2xl transition-transform duration-75 origin-center"><canvas ref={canvasRef} className="bg-white block rounded-md mx-auto"/></div>
          </div>
       </div>
       <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-6 py-3 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.15)] flex items-center gap-8 z-50">
          <button onClick={() => setPageNumber(p => Math.max(1, p-1))} className="text-slate-600 hover:text-sky-600"><ChevronLeft size={24}/></button>
          <span className="font-mono font-black text-lg text-slate-800">{pageNum} <span className="text-slate-400">/ {pdfDoc?.numPages || '-'}</span></span>
          <button onClick={() => setPageNumber(p => Math.min(pdfDoc?.numPages || 1, p+1))} className="text-slate-600 hover:text-sky-600"><ChevronRight size={24}/></button>
       </div>
    </div>
  );
};

// ------------------------------------------------------------------
// 📑 컨텐츠 컴포넌트들 (소프트 UI 적용하여 완전 복원)
// ------------------------------------------------------------------
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
    <div className={`w-full ${limit ? '' : 'max-w-7xl mx-auto px-4 py-12 md:py-16'}`}>
      {!limit && (
        <div className="flex justify-between items-center mb-8 pb-4">
           <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3"><span className="p-2 bg-rose-100 rounded-2xl"><Newspaper size={32} className="text-rose-500"/></span> 교육 뉴스룸</h2>
           </div>
           {onBack && <button onClick={onBack} className="text-sm font-bold text-slate-500 hover:text-rose-500 flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm"><Home size={18}/> 홈으로</button>}
        </div>
      )}
      <div className="flex flex-col gap-4">
         {news.map((item, idx) => (
            <div key={idx} onClick={() => handleNewsClick(item)} className="group cursor-pointer flex flex-col md:flex-row gap-4 p-6 bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-100 dark:border-slate-700 hover:border-rose-200 transition-all relative">
               <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                     <KRDSBadge variant={item.author?.includes('Google') ? 'neutral' : 'primary'}>{item.author || '뉴스'}</KRDSBadge>
                     <span className="text-sm text-slate-400 font-bold">{new Date(item.pub_date).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-black text-xl text-slate-800 dark:text-white group-hover:text-rose-500 transition-colors line-clamp-2 leading-snug">{item.title}</h3>
                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 font-bold"><span className="flex items-center gap-1"><Eye size={14}/> 조회 {item.views || 0}</span></div>
               </div>
               <div className="flex items-center justify-end gap-2">
                   {!limit && <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-rose-50 group-hover:text-rose-500 transition-colors"><ArrowUpRight size={20} className="text-slate-300 group-hover:text-rose-500"/></div>}
                   {isAdmin && <button onClick={(e) => {e.stopPropagation(); handleDelete(item.id)}} className="text-slate-300 hover:text-red-500 p-2 bg-white rounded-full shadow-sm"><Trash2 size={16}/></button>}
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
           <h2 className="text-3xl font-black flex items-center gap-3 text-slate-800"><span className="p-2 bg-sky-100 rounded-2xl"><Megaphone className="text-sky-500" size={32}/></span> 기관 소식</h2>
           <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <div className="bg-white shadow-sm p-1.5 rounded-2xl flex border border-slate-100">
                  {['all', 'notice', 'event'].map(f => (
                      <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 text-sm font-black rounded-xl transition-all ${filter === f ? 'bg-sky-50 text-sky-600' : 'text-slate-400 hover:text-slate-600'}`}>{f === 'all' ? '전체' : f === 'notice' ? '공지' : '행사'}</button>
                  ))}
              </div>
              {userRole === 'admin' && <button onClick={() => onWriteClick('notice')} className="bg-sky-500 text-white px-5 py-2 rounded-2xl text-sm font-black shadow-md hover:bg-sky-600 flex gap-2 items-center"><Plus size={18}/> 새 소식 작성</button>}
           </div>
        </div>
      )}
      
      <div className="grid gap-4">
         {filteredNotices.map(n => (
            <div key={n.id} onClick={() => handleNoticeClick(n)} className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-700 hover:border-sky-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all relative group cursor-pointer flex flex-col md:flex-row gap-4 md:items-center justify-between">
               <div className="flex-1">
                 <div className="flex items-center gap-3 mb-3">
                    <KRDSBadge variant={n.category === 'event' ? 'primary' : 'neutral'}>{n.category === 'event' ? '행사안내' : '일반공지'}</KRDSBadge>
                    <span className="text-sm font-bold text-slate-400">{new Date(n.created_at).toLocaleDateString()}</span>
                 </div>
                 <h3 className="text-xl font-black mb-2 line-clamp-1 text-slate-800 group-hover:text-sky-600 transition-colors">{n.title}</h3>
                 <p className="text-base font-medium text-slate-500 dark:text-gray-400 line-clamp-1">{n.content}</p>
                 {n.event_date && <div className="mt-4 inline-flex items-center gap-2 text-sm font-black text-sky-600 bg-sky-50 px-4 py-2 rounded-xl"><CalendarIcon size={18}/> 행사일: {n.event_date}</div>}
               </div>
               <div className="hidden md:flex w-12 h-12 rounded-full bg-slate-50 items-center justify-center group-hover:bg-sky-50 group-hover:text-sky-500 transition-colors shrink-0">
                  <ArrowRight size={20} className="text-slate-300 group-hover:text-sky-500"/>
               </div>
            </div>
         ))}
         {filteredNotices.length === 0 && <div className="py-16 text-center text-slate-400 font-bold bg-white rounded-[2rem] border border-slate-100">등록된 소식이 없습니다.</div>}
      </div>

      {selectedNotice && (
        <div className="fixed inset-0 bg-slate-900/40 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedNotice(null)}>
           <div className="bg-white dark:bg-slate-800 rounded-[2rem] w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.1)] flex flex-col relative" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-8 py-6 border-b border-slate-100 dark:border-gray-700 flex justify-between items-start z-10">
                 <div>
                    <div className="flex items-center gap-3 mb-3">
                       <KRDSBadge variant={selectedNotice.category === 'event' ? 'primary' : 'neutral'}>{selectedNotice.category === 'event' ? '행사' : '공지'}</KRDSBadge>
                       <span className="text-sm font-bold text-slate-400">{new Date(selectedNotice.created_at).toLocaleDateString()}</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-snug">{selectedNotice.title}</h2>
                 </div>
                 <button onClick={() => setSelectedNotice(null)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"><X size={20} className="text-slate-600"/></button>
              </div>
              <div className="p-8">
                 {selectedNotice.event_date && (
                    <div className="mb-8 p-5 bg-sky-50 dark:bg-blue-900/20 rounded-2xl flex items-center gap-4">
                       <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm"><CalendarIcon className="text-sky-500" size={24}/></div>
                       <div><div className="text-sm font-black text-sky-600 mb-1">예정된 행사일</div><div className="text-lg font-black text-slate-800">{selectedNotice.event_date}</div></div>
                    </div>
                 )}
                 <p className="text-lg leading-relaxed whitespace-pre-wrap text-slate-700 font-medium">{selectedNotice.content}</p>
              </div>
              <div className="px-8 py-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 flex justify-between items-center text-sm">
                 <div className="flex items-center gap-4 font-bold text-slate-400">
                     <span className="flex items-center gap-1.5"><User size={16}/> 관리자</span>
                     <span className="flex items-center gap-1.5"><Eye size={16}/> 조회수 {selectedNotice.views || 0}</span>
                 </div>
                 {userRole === 'admin' && (
                    <button onClick={() => handleDelete(selectedNotice.id)} className="text-rose-500 hover:text-rose-600 font-black flex items-center gap-1 bg-white px-4 py-2 rounded-xl shadow-sm"><Trash2 size={16}/> 삭제</button>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const IssueCard = ({ issue, onClick, isAdmin, onDelete }) => (
  <div onClick={() => onClick(issue)} className="group cursor-pointer flex flex-col bg-white dark:bg-slate-800 border border-slate-100 dark:border-gray-700 rounded-[2rem] overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-teal-200 transition-all h-full">
    <div className={`aspect-[4/3] w-full relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-slate-700 dark:to-slate-800`}>
       <div className="p-6 text-center w-full h-full flex flex-col justify-center items-center group-hover:scale-105 transition-transform duration-500">
          <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm text-teal-600 dark:text-teal-300 text-sm font-black px-4 py-1.5 rounded-full mb-4 shadow-sm">Vol.{issue.vol}</div>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-tight line-clamp-2">{issue.title}</h3>
       </div>
    </div>
    <div className="p-6 md:p-8 flex-1 flex flex-col">
      <div className="flex justify-between items-center mb-4"><span className="text-sm font-bold text-slate-400">{issue.date}</span>{isAdmin && <button onClick={(e) => { e.stopPropagation(); onDelete(issue.id); }} className="text-slate-300 hover:text-rose-500 bg-slate-50 p-2 rounded-full"><Trash2 size={16}/></button>}</div>
      <p className="text-base font-medium text-slate-500 dark:text-gray-400 line-clamp-2 mt-auto leading-relaxed">{issue.description || "내용 없음"}</p>
    </div>
  </div>
);

// ------------------------------------------------------------------
// 🧭 네비게이션바 (Soft UI)
// ------------------------------------------------------------------
const Navbar = ({ onHomeClick, onViewChange, currentView, isDarkMode, toggleTheme, onMenuClick, role }) => (
  <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-gray-800 shadow-sm h-20 flex items-center">
    <div className="container mx-auto px-4 w-full flex items-center justify-between">
      <div className="flex items-center gap-3 cursor-pointer group" onClick={onHomeClick}>
         <div className="w-11 h-11 bg-gradient-to-br from-sky-400 to-teal-400 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md group-hover:rotate-12 transition-transform"><Sparkles size={24}/></div>
         <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight group-hover:text-sky-500 transition-colors">지식 플랫폼</h1>
         {role === 'admin' && <span className="hidden sm:inline-block bg-rose-100 text-rose-600 text-xs font-black px-3 py-1 rounded-full">관리자 모드</span>}
      </div>
      <nav className="hidden md:flex items-center gap-2 bg-slate-50/80 dark:bg-slate-800/80 px-2 py-2 rounded-full border border-slate-100 dark:border-gray-700">
        {['home', 'resource_map', 'issue_list', 'notice', 'news'].map(key => (
          <button key={key} onClick={() => onViewChange(key)} className={`px-5 py-2.5 rounded-full text-sm font-black transition-all ${currentView === key ? 'bg-white dark:bg-slate-700 text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:text-gray-400'}`}>
            {key === 'home' ? '홈' : key === 'resource_map' ? '체험지도' : key === 'issue_list' ? '자료실' : key === 'notice' ? '기관소식' : '뉴스룸'}
          </button>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <button onClick={toggleTheme} className="p-3 text-slate-400 bg-white hover:bg-slate-50 rounded-full border border-slate-100 shadow-sm transition-all">
          {isDarkMode ? <Sun size={20} className="text-amber-400"/> : <Moon size={20}/>}
        </button>
        <button onClick={onMenuClick} className="p-3 text-slate-700 bg-white hover:bg-slate-50 rounded-full border border-slate-100 shadow-sm transition-all">
          <Menu size={20} />
        </button>
      </div>
    </div>
  </header>
);

// ------------------------------------------------------------------
// 🚀 메인 애플리케이션
// ------------------------------------------------------------------
const MainApp = () => {
  const [role, setRole] = useState('guest'); 
  const [view, setView] = useHistoryState('home'); 
  const [issues, setIssues] = useState([]);
  const [currentIssue, setCurrentIssue] = useState(null);
  const [currentArticle, setCurrentArticle] = useState(null);
  const [recentNotices, setRecentNotices] = useState([]);
  
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadType, setUploadType] = useState('notice');
  const [isUploading, setIsUploading] = useState(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false); 

  // ✅ [자원 지도 상태 관리]
  const [resources, setResources] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('전체');
  const [selectedResource, setSelectedResource] = useState(null);
  
  const [mapLoading, mapError] = useCustomKakaoLoader();
  const mapContainerRef = useRef(null);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      return savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); } 
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  // 초기 데이터 불러오기 
  useEffect(() => {
    const fetchData = async () => {
      if(!supabase) return;
      const resIssues = await supabase.from('issues').select('*').order('created_at', { ascending: false });
      if (resIssues.data) setIssues(resIssues.data);
      
      const resResources = await supabase.from('resources').select('*');
      if (resResources.data) setResources(resResources.data);
      
      const resNotices = await supabase.from('notices').select('*').order('created_at', { ascending: false }).limit(2);
      if(resNotices.data) setRecentNotices(resNotices.data);
    };
    fetchData();
  }, []);

  const filteredResources = resources.filter(res => {
    const matchRegion = selectedRegion === '전체' || res.region === selectedRegion;
    const matchKeyword = res.name.includes(searchKeyword) || res.address.includes(searchKeyword);
    return matchRegion && matchKeyword;
  });

  // ✅ 지도 렌더링 
  useEffect(() => {
    if (view === 'resource_map' && !mapLoading && !mapError && mapContainerRef.current) {
      if (window.kakao && window.kakao.maps) {
        mapContainerRef.current.innerHTML = ''; 
        let centerPos = new window.kakao.maps.LatLng(35.8242238, 127.1479532); // 기본 전북도청
        let level = 10;
        if (selectedResource) { centerPos = new window.kakao.maps.LatLng(selectedResource.lat, selectedResource.lng); level = 4; }
        const map = new window.kakao.maps.Map(mapContainerRef.current, { center: centerPos, level: level });
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
    }
  }, [view, mapLoading, mapError, filteredResources, selectedResource]);

  const handleUpload = async (data) => {
    setIsUploading(true);
    try {
       if (data.type === 'notice') await supabase.from('notices').insert([{ title: data.title, content: data.content, event_date: data.event_date || null, category: data.event_date ? 'event' : 'notice' }]);
       else if (data.type === 'issue') await supabase.from('issues').insert([{ vol: data.vol, title: data.title, description: data.description, date: new Date().toLocaleDateString(), cover_color: 'bg-teal-100', icon: '📘' }]);
       else if (data.type === 'article' && currentIssue) { let fileUrl = ''; if (data.file) { const fn = `${Date.now()}.pdf`; await supabase.storage.from('files').upload(fn, data.file); fileUrl = supabase.storage.from('files').getPublicUrl(fn).data.publicUrl; } const updated = [...(currentIssue.articles || []), { id: Date.now(), title: data.title, fileUrl, views: 0 }]; await supabase.from('issues').update({ articles: updated }).eq('id', currentIssue.id); setCurrentIssue({...currentIssue, articles: updated}); }
       alert("등록 완료되었습니다!"); setIsUploadOpen(false);
       if (data.type !== 'article') window.location.reload();
    } catch (e) { alert("오류: " + e.message); } finally { setIsUploading(false); }
  };
  
  const handleDeleteIssue = async (id) => { if(confirm('삭제하시겠습니까?')) { await supabase.from('issues').delete().eq('id', id); window.location.reload(); }};
  const handleIssueClick = (issue) => { incrementViewCount('issues', issue.id, issue.views); const updatedIssue = { ...issue, views: (issue.views || 0) + 1 }; setIssues(prev => prev.map(i => i.id === issue.id ? updatedIssue : i)); setCurrentIssue(updatedIssue); setView('issue_detail'); };

  if (!supabase) return <div className="flex items-center justify-center min-h-screen bg-gray-50"><AlertTriangle className="text-red-500 mb-4" size={40}/>DB 연결 오류</div>;

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-100">
       
       {/* 우측 슬라이드 메뉴 */}
       {isSideMenuOpen && (
         <div className="fixed inset-0 z-[100] flex justify-end">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsSideMenuOpen(false)} />
           <div className="relative w-[320px] h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col rounded-l-[2rem] overflow-hidden">
             <div className="flex items-center justify-between p-8 border-b border-slate-50 dark:border-gray-800">
               <span className="font-black text-2xl flex items-center gap-2"><LayoutGrid className="text-sky-500"/> 전체 메뉴</span>
               <button onClick={() => setIsSideMenuOpen(false)} className="p-3 bg-slate-100 rounded-full hover:bg-slate-200"><X size={20} /></button>
             </div>
             <nav className="flex-1 overflow-y-auto p-6">
               <ul className="flex flex-col gap-3">
                 {[
                   { id: 'home', icon: <Home size={24} className="text-sky-500" />, label: '홈으로' },
                   { id: 'resource_map', icon: <MapIcon size={24} className="text-emerald-500" />, label: '내 주변 체험지도' },
                   { id: 'issue_list', icon: <Book size={24} className="text-teal-500"/>, label: '월간 자료실' },
                   { id: 'notice', icon: <CalendarIcon size={24} className="text-amber-500"/>, label: '기관 소식' },
                   { id: 'news', icon: <Newspaper size={24} className="text-rose-500"/>, label: '뉴스룸' }
                 ].map((item) => (
                   <li key={item.id}>
                     <button onClick={() => { setView(item.id); setIsSideMenuOpen(false); }} className="w-full flex items-center justify-between p-5 rounded-3xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all text-left font-black text-lg text-slate-700">
                       <div className="flex items-center gap-4 bg-white shadow-sm p-3 rounded-2xl">{item.icon} {item.label}</div>
                     </button>
                   </li>
                 ))}
               </ul>
             </nav>
           </div>
         </div>
       )}

       <Navbar onHomeClick={() => setView('home')} onViewChange={setView} currentView={view} isDarkMode={isDarkMode} toggleTheme={toggleTheme} onMenuClick={() => setIsSideMenuOpen(true)} role={role}/>
       
       <main className={`flex-1 w-full ${view === 'resource_map' ? 'h-[calc(100dvh-80px)] overflow-hidden' : 'pb-24'}`}>
          
          {/* ✅ 아이꿈터 스타일 전면 개편 홈 화면 (Dashboard) */}
          {view === 'home' && (
            <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 space-y-12 animate-in fade-in">
               
               {/* 1. 파스텔톤 대형 히어로 배너 */}
               <div className="bg-gradient-to-br from-sky-100 via-teal-50 to-emerald-100 rounded-[2.5rem] p-8 md:p-14 shadow-sm flex items-center justify-between overflow-hidden relative border border-white">
                 <div className="z-10 relative">
                   <span className="bg-white text-sky-600 font-black px-4 py-1.5 rounded-full text-sm shadow-sm mb-6 inline-flex items-center gap-2"><Sparkles size={16}/> 아이꿈터 테마 적용 완료</span>
                   <h2 className="text-4xl md:text-[3.5rem] font-black text-slate-800 leading-[1.2] mb-6 tracking-tight">아이들의 미래를 잇는<br/><span className="text-sky-600">지식 플랫폼</span></h2>
                   <p className="text-slate-600 font-black text-lg md:text-xl">우리 동네 유보통합 자원과 최신 교육 정보를 한눈에!</p>
                 </div>
                 {/* 장식용 아이콘 */}
                 <div className="absolute right-0 bottom-0 opacity-20 translate-x-1/4 translate-y-1/4 select-none pointer-events-none">
                    <MapIcon size={350} className="text-teal-600" />
                 </div>
               </div>

               {/* 2. 아이꿈터 스타일 둥근 퀵 메뉴 그리드 */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                 {[
                    { id: 'resource_map', title: '체험자원 지도', desc: '내 주변 자원 찾기', icon: <MapPin size={32}/>, color: 'text-emerald-500 bg-emerald-50' },
                    { id: 'issue_list', title: '월간 자료실', desc: '유보통합 웹진', icon: <Book size={32}/>, color: 'text-teal-500 bg-teal-50' },
                    { id: 'notice', title: '기관 소식', desc: '공지 및 행사일정', icon: <CalendarIcon size={32}/>, color: 'text-amber-500 bg-amber-50' },
                    { id: 'news', title: '뉴스룸', desc: '최신 교육 뉴스', icon: <Newspaper size={32}/>, color: 'text-rose-500 bg-rose-50' }
                 ].map(menu => (
                    <div key={menu.id} onClick={() => setView(menu.id)} className="bg-white rounded-[2.5rem] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-2 transition-all cursor-pointer flex flex-col items-center text-center border border-slate-50">
                       <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center mb-5 ${menu.color} shadow-inner`}>
                          {menu.icon}
                       </div>
                       <h3 className="text-xl font-black text-slate-800 mb-1">{menu.title}</h3>
                       <p className="text-sm font-bold text-slate-400">{menu.desc}</p>
                    </div>
                 ))}
               </div>

               {/* 3. 위젯 영역: 최신 소식 및 웹진 */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6">
                 {/* 최신 소식 */}
                 <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                       <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3"><span className="p-2 bg-amber-50 text-amber-500 rounded-2xl"><Megaphone size={24}/></span> 최신 기관 소식</h3>
                       <button onClick={() => setView('notice')} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-sky-50 hover:text-sky-500 transition-colors"><Plus size={20}/></button>
                    </div>
                    <div className="flex flex-col gap-4">
                      {recentNotices.map(n => (
                         <div key={n.id} onClick={() => setView('notice')} className="p-5 rounded-[1.5rem] bg-slate-50 hover:bg-sky-50 transition-colors cursor-pointer flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                               <KRDSBadge variant={n.category === 'event' ? 'primary' : 'neutral'}>{n.category === 'event' ? '행사' : '공지'}</KRDSBadge>
                               <span className="font-black text-slate-700 group-hover:text-sky-600 line-clamp-1 text-lg">{n.title}</span>
                            </div>
                            <ChevronRight className="text-slate-300 group-hover:text-sky-500 shrink-0"/>
                         </div>
                      ))}
                    </div>
                 </div>

                 {/* 최신 자료실 */}
                 <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                       <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3"><span className="p-2 bg-teal-50 text-teal-500 rounded-2xl"><Book size={24}/></span> 월간 웹진</h3>
                       <button onClick={() => setView('issue_list')} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-sky-50 hover:text-sky-500 transition-colors"><Plus size={20}/></button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {issues.slice(0, 2).map(issue => (
                         <div key={issue.id} onClick={() => { setCurrentIssue(issue); setView('issue_detail'); }} className="aspect-square bg-gradient-to-br from-teal-50 to-emerald-50 rounded-[2rem] flex flex-col items-center justify-center p-4 cursor-pointer hover:shadow-md transition-all group">
                            <span className="text-teal-600 font-black text-sm bg-white px-3 py-1 rounded-full mb-3 shadow-sm">Vol.{issue.vol}</span>
                            <h4 className="text-xl font-black text-slate-800 text-center line-clamp-2 group-hover:scale-105 transition-transform">{issue.title}</h4>
                         </div>
                      ))}
                    </div>
                 </div>
               </div>

            </div>
          )}

          {/* ✅ 지도 화면 (별도 탭으로 분리) */}
          {view === 'resource_map' && (
            <div className="flex flex-col md:flex-row w-full h-full relative">
              {/* 좌측: 둥근 모서리의 검색 칩 필터 패널 */}
              <div className="absolute top-4 left-4 right-4 md:static md:w-[420px] md:h-full z-10 flex flex-col pointer-events-none md:pointer-events-auto">
                <div className="bg-white/95 backdrop-blur-xl p-6 rounded-[2rem] md:rounded-none md:border-r border-slate-100 shadow-[0_20px_40px_rgba(0,0,0,0.08)] pointer-events-auto h-auto md:h-full flex flex-col">
                  
                  <div className="mb-6 flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center"><MapPin size={24}/></div>
                    <div><h2 className="text-2xl font-black text-slate-800 tracking-tight">체험자원 지도</h2></div>
                  </div>

                  <div className="relative mb-5">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                    <input type="text" placeholder="체험처명 또는 주소 검색" value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} className="w-full h-14 pl-12 pr-4 bg-slate-50 border-none rounded-[1.5rem] focus:bg-white focus:ring-2 focus:ring-emerald-400 transition-all font-black text-base shadow-inner" />
                  </div>

                  <div className="flex flex-wrap gap-2 mb-2 md:mb-6">
                    {['전체', '전주시', '익산시', '군산시', '완주군'].map(region => (
                      <button key={region} onClick={() => { setSelectedRegion(region); setSelectedResource(null); }} className={`px-5 py-2.5 text-sm font-black rounded-full transition-all border ${selectedRegion === region ? 'bg-emerald-500 text-white border-emerald-500 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-300 hover:text-emerald-600'}`}>{region}</button>
                    ))}
                  </div>

                  {/* PC 전용 리스트 */}
                  <div className="hidden md:flex flex-col flex-1 overflow-y-auto mt-2 pr-2 custom-scrollbar">
                    <div className="text-sm font-black text-emerald-600 mb-4 px-1">검색 결과 {filteredResources.length}건</div>
                    <div className="flex flex-col gap-4">
                      {filteredResources.map(res => (
                        <div key={res.id} onClick={() => setSelectedResource(res)} className={`p-6 rounded-[1.5rem] cursor-pointer transition-all border ${selectedResource?.id === res.id ? 'bg-white border-emerald-500 ring-4 ring-emerald-50 shadow-[0_8px_30px_rgba(16,185,129,0.15)]' : 'bg-slate-50 border-transparent hover:bg-white hover:shadow-md'}`}>
                          <KRDSBadge variant="success" className="mb-3">{res.category}</KRDSBadge>
                          <h3 className="font-black text-xl text-slate-800 mb-2">{res.name}</h3>
                          <p className="text-sm font-bold text-slate-500 truncate">{res.address}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 백그라운드 카카오맵 */}
              <div className="absolute inset-0 md:relative md:flex-1 bg-slate-100 z-0">
                 {mapLoading ? <div className="w-full h-full flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-emerald-500" size={40} /></div> 
                 : <div ref={mapContainerRef} className="w-full h-full" />}
              </div>

              {/* 모바일 바텀 시트 (마커 클릭 시) */}
              <div className={`fixed md:hidden bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-[100] transform transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${selectedResource ? 'translate-y-0' : 'translate-y-[110%]'}`}>
                 {selectedResource && (
                   <div className="p-8 pb-12 relative">
                      <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8"></div>
                      <button className="absolute top-8 right-8 p-3 bg-slate-100 rounded-full text-slate-500" onClick={() => setSelectedResource(null)}><X size={20}/></button>
                      
                      <div className="flex gap-2 mb-5">
                         <KRDSBadge variant="success">{selectedResource.category}</KRDSBadge>
                         <KRDSBadge variant="primary">누리과정 연계</KRDSBadge>
                      </div>
                      <h3 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">{selectedResource.name}</h3>
                      <p className="text-slate-500 font-bold flex items-start gap-2 mb-8"><MapPin size={18} className="mt-0.5 shrink-0 text-emerald-500"/> {selectedResource.address}</p>
                      
                      <div className="grid grid-cols-2 gap-4">
                         <button className="bg-emerald-500 text-white py-4 rounded-2xl font-black text-lg shadow-md flex justify-center items-center gap-2 hover:bg-emerald-600"><CheckCircle2 size={24}/> 상세 보기</button>
                         <button className="bg-emerald-50 text-emerald-600 py-4 rounded-2xl font-black text-lg flex justify-center items-center gap-2 hover:bg-emerald-100"><Phone size={24}/> 전화 연결</button>
                      </div>
                   </div>
                 )}
              </div>
            </div>
          )}

          {/* 서브 페이지 렌더링 영역 */}
          {view === 'news' && <NewsFeed isAdmin={role === 'admin'} onBack={() => setView('home')} />}
          {view === 'notice' && <NoticeBoard userRole={role} onWriteClick={(t) => { setUploadType(t); setIsUploadOpen(true);}}/>}
          
          {view === 'issue_list' && (
            <div className="pt-12 max-w-7xl mx-auto px-4 animate-in fade-in">
              <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-100">
                <h2 className="text-3xl font-black flex items-center gap-3 text-slate-800"><span className="p-2 bg-teal-50 rounded-2xl"><Book className="text-teal-500" size={32}/></span> 월간 자료실</h2>
                {role === 'admin' && <button onClick={() => { setUploadType('issue'); setIsUploadOpen(true); }} className="bg-teal-500 text-white px-6 py-3 rounded-2xl font-black shadow-md flex items-center gap-2 hover:bg-teal-600"><Plus size={20}/> 호수 발행</button>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {issues.map(issue => <IssueCard key={issue.id} issue={issue} onClick={handleIssueClick} isAdmin={role === 'admin'} onDelete={handleDeleteIssue}/>)}
              </div>
            </div>
          )}

          {view === 'issue_detail' && currentIssue && (
            <div className="max-w-5xl mx-auto px-4 py-12 animate-in fade-in">
              <button onClick={() => setView('issue_list')} className="mb-8 flex items-center gap-2 font-black text-slate-400 hover:text-teal-500 bg-white px-5 py-2.5 rounded-full shadow-sm w-max"><ArrowLeft size={20}/> 자료실 목록</button>
              
              <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 md:p-14 mb-12 shadow-[0_20px_60px_rgba(0,0,0,0.05)] flex flex-col md:flex-row gap-10 items-start relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50 pointer-events-none"></div>
                <div className="w-32 h-32 bg-teal-50 rounded-[2rem] flex items-center justify-center text-6xl shadow-inner z-10 shrink-0 border border-teal-100">{currentIssue.icon}</div>
                <div className="z-10">
                  <span className="inline-block px-4 py-1.5 bg-slate-100 text-slate-600 text-sm font-black rounded-full mb-4">Vol.{currentIssue.vol}</span>
                  <h1 className="text-4xl font-black text-slate-800 mb-6 tracking-tight">{currentIssue.title}</h1>
                  <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-2xl">{currentIssue.description}</p>
                </div>
              </div>

              <div className="flex justify-between items-center mb-8 pb-4">
                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">수록 자료 목록</h3>
                {role === 'admin' && <button onClick={() => { setUploadType('article'); setIsUploadOpen(true);}} className="flex items-center gap-2 shadow-md bg-amber-500 text-white px-5 py-2.5 rounded-2xl font-black hover:bg-amber-600"><Plus size={20} /> 자료 추가</button>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentIssue.articles?.map(art => (
                  <div key={art.id} onClick={() => { setCurrentArticle(art); setView('article_view'); }} className="group p-6 bg-white border border-slate-100 rounded-[2rem] hover:border-amber-200 hover:shadow-[0_10px_40px_rgba(0,0,0,0.08)] cursor-pointer transition-all flex items-center gap-5">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-500 transition-colors shadow-inner"><FileText size={32}/></div>
                    <div className="flex-1">
                      <div className="font-black text-lg text-slate-800 group-hover:text-amber-500 transition-colors mb-1">{art.title}</div>
                      <div className="flex items-center gap-3 text-sm font-bold text-slate-400"><span>PDF 문서</span>{art.views > 0 && <span className="flex items-center gap-1 text-amber-500"><Eye size={16}/> {art.views}</span>}</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-amber-50"><ArrowRight className="text-slate-300 group-hover:text-amber-500" size={20}/></div>
                  </div>
                ))}
                {(!currentIssue.articles || currentIssue.articles.length === 0) && <div className="col-span-full py-20 text-center font-black text-slate-400 bg-white border border-slate-100 rounded-[2.5rem]">등록된 자료가 없습니다.</div>}
              </div>
            </div>
          )}
          
          {view === 'article_view' && currentArticle && <CustomPDFViewer article={currentArticle} onBack={() => setView('issue_detail')}/>}
       </main>
       
       {view !== 'resource_map' && <Footer onSecretAdminUnlock={() => setRole('admin')} />}
       
       <UniversalUploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} type={uploadType} isUploading={isUploading} onSubmit={handleUpload}/>
    </div>
  );
};

export default function App() { return <MainApp />; }
