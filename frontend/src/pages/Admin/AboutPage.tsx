import { useState, useEffect } from 'react'
import { Plus, Users, Edit, Trash2, X, Upload, Loader2, Save } from 'lucide-react'
import { dynamicGet, dynamicInsert, dynamicUpdate, dynamicDelete, uploadImage } from '../../utils/apiClient'

interface TeamMember {
  id: string
  name: string
  role: string
  image_url?: string | null
  facebook_url?: string | null
  linkedin_url?: string | null
  order_index: number
}

interface SettingItem {
  key: string
  value: string
}

export function AboutPage() {
  const [team, setTeam] = useState<TeamMember[]>([])
  const [aboutText, setAboutText] = useState('')
  const [loadingText, setLoadingText] = useState(true)
  const [loadingTeam, setLoadingTeam] = useState(true)
  const [savingText, setSavingText] = useState(false)
  
  // Team Member modal/form state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [memberName, setMemberName] = useState('')
  const [memberRole, setMemberRole] = useState('')
  const [memberImage, setMemberImage] = useState('')
  const [facebookUrl, setFacebookUrl] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [orderIndex, setOrderIndex] = useState(0)

  const [uploading, setUploading] = useState(false)
  const [savingMember, setSavingMember] = useState(false)

  const fetchAboutText = async () => {
    try {
      setLoadingText(true)
      const data = await dynamicGet<SettingItem>('settings', { eq: { key: 'about_us_description' } })
      if (data.length > 0) {
        setAboutText(data[0].value)
      } else {
        setAboutText(
          'Founded in 2018, the RUET Adventure Club (Ovijatrik) is the premier adventure organization of Rajshahi University of Engineering & Technology. We believe in pushing boundaries, exploring the unknown, and fostering a spirit of teamwork and resilience among our members.'
        )
      }
    } catch (err) {
      console.error('Failed to fetch About description:', err)
    } finally {
      setLoadingText(false)
    }
  }

  const fetchTeam = async () => {
    try {
      setLoadingTeam(true)
      const data = await dynamicGet<TeamMember>('team', { order: 'order_index', dir: 'asc' })
      setTeam(data)
    } catch (err) {
      console.error('Failed to fetch team members:', err)
    } finally {
      setLoadingTeam(false)
    }
  }

  useEffect(() => {
    fetchAboutText()
    fetchTeam()
  }, [])

  const handleSaveAboutText = async () => {
    if (!aboutText.trim()) {
      alert('Description cannot be empty')
      return
    }
    try {
      setSavingText(true)
      // Delete old setting first to avoid constraint/update issues with key columns
      await dynamicDelete('settings', { key: 'about_us_description' })
      await dynamicInsert('settings', { key: 'about_us_description', value: aboutText })
      alert('About Us description saved successfully!')
    } catch (err) {
      alert('Failed to save description')
    } finally {
      setSavingText(false)
    }
  }

  const openAddModal = () => {
    setEditingMember(null)
    setMemberName('')
    setMemberRole('')
    setMemberImage('')
    setFacebookUrl('')
    setLinkedinUrl('')
    setOrderIndex(team.length)
    setModalOpen(true)
  }

  const openEditModal = (member: TeamMember) => {
    setEditingMember(member)
    setMemberName(member.name)
    setMemberRole(member.role)
    setMemberImage(member.image_url || '')
    setFacebookUrl(member.facebook_url || '')
    setLinkedinUrl(member.linkedin_url || '')
    setOrderIndex(member.order_index)
    setModalOpen(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploading(true)
      const res = await uploadImage(file)
      if (res.success && res.url) {
        setMemberImage(res.url)
      } else {
        alert(res.error || 'Failed to upload image')
      }
    } catch (err) {
      alert('Error uploading image')
    } finally {
      setUploading(false)
    }
  }

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!memberName || !memberRole) {
      alert('Name and Role are required')
      return
    }

    try {
      setSavingMember(true)
      const payload: Partial<TeamMember> = {
        name: memberName,
        role: memberRole,
        image_url: memberImage || null,
        facebook_url: facebookUrl || null,
        linkedin_url: linkedinUrl || null,
        order_index: orderIndex
      }

      if (editingMember) {
        await dynamicUpdate('team', { ...payload, id: editingMember.id } as any)
      } else {
        await dynamicInsert('team', payload)
      }

      setModalOpen(false)
      fetchTeam()
    } catch (err) {
      alert('Failed to save team member')
    } finally {
      setSavingMember(false)
    }
  }

  const handleDeleteMember = async (id: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return
    try {
      await dynamicDelete('team', { id })
      fetchTeam()
    } catch (err) {
      alert('Failed to remove team member')
    }
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Club Description Editor */}
      <div className="bg-white border border-[#1B4332]/10 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4 text-[#1B4332]">
        <div>
          <h2 className="text-lg md:text-xl font-bold font-garamond text-[#1B4332]">Edit Club Description</h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">This text appears in the "About Us" section of the homepage and the about story page.</p>
        </div>

        {loadingText ? (
          <div className="space-y-3 animate-pulse">
            <div className="w-full h-24 sm:h-32 bg-slate-200 rounded-xl"></div>
            <div className="w-32 h-9 bg-slate-200 rounded-xl"></div>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              value={aboutText}
              onChange={(e) => setAboutText(e.target.value)}
              className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] h-24 sm:h-32 text-xs sm:text-sm leading-relaxed"
              placeholder="Enter club history and description..."
            />
            <button
              onClick={handleSaveAboutText}
              disabled={savingText}
              className="flex items-center gap-2 bg-[#1B4332] hover:bg-[#143225] disabled:bg-[#1B4332]/75 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-sm"
            >
              {savingText ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Description
            </button>
          </div>
        )}
      </div>

      {/* Executive Team Members Manager */}
      <div className="space-y-4">
        <div className="flex flex-row items-center justify-between">
          <div className="text-[#1B4332]">
            <h2 className="text-lg md:text-2xl font-bold font-garamond tracking-tight text-[#1B4332]">Executive Team</h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Manage executive members, moderators, and founders</p>
          </div>
          <button 
            onClick={openAddModal}
            className="flex items-center gap-1.5 bg-[#FF6B35] hover:bg-[#e65a29] text-white px-3.5 py-2 rounded-xl font-bold transition-all shadow-sm text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Member
          </button>
        </div>

        {loadingTeam ? (
          <div className="bg-white border border-[#1B4332]/10 rounded-2xl overflow-hidden shadow-sm animate-pulse mt-4">
            <div className="h-12 bg-slate-100 border-b border-[#1B4332]/10"></div>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border-b border-[#1b4332]/5">
                <div className="w-10 h-10 bg-slate-200 rounded-full shrink-0"></div>
                <div className="flex-1 w-full space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                </div>
                <div className="w-24 h-4 bg-slate-200 rounded hidden sm:block"></div>
                <div className="w-16 h-4 bg-slate-200 rounded hidden sm:block"></div>
              </div>
            ))}
          </div>
        ) : team.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#1B4332]/10 p-6 sm:p-8 text-center text-[#1B4332]">
            <div className="w-12 h-12 bg-emerald-50 border border-[#1B4332]/10 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-emerald-700" />
            </div>
            <h3 className="text-base sm:text-lg font-bold font-garamond mb-1">No Team Members</h3>
            <p className="text-slate-500 text-xs sm:text-sm max-w-sm mx-auto mb-4">
              You haven't added any executive team members yet. Click the button below to add one.
            </p>
            <button 
              onClick={openAddModal}
              className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-colors mx-auto"
            >
              <Plus className="w-4 h-4" />
              Add Member
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white border border-[#1B4332]/10 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#1B4332]/10 bg-[#f0f6f0]">
                      <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-[#1B4332]">Member Info</th>
                      <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-[#1B4332]">Social Links</th>
                      <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-[#1B4332]">Order Index</th>
                      <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-[#1B4332] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1b4332]/5 bg-white">
                    {team.map((member) => (
                      <tr key={member.id} className="hover:bg-[#f6fbf6] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            {member.image_url ? (
                              <img src={member.image_url} alt={member.name} className="w-10 h-10 object-cover rounded-full border border-[#1B4332]/10" />
                            ) : (
                              <div className="w-10 h-10 bg-emerald-50 border border-[#1B4332]/10 flex items-center justify-center rounded-full">
                                <Users className="w-5 h-5 text-emerald-700" />
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-[#1B4332] text-sm">{member.name}</div>
                              <div className="text-slate-500 text-xs">{member.role}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-xs">
                          <div className="flex flex-col gap-0.5">
                            {member.facebook_url && <div>FB: <span className="text-blue-600 truncate max-w-[150px] inline-block align-bottom">{member.facebook_url}</span></div>}
                            {member.linkedin_url && <div>IN: <span className="text-[#0a66c2] truncate max-w-[150px] inline-block align-bottom">{member.linkedin_url}</span></div>}
                            {!member.facebook_url && !member.linkedin_url && <span>-</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[#1B4332] text-sm font-semibold">
                          {member.order_index}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-2">
                            <button
                              onClick={() => openEditModal(member)}
                              className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#1B4332] transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMember(member.id)}
                              className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
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

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {team.map((member) => (
                <div key={member.id} className="bg-white border border-[#1B4332]/10 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm hover:shadow transition-shadow duration-200">
                  <div className="flex items-center gap-3 min-w-0">
                    {member.image_url ? (
                      <img src={member.image_url} alt={member.name} className="w-12 h-12 object-cover rounded-full border border-[#1B4332]/10 shrink-0" />
                    ) : (
                      <div className="w-12 h-12 bg-emerald-50 border border-[#1B4332]/10 flex items-center justify-center rounded-full shrink-0">
                        <Users className="w-6 h-6 text-emerald-700" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-extrabold text-[#1B4332] text-sm truncate leading-tight">{member.name}</div>
                      <div className="text-slate-500 text-xs truncate mt-0.5">{member.role}</div>
                      <div className="text-[10px] font-bold text-[#FF6B35] mt-1 bg-[#FF6B35]/5 px-1.5 py-0.5 rounded-md inline-block">
                        Order: {member.order_index}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openEditModal(member)}
                      className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#1B4332] transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteMember(member.id)}
                      className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Team Member Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-[#102d21]/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white border border-[#1B4332]/10 rounded-2xl shadow-2xl max-w-md w-full animate-zoom-in text-[#1B4332] my-auto">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 shrink-0">
              <h3 className="text-base sm:text-lg font-bold font-garamond text-[#1B4332]">
                {editingMember ? 'Edit Team Member' : 'Add Team Member'}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-[#1B4332] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="p-4 sm:p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] text-xs sm:text-sm"
                  placeholder="e.g. Adnan Shahria"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Role *</label>
                <input
                  type="text"
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                  className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] text-xs sm:text-sm"
                  placeholder="e.g. President / Moderator"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Profile Photo</label>
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={memberImage}
                    onChange={(e) => setMemberImage(e.target.value)}
                    className="bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] text-xs sm:text-sm"
                    placeholder="Paste Image URL or Upload below"
                  />

                  <label className="flex items-center justify-center gap-2 border border-dashed border-[#1B4332]/20 hover:border-[#FF6B35] bg-[#f8fcf8]/50 hover:bg-[#f8fcf8] p-2.5 rounded-xl cursor-pointer transition-all">
                    {uploading ? (
                      <Loader2 className="w-4 h-4 text-[#FF6B35] animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="text-xs text-slate-500">
                      {uploading ? 'Uploading...' : 'Click to Upload Member Photo'}
                    </span>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden" 
                    />
                  </label>

                  {memberImage && (
                    <div className="mt-1 relative w-16 h-16 rounded-full overflow-hidden border border-[#1B4332]/10 mx-auto">
                      <img src={memberImage} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setMemberImage('')}
                        className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Facebook URL</label>
                  <input
                    type="text"
                    value={facebookUrl}
                    onChange={(e) => setFacebookUrl(e.target.value)}
                    className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] text-xs"
                    placeholder="https://facebook.com/..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">LinkedIn URL</label>
                  <input
                    type="text"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] text-xs"
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Display Order Index</label>
                <input
                  type="number"
                  value={orderIndex}
                  onChange={(e) => setOrderIndex(Number(e.target.value))}
                  className="w-full bg-[#f8fcf8] text-slate-800 border border-[#1B4332]/15 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] text-xs sm:text-sm"
                  min="0"
                />
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
                  disabled={savingMember || uploading}
                  className="flex items-center gap-1.5 px-5 py-2 bg-[#1B4332] hover:bg-[#143225] disabled:bg-[#1B4332]/75 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors"
                >
                  {savingMember && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

