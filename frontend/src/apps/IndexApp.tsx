import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { ThemeProvider } from '../contexts/ThemeContext'
import { Chatbot } from '../components/shared/Chatbot'
import { Navbar } from '../components/shared/Navbar'
import { Footer } from '../components/shared/Footer'

const HomePage = lazy(() => import('../pages/Home/HomePage').then(m => ({ default: m.HomePage })))
const EventDetailsPage = lazy(() => import('../pages/Events/EventDetailsPage').then(m => ({ default: m.EventDetailsPage })))
const BlogDetailsPage = lazy(() => import('../pages/Blog/BlogDetailsPage').then(m => ({ default: m.BlogDetailsPage })))
const GalleryDetailsPage = lazy(() => import('../pages/Home/GalleryDetailsPage').then(m => ({ default: m.GalleryDetailsPage })))
const GalleryAlbumPage = lazy(() => import('../pages/Home/GalleryAlbumPage').then(m => ({ default: m.GalleryAlbumPage })))

function IndexApp() {
  return (
    <ThemeProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">
            <Suspense fallback={<div className="flex h-[60vh] items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div></div>}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/events/:id" element={<EventDetailsPage />} />
                <Route path="/blog/:id" element={<BlogDetailsPage />} />
                <Route path="/gallery/album/:id" element={<GalleryAlbumPage />} />
                <Route path="/gallery/:id" element={<GalleryDetailsPage />} />
                <Route path="*" element={<div className="p-8 text-center mt-20 text-2xl font-bold">404 - Adventure Not Found</div>} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
        <Chatbot />
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default IndexApp
