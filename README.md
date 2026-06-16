# 🌟 함께누리웹진 (유보통합 웹진)

본 프로젝트는 유보통합 정책에 발맞춰, 지역 내 유보통합 자원(체험처) 지도와 최신 교육 뉴스, 월간 웹진 자료를 제공하는 **모바일 우선(Mobile-First) 반응형 웹 플랫폼**입니다.

사용자의 탐색 피로도를 낮추고, 유아 친화적인 디자인과 부드러운 다크모드를 통해 쾌적한 정보 탐색 환경을 제공합니다.

## 🚀 기술 스택 (Tech Stack)
* **Frontend:** React 19, Vite, Tailwind CSS, Lucide React Icons, **TypeScript**
* **Backend/DB:** Supabase (Database, Storage)
* **API:** Kakao Maps API (Geolocation, Custom Markers), Kakao Share JS SDK
* **Deployment:** Vercel (CI/CD)
* **Features:** 하이브리드 PDF 뷰어(pdf.js), 실시간 조회수 트래킹, 네이티브 앱 딥링크(App Intent) 공유, 서버 사이드 페이지네이션 및 검색

---

## 🔐 관리자 모드 접속 안내 (Hidden Admin Mode)
개인정보 보호(로그인/회원가입 정보 수집 원천 차단)를 위해 **히든 패스코드** 방식을 사용합니다.
1. 화면 맨 하단(Footer)의 카피라이트 텍스트(`© 2026 함께누리웹진. All rights reserved.`)를 **빠르게 5번 클릭**합니다.
2. 프롬프트 창에 관리자 암호(`admin1234` 또는 설정된 환경변수)를 입력합니다.
3. 상단 메뉴에 `[관리자 모드]` 뱃지가 활성화되며 편집/삭제/자료 추가 버튼이 나타납니다.

---

## 📜 프로젝트 진행 로그 (Change Log)

### 🎉 [ v1.6.0 ] TypeScript Migration & UI/UX Enhancements (Current)
**전면적인 TypeScript 마이그레이션 및 핵심 편의 기능 고도화**
* **아키텍처 모듈화 및 TS 전환 (로드맵 달성):** 단일 `App.jsx` 파일에 집중되었던 로직을 `src/components`, `src/lib` 등으로 완벽하게 분리. JavaScript 기반 코드를 TypeScript(.tsx, .ts)로 전면 전환하여 구조적 복잡도 해소 및 타입 안정성 극대화.
* **자료실 정렬 시스템 구축:** 호수(날짜)순, 인기 조회순, 추천순 정렬 드롭다운과 오름차순/내림차순(⬆️/⬇️) 토글 버튼을 도입하여 대량의 데이터 탐색 편의성 제공.
* **스마트 PDF 뷰어 고도화:** 모바일 환경에 최적화된 가로 꽉 맞춤(Width-fit) 스크롤 뷰 구현 및 사용자가 문서 형태에 따라 직접 전환할 수 있는 '한쪽 보기 / 양쪽 보기' 토글 기능 탑재.
* **관리자 경험(Admin UX) 개선:** '1이슈 1자료' 원칙에 맞춰 자료 등록 시 중복 제목 입력창 제거. 이벤트 버블링(클릭 겹침)으로 인한 관리자 모드 제어 버튼 미작동 버그 완벽 해결.
* **뉴스 자동화(Cron) 무결성 확보:** 구글 뉴스 RSS의 봇 차단 정책을 우회하기 위한 `User-Agent` 명찰 부여 및 서버리스 자동 3회 재시도(Retry) 로직 탑재. Vercel 콜드 스타트 시 발생하는 라우팅 증발(404) 버그를 막기 위해 `vercel.json` 내 백엔드 함수 영구 고정 설정.
* **상단 네비게이션(Navbar) 최적화:** 탭명 오기재 오류('체험자원 지도' 중복)를 '뉴스'로 수정 완료.

### 🎉 [ v1.5.3 ] Selective Cover Regeneration & Traffic Optimization
**트래픽 최적화를 위한 개별 표지 재생성 아키텍처 도입**
* **개별 표지 강제 재생성 도구:** 모든 PDF를 일괄 다운로드하여 발신 트래픽 폭탄을 유발하던 기존 로직 폐기. 특정 호수(Issue)만 콕 집어 개별적으로 썸네일을 재추출(upsert)할 수 있는 안전한 툴로 전면 개편.
* **UI/UX 개선:** 자료실 카드의 관리자 툴바에 '표지 재생성(RefreshCw)' 버튼 즉각 배치.

### 🎉 [ v1.5.2 ] Database URL Migration & Infrastructure Hardening
**구형 Supabase URL의 영구적 마이그레이션 및 데이터 무결성 확보**
* **DB 주소 일괄 변환 도구:** 데이터베이스(장부)를 전수 조사하여 JSON 내부에 숨겨진 옛날 도메인 주소들을 현재 환경변수(`VITE_SUPABASE_URL`) 주소로 영구 치환하는 관리자 전용 툴 탑재.
* **인프라 정합성 검증:** 파일 로드 시 실시간으로 주소 규격을 보정해주는 `getValidSupabaseUrl` 로직 적용.

### 🎉 [ v1.5.1 ] Storage Optimization & Thumbnail Architecture Overhaul
**스토리지 최적화 및 고아 파일(Orphaned File) 누수 완벽 차단**
* **업로드 시점 썸네일 생성:** 사용자가 조회 시 PDF를 다운로드해 표지를 만들던 방식에서, 관리자가 업로드하는 시점에 단 1회 썸네일(.jpg)을 추출해 저장하도록 아키텍처 개편. Egress 트래픽 99% 절감.
* **완전 삭제 로직 도입:** 호수 삭제 시 DB 레코드 지우기 전 Storage의 연결된 PDF 및 표지 이미지를 먼저 삭제하여 용량 누수 원천 차단.

### 🎉 [ v1.5.0 ] Server-Side Pagination & Search Optimization
**대용량 데이터 처리를 위한 서버 사이드 최적화 및 검색 기능 고도화**
* **서버 사이드 페이지네이션:** 뉴스(20개) 및 소식(10개) 단위로 Supabase `.range()` API를 활용.
* **디바운스(Debounce) 검색 최적화:** 400ms 지연 및 `.ilike()` 쿼리를 통한 서버 사이드 필터링 완비.

### 🎉 [ v1.4.0 ] News Search UI & Mobile Layout
**뉴스 실시간 검색 UI 도입 및 반응형 레이아웃 개선**
* **검색 포털 UI:** 뉴스 피드 상단에 Soft UI 기반 검색창 탑재 및 모바일 우선 레이아웃 튜닝.

### 🎉 [ v1.3.0 ] PDF Viewer Engine Overhaul & UI/UX Refinement
**PDF 렌더링 엔진 전면 교체 및 자료실 UI/UX 고도화**
* **초고속 오프스크린 PDF 렌더링:** 가상 캔버스(Offscreen Canvas) 캐싱 방식으로 0.01초 만에 즉시 로드.
* **스마트 표지 추출 및 자동 크롭(Smart Crop):** 인쇄용 두쪽보기(스프레드) 형태일 경우, 앞표지에 해당하는 우측 절반만 정확히 잘라내어(Crop) 썸네일로 자동 생성.
* **자료실 카드 레이아웃 구조 개편:** 모바일에서 텍스트 잘림 현상을 방지하기 위해 Flexbox(`shrink-0`, `flex-1`) 적용.

### 🎉 [ v1.2.0 ] SNS Share Optimization & App Deep Linking
**SNS 공유 기능 렌더링 최적화 및 네이티브 앱 연동**
* **카카오톡 공유 최적화:** 앱 자체 크롤러가 사이트의 썸네일을 자동 생성하도록 유도.
* **네이버 밴드 딥링크(App Intent) 연동:** 브라우저를 거치지 않고 네이버 밴드 앱이 직접 실행(`bandapp://`)되도록 분기 로직 적용.

### 🎉 [ v1.1.0 ] Naming & UI Refinements
**공식 브랜딩 적용 및 마이너 UX 개선**
* **공식 명칭 확정:** '함께누리웹진'으로 공식 명칭 최종 확정 및 검색 해시태그 최적화 적용.

### 🎉 [ v1.0.0 ] Official Release
**지식 플랫폼 정식 출시 및 아키텍처 안정화**
* **홈 화면 탭 UI 도입 & 뉴스 파서:** 구글 뉴스 출처와 제목을 정규식으로 다듬어 세련된 노출 완비.
* **API 크레딧 최적화:** SessionStorage를 활용해 중복 조회수 차단.

---

## 🗺️ 향후 로드맵 (Roadmap)
기존에 목표했던 **컴포넌트 단위 구조 모듈화 및 TypeScript 마이그레이션(v1.6.0)**이 성공적으로 완료됨에 따라 다음 마일스톤을 준비합니다.
* **추천(좋아요) 시스템 활성화:** Supabase DB 내 `likes` 데이터 필드 연동 및 자료실 추천순 정렬 완벽 반영
* **PWA (Progressive Web App) 지원:** 오프라인 환경 캐시 지원 및 모바일 기기 '홈 화면에 앱 설치' 기능 제공
* **DB 접근 정책(RLS) 보안 고도화:** 인증된 사용자 및 익명 사용자의 읽기/쓰기 권한(Row-Level Security) 세분화
