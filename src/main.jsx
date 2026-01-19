import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// 👇 [핵심] 이 줄을 꼭 추가해야 KRDS 스타일(폰트 등)이 작동합니다!
import '@krds-ui/core/dist/style.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)