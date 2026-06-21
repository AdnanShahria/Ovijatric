import { useState, useEffect } from 'react'
import { dynamicGet, dynamicInsert } from '../../utils/apiClient'
import { MapPin, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react'

export function MemberEventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [joining, setJoining] = useState(false)
  const [joinSuccess, setJoinSuccess] = useState(false)
  
  // Registration form state
  const [phone, setPhone] = useState('')
  const [studentId, setStudentId] = useState('')

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const storedUser = localStorage.getItem('user')
        if (storedUser) setUser(JSON.parse(storedUser))
        
        const evs = await dynamicGet('events', { eq: { is_registration_open: 1 } })
        setEvents(evs)
      } catch (error) {
        console.error('Failed to fetch open events:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [])

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEvent || !user) return
    
    setJoining(true)
    try {
      // Simulate fee collection / payment processing delay
      await new Promise(r => setTimeout(r, 1500))

      const payload = {
        event_id: selectedEvent.id,
        user_id: user.id,
        name: user.name,
        email: user.email,
        phone,
        student_id: studentId,
        status: 'paid' // Simulated payment confirmed status
      }

      await dynamicInsert('registrations', payload)
      setJoinSuccess(true)
    } catch (error) {
      console.error('Failed to join event:', error)
      alert('Failed to process registration. Please try again.')
    } finally {
      setJoining(false)
    }
  }

  const closeJoinModal = () => {
    setSelectedEvent(null)
    setJoinSuccess(false)
    setPhone('')
    setStudentId('')
  }

  if (loading) {
    return <div className="p-8 text-center">Loading events...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#1B4332] mb-2">Browse Events</h1>
        <p className="text-slate-600">Find and join upcoming adventures and meetups.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-dashed border-emerald-200">
            No open events available right now. Check back later!
          </div>
        ) : (
          events.map(event => (
            <div key={event.id} className="bg-white rounded-2xl shadow-sm border border-[#1B4332]/10 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              <img 
                src={event.image_url || 'https://via.placeholder.com/400x200?text=No+Image'} 
                alt={event.title} 
                className="w-full h-48 object-cover bg-slate-100"
              />
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-[#1B4332] mb-2">{event.title}</h3>
                <div className="space-y-2 text-sm text-slate-600 mb-4">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-adventure-orange" />
                    <span>{new Date(Number(event.date)).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-adventure-orange" />
                    <span>{event.location}</span>
                  </div>
                  {event.fee && (
                    <div className="font-semibold text-[#1B4332]">
                      Fee: {event.fee}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setSelectedEvent(event)}
                  className="mt-auto w-full py-2 bg-adventure-orange hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors"
                >
                  Join Event
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Join/Payment Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-[#102d21]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
            {joinSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-[#1B4332] mb-2">Registration Confirmed!</h2>
                <p className="text-slate-600 mb-6">You have successfully joined {selectedEvent.title}.</p>
                <button 
                  onClick={closeJoinModal}
                  className="px-6 py-2 bg-[#1B4332] text-white rounded-lg hover:bg-green-900 transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-[#1B4332] mb-1">Join Event</h2>
                <p className="text-slate-500 text-sm mb-6">Complete your registration for {selectedEvent.title}.</p>

                <form onSubmit={handleJoin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <input type="text" value={user?.name} disabled className="w-full px-3 py-2 border rounded-lg bg-slate-50 text-slate-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input type="email" value={user?.email} disabled className="w-full px-3 py-2 border rounded-lg bg-slate-50 text-slate-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label>
                    <input 
                      type="tel" 
                      required 
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-adventure-orange outline-none" 
                      placeholder="01XXXXXXXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Student ID (Optional)</label>
                    <input 
                      type="text" 
                      value={studentId}
                      onChange={e => setStudentId(e.target.value)}
                      className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-adventure-orange outline-none" 
                    />
                  </div>

                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 my-6">
                    <div className="flex justify-between items-center font-bold text-[#1B4332]">
                      <span>Total Fee:</span>
                      <span>{selectedEvent.fee || 'Free'}</span>
                    </div>
                    <p className="text-xs text-amber-700 mt-2">
                      Clicking "Pay & Join" will securely process your payment. (Simulated)
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeJoinModal}
                      disabled={joining}
                      className="flex-1 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={joining}
                      className="flex-1 py-2 bg-adventure-orange hover:bg-orange-600 text-white rounded-lg font-semibold flex justify-center items-center"
                    >
                      {joining ? 'Processing...' : 'Pay & Join'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
