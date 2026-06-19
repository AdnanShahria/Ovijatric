import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '../contexts/ThemeContext'
import { HomePage } from '../pages/Home/HomePage'
import { EventDetailsPage } from '../pages/Events/EventDetailsPage'
import { BlogDetailsPage } from '../pages/Blog/BlogDetailsPage'
import { GalleryDetailsPage } from '../pages/Home/GalleryDetailsPage'
import { Chatbot } from '../components/shared/Chatbot'
import { Navbar } from '../components/shared/Navbar'
import { Footer } from '../components/shared/Footer'

function IndexApp() {
  return (
    <ThemeProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/events/:id" element={<EventDetailsPage />} />
              <Route path="/blog/:id" element={<BlogDetailsPage />} />
              <Route path="/gallery/:id" element={<GalleryDetailsPage />} />
              <Route path="*" element={<div className="p-8 text-center mt-20 text-2xl font-bold">404 - Adventure Not Found</div>} />
            </Routes>
          </main>
          <Footer />
        </div>
        <Chatbot />
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default IndexApp
