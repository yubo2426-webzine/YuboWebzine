# 🌟 함께누리웹진 (유보통합 웹진)

본 프로젝트는 유보통합 정책에 발맞춰, 지역 내 유보통합 자원(체험처) 지도와 최신 교육 뉴스, 월간 웹진 자료를 제공하는 **모바일 우선(Mobile-First) 반응형 웹 플랫폼**입니다.

사용자의 탐색 피로도를 낮추고, 유아 친화적인 디자인과 부드러운 다크모드를 통해 쾌적한 정보 탐색 환경을 제공합니다.

## 🚀 기술 스택 (Tech Stack)
* **Frontend:** React 19, Vite, Tailwind CSS, Lucide React Icons
* **Backend/DB:** Supabase (Database, Storage)
* **API:** Kakao Maps API (Geolocation, Custom Markers), Kakao Share JS SDK
* **Deployment:** Vercel (CI/CD)
* **Features:** 하이브리드 PDF 뷰어(pdf.js), 실시간 조회수 트래킹, 네이티브 앱 딥링크(App Intent) 공유

---

## 🔐 관리자 모드 접속 안내 (Hidden Admin Mode)
개인정보 보호(로그인/회원가입 정보 수집 원천 차단)를 위해 **히든 패스코드** 방식을 사용합니다.
1. 화면 맨 하단(Footer)의 카피라이트 텍스트(`© 2026 함께누리웹진. All rights reserved.`)를 **빠르게 5번 클릭**합니다.
2. 프롬프트 창에 관리자 암호(`admin1234` 또는 설정된 환경변수)를 입력합니다.
3. 상단 메뉴에 `[관리자 모드]` 뱃지가 활성화되며 편집/삭제/자료 추가 버튼이 나타납니다.

---

## 📜 프로젝트 진행 로그 (Change Log)

### 🎉 [ v1.2.0 ] SNS Share Optimization & App Deep Linking (Current)
**SNS 공유 기능 렌더링 최적화 및 네이티브 앱 연동**
* **카카오톡 공유 최적화 (이중 말풍선 OG 렌더링):** 카카오 JS SDK 템플릿을 `text` 타입으로 변경하고 본문에 URL을 명시하여, 카카오톡 앱 자체 크롤러가 사이트의 썸네일(Open Graph 태그)을 별도의 카드로 자동 생성하도록 유도 (네이티브 앱 공유와 100% 동일한 사용자 경험 제공).
* **네이버 밴드 딥링크(App Intent) 연동:** 모바일(Android/iOS) 기기에서 밴드 공유 시, 웹 브라우저 창(로그인 요구)을 거치지 않고 네이버 밴드 앱이 직접 실행(`bandapp://`)되도록 모바일 분기 로직 적용.
* **공유 UI/UX 심플화 및 토스트 알림:** 사용 빈도가 낮은 플랫폼(페이스북, X)을 제거하여 인터페이스를 최적화하고, Clipboard API를 활용한 링크 복사 기능과 Soft UI 감성의 토스트(Toast) 알림 추가.
* **Vercel 배포 안정성 확보:** 카카오 SDK 스크립트 동적 로딩 최적화 및 빌드 과정의 함수 스코프/문법 에러 완벽 해결.

### 🎉 [ v1.1.0 ] Naming & UI Refinements
**공식 브랜딩 적용 및 마이너 UX 개선**
* **공식 명칭 확정:** 가칭이었던 '아이들의 미래를 잇는 지식 플랫폼'을 수식어를 모두 제외한 **'함께누리웹진'**으로 최종 확정. 로고 텍스트, 소셜 공유 메타데이터, 브라우저 탭 타이틀(`document.title`) 등에 전면 적용.
* **검색 해시태그 최적화 (UX):** 체험자원 검색 하단에 노출되던 지역 해시태그를 전체 나열 방식에서, 사용자의 **최근 검색 기록(localStorage)을 기반으로 최대 5개(1줄)만 노출**되도록 UI 깔끔함 개선.
* **데이터 정렬 로직 수정:** 메인 홈 화면의 '최신 자료실' 섹션에서 최신 호수가 정상적으로 2개 노출되도록 데이터베이스 쿼리를 `id` 내림차순(가장 최근 생성 우선)으로 보강.

### 🎉 [ v1.0.0 ] Official Release
**지식 플랫폼 정식 출시 및 아키텍처 안정화**
* **홈 화면 탭 UI 도입:** 홈 화면에 '최근 소식 / 최근 뉴스'를 스와이프 없이 바로 볼 수 있는 직관적인 탭(Tab) UI 구축 및 Soft UI 적용.
* **체험자원 검색 고도화:** 전북특별자치도 14개 시/군 전체 데이터 및 자원 형태를 콤보박스(Select) UI로 구현하여 검색 편의성 증대.
* **뉴스 데이터 파싱 (Parser):** 구글 뉴스 RSS의 제목 구조(`기사 제목 - 언론사`)를 정규식으로 파싱하여 불필요한 꼬리표를 제거하고, 원출처(언론사명)를 추출해 세련된 뱃지로 노출.
* **API 크레딧 최적화:** SessionStorage를 활용해 단일 세션 내 중복 조회수 업데이트(DB Write)를 차단하여 Supabase 무료 티어 크레딧 누수 완벽 방어.
* **용량 방어 로직:** Supabase Storage 무료 한도에 맞춰 업로드 모달에 50MB 용량 초과 사전 차단 로직 적용.

### [ Beta v0.9.x ] Soft Dark Mode & Mobile Layout Optimization
* **소프트 다크모드:** 눈이 아픈 완전 블랙 대신 은은한 네이비(Slate-900) 배경과 야광(Neon)처럼 빛나는 파스텔 배지 조합으로 세련된 다크 테마 완성.
* **모바일 지도 우선 배치(Mobile-First Map):** 모바일 기기 접속 시 지도가 리스트보다 상단에 위치하도록 화면 역전(flex-col-reverse) 적용.
* **관리자 UX 고도화:** 월간 자료실 목록에서 즉시 PDF를 업로드할 수 있는 `[+ 자료 추가]` 퀵 버튼 신설.

### [ Beta v0.8.x ] Search Portal & Kid-Friendly Elements
* **홈 화면 검색 포털화:** 홈 화면을 가벼운 검색 포털로 전환. 검색 시 체험자원 지도로 즉시 라우팅.
* **생동감 부여:** '둥둥 떠다니는 나침반' 애니메이션 및 실시간 날씨/미세먼지 글래스모피즘 위젯 탑재.

### [ Beta v0.5.x ] I-Kkumteo UI/UX Overhaul & Privacy Patch
* **Soft UI 전면 도입:** 곡률(rounded-[3rem])과 파스텔톤을 극대화한 '울산 아이꿈터' 디자인 완벽 벤치마킹.
* **개인정보 보호 강화:** 로그인 창 원천 제거 및 히든 관리자 모드 적용.
* **카카오맵 연동 최적화:** React 19 엄격 모드 충돌을 방어하는 커스텀 훅(`useCustomKakaoLoader`) 자체 구축.
* **하이브리드 PDF 뷰어:** 모바일 제스처(핀치 줌, 스와이프)를 통합한 자체 PDF 렌더링 엔진 구축.

---

## React + Vite (Base Template Info)

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.
Currently, two official plugins are available:
- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
