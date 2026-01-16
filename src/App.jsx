import React, { useState, useEffect, useRef } from 'react';
import { 
  Book, FileText, User, LogOut, ChevronRight, ArrowLeft, 
  Plus, Trash2, ChevronLeft,  
  X, Newspaper, Calendar as CalendarIcon, 
  Star, Image as ImageIcon, List as ListIcon,
  RefreshCw, ArrowRight, ArrowUpRight, Paperclip, Loader2, Home
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

// --- [인증 컴포넌트] ---
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
    <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm p-8 border border-gray-100 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20}/></button>
        <h2 className="text-2xl font-black text-slate-900 mb-6 text-center">{isSignUp ? '회원가입' : '로그인'}</h2>
        <form onSubmit={handleAuth} className="space-y-4">
          <input type="email" placeholder="이메일" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none" value={email} onChange={e => setEmail(e.target.value)} required/>
          <input type="password" placeholder="비밀번호" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none" value={password} onChange={e => setPassword(e.target.value)} required/>
          {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-orange-500 transition-colors">{loading ? '처리 중...' : (isSignUp ? '가입하기' : '로그인')}</button>
        </form>
        <button onClick={() => setIsSignUp(!isSignUp)} className="w-full mt-4 text-xs font-bold text-slate-400 hover:text-slate-900">
          {isSignUp ? '로그인하기' : '회원가입하기'}
        </button>
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
    <div className="fixed inset-0 bg-[#F5F5F7] z-[150] flex flex-col h-screen w-screen animate-in slide-in-from-right">
       <div className="h-16 bg-white flex items-center justify-between px-4 border-b border-gray-200 shrink-0">
          <button onClick={onBack}><ArrowLeft/></button>
          <span className="font-bold truncate px-4">{article.title}</span>
          <div className="w-6"/>
       </div>
       <div className="flex-1 overflow-auto p-4 flex justify-center" ref={containerRef}>
          <canvas ref={canvasRef} className="bg-white shadow-lg"/>
       </div>
       {pdfDoc && (
         <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 px-6 py-2 rounded-full shadow-xl flex items-center gap-4">
            <button onClick={() => setPageNumber(p => Math.max(1, p-1))}><ChevronLeft/></button>
            <span className="font-bold">{pageNum} / {pdfDoc.numPages}</span>
            <button onClick={() => setPageNumber(p => Math.min(pdfDoc.numPages, p+1))}><ChevronRight/></button>
         </div>
       )}
    </div>
  );
};

// --- [뉴스룸 컴포넌트 (전체 공개 동기화)] ---
const NewsFeed = ({ limit, onMoreClick, isAdmin }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchNews = async () => {
    setLoading(true);
    if(!supabase) return;
    const { data } = await supabase.from('news').select('*').order('pub_date', { ascending: false }).limit(limit || 50);
    if(data) setNews(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchNews();
  }, [limit]);

  const handleManualRefresh = async () => {
    if (!confirm("최신 뉴스를 가져오시겠습니까?\n(잠시 시간이 소요될 수 있습니다)")) return;
    setIsRefreshing(true);
    try {
      setTimeout(() => {
         fetchNews();
         setIsRefreshing(false);
         alert("최신 뉴스로 업데이트되었습니다.");
      }, 2000);
    } catch (e) {
      alert("업데이트 실패: " + e.message);
      setIsRefreshing(false);
    }
  };

  if (loading && !isRefreshing) return <div className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-orange-500"/></div>;

  return (
    <div className={`max-w-7xl mx-auto px-4 ${limit ? 'py-12' : 'py-16'}`}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 border-b border-gray-200 pb-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
             <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
             <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">News Room</span>
           </div>
           <div className="flex items-center gap-3">
             <h2 className="text-3xl font-black text-slate-900">뉴스룸</h2>
             <button 
               onClick={handleManualRefresh} 
               disabled={isRefreshing}
               className="p-2 bg-gray-100 rounded-full hover:bg-orange-100 text-gray-400 hover:text-orange-500 transition-all"
               title="뉴스 수동 동기화"
             >
               <RefreshCw size={18} className={isRefreshing ? "animate-spin text-orange-500" : ""}/>
             </button>
           </div>
        </div>
        {limit && <button onClick={onMoreClick} className="flex items-center gap-1 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-sm">전체보기 <ArrowRight size={16}/></button>}
      </div>
      
      <div className={`grid ${limit ? 'grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6' : 'flex flex-col gap-4'}`}>
         {news.map((item, idx) => (
            <a key={idx} href={item.link} target="_blank" className="group flex gap-5 items-start p-5 rounded-2xl hover:bg-white border border-transparent hover:border-gray-100 hover:shadow-xl transition-all">
               <div className="hidden sm:flex flex-col items-center justify-center w-16 h-16 bg-slate-100 rounded-2xl shrink-0 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                  <span className="text-[10px] font-bold uppercase opacity-70">{new Date(item.pub_date).toLocaleString('en-US', { month: 'short' })}</span>
                  <span className="text-xl font-black leading-none mt-0.5">{new Date(item.pub_date).getDate()}</span>
               </div>
               <div className="flex-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.author?.includes('Google') ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>{item.author}</span>
                  <h3 className="font-bold text-slate-900 mt-2 line-clamp-2 group-hover:text-orange-600">{item.title}</h3>
               </div>
            </a>
         ))}
         {news.length === 0 && <div className="col-span-full text-center py-10 text-gray-400">최신 뉴스가 없습니다.</div>}
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
    <div className="max-w-7xl mx-auto px-4 py-16 animate-in fade-in">
      <div className="flex justify-between items-end mb-8 border-b border-gray-200 pb-6">
         <div><span className="text-orange-500 font-bold text-xs tracking-widest uppercase mb-1 block">Community</span><h2 className="text-3xl font-black text-slate-900">소식 & 일정</h2></div>
         <div className="flex gap-2">
            <div className="bg-gray-100 p-1 rounded-xl flex">
               <button onClick={() => setMode('list')} className={`p-2 rounded-lg ${mode === 'list' ? 'bg-white shadow text-slate-900' : 'text-slate-400'}`}><ListIcon size={18}/></button>
               <button onClick={() => setMode('calendar')} className={`p-2 rounded-lg ${mode === 'calendar' ? 'bg-white shadow text-slate-900' : 'text-slate-400'}`}><CalendarIcon size={18}/></button>
            </div>
            {(userRole === 'team' || userRole === 'admin') && <button onClick={() => onWriteClick('notice')} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"><Plus size={16}/> 글쓰기</button>}
         </div>
      </div>
      {mode === 'list' ? (
        <div className="space-y-3">
           {notices.map(n => (
              <div key={n.id} className="bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-md transition-all">
                 <div className="flex justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${n.category === 'event' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>{n.category === 'event' ? '행사' : '공지'}</span>
                    <span className="text-xs text-slate-400">{new Date(n.created_at).toLocaleDateString()}</span>
                 </div>
                 <h3 className="text-lg font-bold text-slate-900 mb-2">{n.title}</h3>
                 <p className="text-sm text-slate-500 whitespace-pre-wrap">{n.content}</p>
                 {n.event_date && <div className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg"><CalendarIcon size={14}/> 일정: {n.event_date}</div>}
              </div>
           ))}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100">
           <div className="flex justify-between items-center mb-6">
              <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth()-1)))} className="p-2 hover:bg-gray-50 rounded-full"><ChevronLeft/></button>
              <h3 className="text-xl font-black">{currentDate.getFullYear()}년 {currentDate.getMonth()+1}월</h3>
              <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth()+1)))} className="p-2 hover:bg-gray-50 rounded-full"><ChevronRight/></button>
           </div>
           <div className="grid grid-cols-7 gap-2">
              {['일','월','화','수','목','금','토'].map(d => <div key={d} className="text-center text-xs font-bold text-gray-400 mb-2">{d}</div>)}
              {Array.from({length: 35}).map((_, i) => {
                 const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), i - new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() + 1);
                 const isToday = d.toDateString() === new Date().toDateString();
                 return (
                    <div key={i} className={`min-h-[80px] border border-gray-50 rounded-xl p-2 ${d.getMonth() !== currentDate.getMonth() ? 'opacity-30' : ''}`}>
                       <span className={`text-sm font-bold ${isToday ? 'bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center' : ''}`}>{d.getDate()}</span>
                       <div className="mt-1 flex flex-col gap-1">{getEvents(d).map(ev => <div key={ev.id} className="text-[9px] bg-blue-100 text-blue-700 px-1 rounded truncate font-bold">{ev.title}</div>)}</div>
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
    <div className="max-w-7xl mx-auto px-4 py-16 animate-in fade-in">
      <div className="flex justify-between items-end mb-8 border-b border-gray-200 pb-6">
         <div><span className="text-orange-500 font-bold text-xs tracking-widest uppercase mb-1 block">Gallery</span><h2 className="text-3xl font-black text-slate-900">활동 갤러리</h2></div>
         {(userRole === 'team' || userRole === 'admin') && <button onClick={() => onUploadClick('gallery')} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"><ImageIcon size={16}/> 사진 올리기</button>}
      </div>
      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
         {images.map(img => (
            <div key={img.id} onClick={() => setSelected(img)} className="break-inside-avoid bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-zoom-in group relative border border-gray-100">
               <img src={img.image_url} className="w-full h-auto object-cover"/>
               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 text-white"><h4 className="font-bold text-sm truncate">{img.title}</h4></div>
            </div>
         ))}
      </div>
      {selected && (
         <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setSelected(null)}>
            <img src={selected.image_url} className="max-w-full max-h-[85vh] rounded-xl shadow-2xl" onClick={e => e.stopPropagation()}/>
            <button className="absolute top-5 right-5 text-white/50 hover:text-white"><X size={32}/></button>
         </div>
      )}
    </div>
  );
};

// --- [자료실 (Issue Card)] ---
const IssueCard = ({ issue, onClick, isAdmin, onDelete }) => (
  <div onClick={() => onClick(issue)} className="group cursor-pointer flex flex-col gap-3 relative text-left">
    <div className={`aspect-[4/5] w-full ${issue.cover_color || 'bg-slate-200'} rounded-2xl overflow-hidden relative shadow-sm group-hover:shadow-md transition-all duration-500`}>
      <div className="absolute inset-0 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-700 ease-out">
        <div className="text-5xl md:text-8xl filter drop-shadow-sm opacity-90 transition-transform">{issue.icon || '📚'}</div>
      </div>
      <div className="absolute top-3 left-3 z-10"><span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-md border border-white/20 shadow-sm text-[10px] font-bold tracking-widest uppercase text-slate-900">Vol.{issue.vol}</span></div>
    </div>
    <div className="flex flex-col px-0.5">
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-bold text-slate-400 mb-1 block">{issue.date}</span>
        {isAdmin && <button onClick={(e) => { e.stopPropagation(); onDelete(issue.id); }} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14}/></button>}
      </div>
      <h3 className="text-base md:text-lg font-bold text-slate-900 leading-tight group-hover:text-orange-600 transition-colors line-clamp-2 break-keep">{issue.title}</h3>
      <p className="hidden md:block text-xs text-slate-500 mt-1 line-clamp-2">{issue.description}</p>
    </div>
  </div>
);

// --- [통합 업로드 모달] ---
const UniversalUploadModal = ({ isOpen, onClose, onSubmit, type, isUploading }) => {
  if (!isOpen) return null;
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '', event_date: '', description: '', vol: '' });

  return (
    <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in zoom-in-95">
       <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl max-h-[90vh] overflow-y-auto border border-gray-100">
          <h2 className="text-2xl font-black mb-6 text-slate-900">
             {type === 'notice' && '📢 공지 작성'}
             {type === 'gallery' && '🖼️ 사진 업로드'}
             {type === 'issue' && '📚 새 호수 발행'}
             {type === 'article' && '📝 자료 등록'}
          </h2>
          {isUploading ? <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-orange-500"/> 업로드 중...</div> : (
             <form onSubmit={(e) => { e.preventDefault(); onSubmit({...formData, file, type}); }} className="space-y-4">
                {type === 'issue' && <div><label className="text-xs font-bold text-gray-400">호수 (Vol)</label><input className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold" value={formData.vol} onChange={e => setFormData({...formData, vol: e.target.value})}/></div>}
                <div><label className="text-xs font-bold text-gray-400">제목</label><input className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}/></div>
                
                {type === 'notice' && (
                   <>
                      <div><label className="text-xs font-bold text-gray-400">내용</label><textarea className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl h-24" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})}/></div>
                      <div><label className="text-xs font-bold text-gray-400">일정 (선택)</label><input type="date" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold" value={formData.event_date} onChange={e => setFormData({...formData, event_date: e.target.value})}/></div>
                   </>
                )}
                
                {type === 'issue' && <div><label className="text-xs font-bold text-gray-400">설명</label><textarea className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl h-20" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}/></div>}
                
                {(type === 'article' || type === 'gallery') && (
                   <div className="p-4 bg-orange-50 rounded-xl text-center border border-orange-100 cursor-pointer relative">
                      <input type="file" onChange={e => setFile(e.target.files[0])} className="absolute inset-0 opacity-0"/>
                      <Paperclip className="mx-auto text-orange-400 mb-2"/>
                      <span className="text-xs font-bold text-orange-600">{file ? file.name : (type === 'gallery' ? '사진 선택' : 'PDF 선택')}</span>
                   </div>
                )}

                <div className="flex gap-2 pt-4">
                   <button type="button" onClick={onClose} className="flex-1 py-3 text-gray-400 font-bold hover:bg-gray-100 rounded-xl transition-colors">취소</button>
                   <button type="submit" className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-orange-500 transition-colors shadow-lg">완료</button>
                </div>
             </form>
          )}
       </div>
    </div>
  );
};

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
          await supabase.from('issues').insert([{ vol: data.vol, title: data.title, description: data.description, date: new Date().toLocaleDateString(), cover_color: 'bg-orange-400', icon: '📚' }]);
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
    <div className="min-h-screen bg-[#F5F5F7] font-sans text-slate-900 flex flex-col">
       {/* 네비게이션 */}
       <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
             <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
                <div className="w-8 h-8 bg-gradient-to-tr from-orange-400 to-orange-500 rounded-lg flex items-center justify-center text-white"><Star size={16} fill="currentColor"/></div>
                <span className="font-bold text-lg">키즈 <span className="text-orange-500">인사이트</span></span>
             </div>
             <div className="flex items-center gap-4">
                {['home', 'news', 'notice', 'issue_list', 'gallery'].map(key => (
                   <button key={key} onClick={() => setView(key)} className={`hidden md:block capitalize text-sm font-bold ${view === key ? 'text-slate-900' : 'text-gray-400 hover:text-slate-600'}`}>
                      {key === 'home' ? '홈' : key === 'news' ? '뉴스' : key === 'notice' ? '소식' : key === 'issue_list' ? '자료실' : '갤러리'}
                   </button>
                ))}
                {user ? <button onClick={() => {supabase.auth.signOut(); window.location.reload();}}><LogOut size={18} className="text-gray-400 hover:text-red-500"/></button> : <button onClick={() => setIsAuthOpen(true)} className="bg-slate-900 text-white px-3 py-1.5 rounded-full text-xs font-bold hover:bg-slate-800 transition-colors">로그인</button>}
             </div>
          </div>
       </nav>

       <main className="flex-1 pb-24">
          {view === 'home' && (
             <div className="animate-in fade-in space-y-20">
                {/* 1. Hero Section (Bento Grid) */}
                <section className="pt-10 max-w-7xl mx-auto px-4">
                   <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[400px]">
                      <div className="col-span-12 md:col-span-7 bg-white rounded-[2rem] p-12 flex flex-col justify-center items-start shadow-sm border border-gray-100 relative overflow-hidden group">
                         <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                         <div className="relative z-10">
                            <span className="py-1 px-3 rounded-full bg-slate-100 text-slate-600 text-xs font-bold uppercase mb-4 inline-block">The First Step of Education</span>
                            {/* ✅ [수정] 텍스트 변경: 프리미엄 지식 플랫폼 -> 지식 플랫폼 */}
                            <h1 className="text-5xl font-black text-slate-900 leading-tight mb-6">아이의 내일을 잇는<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500">지식 플랫폼.</span></h1>
                            <p className="text-slate-500 font-medium mb-8">선생님에게 꼭 필요한 깊이 있는 정보를 전합니다.</p>
                            <button onClick={() => setView('issue_list')} className="px-8 py-3 bg-slate-900 text-white rounded-full font-bold shadow-lg hover:bg-orange-500 transition-all flex items-center gap-2">인사이트 탐색하기 <ArrowRight size={18}/></button>
                         </div>
                      </div>
                      <div onClick={() => issues[0] && (setCurrentIssue(issues[0]), setView('issue_detail'))} className="col-span-12 md:col-span-5 bg-orange-500 rounded-[2rem] p-8 relative overflow-hidden cursor-pointer group shadow-lg shadow-orange-200 text-white">
                         {issues[0] ? (
                            <div className="h-full flex flex-col justify-between relative z-10">
                               <div className="flex justify-between"><span className="bg-white/20 px-3 py-1 rounded-lg text-xs font-bold">NEW ISSUE</span><ArrowUpRight size={24}/></div>
                               <div><div className="text-8xl mb-4 group-hover:scale-110 transition-transform">{issues[0].icon}</div><h3 className="text-2xl font-black line-clamp-2">{issues[0].title}</h3></div>
                            </div>
                         ) : <div className="h-full flex items-center justify-center font-bold">발행된 소식이 없습니다.</div>}
                      </div>
                   </div>
                </section>

                {/* 2. News Feed */}
                <NewsFeed limit={4} onMoreClick={() => setView('news')}/>

                {/* 3. Monthly Archive */}
                <section className="max-w-7xl mx-auto px-4 pb-20">
                   <div className="flex items-end justify-between mb-8 border-b border-gray-200 pb-6">
                      <div><h2 className="text-3xl font-black text-slate-900">월간 자료실</h2><p className="text-slate-500 font-medium mt-1">지난 호수들을 확인해보세요.</p></div>
                      <button onClick={() => setView('issue_list')} className="text-sm font-bold text-slate-400 hover:text-orange-500 flex items-center gap-1">전체보기 <ChevronRight size={16}/></button>
                   </div>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
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
                <div className="text-center mb-12"><h2 className="text-4xl font-black mb-4">월간 자료실</h2>{role === 'admin' && <button onClick={() => { setUploadType('issue'); setIsUploadOpen(true); }} className="bg-slate-900 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-orange-500">+ 새 호수 발행</button>}</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">{issues.map(issue => <IssueCard key={issue.id} issue={issue} onClick={(i) => {setCurrentIssue(i); setView('issue_detail');}} isAdmin={role === 'admin'} onDelete={handleDeleteIssue}/>)}</div>
             </div>
          )}
          
          {view === 'issue_detail' && currentIssue && (
             <div className="max-w-5xl mx-auto px-4 py-10 animate-in slide-in-from-right">
                <button onClick={() => setView('issue_list')} className="mb-6 flex items-center gap-2 font-bold text-gray-400 hover:text-slate-900"><ArrowLeft size={20}/> 목록으로</button>
                <div className={`p-10 rounded-[2.5rem] ${currentIssue.cover_color} text-white mb-10 shadow-2xl relative overflow-hidden`}>
                   <div className="relative z-10 flex gap-8 items-start">
                      <div className="w-24 h-24 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-5xl">{currentIssue.icon}</div>
                      <div>
                         <div className="text-xs font-bold tracking-widest mb-2 opacity-80">Vol.{currentIssue.vol}</div>
                         <h1 className="text-4xl font-black mb-4 leading-tight">{currentIssue.title}</h1>
                         <p className="opacity-90 max-w-xl">{currentIssue.description}</p>
                      </div>
                   </div>
                </div>
                <div className="flex justify-between items-end mb-6 border-b border-gray-200 pb-4">
                   <h3 className="text-xl font-bold text-slate-900">수록 자료</h3>
                   {role === 'admin' && <button onClick={() => { setUploadType('article'); setIsUploadOpen(true); }} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-orange-500">+ 자료 추가</button>}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   {currentIssue.articles?.map(art => (
                      <div key={art.id} onClick={() => { setCurrentArticle(art); setView('article_view'); }} className="group p-4 bg-white border border-gray-100 rounded-2xl hover:shadow-lg cursor-pointer transition-all">
                         <div className="aspect-[4/5] bg-slate-50 rounded-xl mb-3 flex items-center justify-center text-orange-200 group-hover:bg-orange-50 transition-colors"><FileText size={32}/></div>
                         <div className="font-bold text-slate-900 line-clamp-1 group-hover:text-orange-600">{art.title}</div>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {view === 'article_view' && currentArticle && <CustomPDFViewer article={currentArticle} onBack={() => setView('issue_detail')}/>}
       </main>

       {/* ✅ [수정] BottomNav에 onMenuClick 제거 (자동 처리) */}
       <BottomNav currentView={view} onViewChange={setView} />
       
       <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onLoginSuccess={() => window.location.reload()}/>
       <UniversalUploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} type={uploadType} isUploading={isUploading} onSubmit={handleUpload}/>
    </div>
  );
};

export default function App() { return <MainApp />; }
