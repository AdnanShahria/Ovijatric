import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { dynamicGet } from '../../utils/apiClient';
import { Loader2 } from 'lucide-react';

export const EventsPage = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      try {
        setLoading(true);
        const data = await dynamicGet('events', { order: 'date', dir: 'desc' });
        if (data && data.length > 0) {
          setEvents(data.map((e: any) => {
            let tagsArray: string[] = [];
            if (e.tags) {
              tagsArray = e.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
            }
            return {
            id: e.id,
            title: e.title,
            date: new Date(Number(e.date)).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }),
            location: e.location,
            fee: e.fee,
            image: e.image_url || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop',
            category: 'Expedition',
            tags: tagsArray,
            spotsLeft: e.total_spots || 'Limited'
          }}));
        }
      } catch (err) {
        console.error('Failed to load events:', err);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-extrabold text-[#1B4332] font-garamond mb-8 text-center">Upcoming <span className="text-adventure-orange">Events</span></h1>
        <p className="text-center text-slate-600 max-w-2xl mx-auto mb-16 text-lg">Join us in our next adventure. Whether you are looking to conquer the highest peaks or run your first marathon, we have something for you.</p>
        
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 text-adventure-orange animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center text-slate-500 py-10">No upcoming events found. Check back soon!</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => (
            <Link key={event.id} to={`/events/${event.id}`} className="block bg-white rounded-2xl overflow-hidden shadow-lg border border-[#1B4332]/10 group hover:-translate-y-2 hover:shadow-2xl transition-all duration-300">
              <div className="relative w-full overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
                <img src={event.image} alt={event.title} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-adventure-orange">
                  {event.category}
                </div>
                {event.tags && event.tags.length > 0 && (
                  <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
                    {event.tags.map((tag: string, idx: number) => (
                      <span key={idx} className="bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide uppercase">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-3 sm:p-4 flex flex-col flex-1 justify-center">
                <h3 className="text-base sm:text-lg font-bold text-[#1B4332] font-garamond mb-1.5 line-clamp-1 leading-tight">{event.title}</h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] sm:text-xs text-slate-600 mb-4">
                  <div className="flex items-center gap-1">
                    <span className="w-3.5 h-3.5 text-adventure-orange shrink-0">📅</span> <span className="whitespace-nowrap">{event.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3.5 h-3.5 text-adventure-orange shrink-0">📍</span> <span className="whitespace-nowrap">{event.location}</span>
                  </div>
                  {event.fee && (
                    <div className="flex items-center gap-1">
                      <span className="w-3.5 h-3.5 text-adventure-orange shrink-0">💵</span> <span className="whitespace-nowrap">Fee: {event.fee}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between mt-auto pt-1">
                  <span className="text-xs sm:text-sm font-medium text-slate-500">{event.spotsLeft} spots left</span>
                  <span className="px-3 py-1.5 bg-adventure-orange/10 text-adventure-orange text-xs sm:text-sm font-semibold rounded-md group-hover:bg-adventure-orange group-hover:text-white transition-colors">
                    View Details
                  </span>
                </div>
              </div>
            </Link>
          ))}
          </div>
        )}
      </div>
    </div>
  );
};
