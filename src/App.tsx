import React, { useState, useEffect } from 'react';
import { 
  Book, ChevronRight, X, Newspaper, Calendar as CalendarIcon, 
  MapPin, RefreshCw, ArrowUpRight, Loader2, Home, Search, 
  Eye, Map as MapIcon, Phone, CheckCircle2, Sparkles, LayoutGrid,
  Compass, CloudSun, Wind, Sprout, Flower2, Heart, Rabbit, Plus,
  ArrowDown, ArrowUp
} from 'lucide-react';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

import UniversalUploadModal from './components/UniversalUploadModal';
import IssueCard from './components/IssueCard';
import NoticeBoard from './components/NoticeBoard';
import NewsFeed from './components/NewsFeed';
import CustomPDFViewer from './components/CustomPDFViewer';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ResourceMap from './components/ResourceMap';
import CareApply from './components/CareApply';
import FaqBoard from './components/FaqBoard';
import InquiryBoard from './components/InquiryBoard';
import CareAdmin from './components/CareAdmin';
import HomeFolder from './components/HomeFolder';

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

interface KRDSBadgeProps {
  variant?: 'primary' | 'success' | 'warning' | 'neutral';
  children: React.ReactNode;
  className?: string;
}

const KRDSBadge: React.FC<KRDSBadgeProps> = ({ variant = 'neutral', children, className = '' }) => {
  const styles = {
    primary: 'bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300 border border-sky-200/50 dark:border-sky-800',
    success: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800',
    warning: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800',
    neutral: 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-300 border border-gray-200/50 dark:border-slate-700',
  };
  return <span className={`inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-[11px] font-black tracking-wide ${styles[variant]} ${className}`}>{children}</span>;
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

const getValidSupabaseUrl = (url: string) => {
  if (!url || !supabaseUrl) return url;
  const marker = '/storage/v1/object/public/';
  if (url.includes(marker)) {
    const filePath = url.substring(url.indexOf(marker) + marker.length);
    const cleanBaseUrl = supabaseUrl.endsWith('/') ? supabaseUrl.slice(0, -1) : supabaseUrl;
    return `${cleanBaseUrl}${marker}${filePath}`; 
  }
  return url;
};

const parseNewsData = (rawTitle: string) => {
  if (!rawTitle) return { title: '제목 없음', publisher: '뉴스' };
  const parts = rawTitle.split(' - ');
  if (parts.length > 1) {
    const publisher = parts.pop()?.trim() || '뉴스';
    let title = parts.join(' - ').trim();
    title = title.replace(/\s*>\s*뉴스$/, '').replace(/\s*\|$/, '').trim();
    return { title, publisher };
  }
  return { title: rawTitle, publisher: '뉴스' };
};

const incrementViewCount = async (table: string, id: any, currentViews: number) => {
  if (!supabase) return;
  const sessionKey = `viewed_${table}_${id}`;
  if (sessionStorage.getItem(sessionKey)) return;
  try { 
    await supabase.from(table).update({ views: (currentViews || 0) + 1 }).eq('id', id); 
    sessionStorage.setItem(sessionKey, 'true');
  } catch (e) { console.error(e); }
};

const useHistoryState = (initialState: string): [string, (newState: string) => void] => {
  const [state, setState] = useState<string>(initialState);
  useEffect(() => {
    window.history.replaceState({ view: initialState }, '');
    const handlePopState = (event: PopStateEvent) => { if (event.state && event.state.view) setState(event.state.view); };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [initialState]);
  const setHistoryState = (newState: string) => {
    if (newState !== state) { 
      window.history.pushState({ view: newState }, '', `?view=${newState}`);
      setState(newState); 
    }
  };
  return [state, setHistoryState];
};

const loadPdfScript = (): Promise<any> => {
  return new Promise((resolve) => {
    if ((window as any).pdfjsLib) { resolve((window as any).pdfjsLib); return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => { (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; resolve((window as any).pdfjsLib); };
    document.head.appendChild(script);
  });
};

const extractPdfCover = async (fileOrBlob: File | Blob): Promise<Blob | null> => {
  return new Promise(async (resolve) => {
    try {
      await loadPdfScript();
      (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

      const fileReader = new FileReader();
      fileReader.onload = async function() {
        try {
          const typedarray = new Uint8Array(this.result as ArrayBuffer);
          const loadingTask = (window as any).pdfjsLib.getDocument({ data: typedarray, disableAutoFetch: true });
    
          const pdf = await loadingTask.promise;
          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: 0.6 });

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

          const isSpread = viewport.width > viewport.height * 1.2;
          let finalCanvas = canvas;
          if (isSpread) {
            const halfWidth = canvas.width / 2;
            const fullHeight = canvas.height;
            finalCanvas = document.createElement('canvas');
            finalCanvas.width = halfWidth;
            finalCanvas.height = fullHeight;
            finalCanvas.getContext('2d')?.drawImage(canvas, halfWidth, 0, halfWidth, fullHeight, 0, 0, halfWidth, fullHeight);
          }

          finalCanvas.toBlob((blob) => {
            resolve(blob);
          }, 'image/jpeg', 0.85);
        } catch(e) {
            console.error(e);
            resolve(null);
        }
      };
      fileReader.readAsArrayBuffer(fileOrBlob);
    } catch (error) {
      console.error("표지 추출 에러:", error);
      resolve(null);
    }
  });
};

// ✅ 실제 영역 데이터
const RESOURCE_TYPES = ['놀이·생활', '건강·안전', '창의·융합', '역사·문화', '자연·환경', '인문·독서'];

// 🎲 청첩장 팝업 랜덤 텍스트
const randomTexts = [
  "서로 다른 자리에서 자라온 유치원과 어린이집이 이제 전북 영유아의 행복이라는 한곳을 바라보며 걸어가려 합니다.",
  "더 나은 영유아 미래를 위해 유치원과 어린이집이 평생의 동반자가 되었습니다. 서로 아끼고 배려하며 함께 나아가겠습니다.",
  "참 좋은 두 교육·보육 공동체가 만났습니다. 곁에 있을 때 서로가 더 빛나는 파트너가 되어 전북의 아이들을 따뜻하게 안아주겠습니다.",
  "숲체험원부터 도서관까지, 우리 동네 모든 영유아 자원을 함께 나누며 알콩달콩 재미있게 살겠습니다. 저희의 새로운 시작을 응원해주세요."
];

const MainApp = () => {
  const [role, setRole] = useState<string>(() => typeof window !== 'undefined' ? sessionStorage.getItem('userRole') || 'guest' : 'guest');
  const [view, setView] = useHistoryState('home');
  const [issues, setIssues] = useState<any[]>([]);
  
  const [sortOption, setSortOption] = useState<string>('date_order');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');

  const [currentIssue, setCurrentIssue] = useState<any>(null);
  const [currentArticle, setCurrentArticle] = useState<any>(null);
  const [recentNotices, setRecentNotices] = useState<any[]>([]);
  const [recentNews, setRecentNews] = useState<any[]>([]);
  
  const [activeHomeTab, setActiveHomeTab] = useState<string>('news'); 

  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [uploadType, setUploadType] = useState<string>('notice');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isMigrating, setIsMigrating] = useState<boolean>(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState<boolean>(false);
  const [resources, setResources] = useState<any[]>([]);
  
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('전체');
  const [selectedType, setSelectedType] = useState<string>('전체');
  
  const [recentTags, setRecentTags] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('recentTags');
      if (saved) return JSON.parse(saved);
    }
    return ['전주시', '익산시', '군산시', '정읍시', '남원시'];
  });
  
  const jeonbukRegions = ['전주시', '익산시', '군산시', '정읍시', '남원시', '김제시', '완주군', '진안군', '무주군', '장수군', '임실군', '순창군', '고창군', '부안군'];
  
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      return savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // 🎊 청첩장 팝업 관련 State
  const [selectedRandomIndex, setSelectedRandomIndex] = useState<number>(() => {
    return Math.floor(Math.random() * randomTexts.length);
  });

  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const today = new Date().toISOString().split('T')[0];
      const lastHiddenDate = localStorage.getItem('welcomeModalHiddenDate');
      return lastHiddenDate !== today;
    }
    return true;
  });

  useEffect(() => {
    document.title = '함께누리웹진';
  }, []);

  useEffect(() => {
    if (isDarkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); } 
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  // 🎯 팝업 닫기 함수
  const handleCloseWelcomeModal = () => {
    setIsWelcomeModalOpen(false);
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('welcomeModalHiddenDate', today);
  };

  useEffect(() => {
    const fetchData = async () => {
      if(!supabase) return;
      const resIssues = await supabase.from('issues').select('*');
      if (resIssues.data) {
        const sortedByDate = resIssues.data.sort((a, b) => Number(b.vol || b.id || 0) - Number(a.vol || a.id || 0));
        setIssues(sortedByDate);
      }
      
      // ✅ 수정: 영유아체험기관 테이블 연결 + 필드 매핑
      const resResources = await supabase
        .from('영유아체험기관')
        .select('*')
        .not('기관시설', 'is', null);

      if (resResources.data) {
        const mapped = resResources.data.map((item: any) => ({
          id: item.id,
          name: item.기관시설,
          region: item.시군구,
          category: item.영역,
          address: item.주소,
          phone: item.연락처,
          lat: item.위도 ?? 35.8242238,
          lng: item.경도 ?? 127.1479532,
          program: item.체험프로그램,
          note: item.비고,
          holiday: item.휴무일,
        }));
        setResources(mapped);
      }
      
      const resNotices = await supabase.from('notices').select('*').order('created_at', { ascending: false }).limit(4);
      if(resNotices.data) setRecentNotices(resNotices.data);

      const resNews = await supabase.from('news').select('*').order('pub_date', { ascending: false }).limit(4);
      if(resNews.data) setRecentNews(resNews.data);
    };
    fetchData();
  }, []);

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

  const openArticleUploadForIssue = (issue: any) => {
     setCurrentIssue(issue);
     setUploadType('article');
     setIsUploadOpen(true);
  };

  const handleUpload = async (data: any) => {
    if (data.type === 'article' && data.file) {
      const maxSize = 50 * 1024 * 1024;
      if (data.file.size > maxSize) {
        alert("⚠️ 파일 크기가 너무 큽니다. 50MB 이하로 업로드해주세요.");
        return; 
      }
    }

    setIsUploading(true);
    try {
       if (data.type === 'notice') {
           const { error } = await supabase!.from('notices').insert([{ title: data.title, content: data.content, event_date: data.event_date || null, category: data.event_date ? 'event' : 'notice' }]);
           if (error) throw new Error(`공지 등록 실패: ${error.message}`);
       }
       else if (data.type === 'issue') {
           const { error } = await supabase!.from('issues').insert([{ vol: data.vol, title: data.title, description: data.description, date: new Date().toLocaleDateString(), cover_color: 'bg-teal-100', icon: '📘' }]);
           if (error) throw new Error(`호수 발행 실패: ${error.message}`);
       }
       else if (data.type === 'article' && currentIssue) { 
           let fileUrl = '';
           let coverUrl = currentIssue.cover_url || currentIssue.coverUrl || null; 

           if (data.file) { 
               const timestamp = Date.now();
               const fn = `${timestamp}.pdf`;
               
               const { error: uploadError } = await supabase!.storage.from('files').upload(fn, data.file);
               if (uploadError) throw new Error(`PDF 저장소 업로드 실패: ${uploadError.message}`);

               fileUrl = supabase!.storage.from('files').getPublicUrl(fn).data.publicUrl; 

               const coverBlob = await extractPdfCover(data.file);
               if (coverBlob) {
                   const coverFn = `cover_${timestamp}.jpg`;
                   const { error: coverError } = await supabase!.storage.from('files').upload(coverFn, coverBlob, { contentType: 'image/jpeg', upsert: true });
                   if (coverError) throw new Error(`표지 이미지 업로드 실패: ${coverError.message}`);
                   
                   coverUrl = supabase!.storage.from('files').getPublicUrl(coverFn).data.publicUrl;
               }
           } 

           const updatedArticles = [{ id: Date.now(), title: currentIssue.title, fileUrl, views: 0 }];
           const { error: dbError } = await supabase!.from('issues').update({ articles: updatedArticles, cover_url: coverUrl }).eq('id', currentIssue.id);
           if (dbError) throw new Error(`DB 업데이트 실패: ${dbError.message}`);

           const updatedIssue = {...currentIssue, articles: updatedArticles, cover_url: coverUrl};
           setCurrentIssue(updatedIssue);
           setIssues(prev => prev.map(i => i.id === currentIssue.id ? updatedIssue : i));
       }
       
       alert("등록 완료되었습니다!"); 
       setIsUploadOpen(false);
       if (data.type !== 'article') window.location.reload();
       
    } catch (e: any) { 
       console.error("업로드 에러 상세:", e);
       alert("오류: " + e.message); 
    } finally { 
       setIsUploading(false); 
    }
  };

  // ✅ 추가: 주소 → 좌표 변환 함수
  const handleGeocodeAll = async () => {
    if (!confirm("429개 주소를 카카오 API로 좌표 변환합니다. 시간이 걸릴 수 있어요.")) return;
    setIsMigrating(true);

    try {
      const kakaoKey = import.meta.env.VITE_KAKAO_REST_API_KEY || '';
      const { data: places } = await supabase!
        .from('영유아체험기관')
        .select('id, 주소, 위도, 경도')
        .not('주소', 'is', null);

      if (!places) { alert("데이터 없음"); return; }

      const targets = places.filter((p: any) => !p.위도 || !p.경도);
      let successCount = 0;

      for (const place of targets) {
        try {
          const res = await fetch(
            `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(place.주소)}`,
            { headers: { Authorization: `KakaoAK ${kakaoKey}` } }
          );
          const json = await res.json();
          const doc = json.documents?.[0];

          if (doc) {
            await supabase!
              .from('영유아체험기관')
              .update({ 위도: parseFloat(doc.y), 경도: parseFloat(doc.x) })
              .eq('id', place.id);
            successCount++;
          }

          await new Promise(r => setTimeout(r, 100));
        } catch (e) {
          console.error(`변환 실패: ${place.주소}`, e);
        }
      }

      alert(`✅ 완료! ${successCount}/${targets.length}개 좌표 변환 성공`);
      window.location.reload();

    } catch (e: any) {
      alert("오류: " + e.message);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleFixDatabaseUrls = async () => {
    if (!confirm("DB의 모든 예전 주소를 새 주소로 영구 변환하시겠습니까?")) return;
    setIsMigrating(true);

    try {
      const { data: allIssues } = await supabase!.from('issues').select('*');
      let updatedCount = 0;
      if (allIssues) {
        for (const issue of allIssues) {
          let isModified = false;
          let newCoverUrl = issue.cover_url || issue.coverUrl;
          let newArticles = issue.articles ? [...issue.articles] : [];
          if (newCoverUrl && newCoverUrl.includes('/storage/v1/object/public/')) {
            const expectedUrl = getValidSupabaseUrl(newCoverUrl);
            if (newCoverUrl !== expectedUrl) {
              newCoverUrl = expectedUrl;
              isModified = true;
            }
          }

          if (newArticles.length > 0) {
            newArticles = newArticles.map(art => {
              const oldUrl = art.fileUrl || art.file_url;
              if (oldUrl && oldUrl.includes('/storage/v1/object/public/')) {
                const expectedUrl = getValidSupabaseUrl(oldUrl);
                if (oldUrl !== expectedUrl) {
                  isModified = true;
                  return { ...art, fileUrl: expectedUrl, file_url: expectedUrl };
                }
              }
              return art;
            });
          }

          if (isModified) {
            await supabase!.from('issues').update({
              cover_url: newCoverUrl,
              articles: newArticles
            }).eq('id', issue.id);
            updatedCount++;
          }
        }
      }

      alert(`🎉 총 ${updatedCount}개의 게시물 DB 주소가 영구적으로 수정되었습니다!`);
      window.location.reload();
    } catch (error) {
      console.error("DB 업데이트 실패:", error);
      alert("업데이트 중 오류가 발생했습니다.");
    } finally {
      setIsMigrating(false);
    }
  };

  const handleRegenerateCover = async (issue: any) => {
    if (!issue.articles || issue.articles.length === 0) {
      alert("첨부된 PDF 파일이 없습니다.");
      return;
    }
    
    if (!confirm(`'Vol.${issue.vol}'호의 표지를 새로 추출하시겠습니까?\n(해당 PDF 1개 분량의 다운로드 트래픽이 발생합니다.)`)) return;
    setIsMigrating(true);
    try {
      const fileUrl = issue.articles[0].fileUrl || issue.articles[0].file_url;
      const validUrl = getValidSupabaseUrl(fileUrl);
      const response = await fetch(validUrl);
      const blob = await response.blob();
      const coverBlob = await extractPdfCover(blob);
      if (coverBlob) {
        const timestamp = Date.now();
        const coverFn = `cover_regen_${issue.id}_${timestamp}.jpg`;
        await supabase!.storage.from('files').upload(coverFn, coverBlob, { contentType: 'image/jpeg', upsert: true });
        const newCoverUrl = supabase!.storage.from('files').getPublicUrl(coverFn).data.publicUrl;

        await supabase!.from('issues').update({ cover_url: newCoverUrl }).eq('id', issue.id);
        setIssues(prev => prev.map(i => i.id === issue.id ? { ...i, cover_url: newCoverUrl } : i));
        alert("표지가 성공적으로 재생성되었습니다!");
      } else {
        alert("표지 추출에 실패했습니다. (CORS 또는 PDF 형식 오류)");
      }
    } catch (error: any) {
      console.error(error);
      alert("오류가 발생했습니다: " + error.message);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleDeleteIssue = async (issue: any) => {
    if (confirm(`'Vol.${issue.vol}'호를 삭제하시겠습니까? 관련 PDF 및 표지 파일도 모두 삭제됩니다.`)) {
      try {
        const filesToRemove: string[] = [];
        if (issue.articles && issue.articles.length > 0) {
          issue.articles.forEach((art: any) => {
            const fileUrl = art.fileUrl || art.file_url;
            if (fileUrl) filesToRemove.push(fileUrl.split('/').pop());
          });
        }
        
        const coverUrl = issue.cover_url || issue.coverUrl;
        if (coverUrl) {
          filesToRemove.push(coverUrl.split('/').pop());
        }

        if (filesToRemove.length > 0) {
          await supabase!.storage.from('files').remove(filesToRemove);
        }

        await supabase!.from('issues').delete().eq('id', issue.id);
        
        alert('파일과 게시물이 모두 안전하게 삭제되었습니다.');
        window.location.reload();
      } catch (e) {
        console.error("삭제 중 오류:", e);
        alert("삭제 처리에 실패했습니다.");
      }
    }
  };
  
  const handleEditIssue = async (issue: any) => {
    const newTitle = prompt(`'${issue.vol}호'의 새로운 제목을 입력하세요:`, issue.title);
    if (newTitle && newTitle.trim() !== "" && newTitle !== issue.title) {
        try {
            await supabase!.from('issues').update({ title: newTitle.trim() }).eq('id', issue.id);
            setIssues(prev => prev.map(i => i.id === issue.id ? { ...i, title: newTitle.trim() } : i));
        } catch(e: any) {
            alert("제목 수정 중 오류가 발생했습니다: " + e.message);
        }
    }
  };

  const handleIssueClick = (issue: any) => { 
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

  return (
    <>
    <style>{globalStyles}</style>
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-100 transition-colors">
       
       {/* 🎊 청첩장 스타일 팝업 시작 */}
       {isWelcomeModalOpen && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
           {/* 배경 어두움 */}
           <div 
             className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
             onClick={handleCloseWelcomeModal}
           />
           
           {/* 팝업 창 - 청첍장 스타일 */}
           <div className="relative bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 rounded-none shadow-2xl border-2 border-amber-200 dark:border-amber-900/50 max-w-2xl w-full p-12 md:p-16 animate-in fade-in zoom-in max-h-[90vh] overflow-y-auto"
                style={{
                  boxShadow: '0 20px 60px rgba(120, 53, 15, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                }}>
             
             {/* 상단 장식 */}
             <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent dark:via-amber-700"></div>
             <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-amber-400 dark:text-amber-600 opacity-60">
               ✦ ✧ ✦
             </div>

             {/* 닫기 버튼 */}
             <button
               onClick={handleCloseWelcomeModal}
               className="absolute top-8 right-8 p-2 rounded-full bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors text-amber-700 dark:text-amber-400 z-10"
             >
               <X size={24} />
             </button>

             {/* 제목 - 청첍장 스타일 */}
             <div className="text-center mb-10 mt-6">
               <p className="text-amber-700 dark:text-amber-400 font-semibold tracking-widest text-sm mb-4">
                 함께누리웹진에서 초대합니다
               </p>
               <h2 className="text-4xl md:text-5xl font-serif text-amber-900 dark:text-amber-100 mb-4 leading-relaxed tracking-tight">
                 교육청의 유치원 ♡ 지자체의 어린이집
               </h2>
               <div className="w-12 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent dark:via-amber-600 mx-auto mb-4"></div>
               <p className="text-amber-700 dark:text-amber-300 font-light italic text-sm">
                 유보통합 서약 안내서
               </p>
             </div>

             {/* 🎯 랜덤 텍스트 - 청첍장 스타일 */}
             <div className="my-10 px-8 py-8 bg-white/50 dark:bg-slate-900/50 rounded-sm border border-amber-200 dark:border-amber-900/30"
                  style={{
                    borderLeft: '4px solid rgb(180, 83, 9)'
                  }}>
               <p className="text-lg font-serif text-amber-950 dark:text-amber-100 leading-relaxed text-center">
                 "{randomTexts[selectedRandomIndex]}"
               </p>
             </div>

             {/* 기본 서약문 */}
             <div className="space-y-6 mb-10 text-amber-950 dark:text-amber-100 font-serif text-base leading-relaxed">
               <div className="text-center text-amber-700 dark:text-amber-400 italic font-light mb-8">
                 <p className="mb-3">본 서약은 전북특별자치도 내 산재한 영유아 체험 자원을</p>
                 <p className="mb-3">투명하게 발굴하고, 아이들의 보편적 교육 기회를</p>
                 <p className="mb-3">확대하기 위한 공익적 목적으로 준비했습니다.</p>
                 <p>안정성과 교육 가치라는 기준을 바탕으로 시작된</p>
                 <p>이 동행이, 앞으로 도내 모든 우수한 체험처들과</p>
                 <p>어떻게 상생하며 발전해 나갈지 그 다짐을</p>
                 <p>담은 서약서를 낭독하겠습니다.</p>
               </div>

               <div className="space-y-5 bg-amber-50/50 dark:bg-amber-900/10 p-8 rounded-sm border border-amber-100 dark:border-amber-900/30">
                 <p className="leading-relaxed">
                   <span className="font-bold text-amber-900 dark:text-amber-200 text-lg">하나,</span> 우리는 <span className="font-semibold text-amber-900 dark:text-amber-100">'아이들의 안전과 교육적 가치'</span>를 최우선 기준으로 삼겠습니다.
                   설립 주체나 운영 형태를 떠나, 오직 우리 아이들이 안심하고 배울 수 있는 우수한 프로그램과 공간인지를 확인하고 투명하게 공유하겠습니다.
                 </p>

                 <p className="leading-relaxed">
                   <span className="font-bold text-amber-900 dark:text-amber-200 text-lg">하나,</span> 우리는 <span className="font-semibold text-amber-900 dark:text-amber-100">'문이 활짝 열린 지도'</span>를 함께 만들어 가겠습니다.
                   이번 첫걸음에 마처 담기지 못한 도내의 숨은 자원들을 발굴하기 위해 상시 소통 창구를 열어둘 것이며, 기준을 충족하는 우수한 체험처라면 언제든 참여하고 함께할 수 있도록 지속해서 보완‧확충해 나갈 것을 약속합니다.
                 </p>

                 <p className="leading-relaxed">
                   <span className="font-bold text-amber-900 dark:text-amber-200 text-lg">하나,</span> 우리는 아이들의 행복한 성장을 위해 끝까지 함께 나아가겠습니다.
                   이 자산이 현장의 교직원과 보호자들에게 실질적인 도움이 되도록 끊임없이 가꾸어 나가며, 상호 신뢰와 배려를 바탕으로 전북형 유보통합의 모범을 만들어 가겠습니다.
                 </p>
               </div>

               <p className="text-xs text-amber-700 dark:text-amber-400 pt-4 text-center font-light">
                 ※ 본 안내 지도는 공익적 정보 제공 목적의 1차 발굴 자료이며,<br/>향후 기준 요건을 갖춘 도내 체험처들을 지속적으로 추가 보완할 예정입니다.
               </p>
             </div>

             {/* 하단 장식 */}
             <div className="text-center my-8 text-amber-300 dark:text-amber-700 opacity-40">
               ✦ ✧ ✦
             </div>

             {/* 버튼들 */}
             <div className="flex gap-3 mt-10">
               <button
                 onClick={handleCloseWelcomeModal}
                 className="flex-1 py-3 px-4 bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-semibold rounded-sm transition-colors border border-amber-300 dark:border-amber-800"
               >
                 닫기
               </button>
               <button
                 onClick={() => {
                   handleCloseWelcomeModal();
                   setView('care_apply');
                 }}
                 className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold rounded-sm transition-all shadow-lg hover:shadow-xl dark:from-amber-700 dark:to-amber-800 dark:hover:from-amber-600 dark:hover:to-amber-700"
               >
                 돌봄 신청 바로가기
               </button>
             </div>

             {/* 오늘 하루 안 보기 */}
             <button
               onClick={handleCloseWelcomeModal}
               className="w-full mt-6 py-2 text-amber-700 dark:text-amber-400 font-light text-sm hover:text-amber-900 dark:hover:text-amber-300 transition-colors"
             >
               오늘 하루 안 보기
             </button>

             {/* 하단 장식 라인 */}
             <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent dark:via-amber-700"></div>
           </div>
         </div>
       )}
       {/* 🎊 청첍장 스타일 팝업 끝 */}
       
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
                   { id: 'care_apply', icon: <MapIcon size={24} className="text-sky-500 dark:text-sky-400" />, label: '거점형·연계형 돌봄 신청' },
                   { id: 'issue_list', icon: <Book size={24} className="text-teal-500 dark:text-teal-400"/>, label: '자료실' },
                   { id: 'notice', icon: <CalendarIcon size={24} className="text-amber-500 dark:text-amber-400"/>, label: '소식' },
                   { id: 'news', icon: <Newspaper size={24} className="text-rose-500 dark:text-rose-400"/>, label: '뉴스' },
                   { id: 'faq', icon: <Sparkles size={24} className="text-emerald-500 dark:text-emerald-400"/>, label: 'FAQ' },
                   { id: 'inquiry', icon: <Heart size={24} className="text-indigo-500 dark:text-indigo-400"/>, label: '문의하기' },
                   { id: 'care_admin', icon: <Eye size={24} className="text-slate-500 dark:text-slate-400"/>, label: '기관·관리자 로그인' }
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
               <section className="relative w-full py-10 md:py-14 bg-gradient-to-br from-[#e0f2fe] via-[#ecfdf5] to-[#f0f9ff] dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 px-4 transition-colors">
                 <HomeFolder
                   setView={setView}
                   role={role}
                   resourceMapProps={{
                     resources,
                     searchKeyword, setSearchKeyword,
                     selectedRegion, setSelectedRegion,
                     selectedType, setSelectedType,
                   }}
                 />
               </section>

               <section className="max-w-7xl mx-auto px-4 pb-28">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                   
                   <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-6 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.04)] border border-slate-100 dark:border-slate-700 relative overflow-hidden flex flex-col h-full min-h-[380px]">
                      <div className="absolute top-10 right-10 text-sky-100 dark:text-sky-900/30 opacity-60 z-0"><Flower2 size={64}/></div>
                      <div className="absolute bottom-10 left-10 text-emerald-100 dark:text-emerald-900/30 opacity-60 z-0 animate-pulse"><Sprout size={64}/></div>

                      <div className="flex justify-between items-center mb-6 md:mb-8 border-b border-slate-800 dark:border-slate-600 pb-4 md:pb-6 relative z-10 shrink-0">
                         <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 dark:text-white flex items-center gap-3 md:gap-4 tracking-tight">최신 자료실 <Flower2 className="text-sky-500 dark:text-sky-400 w-7 h-7 md:w-9 md:h-9" strokeWidth={2}/></h3>
                         <button onClick={() => setView('issue_list')} className="text-sm md:text-base font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 flex items-center gap-1 md:gap-2 group">더보기 <ChevronRight size={20} className="text-teal-400 group-hover:translate-x-1.5 transition-transform"/></button>
                      </div>
                      <div className="grid grid-cols-2 gap-4 md:gap-8 pt-2 relative z-10 flex-1">
                        {issues.slice(0, 2).map(issue => (
                           <IssueCard key={issue.id} issue={issue} onClick={handleIssueClick} isAdmin={role === 'admin'} onDelete={handleDeleteIssue} onAddArticle={openArticleUploadForIssue} onEdit={handleEditIssue} onRegenerateCover={handleRegenerateCover}/>
                        ))}
                      </div>
                   </div>

                   <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-6 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.04)] border border-slate-100 dark:border-slate-700 relative overflow-hidden flex flex-col min-h-[380px]">
                      <div className="absolute -top-4 -left-4 text-indigo-100 dark:text-indigo-900/30 opacity-60 z-0"><Rabbit size={80} strokeWidth={1}/></div>

                      <div className="flex justify-between items-center mb-6 md:mb-8 border-b border-slate-800 dark:border-slate-600 pb-4 md:pb-6 relative z-10">
                         <div className="flex gap-2 p-1.5 bg-slate-50 dark:bg-slate-900 rounded-full border border-slate-100 dark:border-slate-700 shadow-inner">
                            <button onClick={() => setActiveHomeTab('notice')} className={`px-4 sm:px-5 md:px-7 py-2 md:py-2.5 rounded-full text-sm sm:text-base md:text-lg font-black transition-all ${activeHomeTab === 'notice' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'}`}>최근 소식</button>
                            <button onClick={() => setActiveHomeTab('news')} className={`px-4 sm:px-5 md:px-7 py-2 md:py-2.5 rounded-full text-sm sm:text-base md:text-lg font-black transition-all ${activeHomeTab === 'news' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'}`}>최근 뉴스</button>
                         </div>
                         <button onClick={() => setView(activeHomeTab === 'notice' ? 'notice' : 'news')} className="text-sm md:text-base font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 group shrink-0">더보기 <ChevronRight size={18} className="text-indigo-400 group-hover:translate-x-1.5 transition-transform"/></button>
                      </div>

                      <div className="flex flex-col relative z-10 pl-1 md:pl-2">
                        {activeHomeTab === 'notice' && recentNotices.map(n => (
                           <div key={n.id} onClick={() => {setView('notice');}} className="py-4 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer flex items-center justify-between group px-2">
                              <div className="flex items-center gap-3 md:gap-5 w-full">
                                 <span className={`text-[11px] md:text-[13px] font-black px-3 md:px-4 py-1.5 rounded-full border shrink-0 ${n.category === 'event' ? 'bg-amber-100 text-amber-600 border-amber-200/50 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800' : 'bg-gray-100 text-gray-500 border-gray-200/50 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'}`}>{n.category === 'event' ? '행사' : '공지'}</span>
                                 <span className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-1 text-base md:text-lg flex-1 tracking-tight">{n.title}</span>
                                 <span className="text-xs md:text-sm font-bold text-slate-400 dark:text-slate-500 hidden sm:block shrink-0">{new Date(n.created_at).toLocaleDateString()}</span>
                              </div>
                           </div>
                        ))}
                        {activeHomeTab === 'news' && recentNews.map(n => {
                           const { title: cleanTitle } = parseNewsData(n.title);
                           return (
                             <div key={n.id} onClick={() => { if (n.link) window.open(n.link, '_blank'); }} className="py-4 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer flex items-center justify-between group px-2">
                                <div className="flex items-center gap-3 md:gap-5 w-full">
                                   <span className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-1 text-base md:text-lg flex-1 tracking-tight pl-1 md:pl-2">{cleanTitle}</span>
                                   <span className="text-xs md:text-sm font-bold text-slate-400 dark:text-slate-500 hidden sm:block shrink-0">{new Date(n.pub_date).toLocaleDateString()}</span>
                                </div>
                             </div>
                           );
                        })}
                      </div>
                   </div>

                 </div>
               </section>
            </div>
          )}

          {view === 'resource_map' && (
             <ResourceMap 
                resources={resources} 
                searchKeyword={searchKeyword} 
                setSearchKeyword={setSearchKeyword} 
                selectedRegion={selectedRegion} 
                setSelectedRegion={setSelectedRegion} 
                selectedType={selectedType} 
                setSelectedType={setSelectedType} 
             />
          )}

          {view === 'news' && <NewsFeed isAdmin={role === 'admin'} />}
          {view === 'care_apply' && <CareApply />}
          {view === 'faq' && <FaqBoard />}
          {view === 'inquiry' && <InquiryBoard />}
          {view === 'care_admin' && <CareAdmin />}
          {view === 'notice' && <NoticeBoard userRole={role} onWriteClick={(t: string) => { setUploadType(t); setIsUploadOpen(true);}}/>}
          
          {view === 'issue_list' && (
            <div className="pt-16 max-w-7xl mx-auto px-4 animate-in fade-in mb-28">
              <div className="flex items-center justify-between mb-12 pb-8 border-b border-slate-800 dark:border-slate-700 relative overflow-hidden px-10">
                <div className="absolute top-4 left-4 text-teal-100 dark:text-teal-900/30 opacity-60 z-0"><Book size={48} className="text-teal-200 dark:text-teal-800"/></div>
                <h2 className="text-3xl md:text-4xl font-black flex items-center gap-4 text-slate-800 dark:text-white tracking-tight relative z-10">자료실 <Book className="text-teal-500 dark:text-teal-400" size={36}/></h2>
                
                {role === 'admin' && (
                  <div className="flex gap-2 relative z-10">
                    {/* ✅ 추가: 주소 → 좌표 변환 버튼 */}
                    <button onClick={handleGeocodeAll} disabled={isMigrating} className="bg-emerald-500 text-white px-5 py-3.5 rounded-2xl font-black shadow-sm flex items-center gap-2 hover:bg-emerald-600 transition-colors disabled:opacity-50">
                      {isMigrating ? <Loader2 size={20} className="animate-spin" /> : <MapPin size={20} />}
                      <span className="hidden sm:inline">주소 → 좌표 변환</span>
                    </button>
                    <button onClick={handleFixDatabaseUrls} disabled={isMigrating} className="bg-rose-500 text-white px-5 py-3.5 rounded-2xl font-black shadow-sm flex items-center gap-2 hover:bg-rose-600 transition-colors disabled:opacity-50">
                      {isMigrating ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} />}
                      <span className="hidden sm:inline">DB 주소 영구 변환</span>
                    </button>
                    <button onClick={() => { setUploadType('issue'); setIsUploadOpen(true); }} className="bg-teal-500 dark:bg-teal-600 text-white px-7 py-3.5 rounded-2xl font-black shadow-md flex items-center gap-2 hover:bg-teal-600 dark:hover:bg-teal-500 transition-colors">
                      <Plus size={20}/> 호수 발행
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end mb-6 gap-2 px-2">
                <select 
                  value={sortOption} 
                  onChange={(e) => setSortOption(e.target.value)}
                  className="h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <option value="date_order">날짜 순</option>
                  <option value="hit_order">조회 순</option>
                  <option value="thumbup_order">추천 순</option>
                </select>
                
                <button 
                  onClick={() => setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc')}
                  className="h-11 px-3 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm"
                  title="오름차순/내림차순 변경"
                >
                  {sortDirection === 'desc' ? <ArrowDown size={18} /> : <ArrowUp size={18} />}
                </button>
              </div>
        
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8">
                {[...issues].sort((a, b) => {
                  let valA = 0, valB = 0;
                  if (sortOption === 'date_order') {
                    valA = Number(a.vol || a.id || 0); 
                    valB = Number(b.vol || b.id || 0);
                  } else if (sortOption === 'hit_order') {
                    valA = Number(a.views || 0);
                    valB = Number(b.views || 0);
                  } else if (sortOption === 'thumbup_order') {
                    valA = Number(a.likes || 0);
                    valB = Number(b.likes || 0);
                  }
                  return sortDirection === 'desc' ? valB - valA : valA - valB;
                }).map(issue => (
                  <IssueCard key={issue.id} issue={issue} onClick={handleIssueClick} isAdmin={role === 'admin'} onDelete={handleDeleteIssue} onAddArticle={openArticleUploadForIssue} onEdit={handleEditIssue} onRegenerateCover={handleRegenerateCover}/>
                ))}
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
