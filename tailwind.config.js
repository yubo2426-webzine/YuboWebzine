/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    // 만약 krds-react 내부 스타일도 Tailwind로 제어하려면 아래 경로 추가 (선택 사항)
    "./node_modules/krds-react/**/*.{js,ts,jsx,tsx}"
  ],
  // ✅ [v25.7.1] 다크모드 엔진을 'class' 방식으로 명시 (필수)
  darkMode: 'class', 
  theme: {
    extend: {
      fontFamily: {
        // ✅ [KRDS] 기본 sans 폰트를 전자정부 표준 서체로 변경
        // index.html에서 로드한 폰트 이름과 일치해야 합니다.
        sans: ['"Pretendard GOV"', 'Pretendard', 'Apple SD Gothic Neo', 'sans-serif'],
      },
      // ✅ [KRDS] 디자인 토큰 연결 (선택 사항: 3단계 미리보기)
      // 이렇게 하면 className="bg-primary" 사용 시 KRDS 파란색이 적용됩니다.
      colors: {
        primary: {
          DEFAULT: 'var(--krds-color-primary-50)', // KRDS 기본 파랑
          600: '#2563EB', // 기존 코드 호환용 (Fallback)
        }
      }
    },
  },
  plugins: [
    // require('@krds-ui/tailwindcss-plugin') 
    // ▲ 주의: krds-react 설치 시 이 플러그인이 없으면 빌드 에러가 날 수 있으므로 일단 주석 처리합니다.
  ],
}
