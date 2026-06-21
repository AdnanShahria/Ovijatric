import { useState, useEffect, useRef } from 'react'
import { dynamicGet, dynamicInsert } from '../../utils/apiClient'
import { Upload, ImageIcon, Clock, CheckCircle2, X, ArrowLeft, Folder } from 'lucide-react'

export function MemberGalleryPage() {
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  // Upload form state
  const [file, setFile] = useState<File | null>(null)
  const [caption, setCaption] = useState('')
  const [category, setCategory] = useState('General')
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  }

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const fetchSubmissions = async () => {
    try {
      const storedUser = localStorage.getItem('user')
      if (!storedUser) return
      const u = JSON.parse(storedUser)
      setUser(u)
      
      const gals = await dynamicGet('gallery', { eq: { user_id: u.id }, order: 'uploaded_at', dir: 'desc' })
      setSubmissions(gals)
    } catch (error) {
      console.error('Failed to fetch gallery submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !caption.trim() || !user) {
      showToast('Please select a file and provide a caption.', 'error')
      return
    }

    setUploading(true)
    try {
      // 1. Upload file to imgbb
      const formData = new FormData()
      formData.append('image', file)
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formData
      })
      const uploadData = await uploadRes.json()
      
      if (!uploadRes.ok || !uploadData.success) {
        throw new Error(uploadData.error || 'Upload failed')
      }

      // 2. Save gallery record
      const payload = {
        image_url: uploadData.url,
        category,
        caption,
        user_id: user.id,
        status: 'pending' // Force pending for member submissions
      }

      await dynamicInsert('gallery', payload)
      
      // Reset form and refresh
      setFile(null)
      setCaption('')
      setCategory('General')
      if (fileInputRef.current) fileInputRef.current.value = ''
      await fetchSubmissions()
      
      showToast('Photo submitted successfully! It will appear once approved.')
    } catch (error: any) {
      console.error('Failed to submit photo:', error)
      showToast(`Error: ${error.message}`, 'error')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading your gallery...</div>
  }

  return (
    <div className="space-y-8 relative">
      {toastMessage && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-2 transform transition-all duration-300 translate-y-0 opacity-100 ${toastMessage.type === 'success' ? 'bg-[#1B4332] text-white' : 'bg-red-600 text-white'}`}>
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <X className="w-5 h-5" />}
          <span className="font-medium text-sm">{toastMessage.text}</span>
        </div>
      )}
      <div>
        <h1 className="text-3xl font-bold text-[#1B4332] mb-2">My Gallery Contributions</h1>
        <p className="text-slate-600">Share your adventure moments with the community. Photos require admin approval before going public.</p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#1B4332]/10 p-6 sm:p-8">
        <h2 className="text-xl font-bold text-[#1B4332] mb-6 flex items-center gap-2">
          <Upload className="w-5 h-5 text-adventure-orange" /> Submit a New Photo
        </h2>
        
        <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Image *</label>
              <div className="flex items-center justify-center w-full">
                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-6 h-6 mb-2 text-slate-400" />
                    <p className="text-sm text-slate-500"><span className="font-semibold">Click to upload</span></p>
                    {file && <p className="text-xs text-adventure-orange font-medium mt-1 text-center px-4 truncate w-full">{file.name}</p>}
                  </div>
                  <input 
                    id="dropzone-file" 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    required
                  />
                </label>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-adventure-orange outline-none bg-white"
              >
                <option value="General">General</option>
                <option value="Expedition">Expedition</option>
                <option value="Camping">Camping</option>
                <option value="Community">Community Work</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Caption / SEO Title *</label>
              <input 
                type="text" 
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-adventure-orange outline-none" 
                placeholder="What's happening in this photo?"
                required
              />
            </div>
            <button
              type="submit"
              disabled={uploading || !file}
              className="w-full py-2.5 bg-adventure-orange hover:bg-orange-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors mt-2 flex justify-center items-center"
            >
              {uploading ? 'Uploading...' : 'Submit Photo'}
            </button>
          </div>
        </form>
      </div>

      {/* Submissions List */}
      <div>
        <h2 className="text-xl font-bold text-[#1B4332] mb-6">Your Past Submissions by Folder</h2>
        {submissions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-dashed border-emerald-200">
            You haven't submitted any photos yet.
          </div>
        ) : selectedFolder ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-[#1B4332]/10">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedFolder(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-bold text-[#1B4332] font-garamond flex items-center gap-2">
                  <Folder className="w-5 h-5 text-[#FF6B35]" />
                  {selectedFolder}
                </h2>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {submissions.filter(s => s.category === selectedFolder).map(photo => (
                <div key={photo.id} className="bg-white border border-[#1B4332]/10 shadow-sm rounded-xl overflow-hidden relative group">
                  <div className="aspect-square bg-slate-50 relative">
                    <img src={photo.image_url} alt={photo.caption || 'Photo'} className="w-full h-full object-cover" />
                    
                    <div className="absolute top-2 left-2 flex gap-1">
                      {photo.status === 'approved' ? (
                        <span className="flex items-center gap-1 bg-green-100/90 text-green-700 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm uppercase"><CheckCircle2 className="w-3 h-3" /></span>
                      ) : photo.status === 'rejected' ? (
                        <span className="flex items-center gap-1 bg-red-100/90 text-red-700 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm uppercase"><X className="w-3 h-3" /></span>
                      ) : (
                        <span className="flex items-center gap-1 bg-amber-100/90 text-amber-700 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm uppercase"><Clock className="w-3 h-3" /></span>
                      )}
                    </div>
                  </div>
                  {photo.caption && (
                    <div className="p-3 border-t border-[#1B4332]/5">
                      <p className="text-slate-600 text-xs line-clamp-2">{photo.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(Object.entries(submissions.reduce((acc, sub) => {
              if (!acc[sub.category]) acc[sub.category] = [];
              acc[sub.category].push(sub);
              return acc;
            }, {} as Record<string, any[]>)) as [string, any[]][]).map(([category, subs]) => (
              <div 
                key={category} 
                onClick={() => setSelectedFolder(category)}
                className="bg-white rounded-2xl shadow-sm border border-[#1B4332]/10 overflow-hidden flex flex-col hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="relative w-full h-48 bg-slate-100 overflow-hidden">
                  <img src={subs[0].image_url} alt={category} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                    <p className="text-white text-xs font-medium truncate">Latest: {subs[0].caption || 'No caption'}</p>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-[#1B4332] mb-1 group-hover:text-[#FF6B35] transition-colors">{category}</h3>
                  <div className="flex items-center justify-between text-sm text-slate-600 font-medium mt-auto">
                    <span className="flex items-center gap-1.5"><ImageIcon className="w-4 h-4" /> {subs.length} {subs.length === 1 ? 'Photo' : 'Photos'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
