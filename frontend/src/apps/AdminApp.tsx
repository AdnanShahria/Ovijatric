import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '../contexts/ThemeContext'
import { AppLayout } from '../components/admin/AppLayout'

function AdminApp() {
  const isAuthenticated = !!localStorage.getItem('auth_token')

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/admin" element={isAuthenticated ? <AppLayout /> : <Navigate to="/auth" replace />}>
            <Route index element={<div>Admin Dashboard Home</div>} />
            {/* Additional routes will be placed here */}
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default AdminApp
