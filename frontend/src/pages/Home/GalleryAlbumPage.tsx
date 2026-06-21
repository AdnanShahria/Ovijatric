import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { dynamicGet } from '../../utils/apiClient';
import { slugify } from '../../utils/slugify';
import { Loader2, ArrowLeft, Calendar, MapPin, ExternalLink, X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

interface GalleryItem {
  id: string;
  image_url: string;
  category: string;
  caption?: string | null;
  uploaded_at: string | number;
  linked_event_id?: string;
}

interface EventItem {
  id: string;
  title: string;
  date: string | number;
  location: string;
}

export const GalleryAlbumPage = () => {
  const { id } = useParams();
  const [photos, setPhotos] = useState<GalleryItem[]>([]);
  const [albumName, setAlbumName] = useState<string>('');
  const [linkedEvent, setLinkedEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        setLoading(true);
        const data = await dynamicGet<GalleryItem>('gallery', { eq: { status: 'approved' }, order: 'uploaded_at', dir: 'desc' });
        
        const albumPhotos = data.filter(g => slugify(g.category) === id);
        setPhotos(albumPhotos);
        
        if (albumPhotos.length > 0) {
          setAlbumName(albumPhotos[0].category.replace('Event: ', '').replace('Blog: ', ''));
          
          const eventId = albumPhotos[0].linked_event_id;
          if (eventId) {
            const eventData = await dynamicGet<EventItem>('events', { eq: { id: eventId } });
            if (eventData.length > 0) {
              setLinkedEvent(eventData[0]);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch gallery album:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  // Lightbox Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, currentPhotoIdx, photos.length]);

  const openLightbox = (idx: number) => {
    setCurrentPhotoIdx(idx);
    setLightboxOpen(true);
  };

  const handleNext = () => {
    setCurrentPhotoIdx((prev) => (prev + 1) % photos.length);
  };

  const handlePrev = () => {
    setCurrentPhotoIdx((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 animate-spin text-[#FF6B35]" />
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-8">
        <h1 className="text-4xl font-bold font-garamond mb-4 text-[#1B4332]">Album Not Found</h1>
        <Link to="/#gallery" className="text-slate-600 hover:text-[#FF6B35] font-semibold flex items-center gap-2 transition-colors">
          <ArrowLeft size={16} /> Back to Gallery
        </Link>
      </div>
    );
  }

  const coverImage = photos[0]?.image_url;

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Hero Header Section */}
        <div className="relative w-full h-80 sm:h-96 rounded-3xl overflow-hidden shadow-sm border border-[#1B4332]/10 group">
          <img src={coverImage} alt={albumName} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1B4332]/95 via-[#1B4332]/50 to-black/30" />
          
          <Link to="/#gallery" className="absolute top-6 left-6 inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-xl text-sm font-semibold transition-colors border border-white/20">
            <ArrowLeft size={16} /> Back to All Albums
          </Link>

          <div className="absolute bottom-8 left-8 right-8">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white font-garamond mb-3 leading-tight drop-shadow-lg">
              {albumName}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/90 font-medium">
              <span className="flex items-center gap-1.5 bg-white/20 px-3.5 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
                <ImageIcon className="w-4 h-4" /> {photos.length} {photos.length === 1 ? 'Photo' : 'Photos'}
              </span>
              <span className="text-white/70">
                Latest from {new Date(Number(photos[0].uploaded_at)).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Linked Event Details */}
        {linkedEvent && (
          <div className="inline-flex flex-col sm:flex-row sm:items-center gap-4 bg-white p-5 pr-6 rounded-2xl shadow-sm border border-[#1B4332]/10">
            <div className="w-12 h-12 bg-[#FF6B35]/10 rounded-xl flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6 text-[#FF6B35]" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Linked Event</p>
              <h3 className="text-lg font-bold text-[#1B4332] leading-tight">{linkedEvent.title}</h3>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(Number(linkedEvent.date)).toLocaleDateString()}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {linkedEvent.location}</span>
              </div>
            </div>
            <Link 
              to={`/events/${slugify(linkedEvent.title)}`}
              className="mt-2 sm:mt-0 sm:ml-4 px-5 py-2.5 bg-[#EAF2ED] hover:bg-[#dce8dc] text-[#1B4332] rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              View Event <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Masonry Photos Grid */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {photos.map((photo, idx) => (
            <div 
              key={photo.id} 
              onClick={() => openLightbox(idx)}
              className="break-inside-avoid relative group rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 border border-slate-200 bg-white cursor-pointer"
            >
              <img 
                src={photo.image_url} 
                alt={photo.caption || 'Album photo'} 
                className="w-full h-auto object-cover transform group-hover:scale-[1.03] transition-transform duration-700" 
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1B4332]/80 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 sm:p-6">
                {photo.caption && (
                  <p className="text-white font-medium text-sm sm:text-base leading-snug line-clamp-3 mb-2 drop-shadow-md">
                    {photo.caption}
                  </p>
                )}
                <p className="text-white/80 text-xs font-semibold">
                  {new Date(Number(photo.uploaded_at)).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && createPortal(
        <div className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 text-white border-b border-white/10 shrink-0">
            <div className="text-sm font-medium text-white/60">
              {currentPhotoIdx + 1} / {photos.length}
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
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="absolute left-4 sm:left-8 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-all border border-white/10 hover:scale-110 z-10"
            >
              <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
            
            <div className="relative max-w-full max-h-full flex flex-col items-center justify-center">
              <img 
                src={photos[currentPhotoIdx].image_url} 
                alt={photos[currentPhotoIdx].caption || 'Enlarged photo'}
                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
              />
              {photos[currentPhotoIdx].caption && (
                <div className="mt-6 text-center max-w-2xl">
                  <p className="text-white text-lg font-medium leading-relaxed drop-shadow-md">
                    {photos[currentPhotoIdx].caption}
                  </p>
                </div>
              )}
            </div>

            <button 
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
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
