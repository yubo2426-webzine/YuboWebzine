diff --git a/src/components/ResourceMap.tsx b/src/components/ResourceMap.tsx
index 76641d1..3a7e2da 100644
--- a/src/components/ResourceMap.tsx
+++ b/src/components/ResourceMap.tsx
@@ -1,5 +1,5 @@
 import React, { useState, useEffect, useRef } from 'react';
-import { MapPin, Search, Phone, X, CheckCircle2, Compass, Loader2, Rabbit, RefreshCw } from 'lucide-react';
+import { MapPin, Search, Phone, X, CheckCircle2, Compass, Loader2, Rabbit, RefreshCw, Navigation, RotateCcw } from 'lucide-react';
 // 💡 싱글톤으로 만들어둔 supabase 인스턴스를 불러옵니다.
 import { supabase } from '../lib/supabase';
 
@@ -65,6 +65,16 @@ const ResourceMap: React.FC<ResourceMapProps> = ({
   const [resources, setResources] = useState<any[]>([]);
   const [selectedResource, setSelectedResource] = useState<any>(null);
   const [isMigrating, setIsMigrating] = useState(false);
+
+  // 💡 길찾기 상태: 탐색 중 여부, 에러 메시지, 결과(거리/소요시간)
+  const [routeState, setRouteState] = useState<{
+    loading: boolean;
+    error: string | null;
+    distance: number | null; // meters
+    duration: number | null; // seconds
+  }>({ loading: false, error: null, distance: null, duration: null });
+  const routePolylineRef = useRef<any>(null);
+  const userMarkerRef = useRef<any>(null);
   
   const [mapLoading, mapError] = useCustomKakaoLoader();
   const mapContainerRefStandalone = useRef<HTMLDivElement>(null);
@@ -150,6 +160,107 @@ const ResourceMap: React.FC<ResourceMapProps> = ({
     }
   }, [mapLoading, mapError]);
 
+  // 💡 길찾기: 선택된 기관이 바뀌거나 팝업이 닫히면 기존 경로선/현위치 마커를 정리합니다.
+  useEffect(() => {
+    setRouteState({ loading: false, error: null, distance: null, duration: null });
+    if (routePolylineRef.current) { routePolylineRef.current.setMap(null); routePolylineRef.current = null; }
+    if (userMarkerRef.current) { userMarkerRef.current.setMap(null); userMarkerRef.current = null; }
+  }, [selectedResource?.id]);
+
+  // 💡 카카오맵 위에 경로선(Polyline) + 현재 위치 마커를 그리고, 두 지점이 모두 보이도록 화면을 맞춥니다.
+  const drawRoute = (userLat: number, userLng: number, path: { lat: number; lng: number }[]) => {
+    const kakao = (window as any).kakao;
+    if (!kakao || !mapInstance.current || path.length === 0) return;
+
+    if (routePolylineRef.current) routePolylineRef.current.setMap(null);
+    if (userMarkerRef.current) userMarkerRef.current.setMap(null);
+
+    const linePath = path.map(p => new kakao.maps.LatLng(p.lat, p.lng));
+
+    routePolylineRef.current = new kakao.maps.Polyline({
+      path: linePath,
+      strokeWeight: 6,
+      strokeColor: '#0ea5e9',
+      strokeOpacity: 0.9,
+      strokeStyle: 'solid',
+    });
+    routePolylineRef.current.setMap(mapInstance.current);
+
+    const userPos = new kakao.maps.LatLng(userLat, userLng);
+    const userMarkerSvg =
+      "data:image/svg+xml;utf8," +
+      encodeURIComponent(
+        `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><circle cx="14" cy="14" r="9" fill="#0ea5e9" stroke="white" stroke-width="3"/></svg>`
+      );
+    userMarkerRef.current = new kakao.maps.Marker({
+      position: userPos,
+      image: new kakao.maps.MarkerImage(userMarkerSvg, new kakao.maps.Size(28, 28)),
+      zIndex: 10,
+    });
+    userMarkerRef.current.setMap(mapInstance.current);
+
+    const bounds = new kakao.maps.LatLngBounds();
+    linePath.forEach(p => bounds.extend(p));
+    bounds.extend(userPos);
+    // 하단 팝업 시트에 경로가 가리지 않도록 아래쪽 여백을 더 줍니다.
+    mapInstance.current.setBounds(bounds, 60, 60, 320, 60);
+  };
+
+  // 💡 길찾기 버튼 클릭: 브라우저 위치 권한 요청 → Supabase Edge Function(directions) 호출 → 경로 표시
+  const handleFindRoute = () => {
+    if (!selectedResource) return;
+
+    if (!('geolocation' in navigator)) {
+      setRouteState({ loading: false, error: '이 브라우저는 위치 정보 기능을 지원하지 않습니다.', distance: null, duration: null });
+      return;
+    }
+
+    setRouteState({ loading: true, error: null, distance: null, duration: null });
+
+    navigator.geolocation.getCurrentPosition(
+      async (pos) => {
+        const { latitude, longitude } = pos.coords;
+        try {
+          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
+          const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
+
+          const res = await fetch(`${supabaseUrl}/functions/v1/directions`, {
+            method: 'POST',
+            headers: {
+              'Content-Type': 'application/json',
+              'Authorization': `Bearer ${supabaseKey}`,
+            },
+            body: JSON.stringify({
+              originLat: latitude,
+              originLng: longitude,
+              destLat: selectedResource.lat,
+              destLng: selectedResource.lng,
+            }),
+          });
+
+          if (!res.ok) {
+            const errBody = await res.json().catch(() => null);
+            throw new Error(errBody?.error || '경로를 찾을 수 없습니다.');
+          }
+
+          const data = await res.json();
+          drawRoute(latitude, longitude, data.path || []);
+          setRouteState({ loading: false, error: null, distance: data.distance, duration: data.duration });
+        } catch (e: any) {
+          setRouteState({ loading: false, error: e.message || '경로를 찾는 중 오류가 발생했습니다.', distance: null, duration: null });
+        }
+      },
+      (err) => {
+        const message =
+          err.code === err.PERMISSION_DENIED
+            ? '위치 권한이 거부되었습니다. 브라우저 설정에서 위치 접근을 허용해주세요.'
+            : '현재 위치를 가져올 수 없습니다. 잠시 후 다시 시도해주세요.';
+        setRouteState({ loading: false, error: message, distance: null, duration: null });
+      },
+      { enableHighAccuracy: true, timeout: 10000 }
+    );
+  };
+
   // 💡 최적화 2단계: 검색/필터링 조건이 바뀔 때만 '마커'를 새로 찍습니다. (지도는 그대로 둠)
   useEffect(() => {
     if (!mapInstance.current || !(window as any).kakao) return;
@@ -265,9 +376,69 @@ const ResourceMap: React.FC<ResourceMapProps> = ({
                   <h3 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white mb-4 tracking-tight leading-tight pr-12">{selectedResource.name}</h3>
                   <p className="text-slate-500 dark:text-slate-400 font-bold text-base md:text-lg flex items-center gap-2 mb-8"><MapPin size={20} className="text-emerald-500 dark:text-emerald-400"/> {selectedResource.address}</p>
                   <div className="grid grid-cols-2 gap-4">
-                     <button className="bg-emerald-500 dark:bg-emerald-600 text-white py-4 md:py-5 rounded-2xl font-black text-lg md:text-xl shadow-md flex justify-center items-center gap-3 hover:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors"><CheckCircle2 size={24}/> 프로그램 보기</button>
-                     <button className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 py-4 md:py-5 rounded-2xl font-black text-lg md:text-xl flex justify-center items-center gap-3 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"><Phone size={24}/> 전화 연결</button>
+                     <button
+                       onClick={() => {
+                         if (!selectedResource.note) return;
+                         const url = /^https?:\/\//i.test(selectedResource.note) ? selectedResource.note : `https://${selectedResource.note}`;
+                         window.open(url, '_blank', 'noopener,noreferrer');
+                       }}
+                       disabled={!selectedResource.note}
+                       className="bg-emerald-500 dark:bg-emerald-600 text-white py-4 md:py-5 rounded-2xl font-black text-lg md:text-xl shadow-md flex justify-center items-center gap-3 hover:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-500 dark:disabled:hover:bg-emerald-600"
+                     >
+                       <CheckCircle2 size={24}/> 프로그램 보기
+                     </button>
+                     <button
+                       onClick={() => {
+                         if (!selectedResource.phone) return;
+                         window.location.href = `tel:${selectedResource.phone}`;
+                       }}
+                       disabled={!selectedResource.phone}
+                       className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 py-4 md:py-5 rounded-2xl font-black text-lg md:text-xl flex justify-center items-center gap-3 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-100 dark:disabled:hover:bg-slate-700"
+                     >
+                       <Phone size={24}/> 전화 연결
+                     </button>
                   </div>
+                  {(!selectedResource.note || !selectedResource.phone) && (
+                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 text-center font-bold">
+                      {!selectedResource.note && !selectedResource.phone
+                        ? '프로그램 링크와 연락처 정보가 등록되지 않은 기관입니다'
+                        : !selectedResource.note
+                        ? '프로그램 상세 페이지 정보가 등록되지 않은 기관입니다'
+                        : '연락처 정보가 등록되지 않은 기관입니다'}
+                    </p>
+                  )}
+
+                  <button
+                    onClick={handleFindRoute}
+                    disabled={routeState.loading}
+                    className="mt-4 w-full bg-sky-500 dark:bg-sky-600 text-white py-4 rounded-2xl font-black text-lg shadow-md flex justify-center items-center gap-3 hover:bg-sky-600 dark:hover:bg-sky-500 transition-colors disabled:opacity-60 disabled:cursor-wait"
+                  >
+                    {routeState.loading ? <Loader2 size={22} className="animate-spin"/> : <Navigation size={22}/>}
+                    {routeState.loading ? '내 위치에서 경로 찾는 중...' : '내 위치에서 길찾기'}
+                  </button>
+
+                  {routeState.error && (
+                    <p className="text-xs text-rose-500 dark:text-rose-400 mt-3 text-center font-bold">{routeState.error}</p>
+                  )}
+
+                  {routeState.distance !== null && routeState.duration !== null && (
+                    <div className="mt-3 flex items-center justify-center gap-2">
+                      <span className="text-sm font-black text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 px-4 py-2 rounded-full">
+                        자동차 기준 약 {(routeState.distance / 1000).toFixed(1)}km · {Math.round(routeState.duration / 60)}분
+                      </span>
+                      <button
+                        onClick={() => {
+                          setRouteState({ loading: false, error: null, distance: null, duration: null });
+                          if (routePolylineRef.current) { routePolylineRef.current.setMap(null); routePolylineRef.current = null; }
+                          if (userMarkerRef.current) { userMarkerRef.current.setMap(null); userMarkerRef.current = null; }
+                        }}
+                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
+                        title="경로 지우기"
+                      >
+                        <RotateCcw size={16}/>
+                      </button>
+                    </div>
+                  )}
                </div>
              )}
           </div>
