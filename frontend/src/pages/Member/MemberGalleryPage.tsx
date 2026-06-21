import { useState, useEffect, useRef } from 'react'
import { dynamicGet, dynamicInsert } from '../../utils/apiClient'
import { Upload, ImageIcon, Clock, CheckCircle2, X } from 'lucide-react'

export function MemberGalleryPage() {
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  // Upload form state
  const [file, setFile] = useState<File | null>(null)
  const [caption, setCaption] = useState('')
  const [category, setCategory] = useState('General')
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    if (!file || !user) return

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
      
      alert('Photo submitted successfully! It will appear in the public gallery once approved by an admin.')
    } catch (error: any) {
      console.error('Failed to submit photo:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading your gallery...</div>
  }

  return (
    <div className="space-y-8">
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Caption (Optional)</label>
              <input 
                type="text" 
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-adventure-orange outline-none" 
                placeholder="What's happening in this photo?"
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
        <h2 className="text-xl font-bold text-[#1B4332] mb-6">Your Past Submissions</h2>
        {submissions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-dashed border-emerald-200">
            You haven't submitted any photos yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {submissions.map(sub => (
              <div key={sub.id} className="relative group bg-white rounded-xl overflow-hidden shadow-sm border border-[#1B4332]/10">
                <div className="aspect-square bg-slate-100 relative">
                  <img src={sub.image_url} className="w-full h-full object-cover" alt={sub.caption} />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                    <p className="text-white text-xs font-medium truncate">{sub.caption || 'No caption'}</p>
                    <p className="text-white/80 text-[10px] mt-0.5">{sub.category}</p>
                  </div>
                </div>
                <div className="p-2.5 flex items-center justify-between bg-white">
                  <span className="text-[10px] text-slate-500">
                    {new Date(Number(sub.uploaded_at)).toLocaleDateString()}
                  </span>
                  {sub.status === 'approved' ? (
                    <span className="flex items-center gap-1 text-green-600 text-[10px] font-bold" title="Approved & Public">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                    </span>
                  ) : sub.status === 'rejected' ? (
                    <span className="flex items-center gap-1 text-red-500 text-[10px] font-bold" title="Rejected by Admin">
                      <X className="w-3.5 h-3.5" /> Rejected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-500 text-[10px] font-bold" title="Waiting for Admin Review">
                      <Clock className="w-3.5 h-3.5" /> Pending
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
