import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // 💡 청크 분할(Code Splitting) 설정: 모바일 초기 로딩 속도 극대화
    rollupOptions: {
      output: {
        manualChunks: {
          // 1. 핵심 리액트 코어 분리 (거의 변하지 않는 파일)
          'react-vendor': ['react', 'react-dom'],
          
          // 2. 외부 통신 및 데이터베이스 클라이언트 분리 (용량이 큰 패키지)
          'supabase-vendor': ['@supabase/supabase-js'],
          
          // 3. 무거운 UI 아이콘 라이브러리 분리
          'ui-vendor': ['lucide-react']
        }
      }
    },
    // 빌드 시 파일 크기 경고 기준을 500kb -> 1000kb로 상향 (청크 분할 시 경고 최소화)
    chunkSizeWarningLimit: 1000,
  }
})
