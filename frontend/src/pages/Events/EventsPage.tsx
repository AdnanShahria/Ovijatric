import { Link } from 'react-router-dom';

// Mock data for events
export const upcomingEvents = [
  {
    id: 1,
    title: "Mount Keokradong Expedition",
    date: "August 15, 2026",
    location: "Bandarban",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop",
    category: "Trekking",
    spots: 20,
    spotsLeft: 5
  },
  {
    id: 2,
    title: "Sylhet Half Marathon",
    date: "September 05, 2026",
    location: "Sylhet",
    image: "https://images.unsplash.com/photo-1552674605-15c2145efa38?q=80&w=800&auto=format&fit=crop",
    category: "Running",
    spots: 200,
    spotsLeft: 45
  },
  {
    id: 3,
    title: "Sajek Valley Camping",
    date: "October 12, 2026",
    location: "Khagrachari",
    image: "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?q=80&w=800&auto=format&fit=crop",
    category: "Camping",
    spots: 30,
    spotsLeft: 12
  }
];

export const EventsPage = () => {
  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-extrabold text-[#1B4332] font-garamond mb-8 text-center">Upcoming <span className="text-adventure-orange">Events</span></h1>
        <p className="text-center text-slate-600 max-w-2xl mx-auto mb-16 text-lg">Join us in our next adventure. Whether you are looking to conquer the highest peaks or run your first marathon, we have something for you.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {upcomingEvents.map((event) => (
            <div key={event.id} className="bg-white rounded-2xl overflow-hidden shadow-lg border border-[#1B4332]/10 group hover:-translate-y-2 hover:shadow-2xl transition-all duration-300">
              <div className="relative h-48 overflow-hidden">
                <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-adventure-orange">
                  {event.category}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-[#1B4332] font-garamond mb-2">{event.title}</h3>
                <div className="flex flex-col gap-2 text-sm text-slate-600 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 text-adventure-orange">📅</span> {event.date}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 text-adventure-orange">📍</span> {event.location}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">{event.spotsLeft} spots left</span>
                  <Link to={`/events/${event.id}`} className="px-4 py-2 bg-adventure-orange/10 text-adventure-orange font-semibold rounded-lg hover:bg-adventure-orange hover:text-white transition-colors">
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
