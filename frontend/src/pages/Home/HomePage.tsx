import { motion } from 'framer-motion'
import { ArrowRight, MapPin, Calendar as CalendarIcon, Users } from 'lucide-react'

export const HomePage = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 z-0 parallax-bg"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1522163182402-834f871fd851?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")',
          }}
        >
          <div className="absolute inset-0 bg-adventure-green/60 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block py-1 px-3 rounded-full bg-adventure-orange/20 border border-adventure-orange/50 text-adventure-orange text-sm font-semibold mb-6">
              Welcome to Ovijatrik
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight">
              Time To <span className="text-transparent bg-clip-text bg-gradient-to-r from-adventure-orange to-yellow-400">Explore</span>
            </h1>
            <p className="text-lg md:text-2xl text-slate-200 mb-10 max-w-2xl mx-auto">
              The official adventure club of Rajshahi University of Engineering & Technology. Join us to conquer mountains, run marathons, and make a difference.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="#events" className="px-8 py-4 rounded-full bg-adventure-orange text-white font-semibold text-lg hover:bg-orange-600 transition-colors shadow-lg shadow-adventure-orange/30 flex items-center gap-2">
                Upcoming Events <ArrowRight size={20} />
              </a>
              <a href="/auth" className="px-8 py-4 rounded-full glass-card text-white font-semibold text-lg hover:bg-white/10 transition-colors flex items-center gap-2">
                Member Login
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-background relative z-20 -mt-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-panel p-8 rounded-2xl text-center bg-slate-900/50"
            >
              <div className="w-16 h-16 mx-auto bg-adventure-orange/20 rounded-full flex items-center justify-center mb-4 text-adventure-orange">
                <MapPin size={32} />
              </div>
              <h3 className="text-4xl font-bold text-white mb-2">50+</h3>
              <p className="text-slate-400">Expeditions Completed</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="glass-panel p-8 rounded-2xl text-center bg-slate-900/50"
            >
              <div className="w-16 h-16 mx-auto bg-adventure-green/30 border border-adventure-green rounded-full flex items-center justify-center mb-4 text-green-400">
                <Users size={32} />
              </div>
              <h3 className="text-4xl font-bold text-white mb-2">1,200+</h3>
              <p className="text-slate-400">Active Members</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="glass-panel p-8 rounded-2xl text-center bg-slate-900/50"
            >
              <div className="w-16 h-16 mx-auto bg-sky-500/20 rounded-full flex items-center justify-center mb-4 text-sky-400">
                <CalendarIcon size={32} />
              </div>
              <h3 className="text-4xl font-bold text-white mb-2">5</h3>
              <p className="text-slate-400">Years of Legacy</p>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Spacer for demo */}
      <div className="h-64"></div>
    </div>
  )
}
