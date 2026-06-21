import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { dynamicGet, dynamicUpdate, dynamicDelete } from '../../utils/apiClient';
import { slugify } from '../../utils/slugify';
import { Loader2, ArrowLeft, Calendar, MapPin, ExternalLink, Check, Trash2, Image as ImageIcon, CheckCircle2, X } from 'lucide-react';

interface GalleryItem {
  id: string;
  image_url: string;
  category: string;
  caption?: string | null;
  status: string;
  uploaded_at: string | number;
  linked_event_id?: string;
}

interface EventItem {
  id: string;
  title: string;
  date: string | number;
  location: string;
}

export const AdminGalleryAlbumPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<GalleryItem[]>([]);
  const [albumName, setAlbumName] = useState<string>('');
  const [linkedEvent, setLinkedEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await dynamicGet<GalleryItem>('gallery', { order: 'uploaded_at', dir: 'desc' });
      
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
      } else {
        // No photos found for this album, maybe it was deleted
      }
    } catch (err) {
      console.error('Failed to fetch gallery album:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleApprove = async (photoId: string) => {
    try {
      await dynamicUpdate('gallery', { id: photoId, status: 'approved' });
      showToast('Photo approved successfully');
      fetchData();
    } catch (err) {
      showToast('Failed to approve photo', 'error');
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;
    try {
      await dynamicDelete('gallery', { id: photoId });
      showToast('Photo deleted successfully');
      fetchData();
    } catch (err) {
      showToast('Failed to delete photo', 'error');
    }
  };

  const handleApproveAll = async () => {
    const pendingPhotos = photos.filter(p => p.status === 'pending');
    if (pendingPhotos.length === 0) return;
    
    if (!confirm(`Are you sure you want to approve ${pendingPhotos.length} photos?`)) return;
    
    try {
      for (const photo of pendingPhotos) {
        await dynamicUpdate('gallery', { id: photo.id, status: 'approved' });
      }
      showToast(`Successfully approved ${pendingPhotos.length} photos`);
      fetchData();
    } catch (err) {
      showToast('Error occurred while approving photos', 'error');
      fetchData();
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 sm:space-y-8 min-h-[calc(100vh-2rem)] animate-pulse">
        <div className="w-full h-64 sm:h-80 rounded-3xl bg-slate-200"></div>
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="w-full bg-slate-200 rounded-2xl break-inside-avoid" style={{ height: `${Math.floor(Math.random() * 150) + 150}px` }}></div>
          ))}
        </div>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-[#1B4332]/10 shadow-sm">
        <h1 className="text-3xl font-bold font-garamond mb-4 text-[#1B4332]">Album Not Found or Empty</h1>
        <button onClick={() => navigate('/admin/gallery')} className="text-slate-600 hover:text-[#FF6B35] font-semibold flex items-center justify-center gap-2 transition-colors mx-auto mt-6 px-6 py-2 bg-slate-100 rounded-full">
          <ArrowLeft size={16} /> Back to Gallery
        </button>
      </div>
    );
  }

  const coverImage = photos.find(p => p.image_url)?.image_url || photos[0]?.image_url;
  const pendingCount = photos.filter(p => p.status === 'pending').length;

  return (
    <div className="space-y-6 sm:space-y-8 min-h-[calc(100vh-2rem)] relative">
      {toastMessage && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-2 transform transition-all duration-300 translate-y-0 opacity-100 ${toastMessage.type === 'success' ? 'bg-[#1B4332] text-white' : 'bg-red-600 text-white'}`}>
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <X className="w-5 h-5" />}
          <span className="font-medium text-sm">{toastMessage.text}</span>
        </div>
      )}

      {/* Hero Header Section */}
      <div className="relative w-full h-64 sm:h-80 rounded-3xl overflow-hidden shadow-sm border border-[#1B4332]/10 group">
        <img src={coverImage} alt={albumName} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1B4332]/90 via-[#1B4332]/40 to-black/20" />
        
        <button onClick={() => navigate('/admin/gallery')} className="absolute top-6 left-6 inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-xl text-sm font-semibold transition-colors border border-white/20">
          <ArrowLeft size={16} /> Back to Gallery
        </button>

        <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white font-garamond mb-2 leading-tight drop-shadow-md">
              {albumName}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/90 font-medium">
              <span className="flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                <ImageIcon className="w-4 h-4" /> {photos.length} {photos.length === 1 ? 'Photo' : 'Photos'}
              </span>
              {pendingCount > 0 && (
                <span className="flex items-center gap-1.5 bg-amber-500/80 px-3 py-1 rounded-full backdrop-blur-sm border border-amber-500/20 text-white">
                  <Check className="w-4 h-4" /> {pendingCount} Pending Approval
                </span>
              )}
            </div>
          </div>
          
          {pendingCount > 0 && (
            <button 
              onClick={handleApproveAll}
              className="px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-500/25 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <Check className="w-4 h-4" />
              Approve All Pending
            </button>
          )}
        </div>
      </div>

      {/* Linked Event Details */}
      {linkedEvent && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-[#1B4332]/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#FF6B35]/10 rounded-xl flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6 text-[#FF6B35]" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Linked Event</p>
              <h3 className="text-lg font-bold text-[#1B4332] leading-tight">{linkedEvent.title}</h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(Number(linkedEvent.date)).toLocaleDateString()}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {linkedEvent.location}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Masonry Photos Grid */}
      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {photos.map((item) => (
          <div key={item.id} className="break-inside-avoid relative group rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200 bg-white">
            <img 
              src={item.image_url} 
              alt={item.caption || 'Album photo'} 
              className="w-full h-auto object-cover transform group-hover:scale-[1.02] transition-transform duration-500" 
              loading="lazy"
            />
            
            {/* Status Badge */}
            {item.status === 'pending' && (
              <div className="absolute top-3 left-3 bg-amber-500 text-white backdrop-blur-sm border border-amber-400 px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-sm uppercase tracking-wide">
                Pending
              </div>
            )}

            {/* Hover Actions */}
            <div className="absolute inset-0 bg-[#1B4332]/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4">
              <div className="flex justify-end items-start gap-2">
                {item.status === 'pending' && (
                  <button
                    onClick={() => handleApprove(item.id)}
                    className="p-2.5 bg-green-500 hover:bg-green-600 text-white rounded-full transition-transform transform hover:scale-110 shadow-lg"
                    title="Approve Photo"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-transform transform hover:scale-110 shadow-lg"
                  title="Delete Photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              {item.caption && (
                <p className="text-white font-medium text-xs sm:text-sm leading-snug line-clamp-3">
                  {item.caption}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
