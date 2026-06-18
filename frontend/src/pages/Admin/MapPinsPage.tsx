import { useState, useEffect } from 'react'
import { Plus, MapPin, Trash2, X, Upload, Loader2, Edit } from 'lucide-react'
import { dynamicGet, dynamicInsert, dynamicUpdate, dynamicDelete, uploadImage } from '../../utils/apiClient'

interface MapPinData {
  id: string
  name: string
  lat: number
  lng: number
  type: 'event' | 'gallery' | 'place'
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
  const [type, setType] = useState<'event' | 'gallery' | 'place'>('event')
  const [title, setTitle] = useState('')
  const [details, setDetails] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [dateText, setDateText] = useState('')
  const [linkedEventId, setLinkedEventId] = useState('')

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
        linked_event_id: linkedEventId || undefined,
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
    try {
      await dynamicDelete('map_pins', { id })
      fetchPins()
    } catch (err) {
      alert('Failed to delete pin')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Manage Map Pins</h2>
          <p className="text-slate-400 mt-1">Pin events, galleries, and places onto the homepage map</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Pin
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        </div>
      ) : pins.length === 0 ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
          <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No Pins Yet</h3>
          <p className="text-slate-400 max-w-sm mx-auto mb-6">
            Get started by adding your first map pin to the homepage interactive map.
          </p>
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors mx-auto"
          >
            <Plus className="w-5 h-5" />
            Create Pin
          </button>
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800/50">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Pin</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Location</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Type</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700 bg-slate-800/20">
                {pins.map((pin) => (
                  <tr key={pin.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-700 rounded-lg overflow-hidden shrink-0">
                          <img src={pin.image_url} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{pin.title}</p>
                          <p className="text-xs text-slate-400">{pin.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-mono text-slate-300">{pin.lat}, {pin.lng}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 uppercase tracking-wider">
                        {pin.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => openEditModal(pin)}
                          className="p-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(pin.id)}
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
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-w-2xl w-full my-8">
            <div className="flex items-center justify-between p-6 border-b border-slate-700 sticky top-0 bg-slate-800 z-10 rounded-t-xl">
              <h3 className="text-lg font-bold text-white">
                {editingPin ? 'Edit Map Pin' : 'Add Map Pin'}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Pin Type *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="event">Event</option>
                    <option value="gallery">Gallery</option>
                    <option value="place">Place</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">District/Area Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="e.g. Mymensingh"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Latitude *</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={lat}
                    onChange={(e) => setLat(parseFloat(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="e.g. 24.7471"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Longitude *</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={lng}
                    onChange={(e) => setLng(parseFloat(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="e.g. 90.4203"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Popup Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="e.g. Mymensingh River Camp"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Popup Description</label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm h-20"
                  placeholder="Camping by the Brahmaputra river tributaries."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Popup Image *</label>
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Paste Image URL or Upload below"
                    required
                  />
                  <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-700 hover:border-slate-500 bg-slate-900/50 hover:bg-slate-950 p-4 rounded-lg cursor-pointer transition-all">
                    {uploading ? (
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    ) : (
                      <Upload className="w-5 h-5 text-slate-400" />
                    )}
                    <span className="text-sm text-slate-400">
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
                    <div className="mt-2 relative w-full h-32 rounded-lg overflow-hidden border border-slate-700">
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Date Text</label>
                  <input
                    type="text"
                    value={dateText}
                    onChange={(e) => setDateText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="e.g. Oct 2026"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Linked Event ID</label>
                  <input
                    type="text"
                    value={linkedEventId}
                    onChange={(e) => setLinkedEventId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="e.g. ev_123"
                  />
                </div>
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
