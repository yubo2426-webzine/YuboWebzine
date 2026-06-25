# 🌟 함께누리웹진 (유보통합 웹진)

본 프로젝트는 유보통합 정책에 발맞춰, 지역 내 유보통합 자원(체험처) 지도와 최신 교육 뉴스, 월간 웹진 자료를 제공하는 **모바일 우선(Mobile-First) 반응형 웹 플랫폼**입니다.[cite: 5]

사용자의 탐색 피로도를 낮추고, 유아 친화적인 디자인과 부드러운 다크모드를 통해 쾌적한 정보 탐색 환경을 제공합니다.[cite: 5]

## 🚀 기술 스택 (Tech Stack)
* **Frontend:** React 19, Vite, Tailwind CSS, Lucide React Icons, **TypeScript**[cite: 5]
* **UI/Design:** KRDS (대한민국 정부 상징 디자인 시스템), Pretendard GOV Font
* **Backend/DB:** Supabase (Database, Storage)[cite: 5]
* **API:** Kakao Maps API (Geolocation, Custom Markers, REST Geocoding), Kakao Share JS SDK[cite: 5]
* **Deployment:** Vercel (CI/CD)[cite: 5]
* **Features:** 하이브리드 PDF 뷰어(pdf.js), 실시간 조회수 트래킹, 네이티브 앱 딥링크(App Intent) 공유, 서버 사이드 페이지네이션 및 검색[cite: 5]

---

## 📜 프로젝트 진행 로그 (Change Log)

### 🎉 [ v1.7.0 ] Architecture Stabilization & Map Engine Overhaul (Current)
**정부 표준 UI 적용, 카카오맵 엔진 최적화 및 API 보안 이관**
* **정부 표준 UI(KRDS) 도입:** `@krds-ui/core` 연동 및 `Pretendard GOV` 전자정부 표준 서체를 적용하여 공식 플랫폼 규격에 맞는 디자인 토큰 확립.
* **카카오맵 엔진 최적화 및 인앱 브라우저 대응:**
  * Promise 기반 싱글톤 로더 적용으로 컴포넌트 마운트 시 지도 백지화 현상 차단.
  * 인앱 브라우저(카카오톡, 네이버 앱 등)의 GPS 차단 예외 처리 및 비정상 좌표 필터링(`normalizeLatLng`)을 통한 지도 줌아웃 버그 픽스.
* **API 보안 강화 및 환경변수 캡슐화:** 카카오 API(지도, 공유, 주소 좌표 변환) 키를 환경변수(`VITE_KAKAO_JS_KEY` 등)로 완전 분리하여 소스코드 내 보안 리스크 제거 및 공용 계정 마이그레이션 완료.
* **조회수 트래킹 무결성 확보:** DB 테이블 내 고유 식별자(`id`) 부재로 인해 발생하던 조회수 동기화 및 링크 이동 불가 이슈를 `link`(고유 URL) 기반 타겟팅으로 재설계. Supabase RLS 정책 조정을 통해 낙관적 업데이트 시 발생하던 초기화 현상 해결.
* **신규 UX 컴포넌트 탑재:** 유보통합의 의미를 담은 웰컴 모달 팝업 추가 및 실시간 날씨/미세먼지 위젯 도입. 로컬 스토리지를 활용한 팝업 노출 제어 로직 적용.
* **백오피스 고도화 및 SEO:** 카카오 REST API를 클라이언트 단에서 호출하여 '주소 일괄 좌표 자동 변환(Geocoding)'을 수행하는 관리자 전용 기능 구현. 구글/네이버 검색엔진 소유권(`site-verification`) 메타태그 등록.

### 🎉 [ v1.6.0 ] TypeScript Migration & UI/UX Enhancements
**전면적인 TypeScript 마이그레이션 및 핵심 편의 기능 고도화**[cite: 5]
* **아키텍처 모듈화 및 TS 전환 (로드맵 달성):** 단일 `App.jsx` 파일에 집중되었던 로직을 `src/components`, `src/lib` 등으로 완벽하게 분리. JavaScript 기반 코드를 TypeScript(.tsx, .ts)로 전면 전환하여 구조적 복잡도 해소 및 타입 안정성 극대화.[cite: 5]
* **자료실 정렬 시스템 구축:** 호수(날짜)순, 인기 조회순, 추천순 정렬 드롭다운과 오름차순/내림차순(⬆️/⬇️) 토글 버튼을 도입하여 대량의 데이터 탐색 편의성 제공.[cite: 5]
* **스마트 PDF 뷰어 고도화:** 모바일 환경에 최적화된 가로 꽉 맞춤(Width-fit) 스크롤 뷰 구현 및 사용자가 문서 형태에 따라 직접 전환할 수 있는 '한쪽 보기 / 양쪽 보기' 토글 기능 탑재.[cite: 5]
* **관리자 경험(Admin UX) 개선:** '1이슈 1자료' 원칙에 맞춰 자료 등록 시 중복 제목 입력창 제거. 이벤트 버블링(클릭 겹침)으로 인한 관리자 모드 제어 버튼 미작동 버그 완벽 해결.[cite: 5]
* **뉴스 자동화(Cron) 무결성 확보:** 구글 뉴스 RSS의 봇 차단 정책을 우회하기 위한 `User-Agent` 명찰 부여 및 서버리스 자동 3회 재시도(Retry) 로직 탑재. Vercel 콜드 스타트 시 발생하는 라우팅 증발(404) 버그를 막기 위해 `vercel.json` 내 백엔드 함수 영구 고정 설정.[cite: 5]
* **상단 네비게이션(Navbar) 최적화:** 탭명 오기재 오류('체험자원 지도' 중복)를 '뉴스'로 수정 완료.[cite: 5]

### 🎉 [ v1.5.3 ] Selective Cover Regeneration & Traffic Optimization
**트래픽 최적화를 위한 개별 표지 재생성 아키텍처 도입**[cite: 5]
* **개별 표지 강제 재생성 도구:** 모든 PDF를 일괄 다운로드하여 발신 트래픽 폭탄을 유발하던 기존 로직 폐기. 특정 호수(Issue)만 콕 집어 개별적으로 썸네일을 재추출(upsert)할 수 있는 안전한 툴로 전면 개편.[cite: 5]
* **UI/UX 개선:** 자료실 카드의 관리자 툴바에 '표지 재생성(RefreshCw)' 버튼 즉각 배치.[cite: 5]

### 🎉 [ v1.5.2 ] Database URL Migration & Infrastructure Hardening
**구형 Supabase URL의 영구적 마이그레이션 및 데이터 무결성 확보**[cite: 5]
* **DB 주소 일괄 변환 도구:** 데이터베이스(장부)를 전수 조사하여 JSON 내부에 숨겨진 옛날 도메인 주소들을 현재 환경변수(`VITE_SUPABASE_URL`) 주소로 영구 치환하는 관리자 전용 툴 탑재.[cite: 5]
* **인프라 정합성 검증:** 파일 로드 시 실시간으로 주소 규격을 보정해주는 `getValidSupabaseUrl` 로직 적용.[cite: 5]

### 🎉 [ v1.5.1 ] Storage Optimization & Thumbnail Architecture Overhaul
**스토리지 최적화 및 고아 파일(Orphaned File) 누수 완벽 차단**[cite: 5]
* **업로드 시점 썸네일 생성:** 사용자가 조회 시 PDF를 다운로드해 표지를 만들던 방식에서, 관리자가 업로드하는 시점에 단 1회 썸네일(.jpg)을 추출해 저장하도록 아키텍처 개편. Egress 트래픽 99% 절감.[cite: 5]
* **완전 삭제 로직 도입:** 호수 삭제 시 DB 레코드 지우기 전 Storage의 연결된 PDF 및 표지 이미지를 먼저 삭제하여 용량 누수 원천 차단.[cite: 5]

### 🎉 [ v1.5.0 ] Server-Side Pagination & Search Optimization
**대용량 데이터 처리를 위한 서버 사이드 최적화 및 검색 기능 고도화**[cite: 5]
* **서버 사이드 페이지네이션:** 뉴스(20개) 및 소식(10개) 단위로 Supabase `.range()` API를 활용.[cite: 5]
* **디바운스(Debounce) 검색 최적화:** 400ms 지연 및 `.ilike()` 쿼리를 통한 서버 사이드 필터링 완비.[cite: 5]

### 🎉 [ v1.4.0 ] News Search UI & Mobile Layout
**뉴스 실시간 검색 UI 도입 및 반응형 레이아웃 개선**[cite: 5]
* **검색 포털 UI:** 뉴스 피드 상단에 Soft UI 기반 검색창 탑재 및 모바일 우선 레이아웃 튜닝.[cite: 5]

### 🎉 [ v1.3.0 ] PDF Viewer Engine Overhaul & UI/UX Refinement
**PDF 렌더링 엔진 전면 교체 및 자료실 UI/UX 고도화**[cite: 5]
* **초고속 오프스크린 PDF 렌더링:** 가상 캔버스(Offscreen Canvas) 캐싱 방식으로 0.01초 만에 즉시 로드.[cite: 5]
* **스마트 표지 추출 및 자동 크롭(Smart Crop):** 인쇄용 두쪽보기(스프레드) 형태일 경우, 앞표지에 해당하는 우측 절반만 정확히 잘라내어(Crop) 썸네일로 자동 생성.[cite: 5]
* **자료실 카드 레이아웃 구조 개편:** 모바일에서 텍스트 잘림 현상을 방지하기 위해 Flexbox(`shrink-0`, `flex-1`) 적용.[cite: 5]

### 🎉 [ v1.2.0 ] SNS Share Optimization & App Deep Linking
**SNS 공유 기능 렌더링 최적화 및 네이티브 앱 연동**[cite: 5]
* **카카오톡 공유 최적화:** 앱 자체 크롤러가 사이트의 썸네일을 자동 생성하도록 유도.[cite: 5]
* **네이버 밴드 딥링크(App Intent) 연동:** 브라우저를 거치지 않고 네이버 밴드 앱이 직접 실행(`bandapp://`)되도록 분기 로직 적용.[cite: 5]

### 🎉 [ v1.1.0 ] Naming & UI Refinements
**공식 브랜딩 적용 및 마이너 UX 개선**[cite: 5]
* **공식 명칭 확정:** '함께누리웹진'으로 공식 명칭 최종 확정 및 검색 해시태그 최적화 적용.[cite: 5]

### 🎉 [ v1.0.0 ] Official Release
**지식 플랫폼 정식 출시 및 아키텍처 안정화**[cite: 5]
* **홈 화면 탭 UI 도입 & 뉴스 파서:** 구글 뉴스 출처와 제목을 정규식으로 다듬어 세련된 노출 완비.[cite: 5]
* **API 크레딧 최적화:** SessionStorage를 활용해 중복 조회수 차단.[cite: 5]

---

## 🗺️ 향후 로드맵 (Roadmap)
기존에 목표했던 **컴포넌트 단위 구조 모듈화 및 TypeScript 마이그레이션(v1.6.0)**이 성공적으로 완료됨에 따라 다음 마일스톤을 준비합니다.[cite: 5]
* **추천(좋아요) 시스템 활성화:** Supabase DB 내 `likes` 데이터 필드 연동 및 자료실 추천순 정렬 완벽 반영[cite: 5]
* **PWA (Progressive Web App) 지원:** 오프라인 환경 캐시 지원 및 모바일 기기 '홈 화면에 앱 설치' 기능 제공[cite: 5]
* **DB 접근 정책(RLS) 보안 고도화:** 인증된 사용자 및 익명 사용자의 읽기/쓰기 권한(Row-Level Security) 세분화[cite: 5]
