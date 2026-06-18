import { useState, useEffect } from 'react'
import { Plus, Calendar as CalendarIcon, Edit, Trash2, X, Upload, Loader2, Link as LinkIcon } from 'lucide-react'
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Manage Events</h2>
          <p className="text-slate-400 mt-1">Create, edit, and archive adventure club expeditions</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-md"
        >
          <Plus className="w-5 h-5" />
          Create Event
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
          <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarIcon className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No Events Found</h3>
          <p className="text-slate-400 max-w-sm mx-auto mb-6">
            You haven't created any events yet. Click the button below to add your first event.
          </p>
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors mx-auto"
          >
            <Plus className="w-5 h-5" />
            Add Event
          </button>
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800/50">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Event Details</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Date & Location</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Registration</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700 bg-slate-800/20">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {event.image_url ? (
                          <img src={event.image_url} alt={event.title} className="w-16 h-10 object-cover rounded" />
                        ) : (
                          <div className="w-16 h-10 bg-slate-700 flex items-center justify-center rounded">
                            <CalendarIcon className="w-5 h-5 text-slate-500" />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-white">{event.title}</div>
                          <div className="text-slate-400 text-xs line-clamp-1 max-w-xs sm:max-w-md">{event.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      <div className="text-sm font-medium">{new Date(Number(event.date)).toLocaleDateString(undefined, { dateStyle: 'medium' })}</div>
                      <div className="text-slate-400 text-xs mt-0.5">{event.location}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        event.is_registration_open 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-slate-700 text-slate-400 border border-slate-600/50'
                      }`}>
                        {event.is_registration_open ? 'Open' : 'Closed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => openEditModal(event)}
                          className="p-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
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
      )}

      {/* Edit/Add Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h3 className="text-lg font-bold text-white">
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Event Title (English) *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Expedition to Keokradong"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Event Title (Bangla)</label>
                  <input
                    type="text"
                    value={titleBn}
                    onChange={(e) => setTitleBn(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. কেওক্রাডং অভিযান"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description (English) *</label>
                <div className="bg-white rounded text-black">
                  <ReactQuill theme="snow" value={description} onChange={setDescription} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description (Bangla)</label>
                <div className="bg-white rounded text-black">
                  <ReactQuill theme="snow" value={descriptionBn} onChange={setDescriptionBn} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Location *</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Bandarban"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Fee</label>
                  <input
                    type="text"
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 5000 BDT or Free"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Total Spots</label>
                  <input
                    type="number"
                    value={totalSpots}
                    onChange={(e) => setTotalSpots(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Cover Image (Recommended ratio: 16:9)</label>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="flex-grow bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Paste Image URL or Upload below"
                    />
                  </div>

                  <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-700 hover:border-slate-500 bg-slate-900/50 hover:bg-slate-950 p-4 rounded-lg cursor-pointer transition-all">
                    {uploading ? (
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    ) : (
                      <Upload className="w-5 h-5 text-slate-400" />
                    )}
                    <span className="text-sm text-slate-400">
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
                    <div className="mt-2 relative group w-full h-32 rounded-lg overflow-hidden border border-slate-700">
                      <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Hover Image (Next to Cover)</label>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={hoverImageUrl}
                      onChange={(e) => setHoverImageUrl(e.target.value)}
                      className="flex-grow bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Select from gallery below or paste URL"
                    />
                  </div>
                  {hoverImageUrl && (
                    <div className="mt-2 relative group w-full h-32 rounded-lg overflow-hidden border border-slate-700">
                      <img src={hoverImageUrl} alt="Hover Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setHoverImageUrl('')}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Additional Gallery Images</label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-700 hover:border-slate-500 bg-slate-900/50 hover:bg-slate-950 p-4 rounded-lg cursor-pointer transition-all">
                    {uploading ? (
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    ) : (
                      <Upload className="w-5 h-5 text-slate-400" />
                    )}
                    <span className="text-sm text-slate-400">
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
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                      {additionalImages.map((url, idx) => (
                        <div key={idx} className="relative group w-full h-20 rounded-lg overflow-hidden border border-slate-700">
                          <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => setAdditionalImages(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <div className="absolute bottom-1 left-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => setImageUrl(url)}
                              className={`flex-1 py-0.5 text-[10px] rounded font-medium ${imageUrl === url ? 'bg-blue-600 text-white' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'}`}
                            >
                              Cover
                            </button>
                            <button
                              type="button"
                              onClick={() => setHoverImageUrl(url)}
                              className={`flex-1 py-0.5 text-[10px] rounded font-medium ${hoverImageUrl === url ? 'bg-emerald-600 text-white' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'}`}
                            >
                              Hover
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Tags (Comma separated)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Expedition, Trekking, Newbie Friendly"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Sponsors (Comma separated)</label>
                <input
                  type="text"
                  value={sponsors}
                  onChange={(e) => setSponsors(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Red Bull, North Face"
                />
              </div>

              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="regOpen"
                  checked={isRegOpen}
                  onChange={(e) => setIsRegOpen(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-slate-900 border-slate-700 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="regOpen" className="text-sm font-medium text-slate-300 select-none cursor-pointer">
                  Open registrations for this event
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-600 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
