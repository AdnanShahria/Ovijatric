import { useState, useEffect } from 'react'
import { dynamicGet } from '../../utils/apiClient'
import { CalendarIcon, MapPin, CheckCircle2, Clock } from 'lucide-react'

export function MemberMyEventsPage() {
  const [registrations, setRegistrations] = useState<any[]>([])
  const [eventsMap, setEventsMap] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMyEvents = async () => {
      try {
        const storedUser = localStorage.getItem('user')
        if (!storedUser) return
        const user = JSON.parse(storedUser)
        
        // Fetch registrations
        const myRegs = await dynamicGet('registrations', { eq: { user_id: user.id } })
        setRegistrations(myRegs)

        if (myRegs.length > 0) {
          // Fetch events to map details
          // In a real app we might fetch only specific IDs, but for simplicity we fetch all open/recent ones
          const eventsData = await dynamicGet('events')
          const eMap: Record<string, any> = {}
          eventsData.forEach((e: any) => eMap[e.id] = e)
          setEventsMap(eMap)
        }
      } catch (error) {
        console.error('Failed to fetch my events:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchMyEvents()
  }, [])

  if (loading) {
    return <div className="p-8 text-center">Loading your events...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#1B4332] mb-2">My Events</h1>
        <p className="text-slate-600">Track the events you've joined and your payment status.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#1B4332]/10 overflow-hidden">
        {registrations.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            You haven't joined any events yet. <a href="/member/events" className="text-adventure-orange font-semibold hover:underline">Browse events</a>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm uppercase tracking-wider">
                  <th className="p-4 font-medium">Event Details</th>
                  <th className="p-4 font-medium">Registration Date</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registrations.map(reg => {
                  const event = eventsMap[reg.event_id]
                  return (
                    <tr key={reg.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        {event ? (
                          <div className="flex items-center gap-4">
                            <img src={event.image_url || 'https://via.placeholder.com/80'} className="w-16 h-16 rounded-lg object-cover bg-slate-100 shrink-0" />
                            <div>
                              <div className="font-bold text-[#1B4332]">{event.title}</div>
                              <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                                <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3"/> {new Date(Number(event.date)).toLocaleDateString()}</span>
                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {event.location}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Event details unavailable</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {new Date(Number(reg.created_at)).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        {reg.status === 'paid' || reg.status === 'confirmed' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                            <Clock className="w-3.5 h-3.5" /> Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
