import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { ThemeProvider } from '../contexts/ThemeContext'
import { MemberLayout } from '../components/member/MemberLayout'

const MemberDashboardPage = lazy(() => import('../pages/Member/MemberDashboardPage').then(m => ({ default: m.MemberDashboardPage })))
const MemberEventsPage = lazy(() => import('../pages/Member/MemberEventsPage').then(m => ({ default: m.MemberEventsPage })))
const MemberMyEventsPage = lazy(() => import('../pages/Member/MemberMyEventsPage').then(m => ({ default: m.MemberMyEventsPage })))
const MemberGalleryPage = lazy(() => import('../pages/Member/MemberGalleryPage').then(m => ({ default: m.MemberGalleryPage })))

function ProtectedRoute() {
  const isAuthenticated = !!localStorage.getItem('auth_token')
  return isAuthenticated ? <MemberLayout /> : <Navigate to="/auth" replace />
}

function MemberApp() {
  return (
    <ThemeProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div></div>}>
          <Routes>
            <Route path="/member" element={<ProtectedRoute />}>
              <Route index element={<MemberDashboardPage />} />
              <Route path="events" element={<MemberEventsPage />} />
              <Route path="my-events" element={<MemberMyEventsPage />} />
              <Route path="gallery" element={<MemberGalleryPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default MemberApp
