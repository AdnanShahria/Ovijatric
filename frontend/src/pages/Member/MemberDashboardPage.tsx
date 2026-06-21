import { useState, useEffect } from 'react'
import { dynamicGet } from '../../utils/apiClient'
import { CalendarDays, Ticket, ImageIcon, User } from 'lucide-react'

export function MemberDashboardPage() {
  const [stats, setStats] = useState({ joinedEvents: 0, gallerySubmissions: 0 })
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          const parsed = JSON.parse(storedUser)
          setUser(parsed)
          
          // Fetch my registrations
          const myRegs = await dynamicGet('registrations', { eq: { user_id: parsed.id } })
          
          // Fetch my gallery submissions
          const myGals = await dynamicGet('gallery', { eq: { user_id: parsed.id } })

          setStats({
            joinedEvents: myRegs.length,
            gallerySubmissions: myGals.length
          })
        }
      } catch (error) {
        console.error('Failed to fetch member stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-adventure-orange"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-[#1B4332]/10 rounded-full flex items-center justify-center">
          <User className="w-8 h-8 text-[#1B4332]" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#1B4332]">Welcome back, {user?.name}!</h1>
          <p className="text-slate-600">Here's what's happening with your account today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Events Joined</p>
            <p className="text-2xl font-bold text-[#1B4332]">{stats.joinedEvents}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center shrink-0">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Gallery Submissions</p>
            <p className="text-2xl font-bold text-[#1B4332]">{stats.gallerySubmissions}</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-[#1B4332] to-[#2d5c45] rounded-2xl shadow-sm text-white p-6 flex flex-col justify-center hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-lg mb-2">Ready for your next adventure?</h3>
          <p className="text-white/80 text-sm mb-4">Browse our upcoming events and join the community.</p>
          <a href="/member/events" className="inline-block bg-adventure-orange hover:bg-orange-600 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors self-start">
            Browse Events
          </a>
        </div>
      </div>
    </div>
  )
}
