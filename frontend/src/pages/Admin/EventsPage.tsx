import { Plus, Calendar as CalendarIcon } from 'lucide-react'

export function EventsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Manage Events</h2>
          <p className="text-slate-400 mt-1">Create and manage upcoming activities</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          <Plus className="w-5 h-5" />
          Create Event
        </button>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
        <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CalendarIcon className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No Events Found</h3>
        <p className="text-slate-400 max-w-sm mx-auto mb-6">
          You haven't created any events yet. Click the button below to add your first event.
        </p>
        <button className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors mx-auto">
          <Plus className="w-5 h-5" />
          Add Event
        </button>
      </div>
    </div>
  )
}
