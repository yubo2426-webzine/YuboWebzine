import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin, Phone, Clock, X, Loader2, CheckCircle2, Search,
  CalendarDays, Users, Baby, ShieldCheck, ChevronRight, Building2, Navigation, Check
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// ─────────────────────────────────────────────
// 카카오맵 SDK 로더 (ResourceMap과 동일 패턴)
// ─────────────────────────────────────────────
let kakaoLoadPromise: Promise<void> | null = null;
const loadKakao = (): Promise<void> => {
  if (kakaoLoadPromise) return kakaoLoadPromise;
  kakaoLoadPromise = new Promise((resolve, reject) => {
    const w = window as any;
    if (w.kakao?.maps?.LatLng) { resolve(); return; }
    const scriptId = 'kakao-map-script';
    const onLoad = () => w.kakao.maps.load(() => resolve());
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existing) {
      if (w.kakao?.maps) { onLoad(); return; }
      existing.addEventListener('load', onLoad);
      return;
    }
    const script = document.createElement('script');
    script.id = scriptId;
    const apiKey = import.meta.env.VITE_KAKAO_MAP_API_KEY || '';
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services,clusterer&autoload=false`;
    script.onload = onLoad;
    script.onerror = () => reject(new Error('Kakao SDK load failed'));
    document.head.appendChild(script);
  });
  return kakaoLoadPromise;
};

interface CareCenter {
  id: number;
  seq: number;
  center_type: string;
  name: string;
  address: string;
  region: string | null;
  phone: string | null;
  care_hours: string | null;
  lat: number | null;
  lng: number | null;
  is_bookable: boolean;
}

// 잔여 정원 정보 (약국지도식 마커 색상용)
interface Availability {
  capacity: number | null;   // null = 정원 미설정 (제한 없음)
  remaining: number | null;
}

const TYPE_COLOR: Record<string, string> = {
  '거점': '#0ea5e9',
  '연계(대표)': '#10b981',
  '연계(공동)': '#34d399',
  '총괄': '#94a3b8',
};

const CARE_TYPES = ['오전', '오후', '휴일', '방학'] as const;

const markerSvg = (color: string) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="46" viewBox="0 0 34 46">
     <path d="M17 0C7.6 0 0 7.6 0 17c0 12.75 17 29 17 29s17-16.25 17-29C34 7.6 26.4 0 17 0z" fill="${color}"/>
     <circle cx="17" cy="17" r="7" fill="white"/>
   </svg>`);

// 사용자 위치 마커 (파란색 원)
const userMarkerSvg = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
     <circle cx="14" cy="14" r="12" fill="#3b82f6" opacity="0.8"/>
     <circle cx="14" cy="14" r="8" fill="#60a5fa"/>
     <circle cx="14" cy="14" r="4" fill="white"/>
   </svg>`);

// ─────────────────────────────────────────────
// 개인정보 동의 전문
// ─────────────────────────────────────────────
const PRIVACY_COLLECT = `[개인정보 수집·이용 동의]
- 수집 항목: 보호자 성명·휴대전화번호, 아동 성명·인원수, 이용 희망 기관·일시
- 수집·이용 목적: 돌봄기관 이용 신청 접수, 신청 확인·안내 연락, 이용 현황 관리
- 보유·이용 기간: 이용일로부터 1년 (기간 경과 시 지체 없이 파기)
- 동의를 거부할 권리가 있으며, 거부 시 온라인 신청이 제한됩니다. (해당 기관 전화 신청 가능)`;

const PRIVACY_PROVIDE = `[개인정보 제3자 제공 동의]
- 제공받는 자: 신청하신 거점형 돌봄기관
- 제공 항목: 보호자 성명·휴대전화번호, 아동 성명·인원수, 이용 일시
- 제공 목적: 돌봄 이용 신청 확인 및 돌봄 서비스 제공
- 보유·이용 기간: 이용일로부터 1년`;

const inputCls = "w-full h-12 px-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all";
const labelCls = "block text-sm font-black text-slate-600 dark:text-slate-300 mb-1.5";

const CareApply: React.FC = () => {
  const [centers, setCenters] = useState<CareCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CareCenter | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showLookup, setShowLookup] = useState(false);
  const [regionFilter, setRegionFilter] = useState('전체');          // 지역: 시군
  const [careTypeFilter, setCareTypeFilter] = useState<string>('오전'); // 시간대: 오전/오후/휴일/방학
  const [dateFilter, setDateFilter] = useState(() => new Date().toISOString().slice(0, 10));
  const [avail, setAvail] = useState<Record<number, Availability>>({});
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);

  // ── 기관 데이터 로드
  useEffect(() => {
    (async () => {
      if (!supabase) { setLoading(false); return; }
      const { data, error } = await supabase
        .from('care_centers')
        .select('id, seq, center_type, name, address, region, phone, care_hours, lat, lng, is_bookable')
        .eq('is_active', true)
        .eq('is_bookable', true)
        .eq('center_type', '거점')
        .order('seq');
      if (!error && data) setCenters(data as CareCenter[]);
      setLoading(false);
    })();
  }, []);

  // ── 잔여 정원 조회 (시간대·날짜가 바뀔 때마다)
  useEffect(() => {
    (async () => {
      if (!supabase) return;
      const { data } = await supabase.rpc('get_center_availability', {
        p_care_type: careTypeFilter, p_date: dateFilter,
      });
      if (data) {
        const map: Record<number, Availability> = {};
        (data as any[]).forEach(r => { map[r.center_id] = { capacity: r.capacity, remaining: r.remaining }; });
        setAvail(map);
      }
    })();
  }, [careTypeFilter, dateFilter]);

  // ── 현재 위치 가져오기 (Geolocation API - 카카오맵 API 아님, 추가 비용 없음)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
        },
        (error) => {
          // 위치 권한 거부 또는 오류 → 조용히 무시하고 계속
          console.log('위치 접근 거부 또는 오류:', error.message);
        }
      );
    }
  }, []);

  // ── 지도 생성 + 좌표 없는 기관 지오코딩(자동 캐싱)
  useEffect(() => {
    if (loading || !mapRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        await loadKakao();
        if (cancelled || !mapRef.current) return;
        const kakao = (window as any).kakao;
        if (!mapInstance.current) {
          mapInstance.current = new kakao.maps.Map(mapRef.current, {
            center: new kakao.maps.LatLng(35.8242, 127.1480), level: 11,
          });
        }

        // ── 좌표 없는 기관만 지오코딩 (효율적!)
        const geocoder = new kakao.maps.services.Geocoder();
        const resolveCoord = (c: CareCenter) => new Promise<CareCenter>((res) => {
          if (c.lat && c.lng) {
            // 이미 좌표 있음 → API 호출 없음 ✅
            res(c);
            return;
          }

          // 좌표 없음 → 지오코딩 (1회만!)
          geocoder.addressSearch(c.address, async (result: any[], status: string) => {
            if (status === kakao.maps.services.Status.OK && result[0]) {
              const lat = parseFloat(result[0].y), lng = parseFloat(result[0].x);
              // DB에 저장 → 다음 사용자는 API 호출 안 함 (캐싱) 🎯
              if (supabase) {
                await supabase.from('care_centers').update({ lat, lng }).eq('id', c.id);
              }
              res({ ...c, lat, lng });
            } else {
              // 지오코딩 실패 → 기본값 사용
              const short = c.address.replace(/^전북특별자치도\s*/, '');
              geocoder.addressSearch(short, (r2: any[], s2: string) => {
                if (s2 === kakao.maps.services.Status.OK && r2[0]) {
                  res({ ...c, lat: parseFloat(r2[0].y), lng: parseFloat(r2[0].x) });
                } else {
                  res({ ...c, lat: 35.8242, lng: 127.1480 }); // 기본값
                }
              });
            }
          });
        });

        const resolved = await Promise.all(centers.map(resolveCoord));
        if (cancelled) return;
        setCenters(resolved);
      } catch { /* 지도 로드 실패 시 목록만 표시 */ }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // ── 약국지도식 마커 색상: 잔여 정원 기준
  const availColor = (c: CareCenter): string => {
    const a = avail[c.id];
    if (!a || a.capacity === null) return '#0ea5e9';        // 정원 미설정 → 하늘색
    if (a.remaining === 0) return '#f43f5e';                 // 마감 → 빨강
    if ((a.remaining ?? 0) <= 2) return '#f59e0b';           // 잔여 적음 → 주황
    return '#10b981';                                        // 여유 → 초록
  };

  // ── 마커 렌더링 (필터 반영) + 사용자 위치 표시
  const filtered = centers.filter(c => c.is_bookable &&
    (regionFilter === '전체' || c.region === regionFilter));

  const regions = Array.from(new Set(centers.map(c => c.region).filter(Boolean))) as string[];

  useEffect(() => {
    const kakao = (window as any).kakao;
    if (!kakao?.maps || !mapInstance.current) return;

    // 기존 마커 제거
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    if (userMarkerRef.current) userMarkerRef.current.setMap(null);

    const bounds = new kakao.maps.LatLngBounds();
    let hasPoint = false;

    // 기관 마커 (잔여 정원 색상)
    filtered.forEach(c => {
      if (!c.lat || !c.lng) return;
      hasPoint = true;
      const pos = new kakao.maps.LatLng(c.lat, c.lng);
      bounds.extend(pos);
      const marker = new kakao.maps.Marker({
        map: mapInstance.current, position: pos,
        image: new kakao.maps.MarkerImage(
          markerSvg(availColor(c)),
          new kakao.maps.Size(34, 46)),
      });
      kakao.maps.event.addListener(marker, 'click', () => setSelected(c));
      markersRef.current.push(marker);
    });

    // 사용자 위치 마커 (파란색 원)
    if (userLocation) {
      hasPoint = true;
      const userPos = new kakao.maps.LatLng(userLocation.lat, userLocation.lng);
      bounds.extend(userPos);
      userMarkerRef.current = new kakao.maps.Marker({
        map: mapInstance.current,
        position: userPos,
        title: '내 위치',
        image: new kakao.maps.MarkerImage(userMarkerSvg, new kakao.maps.Size(28, 28)),
      });
    }

    if (hasPoint) mapInstance.current.setBounds(bounds, 40);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centers, regionFilter, avail, userLocation]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <Building2 className="text-sky-500" size={32}/> 거점형 돌봄 신청
          </h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400 font-bold">
            지도에서 기관을 선택하고 오전·오후·휴일·방학 돌봄을 신청하세요. 기관에서 확인 후 연락드립니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* 시간대 필터 */}
          <select value={careTypeFilter} onChange={e => setCareTypeFilter(e.target.value)}
            className="h-12 px-4 rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 font-black text-slate-700 dark:text-slate-200 cursor-pointer">
            {CARE_TYPES.map(t => <option key={t} value={t}>{t} 돌봄</option>)}
          </select>
          {/* 이용 날짜 (잔여 정원 기준일) */}
          <input type="date" value={dateFilter} min={new Date().toISOString().slice(0,10)}
            onChange={e => setDateFilter(e.target.value)}
            className="h-12 px-4 rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 font-black text-slate-700 dark:text-slate-200 cursor-pointer"/>
          {/* 지역 필터 */}
          <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)}
            className="h-12 px-4 rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 font-black text-slate-700 dark:text-slate-200 cursor-pointer">
            <option value="전체">지역 전체</option>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          {/* 유형 필터는 시간대 필터와 중복되어 제거됨 */}
          <button onClick={() => setShowLookup(true)}
            className="h-12 px-5 rounded-full bg-slate-800 dark:bg-slate-700 text-white font-black flex items-center gap-2 hover:bg-slate-700 transition-colors">
            <Search size={16}/> 내 신청 조회
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* 지도 */}
        <div className="lg:col-span-3 rounded-[2rem] overflow-hidden border border-slate-100 dark:border-slate-700 shadow-lg bg-slate-50 dark:bg-slate-800 relative" style={{ minHeight: 480 }}>
          <div ref={mapRef} className="w-full h-full absolute inset-0"/>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-slate-900/60 z-10">
              <Loader2 className="animate-spin text-sky-500" size={36}/>
            </div>
          )}
          <div className="absolute bottom-4 left-4 z-10 bg-white/90 dark:bg-slate-900/90 rounded-2xl px-4 py-2.5 shadow flex flex-wrap gap-3 text-xs font-black">
            <span className="flex items-center gap-1.5"><i className="w-3 h-3 rounded-full inline-block" style={{background:'#10b981'}}/>여유</span>
            <span className="flex items-center gap-1.5"><i className="w-3 h-3 rounded-full inline-block" style={{background:'#f59e0b'}}/>잔여 적음</span>
            <span className="flex items-center gap-1.5"><i className="w-3 h-3 rounded-full inline-block" style={{background:'#f43f5e'}}/>마감</span>
            <span className="flex items-center gap-1.5"><i className="w-3 h-3 rounded-full inline-block" style={{background:'#0ea5e9'}}/>정원 미설정</span>
            {userLocation && <span className="flex items-center gap-1.5"><i className="w-3 h-3 rounded-full inline-block" style={{background:'#3b82f6'}}/>내 위치</span>}
          </div>
        </div>

        {/* 기관 목록 */}
        <div className="lg:col-span-2 flex flex-col gap-3 max-h-[560px] overflow-y-auto pr-1">
          {filtered.map(c => (
            <button key={c.id} onClick={() => setSelected(c)}
              className={`text-left p-5 rounded-3xl border transition-all bg-white dark:bg-slate-800 hover:shadow-md ${selected?.id === c.id ? 'border-sky-400 ring-2 ring-sky-200 dark:ring-sky-800' : 'border-slate-100 dark:border-slate-700'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-black text-slate-800 dark:text-white">{c.name}</span>
                <span className="flex items-center gap-1.5 shrink-0">
                  {(() => {
                    const a = avail[c.id];
                    if (!a || a.capacity === null) return <span className="text-[11px] font-black px-2.5 py-1 rounded-full text-white bg-sky-500">신청 가능</span>;
                    if (a.remaining === 0) return <span className="text-[11px] font-black px-2.5 py-1 rounded-full text-white bg-rose-500">마감</span>;
                    return <span className={`text-[11px] font-black px-2.5 py-1 rounded-full text-white ${(a.remaining ?? 0) <= 2 ? 'bg-amber-500' : 'bg-emerald-500'}`}>잔여 {a.remaining}명</span>;
                  })()}
                  <span className="text-[11px] font-black px-2.5 py-1 rounded-full text-white bg-slate-400">{c.center_type.startsWith('거점') ? '거점' : '연계'}</span>
                </span>
              </div>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 font-bold flex items-start gap-1.5"><MapPin size={14} className="mt-0.5 shrink-0"/>{c.address}</p>
            </button>
          ))}
          {!loading && filtered.length === 0 && (
            <p className="text-center text-slate-400 font-bold py-10">표시할 기관이 없습니다.</p>
          )}
        </div>
      </div>

      {/* 기관 상세 + 신청 버튼 */}
      {selected && !showForm && (
        <Modal onClose={() => setSelected(null)}>
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="text-2xl font-black text-slate-800 dark:text-white">{selected.name}</h3>
            <span className="text-xs font-black px-3 py-1.5 rounded-full text-white bg-sky-500">{selected.center_type}</span>
          </div>
          <div className="space-y-3 text-slate-600 dark:text-slate-300 font-bold">
            <p className="flex items-start gap-2"><MapPin size={18} className="text-sky-500 mt-0.5 shrink-0"/>{selected.address}</p>
            {selected.phone && <p className="flex items-center gap-2"><Phone size={18} className="text-emerald-500 shrink-0"/>{selected.phone}</p>}
            {selected.care_hours && <p className="flex items-start gap-2"><Clock size={18} className="text-amber-500 mt-0.5 shrink-0"/><span className="whitespace-pre-line">{selected.care_hours}</span></p>}
          </div>
          <button onClick={() => setShowForm(true)}
            className="mt-6 w-full h-14 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-black text-lg flex items-center justify-center gap-2 hover:from-sky-600 hover:to-blue-700 transition-all shadow-lg">
            이 기관에 돌봄 신청하기 <ChevronRight size={20}/>
          </button>
        </Modal>
      )}

      {selected && showForm && (
        <ApplyForm center={selected} onClose={() => { setShowForm(false); setSelected(null); }}/>
      )}
      {showLookup && <LookupModal onClose={() => setShowLookup(false)}/>}
    </div>
  );
};

// ─────────────────────────────────────────────
// 공통 모달
// ─────────────────────────────────────────────
const Modal: React.FC<{ onClose: () => void; children: React.ReactNode; wide?: boolean }> = ({ onClose, children, wide }) => (
  <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}/>
    <div className={`relative w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl p-7 md:p-9`}>
      <button onClick={onClose} className="absolute top-5 right-5 p-2.5 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 z-10"><X size={18} className="dark:text-slate-300"/></button>
      {children}
    </div>
  </div>
);

// ─────────────────────────────────────────────
// 신청 폼
// ─────────────────────────────────────────────
const ApplyForm: React.FC<{ center: any; onClose: () => void }> = ({ center, onClose }) => {
  const [f, setF] = useState({
    guardian_name: '', guardian_phone: '', child_names: '', child_count: 1,
    care_type: '오전' as string, use_date: '', use_time: '', memo: '',
  });
  const [agree1, setAgree1] = useState(false);
  const [agree2, setAgree2] = useState(false);
  const [showTerms, setShowTerms] = useState<null | 1 | 2>(null);
  const [submitting, setSubmitting] = useState(false);
  const [receiptNo, setReceiptNo] = useState<string | null>(null);
  const [error, setError] = useState('');

  const set = (k: string, v: any) => setF(prev => ({ ...prev, [k]: v }));

  const submit = async () => {
    setError('');
    if (!f.guardian_name.trim()) return setError('보호자 성명을 입력해 주세요.');
    if (!/^01[016789][-\s]?\d{3,4}[-\s]?\d{4}$/.test(f.guardian_phone.trim())) return setError('휴대전화번호를 정확히 입력해 주세요. (예: 010-1234-5678)');
    if (!f.child_names.trim()) return setError('아동 이름을 입력해 주세요.');
    if (!f.use_date) return setError('이용 희망일을 선택해 주세요.');
    if (f.use_date < new Date().toISOString().slice(0, 10)) return setError('이용 희망일은 오늘 이후 날짜여야 합니다.');
    if (!agree1 || !agree2) return setError('개인정보 수집·이용 및 제3자 제공에 모두 동의해 주세요.');
    if (!supabase) return setError('서버 연결에 실패했습니다.');

    setSubmitting(true);
    const { data, error: err } = await supabase.from('care_applications').insert({
      center_id: center.id,
      guardian_name: f.guardian_name.trim(),
      guardian_phone: f.guardian_phone.trim(),
      child_names: f.child_names.trim(),
      child_count: Number(f.child_count),
      care_type: f.care_type,
      use_date: f.use_date,
      use_time: f.use_time.trim() || null,
      memo: f.memo.trim() || null,
      privacy_agreed: true,
    }).select('receipt_no').single();
    setSubmitting(false);
    if (err) {
      // 정원 마감 등 서버측 검증 메시지는 그대로 표시
      if (err.message && err.message.includes('정원')) { setError(err.message); return; }
      setError('신청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'); return;
    }
    setReceiptNo(data.receipt_no);
  };

  if (receiptNo) return (
    <Modal onClose={onClose}>
      <div className="text-center py-6">
        <CheckCircle2 size={64} className="text-emerald-500 mx-auto mb-5"/>
        <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-3">신청이 접수되었습니다</h3>
        <p className="text-slate-500 dark:text-slate-400 font-bold mb-6">아래 접수번호를 꼭 보관해 주세요.<br/>기관에서 확인 후 기재하신 연락처로 안내드립니다.</p>
        <div className="bg-sky-50 dark:bg-sky-900/30 border-2 border-dashed border-sky-300 dark:border-sky-700 rounded-2xl py-5 px-6 text-3xl font-black text-sky-600 dark:text-sky-300 tracking-wider select-all">{receiptNo}</div>
        <p className="mt-4 text-sm text-slate-400 font-bold">접수번호 + 휴대전화번호로 [내 신청 조회]에서 처리 상태를 확인할 수 있습니다.</p>
        <button onClick={onClose} className="mt-7 w-full h-13 py-3.5 rounded-2xl bg-slate-800 dark:bg-slate-700 text-white font-black hover:bg-slate-700">확인</button>
      </div>
    </Modal>
  );

  return (
    <Modal onClose={onClose} wide>
      <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-1.5">돌봄 이용 신청</h3>
      <p className="font-bold text-sky-600 dark:text-sky-400 mb-6 flex items-center gap-1.5"><Building2 size={16}/>{center.name}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className={labelCls}>보호자 성명 *</label>
          <input className={inputCls} value={f.guardian_name} onChange={e => set('guardian_name', e.target.value)} placeholder="홍길동"/></div>
        <div><label className={labelCls}>보호자 휴대전화 *</label>
          <input className={inputCls} value={f.guardian_phone} onChange={e => set('guardian_phone', e.target.value)} placeholder="010-1234-5678" inputMode="tel"/></div>
        <div><label className={labelCls}>아동 이름 * <span className="text-slate-400 font-bold">(여러 명은 쉼표 구분)</span></label>
          <input className={inputCls} value={f.child_names} onChange={e => set('child_names', e.target.value)} placeholder="김하늘, 김바다"/></div>
        <div><label className={labelCls}>아동 수 *</label>
          <select className={inputCls} value={f.child_count} onChange={e => set('child_count', e.target.value)}>
            {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}명</option>)}
          </select></div>
        <div><label className={labelCls}>이용 유형 *</label>
          <div className="flex gap-2">
            {CARE_TYPES.map(t => (
              <button key={t} onClick={() => set('care_type', t)}
                className={`flex-1 h-12 rounded-2xl font-black text-sm transition-all border ${f.care_type === t ? 'bg-sky-500 text-white border-sky-500 shadow' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-sky-300'}`}>{t}</button>
            ))}
          </div></div>
        <div><label className={labelCls}>이용 희망일 *</label>
          <input type="date" className={inputCls} value={f.use_date} min={new Date().toISOString().slice(0,10)} onChange={e => set('use_date', e.target.value)}/></div>
        <div><label className={labelCls}>희망 시간대 <span className="text-slate-400 font-bold">(선택)</span></label>
          <input className={inputCls} value={f.use_time} onChange={e => set('use_time', e.target.value)} placeholder="예: 07:30~08:30"/></div>
        <div><label className={labelCls}>기관 전달사항 <span className="text-slate-400 font-bold">(선택)</span></label>
          <input className={inputCls} value={f.memo} onChange={e => set('memo', e.target.value)} placeholder="알레르기, 특이사항 등"/></div>
      </div>

      {center.care_hours && (
        <p className="mt-4 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-3 flex items-start gap-2">
          <Clock size={14} className="mt-0.5 shrink-0"/>이 기관의 운영시간: {center.care_hours}
        </p>
      )}

      <div className="mt-5 space-y-2.5">
        {[{v: agree1, s: setAgree1, n: 1 as const, t: '(필수) 개인정보 수집·이용에 동의합니다.'},
          {v: agree2, s: setAgree2, n: 2 as const, t: '(필수) 신청 기관에 대한 개인정보 제3자 제공에 동의합니다.'}].map(a => (
          <div key={a.n} className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900 rounded-2xl px-4 py-3">
            <button type="button" onClick={() => a.s(!a.v)}
              className="flex items-center gap-3 cursor-pointer font-bold text-sm text-slate-700 dark:text-slate-300 text-left">
              <span className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${a.v ? 'bg-sky-500 border-sky-500' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-500'}`}>
                {a.v && <Check size={16} className="text-white" strokeWidth={3}/>}
              </span>
              <ShieldCheck size={16} className="text-emerald-500 shrink-0"/>{a.t}
            </button>
            <button onClick={() => setShowTerms(a.n)} className="text-xs font-black text-sky-500 shrink-0 hover:underline">전문 보기</button>
          </div>
        ))}
      </div>

      {showTerms && (
        <div className="mt-3 bg-slate-100 dark:bg-slate-900 rounded-2xl p-5 text-sm font-bold text-slate-600 dark:text-slate-300 whitespace-pre-line relative">
          <button onClick={() => setShowTerms(null)} className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"><X size={14}/></button>
          {showTerms === 1 ? PRIVACY_COLLECT : PRIVACY_PROVIDE}
        </div>
      )}

      {error && <p className="mt-4 text-sm font-black text-rose-500 bg-rose-50 dark:bg-rose-900/20 rounded-xl px-4 py-3">{error}</p>}

      <button onClick={submit} disabled={submitting}
        className="mt-6 w-full h-14 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-black text-lg flex items-center justify-center gap-2 hover:from-sky-600 hover:to-blue-700 disabled:opacity-60 transition-all shadow-lg">
        {submitting ? <Loader2 className="animate-spin" size={22}/> : <>신청하기 <ChevronRight size={20}/></>}
      </button>
    </Modal>
  );
};

// ─────────────────────────────────────────────
// 접수번호로 내 신청 조회
// ─────────────────────────────────────────────
const LookupModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [receiptNo, setReceiptNo] = useState('');
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState<any[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const lookup = async () => {
    setError(''); setResult(null);
    if (!receiptNo.trim() || !phone.trim()) return setError('접수번호와 휴대전화번호를 입력해 주세요.');
    if (!supabase) return setError('서버 연결에 실패했습니다.');
    setBusy(true);
    const { data, error: err } = await supabase.rpc('get_my_application', {
      p_receipt_no: receiptNo.trim().toUpperCase(), p_phone: phone.trim(),
    });
    setBusy(false);
    if (err) return setError('조회 중 오류가 발생했습니다.');
    if (!data || data.length === 0) return setError('일치하는 신청 내역이 없습니다. 접수번호와 번호를 확인해 주세요.');
    setResult(data);
  };

  const STATUS_STYLE: Record<string, string> = {
    '접수': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    '확인': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    '반려': 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    '취소': 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300',
  };

  return (
    <Modal onClose={onClose}>
      <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2 mb-5"><Search size={22} className="text-sky-500"/> 내 신청 조회</h3>
      <div className="space-y-4">
        <div><label className={labelCls}>접수번호</label>
          <input className={inputCls} value={receiptNo} onChange={e => setReceiptNo(e.target.value)} placeholder="DC260709-0001"/></div>
        <div><label className={labelCls}>신청 시 입력한 휴대전화번호</label>
          <input className={inputCls} value={phone} onChange={e => setPhone(e.target.value)} placeholder="010-1234-5678" inputMode="tel"/></div>
      </div>
      {error && <p className="mt-4 text-sm font-black text-rose-500">{error}</p>}
      {result && result.map((r, i) => (
        <div key={i} className="mt-5 bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 space-y-2 font-bold text-sm text-slate-600 dark:text-slate-300">
          <div className="flex items-center justify-between">
            <span className="font-black text-slate-800 dark:text-white">{r.center_name}</span>
            <span className={`text-xs font-black px-3 py-1 rounded-full ${STATUS_STYLE[r.status] || ''}`}>{r.status}</span>
          </div>
          <p className="flex items-center gap-2"><CalendarDays size={14}/>{r.use_date} · {r.care_type}{r.use_time ? ` · ${r.use_time}` : ''}</p>
          <p className="flex items-center gap-2"><Baby size={14}/>{r.child_names} ({r.child_count}명)</p>
          {r.status_note && <p className="text-xs bg-white dark:bg-slate-800 rounded-xl px-3 py-2 mt-2">기관 안내: {r.status_note}</p>}
        </div>
      ))}
      <button onClick={lookup} disabled={busy}
        className="mt-6 w-full h-13 py-3.5 rounded-2xl bg-slate-800 dark:bg-slate-700 text-white font-black hover:bg-slate-700 disabled:opacity-60 flex items-center justify-center gap-2">
        {busy ? <Loader2 className="animate-spin" size={20}/> : '조회하기'}
      </button>
    </Modal>
  );
};

export default CareApply;
