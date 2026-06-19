import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Phone, X, CheckCircle2, Compass, Loader2, Rabbit, RefreshCw, Navigation, RotateCcw, ExternalLink, BookOpen } from 'lucide-react';
// 💡 싱글톤으로 만들어둔 supabase 인스턴스를 불러옵니다.
import { supabase } from '../lib/supabase';

const KRDSBadge: React.FC<{ variant?: 'primary' | 'success' | 'warning' | 'neutral', children: React.ReactNode, className?: string }> = ({ variant = 'neutral', children, className }) => {
  const styles = {
    primary: 'bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300 border border-sky-200/50 dark:border-sky-800',
    success: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800',
    warning: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800',
    neutral: 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-300 border border-gray-200/50 dark:border-slate-700',
  };
  return <span className={`inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-[11px] font-black tracking-wide ${styles[variant]} ${className || ''}`}>{children}</span>;
};

const useCustomKakaoLoader = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if ((window as any).kakao && (window as any).kakao.maps) { setLoading(false); return; }
    const scriptId = 'kakao-map-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      const apiKey = import.meta.env.VITE_KAKAO_MAP_API_KEY || '';
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services,clusterer&autoload=false`;
      script.async = true;
      document.head.appendChild(script);
    }

    const handleLoad = () => (window as any).kakao.maps.load(() => setLoading(false));
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

interface ResourceMapProps {
  searchKeyword: string;
  setSearchKeyword: (val: string) => void;
  selectedRegion: string;
  setSelectedRegion: (val: string) => void;
  selectedType: string;
  setSelectedType: (val: string) => void;
  role: string; 
}

const ResourceMap: React.FC<ResourceMapProps> = ({ 
  searchKeyword, setSearchKeyword, 
  selectedRegion, setSelectedRegion, 
  selectedType, setSelectedType,
  role
}) => {
  const [resources, setResources] = useState<any[]>([]);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [isMigrating, setIsMigrating] = useState(false);

  // 💡 프로그램 내용 모달
  const [programModalOpen, setProgramModalOpen] = useState(false);

  // 💡 길찾기 상태: 탐색 중 여부, 에러 메시지, 결과(거리/소요시간)
  const [routeState, setRouteState] = useState<{
    loading: boolean;
    error: string | null;
    distance: number | null; // meters
    duration: number | null; // seconds
  }>({ loading: false, error: null, distance: null, duration: null });
  const routePolylineRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  // 💡 카카오맵 앱 딥링크용: 경로 찾기 성공 시 현재 위치 저장
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const [mapLoading, mapError] = useCustomKakaoLoader();
  const mapContainerRefStandalone = useRef<HTMLDivElement>(null);

  const jeonbukRegions = ['전주시', '익산시', '군산시', '정읍시', '남원시', '김제시', '완주군', '진안군', '무주군', '장수군', '임실군', '순창군', '고창군', '부안군'];
  const RESOURCE_TYPES = ['놀이·생활', '건강·안전', '창의·융합', '역사·문화', '자연·환경', '인문·독서'];

  useEffect(() => {
    const fetchResources = async () => {
      const { data } = await supabase
        .from('영유아체험기관')
        .select('*')
        .not('기관시설', 'is', null);

      if (data) {
        const mapped = data.map((item: any) => ({
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
    };
    fetchResources();
  }, []);

  const handleGeocodeAll = async () => {
    if (!confirm("주소를 좌표로 변환합니다. 약 1~2분 걸릴 수 있어요.")) return;
    setIsMigrating(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

      const res = await fetch(`${supabaseUrl}/functions/v1/geocode-addresses`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }

      const result = await res.json();
      alert(`✅ 완료! ${result.success}/${result.total}개 좌표 변환 성공`);
      window.location.reload();
    } catch (e: any) {
      alert("오류: " + e.message);
    } finally {
      setIsMigrating(false);
    }
  };

  const filteredResources = resources.filter(res => {
    const matchRegion = selectedRegion === '전체' || res.region === selectedRegion;
    const matchType = selectedType === '전체' || res.category === selectedType;
    const matchKeyword = res.name.includes(searchKeyword) || res.address.includes(searchKeyword);
    return matchRegion && matchType && matchKeyword;
  });

  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // 💡 최적화 1단계: 지도는 컴포넌트가 켜질 때 딱 1번만 그립니다. (DOM 파괴 방지)
  useEffect(() => {
    if (!mapLoading && !mapError && mapContainerRefStandalone.current && !mapInstance.current) {
        if (!(window as any).kakao || !(window as any).kakao.maps) return;
        const centerPos = new (window as any).kakao.maps.LatLng(35.8242238, 127.1479532);
        mapInstance.current = new (window as any).kakao.maps.Map(mapContainerRefStandalone.current, { center: centerPos, level: 10 });
    }
  }, [mapLoading, mapError]);

  // 💡 길찾기: 선택된 기관이 바뀌거나 팝업이 닫히면 기존 경로선/현위치 마커를 정리합니다.
  useEffect(() => {
    setRouteState({ loading: false, error: null, distance: null, duration: null });
    setUserLocation(null);
    if (routePolylineRef.current) { routePolylineRef.current.setMap(null); routePolylineRef.current = null; }
    if (userMarkerRef.current) { userMarkerRef.current.setMap(null); userMarkerRef.current = null; }
  }, [selectedResource?.id]);

  // 💡 카카오맵 위에 경로선(Polyline) + 현재 위치 마커를 그리고, 두 지점이 모두 보이도록 화면을 맞춥니다.
  const drawRoute = (userLat: number, userLng: number, path: { lat: number; lng: number }[]) => {
    const kakao = (window as any).kakao;
    if (!kakao || !mapInstance.current || path.length === 0) return;

    if (routePolylineRef.current) routePolylineRef.current.setMap(null);
    if (userMarkerRef.current) userMarkerRef.current.setMap(null);

    const linePath = path.map(p => new kakao.maps.LatLng(p.lat, p.lng));

    routePolylineRef.current = new kakao.maps.Polyline({
      path: linePath,
      strokeWeight: 6,
      strokeColor: '#0ea5e9',
      strokeOpacity: 0.9,
      strokeStyle: 'solid',
    });
    routePolylineRef.current.setMap(mapInstance.current);

    const userPos = new kakao.maps.LatLng(userLat, userLng);
    const userMarkerSvg =
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><circle cx="14" cy="14" r="9" fill="#0ea5e9" stroke="white" stroke-width="3"/></svg>`
      );
    userMarkerRef.current = new kakao.maps.Marker({
      position: userPos,
      image: new kakao.maps.MarkerImage(userMarkerSvg, new kakao.maps.Size(28, 28)),
      zIndex: 10,
    });
    userMarkerRef.current.setMap(mapInstance.current);

    const bounds = new kakao.maps.LatLngBounds();
    linePath.forEach(p => bounds.extend(p));
    bounds.extend(userPos);
    // 하단 팝업 시트에 경로가 가리지 않도록 아래쪽 여백을 더 줍니다.
    mapInstance.current.setBounds(bounds, 60, 60, 320, 60);
  };

  // 💡 길찾기 버튼 클릭: 브라우저 위치 권한 요청 → Supabase Edge Function(directions) 호출 → 경로 표시
  const handleFindRoute = () => {
    if (!selectedResource) return;

    if (!('geolocation' in navigator)) {
      setRouteState({ loading: false, error: '이 브라우저는 위치 정보 기능을 지원하지 않습니다.', distance: null, duration: null });
      return;
    }

    setRouteState({ loading: true, error: null, distance: null, duration: null });

    const onSuccess = async (pos: GeolocationPosition) => {
      const { latitude, longitude } = pos.coords;
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

        const res = await fetch(`${supabaseUrl}/functions/v1/directions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            originLat: latitude,
            originLng: longitude,
            destLat: selectedResource.lat,
            destLng: selectedResource.lng,
          }),
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => null);
          throw new Error(errBody?.error || '경로를 찾을 수 없습니다.');
        }

        const data = await res.json();
        drawRoute(latitude, longitude, data.path || []);
        setUserLocation({ lat: latitude, lng: longitude });
        setRouteState({ loading: false, error: null, distance: data.distance, duration: data.duration });
        // 💡 경로가 그려지면 지도 영역이 보이도록 맨 위로 스크롤
        mapContainerRefStandalone.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (e: any) {
        setRouteState({ loading: false, error: e.message || '경로를 찾는 중 오류가 발생했습니다.', distance: null, duration: null });
      }
    };

    const onError = (err: GeolocationPositionError, isRetry = false) => {
      if (err.code === err.PERMISSION_DENIED) {
        setRouteState({ loading: false, error: '위치 권한이 거부되었습니다. 브라우저 설정에서 위치 접근을 허용해주세요.', distance: null, duration: null });
      } else if (err.code === err.TIMEOUT && !isRetry) {
        // 💡 GPS 타임아웃 시 Wi-Fi/기지국(낮은 정확도)으로 재시도
        navigator.geolocation.getCurrentPosition(
          onSuccess,
          (err2) => onError(err2, true),
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
        );
      } else {
        const msg = err.code === err.TIMEOUT
          ? '위치를 가져오는 데 시간이 너무 걸립니다. 잠시 후 다시 시도해주세요.'
          : '현재 위치를 가져올 수 없습니다. GPS 또는 위치 서비스가 켜져 있는지 확인해주세요.';
        setRouteState({ loading: false, error: msg, distance: null, duration: null });
      }
    };

    // 💡 1차 시도: GPS(고정밀), 15초 타임아웃 / 실패하면 onError에서 Wi-Fi로 재시도
    navigator.geolocation.getCurrentPosition(onSuccess, onError,
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // 💡 최적화 2단계: 검색/필터링 조건이 바뀔 때만 '마커'를 새로 찍습니다. (지도는 그대로 둠)
  useEffect(() => {
    if (!mapInstance.current || !(window as any).kakao) return;

    // 기존 마커 메모리에서 완전히 삭제
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    const bounds = new (window as any).kakao.maps.LatLngBounds();
    let hasMarkers = false;

    const imageSrc = "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png"; 
    const imageSize = new (window as any).kakao.maps.Size(24, 35);
    const markerImage = new (window as any).kakao.maps.MarkerImage(imageSrc, imageSize); 

    filteredResources.forEach(res => {
      const position = new (window as any).kakao.maps.LatLng(res.lat, res.lng);
      const marker = new (window as any).kakao.maps.Marker({ position: position, image: markerImage });
      marker.setMap(mapInstance.current);
      markersRef.current.push(marker); // 메모리에 새 마커 등록
      bounds.extend(position);
      hasMarkers = true;
      (window as any).kakao.maps.event.addListener(marker, 'click', () => setSelectedResource(res));
    });

    if (hasMarkers && !selectedResource) {
       mapInstance.current.setBounds(bounds);
    }
  }, [filteredResources]); // selectedResource 변경 시에는 마커를 새로 안 찍음!

  // 💡 최적화 3단계: 마커를 클릭하면 지도 부수지 않고 '카메라 시점'만 부드럽게 이동합니다.
  useEffect(() => {
    if (!mapInstance.current || !selectedResource || !(window as any).kakao) return;
    const centerPos = new (window as any).kakao.maps.LatLng(selectedResource.lat, selectedResource.lng);
    mapInstance.current.setCenter(centerPos);
    mapInstance.current.setLevel(4);
  }, [selectedResource]);

  return (
    <div className="flex flex-col-reverse md:flex-row w-full h-[calc(100vh-80px)] relative bg-white dark:bg-slate-900 animate-in fade-in">
       <div className="w-full md:w-[480px] bg-white dark:bg-slate-800 flex flex-col border-r border-slate-100 dark:border-slate-700 z-10 shrink-0 h-[55%] md:h-full relative shadow-[0_-10px_20px_rgba(0,0,0,0.05)] md:shadow-xl">
          <div className="absolute top-4 right-10 text-emerald-100 dark:text-emerald-900/30 opacity-60"><Rabbit size={32} strokeWidth={1.5}/></div>

          <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 sticky top-0 z-20 relative">
             <div className="flex items-center justify-between mb-6 relative z-10">
               <div className="flex items-center gap-3">
                 <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800 rounded-2xl flex items-center justify-center shadow-inner"><MapPin size={24}/></div>
                 <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">체험자원 지도</h2>
               </div>
               
               {role === 'admin' && (
                 <button onClick={handleGeocodeAll} disabled={isMigrating} className="bg-emerald-500 text-white px-3 py-2 rounded-xl text-sm font-black shadow-sm flex items-center gap-1.5 hover:bg-emerald-600 transition-colors disabled:opacity-50">
                   {isMigrating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                   <span className="hidden sm:inline">좌표 변환</span>
                 </button>
               )}
             </div>

             <div className="relative mb-4 z-10 flex gap-2">
                <select value={selectedRegion} onChange={(e) => { setSelectedRegion(e.target.value); setSelectedResource(null); }} className="flex-1 h-12 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400 appearance-none">
                  <option value="전체">= 지역 전체 =</option>
                  {jeonbukRegions.map(reg => <option key={reg} value={reg}>{reg}</option>)}
                </select>
                <select value={selectedType} onChange={(e) => { setSelectedType(e.target.value); setSelectedResource(null); }} className="flex-1 h-12 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400 appearance-none">
                  <option value="전체">= 형태 전체 =</option>
                  {RESOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
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

       <div className="w-full md:flex-1 relative h-[45%] md:h-full bg-slate-100 dark:bg-slate-950">
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
                  <div className="grid grid-cols-3 gap-3">
                     {/* 💡 프로그램 보기: 체험프로그램 컬럼 내용을 모달로 표시 */}
                     <button
                       onClick={() => {
                         if (!selectedResource.program) return;
                         setProgramModalOpen(true);
                       }}
                       disabled={!selectedResource.program}
                       className="bg-emerald-500 dark:bg-emerald-600 text-white py-4 md:py-5 rounded-2xl font-black text-base md:text-lg shadow-md flex justify-center items-center gap-2 hover:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-500 dark:disabled:hover:bg-emerald-600"
                     >
                       <BookOpen size={20}/> 프로그램 보기
                     </button>
                     {/* 💡 사이트 연결: 비고 컬럼 URL로 새 탭 열기 */}
                     <button
                       onClick={() => {
                         if (!selectedResource.note) return;
                         const url = /^https?:\/\//i.test(selectedResource.note) ? selectedResource.note : `https://${selectedResource.note}`;
                         window.open(url, '_blank', 'noopener,noreferrer');
                       }}
                       disabled={!selectedResource.note}
                       className="bg-sky-500 dark:bg-sky-600 text-white py-4 md:py-5 rounded-2xl font-black text-base md:text-lg shadow-md flex justify-center items-center gap-2 hover:bg-sky-600 dark:hover:bg-sky-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-sky-500 dark:disabled:hover:bg-sky-600"
                     >
                       <ExternalLink size={20}/> 사이트 연결
                     </button>
                     {/* 💡 전화 연결 */}
                     <button
                       onClick={() => {
                         if (!selectedResource.phone) return;
                         window.location.href = `tel:${selectedResource.phone}`;
                       }}
                       disabled={!selectedResource.phone}
                       className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 py-4 md:py-5 rounded-2xl font-black text-base md:text-lg flex justify-center items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-100 dark:disabled:hover:bg-slate-700"
                     >
                       <Phone size={20}/> 전화 연결
                     </button>
                  </div>
                  {(!selectedResource.program || !selectedResource.note || !selectedResource.phone) && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 text-center font-bold">
                      {[
                        !selectedResource.program && '프로그램 정보',
                        !selectedResource.note && '사이트 링크',
                        !selectedResource.phone && '연락처',
                      ].filter(Boolean).join(' · ')} 정보가 없는 기관입니다
                    </p>
                  )}

                  <button
                    onClick={handleFindRoute}
                    disabled={routeState.loading}
                    className="mt-4 w-full bg-sky-500 dark:bg-sky-600 text-white py-4 rounded-2xl font-black text-lg shadow-md flex justify-center items-center gap-3 hover:bg-sky-600 dark:hover:bg-sky-500 transition-colors disabled:opacity-60 disabled:cursor-wait"
                  >
                    {routeState.loading ? <Loader2 size={22} className="animate-spin"/> : <Navigation size={22}/>}
                    {routeState.loading ? '내 위치에서 경로 찾는 중...' : '내 위치에서 길찾기'}
                  </button>

                  {routeState.error && (
                    <p className="text-xs text-rose-500 dark:text-rose-400 mt-3 text-center font-bold">{routeState.error}</p>
                  )}

                  {routeState.distance !== null && routeState.duration !== null && (
                    <div className="mt-3 space-y-2">
                      {/* 거리/시간 + 경로 지우기 */}
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm font-black text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 px-4 py-2 rounded-full">
                          자동차 기준 약 {(routeState.distance / 1000).toFixed(1)}km · {Math.round(routeState.duration / 60)}분
                        </span>
                        <button
                          onClick={() => {
                            setRouteState({ loading: false, error: null, distance: null, duration: null });
                            setUserLocation(null);
                            if (routePolylineRef.current) { routePolylineRef.current.setMap(null); routePolylineRef.current = null; }
                            if (userMarkerRef.current) { userMarkerRef.current.setMap(null); userMarkerRef.current = null; }
                          }}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          title="경로 지우기"
                        >
                          <RotateCcw size={16}/>
                        </button>
                      </div>
                      {/* 💡 카카오맵 앱으로 길찾기 연동 버튼 */}
                      {userLocation && selectedResource && (
                        <button
                          onClick={() => {
                            const sp = `${userLocation.lat},${userLocation.lng}`;
                            const ep = `${selectedResource.lat},${selectedResource.lng}`;
                            const appUrl = `kakaomap://route?sp=${sp}&ep=${ep}&by=CAR`;
                            const webUrl = `https://map.kakao.com/link/to/${encodeURIComponent(selectedResource.name)},${selectedResource.lat},${selectedResource.lng}`;
                            // 앱 딥링크 시도 → 실패하면 웹으로 fallback
                            const now = Date.now();
                            window.location.href = appUrl;
                            setTimeout(() => {
                              if (Date.now() - now < 2000) window.open(webUrl, '_blank');
                            }, 1500);
                          }}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-base bg-yellow-400 hover:bg-yellow-500 text-slate-900 transition-colors shadow-sm"
                        >
                          <img
                            src="https://developers.kakao.com/assets/img/about/logos/kakaomaplink/kakaomap_logo.png"
                            alt="카카오맵"
                            className="w-5 h-5 rounded"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          카카오맵 앱으로 길찾기
                        </button>
                      )}
                    </div>
                  )}
               </div>
             )}
          </div>
       </div>

       {/* 💡 체험프로그램 내용 모달 */}
       {programModalOpen && selectedResource && (
         <div
           className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
           onClick={() => setProgramModalOpen(false)}
         >
           <div
             className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-8 relative"
             onClick={e => e.stopPropagation()}
           >
             <button
               onClick={() => setProgramModalOpen(false)}
               className="absolute top-5 right-5 p-2 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
             >
               <X size={20}/>
             </button>
             <div className="flex items-center gap-3 mb-5">
               <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl flex items-center justify-center">
                 <BookOpen size={20} className="text-emerald-600 dark:text-emerald-400"/>
               </div>
               <div>
                 <p className="text-xs font-black text-emerald-500 dark:text-emerald-400 tracking-widest mb-0.5">체험 프로그램</p>
                 <h4 className="text-lg font-black text-slate-800 dark:text-white leading-tight">{selectedResource.name}</h4>
               </div>
             </div>
             <p className="text-slate-700 dark:text-slate-200 text-base leading-relaxed whitespace-pre-line font-medium">
               {selectedResource.program}
             </p>
           </div>
         </div>
       )}
    </div>
  );
};

export default ResourceMap;
