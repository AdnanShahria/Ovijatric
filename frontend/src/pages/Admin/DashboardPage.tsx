import { useState, useEffect } from 'react'
import { Users, Activity, FileText, Image as ImageIcon, Loader2 } from 'lucide-react'
import { dynamicGet } from '../../utils/apiClient'

export function DashboardPage() {
  const [counts, setCounts] = useState({
    events: 0,
    gallery: 0,
    users: 0,
    blogs: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [evs, gals, usrs, blgs] = await Promise.all([
          dynamicGet('events'),
          dynamicGet('gallery'),
          dynamicGet('users'),
          dynamicGet('blog_posts')
        ])
        setCounts({
          events: evs.length,
          gallery: gals.length,
          users: usrs.length,
          blogs: blgs.length
        })
      } catch (err) {
        console.error('Failed to load dashboard counts:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const stats = [
    { name: 'Total Events', value: loading ? '...' : String(counts.events), icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { name: 'Gallery Photos', value: loading ? '...' : String(counts.gallery), icon: ImageIcon, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { name: 'Total Users', value: loading ? '...' : String(counts.users), icon: Users, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { name: 'Blog Posts', value: loading ? '...' : String(counts.blogs), icon: FileText, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white tracking-tight">Dashboard Overview</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">{stat.name}</p>
                  <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.bg}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 min-h-[400px]">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <div className="flex flex-col items-center justify-center h-[300px] text-slate-400 border-2 border-dashed border-slate-700 rounded-lg p-6 text-center">
          <Activity className="w-12 h-12 text-slate-600 mb-2" />
          <h4 className="text-white font-medium mb-1">Activity Tracking Engaged</h4>
          <p className="text-slate-500 text-sm max-w-sm">All changes to events, galleries, team lists, and blogs are now live in the global distributed database.</p>
        </div>
      </div>
    </div>
  )
}
