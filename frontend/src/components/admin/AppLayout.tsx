import { Outlet } from 'react-router-dom'
import { Home, Image as ImageIcon, Calendar, Users, FileText, MessageSquare, LogOut } from 'lucide-react'

export const AppLayout = () => {
  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    window.location.href = '/auth'
  }

  return (
    <div className="flex h-[100dvh] bg-background text-white overflow-hidden">
      <aside className="hidden md:flex w-64 flex-col border-r border-white/5 bg-slate-900/50 p-4">
        <div className="mb-8 px-3">
          <h2 className="text-xl font-bold text-primary">Ovijatrik Admin</h2>
        </div>
        <nav className="flex-1 space-y-2">
          <a href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-slate-300 hover:text-white">
            <Home size={18} /> Dashboard
          </a>
          <a href="/admin/events" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-slate-300 hover:text-white">
            <Calendar size={18} /> Events
          </a>
          <a href="/admin/gallery" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-slate-300 hover:text-white">
            <ImageIcon size={18} /> Gallery
          </a>
          <a href="/admin/team" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-slate-300 hover:text-white">
            <Users size={18} /> Team
          </a>
          <a href="/admin/blog" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-slate-300 hover:text-white">
            <FileText size={18} /> Blog
          </a>
          <a href="/admin/messages" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-slate-300 hover:text-white">
            <MessageSquare size={18} /> Messages
          </a>
        </nav>
        <div className="mt-auto">
          <button onClick={handleLogout} className="flex w-full items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-red-400 hover:text-red-300">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
