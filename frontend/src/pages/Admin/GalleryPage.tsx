import { useState, useEffect } from 'react'
import { Plus, Image as ImageIcon, Trash2, X, Upload, Loader2, AlertTriangle, Check } from 'lucide-react'
import { dynamicGet, dynamicInsert, dynamicDelete, dynamicUpdate, uploadImage } from '../../utils/apiClient'

interface GalleryItem {
  id: string
  image_url: string
  category: string
  caption?: string | null
  status?: string
  uploaded_at: string | number
}

export function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all') // 'all', 'pending', 'approved'

  // Bulk Upload State
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const [jsonInput, setJsonInput] = useState('')
  const [parseError, setParseError] = useState('')
  const [parsedGallery, setParsedGallery] = useState<any[] | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 })
  const [uploadFinished, setUploadFinished] = useState(false)
  
  // Form state
  const [imageUrl, setImageUrl] = useState('')
  const [category, setCategory] = useState('Trekking')
  const [customCategory, setCustomCategory] = useState('')
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
    setCustomCategory('')
    setCaption('')
    setModalOpen(true)
  }

  const handleParseJSON = () => {
    setParseError('')
    setParsedGallery(null)
    try {
      const parsed = JSON.parse(jsonInput)
      let gallery = []
      if (Array.isArray(parsed)) {
        gallery = parsed
      } else if (parsed && Array.isArray(parsed.gallery)) {
        gallery = parsed.gallery
      } else {
        throw new Error('JSON must be an array of gallery items, or an object containing a "gallery" array.')
      }

      if (gallery.length === 0) {
        throw new Error('No gallery items found in the array.')
      }

      if (gallery.length > 100) {
        throw new Error('Maximum 100 items allowed per upload.')
      }

      gallery.forEach((g: any, index: number) => {
        if (!g.category) throw new Error(`Gallery item at index ${index} is missing required 'category' field.`)
      })

      setParsedGallery(gallery)
    } catch (err: any) {
      setParseError(err.message || 'Invalid JSON format.')
    }
  }

  const handleImportGallery = async () => {
    if (!parsedGallery) return
    setIsUploading(true)
    setUploadProgress({ done: 0, total: parsedGallery.length })
    try {
      for (let i = 0; i < parsedGallery.length; i++) {
        const item = parsedGallery[i]
        await dynamicInsert('gallery', {
          image_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop', // default placeholder
          category: item.category || 'Other',
          caption: item.caption || null
        })
        setUploadProgress(prev => ({ ...prev, done: i + 1 }))
      }
      setUploadFinished(true)
      fetchGallery()
    } catch (err: any) {
      alert(`Error importing: ${err.message || 'failed'}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleCloseBulkModal = () => {
    setBulkModalOpen(false)
    setJsonInput('')
    setParsedGallery(null)
    setParseError('')
    setUploadFinished(false)
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
    const finalCategory = category === 'Custom' ? customCategory.trim() : category
    if (!imageUrl || !finalCategory) {
      alert('Please fill out all required fields')
      return
    }

    try {
      setSaving(true)
      const payload: Partial<GalleryItem> = {
        image_url: imageUrl,
        category: finalCategory,
        caption: caption || null,
        status: 'approved' // Admin uploads are auto-approved
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

  const handleApprove = async (id: string) => {
    try {
      await dynamicUpdate('gallery', { id, status: 'approved' })
      fetchGallery()
    } catch (err) {
      alert('Failed to approve photo')
    }
  }

  const filteredItems = items.filter(item => {
    if (filterStatus === 'all') return true
    return (item.status || 'approved') === filterStatus
  })

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-garamond text-[#1B4332] tracking-tight">Manage Gallery</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Upload and categorize photos of club memories</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setBulkModalOpen(true)}
            className="flex items-center justify-center gap-1.5 border border-[#1B4332]/20 hover:bg-[#1B4332]/5 text-[#1B4332] px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-colors flex-1 sm:flex-initial"
          >
            <Upload className="w-4 h-4" />
            Bulk Upload
          </button>
          <button 
            onClick={openAddModal}
            className="flex items-center justify-center gap-1.5 bg-[#FF6B35] hover:bg-[#E0531D] text-white px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-colors flex-1 sm:flex-initial shadow-sm shadow-[#FF6B35]/10"
          >
            <Plus className="w-4 h-4" />
            Add Photo
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-white border border-[#1B4332]/10 rounded-xl p-1 w-full max-w-sm">
        {['all', 'pending', 'approved'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`flex-1 py-1.5 text-xs sm:text-sm font-semibold rounded-lg capitalize transition-colors ${
              filterStatus === status 
                ? 'bg-[#1B4332] text-white' 
                : 'text-slate-500 hover:text-[#1B4332] hover:bg-[#1B4332]/5'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#1B4332]/10 shadow-sm p-6 sm:p-8 text-center">
          <div className="w-12 h-12 bg-[#1B4332]/5 rounded-xl flex items-center justify-center mx-auto mb-3">
            <ImageIcon className="w-6 h-6 text-[#1B4332]/60" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-[#1B4332] mb-1.5">No Photos Found</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto mb-4">
            You haven't uploaded any photos to the gallery yet. Start by uploading one now!
          </p>
          <button 
            onClick={openAddModal}
            className="flex items-center gap-1.5 bg-[#FF6B35] hover:bg-[#E0531D] text-white px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors mx-auto"
          >
            <Plus className="w-4 h-4" />
            Add Photo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white border border-[#1B4332]/10 shadow-sm hover:shadow-md transition-all rounded-xl overflow-hidden group relative flex flex-col">
              <div className="aspect-square bg-slate-50 relative flex-grow">
                <img src={item.image_url} alt={item.caption || 'Gallery photo'} className="w-full h-full object-cover" />
                <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
                  <div className="bg-white/90 backdrop-blur-sm border border-[#1B4332]/10 px-2 py-0.5 rounded-lg text-[9px] font-bold text-[#1B4332] shadow-sm uppercase tracking-wide">
                    {item.category}
                  </div>
                  {item.status === 'pending' && (
                    <div className="bg-amber-100/90 text-amber-700 backdrop-blur-sm border border-amber-200 px-2 py-0.5 rounded-lg text-[9px] font-bold shadow-sm uppercase tracking-wide">
                      Pending
                    </div>
                  )}
                </div>
                
                {/* Overlay actions */}
                <div className="absolute inset-0 bg-[#1B4332]/45 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  <div className="flex items-center gap-2">
                    {item.status === 'pending' && (
                      <button
                        onClick={() => handleApprove(item.id)}
                        className="p-2 sm:p-3 bg-green-500 hover:bg-green-600 text-white rounded-full transition-transform transform scale-90 group-hover:scale-100 shadow-lg flex items-center gap-1"
                        title="Approve Photo"
                      >
                        <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 sm:p-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition-transform transform scale-90 group-hover:scale-100 shadow-lg"
                      title="Delete Photo"
                    >
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>
              </div>
              {item.caption && (
                <div className="p-2 sm:p-3 border-t border-[#1B4332]/5">
                  <p className="text-slate-600 text-[10px] sm:text-xs line-clamp-1 sm:line-clamp-2 leading-snug">{item.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 xs:p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-[#1B4332]/10 rounded-xl shadow-2xl max-w-md w-full max-h-[92vh] flex flex-col my-auto">
            <div className="flex items-center justify-between p-4 border-b border-[#1B4332]/10 shrink-0">
              <h3 className="text-base sm:text-lg font-bold text-[#1B4332] font-garamond">Add Photo to Gallery</h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-3.5 overflow-y-auto flex-grow scrollbar-thin">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Image *</label>
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
                    <span className="text-xs text-[#1B4332]/70 font-medium">
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

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] text-xs sm:text-sm"
                >
                  {/* Default Categories */}
                  {['Trekking', 'Camping', 'Cycling', 'Running', 'Other'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  {/* Dynamically display existing custom categories */}
                  {Array.from(new Set(items.map(item => item.category)))
                    .filter(cat => cat && !['Trekking', 'Camping', 'Cycling', 'Running', 'Other'].includes(cat))
                    .map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))
                  }
                  <option value="Custom">Custom (Create New...)</option>
                </select>
              </div>

              {category === 'Custom' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Custom Category Name *</label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] text-xs sm:text-sm"
                    placeholder="Enter custom category name"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Caption</label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] h-16 resize-none text-xs sm:text-sm"
                  placeholder="Enter a brief caption for this photo..."
                />
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
                  Add Photo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Bulk Upload Modal */}
      {bulkModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-[#1B4332]/10 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col my-auto text-left">
            <div className="flex items-center justify-between p-4 border-b border-[#1B4332]/10 shrink-0">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#FF6B35]" />
                <h3 className="text-base sm:text-lg font-bold text-[#1B4332] font-garamond">Bulk Import Gallery</h3>
              </div>
              <button 
                onClick={handleCloseBulkModal}
                disabled={isUploading}
                className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-grow space-y-4">
              {!parsedGallery && !uploadFinished && (
                <div className="space-y-4 flex flex-col h-full">
                  <div className="text-xs sm:text-sm text-slate-600">
                    Paste a JSON array of gallery items (maximum 100 items per upload) or an object containing a `gallery` array.
                  </div>
                  <textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder={`[\n  {\n    "category": "Trekking",\n    "caption": "Reaching the summit of Saka Haphong at sunrise"\n  },\n  {\n    "category": "Camping",\n    "caption": "Cozy bonfire night under the starry sky of Remakri"\n  }\n]`}
                    className="w-full bg-[#f8fcf8] border border-[#1B4332]/15 text-slate-800 rounded-xl p-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#FF6B35] h-64 resize-none"
                  />
                  {parseError && (
                    <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{parseError}</span>
                    </div>
                  )}
                  <button
                    onClick={handleParseJSON}
                    className="w-full py-2 bg-[#FF6B35] hover:bg-[#E0531D] text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors"
                  >
                    Parse JSON Data
                  </button>
                </div>
              )}

              {parsedGallery && !isUploading && !uploadFinished && (
                <div className="space-y-4">
                  <div className="p-3 bg-[#f0f6f0] border border-[#1B4332]/10 rounded-xl">
                    <span className="text-slate-600 text-xs">Parsed gallery items: </span>
                    <span className="text-[#1B4332] font-bold">{parsedGallery.length} photos ready</span>
                  </div>

                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    <div className="bg-[#f8fcf8] rounded-xl p-3 border border-[#1B4332]/10">
                      <h5 className="text-[10px] font-bold text-[#1B4332] uppercase tracking-wider mb-1.5">Gallery Items to Import</h5>
                      <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                        {parsedGallery.map((g, i) => (
                          <li key={i}>
                            <span className="bg-[#1B4332]/10 text-[#1B4332] text-[9px] font-medium px-1.5 py-0.5 rounded-lg mr-1.5">{g.category}</span>
                            {g.caption || 'No Caption'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="text-[10px] sm:text-xs text-slate-600 flex items-center gap-1.5 bg-[#eef5ee] p-2.5 rounded-xl border border-[#1B4332]/10">
                    <AlertTriangle className="w-4 h-4 text-[#FF6B35] shrink-0" />
                    <span>No image files will be uploaded. The photos will be created with default placeholder images, and you can edit them to upload files later.</span>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-[#1B4332]/10">
                    <button
                      onClick={() => setParsedGallery(null)}
                      className="px-3.5 py-1.5 border border-[#1B4332]/20 hover:bg-[#1B4332]/5 text-[#1B4332] rounded-xl text-xs sm:text-sm font-semibold transition-colors"
                    >
                      Reset / Back
                    </button>
                    <button
                      onClick={handleImportGallery}
                      className="px-4 py-1.5 bg-[#FF6B35] hover:bg-[#E0531D] text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors"
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
                    <h4 className="text-[#1B4332] font-semibold text-sm">Importing Photos...</h4>
                    <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Please do not close this window.</p>
                  </div>
                  <div className="text-[#1B4332] font-semibold text-xs">
                    {uploadProgress.done} / {uploadProgress.total} completed
                  </div>
                </div>
              )}

              {uploadFinished && (
                <div className="py-4 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-200">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-[#1B4332] font-bold text-base">Photos Imported Successfully!</h4>
                    <p className="text-[10px] sm:text-xs text-slate-500 mt-1">
                      Successfully added {uploadProgress.total} gallery photos. You can now edit them to upload files.
                    </p>
                  </div>
                  <button
                    onClick={handleCloseBulkModal}
                    className="w-full max-w-xs py-2 bg-[#1B4332] hover:bg-[#163527] text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors"
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
