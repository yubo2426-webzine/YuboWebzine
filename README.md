# 🌟 아이들의 미래를 잇는 지식 플랫폼 (유보통합 웹진)

본 프로젝트는 유보통합 정책에 발맞춰, 지역 내 유보통합 자원(체험처) 지도와 최신 교육 뉴스, 월간 웹진 자료를 제공하는 **모바일 우선(Mobile-First) 반응형 웹 플랫폼**입니다.

사용자의 탐색 피로도를 낮추고, 유아 친화적인 디자인과 부드러운 다크모드를 통해 쾌적한 정보 탐색 환경을 제공합니다.

## 🚀 기술 스택 (Tech Stack)
- **Frontend:** React 19, Vite, Tailwind CSS, Lucide React Icons
- **Backend/DB:** Supabase (Database, Storage)
- **API:** Kakao Maps API (Geolocation, Custom Markers)
- **Deployment:** Vercel (CI/CD)
- **Features:** 하이브리드 PDF 뷰어(pdf.js), 실시간 조회수 트래킹, 4대 소셜 공유 연동

---

## 🔐 관리자 모드 접속 안내 (Hidden Admin Mode)
개인정보 보호(로그인/회원가입 정보 수집 원천 차단)를 위해 **히든 패스코드** 방식을 사용합니다.
1. 화면 맨 하단(Footer)의 카피라이트 텍스트(`© 2026 아이들의 미래를 잇는...`)를 **빠르게 5번 클릭**합니다.
2. 프롬프트 창에 관리자 암호(`admin1234` 또는 설정된 환경변수)를 입력합니다.
3. 상단 메뉴에 `[관리자 모드]` 뱃지가 활성화되며 편집/삭제/자료 추가 버튼이 나타납니다.

---

## 📜 프로젝트 진행 로그 (Change Log)

### [ v26.6.x ] Soft Dark Mode & Mobile Layout Optimization (Current)
- **소프트 다크모드:** 눈이 아픈 완전 블랙 대신 은은한 네이비(Slate-900) 배경과 야광(Neon)처럼 빛나는 파스텔 배지 조합으로 세련된 다크 테마 완성.
- **모바일 지도 우선 배치(Mobile-First Map):** 모바일 기기 접속 시 지도가 리스트보다 상단에 위치하도록 화면 역전(flex-col-reverse) 적용.
- **관리자 UX 고도화:** 월간 자료실 목록에서 즉시 PDF를 업로드할 수 있는 `[+ 자료 추가]` 퀵 버튼 신설.

### [ v26.4.0 ~ 26.5.0 ] Search Portal & Kid-Friendly Elements
- **홈 화면 검색 포털화:** 홈 화면을 가벼운 검색 포털로 전환. 메인 검색창이나 해시태그 클릭 시 체험자원 지도로 즉시 파라미터를 넘기며 라우팅.
- **생동감 부여:** CSS Keyframe을 활용한 '둥둥 떠다니는 나침반' 애니메이션 및 실시간 날씨/미세먼지 글래스모피즘(Glassmorphism) 위젯 탑재.
- **유아 친화적 감성:** 화면 곳곳에 토끼(Rabbit), 새싹(Sprout), 꽃(Flower2) 등의 아이콘을 적절히 배치하여 따뜻한 분위기 연출.

### [ v26.3.0 ] I-Kkumteo UI/UX Overhaul
- **Soft UI 전면 도입:** 기존 공공기관 스타일(KRDS)을 탈피하여 곡률(rounded-3xl)과 파스텔톤(Sky, Teal, Amber, Rose)을 극대화한 '울산 아이꿈터' 디자인 완벽 벤치마킹.
- **원페이지(One-Page) 대시보드:** 홈 화면에 위젯들을 유기적으로 결합하여 스크롤 한 번에 모든 정보를 파악할 수 있도록 개편.

### [ v26.2.0 ] Privacy Patch & Bottom Sheet
- **개인정보 보호 강화:** 로그인 창 원천 제거 및 히든 관리자 모드 적용, 초상권 보호를 위해 갤러리 기능 완전 삭제.
- **바텀 시트(Bottom Sheet) 적용:** 모바일 환경에서 지도 위 마커 클릭 시 하단에서 스르륵 올라오는 상세 정보 패널 구현.

### [ v26.0.0 ~ v26.1.1 ] Kakao Map Integration & Split View
- **카카오맵 연동:** React 19 엄격 모드(Strict Mode) 충돌 및 백지(White Screen) 버그를 방어하는 커스텀 훅(`useCustomKakaoLoader`) 자체 구축.
- **반응형 스플릿 뷰:** PC 화면에서 좌측 리스트 - 우측 카카오맵으로 이어지는 최적의 레이아웃 완성.
- **데이터 끌어올리기(Lifting State):** 메인 대시보드에 최신 소식 및 웹진 위젯 구현.

### [ v25.9.x ] Social Share & Image Stabilization
- **4대 소셜 공유 연동:** 카카오톡, 밴드, 페이스북, X(트위터) 공유 기능 탑재 및 썸네일 Raw URL 최적화.
- **이미지 안정화:** 외부 링크 엑박 방지를 위해 로컬 Asset 임포트 방식으로 아이콘 전면 교체.

### [ v25.8.0 ~ v25.8.8 ] KRDS System & PDF Engine
- **전자정부 표준(KRDS) 적용:** 초기 UI 신뢰감 향상을 위한 Pretendard GOV 폰트 및 Blue 기반 스타일링.
- **하이브리드 PDF 뷰어:** 모바일 제스처(핀치 줌, 스와이프)와 PC 툴바 기능을 통합한 자체 PDF 렌더링 엔진 구축.
- **조회수 트래킹:** 콘텐츠 클릭 시 DB 뷰 카운트 실시간 업데이트 로직 구현.

---

## React + Vite (Base Template Info)

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.
Currently, two official plugins are available:
- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
