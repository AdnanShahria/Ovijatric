import { Users, Activity, FileText, Image as ImageIcon } from 'lucide-react'

export function DashboardPage() {
  const stats = [
    { name: 'Total Events', value: '12', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { name: 'Active Banners', value: '4', icon: ImageIcon, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { name: 'Total Users', value: '840', icon: Users, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { name: 'Blog Posts', value: '24', icon: FileText, color: 'text-purple-500', bg: 'bg-purple-500/10' },
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
        <div className="flex items-center justify-center h-[300px] text-slate-400 border-2 border-dashed border-slate-700 rounded-lg">
          Activity chart or list will appear here
        </div>
      </div>
    </div>
  )
}
