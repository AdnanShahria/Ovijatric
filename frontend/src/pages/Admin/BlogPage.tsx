import { useState, useEffect } from 'react'
import { Plus, BookOpen, Edit, Trash2, X, Upload, Loader2, AlertTriangle, Check } from 'lucide-react'
import { dynamicGet, dynamicInsert, dynamicUpdate, dynamicDelete, uploadImage, uploadImageWithProgress } from '../../utils/apiClient'

interface BlogPost {
  id: string
  title: string
  content: string
  author_id: string
  image_url?: string | null
  hover_image_url?: string | null
  additional_images?: string | null
  published_at: string | number
}

export function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)

  // Bulk Upload State
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const [jsonInput, setJsonInput] = useState('')
  const [parseError, setParseError] = useState('')
  const [parsedBlogs, setParsedBlogs] = useState<any[] | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 })
  const [uploadFinished, setUploadFinished] = useState(false)
  
  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [hoverImageUrl, setHoverImageUrl] = useState('')
  const [additionalImages, setAdditionalImages] = useState<string[]>([])
  const [publishedAt, setPublishedAt] = useState<string>('')

  // Deferred File Selection States (Local First)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string>('')
  const [hoverFile, setHoverFile] = useState<File | null>(null)
  const [hoverPreview, setHoverPreview] = useState<string>('')
  const [additionalFiles, setAdditionalFiles] = useState<{ id: string; file: File; preview: string }[]>([])

  // Progress overlay state
  const [progressStatus, setProgressStatus] = useState({
    isOpen: false,
    title: '',
    percentage: 0,
    details: ''
  })
  
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const data = await dynamicGet<BlogPost>('blog_posts', { order: 'published_at', dir: 'desc' })
      setPosts(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const openAddModal = () => {
    setEditingPost(null)
    setTitle('')
    setContent('')
    setImageUrl('')
    setHoverImageUrl('')
    setAdditionalImages([])
    setCoverFile(null)
    setCoverPreview('')
    setHoverFile(null)
    setHoverPreview('')
    setAdditionalFiles([])
    setProgressStatus({ isOpen: false, title: '', percentage: 0, details: '' })
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const formattedNow = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
    setPublishedAt(formattedNow)
    setModalOpen(true)
  }

  const handleParseJSON = () => {
    setParseError('')
    setParsedBlogs(null)
    try {
      const parsed = JSON.parse(jsonInput)
      let blogs = []
      if (Array.isArray(parsed)) {
        blogs = parsed
      } else if (parsed && Array.isArray(parsed.blogs)) {
        blogs = parsed.blogs
      } else {
        throw new Error('JSON must be an array of blogs, or an object containing a "blogs" array.')
      }

      if (blogs.length === 0) {
        throw new Error('No blogs found in the array.')
      }

      if (blogs.length > 100) {
        throw new Error('Maximum 100 items allowed per upload.')
      }

      blogs.forEach((b: any, index: number) => {
        if (!b.title) throw new Error(`Blog at index ${index} is missing required 'title' field.`)
        if (!b.content) throw new Error(`Blog at index ${index} is missing required 'content' field.`)
      })

      setParsedBlogs(blogs)
    } catch (err: any) {
      setParseError(err.message || 'Invalid JSON format.')
    }
  }

  const handleImportBlogs = async () => {
    if (!parsedBlogs) return
    setIsUploading(true)
    setUploadProgress({ done: 0, total: parsedBlogs.length })
    try {
      for (let i = 0; i < parsedBlogs.length; i++) {
        const blog = parsedBlogs[i]
        await dynamicInsert('blog_posts', {
          title: blog.title,
          content: blog.content,
          image_url: null,
          hover_image_url: null,
          additional_images: JSON.stringify([]),
          published_at: blog.published_at ? new Date(blog.published_at).getTime() : Date.now()
        })
        setUploadProgress(prev => ({ ...prev, done: i + 1 }))
      }
      setUploadFinished(true)
      fetchPosts()
    } catch (err: any) {
      alert(`Error importing: ${err.message || 'failed'}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleCloseBulkModal = () => {
    setBulkModalOpen(false)
    setJsonInput('')
    setParsedBlogs(null)
    setParseError('')
    setUploadFinished(false)
  }

  const openEditModal = (post: BlogPost) => {
    setEditingPost(post)
    setTitle(post.title)
    setContent(post.content)
    setImageUrl(post.image_url || '')
    setHoverImageUrl(post.hover_image_url || '')
    setCoverFile(null)
    setCoverPreview('')
    setHoverFile(null)
    setHoverPreview('')
    setAdditionalFiles([])
    setProgressStatus({ isOpen: false, title: '', percentage: 0, details: '' })
    try {
      setAdditionalImages(post.additional_images ? JSON.parse(post.additional_images) : [])
    } catch (e) {
      setAdditionalImages([])
    }
    const d = new Date(Number(post.published_at))
    const pad = (n: number) => String(n).padStart(2, '0')
    const formattedDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    setPublishedAt(formattedDate)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview)
    if (hoverPreview) URL.revokeObjectURL(hoverPreview)
    additionalFiles.forEach(f => URL.revokeObjectURL(f.preview))
    setCoverFile(null)
    setCoverPreview('')
    setHoverFile(null)
    setHoverPreview('')
    setAdditionalFiles([])
    setModalOpen(false)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    const previewUrl = URL.createObjectURL(file)
    setCoverPreview(previewUrl)
  }

  const handleHoverImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setHoverFile(file)
    const previewUrl = URL.createObjectURL(file)
    setHoverPreview(previewUrl)
  }

  const handleMultipleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    const newFiles = files.map(file => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file)
    }))
    setAdditionalFiles(prev => [...prev, ...newFiles])
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !content || !publishedAt) {
      alert('Please fill out all required fields')
      return
    }

    try {
      setSaving(true)
      setProgressStatus({
        isOpen: true,
        title: 'Starting Publication',
        percentage: 5,
        details: 'Preparing assets...'
      })

      let finalImageUrl = imageUrl;
      let finalHoverImageUrl = hoverImageUrl;
      
      // 1. Upload Cover Image if selected locally
      if (coverFile) {
        setProgressStatus(prev => ({
          ...prev,
          title: 'Cover Image Upload',
          details: 'Compressing cover image...'
        }))
        
        const uploadRes = await uploadImageWithProgress(coverFile, undefined, 1.0, (step, percent) => {
          setProgressStatus(prev => {
            const stepText = step === 'compressing' ? 'Compressing cover image' : 'Uploading cover image';
            const overallPercent = step === 'compressing' ? Math.round(5 + (percent * 0.15)) : Math.round(20 + (percent * 0.35));
            return {
              ...prev,
              percentage: overallPercent,
              details: `${stepText}... (${percent}%)`
            }
          })
        });

        if (!uploadRes.success || !uploadRes.url) {
          throw new Error(`Cover image upload failed: ${uploadRes.error}`);
        }
        finalImageUrl = uploadRes.url;
      }

      // 2. Upload Hover Image if selected locally
      if (hoverFile) {
        setProgressStatus(prev => ({
          ...prev,
          title: 'Hover Image Upload',
          details: 'Compressing hover image...'
        }))
        
        const uploadRes = await uploadImageWithProgress(hoverFile, undefined, 1.0, (step, percent) => {
          setProgressStatus(prev => {
            const stepText = step === 'compressing' ? 'Compressing hover image' : 'Uploading hover image';
            const overallPercent = step === 'compressing' ? Math.round(55 + (percent * 0.10)) : Math.round(65 + (percent * 0.20));
            return {
              ...prev,
              percentage: overallPercent,
              details: `${stepText}... (${percent}%)`
            }
          })
        });

        if (!uploadRes.success || !uploadRes.url) {
          throw new Error(`Hover image uploader failed: ${uploadRes.error}`);
        }
        finalHoverImageUrl = uploadRes.url;
      }

      // 3. Upload newly selected additional images
      const uploadedAdditionalUrls = [...additionalImages];
      if (additionalFiles.length > 0) {
        const totalFiles = additionalFiles.length;
        for (let i = 0; i < totalFiles; i++) {
          const item = additionalFiles[i];
          const fileIndexText = `(${i + 1}/${totalFiles})`;
          
          setProgressStatus(prev => ({
            ...prev,
            title: `Gallery Image ${fileIndexText}`,
            details: 'Compressing gallery image...'
          }))

          const uploadRes = await uploadImageWithProgress(item.file, undefined, 1.0, (step, percent) => {
            setProgressStatus(prev => {
              const stepText = step === 'compressing' ? 'Compressing' : 'Uploading';
              const filePercent = step === 'compressing' ? Math.round(percent * 0.1) : Math.round(10 + (percent * 0.9));
              return {
                ...prev,
                percentage: filePercent,
                details: `${stepText} gallery image ${fileIndexText}... (${percent}%)`
              }
            })
          });

          if (!uploadRes.success || !uploadRes.url) {
            throw new Error(`Gallery image ${i + 1} upload failed: ${uploadRes.error}`);
          }
          uploadedAdditionalUrls.push(uploadRes.url);
        }
      }

      // 4. Apply automatic fallbacks if Cover or Hover are empty:
      // First gallery image -> Cover
      if (!finalImageUrl && uploadedAdditionalUrls.length > 0) {
        finalImageUrl = uploadedAdditionalUrls[0];
      }
      // Second gallery image -> Hover
      if (!finalHoverImageUrl && uploadedAdditionalUrls.length > 1) {
        finalHoverImageUrl = uploadedAdditionalUrls[1];
      }

      // 5. Save to SQLite database
      setProgressStatus({
        isOpen: true,
        title: 'Publishing Post',
        percentage: 95,
        details: 'Saving database record...'
      })

      const payload = {
        title,
        content,
        image_url: finalImageUrl || null,
        hover_image_url: finalHoverImageUrl || null,
        additional_images: JSON.stringify(uploadedAdditionalUrls),
        published_at: new Date(publishedAt).getTime()
      }

      if (editingPost) {
        await dynamicUpdate('blog_posts', { ...payload, id: editingPost.id } as any)
      } else {
        await dynamicInsert('blog_posts', payload)
      }

      setProgressStatus({
        isOpen: true,
        title: 'Success!',
        percentage: 100,
        details: 'Post published successfully!'
      })

      // Clean up local URL resources
      if (coverPreview) URL.revokeObjectURL(coverPreview)
      if (hoverPreview) URL.revokeObjectURL(hoverPreview)
      additionalFiles.forEach(f => URL.revokeObjectURL(f.preview))

      await new Promise(r => setTimeout(r, 600));

      setModalOpen(false)
      fetchPosts()
    } catch (err: any) {
      alert(`Error publishing: ${err.message || 'Failed'}`)
    } finally {
      setProgressStatus(prev => ({ ...prev, isOpen: false }))
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return
    setPosts(prev => prev.filter(p => p.id !== id))
    try {
      await dynamicDelete('blog_posts', { id })
      fetchPosts()
    } catch (err) {
      alert('Failed to delete blog post')
      fetchPosts()
    }
  }

  const effectiveCoverUrl = coverPreview || imageUrl || (additionalFiles[0]?.preview || additionalImages[0] || '')
  const effectiveHoverUrl = hoverPreview || hoverImageUrl || (additionalFiles[1]?.preview || additionalImages[1] || '')

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-garamond text-[#1B4332] tracking-tight">Manage Blogs</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Publish stories, news, and guidelines for the community</p>
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
            Create Post
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#1B4332]/10 shadow-sm p-6 sm:p-8 text-center">
          <div className="w-12 h-12 bg-[#1B4332]/5 rounded-xl flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6 text-[#1B4332]/60" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-[#1B4332] mb-1.5">No Blog Posts</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto mb-4">
            You haven't written any blog posts yet. Write your first story to share with RUET adventurers!
          </p>
          <button 
            onClick={openAddModal}
            className="flex items-center gap-1.5 bg-[#FF6B35] hover:bg-[#E0531D] text-white px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors mx-auto"
          >
            <Plus className="w-4 h-4" />
            Write Post
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
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#1B4332] font-garamond">Post Details</th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#1B4332] font-garamond">Date Published</th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#1B4332] font-garamond text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1B4332]/5 bg-white">
                  {posts.map((post) => (
                    <tr key={post.id} className="hover:bg-[#f6fbf6] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {post.image_url ? (
                            <img src={post.image_url} alt={post.title} className="w-16 h-10 object-cover rounded-lg shrink-0 border border-[#1B4332]/5" />
                          ) : (
                            <div className="w-16 h-10 bg-[#1B4332]/5 flex items-center justify-center rounded-lg shrink-0">
                              <BookOpen className="w-4 h-4 text-[#1B4332]/40" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-semibold text-[#1B4332] text-sm truncate max-w-[250px]">{post.title}</div>
                            <div className="text-slate-500 text-xs line-clamp-1 max-w-[250px] mt-0.5">{post.content.replace(/<[^>]*>/g, '')}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <div className="text-sm font-medium">
                          {new Date(Number(post.published_at)).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-1.5">
                          <button
                            onClick={() => openEditModal(post)}
                            className="p-1.5 rounded-xl border border-[#1B4332]/10 hover:bg-[#1B4332]/5 text-[#1B4332] transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(post.id)}
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

          {/* Mobile Card list */}
          <div className="block md:hidden space-y-3">
            {posts.map((post) => (
              <div key={post.id} className="bg-white border border-[#1B4332]/10 rounded-xl p-3 shadow-sm flex flex-col gap-3">
                <div className="flex gap-3">
                  {post.image_url ? (
                    <img src={post.image_url} alt={post.title} className="w-20 h-16 object-cover rounded-lg shrink-0 border border-[#1B4332]/5" />
                  ) : (
                    <div className="w-20 h-16 bg-[#1B4332]/5 flex items-center justify-center rounded-lg shrink-0">
                      <BookOpen className="w-6 h-6 text-[#1B4332]/40" />
                    </div>
                  )}
                  <div className="min-w-0 flex-grow flex flex-col justify-between">
                    <div>
                      <h4 className="font-semibold text-[#1B4332] text-xs leading-snug line-clamp-2">{post.title}</h4>
                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{post.content.replace(/<[^>]*>/g, '')}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(Number(post.published_at)).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </span>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2.5 border-t border-[#1B4332]/5">
                  <button
                    onClick={() => openEditModal(post)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#1B4332]/15 text-[#1B4332] text-[11px] font-semibold hover:bg-[#1B4332]/5 transition-colors"
                  >
                    <Edit className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-semibold transition-colors"
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
          <div className="bg-white border border-[#1B4332]/10 rounded-xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col my-auto">
            <div className="flex items-center justify-between p-4 border-b border-[#1B4332]/10 shrink-0">
              <h3 className="text-base sm:text-lg font-bold text-[#1B4332] font-garamond">
                {editingPost ? 'Edit Blog Post' : 'Create New Blog Post'}
              </h3>
              <button 
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-3.5 overflow-y-auto flex-grow scrollbar-thin">
              <div>
                <label className="block text-xs font-semibold text-slate-505 mb-1">Post Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] text-xs sm:text-sm"
                  placeholder="e.g. Conquering Keokradong: A Trekker's Dream"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-505 mb-1">Publication Date *</label>
                <input
                  type="datetime-local"
                  value={publishedAt}
                  onChange={(e) => setPublishedAt(e.target.value)}
                  className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] text-xs sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-505 mb-1">Content *</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] h-32 sm:h-48 font-sans text-xs sm:text-sm"
                  placeholder="Write your story details..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-505 mb-1">Cover Image</label>
                <div className="flex flex-col gap-1.5">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] text-xs sm:text-sm"
                    placeholder="Paste Image URL or Select below"
                  />

                  <label className="flex items-center justify-center gap-1.5 border border-dashed border-[#1B4332]/20 hover:border-[#FF6B35] bg-[#f8fcf8] hover:bg-[#f2faf2] p-2.5 rounded-xl cursor-pointer transition-all shrink-0">
                    <Upload className="w-4 h-4 text-[#1B4332]/50" />
                    <span className="text-xs text-[#1B4332]/70 font-semibold">
                      {coverPreview || imageUrl ? 'Click to Change Cover Image' : 'Click to Select Cover Image'}
                    </span>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden" 
                    />
                  </label>

                  {(coverPreview || imageUrl) && (
                    <div className="mt-1 relative w-full h-24 sm:h-28 rounded-xl overflow-hidden border border-[#1B4332]/10 shrink-0">
                      <img src={coverPreview || imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => {
                          if (coverPreview) URL.revokeObjectURL(coverPreview)
                          setCoverFile(null)
                          setCoverPreview('')
                          setImageUrl('')
                        }}
                        className="absolute top-1.5 right-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-md"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-505 mb-1">Hover Image</label>
                <div className="flex flex-col gap-1.5">
                  <input
                    type="text"
                    value={hoverImageUrl}
                    onChange={(e) => setHoverImageUrl(e.target.value)}
                    className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] text-xs sm:text-sm"
                    placeholder="Paste Hover Image URL or Select below"
                  />

                  <label className="flex items-center justify-center gap-1.5 border border-dashed border-[#1B4332]/20 hover:border-[#FF6B35] bg-[#f8fcf8] hover:bg-[#f2faf2] p-2.5 rounded-xl cursor-pointer transition-all shrink-0">
                    <Upload className="w-4 h-4 text-[#1B4332]/50" />
                    <span className="text-xs text-[#1B4332]/70 font-semibold">
                      {hoverPreview || hoverImageUrl ? 'Click to Change Hover Image' : 'Click to Select Hover Image'}
                    </span>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleHoverImageSelect}
                      className="hidden" 
                    />
                  </label>

                  {(hoverPreview || hoverImageUrl) && (
                    <div className="mt-1 relative w-full h-24 sm:h-28 rounded-xl overflow-hidden border border-[#1B4332]/10 shrink-0">
                      <img src={hoverPreview || hoverImageUrl} alt="Hover Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => {
                          if (hoverPreview) URL.revokeObjectURL(hoverPreview)
                          setHoverFile(null)
                          setHoverPreview('')
                          setHoverImageUrl('')
                        }}
                        className="absolute top-1.5 right-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-md"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-505 mb-1">Additional Gallery Images</label>
                <div className="flex flex-col gap-1.5">
                  <label className="flex items-center justify-center gap-1.5 border border-dashed border-[#1B4332]/20 hover:border-[#FF6B35] bg-[#f8fcf8] hover:bg-[#f2faf2] p-2.5 rounded-xl cursor-pointer transition-all shrink-0">
                    <Upload className="w-4 h-4 text-[#1B4332]/50" />
                    <span className="text-xs text-[#1B4332]/70 font-semibold">
                      Click to Select Multiple Gallery Images
                    </span>
                    <input 
                      type="file" 
                      accept="image/*"
                      multiple
                      onChange={handleMultipleImageSelect}
                      className="hidden" 
                    />
                  </label>

                  {(additionalImages.length > 0 || additionalFiles.length > 0) && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 mt-1 shrink-0">
                      {additionalImages.map((url, idx) => {
                        const isCover = url === effectiveCoverUrl;
                        const isHover = url === effectiveHoverUrl;
                        return (
                          <div key={`existing-${idx}`} className="relative group w-full h-14 rounded-xl overflow-hidden border border-[#1B4332]/10">
                            <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                            
                            {isCover && (
                              <span className="absolute bottom-1 left-1 bg-[#1B4332]/90 backdrop-blur-sm text-white text-[8px] font-extrabold px-1 rounded uppercase tracking-wide">
                                Cover
                              </span>
                            )}
                            {isHover && !isCover && (
                              <span className="absolute bottom-1 left-1 bg-[#FF6B35]/90 backdrop-blur-sm text-white text-[8px] font-extrabold px-1 rounded uppercase tracking-wide">
                                Hover
                              </span>
                            )}

                            <div className="absolute inset-0 bg-[#1B4332]/85 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity">
                              <button
                                type="button"
                                onClick={() => {
                                  setImageUrl(url);
                                  setCoverFile(null);
                                  setCoverPreview('');
                                }}
                                className="bg-[#FF6B35] hover:bg-[#E0531D] text-white text-[8px] font-bold px-1.5 py-0.5 rounded leading-none"
                              >
                                Set Cover
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setHoverImageUrl(url);
                                  setHoverFile(null);
                                  setHoverPreview('');
                                }}
                                className="bg-[#1B4332] hover:bg-[#163527] text-white text-[8px] font-bold px-1.5 py-0.5 rounded leading-none"
                              >
                                Set Hover
                              </button>
                            </div>

                            <button 
                              type="button"
                              onClick={() => setAdditionalImages(prev => prev.filter((_, i) => i !== idx))}
                              className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-0.5 shadow-md z-10"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                      {additionalFiles.map((fileItem) => {
                        const isCover = fileItem.preview === effectiveCoverUrl;
                        const isHover = fileItem.preview === effectiveHoverUrl;
                        return (
                          <div key={fileItem.id} className="relative group w-full h-14 rounded-xl overflow-hidden border border-[#1B4332]/10">
                            <img src={fileItem.preview} alt="New Gallery Preview" className="w-full h-full object-cover" />
                            
                            {isCover && (
                              <span className="absolute bottom-1 left-1 bg-[#1B4332]/90 backdrop-blur-sm text-white text-[8px] font-extrabold px-1 rounded uppercase tracking-wide">
                                Cover
                              </span>
                            )}
                            {isHover && !isCover && (
                              <span className="absolute bottom-1 left-1 bg-[#FF6B35]/90 backdrop-blur-sm text-white text-[8px] font-extrabold px-1 rounded uppercase tracking-wide">
                                Hover
                              </span>
                            )}

                            <div className="absolute inset-0 bg-[#1B4332]/85 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity">
                              <button
                                type="button"
                                onClick={() => {
                                  setCoverFile(fileItem.file);
                                  setCoverPreview(fileItem.preview);
                                  setImageUrl('');
                                }}
                                className="bg-[#FF6B35] hover:bg-[#E0531D] text-white text-[8px] font-bold px-1.5 py-0.5 rounded leading-none"
                              >
                                Set Cover
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setHoverFile(fileItem.file);
                                  setHoverPreview(fileItem.preview);
                                  setHoverImageUrl('');
                                }}
                                className="bg-[#1B4332] hover:bg-[#163527] text-white text-[8px] font-bold px-1.5 py-0.5 rounded leading-none"
                              >
                                Set Hover
                              </button>
                            </div>

                            <button 
                              type="button"
                              onClick={() => {
                                URL.revokeObjectURL(fileItem.preview)
                                setAdditionalFiles(prev => prev.filter(f => f.id !== fileItem.id))
                              }}
                              className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-0.5 shadow-md z-10"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#1B4332]/10 shrink-0">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-3.5 py-1.5 border border-[#1B4332]/20 hover:bg-[#1B4332]/5 text-[#1B4332] rounded-xl text-xs sm:text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-[#FF6B35] hover:bg-[#E0531D] disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Publish Post
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
                <h3 className="text-base sm:text-lg font-bold text-[#1B4332] font-garamond">Bulk Import Blogs</h3>
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
              {!parsedBlogs && !uploadFinished && (
                <div className="space-y-4 flex flex-col h-full">
                  <div className="text-xs sm:text-sm text-slate-600">
                    Paste a JSON array of blogs (maximum 100 items per upload) or an object containing a `blogs` array.
                  </div>
                  <textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder={`[\n  {\n    "title": "Exploring the Hidden Trails of Bandarban",\n    "content": "Bandarban, a district in southeastern Bangladesh, is a haven for adventure seekers. Known for its beautiful hills, waterfalls, and indigenous culture, it offers challenging trekking routes. During our three-day expedition, we conquered several peaks and experienced local hospitality."\n  },\n  {\n    "title": "Sailing Through the Mangroves of Sundarbans",\n    "content": "The Sundarbans, the largest mangrove forest in the world, is home to the majestic Royal Bengal Tiger. Our team embarked on a boat expedition to explore the narrow creeks and estuaries. We encountered diverse wildlife, including spotted deer, crocodiles, and exotic birds."\n  }\n]`}
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

              {parsedBlogs && !isUploading && !uploadFinished && (
                <div className="space-y-4">
                  <div className="p-3 bg-[#f0f6f0] border border-[#1B4332]/10 rounded-xl">
                    <span className="text-slate-600 text-xs">Parsed blogs: </span>
                    <span className="text-[#1B4332] font-bold">{parsedBlogs.length} posts ready</span>
                  </div>

                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    <div className="bg-[#f8fcf8] rounded-xl p-3 border border-[#1B4332]/10">
                      <h5 className="text-[10px] font-bold text-[#1B4332] uppercase tracking-wider mb-1.5">Blogs to Import</h5>
                      <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                        {parsedBlogs.map((b, i) => (
                          <li key={i}><span className="font-semibold text-[#1B4332]">{b.title}</span></li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="text-[10px] sm:text-xs text-slate-600 flex items-center gap-1.5 bg-[#eef5ee] p-2.5 rounded-xl border border-[#1B4332]/10">
                    <AlertTriangle className="w-4 h-4 text-[#FF6B35] shrink-0" />
                    <span>No cover images will be uploaded. The blogs will be created without cover images, and you can edit them to upload cover images later.</span>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-[#1B4332]/10">
                    <button
                      onClick={() => setParsedBlogs(null)}
                      className="px-3.5 py-1.5 border border-[#1B4332]/20 hover:bg-[#1B4332]/5 text-[#1B4332] rounded-xl text-xs sm:text-sm font-semibold transition-colors"
                    >
                      Reset / Back
                    </button>
                    <button
                      onClick={handleImportBlogs}
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
                    <h4 className="text-[#1B4332] font-semibold text-sm">Importing Blogs...</h4>
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
                    <h4 className="text-[#1B4332] font-bold text-base">Blogs Imported Successfully!</h4>
                    <p className="text-[10px] sm:text-xs text-slate-500 mt-1">
                      Successfully added {uploadProgress.total} blog posts. You can now edit them to upload cover images.
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
      {progressStatus.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border border-[#1B4332]/10 rounded-xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <h4 className="text-[#1B4332] font-bold text-lg font-garamond">{progressStatus.title}</h4>
            <div className="w-full bg-[#1B4332]/10 h-2.5 rounded-full overflow-hidden relative">
              <div 
                className="bg-[#FF6B35] h-full transition-all duration-300 ease-out" 
                style={{ width: `${progressStatus.percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">{progressStatus.details}</span>
              <span className="font-semibold text-[#FF6B35]">{progressStatus.percentage}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
