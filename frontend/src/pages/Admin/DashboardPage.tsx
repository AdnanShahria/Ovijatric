import { useState, useEffect } from 'react'
import { Users, Activity, FileText, Image as ImageIcon, Loader2, Upload, X, Check, AlertTriangle } from 'lucide-react'
import { dynamicGet, dynamicInsert } from '../../utils/apiClient'

interface BulkData {
  blogs?: Array<{
    title: string
    content: string
  }>
  gallery?: Array<{
    category: string
    caption?: string
  }>
  events?: Array<{
    title: string
    description: string
    title_bn?: string
    description_bn?: string
    date?: string
    location: string
    fee?: string
    total_spots?: number
    tags?: string
    sponsors?: string
    is_registration_open?: boolean
  }>
}

export function DashboardPage() {
  const [counts, setCounts] = useState({
    events: 0,
    gallery: 0,
    users: 0,
    blogs: 0
  })
  const [loading, setLoading] = useState(true)
  const [bulkModalOpen, setBulkModalOpen] = useState(false)

  // Bulk Upload Form State
  const [jsonInput, setJsonInput] = useState('')
  const [parseError, setParseError] = useState('')
  const [parsedData, setParsedData] = useState<BulkData | null>(null)
  
  // Bulk Upload Processing State
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({
    blogsDone: 0,
    blogsTotal: 0,
    galleryDone: 0,
    galleryTotal: 0,
    eventsDone: 0,
    eventsTotal: 0
  })
  const [uploadFinished, setUploadFinished] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const [evs, gals, usrs, blgs] = await Promise.all([
        dynamicGet('events'),
        dynamicGet('gallery'),
        dynamicGet('users'),
        dynamicGet('blog_posts')
      ])
      setCounts({
        events: evs.length,
        gallery: gals.length,
        users: usrs.length,
        blogs: blgs.length
      })
    } catch (err) {
      console.error('Failed to load dashboard counts:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const stats = [
    { name: 'Total Events', value: loading ? '...' : String(counts.events), icon: Activity, color: 'text-[#FF6B35]', bg: 'bg-[#FF6B35]/10' },
    { name: 'Gallery Photos', value: loading ? '...' : String(counts.gallery), icon: ImageIcon, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'Total Users', value: loading ? '...' : String(counts.users), icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
    { name: 'Blog Posts', value: loading ? '...' : String(counts.blogs), icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  const handleParseJSON = () => {
    setParseError('')
    setParsedData(null)

    if (!jsonInput.trim()) {
      setParseError('Please enter some JSON content to parse.')
      return
    }

    try {
      const parsed = JSON.parse(jsonInput)
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('Root JSON element must be an object.')
      }

      const blogs = Array.isArray(parsed.blogs) ? parsed.blogs : []
      const gallery = Array.isArray(parsed.gallery) ? parsed.gallery : []
      const events = Array.isArray(parsed.events) ? parsed.events : []

      if (blogs.length === 0 && gallery.length === 0 && events.length === 0) {
        throw new Error('No blogs, gallery items, or events found in JSON. Make sure at least one of these arrays contains items.')
      }

      const totalItems = blogs.length + gallery.length + events.length
      if (totalItems > 100) {
        throw new Error('Maximum 100 total items allowed per upload.')
      }

      // Basic structure validation
      blogs.forEach((b: any, index: number) => {
        if (!b.title) throw new Error(`Blog at index ${index} is missing required 'title' field.`)
        if (!b.content) throw new Error(`Blog at index ${index} is missing required 'content' field.`)
      })

      gallery.forEach((g: any, index: number) => {
        if (!g.category) throw new Error(`Gallery item at index ${index} is missing required 'category' field.`)
      })

      events.forEach((e: any, index: number) => {
        if (!e.title) throw new Error(`Event at index ${index} is missing required 'title' field.`)
        if (!e.description) throw new Error(`Event at index ${index} is missing required 'description' field.`)
        if (!e.location) throw new Error(`Event at index ${index} is missing required 'location' field.`)
      })

      setParsedData({ blogs, gallery, events })
    } catch (err: any) {
      setParseError(err.message || 'Invalid JSON format.')
    }
  }

  const handleExecuteImport = async () => {
    if (!parsedData) return

    setIsUploading(true)
    setUploadFinished(false)

    const { blogs = [], gallery = [], events = [] } = parsedData

    setUploadProgress({
      blogsDone: 0,
      blogsTotal: blogs.length,
      galleryDone: 0,
      galleryTotal: gallery.length,
      eventsDone: 0,
      eventsTotal: events.length
    })

    try {
      // 1. Upload blogs
      for (let i = 0; i < blogs.length; i++) {
        const blog = blogs[i]
        await dynamicInsert('blog_posts', {
          title: blog.title,
          content: blog.content,
          image_url: null
        })
        setUploadProgress(prev => ({ ...prev, blogsDone: i + 1 }))
      }

      // 2. Upload gallery items
      for (let i = 0; i < gallery.length; i++) {
        const item = gallery[i]
        await dynamicInsert('gallery', {
          image_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop', // default placeholder
          category: item.category || 'Other',
          caption: item.caption || null
        })
        setUploadProgress(prev => ({ ...prev, galleryDone: i + 1 }))
      }

      // 3. Upload events
      for (let i = 0; i < events.length; i++) {
        const ev = events[i]
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
          image_url: null, // admin will edit later
          hover_image_url: null,
          additional_images: JSON.stringify([]),
          tags: ev.tags || null,
          sponsors: ev.sponsors || null,
          is_registration_open: ev.is_registration_open ? 1 : 0
        })
        setUploadProgress(prev => ({ ...prev, eventsDone: i + 1 }))
      }

      setUploadFinished(true)
      await loadData() // Refresh dashboard stats
    } catch (err: any) {
      alert(`Error during bulk import: ${err.message || 'Operation failed'}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleCloseModal = () => {
    setBulkModalOpen(false)
    setJsonInput('')
    setParsedData(null)
    setParseError('')
    setUploadFinished(false)
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-extrabold text-[#1B4332] tracking-tight font-garamond">Dashboard Overview</h2>
        <button
          onClick={() => setBulkModalOpen(true)}
          className="flex items-center justify-center gap-1.5 bg-[#1B4332] hover:bg-[#143225] text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm"
        >
          <Upload className="w-4 h-4" />
          Bulk Upload
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="bg-white rounded-2xl p-3.5 sm:p-5 md:p-6 border border-[#1B4332]/10 shadow-sm hover:shadow-md transition-shadow duration-200 animate-fade-in flex flex-col justify-between">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{stat.name}</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#1B4332] mt-1 sm:mt-2 truncate">{stat.value}</p>
                </div>
                <div className={`w-8 h-8 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 ${stat.bg}`}>
                  <Icon className={`w-4.5 h-4.5 sm:w-5 sm:h-5 ${stat.color}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-2xl border border-[#1B4332]/10 p-4 sm:p-6 min-h-[220px] md:min-h-[350px] flex flex-col shadow-sm">
        <h3 className="text-base sm:text-lg font-bold text-[#1B4332] font-garamond mb-3 sm:mb-4">Recent Activity</h3>
        <div className="flex-grow flex flex-col items-center justify-center text-center border-2 border-dashed border-[#1B4332]/10 rounded-xl p-4 sm:p-6">
          <Activity className="w-8 h-8 sm:w-12 sm:h-12 text-[#1B4332]/25 mb-2" />
          <h4 className="text-[#1B4332] font-bold text-sm sm:text-base mb-1">Activity Tracking Engaged</h4>
          <p className="text-slate-500 text-xs sm:text-sm max-w-md">All changes to events, galleries, team lists, and blogs are now live in the global distributed database.</p>
        </div>
      </div>

      {/* Bulk Upload Modal */}
      {bulkModalOpen && (
        <div className="fixed inset-0 bg-[#102d21]/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-[#1B4332]/10 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col my-auto animate-zoom-in text-[#1B4332]">
            <div className="flex items-center justify-between p-4 border-b border-[#1B4332]/10 shrink-0">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#FF6B35]" />
                <h3 className="text-base sm:text-lg font-bold font-garamond">Bulk Content Import</h3>
              </div>
              <button 
                onClick={handleCloseModal}
                disabled={isUploading}
                className="text-slate-400 hover:text-[#1B4332] transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-grow space-y-4 text-xs sm:text-sm">
              {!parsedData && !uploadFinished && (
                <div className="space-y-4 flex flex-col h-full">
                  <div className="text-slate-600">
                    Paste a JSON object (maximum 100 total items per upload) containing arrays of `blogs`, `gallery` items, and/or `events` to import them in bulk.
                  </div>
                  <textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder={`{\n  "blogs": [\n    {\n      "title": "Exploring the Hidden Trails of Bandarban",\n      "content": "Bandarban is a haven for adventure seekers. Known for its beautiful hills, waterfalls, and indigenous culture, it offers challenging trekking routes."\n    }\n  ],\n  "gallery": [\n    {\n      "category": "Trekking",\n      "caption": "Reaching the summit of Saka Haphong"\n    }\n  ],\n  "events": [\n    {\n      "title": "Bandarban Mountain Trekking Expedition",\n      "description": "Extreme trekking challenge.",\n      "location": "Bandarban",\n      "date": "2026-09-10T22:00:00Z"\n    }\n  ]\n}`}
                    className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl p-3 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] h-48 sm:h-72 resize-none"
                  />
                  {parseError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{parseError}</span>
                    </div>
                  )}
                  <button
                    onClick={handleParseJSON}
                    className="w-full py-2.5 bg-[#FF6B35] hover:bg-[#e65a29] text-white rounded-xl text-xs sm:text-sm font-bold transition-colors shadow-md"
                  >
                    Parse JSON Data
                  </button>
                </div>
              )}

              {parsedData && !isUploading && !uploadFinished && (
                <div className="space-y-4 text-xs sm:text-sm">
                  <div className="p-3 bg-[#eef5ee] border border-[#1B4332]/10 rounded-xl">
                    <h4 className="font-bold font-garamond text-sm mb-2 text-[#1B4332]">Import Preview</h4>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-white p-2.5 rounded-xl border border-[#1B4332]/5">
                        <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider">Blogs</span>
                        <span className="text-base font-extrabold text-purple-600">{parsedData.blogs?.length || 0}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-[#1B4332]/5">
                        <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider">Gallery</span>
                        <span className="text-base font-extrabold text-emerald-600">{parsedData.gallery?.length || 0}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-[#1B4332]/5">
                        <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider">Events</span>
                        <span className="text-base font-extrabold text-[#FF6B35]">{parsedData.events?.length || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* List previews */}
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                    {parsedData.blogs && parsedData.blogs.length > 0 && (
                      <div className="bg-[#f8fcf8] rounded-xl p-3 border border-[#1B4332]/5">
                        <h5 className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-1.5">Blogs to Import</h5>
                        <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4 font-sans">
                          {parsedData.blogs.map((b, i) => (
                            <li key={i}><span className="font-semibold text-slate-800">{b.title}</span></li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {parsedData.gallery && parsedData.gallery.length > 0 && (
                      <div className="bg-[#f8fcf8] rounded-xl p-3 border border-[#1B4332]/5">
                        <h5 className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1.5">Gallery Items to Import</h5>
                        <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4 font-sans">
                          {parsedData.gallery.map((g, i) => (
                            <li key={i}>
                              <span className="bg-emerald-50 text-emerald-700 text-[9px] font-bold px-1 rounded mr-1.5">{g.category}</span>
                              {g.caption || 'No Caption'}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {parsedData.events && parsedData.events.length > 0 && (
                      <div className="bg-[#f8fcf8] rounded-xl p-3 border border-[#1B4332]/5">
                        <h5 className="text-[10px] font-bold text-[#FF6B35] uppercase tracking-wider mb-1.5">Events to Import</h5>
                        <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4 font-sans">
                          {parsedData.events.map((e, i) => (
                            <li key={i}>
                              <span className="font-semibold text-slate-800">{e.title}</span> ({e.location})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] sm:text-xs text-slate-500 flex items-center gap-1.5 bg-[#eef5ee] p-2.5 rounded-xl border border-[#1B4332]/10">
                    <AlertTriangle className="w-4 h-4 text-[#FF6B35] shrink-0" />
                    <span>No image files are uploaded now. The default placeholder image will be set, and you can edit them later.</span>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => setParsedData(null)}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
                    >
                      Reset / Back
                    </button>
                    <button
                      onClick={handleExecuteImport}
                      className="px-5 py-2 bg-[#FF6B35] hover:bg-[#e65a29] text-white rounded-xl text-xs sm:text-sm font-bold transition-colors"
                    >
                      Confirm & Import
                    </button>
                  </div>
                </div>
              )}

              {isUploading && (
                <div className="py-8 flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="w-10 h-10 text-[#FF6B35] animate-spin" />
                  <div className="text-center">
                    <h4 className="font-bold text-slate-800 text-sm sm:text-base">Importing Content...</h4>
                    <p className="text-xs text-slate-400 mt-1">Please do not close this window or refresh the page.</p>
                  </div>
                  
                  <div className="w-full max-w-xs space-y-2 pt-4">
                    {uploadProgress.blogsTotal > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Blogs:</span>
                        <span className="font-bold text-slate-800">{uploadProgress.blogsDone} / {uploadProgress.blogsTotal}</span>
                      </div>
                    )}
                    {uploadProgress.galleryTotal > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Gallery:</span>
                        <span className="font-bold text-slate-800">{uploadProgress.galleryDone} / {uploadProgress.galleryTotal}</span>
                      </div>
                    )}
                    {uploadProgress.eventsTotal > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Events:</span>
                        <span className="font-bold text-slate-800">{uploadProgress.eventsDone} / {uploadProgress.eventsTotal}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {uploadFinished && (
                <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1B4332] text-base sm:text-lg font-garamond">Bulk Import Completed!</h4>
                    <p className="text-xs text-slate-500 mt-1.5 max-w-xs mx-auto">
                      Successfully imported all items into the database. You can now configure images and edit details on the respective pages.
                    </p>
                  </div>

                  <div className="w-full max-w-xs bg-[#f8fcf8] p-3 rounded-xl border border-[#1B4332]/10 text-left text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Blogs imported:</span>
                      <span className="font-extrabold text-slate-800">{uploadProgress.blogsTotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Gallery photos imported:</span>
                      <span className="font-extrabold text-slate-800">{uploadProgress.galleryTotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Events imported:</span>
                      <span className="font-extrabold text-slate-800">{uploadProgress.eventsTotal}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleCloseModal}
                    className="w-full max-w-xs py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors"
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

