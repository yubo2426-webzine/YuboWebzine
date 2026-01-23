import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// ✅ [수정됨] React 전용 KRDS 스타일시트 연결
// 기존의 @krds-ui/core 대신 아래 코드를 사용해야 버튼 등이 제대로 보입니다.
import 'krds-react/dist/index.css'

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
