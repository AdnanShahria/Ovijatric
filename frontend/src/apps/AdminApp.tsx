import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '../contexts/ThemeContext'
import { AppLayout } from '../components/admin/AppLayout'
import { DashboardPage } from '../pages/Admin/DashboardPage'
import { BannersPage } from '../pages/Admin/BannersPage'
import { EventsPage } from '../pages/Admin/EventsPage'
import { GalleryPage } from '../pages/Admin/GalleryPage.tsx'
import { BlogPage } from '../pages/Admin/BlogPage.tsx'
import { AboutPage } from '../pages/Admin/AboutPage.tsx'
import { MapPinsPage } from '../pages/Admin/MapPinsPage'
import { AdminAuthPage } from '../pages/Admin/AdminAuthPage'

function ProtectedRoute() {
  const isAuthenticated = !!localStorage.getItem('auth_token')
  return isAuthenticated ? <AppLayout /> : <Navigate to="/admin/auth" replace />
}

function AdminApp() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/admin" element={<ProtectedRoute />}>
            <Route index element={<DashboardPage />} />
            <Route path="banners" element={<BannersPage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="gallery" element={<GalleryPage />} />
            <Route path="blog" element={<BlogPage />} />
            <Route path="map-pins" element={<MapPinsPage />} />
            <Route path="about" element={<AboutPage />} />
          </Route>
          <Route path="/admin/auth" element={<AdminAuthPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default AdminApp
