import { motion } from 'framer-motion'
import { ArrowRight, MapPin, Calendar as CalendarIcon, Users } from 'lucide-react'

export const HomePage = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col lg:flex-row overflow-hidden bg-transparent">
        {/* Subtle Gold Glows */}
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[#e6c17a]/10 rounded-full blur-[100px] -translate-x-1/4 -translate-y-1/4 pointer-events-none z-0" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#e6c17a]/15 rounded-full blur-[100px] translate-x-1/4 translate-y-1/4 pointer-events-none z-0" />

        {/* Left Side (Text Area) */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
          <div className="text-left max-w-xl w-full mx-auto lg:ml-auto lg:mr-8 mt-10 lg:mt-0">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-block py-1 px-3 rounded-full bg-adventure-orange/10 border border-adventure-orange/30 text-adventure-orange text-sm font-semibold mb-6">
                Welcome to Ovijatrik
              </span>
              <h1 className="text-5xl md:text-7xl font-extrabold text-[#1B4332] mb-6 tracking-tight">
                Time To <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B35] to-[#e0a82e]">Explore</span>
              </h1>
              <p className="text-lg md:text-2xl text-slate-700 mb-10">
                The official adventure club of Rajshahi University of Engineering & Technology. Join us to conquer mountains, run marathons, and make a difference.
              </p>
              <div className="flex flex-col sm:flex-row items-start justify-start gap-4">
                <a href="#events" className="px-8 py-4 rounded-full bg-[#FF6B35] text-white font-semibold text-lg hover:bg-[#e65a29] transition-colors shadow-lg shadow-[#FF6B35]/30 flex items-center gap-2">
                  Upcoming Events <ArrowRight size={20} />
                </a>
                <a href="/auth" className="px-8 py-4 rounded-full border-2 border-[#FF6B35] text-[#FF6B35] font-semibold text-lg hover:bg-[#FF6B35]/10 transition-colors flex items-center gap-2">
                  Member Login
                </a>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right Side (Banner Area) */}
        <div className="w-full lg:w-1/2 relative min-h-[50vh] lg:min-h-full flex items-center justify-center p-8 z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative w-full max-w-lg aspect-square lg:aspect-[4/3] xl:aspect-square mx-auto rounded-3xl overflow-hidden shadow-2xl border-4 border-white group bg-white"
          >
            <img 
              src="/logo.jpg" 
              alt="OviJatrik Hero Banner" 
              className="w-full h-full object-contain p-4 transition-transform duration-700 group-hover:scale-105" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1B4332]/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
            
            <div className="absolute bottom-0 left-0 w-full p-8 z-20 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
              <p className="text-[#e0a82e] font-medium tracking-wider uppercase text-sm mb-2">Since 2018</p>
              <h3 className="text-3xl font-bold text-white">RUET Adventure Club</h3>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 relative z-20 -mt-10 bg-transparent">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white p-8 rounded-2xl text-center shadow-xl border border-[#e6c17a]/30"
            >
              <div className="w-16 h-16 mx-auto bg-adventure-orange/20 rounded-full flex items-center justify-center mb-4 text-adventure-orange">
                <MapPin size={32} />
              </div>
              <h3 className="text-4xl font-bold text-[#1B4332] mb-2">50+</h3>
              <p className="text-slate-600">Expeditions Completed</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white p-8 rounded-2xl text-center shadow-xl border border-[#e6c17a]/30"
            >
              <div className="w-16 h-16 mx-auto bg-[#1B4332]/10 border border-[#1B4332]/20 rounded-full flex items-center justify-center mb-4 text-[#1B4332]">
                <Users size={32} />
              </div>
              <h3 className="text-4xl font-bold text-[#1B4332] mb-2">1,200+</h3>
              <p className="text-slate-600">Active Members</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="bg-white p-8 rounded-2xl text-center shadow-xl border border-[#e6c17a]/30"
            >
              <div className="w-16 h-16 mx-auto bg-sky-500/20 rounded-full flex items-center justify-center mb-4 text-sky-400">
                <CalendarIcon size={32} />
              </div>
              <h3 className="text-4xl font-bold text-[#1B4332] mb-2">5</h3>
              <p className="text-slate-600">Years of Legacy</p>
            </motion.div>
          </div>
        </div>
      </section>
      
    </div>
  )
}
