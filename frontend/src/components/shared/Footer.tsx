import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail, MapPin, Phone } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="pt-16 pb-8 border-t border-[#1B4332]/10 relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title Header with horizontal lines */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <div className="h-px bg-[#1B4332]/20 flex-1"></div>
          <h2 className="text-[#1B4332] font-semibold tracking-[0.2em] text-xs sm:text-sm uppercase">Ovijatrik</h2>
          <div className="h-px bg-[#1B4332]/20 flex-1"></div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 mb-8">
          {/* Brand Card - Mobile: full width, Desktop: col-span-5 */}
          <div className="md:col-span-5 border border-[#1B4332]/10 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-sm bg-white/30 backdrop-blur-sm">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img src="/logo.jpg" alt="Ovijatrik Logo" className="w-10 h-10 object-contain rounded-md" />
                <h3 className="text-xl sm:text-2xl font-bold text-[#1B4332] font-garamond">Ovijatrik</h3>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                The official adventure club of Rajshahi University of Engineering & Technology. We bring the best quality of adventures to ensure safety and happiness.
              </p>
            </div>
            <ul className="space-y-3 mt-8">
              <li className="flex items-start gap-3">
                <MapPin className="text-adventure-orange shrink-0 mt-0.5" size={16} />
                <span className="text-slate-600 text-xs sm:text-sm">RUET Campus, Kazla, Rajshahi-6204</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="text-adventure-orange shrink-0" size={16} />
                <span className="text-slate-600 text-xs sm:text-sm">+880 1234-567890</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="text-adventure-orange shrink-0" size={16} />
                <span className="text-slate-600 text-xs sm:text-sm">contact@ovijatrik.ruet.ac.bd</span>
              </li>
            </ul>
          </div>

          {/* Quick Links and Categories wrapper for mobile 2-column */}
          <div className="md:col-span-4 grid grid-cols-2 gap-4 sm:gap-6">
            {/* Quick Links */}
            <div className="border border-[#1B4332]/10 rounded-2xl p-5 sm:p-6 flex flex-col shadow-sm bg-white/30 backdrop-blur-sm">
              <h4 className="text-[#1B4332] font-bold text-xs sm:text-sm tracking-widest uppercase mb-6 relative">
                Quick Links
                <span className="absolute -bottom-2 left-0 w-8 h-px bg-[#1B4332]/20"></span>
              </h4>
              <ul className="space-y-4 mt-2 flex-1">
                <li><Link to="/about" className="text-slate-600 hover:text-adventure-orange transition-colors text-xs sm:text-sm">About Us</Link></li>
                <li><a href="#" className="text-slate-600 hover:text-adventure-orange transition-colors text-xs sm:text-sm">Contact Us</a></li>
                <li><a href="#" className="text-slate-600 hover:text-adventure-orange transition-colors text-xs sm:text-sm">FAQ</a></li>
                <li><Link to="/#events" className="text-slate-600 hover:text-adventure-orange transition-colors text-xs sm:text-sm">Upcoming Events</Link></li>
              </ul>
            </div>

            {/* Social Connect (Categories in screenshot) */}
            <div className="border border-[#1B4332]/10 rounded-2xl p-5 sm:p-6 flex flex-col shadow-sm bg-white/30 backdrop-blur-sm">
              <h4 className="text-[#1B4332] font-bold text-xs sm:text-sm tracking-widest uppercase mb-6 relative">
                Social Connect
                <span className="absolute -bottom-2 left-0 w-8 h-px bg-[#1B4332]/20"></span>
              </h4>
              <ul className="space-y-4 mt-2 flex-1">
                <li><a href="#" className="text-slate-600 hover:text-adventure-orange transition-colors text-xs sm:text-sm flex items-center gap-2"><Facebook size={14}/> Facebook</a></li>
                <li><a href="#" className="text-slate-600 hover:text-adventure-orange transition-colors text-xs sm:text-sm flex items-center gap-2"><Instagram size={14}/> Instagram</a></li>
                <li><a href="#" className="text-slate-600 hover:text-adventure-orange transition-colors text-xs sm:text-sm flex items-center gap-2"><Twitter size={14}/> Twitter</a></li>
              </ul>
              <Link to="/#gallery" className="text-adventure-orange font-bold text-[10px] sm:text-xs mt-6 uppercase tracking-wider hover:text-[#e65a29]">
                VIEW ALL MEMORIES &rarr;
              </Link>
            </div>
          </div>

          {/* Newsletter */}
          <div className="md:col-span-3 border border-[#1B4332]/10 rounded-2xl p-6 sm:p-8 flex flex-col shadow-sm bg-white/30 backdrop-blur-sm">
            <h4 className="text-[#1B4332] font-bold text-xs sm:text-sm tracking-widest uppercase mb-6 relative">
              Newsletter
              <span className="absolute -bottom-2 left-0 w-8 h-px bg-[#1B4332]/20"></span>
            </h4>
            <p className="text-slate-600 text-xs sm:text-sm mb-6 mt-2">Get exclusive updates & expedition news.</p>
            <form className="flex flex-col gap-3 mt-auto" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="your@email.com" 
                className="bg-white border border-[#1B4332]/20 text-[#1B4332] placeholder-slate-400 px-4 py-2.5 rounded-lg focus:outline-none focus:border-adventure-orange focus:ring-1 focus:ring-adventure-orange text-sm w-full transition-all"
                required
              />
              <button 
                type="submit" 
                className="bg-adventure-orange hover:bg-[#e65a29] text-white px-4 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-colors w-full shadow-md shadow-[#FF6B35]/20 flex justify-center items-center"
              >
                SUBSCRIBE &rarr;
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-[#1B4332]/10 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] sm:text-xs text-slate-500">
          <p className="text-center md:text-left">
            &copy; {new Date().getFullYear()} Ovijatrik. Made with <span className="text-red-500">&hearts;</span> in BD
          </p>
          <p className="text-center font-medium">
            Developer Partner - <span className="text-[#bfa15f] font-bold">OrbitSaaS</span>
          </p>
          <div className="flex gap-4">
            <Link to="#" className="hover:text-adventure-orange transition-colors">Privacy</Link>
            <Link to="#" className="hover:text-adventure-orange transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
