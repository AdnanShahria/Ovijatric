import { useState, useEffect } from 'react'
import { Plus, Calendar as CalendarIcon, Edit, Trash2, X, Upload, Loader2, Link as LinkIcon, AlertTriangle, Check } from 'lucide-react'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import { dynamicGet, dynamicInsert, dynamicUpdate, dynamicDelete, uploadImage } from '../../utils/apiClient'

interface Event {
  id: string
  title: string
  title_bn?: string
  description: string
  description_bn?: string
  date: string | number
  location: string
  fee?: string
  total_spots?: number
  image_url?: string | null
  hover_image_url?: string | null
  additional_images?: string | null
  tags?: string | null
  sponsors?: string | null
  is_registration_open: boolean | number
  created_at?: string | number
}

export function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)

  // Bulk Upload State
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const [jsonInput, setJsonInput] = useState('')
  const [parseError, setParseError] = useState('')
  const [parsedEvents, setParsedEvents] = useState<any[] | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 })
  const [uploadFinished, setUploadFinished] = useState(false)
  
  // Form state
  const [title, setTitle] = useState('')
  const [titleBn, setTitleBn] = useState('')
  const [description, setDescription] = useState('')
  const [descriptionBn, setDescriptionBn] = useState('')
  const [date, setDate] = useState('')
  const [location, setLocation] = useState('')
  const [fee, setFee] = useState('')
  const [totalSpots, setTotalSpots] = useState(0)
  const [imageUrl, setImageUrl] = useState('')
  const [hoverImageUrl, setHoverImageUrl] = useState('')
  const [additionalImages, setAdditionalImages] = useState<string[]>([])
  const [tags, setTags] = useState('')
  const [sponsors, setSponsors] = useState('')
  const [isRegOpen, setIsRegOpen] = useState(false)
  
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const data = await dynamicGet<Event>('events', { order: 'date', dir: 'desc' })
      setEvents(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const openAddModal = () => {
    setEditingEvent(null)
    setTitle('')
    setTitleBn('')
    setDescription('')
    setDescriptionBn('')
    setDate('')
    setLocation('')
    setFee('')
    setTotalSpots(0)
    setImageUrl('')
    setHoverImageUrl('')
    setAdditionalImages([])
    setTags('')
    setSponsors('')
    setIsRegOpen(false)
    setModalOpen(true)
  }

  const handleParseJSON = () => {
    setParseError('')
    setParsedEvents(null)
    try {
      const parsed = JSON.parse(jsonInput)
      let events = []
      if (Array.isArray(parsed)) {
        events = parsed
      } else if (parsed && Array.isArray(parsed.events)) {
        events = parsed.events
      } else {
        throw new Error('JSON must be an array of events, or an object containing an "events" array.')
      }

      if (events.length === 0) {
        throw new Error('No events found in the array.')
      }

      if (events.length > 100) {
        throw new Error('Maximum 100 items allowed per upload.')
      }

      events.forEach((e: any, index: number) => {
        if (!e.title) throw new Error(`Event at index ${index} is missing required 'title' field.`)
        if (!e.description) throw new Error(`Event at index ${index} is missing required 'description' field.`)
        if (!e.location) throw new Error(`Event at index ${index} is missing required 'location' field.`)
      })

      setParsedEvents(events)
    } catch (err: any) {
      setParseError(err.message || 'Invalid JSON format.')
    }
  }

  const handleImportEvents = async () => {
    if (!parsedEvents) return
    setIsUploading(true)
    setUploadProgress({ done: 0, total: parsedEvents.length })
    try {
      for (let i = 0; i < parsedEvents.length; i++) {
        const ev = parsedEvents[i]
        const dateTimestamp = ev.date ? new Date(ev.date).getTime() : Date.now()
        await dynamicInsert('events', {
          title: ev.title,
          title_bn: ev.title_bn || null,
          description: ev.description,
          description_bn: ev.description_bn || null,
          date: isNaN(dateTimestamp) ? Date.now() : dateTimestamp,
          location: ev.location,
          fee: ev.fee || null,
          total_spots: ev.total_spots ? Number(ev.total_spots) : null,
          image_url: null,
          hover_image_url: null,
          additional_images: JSON.stringify([]),
          tags: ev.tags || null,
          sponsors: ev.sponsors || null,
          is_registration_open: ev.is_registration_open ? 1 : 0
        })
        setUploadProgress(prev => ({ ...prev, done: i + 1 }))
      }
      setUploadFinished(true)
      fetchEvents()
    } catch (err: any) {
      alert(`Error importing: ${err.message || 'failed'}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleCloseBulkModal = () => {
    setBulkModalOpen(false)
    setJsonInput('')
    setParsedEvents(null)
    setParseError('')
    setUploadFinished(false)
  }

  const openEditModal = (event: Event) => {
    setEditingEvent(event)
    setTitle(event.title)
    setTitleBn(event.title_bn || '')
    setDescription(event.description)
    setDescriptionBn(event.description_bn || '')
    
    // Format date for datetime-local input (YYYY-MM-DDTHH:MM)
    const d = new Date(Number(event.date))
    const pad = (n: number) => String(n).padStart(2, '0')
    const formattedDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    setDate(formattedDate)
    
    setLocation(event.location)
    setFee(event.fee || '')
    setTotalSpots(event.total_spots || 0)
    setImageUrl(event.image_url || '')
    setHoverImageUrl(event.hover_image_url || '')
    try {
      setAdditionalImages(event.additional_images ? JSON.parse(event.additional_images) : [])
    } catch (e) {
      setAdditionalImages([])
    }
    setTags(event.tags || '')
    setSponsors(event.sponsors || '')
    setIsRegOpen(!!event.is_registration_open)
    setModalOpen(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploading(true)
      const res = await uploadImage(file, 16/9)
      if (res.success && res.url) {
        setImageUrl(res.url)
      } else {
        alert(res.error || 'Failed to upload image')
      }
    } catch (err) {
      alert('Error uploading image')
    } finally {
      setUploading(false)
    }
  }

  const handleMultipleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    try {
      setUploading(true)
      const newUrls: string[] = []
      for (const file of files) {
        const res = await uploadImage(file, 16/9)
        if (res.success && res.url) {
          newUrls.push(res.url)
        }
      }
      setAdditionalImages(prev => [...prev, ...newUrls])
    } catch (err) {
      alert('Error uploading multiple images')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !description || !date || !location) {
      alert('Please fill out all required fields')
      return
    }

    try {
      setSaving(true)
      const eventTimestamp = new Date(date).getTime()
      const payload: Partial<Event> = {
        title,
        title_bn: titleBn,
        description,
        description_bn: descriptionBn,
        date: eventTimestamp,
        location,
        fee,
        total_spots: totalSpots,
        image_url: imageUrl || null,
        hover_image_url: hoverImageUrl || null,
        additional_images: JSON.stringify(additionalImages),
        tags: tags || null,
        sponsors: sponsors || null,
        is_registration_open: isRegOpen ? 1 : 0
      }

      if (editingEvent) {
        await dynamicUpdate('events', { ...payload, id: editingEvent.id } as any)
      } else {
        await dynamicInsert('events', payload)
      }

      setModalOpen(false)
      fetchEvents()
    } catch (err) {
      alert('Failed to save event')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return
    try {
      await dynamicDelete('events', { id })
      fetchEvents()
    } catch (err) {
      alert('Failed to delete event')
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 text-[#1B4332]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1B4332] font-garamond">Manage Events</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Create, edit, and archive adventure club expeditions</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setBulkModalOpen(true)}
            className="flex items-center justify-center gap-1.5 bg-[#1B4332] hover:bg-[#143225] text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex-1 sm:flex-initial shadow-sm"
          >
            <Upload className="w-4 h-4" />
            Bulk Upload
          </button>
          <button 
            onClick={openAddModal}
            className="flex items-center justify-center gap-1.5 bg-[#FF6B35] hover:bg-[#e65a29] text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm flex-1 sm:flex-initial"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#1B4332]/10 p-6 sm:p-8 text-center text-[#1B4332]">
          <div className="w-12 h-12 bg-slate-50 border border-[#1B4332]/5 rounded-xl flex items-center justify-center mx-auto mb-3">
            <CalendarIcon className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-base sm:text-lg font-bold font-garamond mb-1.5">No Events Found</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto mb-4">
            You haven't created any events yet. Click the button below to add your first event.
          </p>
          <button 
            onClick={openAddModal}
            className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-colors mx-auto"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white border border-[#1B4332]/10 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1B4332]/10 bg-[#f0f6f0]">
                    <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-[#1B4332]">Event Details</th>
                    <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-[#1B4332]">Date & Location</th>
                    <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-[#1B4332]">Registration</th>
                    <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-[#1B4332] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1b4332]/5 bg-white">
                  {events.map((event) => (
                    <tr key={event.id} className="hover:bg-[#f6fbf6] transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          {event.image_url ? (
                            <img src={event.image_url} alt={event.title} className="w-16 h-10 object-cover rounded-lg border border-[#1B4332]/10 shrink-0" />
                          ) : (
                            <div className="w-16 h-10 bg-emerald-50 border border-[#1B4332]/10 flex items-center justify-center rounded-lg shrink-0">
                              <CalendarIcon className="w-5 h-5 text-emerald-700" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-[#1B4332] text-sm truncate max-w-[250px]">{event.title}</div>
                            <div className="text-slate-500 text-xs line-clamp-1 max-w-[250px] mt-0.5">
                              {event.description.replace(/<[^>]*>/g, '')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-[#1B4332]">
                        <div className="text-sm font-semibold">{new Date(Number(event.date)).toLocaleDateString(undefined, { dateStyle: 'medium' })}</div>
                        <div className="text-slate-500 text-xs mt-0.5 truncate max-w-[160px]">{event.location}</div>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          event.is_registration_open 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}>
                          {event.is_registration_open ? 'Open' : 'Closed'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => openEditModal(event)}
                            className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#1B4332] transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(event.id)}
                            className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-555 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {events.map((event) => (
              <div key={event.id} className="bg-white border border-[#1B4332]/10 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm hover:shadow transition-shadow duration-200">
                <div className="flex items-center gap-3 min-w-0">
                  {event.image_url ? (
                    <img src={event.image_url} alt={event.title} className="w-12 h-12 object-cover rounded-xl border border-[#1B4332]/10 shrink-0" />
                  ) : (
                    <div className="w-12 h-12 bg-emerald-50 border border-[#1B4332]/10 flex items-center justify-center rounded-xl shrink-0">
                      <CalendarIcon className="w-5 h-5 text-emerald-700" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-extrabold text-[#1B4332] text-sm truncate leading-tight">{event.title}</div>
                    <div className="text-slate-500 text-[11px] truncate mt-0.5">
                      📍 {event.location} • {new Date(Number(event.date)).toLocaleDateString()}
                    </div>
                    <div className="mt-1.5">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                        event.is_registration_open 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}>
                        Reg: {event.is_registration_open ? 'Open' : 'Closed'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => openEditModal(event)}
                    className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#1B4332] transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-555 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Edit/Add Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-[#102d21]/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white border border-[#1B4332]/10 rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col my-auto text-[#1B4332] animate-zoom-in">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
              <h3 className="text-base sm:text-lg font-bold font-garamond text-[#1B4332]">
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-[#1B4332] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-3.5 overflow-y-auto flex-grow scrollbar-thin">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Event Title (English) *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] text-xs sm:text-sm"
                    placeholder="e.g. Expedition to Keokradong"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Event Title (Bangla)</label>
                  <input
                    type="text"
                    value={titleBn}
                    onChange={(e) => setTitleBn(e.target.value)}
                    className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] text-xs sm:text-sm"
                    placeholder="e.g. কেওক্রাডং অভিযান"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-505 mb-1">Description (English) *</label>
                <div className="bg-[#f8fcf8] border border-[#1B4332]/15 rounded-xl overflow-hidden text-slate-800 text-xs">
                  <ReactQuill theme="snow" value={description} onChange={setDescription} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-505 mb-1">Description (Bangla)</label>
                <div className="bg-[#f8fcf8] border border-[#1B4332]/15 rounded-xl overflow-hidden text-slate-800 text-xs">
                  <ReactQuill theme="snow" value={descriptionBn} onChange={setDescriptionBn} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-505 mb-1">Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] text-xs sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-505 mb-1">Location *</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] text-xs sm:text-sm"
                    placeholder="e.g. Bandarban"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-505 mb-1">Fee</label>
                  <input
                    type="text"
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                    className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] text-xs sm:text-sm"
                    placeholder="e.g. 5000 BDT"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-505 mb-1">Total Spots</label>
                  <input
                    type="number"
                    value={totalSpots}
                    onChange={(e) => setTotalSpots(Number(e.target.value))}
                    className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] text-xs sm:text-sm"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-505 mb-1">Cover Image *</label>
                <div className="flex flex-col gap-1.5">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] text-xs sm:text-sm"
                    placeholder="Paste Image URL or Upload below"
                  />
                  <label className="flex items-center justify-center gap-1.5 border border-dashed border-[#1B4332]/20 hover:border-[#FF6B35] bg-[#f8fcf8]/50 hover:bg-[#f8fcf8] p-2.5 rounded-xl cursor-pointer transition-all shrink-0">
                    {uploading ? (
                      <Loader2 className="w-4 h-4 text-[#FF6B35] animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="text-xs text-slate-500">
                      {uploading ? 'Uploading...' : 'Click to Upload Cover Image'}
                    </span>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden" 
                    />
                  </label>
                  {imageUrl && (
                    <div className="mt-1 relative w-full h-24 sm:h-28 rounded-xl overflow-hidden border border-[#1B4332]/10 shrink-0">
                      <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="absolute top-1.5 right-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-md"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-505 mb-1">Hover Image</label>
                <div className="flex flex-col gap-1.5">
                  <input
                    type="text"
                    value={hoverImageUrl}
                    onChange={(e) => setHoverImageUrl(e.target.value)}
                    className="bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] text-xs sm:text-sm"
                    placeholder="Paste Hover Image URL"
                  />
                  {hoverImageUrl && (
                    <div className="mt-1 relative w-full h-24 sm:h-28 rounded-xl overflow-hidden border border-[#1B4332]/10 shrink-0">
                      <img src={hoverImageUrl} alt="Hover Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setHoverImageUrl('')}
                        className="absolute top-1.5 right-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-md"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-505 mb-1">Additional Gallery Images</label>
                <div className="flex flex-col gap-1.5">
                  <label className="flex items-center justify-center gap-1.5 border border-dashed border-[#1B4332]/20 hover:border-[#FF6B35] bg-[#f8fcf8]/50 hover:bg-[#f8fcf8] p-2.5 rounded-xl cursor-pointer transition-all shrink-0">
                    {uploading ? (
                      <Loader2 className="w-4 h-4 text-[#FF6B35] animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="text-xs text-slate-500">
                      {uploading ? 'Uploading...' : 'Click to Upload Multiple Gallery Images'}
                    </span>
                    <input 
                      type="file" 
                      accept="image/*"
                      multiple
                      onChange={handleMultipleImageUpload}
                      disabled={uploading}
                      className="hidden" 
                    />
                  </label>

                  {additionalImages.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 mt-1 shrink-0">
                      {additionalImages.map((url, idx) => (
                        <div key={idx} className="relative group w-full h-14 rounded-xl overflow-hidden border border-[#1B4332]/10">
                          <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => setAdditionalImages(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-0.5 shadow-md"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-505 mb-1">Tags (Comma separated)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] text-xs sm:text-sm"
                  placeholder="e.g. Expedition, Trekking"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-505 mb-1">Sponsors (Comma separated)</label>
                <input
                  type="text"
                  value={sponsors}
                  onChange={(e) => setSponsors(e.target.value)}
                  className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] text-xs sm:text-sm"
                  placeholder="e.g. Red Bull, North Face"
                />
              </div>

              <div className="flex items-center gap-2 py-1 shrink-0">
                <input
                  type="checkbox"
                  id="regOpen"
                  checked={isRegOpen}
                  onChange={(e) => setIsRegOpen(e.target.checked)}
                  className="w-4 h-4 rounded border-[#1B4332]/15 text-[#1B4332] focus:ring-[#FF6B35]"
                />
                <label htmlFor="regOpen" className="text-xs font-semibold text-slate-600 select-none cursor-pointer">
                  Open registrations for this event
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="flex items-center gap-1.5 px-5 py-2 bg-[#1B4332] hover:bg-[#143225] disabled:bg-[#1B4332]/75 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {bulkModalOpen && (
        <div className="fixed inset-0 bg-[#102d21]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#1B4332]/10 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col my-auto animate-zoom-in text-left text-[#1B4332]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#FF6B35]" />
                <h3 className="text-base sm:text-lg font-bold font-garamond">Bulk Import Events</h3>
              </div>
              <button 
                onClick={handleCloseBulkModal}
                disabled={isUploading}
                className="text-slate-400 hover:text-[#1B4332] transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-grow space-y-4 text-xs sm:text-sm">
              {!parsedEvents && !uploadFinished && (
                <div className="space-y-4 flex flex-col h-full">
                  <div className="text-slate-600">
                    Paste a JSON array of events (maximum 100 items per upload) or an object containing an `events` array.
                  </div>
                  <textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder={`[\n  {\n    "title": "Bandarban Mountain Trekking Expedition",\n    "description": "Join Ovijatrik...",\n    "location": "Bandarban",\n    "date": "2026-09-10T22:00:00.000Z"\n  }\n]`}
                    className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl p-3 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] h-52 resize-none"
                  />
                  {parseError && (
                    <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{parseError}</span>
                    </div>
                  )}
                  <button
                    onClick={handleParseJSON}
                    className="w-full py-2 bg-[#FF6B35] hover:bg-[#e65a29] text-white rounded-xl text-xs sm:text-sm font-bold transition-colors"
                  >
                    Parse JSON Data
                  </button>
                </div>
              )}

              {parsedEvents && !isUploading && !uploadFinished && (
                <div className="space-y-4">
                  <div className="p-3 bg-[#eef5ee] border border-[#1B4332]/10 rounded-xl">
                    <span className="text-slate-600 text-xs">Parsed events: </span>
                    <span className="text-slate-800 font-extrabold">{parsedEvents.length} events ready</span>
                  </div>

                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    <div className="bg-[#f8fcf8] rounded-xl p-3 border border-[#1B4332]/5">
                      <h5 className="text-[10px] font-bold text-[#FF6B35] uppercase tracking-wider mb-1.5">Events to Import</h5>
                      <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4 font-sans">
                        {parsedEvents.map((e, i) => (
                          <li key={i}><span className="font-semibold text-slate-800">{e.title}</span> ({e.location})</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="text-[10px] sm:text-xs text-slate-500 flex items-center gap-1.5 bg-[#eef5ee] p-2.5 rounded-xl border border-[#1B4332]/10">
                    <AlertTriangle className="w-4 h-4 text-[#FF6B35] shrink-0" />
                    <span>No cover or hover images will be uploaded. The events will be created without images, and you can edit them to upload files later.</span>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => setParsedEvents(null)}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
                    >
                      Reset / Back
                    </button>
                    <button
                      onClick={handleImportEvents}
                      className="px-5 py-2 bg-[#FF6B35] hover:bg-[#e65a29] text-white rounded-xl text-xs sm:text-sm font-bold transition-colors animate-fade-in"
                    >
                      Confirm & Import
                    </button>
                  </div>
                </div>
              )}

              {isUploading && (
                <div className="py-6 flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="w-10 h-10 text-[#FF6B35] animate-spin" />
                  <div className="text-center">
                    <h4 className="font-bold text-slate-800 text-sm">Importing Events...</h4>
                    <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Please do not close this window.</p>
                  </div>
                  <div className="text-slate-800 font-bold text-xs">
                    {uploadProgress.done} / {uploadProgress.total} completed
                  </div>
                </div>
              )}

              {uploadFinished && (
                <div className="py-4 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1B4332] text-base sm:text-lg font-garamond">Events Imported Successfully!</h4>
                    <p className="text-[10px] sm:text-xs text-slate-500 mt-1">
                      Successfully added {uploadProgress.total} events. You can now edit them to upload cover and gallery images.
                    </p>
                  </div>
                  <button
                    onClick={handleCloseBulkModal}
                    className="w-full max-w-xs py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors"
                  >
                    Done & Refresh
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
