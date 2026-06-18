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
    <div className="space-y-8">
      {/* Club Description Editor */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-md space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white">Edit Club Description</h2>
          <p className="text-slate-400 text-sm mt-1">This text appears in the "About Us" section of the homepage and the about story page.</p>
        </div>

        {loadingText ? (
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            <span>Loading description...</span>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              value={aboutText}
              onChange={(e) => setAboutText(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 text-sm leading-relaxed"
              placeholder="Enter club history and description..."
            />
            <button
              onClick={handleSaveAboutText}
              disabled={savingText}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              {savingText ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Description
            </button>
          </div>
        )}
      </div>

      {/* Executive Team Members Manager */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Executive Team</h2>
            <p className="text-slate-400 mt-1">Manage executive members, moderators, and founders</p>
          </div>
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-md text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Member
          </button>
        </div>

        {loadingTeam ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : team.length === 0 ? (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
            <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Team Members</h3>
            <p className="text-slate-400 max-w-sm mx-auto mb-6">
              You haven't added any executive team members yet. Click the button below to add one.
            </p>
            <button 
              onClick={openAddModal}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors mx-auto"
            >
              <Plus className="w-4 h-4" />
              Add Member
            </button>
          </div>
        ) : (
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800/50">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Member Info</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Social Links</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Order Index</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700 bg-slate-800/20">
                  {team.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          {member.image_url ? (
                            <img src={member.image_url} alt={member.name} className="w-10 h-10 object-cover rounded-full" />
                          ) : (
                            <div className="w-10 h-10 bg-slate-700 flex items-center justify-center rounded-full">
                              <Users className="w-5 h-5 text-slate-500" />
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-white">{member.name}</div>
                            <div className="text-slate-400 text-xs">{member.role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300 text-sm">
                        <div className="flex flex-col gap-0.5 text-xs text-slate-400">
                          {member.facebook_url && <div>FB: {member.facebook_url}</div>}
                          {member.linkedin_url && <div>IN: {member.linkedin_url}</div>}
                          {!member.facebook_url && !member.linkedin_url && <span>-</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300 text-sm font-medium">
                        {member.order_index}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => openEditModal(member)}
                            className="p-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMember(member.id)}
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
      </div>

      {/* Team Member Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h3 className="text-lg font-bold text-white">
                {editingMember ? 'Edit Team Member' : 'Add Team Member'}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="e.g. Adnan Shahria"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Role *</label>
                <input
                  type="text"
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="e.g. President / Moderator"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Profile Photo</label>
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={memberImage}
                    onChange={(e) => setMemberImage(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Paste Image URL or Upload below"
                  />

                  <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-700 hover:border-slate-500 bg-slate-900/50 hover:bg-slate-950 p-3 rounded-lg cursor-pointer transition-all">
                    {uploading ? (
                      <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="text-xs text-slate-400">
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
                    <div className="mt-1 relative w-20 h-20 rounded-full overflow-hidden border border-slate-700 mx-auto">
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Facebook URL</label>
                  <input
                    type="text"
                    value={facebookUrl}
                    onChange={(e) => setFacebookUrl(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    placeholder="https://facebook.com/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">LinkedIn URL</label>
                  <input
                    type="text"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Display Order Index</label>
                <input
                  type="number"
                  value={orderIndex}
                  onChange={(e) => setOrderIndex(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  min="0"
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
                  disabled={savingMember || uploading}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {savingMember && <Loader2 className="w-4 h-4 animate-spin" />}
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
