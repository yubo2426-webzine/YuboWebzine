import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // 💡 청크 분할(Code Splitting) 설정: 모바일 초기 로딩 속도 극대화
    rollupOptions: {
      output: {
        // 객체(Object)가 아닌 함수(Function) 형태로 변경
        manualChunks(id) {
          // node_modules 폴더 안의 패키지들만 타겟으로 삼습니다.
          if (id.includes('node_modules')) {
            // 1. 핵심 리액트 코어 분리
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            // 2. 외부 통신 및 데이터베이스 클라이언트 분리
            if (id.includes('@supabase/supabase-js')) {
              return 'supabase-vendor';
            }
            // 3. 무거운 UI 아이콘 라이브러리 분리
            if (id.includes('lucide-react')) {
              return 'ui-vendor';
            }
            // 그 외의 라이브러리들도 기본 벤더 청크로 묶어서 분리 (선택 사항)
            return 'vendor';
          }
        }
      }
    },
    // 빌드 시 파일 크기 경고 기준을 500kb -> 1000kb로 상향
    chunkSizeWarningLimit: 1000,
  }
})
