import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '../contexts/ThemeContext'
import { HomePage } from '../pages/Home/HomePage'
import { Chatbot } from '../components/shared/Chatbot'

function IndexApp() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          {/* Add more public pages here: About, Events, Gallery, Team, Blog, Contact */}
          <Route path="*" element={<div className="p-8 text-center mt-20 text-2xl font-bold">404 - Adventure Not Found</div>} />
        </Routes>
        <Chatbot />
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default IndexApp
