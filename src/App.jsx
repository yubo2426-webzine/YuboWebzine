import React, { useState, useEffect, useRef } from 'react';
import { 
  Book, FileText, User, Lock, LogOut, ChevronRight, ArrowLeft, 
  Search, Plus, Trash2, Eye, ChevronLeft, ZoomIn, ZoomOut, Download, 
  Link as LinkIcon, Share2, X, Newspaper, Calendar as CalendarIcon, 
  Filter, AlertTriangle, AlertCircle, Zap, Menu, Mail, 
  MessageCircle, Star, Image as ImageIcon, Check, UserPlus, Grid, List as ListIcon
} from 'lucide-react';
import { supabase } from './lib/supabase'; // supabase 설정 파일 경로 확인 필요
import BottomNav from './components/BottomNav'; // BottomNav 컴포넌트 경로 확인 필요

// --- [유틸리티] ---
const useContainerSize = (ref) => {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const updateSize = () => { if (ref.current) setSize({ width: ref.current.clientWidth, height: ref.current.clientHeight }); };
    window.addEventListener('resize', updateSize); updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, [ref]);
  return size;
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
        alert("가입 확인 메일을 보냈습니다. 이메일을 확인해주세요!");
        setIsSignUp(false);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onLoginSuccess();
        onClose();
      }
    } catch (err) { setError(err.message); } 
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm p-8 border border-gray-100">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-slate-900 text-white rounded-full flex items-center justify-center mb-4 mx-auto shadow-lg"><User size={32} /></div>
          <h2 className="text-2xl font-black text-slate-900">{isSignUp ? '선생님 회원가입' : '선생님 로그인'}</h2>
          <p className="text-xs text-slate-400 mt-2 font-bold">Together Edu-Care 커뮤니티</p>
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          <input type="email" placeholder="이메일 주소" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:border-orange-400" value={email} onChange={e => setEmail(e.target.value)} required/>
          <input type="password" placeholder="비밀번호 (6자리 이상)" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:border-orange-400" value={password} onChange={e => setPassword(e.target.value)} required/>
          {error && <p className="text-red-500 text-xs font-bold bg-red-50 p-2 rounded-lg">{error === 'Invalid login credentials' ? '이메일 또는 비밀번호가 틀렸습니다.' : error}</p>}
          <button type="submit" disabled={loading} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg active:scale-95 hover:bg-orange-500 transition-all flex justify-center items-center">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : (isSignUp ? '가입하기' : '로그인')}
          </button>
        </form>
        <div className="mt-4 text-center">
          <button onClick={() => { setIsSignUp(!isSignUp); setError(null); }} className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors">
            {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
          </button>
        </div>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-300 hover:text-gray-500"><X size={20}/></button>
      </div>
    </div>
  );
};

// --- [공지사항 & 캘린더 컴포넌트] ---
const NoticeBoard = ({ userRole, onWriteClick }) => {
  const [mode, setMode] = useState('list'); // 'list' or 'calendar'
  const [notices, setNotices] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    const { data } = await supabase.from('notices').select('*, profiles(email)').order('created_at', { ascending: false });
    if (data) setNotices(data);
  };

  // 심플 달력 생성 로직
  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    
    return days;
  };

  const getEventsForDate = (date) => {
    if (!date) return [];
    return notices.filter(n => n.event_date && new Date(n.event_date).toDateString() === date.toDateString());
  };

  return (
    <div className="animate-in fade-in duration-500 pt-8 pb-20 max-w-7xl mx-auto px-4">
      <div className="flex justify-between items-end mb-8 border-b border-gray-200 pb-6">
        <div>
          <span className="text-orange-500 font-bold text-xs tracking-widest uppercase mb-1 block">Community</span>
          <h2 className="text-3xl font-black text-slate-900">소식 & 일정</h2>
        </div>
        <div className="flex gap-2">
           <div className="bg-gray-100 p-1 rounded-xl flex">
              <button onClick={() => setMode('list')} className={`p-2 rounded-lg transition-all ${mode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}><ListIcon size={18}/></button>
              <button onClick={() => setMode('calendar')} className={`p-2 rounded-lg transition-all ${mode === 'calendar' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}><CalendarIcon size={18}/></button>
           </div>
           {(userRole === 'team' || userRole === 'admin') && (
             <button onClick={() => onWriteClick('notice')} className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold hover:bg-orange-500 transition-colors shadow-lg flex items-center gap-2 text-sm"><Plus size={16}/> 글쓰기</button>
           )}
        </div>
      </div>

      {mode === 'list' ? (
        <div className="flex flex-col gap-3">
          {notices.length === 0 ? <div className="py-20 text-center text-slate-400 font-bold bg-white rounded-3xl border border-dashed border-gray-200">등록된 공지사항이 없습니다.</div> :
           notices.map(notice => (
            <div key={notice.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
               <div className="flex justify-between items-start mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${notice.category === 'event' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>{notice.category === 'event' ? '행사' : '공지'}</span>
                  <span className="text-xs text-slate-400 font-medium">{new Date(notice.created_at).toLocaleDateString()}</span>
               </div>
               <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-orange-500 transition-colors">{notice.title}</h3>
               <p className="text-slate-500 text-sm line-clamp-2 whitespace-pre-wrap">{notice.content}</p>
               {notice.event_date && (
                 <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 p-2 rounded-lg w-fit">
                    <CalendarIcon size={14} className="text-blue-500"/> 일정: {new Date(notice.event_date).toLocaleDateString()}
                 </div>
               )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
           <div className="flex justify-between items-center mb-6 px-2">
              <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft/></button>
              <h3 className="text-xl font-black text-slate-900">{currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월</h3>
              <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-2 hover:bg-gray-100 rounded-full"><ChevronRight/></button>
           </div>
           <div className="grid grid-cols-7 gap-2 mb-2 text-center">
              {['일','월','화','수','목','금','토'].map(d => <span key={d} className="text-xs font-bold text-slate-400 mb-2">{d}</span>)}
           </div>
           <div className="grid grid-cols-7 gap-2">
              {generateCalendar().map((date, i) => (
                <div key={i} className={`min-h-[80px] p-2 rounded-xl border border-gray-50 flex flex-col items-start transition-all ${!date ? 'bg-transparent border-none' : 'bg-white hover:border-orange-200'}`}>
                   {date && (
                     <>
                       <span className={`text-sm font-bold mb-1 ${date.toDateString() === new Date().toDateString() ? 'bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-slate-700'}`}>{date.getDate()}</span>
                       <div className="flex flex-col gap-1 w-full">
                         {getEventsForDate(date).map(ev => (
                           <div key={ev.id} className="text-[9px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded truncate w-full text-left">{ev.title}</div>
                         ))}
                       </div>
                     </>
                   )}
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

// --- [갤러리 컴포넌트] ---
const Gallery = ({ userRole, onUploadClick }) => {
  const [images, setImages] = useState([]);
  const [selectedImg, setSelectedImg] = useState(null);

  useEffect(() => {
    const fetchGallery = async () => {
      const { data } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });
      if (data) setImages(data);
    };
    fetchGallery();
  }, []);

  return (
    <div className="animate-in fade-in duration-500 pt-8 pb-20 max-w-7xl mx-auto px-4">
      <div className="flex justify-between items-end mb-8 border-b border-gray-200 pb-6">
        <div>
           <span className="text-orange-500 font-bold text-xs tracking-widest uppercase mb-1 block">Gallery</span>
           <h2 className="text-3xl font-black text-slate-900">활동 갤러리</h2>
        </div>
        {(userRole === 'team' || userRole === 'admin') && (
           <button onClick={() => onUploadClick('gallery')} className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold hover:bg-orange-500 transition-colors shadow-lg flex items-center gap-2 text-sm"><ImageIcon size={16}/> 사진 올리기</button>
        )}
      </div>

      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {images.map(img => (
          <div key={img.id} onClick={() => setSelectedImg(img)} className="break-inside-avoid bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-zoom-in group relative border border-gray-100">
             <img src={img.image_url} alt={img.title} className="w-full h-auto object-cover"/>
             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 text-white">
                <h4 className="font-bold text-sm truncate">{img.title}</h4>
             </div>
          </div>
        ))}
      </div>
      {images.length === 0 && <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 text-slate-400 font-bold">아직 업로드된 사진이 없습니다.</div>}

      {/* 라이트박스 모달 */}
      {selectedImg && (
        <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in" onClick={() => setSelectedImg(null)}>
           <img src={selectedImg.image_url} className="max-w-full max-h-[85vh] rounded-xl shadow-2xl" onClick={e => e.stopPropagation()}/>
           <div className="absolute bottom-10 text-white text-center">
              <h3 className="text-xl font-bold mb-1">{selectedImg.title}</h3>
              <p className="text-sm opacity-80">{selectedImg.description}</p>
           </div>
           <button className="absolute top-5 right-5 text-white/50 hover:text-white"><X size={32}/></button>
        </div>
      )}
    </div>
  );
};

// --- [통합 업로드 모달] ---
const UniversalUploadModal = ({ isOpen, onClose, onSubmit, type, isUploading }) => {
  if (!isOpen) return null;
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '', event_date: '', description: '', vol: '', author: '', url: '' });

  const handleSubmit = (e) => { e.preventDefault(); onSubmit({ ...formData, file, type }); };

  return (
    <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in zoom-in-95">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 border border-gray-100 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-black mb-6 text-slate-900">
          {type === 'notice' && '📢 공지사항 작성'}
          {type === 'gallery' && '🖼️ 사진 업로드'}
          {type === 'issue' && '✨ 새 호수 발행'}
          {type === 'article' && '📝 자료 등록'}
        </h2>
        
        {isUploading ? (
           <div className="py-20 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin"/>
              <p className="font-bold text-slate-500">업로드 중입니다...</p>
           </div>
        ) : (
           <form onSubmit={handleSubmit} className="space-y-4">
              {/* 공통 제목 */}
              <div><label className="block text-xs font-bold text-gray-400 mb-1">제목</label><input required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:border-orange-400" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}/></div>

              {/* 타입별 필드 */}
              {type === 'notice' && (
                <>
                  <div><label className="block text-xs font-bold text-gray-400 mb-1">내용</label><textarea required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-400 h-32 resize-none" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})}/></div>
                  <div><label className="block text-xs font-bold text-gray-400 mb-1">행사일 (선택)</label><input type="date" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:border-orange-400" value={formData.event_date} onChange={e => setFormData({...formData, event_date: e.target.value})}/></div>
                </>
              )}

              {type === 'gallery' && (
                <>
                   <div><label className="block text-xs font-bold text-gray-400 mb-1">설명</label><input className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium outline-none focus:border-orange-400" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}/></div>
                   <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 text-center cursor-pointer relative">
                      <input type="file" accept="image/*" required onChange={e => setFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer"/>
                      <ImageIcon className="mx-auto text-orange-400 mb-2"/>
                      <p className="text-xs font-bold text-orange-600">{file ? file.name : '이미지 파일 선택'}</p>
                   </div>
                </>
              )}

              {(type === 'issue' || type === 'article') && (
                 // 기존 로직 유지 (간소화하여 표현)
                 <div className="p-4 bg-gray-50 rounded-xl text-center text-xs text-gray-400">기존 호수/자료 입력 폼 (이전 버전과 동일 로직 적용)</div>
              )}

              <div className="flex gap-3 pt-4">
                 <button type="button" onClick={onClose} className="flex-1 py-3 text-gray-500 hover:bg-gray-100 rounded-xl font-bold">취소</button>
                 <button type="submit" className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-orange-500 shadow-lg">완료</button>
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
  const [role, setRole] = useState('guest'); // guest, general, team, admin
  const [view, setView] = useState('home'); 
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadType, setUploadType] = useState('notice');
  const [isUploading, setIsUploading] = useState(false);

  // --- Auth Check ---
  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        setUser(session.user);
        const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        setRole(data?.role || 'general');
      } else {
        setUser(null); setRole('guest');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
       setUser(session.user);
       const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
       setRole(data?.role || 'general');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    alert("로그아웃 되었습니다.");
    setView('home');
  };

  // --- Upload Logic ---
  const handleUpload = async (data) => {
    if (!user) return;
    setIsUploading(true);
    try {
       if (data.type === 'notice') {
          await supabase.from('notices').insert([{
             title: data.title, content: data.content, event_date: data.event_date || null, 
             category: data.event_date ? 'event' : 'notice', author_id: user.id
          }]);
       } else if (data.type === 'gallery' && data.file) {
          const fileName = `${Date.now()}_${data.file.name}`;
          await supabase.storage.from('gallery').upload(fileName, data.file);
          const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(fileName);
          await supabase.from('gallery').insert([{
             title: data.title, description: data.description, image_url: publicUrl, author_id: user.id
          }]);
       }
       // Issue/Article 업로드 로직은 기존 코드와 동일하게 병합 필요 (지면상 생략했으나 통합 시 유지)
       alert("업로드 완료!");
       setIsUploadOpen(false);
       // Refresh data logic needed (here simplified)
       window.location.reload(); 
    } catch (e) { alert("업로드 실패: " + e.message); } 
    finally { setIsUploading(false); }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] font-sans text-slate-900 overflow-x-hidden selection:bg-orange-100 selection:text-orange-600 flex flex-col">
      {/* Navbar (PC) */}
      <nav className="sticky top-0 z-[60] bg-white/80 backdrop-blur-md border-b border-gray-200">
         <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
               <div className="w-8 h-8 bg-gradient-to-tr from-orange-400 to-orange-500 text-white flex items-center justify-center rounded-lg shadow-sm"><Star size={16} fill="currentColor"/></div>
               <span className="text-lg font-bold text-slate-900 tracking-tight">키즈 <span className="text-orange-500">인사이트</span></span>
            </div>
            <div className="flex items-center gap-4">
               {['home', 'news', 'notice', 'gallery'].map(v => (
                  <button key={v} onClick={() => setView(v)} className={`capitalize text-sm font-bold ${view === v ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>
                     {v === 'home' ? '홈' : v === 'news' ? '뉴스룸' : v === 'notice' ? '소식&일정' : '갤러리'}
                  </button>
               ))}
               <div className="w-px h-4 bg-gray-300 mx-2"/>
               {user ? (
                  <div className="flex items-center gap-2">
                     <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase text-white ${role === 'admin' ? 'bg-slate-900' : role === 'team' ? 'bg-blue-500' : 'bg-gray-400'}`}>{role}</span>
                     <button onClick={handleLogout} className="text-slate-400 hover:text-red-500"><LogOut size={16}/></button>
                  </div>
               ) : (
                  <button onClick={() => setIsAuthOpen(true)} className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-sm font-bold hover:bg-slate-800 transition-colors shadow-sm">로그인</button>
               )}
            </div>
         </div>
      </nav>

      <main className="flex-1">
         {view === 'home' && (
            <div className="animate-in fade-in duration-500 py-20 text-center max-w-2xl mx-auto px-4">
               <span className="text-orange-500 font-bold tracking-widest text-xs uppercase mb-4 block">The First Step of Education</span>
               <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 leading-tight">선생님의 성장을 돕는<br/>스마트 커뮤니티</h1>
               <p className="text-slate-500 text-lg mb-10">뉴스부터 일정 관리, 자료 공유까지.<br/>키즈 인사이트에서 모든 것을 한 번에 해결하세요.</p>
               <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setView('notice')} className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all text-left group">
                     <CalendarIcon className="w-10 h-10 text-blue-500 mb-4 group-hover:scale-110 transition-transform"/>
                     <h3 className="text-lg font-bold text-slate-900">소식 & 일정</h3>
                     <p className="text-sm text-slate-400 mt-1">이달의 주요 행사 확인하기</p>
                  </button>
                  <button onClick={() => setView('gallery')} className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all text-left group">
                     <ImageIcon className="w-10 h-10 text-orange-500 mb-4 group-hover:scale-110 transition-transform"/>
                     <h3 className="text-lg font-bold text-slate-900">활동 갤러리</h3>
                     <p className="text-sm text-slate-400 mt-1">우리 원의 추억 기록하기</p>
                  </button>
               </div>
            </div>
         )}
         {/* News, Notice, Gallery 뷰 렌더링 */}
         {/* NewsFeed 컴포넌트는 기존 코드 유지 (지면상 생략) */}
         {view === 'news' && <div className="py-20 text-center font-bold text-slate-400">뉴스룸 컴포넌트 (기존 코드 연동)</div>}
         {view === 'notice' && <NoticeBoard userRole={role} onWriteClick={(t) => { setUploadType(t); setIsUploadOpen(true); }}/>}
         {view === 'gallery' && <Gallery userRole={role} onUploadClick={(t) => { setUploadType(t); setIsUploadOpen(true); }}/>}
      </main>

      <div className="h-16 md:hidden"/>
      <BottomNav currentView={view} onViewChange={setView} onMenuClick={() => setIsAuthOpen(true)} />
      
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onLoginSuccess={() => setIsAuthOpen(false)}/>
      <UniversalUploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} type={uploadType} onSubmit={handleUpload} isUploading={isUploading}/>
    </div>
  );
};

export default function App() { return <MainApp />; }
