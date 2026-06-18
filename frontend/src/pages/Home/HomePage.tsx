import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, MapPin, Calendar as CalendarIcon, Users } from 'lucide-react'
import { useState, useEffect } from 'react'

// Extended Mock Data for Admin Panel
export const mockEvents = Array.from({ length: 12 }).map((_, i) => ({
  id: i + 1,
  title: `Expedition ${i + 1}: ${['Keokradong', 'Tazing Dong', 'Sajek', 'Coxs Bazar', 'Sylhet', 'Sundarbans'][i % 6]}`,
  date: `August ${10 + i}, 2026`,
  location: ['Bandarban', 'Bandarban', 'Khagrachari', 'Coxs Bazar', 'Sylhet', 'Khulna'][i % 6],
  image: `https://images.unsplash.com/photo-${[
    '1464822759023-fed622ff2c3b',
    '1552674605-15c2145efa38',
    '1523987355523-c7b5b0dd90a7',
    '1506197603052-3cc9c3a201bd',
    '1501555088652-0f6bbf352816',
    '1511576661531-b34d7da5d0fa'
  ][i % 6]}?q=80&w=800&auto=format&fit=crop`,
  category: ['Trekking', 'Running', 'Camping', 'Cycling', 'Trekking', 'Camping'][i % 6],
  spots: 50,
  spotsLeft: Math.floor(Math.random() * 20) + 1
}));

const mockBlogs = Array.from({ length: 10 }).map((_, i) => ({
  id: i + 1,
  title: `Adventure Story ${i + 1}: Lessons learned from the wild`,
  date: `May ${10 + i}, 2026`,
  readTime: `${Math.floor(Math.random() * 10) + 3} min read`,
}));

const mockGallery = Array.from({ length: 15 }).map((_, i) => ({
  id: i + 1,
  image: `https://images.unsplash.com/photo-${[
    '1464822759023-fed622ff2c3b',
    '1552674605-15c2145efa38',
    '1523987355523-c7b5b0dd90a7',
    '1506197603052-3cc9c3a201bd',
    '1501555088652-0f6bbf352816',
    '1511576661531-b34d7da5d0fa'
  ][i % 6]}?q=80&w=800&auto=format&fit=crop`,
  alt: `Gallery Image ${i + 1}`
}));

export const HomePage = () => {
  const [visibleEvents, setVisibleEvents] = useState(6);
  const [visibleBlogs, setVisibleBlogs] = useState(4);
  const [visibleGallery, setVisibleGallery] = useState(6);
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      setTimeout(() => {
        const element = document.getElementById(location.hash.substring(1));
        if (element) {
          const y = element.getBoundingClientRect().top + window.scrollY - 100;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 100);
    }
  }, [location]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section id="home" className="relative min-h-[90vh] flex flex-col lg:flex-row bg-transparent">
        {/* Left Side (Text Area) */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-2 py-4 sm:p-8 relative z-10">
          <div className="text-left max-w-xl w-full mx-auto lg:ml-auto lg:mr-8 mt-2 sm:mt-10 lg:mt-0">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="hidden md:inline-block py-1 px-3 rounded-full bg-adventure-orange/10 border border-adventure-orange/30 text-adventure-orange text-sm font-semibold mb-6">
                Welcome to Ovijatrik
              </span>
              <h1 className="text-[2.25rem] sm:text-5xl md:text-7xl font-extrabold text-[#1B4332] mb-3 md:mb-6 tracking-tight leading-[1.1] whitespace-nowrap">
                Time To <span className="text-transparent bg-clip-text bg-gradient-to-r from-adventure-orange via-[#ff8a5c] to-amber-400">Explore</span>
              </h1>
              <p className="text-sm sm:text-lg md:text-2xl text-slate-700 mb-6 md:mb-10 leading-snug md:leading-normal">
                The official adventure club of Rajshahi University of Engineering & Technology. Join us to conquer mountains, run marathons, and make a difference.
              </p>
              <div className="flex flex-row w-full gap-2 sm:gap-4">
                <a href="#events" className="flex-1 flex items-center justify-center px-1 py-3 sm:px-8 sm:py-4 rounded-full bg-[#FF6B35] text-white font-semibold text-[11px] xs:text-xs sm:text-base md:text-lg hover:bg-[#e65a29] hover:-translate-y-1 hover:shadow-xl hover:shadow-[#FF6B35]/40 transition-all duration-300 shadow-lg shadow-[#FF6B35]/30 whitespace-nowrap">
                  Upcoming Events <ArrowRight className="w-3 h-3 sm:w-5 sm:h-5 ml-1 sm:ml-2" />
                </a>
                <a href="/auth" className="flex-1 flex items-center justify-center px-1 py-3 sm:px-8 sm:py-4 rounded-full border-2 border-[#FF6B35] text-[#FF6B35] font-semibold text-[11px] xs:text-xs sm:text-base md:text-lg hover:bg-[#FF6B35]/10 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 whitespace-nowrap">
                  Member Login
                </a>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right Side (Banner Area) */}
        <div className="w-full lg:w-1/2 relative min-h-[40vh] lg:min-h-full flex items-center justify-center p-4 sm:p-8 z-10">
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
      <section className="py-10 sm:py-20 relative z-20 -mt-10 sm:-mt-10 bg-transparent">
        <div className="max-w-6xl mx-auto px-2 sm:px-4">
          <div className="grid grid-cols-3 gap-2 sm:gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white p-2 sm:p-8 rounded-xl sm:rounded-2xl text-center shadow-md sm:shadow-xl border border-[#e6c17a]/30"
            >
              <div className="w-8 h-8 sm:w-16 sm:h-16 mx-auto bg-adventure-orange/20 rounded-full flex items-center justify-center mb-1 sm:mb-4 text-adventure-orange">
                <MapPin className="w-4 h-4 sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-lg sm:text-4xl font-bold text-[#1B4332] mb-0 sm:mb-2 leading-none">50+</h3>
              <p className="text-[10px] sm:text-base text-slate-600 leading-tight">Expeditions</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white p-2 sm:p-8 rounded-xl sm:rounded-2xl text-center shadow-md sm:shadow-xl border border-[#e6c17a]/30"
            >
              <div className="w-8 h-8 sm:w-16 sm:h-16 mx-auto bg-[#1B4332]/10 border border-[#1B4332]/20 rounded-full flex items-center justify-center mb-1 sm:mb-4 text-[#1B4332]">
                <Users className="w-4 h-4 sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-lg sm:text-4xl font-bold text-[#1B4332] mb-0 sm:mb-2 leading-none">1,200+</h3>
              <p className="text-[10px] sm:text-base text-slate-600 leading-tight">Members</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="bg-white p-2 sm:p-8 rounded-xl sm:rounded-2xl text-center shadow-md sm:shadow-xl border border-[#e6c17a]/30"
            >
              <div className="w-8 h-8 sm:w-16 sm:h-16 mx-auto bg-sky-500/20 rounded-full flex items-center justify-center mb-1 sm:mb-4 text-sky-400">
                <CalendarIcon className="w-4 h-4 sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-lg sm:text-4xl font-bold text-[#1B4332] mb-0 sm:mb-2 leading-none">5</h3>
              <p className="text-[10px] sm:text-base text-slate-600 leading-tight">Years Legacy</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section id="events" className="py-10 sm:py-20 relative z-20 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-[#1B4332] font-garamond mb-2 sm:mb-4">Upcoming <span className="text-adventure-orange">Events</span></h2>
            <p className="text-sm sm:text-lg text-slate-600">Join our next expedition or local meetup.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8">
            {mockEvents.slice(0, visibleEvents).map((event) => (
              <div key={event.id} className="bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-md sm:shadow-lg border border-[#1B4332]/10 group hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 flex flex-row sm:flex-col">
                <div className="relative w-1/3 sm:w-full min-h-[110px] sm:h-48 overflow-hidden shrink-0">
                  <img src={event.image} alt={event.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute top-2 left-2 sm:top-4 sm:left-auto sm:right-4 bg-white/90 backdrop-blur-sm px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold text-adventure-orange">
                    {event.category}
                  </div>
                </div>
                <div className="p-3 sm:p-6 flex flex-col flex-1 justify-center">
                  <h3 className="text-sm sm:text-xl font-bold text-[#1B4332] font-garamond mb-1 sm:mb-2 line-clamp-1 leading-tight">{event.title}</h3>
                  <div className="flex flex-col gap-0.5 sm:gap-2 text-[11px] sm:text-sm text-slate-600 mb-2 sm:mb-6">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="w-3 h-3 sm:w-4 sm:h-4 text-adventure-orange shrink-0">📅</span> <span className="truncate">{event.date}</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="w-3 h-3 sm:w-4 sm:h-4 text-adventure-orange shrink-0">📍</span> <span className="truncate">{event.location}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-[10px] sm:text-sm font-medium text-slate-500">{event.spotsLeft} spots left</span>
                    <Link to={`/events/${event.id}`} className="px-3 py-1 sm:px-4 sm:py-2 bg-adventure-orange/10 text-adventure-orange text-[10px] sm:text-base font-semibold rounded-md sm:rounded-lg hover:bg-adventure-orange hover:text-white transition-colors">
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {visibleEvents < mockEvents.length && (
            <div className="mt-12 text-center">
              <button 
                onClick={() => setVisibleEvents(prev => prev + 6)}
                className="px-8 py-3 rounded-full border-2 border-[#1B4332] text-[#1B4332] font-semibold hover:bg-[#1B4332] hover:text-white transition-colors"
              >
                Load More Events
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-20 relative z-20 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-extrabold text-[#1B4332] font-garamond mb-4">Adventure <span className="text-adventure-orange">Gallery</span></h2>
            <p className="text-slate-600 text-lg">Glimpses of our memories.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {mockGallery.slice(0, visibleGallery).map((img) => (
              <Link to={`/gallery/${img.id}`} key={img.id} className="relative aspect-square overflow-hidden rounded-2xl group block">
                <img src={img.image} alt={img.alt} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white font-semibold">View</span>
                </div>
              </Link>
            ))}
          </div>

          {visibleGallery < mockGallery.length && (
            <div className="mt-12 text-center">
              <button 
                onClick={() => setVisibleGallery(prev => prev + 6)}
                className="px-8 py-3 rounded-full border-2 border-[#1B4332] text-[#1B4332] font-semibold hover:bg-[#1B4332] hover:text-white transition-colors"
              >
                Load More Memories
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Blog Section */}
      <section id="blog" className="py-20 relative z-20 scroll-mt-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-extrabold text-[#1B4332] font-garamond mb-4">Latest <span className="text-adventure-orange">Stories</span></h2>
            <p className="text-slate-600 text-lg">Experiences shared by our members.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {mockBlogs.slice(0, visibleBlogs).map((post) => (
              <Link key={post.id} to={`/blog/${post.id}`} className="group block bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-md hover:shadow-xl hover:-translate-y-1 border border-[#1B4332]/5 transition-all duration-300">
                <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-4 text-xs sm:text-sm text-slate-500 font-medium">
                  <span className="bg-adventure-orange/10 text-adventure-orange px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">{post.date}</span>
                  <span className="hidden sm:inline">•</span>
                  <span>{post.readTime}</span>
                </div>
                <h3 className="text-lg sm:text-2xl font-bold text-[#1B4332] group-hover:text-adventure-orange transition-colors line-clamp-2">{post.title}</h3>
                <p className="mt-2 sm:mt-4 text-sm sm:text-base text-slate-600 line-clamp-2">
                  Adventure brings unexpected challenges, but with the right mindset and preparation, you can conquer any trail. 
                  Read on to discover the incredible experiences our members faced on this journey.
                </p>
              </Link>
            ))}
          </div>

          {visibleBlogs < mockBlogs.length && (
            <div className="mt-12 text-center">
              <button 
                onClick={() => setVisibleBlogs(prev => prev + 4)}
                className="px-8 py-3 rounded-full border-2 border-[#1B4332] text-[#1B4332] font-semibold hover:bg-[#1B4332] hover:text-white transition-colors"
              >
                Load More Posts
              </button>
            </div>
          )}
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-24 relative z-20 bg-white border-t border-[#1B4332]/10 scroll-mt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block py-1 px-4 rounded-full bg-[#1B4332]/10 text-[#1B4332] text-sm font-bold mb-6 tracking-widest uppercase">
            Our Legacy
          </span>
          <h2 className="text-5xl font-extrabold text-[#1B4332] font-garamond mb-8">About <span className="text-adventure-orange">Ovijatrik</span></h2>
          <p className="text-xl text-slate-700 mb-8 leading-relaxed">
            Founded in 2018, the RUET Adventure Club (Ovijatrik) is the premier adventure organization
            of Rajshahi University of Engineering & Technology. We believe in pushing boundaries,
            exploring the unknown, and fostering a spirit of teamwork and resilience among our members.
          </p>
          <p className="text-xl text-slate-700 leading-relaxed mb-12">
            From conquering the highest peaks in Bangladesh to organizing large-scale marathons and 
            camping trips, we are dedicated to providing unforgettable experiences.
          </p>
          
          <Link to="/about" className="inline-flex items-center gap-2 px-8 py-4 bg-[#1B4332] text-white rounded-full font-semibold hover:bg-green-900 transition-colors shadow-lg shadow-[#1B4332]/30 hover:-translate-y-1">
            Read Our Full Story <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  )
}
