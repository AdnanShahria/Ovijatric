import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Image as ImageIcon, Calendar, LogOut, Menu, X, BookOpen, Info, MapPin, Compass } from 'lucide-react'
import { useState } from 'react'

export function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    window.location.href = '/admin/auth'
  }

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Banners', path: '/admin/banners', icon: ImageIcon },
    { name: 'Events', path: '/admin/events', icon: Calendar },
    { name: 'Gallery', path: '/admin/gallery', icon: ImageIcon },
    { name: 'Blog', path: '/admin/blog', icon: BookOpen },
    { name: 'Map Pins', path: '/admin/map-pins', icon: MapPin },
    { name: 'About Us', path: '/admin/about', icon: Info },
  ]

  return (
    <div className="min-h-screen bg-[#eef5ee] bg-gradient-to-br from-[#f8fcf8] via-[#eef5ee] to-[#e6eee6] flex text-[#1B4332] font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-[#102d21]/50 backdrop-blur-sm z-20 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 w-64 bg-[#e0ece0] border-r border-[#1B4332]/15 z-30 transform transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="h-16 flex items-center px-6 border-b border-[#1B4332]/10 shrink-0">
            <Link to="/admin" className="flex items-center gap-2" onClick={() => setIsSidebarOpen(false)}>
              <Compass className="w-6 h-6 text-[#FF6B35]" />
              <h1 className="text-xl font-bold text-[#1B4332] tracking-wider font-garamond">Ovijatrik Admin</h1>
            </Link>
            <button 
              className="ml-auto lg:hidden text-[#1B4332]/60 hover:text-[#1B4332]"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto py-6">
            <ul className="space-y-2 px-4">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path
                const Icon = item.icon
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all duration-200 transform ${
                        isActive 
                          ? 'bg-[#FF6B35] text-white border-[#FF6B35] shadow-md shadow-[#FF6B35]/25 font-bold translate-x-1.5' 
                          : 'bg-white/80 text-[#1B4332]/85 border-[#1B4332]/10 shadow-sm hover:bg-white hover:text-[#1B4332] hover:border-[#1B4332]/25 hover:translate-x-1.5'
                      }`}
                    >
                      <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-white' : 'text-[#1B4332]/60'}`} />
                      <span className="text-sm font-semibold tracking-wide">{item.name}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-[#1B4332]/10 shrink-0">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3.5 py-2.5 w-full rounded-xl bg-white/80 border border-[#1B4332]/10 text-[#1B4332]/85 shadow-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-200 transform hover:translate-y-[-1px]"
            >
              <LogOut className="w-4.5 h-4.5 shrink-0" />
              <span className="text-sm font-semibold tracking-wide">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Container */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="h-16 lg:hidden flex items-center px-4 bg-white/90 backdrop-blur-md border-b border-[#1b4332]/10 sticky top-0 z-10">
          <button 
            className="text-[#1B4332] hover:text-[#FF6B35] transition-colors p-1"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="ml-4 flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#FF6B35]" />
            <span className="font-extrabold text-[#1B4332] tracking-wider font-garamond text-lg">Ovijatrik Admin</span>
          </div>
        </header>

        {/* Content Wrapper */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

