import { useState, useEffect } from 'react'
import { Plus, Image as ImageIcon, Trash2, X, Upload, Loader2 } from 'lucide-react'
import { dynamicGet, dynamicInsert, dynamicDelete, uploadImage } from '../../utils/apiClient'

interface GalleryItem {
  id: string
  image_url: string
  category: string
  caption?: string | null
  uploaded_at: string | number
}

export function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  
  // Form state
  const [imageUrl, setImageUrl] = useState('')
  const [category, setCategory] = useState('Trekking')
  const [caption, setCaption] = useState('')
  
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchGallery = async () => {
    try {
      setLoading(true)
      const data = await dynamicGet<GalleryItem>('gallery', { order: 'uploaded_at', dir: 'desc' })
      setItems(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGallery()
  }, [])

  const openAddModal = () => {
    setImageUrl('')
    setCategory('Trekking')
    setCaption('')
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
    if (!imageUrl || !category) {
      alert('Please fill out all required fields')
      return
    }

    try {
      setSaving(true)
      const payload: Partial<GalleryItem> = {
        image_url: imageUrl,
        category,
        caption: caption || null
      }

      await dynamicInsert('gallery', payload)
      setModalOpen(false)
      fetchGallery()
    } catch (err) {
      alert('Failed to add photo')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return
    try {
      await dynamicDelete('gallery', { id })
      fetchGallery()
    } catch (err) {
      alert('Failed to delete photo')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Manage Gallery</h2>
          <p className="text-slate-400 mt-1">Upload and categorize photos of club memories</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-md"
        >
          <Plus className="w-5 h-5" />
          Add Photo
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
          <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No Photos Found</h3>
          <p className="text-slate-400 max-w-sm mx-auto mb-6">
            You haven't uploaded any photos to the gallery yet. Start by uploading one now!
          </p>
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors mx-auto"
          >
            <Plus className="w-5 h-5" />
            Add Photo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <div key={item.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-md group relative">
              <div className="aspect-square bg-slate-900 relative">
                <img src={item.image_url} alt={item.caption || 'Gallery photo'} className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2 bg-slate-800/90 backdrop-blur-sm border border-slate-700 px-2 py-0.5 rounded text-xs font-semibold text-blue-400">
                  {item.category}
                </div>
                
                {/* Delete overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition-transform transform scale-90 group-hover:scale-100"
                    title="Delete Photo"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              {item.caption && (
                <div className="p-4 border-t border-slate-700/50">
                  <p className="text-slate-300 text-sm line-clamp-2">{item.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h3 className="text-lg font-bold text-white">Add Photo to Gallery</h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Image *</label>
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

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="Trekking">Trekking</option>
                  <option value="Camping">Camping</option>
                  <option value="Cycling">Cycling</option>
                  <option value="Running">Running</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Caption</label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 text-sm"
                  placeholder="Enter a brief caption for this photo..."
                />
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
                  Add Photo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
