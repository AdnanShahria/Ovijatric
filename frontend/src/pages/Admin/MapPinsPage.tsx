import { useState, useEffect } from 'react'
import { Plus, MapPin, Trash2, X, Upload, Loader2, Edit } from 'lucide-react'
import { dynamicGet, dynamicInsert, dynamicUpdate, dynamicDelete, uploadImage } from '../../utils/apiClient'

interface MapPinData {
  id: string
  name: string
  lat: number
  lng: number
  type: 'event' | 'gallery' | 'place' | 'vlog'
  title: string
  details: string
  image_url: string
  date_text: string
  linked_event_id?: string
  linked_gallery_ids?: string
  linked_place_slug?: string
}

export function MapPinsPage() {
  const [pins, setPins] = useState<MapPinData[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPin, setEditingPin] = useState<MapPinData | null>(null)
  
  // Form State
  const [name, setName] = useState('')
  const [lat, setLat] = useState<number | ''>('')
  const [lng, setLng] = useState<number | ''>('')
  const [type, setType] = useState<'event' | 'gallery' | 'place' | 'vlog'>('event')
  const [title, setTitle] = useState('')
  const [details, setDetails] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [dateText, setDateText] = useState('')
  const [linkedEventId, setLinkedEventId] = useState('')
  const [linkedGalleryId, setLinkedGalleryId] = useState('')
  const [linkedPlaceSlug, setLinkedPlaceSlug] = useState('')

  // Dropdown lists
  const [eventsList, setEventsList] = useState<any[]>([])
  const [galleryList, setGalleryList] = useState<any[]>([])
  const [blogList, setBlogList] = useState<any[]>([])

  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchPins = async () => {
    try {
      setLoading(true)
      const data = await dynamicGet<MapPinData>('map_pins', { order: 'created_at', dir: 'desc' })
      setPins(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPins()

    const fetchDropdownData = async () => {
      try {
        const [evs, gals, blgs] = await Promise.all([
          dynamicGet<any>('events', { order: 'date', dir: 'desc' }),
          dynamicGet<any>('gallery', { order: 'uploaded_at', dir: 'desc' }),
          dynamicGet<any>('blog_posts', { order: 'published_at', dir: 'desc' })
        ])
        setEventsList(evs || [])
        setGalleryList(gals || [])
        setBlogList(blgs || [])
      } catch (err) {
        console.error('Failed to load dropdown options:', err)
      }
    }
    fetchDropdownData()
  }, [])

  const openAddModal = () => {
    setEditingPin(null)
    setName('')
    setLat('')
    setLng('')
    setType('event')
    setTitle('')
    setDetails('')
    setImageUrl('')
    setDateText('')
    setLinkedEventId('')
    setLinkedGalleryId('')
    setLinkedPlaceSlug('')
    setModalOpen(true)
  }

  const openEditModal = (pin: MapPinData) => {
    setEditingPin(pin)
    setName(pin.name || '')
    setLat(pin.lat || '')
    setLng(pin.lng || '')
    setType(pin.type || 'event')
    setTitle(pin.title || '')
    setDetails(pin.details || '')
    setImageUrl(pin.image_url || '')
    setDateText(pin.date_text || '')
    setLinkedEventId(pin.linked_event_id || '')
    
    // Safely parse linked_gallery_ids
    let parsedGalleryId = ''
    if (pin.linked_gallery_ids) {
      try {
        const parsed = JSON.parse(pin.linked_gallery_ids)
        parsedGalleryId = Array.isArray(parsed) ? parsed[0] || '' : String(parsed)
      } catch {
        parsedGalleryId = pin.linked_gallery_ids
      }
    }
    setLinkedGalleryId(parsedGalleryId)
    setLinkedPlaceSlug(pin.linked_place_slug || '')
    setModalOpen(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploading(true)
      const res = await uploadImage(file)
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imageUrl) return alert('Image URL is required')
    if (lat === '' || lng === '') return alert('Lat and Lng are required')
    if (type === 'event' && !linkedEventId) return alert('Please select an event to link')
    if (type === 'gallery' && !linkedGalleryId) return alert('Please select a gallery item to link')
    if (type === 'vlog' && !linkedPlaceSlug) return alert('Please select a blog post to link')

    try {
      setSaving(true)
      const payload = {
        name,
        lat: Number(lat),
        lng: Number(lng),
        type,
        title,
        details,
        image_url: imageUrl,
        date_text: dateText,
        linked_event_id: type === 'event' && linkedEventId ? linkedEventId : null,
        linked_gallery_ids: type === 'gallery' && linkedGalleryId ? JSON.stringify([linkedGalleryId]) : null,
        linked_place_slug: type === 'vlog' && linkedPlaceSlug ? linkedPlaceSlug : null,
      }

      if (editingPin) {
        await dynamicUpdate('map_pins', { ...payload, id: editingPin.id } as any)
      } else {
        await dynamicInsert('map_pins', payload)
      }

      setModalOpen(false)
      fetchPins()
    } catch (err) {
      alert('Failed to save pin')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pin?')) return
    setPins(prev => prev.filter(p => p.id !== id))
    try {
      await dynamicDelete('map_pins', { id })
      fetchPins()
    } catch (err) {
      alert('Failed to delete pin')
      fetchPins()
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-garamond text-[#1B4332] tracking-tight">Manage Map Pins</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Pin events, galleries, and places onto the homepage map</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center justify-center gap-1.5 bg-[#FF6B35] hover:bg-[#E0531D] text-white px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-colors w-full sm:w-auto shadow-sm shadow-[#FF6B35]/10"
        >
          <Plus className="w-4 h-4" />
          Add Pin
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin" />
        </div>
      ) : pins.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#1B4332]/10 shadow-sm p-6 sm:p-8 text-center">
          <div className="w-12 h-12 bg-[#1B4332]/5 rounded-xl flex items-center justify-center mx-auto mb-3">
            <MapPin className="w-6 h-6 text-[#1B4332]/60" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-[#1B4332] mb-1.5">No Pins Yet</h3>
          <p className="text-xs sm:text-sm text-slate-505 max-w-xs mx-auto mb-4">
            Get started by adding your first map pin to the homepage interactive map.
          </p>
          <button 
            onClick={openAddModal}
            className="flex items-center gap-1.5 bg-[#FF6B35] hover:bg-[#E0531D] text-white px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors mx-auto"
          >
            <Plus className="w-4 h-4" />
            Create Pin
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white border border-[#1B4332]/10 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1B4332]/10 bg-[#f0f6f0]">
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#1B4332] font-garamond">Pin</th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#1B4332] font-garamond">Location</th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#1B4332] font-garamond">Connection</th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#1B4332] font-garamond text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1B4332]/5 bg-white">
                  {pins.map((pin) => (
                    <tr key={pin.id} className="hover:bg-[#f6fbf6] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-[#1B4332]/5">
                            <img src={pin.image_url} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#1B4332] truncate max-w-[220px]">{pin.title}</p>
                            <p className="text-xs text-slate-500 truncate max-w-[220px]">{pin.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-mono text-slate-600">{pin.lat}, {pin.lng}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#1B4332]/10 text-[#1B4332] uppercase tracking-wider">
                            {pin.type}
                          </span>
                          {pin.linked_event_id && (
                            <span className="text-[10px] text-slate-600 bg-[#1B4332]/5 px-1.5 py-0.5 rounded-lg border border-[#1B4332]/10 block truncate max-w-[200px]" title={eventsList.find(e => e.id === pin.linked_event_id)?.title || pin.linked_event_id}>
                              🔗 Event: <span className="text-slate-800 font-semibold font-sans">
                                {eventsList.find(e => e.id === pin.linked_event_id)?.title || pin.linked_event_id.substring(0, 8) + '...'}
                              </span>
                            </span>
                          )}
                          {pin.linked_gallery_ids && (
                            <span className="text-[10px] text-slate-600 bg-[#1B4332]/5 px-1.5 py-0.5 rounded-lg border border-[#1B4332]/10 block truncate max-w-[200px]">
                              🔗 Gallery: <span className="text-slate-800 font-semibold font-sans">
                                {(() => {
                                  try {
                                    const parsed = JSON.parse(pin.linked_gallery_ids);
                                    const galId = Array.isArray(parsed) ? parsed[0] : String(parsed);
                                    const galItem = galleryList.find(g => g.id === galId);
                                    return galItem?.caption || galItem?.category || galId.substring(0, 8) + '...';
                                  } catch {
                                    return pin.linked_gallery_ids.substring(0, 8) + '...';
                                  }
                                })()}
                              </span>
                            </span>
                          )}
                          {pin.linked_place_slug && (
                            <span className="text-[10px] text-slate-600 bg-[#1B4332]/5 px-1.5 py-0.5 rounded-lg border border-[#1B4332]/10 block truncate max-w-[200px]" title={blogList.find(b => b.id === pin.linked_place_slug)?.title || pin.linked_place_slug}>
                              🔗 Blog: <span className="text-slate-800 font-semibold font-sans">
                                {blogList.find(b => b.id === pin.linked_place_slug)?.title || pin.linked_place_slug.substring(0, 8) + '...'}
                              </span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-1.5">
                          <button
                            onClick={() => openEditModal(pin)}
                            className="p-1.5 rounded-xl border border-[#1B4332]/10 hover:bg-[#1B4332]/5 text-[#1B4332] transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(pin.id)}
                            className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card view */}
          <div className="block md:hidden space-y-3">
            {pins.map((pin) => (
              <div key={pin.id} className="bg-white border border-[#1B4332]/10 rounded-xl p-3 shadow-sm flex flex-col gap-3">
                <div className="flex gap-3">
                  <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-[#1B4332]/5">
                    <img src={pin.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-grow flex flex-col justify-between">
                    <div>
                      <h4 className="font-semibold text-[#1B4332] text-xs leading-snug line-clamp-2">{pin.title}</h4>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{pin.name}</p>
                      <p className="text-[10px] font-mono text-slate-400 mt-1">{pin.lat}, {pin.lng}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1 items-start bg-[#f8fcf8] p-2 rounded-lg border border-[#1B4332]/5">
                  <span className="px-1.5 py-0.5 rounded-lg text-[9px] font-bold bg-[#1B4332]/10 text-[#1B4332] uppercase tracking-wider">
                    {pin.type}
                  </span>
                  {pin.linked_event_id && (
                    <span className="text-[10px] text-slate-600 truncate max-w-full mt-0.5">
                      🔗 Event: <span className="text-slate-800 font-semibold">{eventsList.find(e => e.id === pin.linked_event_id)?.title || pin.linked_event_id.substring(0, 8) + '...'}</span>
                    </span>
                  )}
                  {pin.linked_gallery_ids && (
                    <span className="text-[10px] text-slate-600 truncate max-w-full mt-0.5">
                      🔗 Gallery: <span className="text-slate-800 font-semibold">
                        {(() => {
                          try {
                            const parsed = JSON.parse(pin.linked_gallery_ids);
                            const galId = Array.isArray(parsed) ? parsed[0] : String(parsed);
                            const galItem = galleryList.find(g => g.id === galId);
                            return galItem?.caption || galItem?.category || galId.substring(0, 8) + '...';
                          } catch {
                            return pin.linked_gallery_ids.substring(0, 8) + '...';
                          }
                        })()}
                      </span>
                    </span>
                  )}
                  {pin.linked_place_slug && (
                    <span className="text-[10px] text-slate-600 truncate max-w-full mt-0.5">
                      🔗 Blog: <span className="text-slate-800 font-semibold">{blogList.find(b => b.id === pin.linked_place_slug)?.title || pin.linked_place_slug.substring(0, 8) + '...'}</span>
                    </span>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2.5 border-t border-[#1B4332]/5">
                  <button
                    onClick={() => openEditModal(pin)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#1B4332]/15 text-[#1B4332] text-[11px] font-semibold hover:bg-[#1B4332]/5 transition-colors"
                  >
                    <Edit className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(pin.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-semibold transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit/Add Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 xs:p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-[#1B4332]/10 rounded-xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col my-auto">
            <div className="flex items-center justify-between p-4 border-b border-[#1B4332]/10 shrink-0">
              <h3 className="text-base sm:text-lg font-bold text-[#1B4332] font-garamond">
                {editingPin ? 'Edit Map Pin' : 'Add Map Pin'}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-3.5 overflow-y-auto flex-grow scrollbar-thin">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Pin Type *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] text-xs sm:text-sm"
                  >
                    <option value="event">Event</option>
                    <option value="gallery">Gallery</option>
                    <option value="vlog">Vlog</option>
                    <option value="place">Place</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">District/Area Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] text-xs sm:text-sm"
                    placeholder="e.g. Mymensingh"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Latitude *</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={lat}
                    onChange={(e) => setLat(e.target.value ? parseFloat(e.target.value) : '')}
                    className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] text-xs sm:text-sm"
                    placeholder="e.g. 24.7471"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Longitude *</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={lng}
                    onChange={(e) => setLng(e.target.value ? parseFloat(e.target.value) : '')}
                    className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] text-xs sm:text-sm"
                    placeholder="e.g. 90.4203"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Popup Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] text-xs sm:text-sm"
                  placeholder="e.g. Mymensingh River Camp"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Popup Description</label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] text-xs sm:text-sm h-16 resize-none"
                  placeholder="Camping by the Brahmaputra river tributaries."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Popup Image *</label>
                <div className="flex flex-col gap-1.5">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] text-xs sm:text-sm"
                    placeholder="Paste Image URL or Upload below"
                    required
                  />
                  <label className="flex items-center justify-center gap-1.5 border border-dashed border-[#1B4332]/20 hover:border-[#FF6B35] bg-[#f8fcf8] hover:bg-[#f2faf2] p-2.5 rounded-xl cursor-pointer transition-all shrink-0">
                    {uploading ? (
                      <Loader2 className="w-4 h-4 text-[#FF6B35] animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 text-[#1B4332]/50" />
                    )}
                    <span className="text-xs text-[#1B4332]/70 font-semibold">
                      {uploading ? 'Uploading...' : 'Click to Upload Image'}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Date Text</label>
                  <input
                    type="text"
                    value={dateText}
                    onChange={(e) => setDateText(e.target.value)}
                    className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] text-xs sm:text-sm"
                    placeholder="e.g. Oct 2026"
                  />
                </div>
                <div>
                  {type === 'event' && (
                    <>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Linked Event *</label>
                      <select
                        value={linkedEventId}
                        onChange={(e) => setLinkedEventId(e.target.value)}
                        className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] text-xs sm:text-sm"
                        required
                      >
                        <option value="">-- Select an Event --</option>
                        {eventsList.map((evt) => (
                          <option key={evt.id} value={evt.id}>
                            {evt.title} ({new Date(Number(evt.date)).toLocaleDateString()})
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                  {type === 'gallery' && (
                    <>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Linked Gallery Item *</label>
                      <select
                        value={linkedGalleryId}
                        onChange={(e) => setLinkedGalleryId(e.target.value)}
                        className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] text-xs sm:text-sm"
                        required
                      >
                        <option value="">-- Select Gallery Item --</option>
                        {galleryList.map((gal) => (
                          <option key={gal.id} value={gal.id}>
                            {gal.caption || 'No Caption'} ({gal.category})
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                  {type === 'vlog' && (
                    <>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Linked Blog Post *</label>
                      <select
                        value={linkedPlaceSlug}
                        onChange={(e) => setLinkedPlaceSlug(e.target.value)}
                        className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] text-xs sm:text-sm"
                        required
                      >
                        <option value="">-- Select a Blog Post --</option>
                        {blogList.map((blog) => (
                          <option key={blog.id} value={blog.id}>
                            {blog.title}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                  {type === 'place' && (
                    <>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Place Slug (Optional)</label>
                      <input
                        type="text"
                        value={linkedPlaceSlug}
                        onChange={(e) => setLinkedPlaceSlug(e.target.value)}
                        className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] text-xs sm:text-sm"
                        placeholder="e.g. sylhet-camp"
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#1B4332]/10 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-1.5 border border-[#1B4332]/20 hover:bg-[#1B4332]/5 text-[#1B4332] rounded-xl text-xs sm:text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-[#FF6B35] hover:bg-[#E0531D] disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Pin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
