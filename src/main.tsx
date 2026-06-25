import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// ✅ [수정됨] React 전용 KRDS 스타일시트 연결
import 'krds-react/dist/index.css'

// 🚨 .jsx 확장자 제거
import App from './App'

// 💡 개발자 이스터에그: F12(개발자 도구) 콘솔창에서만 보이는 은밀한 발자취입니다.
console.log(
  "%c🚀 함께누리웹진\n%c2026년 당시 유초특과 이두호로부터 시작", 
  "font-size: 20px; font-weight: bold; color: #10b981;", 
  "font-size: 13px; color: #64748b; font-style: italic; margin-top: 4px;"
);

// 🚨 root 뒤에 ! 추가
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
