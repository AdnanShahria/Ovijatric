import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '../contexts/ThemeContext'
import { AppLayout } from '../components/admin/AppLayout'
import { DashboardPage } from '../pages/Admin/DashboardPage'
import { BannersPage } from '../pages/Admin/BannersPage'
import { EventsPage } from '../pages/Admin/EventsPage'

function AdminApp() {
  const isAuthenticated = !!localStorage.getItem('auth_token')

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/admin" element={isAuthenticated ? <AppLayout /> : <Navigate to="/auth" replace />}>
            <Route index element={<DashboardPage />} />
            <Route path="banners" element={<BannersPage />} />
            <Route path="events" element={<EventsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default AdminApp
