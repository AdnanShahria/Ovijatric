import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '../contexts/ThemeContext'
import { MemberLayout } from '../components/member/MemberLayout'
import { MemberDashboardPage } from '../pages/Member/MemberDashboardPage'
import { MemberEventsPage } from '../pages/Member/MemberEventsPage'
import { MemberMyEventsPage } from '../pages/Member/MemberMyEventsPage'
import { MemberGalleryPage } from '../pages/Member/MemberGalleryPage'

function ProtectedRoute() {
  const isAuthenticated = !!localStorage.getItem('auth_token')
  return isAuthenticated ? <MemberLayout /> : <Navigate to="/auth" replace />
}

function MemberApp() {
  return (
    <ThemeProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/member" element={<ProtectedRoute />}>
            <Route index element={<MemberDashboardPage />} />
            <Route path="events" element={<MemberEventsPage />} />
            <Route path="my-events" element={<MemberMyEventsPage />} />
            <Route path="gallery" element={<MemberGalleryPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default MemberApp
