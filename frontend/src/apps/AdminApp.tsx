import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { ThemeProvider } from '../contexts/ThemeContext'
import { AppLayout } from '../components/admin/AppLayout'

const DashboardPage = lazy(() => import('../pages/Admin/DashboardPage').then(m => ({ default: m.DashboardPage })))
const BannersPage = lazy(() => import('../pages/Admin/BannersPage').then(m => ({ default: m.BannersPage })))
const EventsPage = lazy(() => import('../pages/Admin/EventsPage').then(m => ({ default: m.EventsPage })))
const GalleryPage = lazy(() => import('../pages/Admin/GalleryPage.tsx').then(m => ({ default: m.GalleryPage })))
const AdminGalleryAlbumPage = lazy(() => import('../pages/Admin/AdminGalleryAlbumPage').then(m => ({ default: m.AdminGalleryAlbumPage })))
const BlogPage = lazy(() => import('../pages/Admin/BlogPage.tsx').then(m => ({ default: m.BlogPage })))
const AboutPage = lazy(() => import('../pages/Admin/AboutPage.tsx').then(m => ({ default: m.AboutPage })))
const MapPinsPage = lazy(() => import('../pages/Admin/MapPinsPage').then(m => ({ default: m.MapPinsPage })))
const AdminAuthPage = lazy(() => import('../pages/Admin/AdminAuthPage').then(m => ({ default: m.AdminAuthPage })))

function ProtectedRoute() {
  const isAuthenticated = !!localStorage.getItem('auth_token')
  return isAuthenticated ? <AppLayout /> : <Navigate to="/admin/auth" replace />
}

function AdminApp() {
  return (
    <ThemeProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div></div>}>
          <Routes>
            <Route path="/admin" element={<ProtectedRoute />}>
              <Route index element={<DashboardPage />} />
              <Route path="banners" element={<BannersPage />} />
              <Route path="events" element={<EventsPage />} />
              <Route path="gallery" element={<GalleryPage />} />
              <Route path="gallery/album/:id" element={<AdminGalleryAlbumPage />} />
              <Route path="blog" element={<BlogPage />} />
              <Route path="map-pins" element={<MapPinsPage />} />
              <Route path="about" element={<AboutPage />} />
            </Route>
            <Route path="/admin/auth" element={<AdminAuthPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default AdminApp
