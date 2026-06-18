import { useState, useEffect } from 'react';
import { dynamicGet } from '../../utils/apiClient';
import { Loader2, Users } from 'lucide-react';

interface TeamMember {
  id: string
  name: string
  role: string
  image_url?: string | null
  facebook_url?: string | null
  linkedin_url?: string | null
}

export const AboutPage = () => {
  const [aboutText, setAboutText] = useState('')
  const [team, setTeam] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [about, teamList] = await Promise.all([
          dynamicGet('settings', { eq: { key: 'about_us_description' } }),
          dynamicGet('team', { order: 'order_index', dir: 'asc' })
        ])
        if (about.length > 0) {
          setAboutText(about[0].value)
        } else {
          setAboutText(
            'Founded in 2018, the RUET Adventure Club (Ovijatrik) is the premier adventure organization of Rajshahi University of Engineering & Technology. We believe in pushing boundaries, exploring the unknown, and fostering a spirit of teamwork and resilience among our members.'
          )
        }
        setTeam(teamList)
      } catch (err) {
        console.error('Failed to load about data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto text-center space-y-12">
        <div>
          <h1 className="text-5xl font-extrabold text-[#1B4332] font-garamond mb-8 mt-6">About <span className="text-adventure-orange">Us</span></h1>
          
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 shadow-xl border border-[#1B4332]/10 text-left">
            <h2 className="text-3xl font-bold text-[#1B4332] font-garamond mb-6">Our Legacy</h2>
            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-[#1B4332]" />
              </div>
            ) : (
              <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {aboutText}
              </p>
            )}
          </div>
        </div>

        {/* Executive Team Section */}
        {!loading && team.length > 0 && (
          <div className="space-y-8 pt-8">
            <h2 className="text-4xl font-extrabold text-[#1B4332] font-garamond">Executive <span className="text-adventure-orange">Committee</span></h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 text-center">
              {team.map((member) => (
                <div key={member.id} className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg border border-[#1B4332]/5 flex flex-col items-center">
                  {member.image_url ? (
                    <img src={member.image_url} alt={member.name} className="w-24 h-24 rounded-full object-cover mb-4 border-2 border-adventure-orange" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-[#1B4332]">
                      <Users className="w-10 h-10" />
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white font-garamond">{member.name}</h3>
                  <p className="text-sm text-slate-500 font-medium mb-4">{member.role}</p>
                  
                  <div className="flex gap-4 mt-auto">
                    {member.facebook_url && (
                      <a href={member.facebook_url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-600 hover:text-blue-500 transition-colors">
                        Facebook
                      </a>
                    )}
                    {member.linkedin_url && (
                      <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-500 hover:text-blue-400 transition-colors">
                        LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
