import { useState, useEffect, useMemo } from 'react'
import { Plus, Image as ImageIcon, Trash2, X, Upload, Loader2, AlertTriangle, Check, ArrowLeft, Folder } from 'lucide-react'
import { dynamicGet, dynamicInsert, dynamicDelete, dynamicUpdate, uploadImage } from '../../utils/apiClient'

interface GalleryItem {
  id: string
  image_url: string
  category: string
  caption?: string | null
  status?: string
  uploaded_at: string | number
}

interface EventItem {
  id: string
  title: string
}

interface BlogItem {
  id: string
  title: string
}

export function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [events, setEvents] = useState<EventItem[]>([])
  const [blogs, setBlogs] = useState<BlogItem[]>([])
  const [loading, setLoading] = useState(true)
  
  // Navigation State
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState('all') // 'all', 'pending', 'approved'

  // Modal States
  const [modalOpen, setModalOpen] = useState(false)
  const [bulkModalOpen, setBulkModalOpen] = useState(false)

  // Bulk JSON State
  const [jsonInput, setJsonInput] = useState('')
  const [parseError, setParseError] = useState('')
  const [parsedGallery, setParsedGallery] = useState<any[] | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 })
  const [uploadFinished, setUploadFinished] = useState(false)
  
  // Add Photo Form State
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])
  const [categoryType, setCategoryType] = useState('Standard') // 'Standard', 'Event', 'Blog', 'Custom'
  const [category, setCategory] = useState('Trekking')
  const [customCategory, setCustomCategory] = useState('')
  const [selectedEventId, setSelectedEventId] = useState('')
  const [selectedBlogId, setSelectedBlogId] = useState('')
  const [caption, setCaption] = useState('')
  
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [galleryData, eventsData, blogsData] = await Promise.all([
        dynamicGet<GalleryItem>('gallery', { order: 'uploaded_at', dir: 'desc' }),
        dynamicGet<EventItem>('events', { order: 'date', dir: 'desc' }),
        dynamicGet<BlogItem>('blog_posts', { order: 'created_at', dir: 'desc' })
      ])
      setItems(galleryData)
      setEvents(eventsData)
      setBlogs(blogsData)
      
      // Select defaults for dropdowns if available
      if (eventsData.length > 0) setSelectedEventId(eventsData[0].id)
      if (blogsData.length > 0) setSelectedBlogId(blogsData[0].id)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const folders = useMemo(() => {
    const grouped = items.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = []
      acc[item.category].push(item)
      return acc
    }, {} as Record<string, GalleryItem[]>)

    return Object.entries(grouped).map(([cat, photos]) => {
      const cover = photos.find(p => p.image_url)?.image_url || photos[0]?.image_url
      return { category: cat, photos, cover, count: photos.length }
    })
  }, [items])

  const openAddModal = () => {
    setUploadedUrls([])
    setCategoryType('Standard')
    setCategory('Trekking')
    setCustomCategory('')
    setCaption('')
    if (events.length > 0) setSelectedEventId(events[0].id)
    if (blogs.length > 0) setSelectedBlogId(blogs[0].id)
    setModalOpen(true)
  }

  // --- Bulk JSON Handlers ---
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
      if (gallery.length === 0) throw new Error('No gallery items found in the array.')
      if (gallery.length > 100) throw new Error('Maximum 100 items allowed per upload.')
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
          image_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop',
          category: item.category || 'Other',
          caption: item.caption || null
        })
        setUploadProgress(prev => ({ ...prev, done: i + 1 }))
      }
      setUploadFinished(true)
      fetchData()
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

  const handleMultipleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    try {
      setUploading(true)
      const newUrls: string[] = []
      for (const file of files) {
        const res = await uploadImage(file)
        if (res.success && res.url) {
          newUrls.push(res.url)
        }
      }
      setUploadedUrls(prev => [...prev, ...newUrls])
    } catch (err) {
      alert('Error uploading multiple images')
    } finally {
      setUploading(false)
    }
  }

  const getFinalCategory = () => {
    if (categoryType === 'Standard') return category
    if (categoryType === 'Custom') return customCategory.trim()
    if (categoryType === 'Event') {
      const ev = events.find(e => e.id === selectedEventId)
      return ev ? `Event: ${ev.title}` : 'Unlinked Event'
    }
    if (categoryType === 'Blog') {
      const bl = blogs.find(b => b.id === selectedBlogId)
      return bl ? `Blog: ${bl.title}` : 'Unlinked Blog'
    }
    return 'Other'
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const finalCategory = getFinalCategory()
    if (uploadedUrls.length === 0 || !finalCategory) {
      alert('Please select at least one image and specify a category')
      return
    }

    try {
      setSaving(true)
      for (const url of uploadedUrls) {
        const payload: Partial<GalleryItem> = {
          image_url: url,
          category: finalCategory,
          caption: caption || null,
          status: 'approved'
        }
        await dynamicInsert('gallery', payload)
      }
      setModalOpen(false)
      fetchData()
    } catch (err) {
      alert('Failed to add photo(s)')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return
    setItems(prev => prev.filter(i => i.id !== id))
    try {
      await dynamicDelete('gallery', { id })
      fetchData()
    } catch (err) {
      alert('Failed to delete photo')
      fetchData()
    }
  }

  const handleApprove = async (id: string) => {
    try {
      await dynamicUpdate('gallery', { id, status: 'approved' })
      fetchData()
    } catch (err) {
      alert('Failed to approve photo')
    }
  }

  const filteredPhotos = items.filter(item => {
    if (selectedFolder && item.category !== selectedFolder) return false
    if (filterStatus === 'all') return true
    return (item.status || 'approved') === filterStatus
  })

  // Derive existing custom categories for dropdown
  const existingCategories = Array.from(new Set(items.map(item => item.category)))
    .filter(cat => cat && !['Trekking', 'Camping', 'Cycling', 'Running', 'Other'].includes(cat) && !cat.startsWith('Event:') && !cat.startsWith('Blog:'))

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          {selectedFolder ? (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSelectedFolder(null)}
                className="p-2 bg-white border border-[#1B4332]/10 rounded-xl hover:bg-[#1B4332]/5 text-[#1B4332] transition-colors shadow-sm"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold font-garamond text-[#1B4332] tracking-tight">{selectedFolder}</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Manage photos in this folder</p>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-garamond text-[#1B4332] tracking-tight">Manage Gallery</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Upload and categorize photos of club memories</p>
            </div>
          )}
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

      {selectedFolder && (
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
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin" />
        </div>
      ) : selectedFolder ? (
        /* Detailed View of Photos inside a Folder */
        filteredPhotos.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#1B4332]/10 shadow-sm p-6 sm:p-8 text-center">
            <div className="w-12 h-12 bg-[#1B4332]/5 rounded-xl flex items-center justify-center mx-auto mb-3">
              <ImageIcon className="w-6 h-6 text-[#1B4332]/60" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-[#1B4332] mb-1.5">No Photos Found</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto mb-4">
              There are no photos in this folder matching the current filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {filteredPhotos.map((item) => (
              <div key={item.id} className="bg-white border border-[#1B4332]/10 shadow-sm hover:shadow-md transition-all rounded-xl overflow-hidden group relative flex flex-col">
                <div className="aspect-square bg-slate-50 relative flex-grow">
                  <img src={item.image_url} alt={item.caption || 'Gallery photo'} className="w-full h-full object-cover" />
                  <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
                    {item.status === 'pending' && (
                      <div className="bg-amber-100/90 text-amber-700 backdrop-blur-sm border border-amber-200 px-2 py-0.5 rounded-lg text-[9px] font-bold shadow-sm uppercase tracking-wide">
                        Pending
                      </div>
                    )}
                  </div>
                  
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
        )
      ) : (
        /* Folder Grid View */
        folders.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#1B4332]/10 shadow-sm p-6 sm:p-8 text-center">
            <div className="w-12 h-12 bg-[#1B4332]/5 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Folder className="w-6 h-6 text-[#1B4332]/60" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-[#1B4332] mb-1.5">No Folders Found</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto mb-4">
              You haven't uploaded any photos to the gallery yet.
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {folders.map((folder) => (
              <div 
                key={folder.category} 
                onClick={() => setSelectedFolder(folder.category)}
                className="bg-white border border-[#1B4332]/10 shadow-sm hover:shadow-lg transition-all rounded-[32px] overflow-hidden group cursor-pointer relative"
              >
                <div className="aspect-square bg-slate-100 relative overflow-hidden">
                  {folder.cover ? (
                    <img 
                      src={folder.cover} 
                      alt={folder.category} 
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <ImageIcon className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1B4332]/60 via-transparent to-transparent opacity-80" />
                  
                  <div className="absolute top-4 left-4 flex flex-col gap-1">
                    <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-[11px] font-bold text-[#1B4332] shadow-sm uppercase tracking-wider">
                      {folder.category}
                    </div>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <div className="text-sm font-semibold opacity-90">{folder.count} {folder.count === 1 ? 'Photo' : 'Photos'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Upload Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 xs:p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-[#1B4332]/10 rounded-xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col my-auto">
            <div className="flex items-center justify-between p-4 border-b border-[#1B4332]/10 shrink-0">
              <h3 className="text-base sm:text-lg font-bold text-[#1B4332] font-garamond">Add Photos to Gallery</h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-4 overflow-y-auto flex-grow scrollbar-thin">
              
              {/* Category Linking Section */}
              <div className="p-3 bg-[#f8fcf8] border border-[#1B4332]/15 rounded-xl space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1B4332] mb-1.5">Link Folder / Category Type</label>
                  <div className="flex flex-wrap gap-2">
                    {['Standard', 'Event', 'Blog', 'Custom'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setCategoryType(type)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                          categoryType === type 
                            ? 'bg-[#1B4332] text-white border-[#1B4332]' 
                            : 'bg-white text-slate-600 border-slate-200 hover:border-[#1B4332]/30'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {categoryType === 'Standard' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Select Standard Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-white text-slate-800 border border-[#1B4332]/15 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] text-xs sm:text-sm"
                    >
                      {['Trekking', 'Camping', 'Cycling', 'Running', 'Other'].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      {existingCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                )}

                {categoryType === 'Custom' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Custom Category Name *</label>
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full bg-white text-slate-800 border border-[#1B4332]/15 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] text-xs sm:text-sm"
                      placeholder="e.g. Annual Retreat 2024"
                      required
                    />
                  </div>
                )}

                {categoryType === 'Event' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Link to Event</label>
                    {events.length > 0 ? (
                      <select
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value)}
                        className="w-full bg-white text-slate-800 border border-[#1B4332]/15 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] text-xs sm:text-sm"
                      >
                        {events.map(ev => (
                          <option key={ev.id} value={ev.id}>{ev.title}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-xs text-red-500">No events found. Please create an event first.</p>
                    )}
                  </div>
                )}

                {categoryType === 'Blog' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Link to Blog Post</label>
                    {blogs.length > 0 ? (
                      <select
                        value={selectedBlogId}
                        onChange={(e) => setSelectedBlogId(e.target.value)}
                        className="w-full bg-white text-slate-800 border border-[#1B4332]/15 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] text-xs sm:text-sm"
                      >
                        {blogs.map(bl => (
                          <option key={bl.id} value={bl.id}>{bl.title}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-xs text-red-500">No blog posts found. Please create a blog post first.</p>
                    )}
                  </div>
                )}
                
                <div className="pt-2">
                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-500" />
                    Folder will be named: <span className="font-bold text-[#1B4332]">{getFinalCategory()}</span>
                  </div>
                </div>
              </div>

              {/* Images Section */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Images *</label>
                <div className="flex flex-col gap-2">
                  <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#1B4332]/20 hover:border-[#FF6B35] bg-[#f8fcf8] hover:bg-[#f2faf2] p-6 rounded-xl cursor-pointer transition-all shrink-0 text-center">
                    {uploading ? (
                      <Loader2 className="w-6 h-6 text-[#FF6B35] animate-spin" />
                    ) : (
                      <Upload className="w-6 h-6 text-[#1B4332]/40" />
                    )}
                    <div>
                      <span className="block text-sm text-[#1B4332] font-bold">
                        {uploading ? 'Uploading Images...' : 'Click to Upload Multiple Images'}
                      </span>
                      <span className="block text-xs text-slate-500 mt-0.5">You can select multiple files at once</span>
                    </div>
                    <input 
                      type="file" 
                      accept="image/*"
                      multiple
                      onChange={handleMultipleImageUpload}
                      disabled={uploading}
                      className="hidden" 
                    />
                  </label>

                  {uploadedUrls.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2 shrink-0">
                      {uploadedUrls.map((url, idx) => (
                        <div key={idx} className="relative group w-full aspect-square rounded-xl overflow-hidden border border-[#1B4332]/10">
                          <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => setUploadedUrls(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1.5 right-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Shared Caption (Optional)</label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] h-16 resize-none text-xs sm:text-sm"
                  placeholder="Caption applies to all selected photos..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#1B4332]/10 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-[#1B4332]/20 hover:bg-[#1B4332]/5 text-[#1B4332] rounded-xl text-xs sm:text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading || uploadedUrls.length === 0}
                  className="flex items-center gap-1.5 px-5 py-2 bg-[#FF6B35] hover:bg-[#E0531D] disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors shadow-sm"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save {uploadedUrls.length > 0 ? uploadedUrls.length : ''} Photos
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
                    Paste a JSON array of gallery items (maximum 100 items per upload) or an object containing a \`gallery\` array.
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
