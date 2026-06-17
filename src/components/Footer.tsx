import React, { useState, useEffect } from 'react';
import { Link as LinkIcon, Check } from 'lucide-react';

// 💡 공유에 필요한 카카오, 밴드 SVG 아이콘 데이터를 모듈 내부로 가져옵니다.
const imgKakao = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23FEE500"/><path d="M50 25c-17.9 0-32.5 11.4-32.5 25.4 0 9.2 6.1 17.3 15.3 21.8l-3.9 14.3c-.3 1 1.1 1.7 1.9 1.1l16.7-11.4c.8.1 1.7.1 2.5.1 17.9 0 32.5-11.4 32.5-25.4S67.9 25 50 25z" fill="%23000000"/></svg>';
const imgBand = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%2300C300"/><path d="M28 30h12v40H28zM60 30h12v40H60zM40 30l20 25v15L40 45z" fill="%23FFFFFF"/></svg>';

const SocialShare: React.FC = () => {
  const [isKakaoReady, setIsKakaoReady] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const rawUrl = window.location.href;
  const currentUrlEncoded = encodeURIComponent(rawUrl);
  
  const shareTitle = "함께누리웹진";
  const shareDesc = "우리 동네 유보통합 자원과 자료를 확인하세요.";
  const combinedTextEncoded = encodeURIComponent(`[${shareTitle}]\n${shareDesc}\n\n🔗 ${rawUrl}`);

  const icons = { kakao: imgKakao, band: imgBand };

  useEffect(() => {
    if ((window as any).Kakao && (window as any).Kakao.isInitialized()) {
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
        if ((window as any).Kakao && !(window as any).Kakao.isInitialized()) {
          // 💡 하드코딩된 예전 키를 완벽히 덜어내고, 안전하게 환경 변수만 바라보도록 수정했습니다.
          const appKey = import.meta.env.VITE_KAKAO_JS_KEY || '';
          if (appKey) {
            (window as any).Kakao.init(appKey);
            setIsKakaoReady(true);
          } else {
            console.warn("⚠️ 카카오 JS 앱 키(VITE_KAKAO_JS_KEY)가 설정되지 않았습니다.");
          }
        }
      };
      document.head.appendChild(script);
    } else if ((window as any).Kakao) {
       setIsKakaoReady(true);
    }
  }, []);

  const shareKakao = () => {
    if (!isKakaoReady || !(window as any).Kakao) {
      alert("⚠️ 카카오톡 공유 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    (window as any).Kakao.Share.sendDefault({
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
         <button onClick={handleCopyLink} className={`${btnClass} bg-slate-50 dark:bg-slate-700`} title="リンク 복사하기">
           <LinkIcon className="w-6 h-6 text-slate-600 dark:text-slate-300 group-hover:scale-110 transition-transform" />
         </button>
       </div>

       <div className={`absolute -top-10 bg-slate-800 dark:bg-emerald-600 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 transition-all duration-300 z-20 ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
         <Check size={16} className="text-emerald-400 dark:text-white" />
         링크가 복사되었습니다
       </div>
    </div>
  );
};

// 💡 부모(App)로부터 전달받는 비밀번호 해제 콜백 함수 타입을 정의합니다.
interface FooterProps {
  onSecretAdminUnlock: () => void;
}

const Footer: React.FC<FooterProps> = ({ onSecretAdminUnlock }) => {
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

export default Footer;
