import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import MemberApp from './apps/MemberApp'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MemberApp />
  </StrictMode>,
)
