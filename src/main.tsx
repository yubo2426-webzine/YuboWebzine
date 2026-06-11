import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// ✅ [수정됨] React 전용 KRDS 스타일시트 연결
import 'krds-react/dist/index.css'

// 🚨 .jsx 확장자 제거
import App from './App'

// 🚨 root 뒤에 ! 추가
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
