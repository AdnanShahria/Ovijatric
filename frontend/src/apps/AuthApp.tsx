import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '../contexts/ThemeContext'

function AuthApp() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<div className="p-8">Auth Page</div>} />
          <Route path="/auth.html" element={<div className="p-8">Auth Page</div>} />
          <Route path="*" element={<div className="p-8">404 - Auth Not Found</div>} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default AuthApp
