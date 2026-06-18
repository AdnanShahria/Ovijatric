import { useParams, Link } from 'react-router-dom';
import { mockEvents as upcomingEvents } from '../Home/HomePage';

export const EventDetailsPage = () => {
  const { id } = useParams();
  const event = upcomingEvents.find(e => e.id === Number(id));

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <h1 className="text-4xl font-bold text-[#1B4332] font-garamond mb-4">Event Not Found</h1>
        <Link to="/#events" className="text-adventure-orange hover:underline">Back to Events</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl overflow-hidden shadow-xl border border-[#1B4332]/10">
        <div className="h-64 sm:h-96 relative">
          <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-8 left-8 text-white">
            <span className="inline-block py-1 px-3 rounded-full bg-adventure-orange text-sm font-semibold mb-3">
              {event.category}
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold font-garamond">{event.title}</h1>
          </div>
        </div>
        
        <div className="p-8">
          <div className="flex flex-wrap gap-6 mb-8 pb-8 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📅</span>
              <div>
                <p className="text-sm text-slate-500 font-medium">Date</p>
                <p className="font-semibold text-[#1B4332]">{event.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📍</span>
              <div>
                <p className="text-sm text-slate-500 font-medium">Location</p>
                <p className="font-semibold text-[#1B4332]">{event.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">👥</span>
              <div>
                <p className="text-sm text-slate-500 font-medium">Availability</p>
                <p className="font-semibold text-[#1B4332]">{event.spotsLeft} of {event.spots} spots left</p>
              </div>
            </div>
          </div>

          <div className="prose prose-lg max-w-none text-slate-700 mb-10">
            <h3 className="text-2xl font-bold text-[#1B4332] font-garamond mb-4">About this Event</h3>
            <p className="mb-4">
              Join us for the {event.title}! This is a mock description that will eventually be pulled from your admin panel.
              We are excited to have you join our amazing community of adventurers. Prepare for an unforgettable experience
              filled with challenges, teamwork, and breathtaking views.
            </p>
            <p>
              Make sure to bring your best gear and a positive attitude. Detailed itineraries and packing lists will be
              provided to all registered participants closer to the event date.
            </p>
          </div>

          <div className="flex justify-end gap-4">
            <Link to="/#events" className="px-6 py-3 font-semibold text-slate-500 hover:text-[#1B4332] transition-colors">
              Back to Events
            </Link>
            <button className="px-8 py-3 rounded-full bg-adventure-orange text-white font-semibold hover:bg-orange-600 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
              Register Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
