import { useState, useEffect } from 'react'
import { Plus, Image as ImageIcon, Trash2, X, Upload, Loader2, Edit, ExternalLink, Link2 } from 'lucide-react'
import { dynamicGet, dynamicInsert, dynamicUpdate, dynamicDelete, uploadImage } from '../../utils/apiClient'
import { slugify } from '../../utils/slugify'

interface Banner {
  id: string
  image_url: string
  is_active: boolean
  order_index: number
  topic?: string
  start_date?: number | string
  end_date?: number | string
  created_at: string | number
  link_type?: string | null
  link_value?: string | null
}

export function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'active' | 'upcoming' | 'archived'>('active')

  // Form State
  const [imageUrl, setImageUrl] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [orderIndex, setOrderIndex] = useState(0)
  const [topic, setTopic] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [linkType, setLinkType] = useState('none') // 'none' | 'event' | 'gallery' | 'blog' | 'custom'
  const [linkValue, setLinkValue] = useState('')

  // Linked Resources State
  const [events, setEvents] = useState<any[]>([])
  const [blogs, setBlogs] = useState<any[]>([])
  const [galleryItems, setGalleryItems] = useState<any[]>([])

  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchBanners = async () => {
    try {
      setLoading(true)
      const data = await dynamicGet<Banner>('banners', { order: 'order_index', dir: 'asc' })
      setBanners(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadLinkOptions = async () => {
    try {
      const [evs, blgs, gals] = await Promise.all([
        dynamicGet('events', { order: 'date', dir: 'desc' }),
        dynamicGet('blog_posts', { order: 'published_at', dir: 'desc' }),
        dynamicGet('gallery', { order: 'uploaded_at', dir: 'desc' })
      ])
      setEvents(evs || [])
      setBlogs(blgs || [])
      setGalleryItems(gals || [])
    } catch (err) {
      console.error("Failed to load banner linking options:", err)
    }
  }

  useEffect(() => {
    fetchBanners()
    loadLinkOptions()
  }, [])

  const openAddModal = () => {
    setEditingBanner(null)
    setImageUrl('')
    setIsActive(true)
    setOrderIndex(banners.length)
    setTopic('')
    setStartDate('')
    setEndDate('')
    setLinkType('none')
    setLinkValue('')
    setModalOpen(true)
  }

  const openEditModal = (banner: Banner) => {
    setEditingBanner(banner)
    setImageUrl(banner.image_url)
    setIsActive(banner.is_active)
    setOrderIndex(banner.order_index)
    setTopic(banner.topic || '')
    setLinkType(banner.link_type || 'none')
    setLinkValue(banner.link_value || '')
    
    const pad = (n: number) => String(n).padStart(2, '0')
    if (banner.start_date) {
      const dStart = new Date(Number(banner.start_date))
      setStartDate(`${dStart.getFullYear()}-${pad(dStart.getMonth() + 1)}-${pad(dStart.getDate())}T${pad(dStart.getHours())}:${pad(dStart.getMinutes())}`)
    } else {
      setStartDate('')
    }

    if (banner.end_date) {
      const dEnd = new Date(Number(banner.end_date))
      setEndDate(`${dEnd.getFullYear()}-${pad(dEnd.getMonth() + 1)}-${pad(dEnd.getDate())}T${pad(dEnd.getHours())}:${pad(dEnd.getMinutes())}`)
    } else {
      setEndDate('')
    }

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
    if (!imageUrl) {
      alert('Image URL is required')
      return
    }

    try {
      setSaving(true)
      const payload: Partial<Banner> = {
        image_url: imageUrl,
        is_active: isActive,
        order_index: orderIndex,
        topic: topic || undefined,
        start_date: startDate ? new Date(startDate).getTime() : undefined,
        end_date: endDate ? new Date(endDate).getTime() : undefined,
        link_type: linkType,
        link_value: linkValue || undefined
      }

      if (editingBanner) {
        await dynamicUpdate('banners', { ...payload, id: editingBanner.id } as any)
      } else {
        await dynamicInsert('banners', payload)
      }

      setModalOpen(false)
      fetchBanners()
    } catch (err) {
      alert('Failed to save banner')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return
    try {
      await dynamicDelete('banners', { id })
      fetchBanners()
    } catch (err) {
      alert('Failed to delete banner')
    }
  }

  // Classification Logic
  const now = Date.now()

  const activeBanners = banners.filter(b => {
    const isAct = b.is_active;
    const start = b.start_date ? Number(b.start_date) : 0;
    const end = b.end_date ? Number(b.end_date) : Infinity;
    return isAct && now >= start && now <= end;
  });

  const upcomingBanners = banners.filter(b => {
    const isAct = b.is_active;
    const start = b.start_date ? Number(b.start_date) : 0;
    return isAct && start > now;
  });

  const archivedBanners = banners.filter(b => {
    const isAct = b.is_active;
    const end = b.end_date ? Number(b.end_date) : Infinity;
    return !isAct || end < now;
  });

  const currentTabBanners = 
    activeTab === 'active' ? activeBanners :
    activeTab === 'upcoming' ? upcomingBanners :
    archivedBanners;

  return (
    <div className="space-y-4 sm:space-y-6 text-[#1B4332]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1B4332] font-garamond">Manage Banners</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Upload and manage homepage banner images</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center justify-center gap-1.5 bg-[#FF6B35] hover:bg-[#e65a29] text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Add Banner
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1B4332]/10">
        {[
          { id: 'active', label: 'Active', count: activeBanners.length, color: 'border-[#FF6B35] bg-[#FF6B35]/10 text-[#FF6B35]' },
          { id: 'upcoming', label: 'Upcoming', count: upcomingBanners.length, color: 'border-blue-500 bg-blue-50 text-blue-600' },
          { id: 'archived', label: 'Archived', count: archivedBanners.length, color: 'border-slate-400 bg-slate-100 text-slate-500' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all ${activeTab === tab.id ? `${tab.color.split(' ')[0]} text-[#1B4332]` : 'border-transparent text-slate-500 hover:text-[#1B4332]'}`}
          >
            <span>{tab.label}</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === tab.id ? tab.color.split(' ').slice(1,3).join(' ') : 'bg-slate-100 text-slate-500'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mt-2 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white border border-[#1B4332]/10 rounded-2xl overflow-hidden shadow-sm flex flex-col">
              <div className="aspect-[16/9] w-full bg-slate-200"></div>
              <div className="p-3.5 flex-grow flex flex-col justify-between gap-2">
                <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                <div className="h-3 bg-slate-200 rounded w-1/3 mt-2"></div>
                <div className="border-t border-[#1B4332]/5 pt-2 mt-2">
                  <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : currentTabBanners.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#1B4332]/10 p-8 text-center mt-2 text-[#1B4332]">
          <div className="w-12 h-12 bg-slate-50 border border-[#1B4332]/5 rounded-xl flex items-center justify-center mx-auto mb-3">
            <ImageIcon className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-base font-bold font-garamond mb-1">No Banners Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            There are currently no banners in the "{activeTab}" tab.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mt-2">
          {currentTabBanners.map((banner) => {
            const hasLink = banner.link_type && banner.link_type !== 'none'
            return (
              <div key={banner.id} className="bg-white border border-[#1B4332]/10 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col group relative">
                <div className="aspect-[16/9] w-full bg-slate-100 relative">
                  <img src={banner.image_url} alt="Banner" className="w-full h-full object-cover" />
                  
                  {/* Order & Status Badge */}
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    <span className="bg-white/90 backdrop-blur-sm border border-[#1B4332]/10 px-2 py-0.5 rounded text-[10px] font-extrabold text-[#1B4332]">
                      Order: {banner.order_index}
                    </span>
                    {banner.is_active ? (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${Number(banner.start_date) > now ? 'bg-blue-500 text-white' : 'bg-emerald-600 text-white'}`}>
                        {Number(banner.start_date) > now ? 'Upcoming' : 'Active'}
                      </span>
                    ) : (
                      <span className="bg-slate-400 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                        Inactive
                      </span>
                    )}
                  </div>
                  
                  {/* Actions overlay on hover */}
                  <div className="absolute inset-0 bg-[#102d21]/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      onClick={() => openEditModal(banner)}
                      className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full transition-transform transform scale-90 group-hover:scale-100 shadow-md"
                      title="Edit Banner"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(banner.id)}
                      className="p-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full transition-transform transform scale-90 group-hover:scale-100 shadow-md"
                      title="Delete Banner"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-3.5 flex-grow flex flex-col justify-between gap-2">
                  <div>
                    {banner.topic ? (
                      <h4 className="text-[#1B4332] font-bold text-sm truncate">{banner.topic}</h4>
                    ) : (
                      <h4 className="text-slate-400 italic text-xs">No Topic Specified</h4>
                    )}

                    {/* Dates */}
                    {(banner.start_date || banner.end_date) && (
                      <div className="text-[10px] text-slate-500 space-y-0.5 mt-1">
                        {banner.start_date && (
                          <div>Start: {new Date(Number(banner.start_date)).toLocaleDateString()} {new Date(Number(banner.start_date)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        )}
                        {banner.end_date && (
                          <div>End: {new Date(Number(banner.end_date)).toLocaleDateString()} {new Date(Number(banner.end_date)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Linking display */}
                  <div className="border-t border-[#1B4332]/5 pt-2 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">Linking:</span>
                    {hasLink ? (
                      <span className="bg-[#eef5ee] text-[#1B4332] border border-[#1B4332]/10 px-1.5 py-0.5 rounded truncate max-w-[140px] font-semibold" title={`${banner.link_type}: ${banner.link_value}`}>
                        {banner.link_type}: {banner.link_value}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">None</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit/Add Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-[#102d21]/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white border border-[#1B4332]/10 rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col my-auto text-[#1B4332] animate-zoom-in">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
              <h3 className="text-base sm:text-lg font-bold font-garamond text-[#1B4332]">
                {editingBanner ? 'Edit Banner' : 'Add Banner Image'}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-[#1B4332] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-3.5 overflow-y-auto flex-grow scrollbar-thin">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Banner Image *</label>
                <div className="flex flex-col gap-1.5">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] text-xs sm:text-sm"
                    placeholder="Paste Image URL or Upload below"
                    required
                  />

                  <label className="flex items-center justify-center gap-1.5 border border-dashed border-[#1B4332]/20 hover:border-[#FF6B35] bg-[#f8fcf8]/50 hover:bg-[#f8fcf8] p-2.5 rounded-xl cursor-pointer transition-all shrink-0">
                    {uploading ? (
                      <Loader2 className="w-4 h-4 text-[#FF6B35] animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="text-xs text-slate-505">
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
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-505 mb-1">Topic / Header (Optional)</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] text-xs sm:text-sm"
                    placeholder="e.g. Sajek Expedition 2026"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-505 mb-1">Link Type</label>
                  <select
                    value={linkType}
                    onChange={(e) => {
                      setLinkType(e.target.value)
                      setLinkValue('')
                    }}
                    className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] text-xs sm:text-sm"
                  >
                    <option value="none">None</option>
                    <option value="event">Event Details</option>
                    <option value="blog">Blog Post Details</option>
                    <option value="gallery">Gallery Item</option>
                    <option value="custom">Custom URL / Path</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-505 mb-1">Link Destination</label>
                  {linkType === 'none' && (
                    <input
                      type="text"
                      disabled
                      placeholder="No link configured"
                      className="w-full bg-[#f8fcf8] border border-slate-200 text-slate-400 rounded-xl px-3 py-2 text-xs sm:text-sm cursor-not-allowed"
                    />
                  )}

                  {linkType === 'event' && (
                    <select
                      value={linkValue}
                      onChange={(e) => setLinkValue(e.target.value)}
                      className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] text-xs sm:text-sm"
                      required
                    >
                      <option value="">-- Select Event --</option>
                      {events.map((e: any) => (
                        <option key={e.id} value={slugify(e.title)}>{e.title}</option>
                      ))}
                    </select>
                  )}

                  {linkType === 'blog' && (
                    <select
                      value={linkValue}
                      onChange={(e) => setLinkValue(e.target.value)}
                      className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] text-xs sm:text-sm"
                      required
                    >
                      <option value="">-- Select Blog Post --</option>
                      {blogs.map((b: any) => (
                        <option key={b.id} value={slugify(b.title)}>{b.title}</option>
                      ))}
                    </select>
                  )}

                  {linkType === 'gallery' && (
                    <select
                      value={linkValue}
                      onChange={(e) => setLinkValue(e.target.value)}
                      className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] text-xs sm:text-sm"
                      required
                    >
                      <option value="">-- Select Gallery Photo --</option>
                      {galleryItems.map((g: any) => (
                        <option key={g.id} value={`${slugify(g.caption || 'photo')}-${g.id}`}>
                          [{g.category}] {g.caption ? g.caption.substring(0, 30) + '...' : 'Photo ' + g.id.substring(0, 5)}
                        </option>
                      ))}
                    </select>
                  )}

                  {linkType === 'custom' && (
                    <input
                      type="text"
                      value={linkValue}
                      onChange={(e) => setLinkValue(e.target.value)}
                      className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] text-xs sm:text-sm"
                      placeholder="e.g. /about or https://google.com"
                      required
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-505 mb-1">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-505 mb-1">End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-505 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={orderIndex}
                    onChange={(e) => setOrderIndex(Number(e.target.value))}
                    className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] text-xs sm:text-sm"
                    min="0"
                  />
                </div>

                <div className="flex items-center pl-2 pt-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 rounded border-[#1B4332]/15 text-[#1B4332] focus:ring-[#FF6B35]"
                    />
                    <span className="text-xs sm:text-sm font-semibold text-slate-600">Active Status</span>
                  </label>
                </div>
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
                  Save Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
