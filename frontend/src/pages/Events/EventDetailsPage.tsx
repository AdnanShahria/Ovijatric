import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { dynamicGet } from '../../utils/apiClient';
import { Loader2, Calendar, MapPin, Users, Info, ExternalLink, ArrowLeft, ChevronLeft, ChevronRight, Image as ImageIcon, X, Camera } from 'lucide-react';
import { slugify } from '../../utils/slugify';
import { createPortal } from 'react-dom';

interface Event {
  id: string;
  title: string;
  title_bn?: string;
  description: string;
  description_bn?: string;
  date: string | number;
  location: string;
  fee?: string;
  total_spots?: number;
  image_url?: string | null;
  additional_images?: string | null;
  sponsors?: string | null;
  tags?: string | null;
  is_registration_open: boolean | number;
}

interface GalleryItem {
  id: string;
  image_url: string;
  category: string;
  caption?: string | null;
  description?: string | null;
  uploaded_at: string | number;
  linked_event_id?: string;
}

export const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [otherEvents, setOtherEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [activeImage, setActiveImage] = useState<string>('');
  
  // Gallery states
  const [eventPhotos, setEventPhotos] = useState<GalleryItem[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);

  // Lightbox Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight') setCurrentPhotoIdx((prev) => (prev + 1) % eventPhotos.length);
      if (e.key === 'ArrowLeft') setCurrentPhotoIdx((prev) => (prev === 0 ? eventPhotos.length - 1 : prev - 1));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, currentPhotoIdx, eventPhotos.length]);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        setLoading(true);
        const allEvents = await dynamicGet<Event>('events', { order: 'date', dir: 'desc' });
        const currentEvent = allEvents.find(e => slugify(e.title) === id || e.id === id);
        
        if (currentEvent) {
          setEvent(currentEvent);
          setActiveImage(currentEvent.image_url || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop');
          const filtered = allEvents.filter(e => e.id !== currentEvent.id).slice(0, 3);
          setOtherEvents(filtered);
          
          // Fetch linked gallery
          const galleryData = await dynamicGet<GalleryItem>('gallery', { eq: { status: 'approved' }, order: 'uploaded_at', dir: 'desc' });
          const linkedPhotos = galleryData.filter(g => g.linked_event_id === currentEvent.id);
          setEventPhotos(linkedPhotos);
        } else {
          setEvent(null);
        }
      } catch (err) {
        console.error('Failed to fetch event data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 animate-spin text-[#1B4332]" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-8">
        <h1 className="text-4xl font-bold text-[#1B4332] font-garamond mb-4">Event Not Found</h1>
        <Link to="/#events" className="text-adventure-orange hover:underline font-semibold flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Events
        </Link>
      </div>
    );
  }

  const title = lang === 'en' ? event.title : (event.title_bn || event.title);
  const description = lang === 'en' ? event.description : (event.description_bn || event.description);
  
  let additionalImages: string[] = [];
  try {
    if (event.additional_images) additionalImages = JSON.parse(event.additional_images);
  } catch (e) {
    // ignore
  }

  let tagsArray: string[] = [];
  if (event.tags) {
    tagsArray = event.tags.split(',').map(t => t.trim()).filter(Boolean);
  }
  
  let sponsorsArray: string[] = [];
  if (event.sponsors) {
    sponsorsArray = event.sponsors.split(',').map(t => t.trim()).filter(Boolean);
  }

  const allImages = [event.image_url || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop', ...additionalImages];

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Custom Navbar */}
      <div className="sticky top-0 z-50">
        <nav className="w-full bg-[#eef5ee] rounded-b-3xl transition-all duration-500 ease-in-out shadow-md border-b border-x border-[#1B4332]/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="transition-all duration-300 flex items-center justify-between h-16">
              <div className="flex-shrink-0 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-[#1B4332] transition-colors p-2 -ml-2 rounded-full hover:bg-black/5">
                  <ArrowLeft size={20} />
                </button>
                <Link to="/" className="flex items-center gap-3 group">
                  <img src="/logo.jpg" alt="Logo" className="h-10 w-10 rounded-full border-2 border-adventure-orange transition-transform group-hover:scale-105 object-cover" />
                  <span className="text-[#1B4332] font-garamond font-bold text-2xl tracking-tight group-hover:text-adventure-orange transition-colors hidden sm:block">
                    Ovijatrik
                  </span>
                </Link>
              </div>
              
              {(event.title_bn || event.description_bn) && (
                <div className="flex bg-white/50 border border-[#1B4332]/10 rounded-lg p-1 shadow-sm">
                  <button 
                    onClick={() => setLang('en')} 
                    className={`px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-all duration-200 ${lang === 'en' ? 'bg-[#1B4332] text-white shadow-md' : 'text-slate-600 hover:text-[#1B4332]'}`}
                  >
                    ENG
                  </button>
                  <button 
                    onClick={() => setLang('bn')} 
                    className={`px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-all duration-200 ${lang === 'bn' ? 'bg-[#1B4332] text-white shadow-md' : 'text-slate-600 hover:text-[#1B4332]'}`}
                  >
                    বাংলা
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>
      </div>

      {/* Main Content - eCommerce Style */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        <div className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            
            {/* Left Column: Images */}
            <div className="w-full">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-200 mb-4 shadow-sm border border-slate-100 relative group">
                <img src={activeImage} alt={title} className="w-full h-full object-contain bg-white" />
                {allImages.length > 1 && (
                  <>
                    <button 
                      onClick={() => {
                        const currentIndex = allImages.indexOf(activeImage);
                        const prevIndex = (currentIndex - 1 + allImages.length) % allImages.length;
                        setActiveImage(allImages[prevIndex]);
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-[#1B4332] p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button 
                      onClick={() => {
                        const currentIndex = allImages.indexOf(activeImage);
                        const nextIndex = (currentIndex + 1) % allImages.length;
                        setActiveImage(allImages[nextIndex]);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-[#1B4332] p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </>
                )}
              </div>
              {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                  {allImages.map((img, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveImage(img)}
                      className={`relative shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-all ${activeImage === img ? 'border-adventure-orange opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                      <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Details */}
            <div className="flex flex-col h-full">
              {tagsArray.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-4">
                  {tagsArray.map((tag, i) => (
                    <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-md">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="mb-4">
                  <span className="px-3 py-1 bg-adventure-orange/10 text-adventure-orange text-xs font-bold uppercase tracking-wider rounded-md">
                    Expedition
                  </span>
                </div>
              )}

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1B4332] font-garamond mb-6 leading-tight">
                {title}
              </h1>

              <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-8">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Calendar size={18} className="text-adventure-orange" />
                    <span className="text-xs uppercase tracking-wider font-semibold">Date</span>
                  </div>
                  <p className="font-semibold text-slate-800 ml-6 text-sm sm:text-base">
                    {new Date(Number(event.date)).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-slate-500">
                    <MapPin size={18} className="text-adventure-orange" />
                    <span className="text-xs uppercase tracking-wider font-semibold">Location</span>
                  </div>
                  <p className="font-semibold text-slate-800 ml-6 text-sm sm:text-base">
                    {event.location}
                  </p>
                </div>

                {event.fee && (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-slate-500">
                      <span className="text-adventure-orange text-lg font-bold w-[18px] text-center">৳</span>
                      <span className="text-xs uppercase tracking-wider font-semibold">Fee</span>
                    </div>
                    <p className="font-semibold text-slate-800 ml-6 text-sm sm:text-base">
                      {event.fee}
                    </p>
                  </div>
                )}

                {!!event.total_spots && (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Users size={18} className="text-adventure-orange" />
                      <span className="text-xs uppercase tracking-wider font-semibold">Spots</span>
                    </div>
                    <p className="font-semibold text-slate-800 ml-6 text-sm sm:text-base">
                      {event.total_spots} Available
                    </p>
                  </div>
                )}
              </div>

              <div className="prose prose-sm sm:prose-base prose-slate max-w-none mb-8 flex-grow">
                <div className="flex items-center gap-2 mb-3 text-[#1B4332] border-b border-slate-100 pb-2">
                  <Info size={20} />
                  <h3 className="text-lg font-bold m-0 font-garamond">About Event</h3>
                </div>
                <div dangerouslySetInnerHTML={{ __html: description }} className="text-slate-600 leading-relaxed" />
              </div>

              {sponsorsArray.length > 0 && (
                <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3 text-center">Sponsored By</h4>
                  <div className="flex flex-wrap justify-center gap-4">
                    {sponsorsArray.map((sponsor, idx) => (
                      <span key={idx} className="px-4 py-2 bg-white text-slate-700 font-semibold rounded-lg shadow-sm border border-slate-200 text-sm">
                        {sponsor}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-auto pt-6 border-t border-slate-100">
                {event.is_registration_open ? (
                  <button className="w-full py-4 rounded-xl bg-adventure-orange text-white font-bold text-lg hover:bg-[#e65a29] hover:-translate-y-1 hover:shadow-xl transition-all duration-300 shadow-md shadow-adventure-orange/30">
                    Join Event Now
                  </button>
                ) : (
                  <button disabled className="w-full py-4 rounded-xl bg-slate-200 text-slate-500 font-bold text-lg cursor-not-allowed">
                    Registration Closed
                  </button>
                )}
                <p className="text-center text-xs text-slate-400 mt-3">Secure your spot before it fills up!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Linked Gallery Section */}
        {eventPhotos.length > 0 && (
          <div className="mt-16 sm:mt-24 mb-10 border-t border-slate-100 pt-16">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <h2 className="text-3xl font-extrabold text-[#1B4332] font-garamond mb-2 flex items-center gap-3">
                  <Camera className="text-adventure-orange w-8 h-8" /> Event <span className="text-adventure-orange">Gallery</span>
                </h2>
                {eventPhotos[0]?.description ? (
                  <p className="text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">{eventPhotos[0].description}</p>
                ) : (
                  <p className="text-sm text-slate-500">Memories captured during this expedition.</p>
                )}
              </div>
              <Link to="/#gallery" className="text-sm font-bold text-adventure-orange hover:text-[#e65a29] transition-colors flex items-center gap-1 bg-adventure-orange/10 px-4 py-2 rounded-xl">
                View All Albums <ChevronRight size={16} />
              </Link>
            </div>
            
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
              {eventPhotos.map((photo, idx) => (
                <div 
                  key={photo.id} 
                  onClick={() => { setCurrentPhotoIdx(idx); setLightboxOpen(true); }}
                  className="break-inside-avoid relative group rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200 bg-white cursor-pointer"
                >
                  <img 
                    src={photo.image_url} 
                    alt={photo.caption || 'Event photo'} 
                    className="w-full h-auto object-cover transform group-hover:scale-[1.03] transition-transform duration-700" 
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1B4332]/80 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    {photo.caption && (
                      <p className="text-white font-medium text-xs sm:text-sm leading-snug line-clamp-3 drop-shadow-md">
                        {photo.caption}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other Events Section */}
        {otherEvents.length > 0 && (
          <div className="mt-20 mb-10">
            <h2 className="text-3xl font-extrabold text-[#1B4332] font-garamond mb-8 text-center">Explore Other <span className="text-adventure-orange">Events</span></h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {otherEvents.map((evt) => (
                <Link key={evt.id} to={`/events/${slugify(evt.title)}`} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-slate-100 transition-all duration-300 hover:-translate-y-1 block">
                  <div className="aspect-[16/9] bg-slate-100 relative overflow-hidden">
                    <img src={evt.image_url || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop'} alt={evt.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    {evt.is_registration_open && (
                      <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                        Open
                      </div>
                    )}
                  </div>
                  <div className="p-4 sm:p-5">
                    <h3 className="font-bold text-lg text-[#1B4332] mb-2 line-clamp-1 group-hover:text-adventure-orange transition-colors">{evt.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                      <Calendar size={14} className="text-adventure-orange" />
                      {new Date(Number(evt.date)).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <MapPin size={14} className="text-adventure-orange" />
                      <span className="line-clamp-1">{evt.location}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Custom Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <img src="/logo.jpg" alt="Logo" className="w-5 h-5 rounded-full grayscale opacity-70" />
            &copy; {new Date().getFullYear()} Ovijatrik.
          </div>
          <a 
            href="https://orbitsaas.cloud" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-500 hover:text-[#1B4332] transition-colors bg-slate-50 hover:bg-slate-100 px-4 py-2 rounded-full border border-slate-200"
          >
            Technical Partner <span className="font-bold text-[#bfa15f]">OrbitSaaS</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </footer>

      {/* Lightbox Modal */}
      {lightboxOpen && createPortal(
        <div className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 text-white border-b border-white/10 shrink-0">
            <div className="text-sm font-medium text-white/60">
              {currentPhotoIdx + 1} / {eventPhotos.length}
            </div>
            <button 
              onClick={() => setLightboxOpen(false)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex items-center justify-center relative p-4 sm:p-8">
            <button 
              onClick={(e) => { e.stopPropagation(); setCurrentPhotoIdx((prev) => (prev === 0 ? eventPhotos.length - 1 : prev - 1)); }}
              className="absolute left-4 sm:left-8 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-all border border-white/10 hover:scale-110 z-10"
            >
              <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
            
            <div className="relative max-w-full max-h-full flex flex-col items-center justify-center">
              <img 
                src={eventPhotos[currentPhotoIdx].image_url} 
                alt={eventPhotos[currentPhotoIdx].caption || 'Enlarged photo'}
                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
              />
              {eventPhotos[currentPhotoIdx].caption && (
                <div className="mt-6 text-center max-w-2xl">
                  <p className="text-white text-lg font-medium leading-relaxed drop-shadow-md">
                    {eventPhotos[currentPhotoIdx].caption}
                  </p>
                </div>
              )}
            </div>

            <button 
              onClick={(e) => { e.stopPropagation(); setCurrentPhotoIdx((prev) => (prev + 1) % eventPhotos.length); }}
              className="absolute right-4 sm:right-8 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-all border border-white/10 hover:scale-110 z-10"
            >
              <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
