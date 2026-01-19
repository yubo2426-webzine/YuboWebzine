import React, { useState, useEffect, useRef } from 'react';
import { 
  Book, FileText, User, LogOut, ChevronRight, ArrowLeft, 
  Plus, Trash2, ChevronLeft,  
  X, Newspaper, Calendar as CalendarIcon, 
  Star, Image as ImageIcon, List as ListIcon,
  RefreshCw, ArrowRight, ArrowUpRight, Paperclip, Loader2, Home, Search, Menu
} from 'lucide-react';
import { supabase } from './lib/supabase';
import BottomNav from './components/BottomNav';

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
      {/* KRDS Modal Style: 흰색 배경, 직각에 가까운 라운드, 명확한 헤더 */}
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden border border-gray-200">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">{isSignUp ? '회원가입' : '로그인'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900"><X size={20}/></button>
        </div>
        <div className="p-6">
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">이메일</label>
              <input 
                type="email" 
                placeholder="example@korea.kr" 
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">비밀번호</label>
              <input 
                type="password" 
                placeholder="********" 
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required
              />
            </div>
            {error && <p className="text-red-600 text-xs font-bold bg-red-50 p-2 rounded">{error}</p>}
            
            {/* KRDS Primary Button */}
            <button type="submit" disabled={loading} className="w-full py-2.5 bg-[#2563EB] text-white rounded-md font-bold text-sm hover:bg-[#1d4ed8] transition-colors shadow-sm disabled:opacity-50">
              {loading ? '처리 중...' : (isSignUp ? '가입하기' : '로그인')}
            </button>
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

// --- [KRDS 스타일 업로드 모달] ---
const UniversalUploadModal = ({ isOpen, onClose, onSubmit, type, isUploading }) => {
  if (!isOpen) return null;
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '', event_date: '', description: '', vol: '' });

  const getInputClass = "w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400";
  const getLabelClass = "block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1";

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in zoom-in-95">
       <div className="bg-white rounded-lg w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto border border-gray-200 flex flex-col">
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center sticky top-0">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
               {type === 'notice' && <><MegaphoneIcon className="text-blue-600" size={20}/> 공지사항 작성</>}
               {type === 'gallery' && <><ImageIcon className="text-blue-600" size={20}/> 갤러리 업로드</>}
               {type === 'issue' && <><Book className="text-blue-600" size={20}/> 월간호 발행</>}
               {type === 'article' && <><FileText className="text-blue-600" size={20}/> 자료 등록</>}
            </h2>
            <button onClick={onClose}><X className="text-gray-400 hover:text-gray-900"/></button>
          </div>

          <div className="p-6">
            {isUploading ? <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-blue-600 mb-2"/> <p className="text-sm text-gray-600">데이터를 전송 중입니다...</p></div> : (
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
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:bg-gray-50 hover:border-blue-400 transition-colors relative cursor-pointer group">
                           <div className="space-y-1 text-center">
                              <Paperclip className="mx-auto h-12 w-12 text-gray-400 group-hover:text-blue-500"/>
                              <div className="flex text-sm text-gray-600 justify-center">
                                 <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                    <span>파일 업로드</span>
                                    <input type="file" className="sr-only" onChange={e => setFile(e.target.files[0])}/>
                                 </label>
                              </div>
                              <p className="text-xs text-gray-500">{file ? file.name : (type === 'gallery' ? 'PNG, JPG up to 10MB' : 'PDF only')}</p>
                           </div>
                           <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={e => setFile(e.target.files[0])}/>
                        </div>
                     </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                     <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-md hover:bg-gray-50 transition-colors text-sm">취소</button>
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
    <div className="fixed inset-0 bg-gray-100 z-[150] flex flex-col h-screen w-screen animate-in slide-in-from-right">
       <div className="h-16 bg-white flex items-center justify-between px-4 border-b border-gray-200 shrink-0 shadow-sm">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft className="text-gray-700"/></button>
          <span className="font-bold text-gray-900 truncate px-4">{article.title}</span>
          <div className="w-6"/>
       </div>
       <div className="flex-1 overflow-auto p-4 flex justify-center" ref={containerRef}>
          <canvas ref={canvasRef} className="bg-white shadow-md border border-gray-200"/>
       </div>
       {pdfDoc && (
         <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg border border-gray-200 flex items-center gap-4">
            <button onClick={() => setPageNumber(p => Math.max(1, p-1))} className="p-1 hover:bg-gray-100 rounded"><ChevronLeft size={20}/></button>
            <span className="font-mono text-sm font-bold text-gray-700">{pageNum} / {pdfDoc.numPages}</span>
            <button onClick={() => setPageNumber(p => Math.min(pdfDoc.numPages, p+1))} className="p-1 hover:bg-gray-100 rounded"><ChevronRight size={20}/></button>
         </div>
       )}
    </div>
  );
};

// --- [뉴스룸 컴포넌트] ---
const NewsFeed = ({ limit, onMoreClick, isAdmin }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const fetchNews = async () => {
    setLoading(true);
    if(!supabase) return;
    const { data } = await supabase.from('news').select('*').order('pub_date', { ascending: false }).limit(limit || 50);
    if(data) setNews(data);
    setLoading(false);
  };
  
  useEffect(() => { fetchNews(); }, [limit]);

  if (loading) return <div className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-600"/></div>;

  return (
    <div className={`max-w-7xl mx-auto px-4 ${limit ? 'py-12' : 'py-16'}`}>
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
           <span className="w-1.5 h-6 bg-blue-600 inline-block rounded-sm"></span>
           뉴스룸
        </h2>
        {limit && <button onClick={onMoreClick} className="text-sm font-bold text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors">전체보기 <ChevronRight size={16}/></button>}
      </div>
      
      {/* KRDS List Style */}
      <div className="flex flex-col border-t border-gray-200">
         {news.map((item, idx) => (
            <a key={idx} href={item.link} target="_blank" className="group flex flex-col md:flex-row gap-4 p-5 border-b border-gray-200 hover:bg-blue-50/50 transition-colors">
               <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                     <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${item.author?.includes('Google') ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-green-50 border-green-100 text-green-600'}`}>{item.author || '뉴스'}</span>
                     <span className="text-xs text-gray-400 font-medium">{new Date(item.pub_date).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{item.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">클릭하여 원문 기사를 확인하세요.</p>
               </div>
               <div className="hidden md:flex items-center text-gray-300 group-hover:text-blue-400">
                  <ArrowUpRight size={20}/>
               </div>
            </a>
         ))}
         {news.length === 0 && <div className="text-center py-10 text-gray-400 border-b border-gray-200">등록된 뉴스가 없습니다.</div>}
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
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
         <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-blue-600 inline-block rounded-sm"></span>
            소식 & 일정
         </h2>
         <div className="flex gap-2">
            <div className="bg-gray-100 p-1 rounded-md flex border border-gray-200">
               <button onClick={() => setMode('list')} className={`p-1.5 rounded-sm text-sm font-bold flex items-center gap-1 ${mode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}><ListIcon size={16}/> 목록</button>
               <button onClick={() => setMode('calendar')} className={`p-1.5 rounded-sm text-sm font-bold flex items-center gap-1 ${mode === 'calendar' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}><CalendarIcon size={16}/> 달력</button>
            </div>
            {(userRole === 'team' || userRole === 'admin') && 
               <button onClick={() => onWriteClick('notice')} className="bg-[#2563EB] text-white px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 hover:bg-[#1d4ed8] transition-colors"><Plus size={16}/> 글쓰기</button>
            }
         </div>
      </div>
      
      {mode === 'list' ? (
        <div className="grid gap-4">
           {notices.map(n => (
              <div key={n.id} className="bg-white p-5 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors shadow-sm">
                 <div className="flex justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${n.category === 'event' ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>{n.category === 'event' ? '행사' : '공지'}</span>
                    <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleDateString()}</span>
                 </div>
                 <h3 className="text-lg font-bold text-gray-900 mb-2">{n.title}</h3>
                 <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{n.content}</p>
                 {n.event_date && <div className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded border border-blue-100"><CalendarIcon size={14}/> 일정: {n.event_date}</div>}
              </div>
           ))}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
           <div className="flex justify-center items-center mb-6 gap-8">
              <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth()-1)))} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft/></button>
              <h3 className="text-xl font-bold text-gray-900">{currentDate.getFullYear()}년 {currentDate.getMonth()+1}월</h3>
              <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth()+1)))} className="p-2 hover:bg-gray-100 rounded-full"><ChevronRight/></button>
           </div>
           <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded overflow-hidden">
              {['일','월','화','수','목','금','토'].map(d => <div key={d} className="bg-gray-50 text-center text-xs font-bold text-gray-500 py-2">{d}</div>)}
              {Array.from({length: 35}).map((_, i) => {
                 const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), i - new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() + 1);
                 const isToday = d.toDateString() === new Date().toDateString();
                 const isCurrentMonth = d.getMonth() === currentDate.getMonth();
                 return (
                    <div key={i} className={`min-h-[100px] bg-white p-2 ${!isCurrentMonth ? 'bg-gray-50/50 text-gray-300' : ''}`}>
                       <span className={`text-sm font-bold inline-block w-6 h-6 text-center leading-6 rounded-full ${isToday ? 'bg-blue-600 text-white' : ''}`}>{d.getDate()}</span>
                       <div className="mt-1 flex flex-col gap-1">{getEvents(d).map(ev => <div key={ev.id} className="text-[10px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded truncate font-bold">{ev.title}</div>)}</div>
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
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
         <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-blue-600 inline-block rounded-sm"></span>
            활동 갤러리
         </h2>
         {(userRole === 'team' || userRole === 'admin') && <button onClick={() => onUploadClick('gallery')} className="bg-[#2563EB] text-white px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 hover:bg-[#1d4ed8] transition-colors"><ImageIcon size={16}/> 사진 올리기</button>}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         {images.map(img => (
            <div key={img.id} onClick={() => setSelected(img)} className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group">
               <div className="aspect-square overflow-hidden bg-gray-100">
                  <img src={img.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
               </div>
               <div className="p-3">
                  <h4 className="font-bold text-sm text-gray-900 truncate">{img.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{new Date(img.created_at).toLocaleDateString()}</p>
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

// --- [자료실 (Issue Card)] ---
const IssueCard = ({ issue, onClick, isAdmin, onDelete }) => (
  <div onClick={() => onClick(issue)} className="group cursor-pointer flex flex-col bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg hover:border-blue-400 transition-all">
    <div className={`aspect-[4/5] w-full ${issue.cover_color || 'bg-gray-100'} relative flex items-center justify-center`}>
      <div className="text-6xl transform group-hover:scale-110 transition-transform duration-500">{issue.icon || '📚'}</div>
      <div className="absolute top-0 left-0 w-full h-full bg-black/5 opacity-0 group-hover:opacity-10 transition-opacity"/>
      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold border border-gray-200 text-gray-900">Vol.{issue.vol}</div>
    </div>
    <div className="p-4 flex-1 flex flex-col">
      <div className="flex justify-between items-start mb-2">
        <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{issue.date}</span>
        {isAdmin && <button onClick={(e) => { e.stopPropagation(); onDelete(issue.id); }} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>}
      </div>
      <h3 className="text-lg font-bold text-gray-900 leading-tight mb-2 group-hover:text-blue-600 transition-colors">{issue.title}</h3>
      <p className="text-xs text-gray-500 line-clamp-2 mt-auto">{issue.description}</p>
    </div>
  </div>
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
    <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
       {/* --- [KRDS 표준 GNB] --- */}
       <header className="sticky top-0 z-50 bg-white border-b border-gray-200 h-[70px] flex items-center shadow-sm">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView('home')}>
             <div className="w-10 h-10 bg-[#2563EB] rounded-lg flex items-center justify-center text-white font-black text-xl shadow-md group-hover:bg-[#1d4ed8] transition-colors">K</div>
             <div className="flex flex-col justify-center">
               <span className="font-bold text-xl text-gray-900 leading-none tracking-tight group-hover:text-[#2563EB] transition-colors">아이들의 내일을 잇는 지식 플랫폼</span>
             </div>
          </div>
          <nav className="hidden md:flex items-center h-full">
            {['home', 'news', 'notice', 'issue_list', 'gallery'].map(key => (
              <button key={key} onClick={() => setView(key)} className={`h-full px-6 text-[16px] font-medium transition-all relative flex items-center ${view === key ? 'text-[#2563EB] font-bold after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[4px] after:bg-[#2563EB]' : 'text-gray-600 hover:text-[#2563EB] hover:bg-gray-50'}`}>{key === 'home' ? '홈' : key === 'news' ? '뉴스룸' : key === 'notice' ? '소식·일정' : key === 'issue_list' ? '자료실' : '갤러리'}</button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button className="p-2 text-gray-400 hover:text-[#2563EB] transition-colors hidden sm:block"><Search size={20}/></button>
            {user || role === 'admin' ? (
              <button onClick={() => {if(supabase) supabase.auth.signOut(); window.location.reload();}} className="px-3 py-1.5 border border-gray-300 rounded-md text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors">로그아웃</button>
            ) : (
              <button onClick={() => setIsAuthOpen(true)} className="px-5 py-2.5 bg-[#2563EB] text-white rounded-md text-sm font-bold hover:bg-[#1d4ed8] hover:shadow-lg transition-all">로그인</button>
            )}
          </div>
        </div>
      </header>

       <main className="flex-1 pb-24">
          {view === 'home' && (
             <div className="animate-in fade-in space-y-20">
                {/* --- [KRDS Hero Section] --- */}
                <section className="bg-gray-50 py-16 md:py-24 border-b border-gray-200">
                   <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                      <div>
                         <span className="inline-block py-1 px-3 rounded bg-blue-100 text-blue-700 text-xs font-bold mb-4">Beta v1.0</span>
                         <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight mb-6">
                            아이들의 내일을 잇는<br/>
                            <span className="text-[#2563EB]">지식 플랫폼.</span>
                         </h1>
                         <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                            키즈 인사이트는 선생님과 부모님을 위한<br/>
                            깊이 있는 교육 정보를 공신력 있게 전달합니다.
                         </p>
                         <div className="flex gap-4">
                            <button onClick={() => setView('issue_list')} className="px-8 py-4 bg-[#2563EB] text-white rounded-md font-bold shadow-md hover:bg-[#1d4ed8] transition-all flex items-center gap-2">
                               자료실 바로가기 <ArrowRight size={18}/>
                            </button>
                            <button onClick={() => setView('news')} className="px-8 py-4 bg-white border border-gray-300 text-gray-700 rounded-md font-bold hover:bg-gray-50 transition-all">
                               뉴스룸 탐색
                            </button>
                         </div>
                      </div>
                      <div className="relative h-[300px] md:h-[400px] bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden flex items-center justify-center p-10">
                         {issues[0] ? (
                            <div className="text-center">
                               <div className="text-xs font-bold text-gray-400 mb-2">LATEST ISSUE</div>
                               <div className="text-9xl mb-4 animate-bounce-slow">{issues[0].icon}</div>
                               <h3 className="text-2xl font-black text-gray-900">{issues[0].title}</h3>
                            </div>
                         ) : <div className="text-gray-300 font-bold">발행된 호수가 없습니다.</div>}
                      </div>
                   </div>
                </section>

                <NewsFeed limit={4} onMoreClick={() => setView('news')}/>

                <section className="max-w-7xl mx-auto px-4 pb-20">
                   <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
                      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><span className="w-1.5 h-6 bg-blue-600 inline-block rounded-sm"></span>월간 자료실</h2>
                      <button onClick={() => setView('issue_list')} className="text-sm font-bold text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors">전체보기 <ChevronRight size={16}/></button>
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
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
                   <h2 className="text-3xl font-bold text-gray-900">월간 자료실</h2>
                   {role === 'admin' && <button onClick={() => { setUploadType('issue'); setIsUploadOpen(true); }} className="bg-[#2563EB] text-white px-5 py-2.5 rounded-md font-bold shadow-sm hover:bg-[#1d4ed8] flex items-center gap-2"><Plus size={18}/> 호수 발행</button>}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">{issues.map(issue => <IssueCard key={issue.id} issue={issue} onClick={(i) => {setCurrentIssue(i); setView('issue_detail');}} isAdmin={role === 'admin'} onDelete={handleDeleteIssue}/>)}</div>
             </div>
          )}
          
          {view === 'issue_detail' && currentIssue && (
             <div className="max-w-5xl mx-auto px-4 py-10 animate-in slide-in-from-right">
                <button onClick={() => setView('issue_list')} className="mb-6 flex items-center gap-2 font-bold text-gray-500 hover:text-blue-600 transition-colors"><ArrowLeft size={20}/> 목록으로 돌아가기</button>
                <div className="bg-white border border-gray-200 rounded-lg p-8 md:p-12 mb-10 shadow-sm flex flex-col md:flex-row gap-8 items-start">
                   <div className="w-24 h-24 bg-blue-50 rounded-lg flex items-center justify-center text-5xl border border-blue-100 text-blue-600">{currentIssue.icon}</div>
                   <div>
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded mb-3">Vol.{currentIssue.vol}</span>
                      <h1 className="text-3xl font-black mb-4 text-gray-900">{currentIssue.title}</h1>
                      <p className="text-gray-600 leading-relaxed max-w-2xl">{currentIssue.description}</p>
                   </div>
                </div>
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                   <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2"><span className="w-1.5 h-6 bg-blue-600 inline-block rounded-sm"></span>수록 자료 목록</h3>
                   {role === 'admin' && (
                      <button 
                         onClick={() => { setUploadType('article'); setIsUploadOpen(true); }} 
                         className="btn btn-primary btn-md flex items-center gap-2 shadow-sm bg-[#2563EB] text-white px-4 py-2 rounded-md font-bold hover:bg-[#1d4ed8]"
                      >
                         <Plus size={18} /> 자료 추가
                      </button>
                   )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {currentIssue.articles?.map(art => (
                      <div key={art.id} onClick={() => { setCurrentArticle(art); setView('article_view'); }} className="group p-5 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md cursor-pointer transition-all flex items-center gap-4">
                         <div className="w-12 h-12 bg-gray-50 rounded-md flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors"><FileText size={24}/></div>
                         <div>
                            <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{art.title}</div>
                            <div className="text-xs text-gray-400 mt-1">PDF 문서</div>
                         </div>
                         <ArrowRight className="ml-auto text-gray-300 group-hover:text-blue-400"/>
                      </div>
                   ))}
                   {(!currentIssue.articles || currentIssue.articles.length === 0) && <div className="col-span-full py-10 text-center text-gray-400 border border-dashed border-gray-300 rounded-lg">등록된 자료가 없습니다.</div>}
                </div>
             </div>
          )}

          {view === 'article_view' && currentArticle && <CustomPDFViewer article={currentArticle} onBack={() => setView('issue_detail')}/>}
       </main>

       <BottomNav currentView={view} onViewChange={setView} />
       
       <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onLoginSuccess={() => window.location.reload()}/>
       <UniversalUploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} type={uploadType} isUploading={isUploading} onSubmit={handleUpload}/>
    </div>
  );
};

export default function App() { return <MainApp />; }
